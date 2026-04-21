import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { buildMatchEnginePrompt } from '@/lib/prompts/match-engine'
import { parseMatchEngineTSV } from '@/lib/parsers/match-engine-tsv'
import { checkRateLimit } from '@/lib/rate-limit'
import type { Player } from '@/types/app'
import type { Database } from '@/types/database'

// Allow up to 60 seconds for Opus to generate 40 rows
export const maxDuration = 60

type PlayerRow = Database['public']['Tables']['players']['Row']

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = checkRateLimit(`match-engine:${user.id}`, { limit: 3, windowSec: 3600 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` },
        { status: 429 },
      )
    }

    const { player_id }: { player_id: string } = await request.json()
    if (!player_id) {
      return NextResponse.json({ error: 'player_id is required' }, { status: 400 })
    }

    const service = createServiceClient()

    // Fetch full player record
    const { data: playerRaw, error: playerErr } = await service
      .from('players')
      .select('*')
      .eq('id', player_id)
      .eq('user_id', user.id) // security: verify ownership
      .single()

    if (playerErr || !playerRaw) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }
    const player = playerRaw as Player & {
      match_engine_run_at: string | null
      rerun_tokens: number
      rerun_tokens_used: number
    }

    // Token gate: first run is always free; reruns require a token
    const isFirstRun = !player.match_engine_run_at
    if (!isFirstRun) {
      if (player.rerun_tokens <= 0) {
        return NextResponse.json(
          { error: 'NO_TOKENS', message: 'No rerun tokens remaining. Purchase more to regenerate your list.' },
          { status: 402 },
        )
      }
      // Deduct token BEFORE calling Opus
      await service
        .from('players')
        .update({
          rerun_tokens: player.rerun_tokens - 1,
          rerun_tokens_used: player.rerun_tokens_used + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', player_id)
    }

    // Build prompt and call Claude Opus
    const prompt = buildMatchEnginePrompt(player)

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 8192,
      system: 'You are an expert U.S. college soccer recruiting coordinator. Output TSV only. No prose. No markdown. No commentary.',
      messages: [{ role: 'user', content: prompt }],
    })

    const rawTSV = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    if (!rawTSV) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 })
    }

    // Parse TSV
    const { rows, errorRows } = parseMatchEngineTSV(rawTSV)

    if (rows.length === 0) {
      console.error('[match-engine] parse produced 0 rows. Raw:', rawTSV.slice(0, 500))
      return NextResponse.json({ error: 'Failed to parse AI output. Please try again.' }, { status: 500 })
    }

    // Save raw run record first
    const playerSnapshot = {
      grad_year: player.grad_year,
      gender: player.gender,
      primary_position: player.primary_position,
      highest_club_level: player.highest_club_level,
      club_team: player.club_team,
      home_city: player.home_city,
      home_state: player.home_state,
      unweighted_gpa: player.unweighted_gpa,
      target_levels: player.target_levels,
      recruiting_radius_mi: player.recruiting_radius_mi,
      tuition_importance: player.tuition_importance,
    }

    const { data: run, error: runErr } = await service
      .from('match_engine_runs')
      .insert({
        player_id,
        raw_tsv: rawTSV,
        parsed_count: rows.length,
        error_rows: errorRows.length ? errorRows : null,
        player_snapshot: playerSnapshot,
      })
      .select('id')
      .single()

    if (runErr) {
      console.error('[match-engine] failed to save run:', runErr)
    }

    // Upsert schools + player_schools rows
    // Offset match_engine ranks above any existing manual schools so there are no collisions
    const { data: maxManual } = await service
      .from('player_schools')
      .select('rank_order')
      .eq('player_id', player_id)
      .eq('source', 'manual')
      .order('rank_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const manualOffset = (maxManual?.rank_order ?? 0)

    let insertedCount = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Parse city/state from "City, ST" format
      const [city, state] = row.city_state.split(',').map((s) => s.trim())

      // Upsert school (match on name, case-insensitive handled by unique constraint)
      const { data: school, error: schoolErr } = await service
        .from('schools')
        .upsert(
          {
            name: row.school,
            verified_division: row.verified_division,
            conference: row.conference,
            city: city ?? null,
            state: state ?? null,
            campus_type: row.campus_type,
            in_state_tuition: row.in_state_tuition,
            out_state_tuition: row.out_state_tuition,
            prestige: row.prestige,
            soccer_url: row.soccer_url || null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'name',
            ignoreDuplicates: false,
          }
        )
        .select('id')
        .single()

      if (schoolErr || !school) {
        console.error(`[match-engine] school upsert failed for "${row.school}":`, schoolErr)
        continue
      }

      // Delete existing match_engine source row if re-running
      await service
        .from('player_schools')
        .delete()
        .eq('player_id', player_id)
        .eq('school_id', school.id)
        .eq('source', 'match_engine')

      // Insert player_school row
      const { error: psErr } = await service
        .from('player_schools')
        .insert({
          player_id,
          school_id: school.id,
          rank_order: manualOffset + i + 1,
          tier: row.tier,
          status: 'researching',
          overall_score: row.overall_score,
          geo_score: row.geo_score,
          acad_score: row.acad_score,
          level_score: row.level_score,
          need_score: row.need_score,
          pt_score: row.pt_score,
          tuition_score: row.tuition_score,
          merit_value_score: row.merit_value_score,
          player_level_band: row.player_level_band,
          roster_level_band: row.roster_level_band,
          roster_depth: row.roster_depth,
          first_year_opportunity: row.first_year_opportunity,
          merit_aid_potential: row.merit_aid_potential,
          estimated_merit_aid: row.estimated_merit_aid,
          merit_aid_confidence: row.merit_aid_confidence,
          merit_aid_note: row.merit_aid_note,
          distance_miles: row.distance_miles,
          acad_note: row.acad_note,
          level_note: row.level_note,
          pt_note: row.pt_note,
          source: 'match_engine',
        })

      if (!psErr) insertedCount++
    }

    // Mark onboarding complete and set run timestamp
    const { error: completeErr } = await service
      .from('players')
      .update({
        onboarding_complete: true,
        match_engine_run_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', player_id)

    if (completeErr) {
      console.error('[match-engine] CRITICAL: failed to set onboarding_complete=true:', completeErr)
      return NextResponse.json(
        { error: 'Match engine ran but failed to complete onboarding. Please try again.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      schools_generated: insertedCount,
      results: rows,
      run_id: run?.id ?? null,
    })
  } catch (err) {
    console.error('[match-engine] unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
