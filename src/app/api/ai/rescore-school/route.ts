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

// Score caps must match the match-engine prompt rubric (src/lib/prompts/match-engine.ts).
// The ScoreBreakdown UI displays scores against these caps.
const SCORE_CAPS = {
  geo_score: 15,
  acad_score: 20,
  level_score: 25,
  need_score: 25,
  pt_score: 15,
  tuition_score: 15,
  merit_value_score: 10,
  overall_score: 100,
} as const

interface RescoreResponse {
  // Fit scores (player_schools)
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
  // School metadata (schools) — best-effort fill from Claude's knowledge
  verified_division?: string | null
  conference?: string | null
  city?: string | null
  state?: string | null
  campus_type?: string | null
  enrollment?: number | null
  avg_gpa?: number | null
  acceptance_rate?: number | null
  in_state_tuition?: number | null
  out_state_tuition?: number | null
  has_scholarship?: boolean | null
  prestige?: string | null
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

    const prompt = `Re-evaluate this specific school for this player using the Match Engine scoring rubric. Also fill in any missing school metadata from your general knowledge of this institution. Return a JSON object only — no prose.

PLAYER
Name: ${player.first_name} ${player.last_name}
Grad year: ${player.grad_year} | Gender: ${player.gender}
Sport: ${sport.name}
Position: ${player.primary_position}${player.secondary_position ? ` / ${player.secondary_position}` : ''}
${player.height_inches ? `Height: ${Math.floor(player.height_inches / 12)}'${player.height_inches % 12}"` : ''}
Club: ${player.club_team} (${player.highest_club_level})
Home: ${player.home_city}, ${player.home_state}
GPA: ${player.unweighted_gpa ?? 'N/A'} | SAT: ${player.sat_score ?? 'N/A'} | ACT: ${player.act_score ?? 'N/A'}
Target divisions: ${player.target_levels?.join(', ') ?? 'D1, D2, D3, NAIA, JUCO'}
Tuition importance: ${player.tuition_importance}
Budget: ${player.annual_tuition_budget ?? 'not specified'}
Radius: ${player.recruiting_radius_mi ?? 'no limit'} miles

SCHOOL
Name: ${school.name}
Division: ${school.verified_division ?? '(unknown — fill in)'}
Conference: ${school.conference ?? '(unknown — fill in)'}
Location: ${school.city ?? ''}${school.city && school.state ? ', ' : ''}${school.state ?? ''}
Campus: ${school.campus_type ?? '(unknown — fill in)'} | Prestige: ${school.prestige ?? '(unknown — fill in)'}
In-state tuition: ${school.in_state_tuition != null ? `$${school.in_state_tuition}` : '(unknown — fill in)'}
Out-of-state tuition: ${school.out_state_tuition != null ? `$${school.out_state_tuition}` : '(unknown — fill in)'}
Enrollment: ${school.enrollment ?? '(unknown — fill in)'}
Avg GPA: ${school.avg_gpa ?? '(unknown — fill in)'}
Acceptance rate: ${school.acceptance_rate ?? '(unknown — fill in)'}

SCORING RUBRIC (caps in parens — DO NOT exceed)
- geo_score (0–15): Distance vs. recruiting radius
- acad_score (0–20): GPA fit vs. school's avg GPA
- level_score (0–25): Player level band × roster level band
- need_score (0–25): Position-specific roster depth
- pt_score (0–15): First-year playing time outlook
- tuition_score (0–15): Affordability vs. budget (0 if tuition not a factor)
- merit_value_score (0–10): Merit aid potential weight
- overall_score (0–100): SUM of the above (cap at 100)

Return ONLY valid JSON with exactly these fields:
{
  "overall_score": <0-100>,
  "geo_score": <0-15>,
  "acad_score": <0-20>,
  "level_score": <0-25>,
  "need_score": <0-25>,
  "pt_score": <0-15>,
  "tuition_score": <0-15>,
  "merit_value_score": <0-10>,
  "tier": "Lock" | "Realistic" | "Reach",
  "first_year_opportunity": "Likely" | "Possible" | "Developmental" | "Unlikely",
  "merit_aid_potential": "High" | "Medium" | "Low" | "Unknown",
  "acad_note": "<≤ 6 word academic fit note>",
  "level_note": "<≤ 6 word level fit note>",
  "pt_note": "<≤ 6 word playing time note>",
  "verified_division": "D1" | "D2" | "D3" | "NAIA" | "JUCO" | null,
  "conference": "<conference name>" | null,
  "city": "<city>" | null,
  "state": "<2-letter state code>" | null,
  "campus_type": "Urban" | "Suburban" | "Rural" | null,
  "enrollment": <integer> | null,
  "avg_gpa": <decimal 0.0-4.0> | null,
  "acceptance_rate": <decimal 0.0-1.0> | null,
  "in_state_tuition": <integer USD> | null,
  "out_state_tuition": <integer USD> | null,
  "has_scholarship": <boolean> | null,
  "prestige": "Low" | "Mid" | "High" | null
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      temperature: 0,
      system: `You are an expert college ${sport.name.toLowerCase()} recruiting coordinator. Return only valid JSON matching the exact schema requested. No prose, no markdown.`,
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
      await service.rpc('refund_tokens', {
        p_user_id: user.id,
        p_amount: TOKEN_COSTS.SCHOOL_FIT_ASSESSMENT,
      })
      return NextResponse.json({ error: 'AI_PARSE_ERROR' }, { status: 500 })
    }

    // Validate and clamp all fields before writing — Claude output is untrusted.
    // Enum values MUST match the DB CHECK constraints in 001_initial_schema.sql.
    const VALID_TIERS = new Set(['Lock', 'Realistic', 'Reach'])
    const VALID_FYO = new Set(['Likely', 'Possible', 'Developmental', 'Unlikely'])
    const VALID_MERIT = new Set(['High', 'Medium', 'Low', 'Unknown'])
    const VALID_DIVISIONS = new Set(['D1', 'D2', 'D3', 'NAIA', 'JUCO'])
    const VALID_CAMPUS = new Set(['Urban', 'Suburban', 'Rural'])
    const VALID_PRESTIGE = new Set(['Low', 'Mid', 'High'])

    function clampScore(val: unknown, max: number, label: string): number {
      const n = typeof val === 'number' ? val : parseInt(String(val), 10)
      if (isNaN(n)) throw new Error(`${label} is not a number: ${val}`)
      // Allow 50% overage before erroring (Claude is sometimes loose), then clamp
      if (n < 0 || n > max * 1.5) throw new Error(`${label} out of range: ${n} (max ${max})`)
      return Math.min(Math.max(Math.round(n), 0), max)
    }

    function requireValid(val: unknown, valid: Set<string>, label: string): string {
      if (typeof val !== 'string' || !valid.has(val)) {
        throw new Error(`${label} invalid: "${val}"`)
      }
      return val
    }

    function optionalEnum(val: unknown, valid: Set<string>): string | null {
      if (typeof val !== 'string') return null
      return valid.has(val) ? val : null
    }

    function optionalInt(val: unknown): number | null {
      if (val == null) return null
      const n = typeof val === 'number' ? val : parseInt(String(val), 10)
      return isNaN(n) ? null : Math.round(n)
    }

    function optionalNumber(val: unknown, min: number, max: number): number | null {
      if (val == null) return null
      const n = typeof val === 'number' ? val : parseFloat(String(val))
      if (isNaN(n) || n < min || n > max) return null
      return n
    }

    let validatedFit: Pick<RescoreResponse,
      'overall_score' | 'geo_score' | 'acad_score' | 'level_score' | 'need_score' |
      'pt_score' | 'tuition_score' | 'merit_value_score' | 'tier' |
      'first_year_opportunity' | 'merit_aid_potential' | 'acad_note' | 'level_note' | 'pt_note'
    >
    try {
      validatedFit = {
        overall_score: clampScore(scores.overall_score, SCORE_CAPS.overall_score, 'overall_score'),
        geo_score: clampScore(scores.geo_score, SCORE_CAPS.geo_score, 'geo_score'),
        acad_score: clampScore(scores.acad_score, SCORE_CAPS.acad_score, 'acad_score'),
        level_score: clampScore(scores.level_score, SCORE_CAPS.level_score, 'level_score'),
        need_score: clampScore(scores.need_score, SCORE_CAPS.need_score, 'need_score'),
        pt_score: clampScore(scores.pt_score, SCORE_CAPS.pt_score, 'pt_score'),
        tuition_score: clampScore(scores.tuition_score, SCORE_CAPS.tuition_score, 'tuition_score'),
        merit_value_score: clampScore(scores.merit_value_score, SCORE_CAPS.merit_value_score, 'merit_value_score'),
        tier: requireValid(scores.tier, VALID_TIERS, 'tier'),
        first_year_opportunity: requireValid(scores.first_year_opportunity, VALID_FYO, 'first_year_opportunity'),
        merit_aid_potential: requireValid(scores.merit_aid_potential, VALID_MERIT, 'merit_aid_potential'),
        acad_note: typeof scores.acad_note === 'string' ? scores.acad_note.slice(0, 200) : '',
        level_note: typeof scores.level_note === 'string' ? scores.level_note.slice(0, 200) : '',
        pt_note: typeof scores.pt_note === 'string' ? scores.pt_note.slice(0, 200) : '',
      }
    } catch (validationErr) {
      console.error('[rescore-school] validation failed:', validationErr)
      await service.rpc('refund_tokens', {
        p_user_id: user.id,
        p_amount: TOKEN_COSTS.SCHOOL_FIT_ASSESSMENT,
      })
      return NextResponse.json({ error: 'AI_PARSE_ERROR' }, { status: 500 })
    }

    // Build school metadata patch — only include values that are MISSING in the
    // current row, so we don't overwrite existing curated data with AI guesses.
    const schoolPatch: Partial<SchoolRow> = {}
    if (school.verified_division == null) {
      const v = optionalEnum(scores.verified_division, VALID_DIVISIONS)
      if (v) schoolPatch.verified_division = v as SchoolRow['verified_division']
    }
    if (school.conference == null && typeof scores.conference === 'string' && scores.conference.trim()) {
      schoolPatch.conference = scores.conference.trim().slice(0, 200)
    }
    if (school.city == null && typeof scores.city === 'string' && scores.city.trim()) {
      schoolPatch.city = scores.city.trim().slice(0, 100)
    }
    if (school.state == null && typeof scores.state === 'string' && /^[A-Z]{2}$/.test(scores.state)) {
      schoolPatch.state = scores.state
    }
    if (school.campus_type == null) {
      const v = optionalEnum(scores.campus_type, VALID_CAMPUS)
      if (v) schoolPatch.campus_type = v as SchoolRow['campus_type']
    }
    if (school.enrollment == null) {
      const v = optionalInt(scores.enrollment)
      if (v && v > 0 && v < 200000) schoolPatch.enrollment = v
    }
    if (school.avg_gpa == null) {
      const v = optionalNumber(scores.avg_gpa, 0, 4.0)
      if (v != null) schoolPatch.avg_gpa = v
    }
    if (school.acceptance_rate == null) {
      const v = optionalNumber(scores.acceptance_rate, 0, 1)
      if (v != null) schoolPatch.acceptance_rate = v
    }
    if (school.in_state_tuition == null) {
      const v = optionalInt(scores.in_state_tuition)
      if (v && v > 0 && v < 200000) schoolPatch.in_state_tuition = v
    }
    if (school.out_state_tuition == null) {
      const v = optionalInt(scores.out_state_tuition)
      if (v && v > 0 && v < 200000) schoolPatch.out_state_tuition = v
    }
    if (school.prestige == null) {
      const v = optionalEnum(scores.prestige, VALID_PRESTIGE)
      if (v) schoolPatch.prestige = v as SchoolRow['prestige']
    }
    if (typeof scores.has_scholarship === 'boolean' && school.has_scholarship == null) {
      schoolPatch.has_scholarship = scores.has_scholarship
    }

    if (Object.keys(schoolPatch).length > 0) {
      schoolPatch.updated_at = new Date().toISOString()
      const { error: schoolUpdateErr } = await service
        .from('schools')
        .update(schoolPatch)
        .eq('id', school.id)
      if (schoolUpdateErr) {
        // Don't fail the whole request — fit scores are the priority.
        // Log and continue.
        console.error('[rescore-school] school metadata update failed (non-fatal):', schoolUpdateErr)
      }
    }

    // Write validated fit scores back to player_schools
    const { error: updateErr } = await service
      .from('player_schools')
      .update({
        overall_score: validatedFit.overall_score,
        geo_score: validatedFit.geo_score,
        acad_score: validatedFit.acad_score,
        level_score: validatedFit.level_score,
        need_score: validatedFit.need_score,
        pt_score: validatedFit.pt_score,
        tuition_score: validatedFit.tuition_score,
        merit_value_score: validatedFit.merit_value_score,
        tier: validatedFit.tier as PSRow['tier'],
        first_year_opportunity: validatedFit.first_year_opportunity as PSRow['first_year_opportunity'],
        merit_aid_potential: validatedFit.merit_aid_potential as PSRow['merit_aid_potential'],
        acad_note: validatedFit.acad_note,
        level_note: validatedFit.level_note,
        pt_note: validatedFit.pt_note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ps.id)

    if (updateErr) {
      console.error('[rescore-school] DB update failed:', updateErr)
      await service.rpc('refund_tokens', {
        p_user_id: user.id,
        p_amount: TOKEN_COSTS.SCHOOL_FIT_ASSESSMENT,
      })
      return NextResponse.json({ error: 'DB_UPDATE_FAILED', message: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ updated: true, scores: validatedFit })
  } catch (err) {
    console.error('[rescore-school] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
