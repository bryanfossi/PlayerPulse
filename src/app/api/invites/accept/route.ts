import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type InviteRow = Database['public']['Tables']['parent_invites']['Row']
type PlayerRow = Database['public']['Tables']['players']['Row']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const service = createServiceClient()
  const { data: inviteRaw } = await service
    .from('parent_invites')
    .select('id, email, accepted, expires_at, player_id')
    .eq('token', token)
    .maybeSingle()

  const invite = inviteRaw as Pick<InviteRow, 'id' | 'email' | 'accepted' | 'expires_at' | 'player_id'> | null

  if (!invite) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })
  if (invite.accepted) return NextResponse.json({ status: 'already_accepted', email: invite.email })
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 })
  }

  // Fetch player name for the welcome message
  const { data: playerRaw } = await service
    .from('players')
    .select('first_name, last_name')
    .eq('id', invite.player_id)
    .maybeSingle()
  const player = playerRaw as Pick<PlayerRow, 'first_name' | 'last_name'> | null

  return NextResponse.json({
    status: 'valid',
    email: invite.email,
    player_name: player ? `${player.first_name} ${player.last_name}` : null,
  })
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    const { data: inviteRaw } = await service
      .from('parent_invites')
      .select('id, email, accepted, expires_at')
      .eq('token', token)
      .maybeSingle()

    const invite = inviteRaw as Pick<InviteRow, 'id' | 'email' | 'accepted' | 'expires_at'> | null

    if (!invite) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })
    if (invite.accepted) return NextResponse.json({ ok: true, already: true })
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 })
    }

    // Verify the logged-in user's email matches the invite
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: `This invite was sent to ${invite.email}. Please sign in with that email address.` },
        { status: 403 }
      )
    }

    const { error } = await service
      .from('parent_invites')
      .update({ accepted: true })
      .eq('id', invite.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
