import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    const { data: player } = await service
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const body: {
      tuition_per_year?: number | null
      athletic_scholarship?: number
      merit_aid?: number
      need_based_aid?: number
      other_aid?: number
      offer_date?: string | null
      decision_deadline?: string | null
      status?: 'evaluating' | 'accepted' | 'declined'
      notes?: string | null
    } = await request.json()

    const { error } = await service
      .from('offers')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('player_id', player.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    const { data: player } = await service
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const { error } = await service
      .from('offers')
      .delete()
      .eq('id', id)
      .eq('player_id', player.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
