import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import type { ContactType } from '@/types/app'

type PlayerRow = Database['public']['Tables']['players']['Row']
type ContactRow = Database['public']['Tables']['contacts']['Row']

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
      contact_type: ContactType
      direction: 'outbound' | 'inbound'
      contact_date: string
      subject: string | null
      notes: string | null
      coach_name: string | null
      coach_email: string | null
      follow_up_date: string | null
    }> = await request.json()

    const service = createServiceClient()

    // Verify ownership
    const { data: playerRaw } = await service
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    const player = playerRaw as Pick<PlayerRow, 'id'> | null
    if (!player) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: contactRaw } = await service
      .from('contacts')
      .select('player_id')
      .eq('id', id)
      .maybeSingle()
    const contact = contactRaw as Pick<ContactRow, 'player_id'> | null
    if (!contact || contact.player_id !== player.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const update: Database['public']['Tables']['contacts']['Update'] = {}
    if (body.contact_type !== undefined) update.contact_type = body.contact_type
    if (body.direction !== undefined) update.direction = body.direction
    if (body.contact_date !== undefined) update.contact_date = body.contact_date
    if (body.subject !== undefined) update.subject = body.subject
    if (body.notes !== undefined) update.notes = body.notes
    if (body.coach_name !== undefined) update.coach_name = body.coach_name
    if (body.coach_email !== undefined) update.coach_email = body.coach_email
    if (body.follow_up_date !== undefined) update.follow_up_date = body.follow_up_date

    const { error } = await service.from('contacts').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
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

    const { data: playerRaw } = await service
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    const player = playerRaw as Pick<PlayerRow, 'id'> | null
    if (!player) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: contactRaw } = await service
      .from('contacts')
      .select('player_id')
      .eq('id', id)
      .maybeSingle()
    const contact = contactRaw as Pick<ContactRow, 'player_id'> | null
    if (!contact || contact.player_id !== player.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { error } = await service.from('contacts').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
