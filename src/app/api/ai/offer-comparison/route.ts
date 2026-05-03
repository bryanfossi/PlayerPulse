import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { getSportOrDefault } from '@/lib/sports'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']
type PSRow = Database['public']['Tables']['player_schools']['Row']
type SchoolRow = Database['public']['Tables']['schools']['Row']

export const maxDuration = 30

export interface OfferComparisonSchool {
  school_name: string
  division: string
  academic_grade: 'A' | 'B' | 'C' | 'D'
  financial_grade: 'A' | 'B' | 'C' | 'D'
  playing_opportunity_grade: 'A' | 'B' | 'C' | 'D'
  overall_fit_grade: 'A' | 'B' | 'C' | 'D'
  best_case: string
  risk: string
  recommendation: string
}

export interface OfferComparisonResponse {
  schools: OfferComparisonSchool[]
  summary: string
  suggested_decision_framework: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { school_ids }: { school_ids: string[] } = await request.json()
    if (!school_ids?.length || school_ids.length < 2 || school_ids.length > 4) {
      return NextResponse.json({ error: 'Provide 2-4 school IDs' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: playerRaw } = await service
      .from('players')
      .select('id, first_name, grad_year, primary_position, unweighted_gpa, target_levels, tuition_importance, annual_tuition_budget, home_state, sport_id')
      .eq('user_id', user.id)
      .maybeSingle()
    const player = playerRaw as Pick<PlayerRow,
      'id' | 'first_name' | 'grad_year' | 'primary_position' | 'unweighted_gpa' | 'target_levels' | 'tuition_importance' | 'annual_tuition_budget' | 'home_state'
    > & { sport_id?: string } | null
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const sport = getSportOrDefault(player.sport_id)

    // Fetch player_schools + schools for each requested school_id
    const { data: psData } = await service
      .from('player_schools')
      .select('*, school:schools(*)')
      .eq('player_id', player.id)
      .in('school_id', school_ids)

    type PSWithSchool = PSRow & { school: SchoolRow }
    const records = (psData ?? []) as unknown as PSWithSchool[]

    if (records.length === 0) {
      return NextResponse.json({ error: 'No matching schools found on your list' }, { status: 404 })
    }

    const schoolsText = records.map((ps) => {
      const s = ps.school
      return `
School: ${s.name}
Division: ${s.verified_division ?? 'unknown'} | Conference: ${s.conference ?? 'unknown'}
Location: ${s.city ?? ''}, ${s.state ?? ''} | Campus: ${s.campus_type ?? 'unknown'}
Tuition: In-state $${s.in_state_tuition ?? '?'} / Out-of-state $${s.out_state_tuition ?? '?'}
Prestige: ${s.prestige ?? 'unknown'} | Avg GPA: ${s.avg_gpa ?? 'unknown'} | Acceptance: ${s.acceptance_rate ? `${s.acceptance_rate}%` : 'unknown'}
Scores: Overall ${ps.overall_score} | PT Score ${ps.pt_score} | Merit Score ${ps.merit_value_score}
Playing opportunity: ${ps.first_year_opportunity ?? 'unknown'} | Merit potential: ${ps.merit_aid_potential ?? 'unknown'}
PT note: ${ps.pt_note ?? 'none'} | Academic note: ${ps.acad_note ?? 'none'}
Tier: ${ps.tier ?? 'unknown'}`
    }).join('\n---')

    const prompt = `Compare these ${records.length} schools side-by-side for this player. Be direct and honest. Specify division level precisely — never lump them together.

PLAYER
Name: ${player.first_name} | Grad: ${player.grad_year} | Position: ${player.primary_position}
GPA: ${player.unweighted_gpa ?? 'N/A'} | Home state: ${player.home_state}
Target levels: ${player.target_levels?.join(', ') ?? 'not set'}
Tuition importance: ${player.tuition_importance} | Budget: ${player.annual_tuition_budget ?? 'not set'}

SCHOOLS TO COMPARE
${schoolsText}

Return ONLY valid JSON:
{
  "schools": [
    {
      "school_name": "string",
      "division": "D1|D2|D3|NAIA|JUCO",
      "academic_grade": "A|B|C|D",
      "financial_grade": "A|B|C|D",
      "playing_opportunity_grade": "A|B|C|D",
      "overall_fit_grade": "A|B|C|D",
      "best_case": "one sentence",
      "risk": "one sentence",
      "recommendation": "string"
    }
  ],
  "summary": "2-3 sentence honest summary of the comparison",
  "suggested_decision_framework": "one paragraph on how to think through this decision"
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      temperature: 0.3,
      system: `You are a college ${sport.name.toLowerCase()} recruiting expert. Return only valid JSON. No prose outside the JSON.`,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    let comparison: OfferComparisonResponse
    try {
      const match = raw.match(/\{[\s\S]+\}/)
      comparison = JSON.parse(match ? match[0] : raw)
    } catch {
      return NextResponse.json({ error: 'AI_PARSE_ERROR' }, { status: 500 })
    }

    return NextResponse.json({ comparison })
  } catch (err) {
    console.error('[offer-comparison] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
