import { redirect } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { DraftEmailClient, type SchoolOption } from '@/components/ai/DraftEmailClient'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']
type PSRow = Database['public']['Tables']['player_schools']['Row']
type SchoolRow = Database['public']['Tables']['schools']['Row']

export default async function AIDraftPage({
  searchParams,
}: {
  searchParams: Promise<{ ps?: string; type?: string }>
}) {
  const { ps: preselectedPsId, type: preselectedType } = await searchParams

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

  // Fetch player's schools with school info
  const { data: raw } = await service
    .from('player_schools')
    .select('id, tier, status, school:schools(id, name, verified_division, city, state)')
    .eq('player_id', player.id)
    .neq('status', 'declined')
    .order('rank_order', { ascending: true })

  type PSWithSchool = Pick<PSRow, 'id' | 'tier' | 'status'> & {
    school: Pick<SchoolRow, 'id' | 'name' | 'verified_division' | 'city' | 'state'>
  }

  const schools: SchoolOption[] = ((raw ?? []) as unknown as PSWithSchool[]).map((ps) => ({
    player_school_id: ps.id,
    school_name: ps.school.name,
    verified_division: ps.school.verified_division,
    city: ps.school.city,
    state: ps.school.state,
    tier: ps.tier,
    status: ps.status,
  }))

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-green-400">AI</span> Email Draft
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate personalized recruiting emails for any school on your list
        </p>
      </div>

      {schools.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-2">
          <p className="font-medium">No schools on your list yet</p>
          <p className="text-sm text-muted-foreground">Complete the onboarding wizard to generate your school list first.</p>
          <a href="/schools" className="inline-flex mt-2 text-sm text-primary hover:underline">
            Go to My Schools →
          </a>
        </div>
      ) : (
        <DraftEmailClient schools={schools} preselectedPsId={preselectedPsId} preselectedType={preselectedType as import('@/types/app').EmailDraftType | undefined} />
      )}
    </div>
  )
}
