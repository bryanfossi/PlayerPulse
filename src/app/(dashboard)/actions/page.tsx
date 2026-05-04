import { redirect } from 'next/navigation'
import { ListTodo } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ActionsClient } from '@/components/actions/ActionsClient'
import type { Database } from '@/types/database'

type ActionRow = Database['public']['Tables']['actions']['Row']

export default async function ActionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: player } = await service
    .from('players')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!player) redirect('/onboarding')

  const playerId = (player as { id: string }).id

  const [actionsResult, schoolsResult] = await Promise.all([
    service
      .from('actions')
      .select('*')
      .eq('player_id', playerId)
      .order('status', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false }),
    service
      .from('player_schools')
      .select('id, school:schools(id, name, verified_division)')
      .eq('player_id', playerId)
      .neq('status', 'declined')
      .order('rank_order', { ascending: true }),
  ])

  const actions = (actionsResult.data ?? []) as ActionRow[]

  type SchoolJoin = { id: string; school: { id: string; name: string; verified_division: string | null } }
  const schools = ((schoolsResult.data ?? []) as unknown as SchoolJoin[]).map((s) => ({
    player_school_id: s.id,
    school_name: s.school.name,
    verified_division: s.school.verified_division,
  }))

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)' }}>
          <ListTodo className="w-4 h-4" style={{ color: '#4ADE80' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Actions</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
            Everything you&apos;re tracking. Add tasks manually or save them from AI tips.
          </p>
        </div>
      </div>

      <ActionsClient initialActions={actions} schools={schools} />
    </div>
  )
}
