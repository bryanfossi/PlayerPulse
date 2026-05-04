import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type ActionRow = Database['public']['Tables']['actions']['Row']
type ActionInsert = Database['public']['Tables']['actions']['Insert']

const VALID_STATUSES = new Set(['open', 'completed', 'snoozed', 'archived'])
const VALID_SOURCES = new Set(['manual', 'profile_tip', 'follow_up', 'system'])

// GET /api/actions?status=open
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')

    const service = createServiceClient()
    const { data: player } = await service
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    let q = service
      .from('actions')
      .select('*')
      .eq('player_id', (player as { id: string }).id)
      .order('completed_at', { ascending: false, nullsFirst: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (statusFilter && VALID_STATUSES.has(statusFilter)) {
      q = q.eq('status', statusFilter as ActionRow['status'])
    }

    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ actions: data ?? [] })
  } catch (err) {
    console.error('[actions GET] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/actions  body: { title, description?, due_date?, player_school_id?, contact_id?, source?, source_payload? }
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: Partial<ActionInsert> = await request.json()
    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (body.source && !VALID_SOURCES.has(body.source)) {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 })
    }
    if (body.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(body.due_date)) {
      return NextResponse.json({ error: 'due_date must be YYYY-MM-DD' }, { status: 400 })
    }

    const service = createServiceClient()
    const { data: player } = await service
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const playerId = (player as { id: string }).id

    // Verify ownership of any referenced player_school
    if (body.player_school_id) {
      const { data: ps } = await service
        .from('player_schools')
        .select('id')
        .eq('id', body.player_school_id)
        .eq('player_id', playerId)
        .maybeSingle()
      if (!ps) return NextResponse.json({ error: 'School not on your list' }, { status: 403 })
    }

    const insertPayload: ActionInsert = {
      player_id: playerId,
      title: body.title.trim().slice(0, 200),
      description: body.description?.toString().slice(0, 2000) ?? null,
      due_date: body.due_date ?? null,
      player_school_id: body.player_school_id ?? null,
      contact_id: body.contact_id ?? null,
      source: body.source ?? 'manual',
      source_payload: body.source_payload ?? null,
    }

    const { data, error } = await service
      .from('actions')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: data })
  } catch (err) {
    console.error('[actions POST] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
