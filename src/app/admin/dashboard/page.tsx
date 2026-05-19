import { loadDashboardStats } from '@/lib/admin/dashboard-stats'
import { DashboardClient } from './DashboardClient'

// Single source of truth for what /api/admin/dashboard-stats returns.
export type DashboardData = Awaited<ReturnType<typeof loadDashboardStats>>

export default async function AdminDashboardPage() {
  // Render the dashboard server-side on first load so the page is interactive
  // immediately. The client component handles manual refresh + auto-refresh,
  // which hit /api/admin/dashboard-stats.
  const data = await loadDashboardStats()
  return <DashboardClient initialData={data} />
}
