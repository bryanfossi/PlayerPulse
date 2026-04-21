import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { player_id, coach_name, school_name, coach_email, message } = await request.json()

    if (!player_id || !coach_name || !coach_email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify player exists and profile is public
    const { data: player } = await supabaseAdmin
      .from('players')
      .select('id, public_profile_enabled')
      .eq('id', player_id)
      .eq('public_profile_enabled', true)
      .maybeSingle()

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Find or create a school record by name for the contact log
    let schoolId: string | null = null
    if (school_name) {
      const { data: existing } = await supabaseAdmin
        .from('schools')
        .select('id')
        .ilike('name', school_name.trim())
        .maybeSingle()
      schoolId = existing?.id ?? null
    }

    // Log as inbound email_received contact — only if we have a school on their list
    if (schoolId) {
      const { data: ps } = await supabaseAdmin
        .from('player_schools')
        .select('id')
        .eq('player_id', player.id)
        .eq('school_id', schoolId)
        .maybeSingle()

      if (ps) {
        await supabaseAdmin.from('contacts').insert({
          player_id: player.id,
          school_id: schoolId,
          contact_type: 'email_received',
          direction: 'inbound',
          contact_date: new Date().toISOString().slice(0, 10),
          coach_name,
          coach_email,
          notes: `Inbound via public profile. ${message.slice(0, 500)}`,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contacts/inbound] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
