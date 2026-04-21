import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { SchoolsBoardClient } from '@/components/schools/SchoolsBoardClient'
import type { Database } from '@/types/database'
import type { BoardItem } from '@/components/schools/SchoolCard'
import type { PlayerSchool, School } from '@/types/app'

type PlayerRow = Database['public']['Tables']['players']['Row']

export default async function SchoolsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: playerRaw } = await service
    .from('players')
    .select('id, first_name')
    .eq('user_id', user.id)
    .maybeSingle()
  const player = playerRaw as Pick<PlayerRow, 'id' | 'first_name'> | null
  if (!player) redirect('/onboarding')

  const { data: raw } = await service
    .from('player_schools')
    .select(`
      id, player_id, school_id, rank_order, tier, status,
      overall_score, geo_score, acad_score, level_score, need_score,
      pt_score, tuition_score, merit_value_score,
      player_level_band, roster_level_band, roster_depth,
      first_year_opportunity, merit_aid_potential, estimated_merit_aid,
      merit_aid_confidence, merit_aid_note, distance_miles,
      acad_note, level_note, pt_note, notes, added_at, updated_at, source,
      school:schools (
        id, name, verified_division, conference, city, state, campus_type,
        enrollment, avg_gpa, acceptance_rate, in_state_tuition, out_state_tuition,
        has_scholarship, soccer_url, logo_url, usc_top25_seasons, prestige,
        created_at, updated_at
      )
    `)
    .eq('player_id', player.id)
    .order('rank_order', { ascending: true })

  // Supabase returns school as an object (single FK join), cast appropriately
  const items: BoardItem[] = ((raw ?? []) as unknown as (PlayerSchool & { school: School })[])

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My <span className="text-green-400">Schools</span></h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your personalized recruiting list from the Match Engine
        </p>
      </div>

      <SchoolsBoardClient initialItems={items} playerId={player.id} />
    </div>
  )
}
