import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type PlayerUpdate = Database['public']['Tables']['players']['Update']

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: Partial<PlayerUpdate> = await request.json()

    // Whitelist editable fields — never allow id, user_id, onboarding_complete, etc.
    const allowed: (keyof PlayerUpdate)[] = [
      'first_name', 'last_name', 'grad_year', 'gender',
      'primary_position', 'secondary_position',
      'height_inches', 'weight_lbs',
      'unweighted_gpa', 'sat_score', 'act_score',
      'club_team', 'highest_club_level', 'high_school',
      'home_city', 'home_state', 'recruiting_radius_mi',
      'target_levels', 'forced_schools',
      'tuition_importance', 'annual_tuition_budget',
      'bio', 'highlight_url',
      // Public profile data
      'jersey_number', 'hero_image_url',
      'contact_phone', 'contact_twitter', 'contact_instagram',
      'contact_hudl', 'contact_tiktok', 'contact_youtube',
      'coach_name', 'coach_email', 'coach_phone',
      'class_rank', 'intended_major', 'academic_honors',
      'stats_json', 'awards_json', 'upcoming_events_json',
      'match_schedule_json', 'highlight_clips_json',
    ]

    const update: Partial<PlayerUpdate> = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (key in body) {
        // @ts-expect-error dynamic key assignment
        update[key] = body[key]
      }
    }

    const service = createServiceClient()
    const { error } = await service
      .from('players')
      .update(update)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
