import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { buildDraftEmailPrompt } from '@/lib/prompts/draft-email'
import { checkRateLimit } from '@/lib/rate-limit'
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

    // Fetch player (including billing fields for monthly gate)
    const { data: playerRaw } = await service
      .from('players')
      .select('id, first_name, last_name, grad_year, gender, primary_position, secondary_position, club_team, highest_club_level, high_school, home_city, home_state, unweighted_gpa, sat_score, act_score, highlight_url, email_drafts_this_month, rerun_tokens, subscription_active')
      .eq('user_id', user.id)
      .maybeSingle()
    const player = playerRaw as (Pick<PlayerRow,
      'id' | 'first_name' | 'last_name' | 'grad_year' | 'gender' | 'primary_position' | 'secondary_position' | 'club_team' | 'highest_club_level' | 'high_school' | 'home_city' | 'home_state' | 'unweighted_gpa' | 'sat_score' | 'act_score' | 'highlight_url'
    > & { email_drafts_this_month: number; rerun_tokens: number; subscription_active: boolean }) | null
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    // Monthly draft gate
    const draftsUsed = player.email_drafts_this_month ?? 0
    if (draftsUsed >= 10) {
      if (player.rerun_tokens <= 0) {
        return NextResponse.json(
          { error: 'NO_TOKENS', message: 'Monthly email drafts used. Purchase tokens to continue.' },
          { status: 402 },
        )
      }
      // Deduct 1 token, unlock 5 more drafts (set back by 4 so next trigger is at +5)
      await service
        .from('players')
        .update({
          rerun_tokens: player.rerun_tokens - 1,
          email_drafts_this_month: draftsUsed - 4,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
    } else {
      // Free draft — increment counter
      await service
        .from('players')
        .update({
          email_drafts_this_month: draftsUsed + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
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
    const prompt = buildDraftEmailPrompt({
      player,
      school,
      draftType: body.draft_type,
      coachName: body.coach_name,
      coachEmail: body.coach_email,
      personalNote: body.personal_note,
    })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are an expert college soccer recruiting email writer. Output only valid JSON — no markdown, no prose outside the JSON.',
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
      return NextResponse.json({ error: 'Failed to generate email. Please try again.' }, { status: 500 })
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
