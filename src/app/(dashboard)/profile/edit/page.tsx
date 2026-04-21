import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']

export default async function ProfileEditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: playerRaw, error: playerError } = await service
    .from('players')
    .select(
      'first_name, last_name, grad_year, gender, primary_position, secondary_position, ' +
      'height_inches, weight_lbs, unweighted_gpa, sat_score, act_score, ' +
      'club_team, highest_club_level, high_school, home_city, home_state, ' +
      'recruiting_radius_mi, target_levels, annual_tuition_budget, tuition_importance, ' +
      'bio, highlight_url, jersey_number, hero_image_url, ' +
      'contact_phone, contact_twitter, contact_instagram, contact_hudl, contact_tiktok, contact_youtube, ' +
      'coach_name, coach_email, coach_phone, ' +
      'class_rank, intended_major, academic_honors, ' +
      'stats_json, awards_json, upcoming_events_json, match_schedule_json, highlight_clips_json'
    )
    .eq('user_id', user.id)
    .maybeSingle()

  const player = playerRaw as Pick<
    PlayerRow,
    'first_name' | 'last_name' | 'grad_year' | 'gender' |
    'primary_position' | 'secondary_position' | 'height_inches' | 'weight_lbs' |
    'unweighted_gpa' | 'sat_score' | 'act_score' | 'club_team' | 'highest_club_level' |
    'high_school' | 'home_city' | 'home_state' | 'recruiting_radius_mi' |
    'target_levels' | 'annual_tuition_budget' | 'tuition_importance' | 'bio' | 'highlight_url' |
    'jersey_number' | 'hero_image_url' |
    'contact_phone' | 'contact_twitter' | 'contact_instagram' | 'contact_hudl' | 'contact_tiktok' | 'contact_youtube' |
    'coach_name' | 'coach_email' | 'coach_phone' |
    'class_rank' | 'intended_major' | 'academic_honors' |
    'stats_json' | 'awards_json' | 'upcoming_events_json' | 'match_schedule_json' | 'highlight_clips_json'
  > | null

  if (playerError) {
    console.error('[profile/edit] player query error:', playerError.message, playerError.details)
    throw new Error(`Database migration required. Check Supabase SQL Editor and run migrations 004 and 005. Error: ${playerError.message}`)
  }
  if (!player) redirect('/onboarding')

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="text-muted-foreground hover:text-green-400 transition-colors"
          aria-label="Back to profile"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit <span className="text-green-400">Profile</span></h1>
          <p className="text-muted-foreground text-sm mt-0.5">Update your recruiting profile</p>
        </div>
      </div>

      <ProfileEditForm player={player} />
    </div>
  )
}
