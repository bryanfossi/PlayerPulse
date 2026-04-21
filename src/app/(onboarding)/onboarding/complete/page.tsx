import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { StepComplete } from '@/components/onboarding/StepComplete'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']
type PlayerSchoolRow = Database['public']['Tables']['player_schools']['Row']
type SchoolRow = Database['public']['Tables']['schools']['Row']

export default async function OnboardingComplete() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use service client so the query is never blocked by RLS or session state
  const service = createServiceClient()
  const { data: playerRaw } = await service
    .from('players')
    .select('id, first_name, onboarding_complete')
    .eq('user_id', user.id)
    .maybeSingle()
  const player = playerRaw as Pick<PlayerRow, 'id' | 'first_name' | 'onboarding_complete'> | null

  if (!player) redirect('/onboarding')

  const { data: schoolsRaw } = await service
    .from('player_schools')
    .select('rank_order, tier, overall_score, school:schools(name, verified_division, city, state)')
    .eq('player_id', player.id)
    .order('rank_order', { ascending: true })
    .limit(5)

  type PSWithSchool = Pick<PlayerSchoolRow, 'rank_order' | 'tier' | 'overall_score'> & {
    school: Pick<SchoolRow, 'name' | 'verified_division' | 'city' | 'state'>
  }

  const topSchools = (schoolsRaw ?? []) as PSWithSchool[]

  const { count } = await service
    .from('player_schools')
    .select('id', { count: 'exact', head: true })
    .eq('player_id', player.id)

  return (
    <StepComplete
      firstName={player.first_name}
      topSchools={topSchools}
      totalCount={count ?? 0}
    />
  )
}
