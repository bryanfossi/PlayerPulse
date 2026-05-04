import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSportOrDefault } from '@/lib/sports'
import { TOKEN_COSTS } from '@/lib/tokens/costs'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = checkRateLimit(`profile-tips:${user.id}`, { limit: 5, windowSec: 3600 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` },
        { status: 429 },
      )
    }

    const service = createServiceClient()

    const { data: playerRaw } = await service
      .from('players')
      .select('id, first_name, last_name, grad_year, primary_position, secondary_position, club_team, highest_club_level, home_state, unweighted_gpa, target_levels, highlight_url, sport_id')
      .eq('user_id', user.id)
      .maybeSingle()
    const player = playerRaw as Pick<PlayerRow,
      'id' | 'first_name' | 'last_name' | 'grad_year' | 'primary_position' | 'secondary_position' | 'club_team' | 'highest_club_level' | 'home_state' | 'unweighted_gpa' | 'target_levels' | 'highlight_url'
    > & { sport_id?: string } | null
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const sport = getSportOrDefault(player.sport_id)

    // Aggregate school stats
    const { data: schoolStats } = await service
      .from('player_schools')
      .select('tier, status')
      .eq('player_id', player.id)

    const stats = {
      total: schoolStats?.length ?? 0,
      lock: schoolStats?.filter((s) => s.tier === 'Lock').length ?? 0,
      realistic: schoolStats?.filter((s) => s.tier === 'Realistic').length ?? 0,
      reach: schoolStats?.filter((s) => s.tier === 'Reach').length ?? 0,
      contacted: schoolStats?.filter((s) => ['contacted', 'interested', 'campus_visit', 'offer_received', 'committed'].includes(s.status)).length ?? 0,
      offers: schoolStats?.filter((s) => s.status === 'offer_received').length ?? 0,
      committed: schoolStats?.filter((s) => s.status === 'committed').length ?? 0,
    }

    // Recent contacts count
    const { count: recentContacts } = await service
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', player.id)

    // Upcoming follow-ups
    const { count: followUpsOverdue } = await service
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', player.id)
      .lt('follow_up_date', new Date().toISOString().slice(0, 10))
      .not('follow_up_date', 'is', null)

    // Token gate: deduct BEFORE Claude call
    const { data: ok, error: tokenErr } = await service.rpc('consume_tokens', {
      p_user_id: user.id,
      p_amount: TOKEN_COSTS.AI_QUERY,
    })
    if (tokenErr || !ok) {
      return NextResponse.json(
        {
          error: 'NO_TOKENS',
          message: `Generating action tips costs ${TOKEN_COSTS.AI_QUERY} token. You're out — purchase a token pack to continue.`,
        },
        { status: 402 },
      )
    }

    const prompt = `You are an expert college ${sport.name.toLowerCase()} recruiting advisor. Analyze this player's recruiting status and give 4 specific, actionable tips.

PLAYER
Name: ${player.first_name} ${player.last_name}
Position: ${player.primary_position}${player.secondary_position ? ` / ${player.secondary_position}` : ''}
Club: ${player.club_team} (${player.highest_club_level})
Grad year: ${player.grad_year}
Home state: ${player.home_state}
GPA: ${player.unweighted_gpa ?? 'not provided'}
Target divisions: ${player.target_levels?.join(', ') ?? 'not set'}
Highlight video: ${player.highlight_url ? 'Yes' : 'No'}

RECRUITING STATUS
Total schools in list: ${stats.total}
Lock / Realistic / Reach: ${stats.lock} / ${stats.realistic} / ${stats.reach}
Schools contacted: ${stats.contacted} of ${stats.total}
Offers received: ${stats.offers}
Committed: ${stats.committed}
Total contact logs: ${recentContacts ?? 0}
Overdue follow-ups: ${followUpsOverdue ?? 0}

OUTPUT FORMAT
Return ONLY a valid JSON array with exactly 4 objects. No prose outside the JSON.
[
  {"tip": "...", "priority": "high" | "medium" | "low"},
  ...
]

GUIDELINES
- Be specific to this player's actual numbers (mention specific counts)
- Tips should be actionable steps they can take this week
- Address the most pressing issues first (overdue follow-ups, low contact rate, missing highlight video, etc.)
- Keep each tip under 40 words`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: `You are an expert college ${sport.name.toLowerCase()} recruiting advisor. Output only valid JSON.`,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    let tips: { tip: string; priority: 'high' | 'medium' | 'low' }[] = []
    try {
      tips = JSON.parse(raw)
    } catch {
      const match = raw.match(/\[[\s\S]+\]/)
      try {
        tips = match ? JSON.parse(match[0]) : []
      } catch {
        tips = []
      }
    }

    // Refund if Claude returned nothing usable
    if (!Array.isArray(tips) || tips.length === 0) {
      await service.rpc('refund_tokens', { p_user_id: user.id, p_amount: TOKEN_COSTS.AI_QUERY })
      return NextResponse.json({ error: 'No tips generated. Your token has been refunded.' }, { status: 500 })
    }

    return NextResponse.json({ tips })
  } catch (err) {
    console.error('[profile-tips] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
