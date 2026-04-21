import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type PSRow = Database['public']['Tables']['player_schools']['Row']

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { items }: { items: { id: string; rank_order: number }[] } = await request.json()

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items required' }, { status: 400 })
    }

    const service = createServiceClient()

    // Derive player_id from authenticated user — never trust client-supplied value
    const { data: playerRaw } = await service
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!playerRaw) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    const player_id = playerRaw.id

    // Update each item's rank_order
    const updates = items.map(({ id, rank_order }) =>
      service
        .from('player_schools')
        .update({ rank_order, updated_at: new Date().toISOString() } as Database['public']['Tables']['player_schools']['Update'])
        .eq('id', id)
        .eq('player_id', player_id)
    )

    const results = await Promise.allSettled(updates)
    const failures = results.filter((r) => r.status === 'rejected')
    if (failures.length > 0) {
      console.error('[reorder] some updates failed:', failures)
      return NextResponse.json({ error: 'Some items failed to reorder' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
