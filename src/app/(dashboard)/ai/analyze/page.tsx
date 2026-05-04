import { redirect } from 'next/navigation'
import { MessageSquareQuote } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CoachAnalyzerClient } from '@/components/ai/CoachAnalyzerClient'
import type { Database } from '@/types/database'

type PSRow = Database['public']['Tables']['player_schools']['Row']
type SchoolRow = Database['public']['Tables']['schools']['Row']

export default async function CoachAnalyzerPage() {
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

  const { data: psRaw } = await service
    .from('player_schools')
    .select('id, school:schools(id, name, verified_division)')
    .eq('player_id', playerId)
    .neq('status', 'declined')
    .order('rank_order', { ascending: true })

  type PSWithSchool = Pick<PSRow, 'id'> & {
    school: Pick<SchoolRow, 'id' | 'name' | 'verified_division'>
  }
  const schools = ((psRaw ?? []) as unknown as PSWithSchool[]).map((ps) => ({
    player_school_id: ps.id,
    school_name: ps.school.name,
    verified_division: ps.school.verified_division,
  }))

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)' }}
        >
          <MessageSquareQuote className="w-4 h-4" style={{ color: '#4ADE80' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coach Email Analyzer</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
            Paste a coach&apos;s email and get an instant read on interest level, tone, and what to do next.
          </p>
        </div>
      </div>

      <CoachAnalyzerClient schools={schools} />
    </div>
  )
}
