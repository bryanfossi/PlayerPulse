import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import type { ContactType } from '@/types/app'

type PlayerRow = Database['public']['Tables']['players']['Row']
type PSRow = Database['public']['Tables']['player_schools']['Row']

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: {
      player_school_id: string
      contact_type: ContactType
      direction: 'outbound' | 'inbound'
      contact_date: string
      subject?: string
      notes?: string
      email_body?: string
      coach_name?: string
      coach_email?: string
      follow_up_date?: string
      draft_id?: string
    } = await request.json()

    if (!body.player_school_id || !body.contact_type || !body.direction || !body.contact_date) {
      return NextResponse.json({ error: 'player_school_id, contact_type, direction, contact_date required' }, { status: 400 })
    }

    const service = createServiceClient()

    // Verify player ownership via player_schools
    const { data: playerRaw } = await service
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    const player = playerRaw as Pick<PlayerRow, 'id'> | null
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const { data: psRaw } = await service
      .from('player_schools')
      .select('school_id, player_id, status')
      .eq('id', body.player_school_id)
      .eq('player_id', player.id)
      .maybeSingle()
    const ps = psRaw as Pick<PSRow, 'school_id' | 'player_id' | 'status'> | null
    if (!ps) return NextResponse.json({ error: 'School not on your list' }, { status: 404 })

    // Insert contact
    const { data: contact, error: contactErr } = await service
      .from('contacts')
      .insert({
        player_id: player.id,
        school_id: ps.school_id,
        contact_type: body.contact_type,
        direction: body.direction,
        contact_date: body.contact_date,
        subject: body.subject || null,
        notes: body.notes || null,
        email_body: body.email_body || null,
        coach_name: body.coach_name || null,
        coach_email: body.coach_email || null,
        follow_up_date: body.follow_up_date || null,
      })
      .select('id')
      .single()

    if (contactErr) {
      return NextResponse.json({ error: contactErr.message }, { status: 500 })
    }

    // Advance player_school status to 'contacted' if still 'researching'
    if (body.direction === 'outbound' && ps.status === 'researching') {
      await service
        .from('player_schools')
        .update({ status: 'contacted', updated_at: new Date().toISOString() } as Database['public']['Tables']['player_schools']['Update'])
        .eq('id', body.player_school_id)
    }

    // Mark draft as used if draft_id provided
    if (body.draft_id) {
      await service
        .from('ai_drafts')
        .update({ used: true, contact_id: contact.id } as Database['public']['Tables']['ai_drafts']['Update'])
        .eq('id', body.draft_id)
    }

    return NextResponse.json({ contact_id: contact.id })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
