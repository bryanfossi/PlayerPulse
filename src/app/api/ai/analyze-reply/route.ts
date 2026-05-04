import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { buildAnalyzeReplyPrompt } from '@/lib/prompts/analyze-reply'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSportOrDefault } from '@/lib/sports'
import { TOKEN_COSTS } from '@/lib/tokens/costs'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']
type PSRow = Database['public']['Tables']['player_schools']['Row']
type SchoolRow = Database['public']['Tables']['schools']['Row']

export const maxDuration = 30

export interface AnalysisResult {
  interest_level: 'High' | 'Medium' | 'Low' | 'Unclear'
  interest_explanation: string
  tone_label: string
  tone_explanation: string
  key_signals: string[]
  next_step: string
  next_step_urgency: 'High' | 'Medium' | 'Low'
}

const VALID_DIVISIONS = new Set(['D1', 'D2', 'D3', 'NAIA', 'JUCO'])

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: {
      player_school_id?: string
      school_name?: string
      verified_division?: string | null
      save_to_list?: boolean
      coach_message: string
    } = await request.json()

    if (!body.coach_message?.trim()) {
      return NextResponse.json({ error: 'coach_message is required' }, { status: 400 })
    }
    if (!body.player_school_id && !body.school_name?.trim()) {
      return NextResponse.json(
        { error: 'Either player_school_id or school_name is required' },
        { status: 400 },
      )
    }
    if (
      body.verified_division &&
      !VALID_DIVISIONS.has(body.verified_division)
    ) {
      return NextResponse.json({ error: 'Invalid division' }, { status: 400 })
    }

    const rl = checkRateLimit(`analyze-reply:${user.id}`, { limit: 30, windowSec: 3600 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` },
        { status: 429 },
      )
    }

    const service = createServiceClient()

    // ── Resolve player ────────────────────────────────────────
    const { data: playerRaw } = await service
      .from('players')
      .select('id, first_name, last_name, grad_year, primary_position, highest_club_level, sport_id')
      .eq('user_id', user.id)
      .maybeSingle()
    const player = playerRaw as (Pick<PlayerRow,
      'id' | 'first_name' | 'last_name' | 'grad_year' | 'primary_position' | 'highest_club_level'
    > & { sport_id?: string }) | null
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const sport = getSportOrDefault(player.sport_id)

    // ── Resolve school context (existing OR new) ──────────────
    let schoolName: string
    let verifiedDivision: string | null = null
    let tier: string | null = null
    let overallScore: number | null = null
    let createdPlayerSchoolId: string | null = null

    if (body.player_school_id) {
      // Existing-school path
      const { data: psRaw } = await service
        .from('player_schools')
        .select('id, tier, overall_score, school:schools(name, verified_division)')
        .eq('id', body.player_school_id)
        .eq('player_id', player.id)
        .maybeSingle()

      type PSWithSchool = Pick<PSRow, 'id' | 'tier' | 'overall_score'> & {
        school: Pick<SchoolRow, 'name' | 'verified_division'>
      }
      const ps = psRaw as unknown as PSWithSchool | null
      if (!ps) return NextResponse.json({ error: 'School not found on your list' }, { status: 404 })

      schoolName = ps.school.name
      verifiedDivision = ps.school.verified_division
      tier = ps.tier
      overallScore = ps.overall_score
    } else {
      // Ad-hoc school path — optionally persist
      schoolName = body.school_name!.trim()
      verifiedDivision = body.verified_division ?? null

      if (body.save_to_list) {
        // Upsert school by name
        const { data: school, error: schoolErr } = await service
          .from('schools')
          .upsert(
            {
              name: schoolName,
              verified_division: verifiedDivision as SchoolRow['verified_division'],
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'name', ignoreDuplicates: false },
          )
          .select('id, name, verified_division')
          .single()

        if (schoolErr || !school) {
          console.error('[analyze-reply] school upsert failed:', schoolErr)
          return NextResponse.json({ error: 'Could not create school' }, { status: 500 })
        }

        // Avoid duplicate player_school row
        const { data: existing } = await service
          .from('player_schools')
          .select('id, tier, overall_score')
          .eq('player_id', player.id)
          .eq('school_id', school.id)
          .maybeSingle()

        if (existing) {
          createdPlayerSchoolId = (existing as Pick<PSRow, 'id' | 'tier' | 'overall_score'>).id
          tier = (existing as Pick<PSRow, 'id' | 'tier' | 'overall_score'>).tier
          overallScore = (existing as Pick<PSRow, 'id' | 'tier' | 'overall_score'>).overall_score
        } else {
          // Get next rank_order
          const { data: maxRow } = await service
            .from('player_schools')
            .select('rank_order')
            .eq('player_id', player.id)
            .order('rank_order', { ascending: false })
            .limit(1)
            .maybeSingle()
          const nextRank = ((maxRow as Pick<PSRow, 'rank_order'> | null)?.rank_order ?? 0) + 1

          const { data: ps, error: psErr } = await service
            .from('player_schools')
            .insert({
              player_id: player.id,
              school_id: school.id,
              rank_order: nextRank,
              status: 'contacted', // they just got an email — already in contact
              source: 'manual',
            })
            .select('id')
            .single()

          if (psErr || !ps) {
            console.error('[analyze-reply] player_school insert failed:', psErr)
            return NextResponse.json({ error: 'Could not save school to list' }, { status: 500 })
          }
          createdPlayerSchoolId = (ps as Pick<PSRow, 'id'>).id
        }

        verifiedDivision = (school as Pick<SchoolRow, 'name' | 'verified_division'>).verified_division
      }
    }

    // ── Token gate: deduct BEFORE Claude call ────────────────
    const { data: ok, error: tokenErr } = await service.rpc('consume_tokens', {
      p_user_id: user.id,
      p_amount: TOKEN_COSTS.AI_QUERY,
    })
    if (tokenErr || !ok) {
      return NextResponse.json(
        {
          error: 'NO_TOKENS',
          message: `Coach email analysis costs ${TOKEN_COSTS.AI_QUERY} token. You're out — purchase a token pack to continue.`,
        },
        { status: 402 },
      )
    }

    // ── Run the analysis ──────────────────────────────────────
    const prompt = buildAnalyzeReplyPrompt({
      first_name: player.first_name,
      last_name: player.last_name,
      primary_position: player.primary_position,
      grad_year: player.grad_year,
      highest_club_level: player.highest_club_level,
      school_name: schoolName,
      verified_division: verifiedDivision,
      tier,
      overall_score: overallScore,
      coach_message: body.coach_message.trim().replace(/"""/g, '"'),
      sport,
    })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: `You are an expert college ${sport.name} recruiting advisor helping a high school player interpret a message from a college coach. Analyze the coach's message and return JSON only — no prose outside the JSON object.`,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    let result: AnalysisResult
    try {
      result = JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]+\}/)
      if (!match) {
        await service.rpc('refund_tokens', { p_user_id: user.id, p_amount: TOKEN_COSTS.AI_QUERY })
        return NextResponse.json({ error: 'Failed to parse AI response. Your token has been refunded.' }, { status: 500 })
      }
      try {
        result = JSON.parse(match[0])
      } catch {
        await service.rpc('refund_tokens', { p_user_id: user.id, p_amount: TOKEN_COSTS.AI_QUERY })
        return NextResponse.json({ error: 'Failed to parse AI response. Your token has been refunded.' }, { status: 500 })
      }
    }

    return NextResponse.json({
      ...result,
      created_player_school_id: createdPlayerSchoolId,
    })
  } catch (err) {
    console.error('[analyze-reply] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
