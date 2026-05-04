import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type ActionRow = Database['public']['Tables']['actions']['Row']
type ActionUpdate = Database['public']['Tables']['actions']['Update']

const VALID_STATUSES = new Set(['open', 'completed', 'snoozed', 'archived'])

async function verifyOwnership(actionId: string, userId: string) {
  const service = createServiceClient()
  const { data: action } = await service
    .from('actions')
    .select('player_id')
    .eq('id', actionId)
    .maybeSingle()
  if (!action) return null

  const { data: player } = await service
    .from('players')
    .select('id')
    .eq('id', (action as Pick<ActionRow, 'player_id'>).player_id)
    .eq('user_id', userId)
    .maybeSingle()
  if (!player) return null

  return service
}

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
      title: string
      description: string | null
      status: ActionRow['status']
      due_date: string | null
      player_school_id: string | null
    }> = await request.json()

    if (body.status !== undefined && !VALID_STATUSES.has(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    if (body.due_date !== undefined && body.due_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(body.due_date)) {
      return NextResponse.json({ error: 'due_date must be YYYY-MM-DD' }, { status: 400 })
    }

    const service = await verifyOwnership(id, user.id)
    if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const update: ActionUpdate = {
      updated_at: new Date().toISOString(),
    }
    if (body.title !== undefined) update.title = body.title.trim().slice(0, 200)
    if (body.description !== undefined) update.description = body.description?.slice(0, 2000) ?? null
    if (body.due_date !== undefined) update.due_date = body.due_date
    if (body.player_school_id !== undefined) update.player_school_id = body.player_school_id
    if (body.status !== undefined) {
      update.status = body.status
      // Auto-set completed_at when transitioning to completed; clear it otherwise.
      update.completed_at = body.status === 'completed' ? new Date().toISOString() : null
    }

    const { data, error } = await service
      .from('actions')
      .update(update)
      .eq('id', id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: data })
  } catch (err) {
    console.error('[actions PATCH] error:', err)
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
    const service = await verifyOwnership(id, user.id)
    if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { error } = await service.from('actions').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[actions DELETE] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
