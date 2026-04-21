import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { WizardData } from '@/types/wizard'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: WizardData = await request.json()

    const gpa = body.unweighted_gpa ? parseFloat(body.unweighted_gpa) : null
    const sat = body.sat_score ? parseInt(body.sat_score) : null
    const act = body.act_score ? parseInt(body.act_score) : null
    const radius = body.recruiting_radius_mi ? parseInt(body.recruiting_radius_mi) : null

    const forcedSchools = body.forced_schools
      ? body.forced_schools.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const service = createServiceClient()

    // Upsert the player record — match on user_id
    const { data: player, error } = await service
      .from('players')
      .upsert(
        {
          user_id: user.id,
          first_name: body.first_name.trim(),
          last_name: body.last_name.trim(),
          gender: body.gender as 'Male' | 'Female',
          grad_year: parseInt(body.grad_year),
          home_city: body.home_city.trim(),
          home_state: body.home_state,
          unweighted_gpa: gpa,
          sat_score: sat,
          act_score: act,
          high_school: body.high_school || null,
          primary_position: body.primary_position,
          secondary_position: body.secondary_position || null,
          club_team: body.club_team.trim(),
          highest_club_level: body.highest_club_level,
          highlight_url: body.highlight_url || null,
          target_levels: body.target_levels,
          recruiting_radius_mi: radius,
          tuition_importance: body.tuition_importance,
          annual_tuition_budget: body.annual_tuition_budget || null,
          forced_schools: forcedSchools.length ? forcedSchools : null,
          onboarding_complete: false, // set to true after match engine succeeds
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select('id')
      .single()

    if (error) {
      console.error('[player/setup] upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ player_id: player.id })
  } catch (err) {
    console.error('[player/setup] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
