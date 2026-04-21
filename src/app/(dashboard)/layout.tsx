import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use service client so the query is never blocked by RLS or session state
  const service = createServiceClient()
  const { data: playerRaw } = await service
    .from('players')
    .select('onboarding_complete')
    .eq('user_id', user.id)
    .maybeSingle()
  const player = playerRaw as Pick<PlayerRow, 'onboarding_complete'> | null

  // No player record yet or onboarding not done → start wizard
  if (!player || !player.onboarding_complete) {
    redirect('/onboarding')
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0 min-w-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
