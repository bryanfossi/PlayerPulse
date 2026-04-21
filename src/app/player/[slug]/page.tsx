import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { PublicProfileClient } from '@/components/profile/PublicProfileClient'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']
type PSRow = Database['public']['Tables']['player_schools']['Row']
type SchoolRow = Database['public']['Tables']['schools']['Row']

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params

  const { data: playerRaw } = await supabaseAdmin
    .from('players')
    .select(
      'id, first_name, last_name, grad_year, gender, primary_position, secondary_position, ' +
      'club_team, highest_club_level, high_school, home_city, home_state, ' +
      'unweighted_gpa, sat_score, act_score, height_inches, weight_lbs, highlight_url, bio, target_levels, ' +
      'public_profile_enabled, jersey_number, hero_image_url, ' +
      'contact_phone, contact_twitter, contact_instagram, contact_hudl, contact_tiktok, contact_youtube, ' +
      'coach_name, coach_email, coach_phone, ' +
      'class_rank, intended_major, academic_honors, ' +
      'stats_json, awards_json, upcoming_events_json, match_schedule_json, highlight_clips_json'
    )
    .eq('public_profile_slug', slug)
    .maybeSingle()

  const player = playerRaw as Pick<PlayerRow,
    'id' | 'first_name' | 'last_name' | 'grad_year' | 'gender' | 'primary_position' | 'secondary_position' |
    'club_team' | 'highest_club_level' | 'high_school' | 'home_city' | 'home_state' |
    'unweighted_gpa' | 'sat_score' | 'act_score' | 'highlight_url' | 'bio' | 'target_levels' |
    'public_profile_enabled' | 'height_inches' | 'weight_lbs' | 'jersey_number' | 'hero_image_url' |
    'contact_phone' | 'contact_twitter' | 'contact_instagram' | 'contact_hudl' | 'contact_tiktok' | 'contact_youtube' |
    'coach_name' | 'coach_email' | 'coach_phone' |
    'class_rank' | 'intended_major' | 'academic_honors' |
    'stats_json' | 'awards_json' | 'upcoming_events_json' | 'match_schedule_json' | 'highlight_clips_json'
  > | null

  if (!player || !player.public_profile_enabled) notFound()

  // Fetch top 10 non-declined schools (Lock + Realistic first) — no scores or tier labels
  const { data: psData } = await supabaseAdmin
    .from('player_schools')
    .select('id, tier, school:schools(id, name, verified_division)')
    .eq('player_id', player.id)
    .neq('status', 'declined')
    .in('tier', ['Lock', 'Realistic'])
    .order('rank_order', { ascending: true })
    .limit(10)

  type PSWithSchool = Pick<PSRow, 'id' | 'tier'> & {
    school: Pick<SchoolRow, 'id' | 'name' | 'verified_division'>
  }
  const topSchools = (psData ?? []) as unknown as PSWithSchool[]

  // Cast through unknown: DB Json type is wider than our typed interfaces, but runtime shape matches
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (
    <PublicProfileClient
      player={player as unknown as Parameters<typeof PublicProfileClient>[0]['player']}
      topSchools={topSchools}
      slug={slug}
    />
  )
}
