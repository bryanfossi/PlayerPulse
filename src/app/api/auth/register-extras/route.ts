import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { TERMS_VERSION, PRIVACY_VERSION } from '@/lib/legal'

const INVITE_TTL_DAYS = 7
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://fuse-id.online'

type ProfileUpdateRow = {
  date_of_birth: string
  accepted_terms_at: string
  accepted_terms_version: string
  accepted_privacy_at: string
  accepted_privacy_version: string
  role?: 'player' | 'parent'
} & Record<string, unknown>

async function sendCoOwnerInviteEmail(
  inviterEmail: string,
  inviteeEmail: string,
  token: string,
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.warn('[register-extras] RESEND_API_KEY not set — invite created but no email sent')
    return
  }
  const acceptUrl = `${APP_URL}/auth/accept-co-ownership/${token}`
  const fromAddr = process.env.RESEND_FROM_EMAIL ?? 'FUSE-ID <feedback@fuse-id.online>'
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #0f1120;">Your recruiting account is ready</h2>
      <p>${escapeHtml(inviterEmail)} invited you to share a FUSE-ID account. Click below to set your password and start managing your recruiting together.</p>
      <p style="margin: 28px 0;">
        <a href="${acceptUrl}" style="display: inline-block; background: #22c55e; color: #052e16; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 700;">
          Join the shared account
        </a>
      </p>
      <p style="color: #6b7280; font-size: 13px;">Both of you can log in and edit the profile, draft emails to coaches, and track offers. This link expires in ${INVITE_TTL_DAYS} days.</p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">Didn't expect this email? You can safely ignore it.</p>
    </div>
  `
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromAddr,
        to: inviteeEmail,
        subject: `${inviterEmail} invited you to join their FUSE-ID account`,
        html,
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[register-extras] Resend invite send failed:', res.status, text)
    }
  } catch (err) {
    console.error('[register-extras] Resend invite send threw:', err)
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Called from the client immediately after supabase.auth.signUp succeeds.
 * Persists registration extras to the profile row that handle_new_user()
 * created via the auth trigger:
 *   - date_of_birth (COPPA enforced server-side)
 *   - accepted_terms_at / accepted_terms_version
 *   - accepted_privacy_at / accepted_privacy_version
 *
 * Server-side enforces the COPPA age >= 13 check and the ToS acceptance.
 * The client also enforces both for UX, but never trust the client.
 */

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: {
      date_of_birth?: string
      terms_accepted?: boolean
      player_email?: string
    } = await request.json()
    const dob = body.date_of_birth?.trim()

    if (body.terms_accepted !== true) {
      return NextResponse.json(
        { error: 'You must accept the Terms of Service and Privacy Policy to register.' },
        { status: 400 },
      )
    }

    if (!dob) {
      return NextResponse.json({ error: 'Date of birth is required' }, { status: 400 })
    }

    // YYYY-MM-DD only — the <input type="date"> always emits this format.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    const dobDate = new Date(dob + 'T00:00:00Z')
    if (Number.isNaN(dobDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }

    // Age in years, calendar-correct (account for whether birthday has passed)
    const now = new Date()
    let age = now.getUTCFullYear() - dobDate.getUTCFullYear()
    const beforeBirthday =
      now.getUTCMonth() < dobDate.getUTCMonth() ||
      (now.getUTCMonth() === dobDate.getUTCMonth() && now.getUTCDate() < dobDate.getUTCDate())
    if (beforeBirthday) age -= 1

    if (age < 13) {
      // COPPA: we can't store data for under-13s. Delete the auth user we
      // just created so they don't end up with a dangling account.
      const service = createServiceClient()
      try {
        await (service as unknown as {
          auth: { admin: { deleteUser: (id: string) => Promise<unknown> } }
        }).auth.admin.deleteUser(user.id)
      } catch (err) {
        console.error('[register-extras] failed to delete under-13 auth user:', err)
      }
      return NextResponse.json(
        { error: 'You must be at least 13 years old to use FUSE-ID.' },
        { status: 403 },
      )
    }

    const service = createServiceClient()
    const acceptedAt = new Date().toISOString()

    // The role we read off auth user_metadata. handle_new_user() already
    // wrote it into profiles but we don't trust the client — re-resolve
    // here. Default to 'player' if unset.
    const role = ((user.user_metadata?.role as string | undefined) === 'parent') ? 'parent' : 'player'

    const profileUpdate: ProfileUpdateRow = {
      date_of_birth: dob,
      accepted_terms_at: acceptedAt,
      accepted_terms_version: TERMS_VERSION,
      accepted_privacy_at: acceptedAt,
      accepted_privacy_version: PRIVACY_VERSION,
    }

    const untypedUpd = service as unknown as {
      from: (t: string) => {
        update: (row: Record<string, unknown>) => {
          eq: (k: string, v: string) => Promise<{ error: unknown }>
        }
      }
    }
    const { error: profileErr } = await untypedUpd
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id)

    if (profileErr) {
      console.error('[register-extras] profile update failed:', profileErr)
      return NextResponse.json({ error: 'Could not save profile' }, { status: 500 })
    }

    // Parent flow: create a co_owner_invite for the athlete and send the
    // magic-link email. The invite has no player_id yet — that gets
    // populated either when the parent finishes the onboarding wizard
    // (where /api/player/setup creates the players row) or when the
    // athlete accepts the invite and we create a stub players row for them.
    if (role === 'parent' && body.player_email) {
      const inviteeEmail = body.player_email.trim().toLowerCase()
      const inviterEmail = (user.email ?? '').trim().toLowerCase()

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteeEmail)) {
        return NextResponse.json({ error: "Invalid athlete email" }, { status: 400 })
      }
      if (inviteeEmail === inviterEmail) {
        return NextResponse.json({ error: "Athlete email must be different from yours" }, { status: 400 })
      }

      const token = randomBytes(24).toString('base64url')
      const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

      const untypedInsert = service as unknown as {
        from: (t: string) => {
          insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>
        }
      }
      const { error: inviteErr } = await untypedInsert
        .from('co_owner_invites')
        .insert({
          invited_by_user_id: user.id,
          invitee_email: inviteeEmail,
          invitee_role: 'player',
          token,
          expires_at: expiresAt,
        })

      if (inviteErr) {
        console.error('[register-extras] co_owner_invite insert failed:', inviteErr)
        // Don't fail the whole registration — the parent can resend later.
      } else {
        // Fire the email but don't block on it
        await sendCoOwnerInviteEmail(inviterEmail, inviteeEmail, token)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[register-extras] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
