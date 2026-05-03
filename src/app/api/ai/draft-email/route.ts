import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { buildDraftEmailPrompt } from '@/lib/prompts/draft-email'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSportOrDefault } from '@/lib/sports'
import { TOKEN_COSTS } from '@/lib/tokens/costs'
import type { EmailDraftType } from '@/types/app'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']
type SchoolRow = Database['public']['Tables']['schools']['Row']

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: {
      player_school_id: string
      draft_type: EmailDraftType
      coach_name?: string
      coach_email?: string
      personal_note?: string
    } = await request.json()

    if (!body.player_school_id || !body.draft_type) {
      return NextResponse.json({ error: 'player_school_id and draft_type are required' }, { status: 400 })
    }

    const rl = checkRateLimit(`draft-email:${user.id}`, { limit: 20, windowSec: 3600 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` },
        { status: 429 },
      )
    }

    const service = createServiceClient()

    // Fetch player record
    const { data: playerRaw } = await service
      .from('players')
      .select('id, first_name, last_name, grad_year, gender, primary_position, secondary_position, club_team, highest_club_level, high_school, home_city, home_state, unweighted_gpa, sat_score, act_score, highlight_url, sport_id')
      .eq('user_id', user.id)
      .maybeSingle()
    const player = playerRaw as (Pick<PlayerRow,
      'id' | 'first_name' | 'last_name' | 'grad_year' | 'gender' | 'primary_position' | 'secondary_position' | 'club_team' | 'highest_club_level' | 'high_school' | 'home_city' | 'home_state' | 'unweighted_gpa' | 'sat_score' | 'act_score' | 'highlight_url'
    > & { sport_id?: string }) | null
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    // Token gate: every email draft costs EMAIL_DRAFT tokens.
    // Atomic deduction (allowance first, then pack) BEFORE calling Claude.
    const { data: ok, error: tokenErr } = await service.rpc('consume_tokens', {
      p_user_id: user.id,
      p_amount: TOKEN_COSTS.EMAIL_DRAFT,
    })

    if (tokenErr || !ok) {
      return NextResponse.json(
        {
          error: 'NO_TOKENS',
          message: `Each email draft costs ${TOKEN_COSTS.EMAIL_DRAFT} token. You're out — purchase a token pack to continue.`,
        },
        { status: 402 },
      )
    }

    // Fetch player_school + school (verify ownership)
    const { data: psRaw } = await service
      .from('player_schools')
      .select('school_id, player_id')
      .eq('id', body.player_school_id)
      .eq('player_id', player.id)
      .maybeSingle()
    if (!psRaw) return NextResponse.json({ error: 'School not found on your list' }, { status: 404 })

    const { data: schoolRaw } = await service
      .from('schools')
      .select('id, name, verified_division, city, state, conference')
      .eq('id', (psRaw as { school_id: string }).school_id)
      .maybeSingle()
    const school = schoolRaw as Pick<SchoolRow, 'id' | 'name' | 'verified_division' | 'city' | 'state' | 'conference'> | null
    if (!school) return NextResponse.json({ error: 'School record not found' }, { status: 404 })

    // Build prompt and call Sonnet
    const sport = getSportOrDefault(player.sport_id)
    const prompt = buildDraftEmailPrompt({
      player,
      school,
      draftType: body.draft_type,
      sport,
      coachName: body.coach_name,
      coachEmail: body.coach_email,
      personalNote: body.personal_note,
    })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are an expert college ${sport.name} recruiting email writer. Output only valid JSON — no markdown, no prose outside the JSON.`,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    let subject: string
    let emailBody: string

    try {
      const parsed = JSON.parse(raw)
      subject = parsed.subject ?? ''
      emailBody = parsed.body ?? ''
    } catch {
      // Fallback: try to extract from raw text
      const subjectMatch = raw.match(/"subject"\s*:\s*"([^"]+)"/)
      const bodyMatch = raw.match(/"body"\s*:\s*"([\s\S]+?)"\s*\}/)
      subject = subjectMatch?.[1] ?? 'Recruiting Inquiry'
      emailBody = bodyMatch?.[1]?.replace(/\\n/g, '\n') ?? raw
    }

    if (!emailBody) {
      // Refund the token — Claude failed, not the user
      await service.rpc('refund_tokens', {
        p_user_id: user.id,
        p_amount: TOKEN_COSTS.EMAIL_DRAFT,
      })
      return NextResponse.json(
        { error: 'Failed to generate email. Your token has been refunded — please try again.' },
        { status: 500 },
      )
    }

    // Save draft to ai_drafts
    const { data: draft, error: draftErr } = await service
      .from('ai_drafts')
      .insert({
        player_id: player.id,
        school_id: school.id,
        draft_type: body.draft_type,
        subject,
        body: emailBody,
        used: false,
      })
      .select('id')
      .single()

    if (draftErr) {
      console.error('[draft-email] failed to save draft:', draftErr)
    }

    return NextResponse.json({
      draft_id: draft?.id ?? null,
      subject,
      body: emailBody,
    })
  } catch (err) {
    console.error('[draft-email] unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
