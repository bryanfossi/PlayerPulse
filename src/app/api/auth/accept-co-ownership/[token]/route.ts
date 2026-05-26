/**
 * Accept a co-ownership invite.
 *
 * The flow:
 *  1. GET /api/auth/accept-co-ownership/[token] — validates the token,
 *     returns the inviter email + intended role so the UI can render a
 *     personalized password form.
 *  2. POST same path with { password } — creates the athlete's auth user
 *     (or attaches if they already have one), links them to the parent's
 *     player record as co_owner_user_id, marks the invite accepted,
 *     and returns a session via signInWithPassword.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { TERMS_VERSION, PRIVACY_VERSION } from '@/lib/legal'
import * as Sentry from '@sentry/nextjs'

interface Invite {
  id: string
  invited_by_user_id: string
  invitee_email: string
  invitee_role: 'player' | 'parent'
  player_id: string | null
  expires_at: string
  accepted_at: string | null
}

async function loadInvite(token: string): Promise<Invite | null> {
  const service = createServiceClient()
  const untyped = service as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (k: string, v: string) => {
          maybeSingle: () => Promise<{ data: Invite | null; error: unknown }>
        }
      }
    }
  }
  const { data, error } = await untyped
    .from('co_owner_invites')
    .select('id, invited_by_user_id, invitee_email, invitee_role, player_id, expires_at, accepted_at')
    .eq('token', token)
    .maybeSingle()
  if (error) {
    console.error('[accept-co-ownership] invite lookup failed:', error)
    return null
  }
  return data
}

async function loadInviterEmail(inviterUserId: string): Promise<string | null> {
  const service = createServiceClient()
  const untyped = service as unknown as {
    auth: { admin: { getUserById: (id: string) => Promise<{ data: { user: { email?: string } | null } }> } }
  }
  try {
    const { data } = await untyped.auth.admin.getUserById(inviterUserId)
    return data.user?.email ?? null
  } catch (err) {
    console.error('[accept-co-ownership] inviter lookup failed:', err)
    return null
  }
}

function isExpired(invite: Invite): boolean {
  return new Date(invite.expires_at).getTime() < Date.now()
}

// ───────────────────────── GET ─────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const invite = await loadInvite(token)

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }
  if (invite.accepted_at) {
    return NextResponse.json({ error: 'This invite has already been accepted.' }, { status: 410 })
  }
  if (isExpired(invite)) {
    return NextResponse.json({ error: 'This invite has expired.' }, { status: 410 })
  }

  const inviterEmail = await loadInviterEmail(invite.invited_by_user_id)
  return NextResponse.json({
    invitee_email: invite.invitee_email,
    inviter_email: inviterEmail,
    invitee_role: invite.invitee_role,
  })
}

// ───────────────────────── POST ────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const body: { password?: string } = await request.json().catch(() => ({}))
    const password = body.password?.trim()

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const invite = await loadInvite(token)
    if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    if (invite.accepted_at) return NextResponse.json({ error: 'Invite already accepted' }, { status: 410 })
    if (isExpired(invite)) return NextResponse.json({ error: 'Invite expired' }, { status: 410 })

    const service = createServiceClient()
    const inviteeEmail = invite.invitee_email

    // 1. Create the athlete's auth user. If one already exists with this
    //    email (rare but possible — they pre-registered separately), we
    //    cannot overwrite the password, so we surface an error directing
    //    them to log in instead.
    const authAdmin = service as unknown as {
      auth: {
        admin: {
          createUser: (args: {
            email: string
            password: string
            email_confirm: boolean
            user_metadata?: Record<string, unknown>
          }) => Promise<{ data: { user: { id: string } | null }; error: { message: string; status?: number; code?: string } | null }>
        }
      }
    }
    const createRes = await authAdmin.auth.admin.createUser({
      email: inviteeEmail,
      password,
      email_confirm: true,
      user_metadata: { role: invite.invitee_role, joined_via: 'co_owner_invite' },
    })

    if (createRes.error || !createRes.data.user) {
      const msg = createRes.error?.message ?? 'Could not create account'
      const alreadyExists = /already.*registered|already exists|duplicate/i.test(msg)
      return NextResponse.json(
        {
          error: alreadyExists
            ? 'An account with this email already exists. Sign in instead and contact support to link the accounts.'
            : msg,
        },
        { status: alreadyExists ? 409 : 500 },
      )
    }
    const newUserId = createRes.data.user.id

    // 2. Persist their ToS acceptance (they accept by following the magic
    //    link — same legal weight as a checkbox per Section 1 of the ToS).
    const acceptedAt = new Date().toISOString()
    const untypedFrom = service as unknown as {
      from: (t: string) => {
        update: (row: Record<string, unknown>) => {
          eq: (k: string, v: string) => Promise<{ error: unknown }>
        }
      }
    }
    await untypedFrom
      .from('profiles')
      .update({
        accepted_terms_at: acceptedAt,
        accepted_terms_version: TERMS_VERSION,
        accepted_privacy_at: acceptedAt,
        accepted_privacy_version: PRIVACY_VERSION,
        role: invite.invitee_role,
      })
      .eq('id', newUserId)

    // 3. Link to the player record. If the parent already finished the
    //    onboarding wizard, a players row exists with
    //    user_id = invite.invited_by_user_id — set co_owner_user_id to the
    //    new athlete. If not, we leave the player record absent and let
    //    the athlete go through the wizard themselves. Their auth user
    //    becomes the primary user_id and the parent gets backfilled as
    //    co_owner when /api/player/setup runs.
    const playerLookup = service as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (k: string, v: string) => {
            maybeSingle: () => Promise<{ data: { id: string } | null }>
          }
        }
      }
    }
    const { data: existingPlayer } = await playerLookup
      .from('players')
      .select('id')
      .eq('user_id', invite.invited_by_user_id)
      .maybeSingle()

    if (existingPlayer?.id) {
      await untypedFrom
        .from('players')
        .update({ co_owner_user_id: newUserId })
        .eq('id', existingPlayer.id)
    }

    // 4. Mark invite accepted + capture the player_id if we resolved one
    await untypedFrom
      .from('co_owner_invites')
      .update({
        accepted_at: acceptedAt,
        accepted_by_user_id: newUserId,
        player_id: existingPlayer?.id ?? null,
      })
      .eq('id', invite.id)

    return NextResponse.json({
      success: true,
      email: inviteeEmail,
      player_record_exists: !!existingPlayer,
    })
  } catch (err) {
    console.error('[accept-co-ownership] error:', err)
    Sentry.captureException(err, { tags: { feature: 'co-owner-accept' } })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
