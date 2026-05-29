import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const ALLOWED_SPORTS = ['volleyball', 'basketball', 'football', 'lacrosse', 'baseball'] as const
type WaitlistSport = (typeof ALLOWED_SPORTS)[number]

function normalizeSport(v: unknown): WaitlistSport | null {
  if (typeof v === 'string' && (ALLOWED_SPORTS as readonly string[]).includes(v)) {
    return v as WaitlistSport
  }
  return null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const body: {
      email?: string
      sport?: string
      source?: string
    } = await request.json()

    const email = body.email?.trim().toLowerCase()
    if (!email || !EMAIL_RE.test(email) || email.length > 320) {
      return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 })
    }

    const sport = normalizeSport(body.sport)
    const source = typeof body.source === 'string' ? body.source.slice(0, 120) : null
    const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null

    // The generated database.ts type doesn't know about waitlist_signups yet,
    // so we cast to the untyped insert shape like /api/feedback does for
    // migration-fresh tables.
    const service = createServiceClient()
    const untyped = service as unknown as {
      from: (t: string) => {
        upsert: (
          row: Record<string, unknown>,
          opts: { onConflict: string; ignoreDuplicates: boolean }
        ) => Promise<{ error: unknown }>
      }
    }

    const { error } = await untyped
      .from('waitlist_signups')
      .upsert(
        { email, sport, source, user_agent: userAgent },
        { onConflict: 'email,sport', ignoreDuplicates: true }
      )

    if (error) {
      console.error('[waitlist] insert failed:', error)
      return NextResponse.json({ error: 'Could not join the waitlist' }, { status: 500 })
    }

    // Optional admin notification via Resend — non-fatal on failure.
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      try {
        const subject = `[Waitlist] ${sport ?? 'unknown sport'} — ${email}`
        const html = `
          <h2>New FUSE-ID waitlist signup</h2>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Sport:</strong> ${escapeHtml(sport ?? '(none)')}</p>
          ${source ? `<p><strong>Source:</strong> ${escapeHtml(source)}</p>` : ''}
        `
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL ?? 'FUSE-ID <feedback@fuse-id.online>',
            to: 'bryan.fossi@promotedsoccerconsultants.com',
            subject,
            html,
          }),
        })
      } catch (err) {
        console.error('[waitlist] email send threw:', err)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[waitlist] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
