import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']

function generateToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { email }: { email: string } = await request.json()
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    const service = createServiceClient()

    const { data: playerRaw } = await service
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    const player = playerRaw as Pick<PlayerRow, 'id'> | null
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const token = generateToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // Delete any existing invite for this email + player
    await service
      .from('parent_invites')
      .delete()
      .eq('player_id', player.id)
      .eq('email', email.trim().toLowerCase())

    const { data: invite, error } = await service
      .from('parent_invites')
      .insert({
        player_id: player.id,
        email: email.trim().toLowerCase(),
        token,
        accepted: false,
        expires_at: expiresAt,
      })
      .select('id, token')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ invite_id: invite.id, token: invite.token })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    const { data: playerRaw } = await service
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    const player = playerRaw as Pick<PlayerRow, 'id'> | null
    if (!player) return NextResponse.json({ invites: [] })

    const { data, error: invitesErr } = await service
      .from('parent_invites')
      .select('id, email, token, accepted, expires_at, created_at')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false })

    if (invitesErr) console.error('[invites GET] query error:', invitesErr.message)
    return NextResponse.json({ invites: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
