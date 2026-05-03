import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function resolveOwnership(userId: string, offerId: string) {
  const service = createServiceClient()

  const { data: player } = await service
    .from('players')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  if (!player) return { error: 'Player not found', status: 404, service: null, playerId: null }

  // Explicitly verify the offer exists AND belongs to this player before any write
  const { data: offer } = await service
    .from('offers')
    .select('id')
    .eq('id', offerId)
    .eq('player_id', player.id)
    .maybeSingle()
  if (!offer) return { error: 'Offer not found', status: 404, service: null, playerId: null }

  return { error: null, status: null, service, playerId: player.id }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error: ownerErr, status: ownerStatus, service, playerId } = await resolveOwnership(user.id, id)
    if (ownerErr || !service || !playerId) {
      return NextResponse.json({ error: ownerErr }, { status: ownerStatus ?? 500 })
    }

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
      .eq('player_id', playerId)

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

    const { error: ownerErr, status: ownerStatus, service, playerId } = await resolveOwnership(user.id, id)
    if (ownerErr || !service || !playerId) {
      return NextResponse.json({ error: ownerErr }, { status: ownerStatus ?? 500 })
    }

    const { error } = await service
      .from('offers')
      .delete()
      .eq('id', id)
      .eq('player_id', playerId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
