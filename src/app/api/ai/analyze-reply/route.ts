import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { buildAnalyzeReplyPrompt } from '@/lib/prompts/analyze-reply'
import { checkRateLimit } from '@/lib/rate-limit'
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

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { player_school_id, coach_message }: {
      player_school_id: string
      coach_message: string
    } = await request.json()

    if (!player_school_id || !coach_message?.trim()) {
      return NextResponse.json({ error: 'player_school_id and coach_message are required' }, { status: 400 })
    }

    const rl = checkRateLimit(`analyze-reply:${user.id}`, { limit: 30, windowSec: 3600 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` },
        { status: 429 },
      )
    }

    const service = createServiceClient()

    const { data: playerRaw } = await service
      .from('players')
      .select('id, first_name, last_name, grad_year, primary_position, highest_club_level')
      .eq('user_id', user.id)
      .maybeSingle()
    const player = playerRaw as Pick<PlayerRow,
      'id' | 'first_name' | 'last_name' | 'grad_year' | 'primary_position' | 'highest_club_level'
    > | null
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const { data: psRaw } = await service
      .from('player_schools')
      .select('id, tier, overall_score, school:schools(name, verified_division)')
      .eq('id', player_school_id)
      .eq('player_id', player.id)
      .maybeSingle()

    type PSWithSchool = Pick<PSRow, 'id' | 'tier' | 'overall_score'> & {
      school: Pick<SchoolRow, 'name' | 'verified_division'>
    }
    const ps = psRaw as unknown as PSWithSchool | null
    if (!ps) return NextResponse.json({ error: 'School not found on your list' }, { status: 404 })

    const prompt = buildAnalyzeReplyPrompt({
      first_name: player.first_name,
      last_name: player.last_name,
      primary_position: player.primary_position,
      grad_year: player.grad_year,
      highest_club_level: player.highest_club_level,
      school_name: ps.school.name,
      verified_division: ps.school.verified_division,
      tier: ps.tier,
      overall_score: ps.overall_score,
      coach_message: coach_message.trim().replace(/"""/g, '"'),
    })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: 'You are an expert college soccer recruiting advisor helping a high school player interpret a message from a college coach. Analyze the coach\'s message and return JSON only — no prose outside the JSON object.',
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
      if (!match) return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
      result = JSON.parse(match[0])
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[analyze-reply] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
