import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { getSportOrDefault } from '@/lib/sports'
import { TOKEN_COSTS } from '@/lib/tokens/costs'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']
type PSRow = Database['public']['Tables']['player_schools']['Row']
type SchoolRow = Database['public']['Tables']['schools']['Row']

export const maxDuration = 30

interface RescoreResponse {
  overall_score: number
  geo_score: number
  acad_score: number
  level_score: number
  need_score: number
  pt_score: number
  tuition_score: number
  merit_value_score: number
  tier: string
  first_year_opportunity: string
  merit_aid_potential: string
  acad_note: string
  level_note: string
  pt_note: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { school_id }: { school_id: string } = await request.json()
    if (!school_id) return NextResponse.json({ error: 'school_id is required' }, { status: 400 })

    const service = createServiceClient()

    const [playerResult, schoolResult] = await Promise.all([
      service.from('players').select('*').eq('user_id', user.id).maybeSingle(),
      service.from('schools').select('*').eq('id', school_id).maybeSingle(),
    ])

    const player = playerResult.data as PlayerRow | null
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const sport = getSportOrDefault((player as PlayerRow & { sport_id?: string }).sport_id)

    const school = schoolResult.data as SchoolRow | null
    if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

    const { data: psRaw } = await service
      .from('player_schools')
      .select('*')
      .eq('player_id', player.id)
      .eq('school_id', school_id)
      .maybeSingle()
    const ps = psRaw as PSRow | null
    if (!ps) return NextResponse.json({ error: 'School not on your list' }, { status: 404 })

    // Token gate: fit assessment costs SCHOOL_FIT_ASSESSMENT tokens.
    // Atomic deduction (allowance first, then pack) BEFORE calling Claude.
    const { data: ok, error: tokenErr } = await service.rpc('consume_tokens', {
      p_user_id: user.id,
      p_amount: TOKEN_COSTS.SCHOOL_FIT_ASSESSMENT,
    })

    if (tokenErr || !ok) {
      return NextResponse.json(
        {
          error: 'NO_TOKENS',
          message: `Generating a fit assessment costs ${TOKEN_COSTS.SCHOOL_FIT_ASSESSMENT} tokens. You don't have enough — purchase a token pack to continue.`,
        },
        { status: 402 },
      )
    }

    const prompt = `Re-evaluate this specific school for this player using the same scoring methodology as the Match Engine. Return a JSON object only.

PLAYER
Name: ${player.first_name} ${player.last_name}
Grad year: ${player.grad_year} | Gender: ${player.gender}
Position: ${player.primary_position}${player.secondary_position ? ` / ${player.secondary_position}` : ''}
Club: ${player.club_team} (${player.highest_club_level})
Home: ${player.home_city}, ${player.home_state}
GPA: ${player.unweighted_gpa ?? 'N/A'} | SAT: ${player.sat_score ?? 'N/A'} | ACT: ${player.act_score ?? 'N/A'}
Target divisions: ${player.target_levels?.join(', ') ?? 'not set'}
Tuition importance: ${player.tuition_importance}
Budget: ${player.annual_tuition_budget ?? 'not specified'}
Radius: ${player.recruiting_radius_mi ?? 'no limit'} miles

SCHOOL
Name: ${school.name}
Division: ${school.verified_division ?? 'unknown'}
Conference: ${school.conference ?? 'unknown'}
Location: ${school.city ?? ''}, ${school.state ?? ''}
Campus: ${school.campus_type ?? 'unknown'} | Prestige: ${school.prestige ?? 'unknown'}
In-state tuition: $${school.in_state_tuition ?? 'unknown'} | Out-of-state: $${school.out_state_tuition ?? 'unknown'}
Has scholarship: ${school.has_scholarship}

CURRENT SCORES (for reference)
Overall: ${ps.overall_score} | Geo: ${ps.geo_score} | Acad: ${ps.acad_score}
Level: ${ps.level_score} | Need: ${ps.need_score} | PT: ${ps.pt_score}
Tier: ${ps.tier}

Return ONLY valid JSON with exactly these fields:
{
  "overall_score": <0-100 integer>,
  "geo_score": <0-100>,
  "acad_score": <0-100>,
  "level_score": <0-100>,
  "need_score": <0-100>,
  "pt_score": <0-100>,
  "tuition_score": <0-100>,
  "merit_value_score": <0-100>,
  "tier": "Lock" | "Realistic" | "Reach",
  "first_year_opportunity": "Starter" | "Likely Starter" | "Mid-Roster" | "Development",
  "merit_aid_potential": "High" | "Medium" | "Low" | "None",
  "acad_note": "<short academic fit note>",
  "level_note": "<short level fit note>",
  "pt_note": "<short playing time note>"
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      temperature: 0,
      system: `You are an expert college ${sport.name.toLowerCase()} recruiting coordinator. Return only valid JSON matching the exact schema requested. No prose.`,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    let scores: RescoreResponse
    try {
      const match = raw.match(/\{[\s\S]+\}/)
      scores = JSON.parse(match ? match[0] : raw)
    } catch {
      // Refund — AI failure, not user's fault
      await service.rpc('refund_tokens', {
        p_user_id: user.id,
        p_amount: TOKEN_COSTS.SCHOOL_FIT_ASSESSMENT,
      })
      return NextResponse.json({ error: 'AI_PARSE_ERROR' }, { status: 500 })
    }

    // Validate and clamp all fields before writing — Claude output is untrusted
    const VALID_TIERS = new Set(['Lock', 'Realistic', 'Reach'])
    const VALID_FYO = new Set(['Starter', 'Likely Starter', 'Mid-Roster', 'Development'])
    const VALID_MERIT = new Set(['High', 'Medium', 'Low', 'None'])

    function clampScore(val: unknown, label: string): number {
      const n = typeof val === 'number' ? val : parseInt(String(val), 10)
      if (isNaN(n)) throw new Error(`${label} is not a number: ${val}`)
      if (n < 0 || n > 120) throw new Error(`${label} out of range: ${n}`)
      return Math.min(Math.max(Math.round(n), 0), 100)
    }

    function requireValid(val: unknown, valid: Set<string>, label: string): string {
      if (typeof val !== 'string' || !valid.has(val)) {
        throw new Error(`${label} invalid: "${val}"`)
      }
      return val
    }

    try {
      scores = {
        overall_score: clampScore(scores.overall_score, 'overall_score'),
        geo_score: clampScore(scores.geo_score, 'geo_score'),
        acad_score: clampScore(scores.acad_score, 'acad_score'),
        level_score: clampScore(scores.level_score, 'level_score'),
        need_score: clampScore(scores.need_score, 'need_score'),
        pt_score: clampScore(scores.pt_score, 'pt_score'),
        tuition_score: clampScore(scores.tuition_score, 'tuition_score'),
        merit_value_score: clampScore(scores.merit_value_score, 'merit_value_score'),
        tier: requireValid(scores.tier, VALID_TIERS, 'tier'),
        first_year_opportunity: requireValid(scores.first_year_opportunity, VALID_FYO, 'first_year_opportunity'),
        merit_aid_potential: requireValid(scores.merit_aid_potential, VALID_MERIT, 'merit_aid_potential'),
        acad_note: typeof scores.acad_note === 'string' ? scores.acad_note.slice(0, 500) : '',
        level_note: typeof scores.level_note === 'string' ? scores.level_note.slice(0, 500) : '',
        pt_note: typeof scores.pt_note === 'string' ? scores.pt_note.slice(0, 500) : '',
      }
    } catch (validationErr) {
      console.error('[rescore-school] validation failed:', validationErr)
      // Refund — AI returned malformed scores, not user's fault
      await service.rpc('refund_tokens', {
        p_user_id: user.id,
        p_amount: TOKEN_COSTS.SCHOOL_FIT_ASSESSMENT,
      })
      return NextResponse.json({ error: 'AI_PARSE_ERROR' }, { status: 500 })
    }

    // Write validated scores back to player_schools
    await service
      .from('player_schools')
      .update({
        overall_score: scores.overall_score,
        geo_score: scores.geo_score,
        acad_score: scores.acad_score,
        level_score: scores.level_score,
        need_score: scores.need_score,
        pt_score: scores.pt_score,
        tuition_score: scores.tuition_score,
        merit_value_score: scores.merit_value_score,
        tier: scores.tier as PSRow['tier'],
        first_year_opportunity: scores.first_year_opportunity as PSRow['first_year_opportunity'],
        merit_aid_potential: scores.merit_aid_potential as PSRow['merit_aid_potential'],
        acad_note: scores.acad_note,
        level_note: scores.level_note,
        pt_note: scores.pt_note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ps.id)

    return NextResponse.json({ updated: true, scores })
  } catch (err) {
    console.error('[rescore-school] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
