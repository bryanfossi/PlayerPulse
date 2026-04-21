import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']

export const maxDuration = 30

export interface TimelineMonth {
  month: string
  phase: 'Early Research' | 'Active Outreach' | 'Visit Season' | 'Decision'
  priority_actions: string[]
  division_notes: string
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    const { data: playerRaw } = await service
      .from('players')
      .select('grad_year, target_levels, onboarding_complete, match_engine_run_at, first_name')
      .eq('user_id', user.id)
      .maybeSingle()
    const player = playerRaw as Pick<PlayerRow,
      'grad_year' | 'target_levels' | 'onboarding_complete' | 'match_engine_run_at' | 'first_name'
    > | null
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const today = new Date()
    const currentMonth = today.toLocaleString('en-US', { month: 'long', year: 'numeric' })

    const prompt = `Generate a personalized month-by-month college soccer recruiting action plan for this player.

PLAYER
Grad year: ${player.grad_year}
Target divisions: ${player.target_levels?.join(', ') ?? 'not specified'}
Current date: ${currentMonth}
Match engine run: ${player.match_engine_run_at ? 'Yes' : 'No'}
Onboarding complete: ${player.onboarding_complete}

Generate 8-12 months of timeline starting from the current month (${currentMonth}). Be specific to their division targets — never lump D1/D2/D3/NAIA/JUCO together. Note that D1 recruiting happens much earlier than D3/NAIA. Be direct. No fluff.

Return ONLY a valid JSON array:
[
  {
    "month": "May 2025",
    "phase": "Early Research" | "Active Outreach" | "Visit Season" | "Decision",
    "priority_actions": ["2-4 specific action strings"],
    "division_notes": "Any division-specific timing notes relevant this month"
  }
]`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      temperature: 0.3,
      system: 'You are a college soccer recruiting expert. Return only a valid JSON array. No prose, no markdown.',
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    let timeline: TimelineMonth[]
    try {
      const match = raw.match(/\[[\s\S]+\]/)
      timeline = JSON.parse(match ? match[0] : raw)
    } catch {
      return NextResponse.json({ error: 'AI_PARSE_ERROR' }, { status: 500 })
    }

    return NextResponse.json({ timeline })
  } catch (err) {
    console.error('[recruiting-timeline] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
