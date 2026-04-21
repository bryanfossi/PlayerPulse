import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabaseAdmin
      .from('players')
      .update({
        rerun_tokens: 3,
        rerun_tokens_reset_at: new Date().toISOString(),
        email_drafts_this_month: 0,
        email_drafts_reset_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_active', true)
      .lt('rerun_tokens_reset_at', thirtyDaysAgo)
      .select('id')

    if (error) {
      console.error('[reset-monthly] error:', error)
      return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
    }

    return NextResponse.json({ reset_count: data?.length ?? 0 })
  } catch (err) {
    console.error('[reset-monthly] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
