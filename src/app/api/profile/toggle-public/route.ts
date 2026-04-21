import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { enabled }: { enabled: boolean } = await request.json()

    const service = createServiceClient()
    await service
      .from('players')
      .update({ public_profile_enabled: enabled, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[toggle-public] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
