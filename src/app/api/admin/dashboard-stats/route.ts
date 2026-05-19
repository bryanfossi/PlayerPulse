import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/auth/admin'
import { loadDashboardStats } from '@/lib/admin/dashboard-stats'

// The admin dashboard reads from a lot of tables. Give the function room
// to breathe on cold start.
export const maxDuration = 30

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stats = await loadDashboardStats()
    return NextResponse.json(stats)
  } catch (err) {
    console.error('[admin/dashboard-stats] failed:', err)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}
