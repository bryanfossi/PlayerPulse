import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type PSRow = Database['public']['Tables']['player_schools']['Row']

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body: Partial<{
      status: PSRow['status']
      tier: PSRow['tier']
      notes: string | null
      rank_order: number
      momentum: 'hot' | 'neutral' | 'cold' | null
    }> = await request.json()

    // Validate momentum enum if present
    if (
      body.momentum !== undefined &&
      body.momentum !== null &&
      !['hot', 'neutral', 'cold'].includes(body.momentum)
    ) {
      return NextResponse.json({ error: 'Invalid momentum value' }, { status: 400 })
    }

    const service = createServiceClient()

    // Verify ownership: get player_id from player_school, then check player.user_id
    const { data: ps } = await service
      .from('player_schools')
      .select('player_id')
      .eq('id', id)
      .maybeSingle()
    const psRow = ps as Pick<PSRow, 'player_id'> | null
    if (!psRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: playerRaw } = await service
      .from('players')
      .select('id')
      .eq('id', psRow.player_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!playerRaw) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const update: Database['public']['Tables']['player_schools']['Update'] = {
      updated_at: new Date().toISOString(),
    }
    if (body.status !== undefined) update.status = body.status
    if (body.tier !== undefined) update.tier = body.tier
    if (body.notes !== undefined) update.notes = body.notes
    if (body.rank_order !== undefined) update.rank_order = body.rank_order
    if (body.momentum !== undefined) {
      update.momentum = body.momentum
      update.momentum_updated_at = new Date().toISOString()
    }

    const { error } = await service
      .from('player_schools')
      .update(update)
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const service = createServiceClient()

    const { data: ps } = await service
      .from('player_schools')
      .select('player_id')
      .eq('id', id)
      .maybeSingle()
    const psRow = ps as Pick<Database['public']['Tables']['player_schools']['Row'], 'player_id'> | null
    if (!psRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: playerRaw } = await service
      .from('players')
      .select('id')
      .eq('id', psRow.player_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!playerRaw) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await service.from('player_schools').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
