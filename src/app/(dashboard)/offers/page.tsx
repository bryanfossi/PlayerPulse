import { redirect } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { OffersClient, type OfferWithSchool, type OfferSchoolRecord } from '@/components/offers/OffersClient'
import type { SchoolOption } from '@/components/offers/OfferFormDialog'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']
type PSRow = Database['public']['Tables']['player_schools']['Row']
type SchoolRow = Database['public']['Tables']['schools']['Row']

export default async function OffersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: playerRaw } = await service
    .from('players')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  const player = playerRaw as Pick<PlayerRow, 'id'> | null
  if (!player) redirect('/onboarding')

  // Fetch offers, available schools, and player_schools with offer_received status in parallel
  const [offersResult, schoolsResult, offerSchoolsResult] = await Promise.all([
    service
      .from('offers')
      .select('*, school:schools(id, name, verified_division, city, state, in_state_tuition, out_state_tuition)')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false }),
    service
      .from('player_schools')
      .select('id, school_id, school:schools(id, name, verified_division, in_state_tuition, out_state_tuition)')
      .eq('player_id', player.id)
      .neq('status', 'declined')
      .order('rank_order', { ascending: true }),
    service
      .from('player_schools')
      .select('id, updated_at, notes, school:schools(id, name, verified_division, city, state)')
      .eq('player_id', player.id)
      .eq('status', 'offer_received')
      .order('updated_at', { ascending: false }),
  ])

  const offers = (offersResult.data ?? []) as unknown as OfferWithSchool[]

  type PSWithSchool = Pick<PSRow, 'id' | 'school_id'> & {
    school: Pick<SchoolRow, 'id' | 'name' | 'verified_division' | 'in_state_tuition' | 'out_state_tuition'>
  }
  const schools: SchoolOption[] = ((schoolsResult.data ?? []) as unknown as PSWithSchool[]).map((ps) => ({
    player_school_id: ps.id,
    school_id: ps.school.id,
    school_name: ps.school.name,
    verified_division: ps.school.verified_division,
    in_state_tuition: ps.school.in_state_tuition,
    out_state_tuition: ps.school.out_state_tuition,
  }))

  type PSOfferRow = Pick<PSRow, 'id' | 'updated_at' | 'notes'> & {
    school: Pick<SchoolRow, 'id' | 'name' | 'verified_division' | 'city' | 'state'>
  }
  const offerSchools: OfferSchoolRecord[] = ((offerSchoolsResult.data ?? []) as unknown as PSOfferRow[]).map((ps) => ({
    id: ps.id,
    updated_at: ps.updated_at,
    notes: ps.notes,
    school: ps.school,
  }))

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Trophy className="w-4.5 h-4.5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Offer <span className="text-green-400">Comparison</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Compare financial packages side-by-side to find your best value
          </p>
        </div>
      </div>

      <OffersClient initialOffers={offers} schools={schools} offerSchools={offerSchools} />
    </div>
  )
}
