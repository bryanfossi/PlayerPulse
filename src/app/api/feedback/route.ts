import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const FEEDBACK_RECIPIENT = 'bryan.fossi@promotedsoccerconsultants.com'

const ALLOWED_TYPES = ['bug', 'feature', 'question', 'other'] as const
type FeedbackType = (typeof ALLOWED_TYPES)[number]

function normalizeType(v: unknown): FeedbackType {
  if (typeof v === 'string' && (ALLOWED_TYPES as readonly string[]).includes(v)) {
    return v as FeedbackType
  }
  return 'other'
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: {
      message?: string
      type?: string
      page_url?: string
    } = await request.json()

    const message = body.message?.trim()
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 chars)' }, { status: 400 })
    }

    const type = normalizeType(body.type)
    const userAgent = request.headers.get('user-agent') ?? null
    const service = createServiceClient()

    // 1) Always persist to DB (durable audit trail). `type` is defined in
    //    migration 017 and not in the generated database.ts yet, so go
    //    untyped here.
    const untypedInsert = service as unknown as {
      from: (t: string) => {
        insert: (row: Record<string, unknown>) => {
          select: (cols: string) => {
            single: () => Promise<{ data: { id: string } | null; error: unknown }>
          }
        }
      }
    }
    const { data: row, error: insertErr } = await untypedInsert
      .from('feedback')
      .insert({
        user_id: user.id,
        email: user.email ?? null,
        page_url: body.page_url ?? null,
        user_agent: userAgent,
        message,
        type,
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('[feedback] insert failed:', insertErr)
      return NextResponse.json({ error: 'Could not save feedback' }, { status: 500 })
    }

    // 2) Try to email if Resend is configured. Failure here is non-fatal —
    //    the feedback is already saved.
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      try {
        const typeLabel = type[0].toUpperCase() + type.slice(1)
        const subject = `[${typeLabel}] FuseID feedback from ${user.email ?? 'a user'}`
        const html = `
          <h2>New FuseID feedback</h2>
          <p><strong>Type:</strong> ${typeLabel}</p>
          <p><strong>From:</strong> ${user.email ?? '(no email)'}</p>
          <p><strong>User ID:</strong> ${user.id}</p>
          ${body.page_url ? `<p><strong>Page:</strong> ${body.page_url}</p>` : ''}
          ${userAgent ? `<p><strong>User-Agent:</strong> ${userAgent}</p>` : ''}
          <hr />
          <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            Saved to feedback table as ${row?.id ?? '(unknown id)'}.
          </p>
        `
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL ?? 'FuseID <feedback@fuse-id.online>',
            to: FEEDBACK_RECIPIENT,
            reply_to: user.email ?? undefined,
            subject,
            html,
          }),
        })
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          console.error('[feedback] Resend send failed:', res.status, text)
        }
      } catch (err) {
        console.error('[feedback] email send threw:', err)
      }
    } else {
      console.warn('[feedback] RESEND_API_KEY not set — feedback saved to DB but no email sent')
    }

    // 3) Optionally forward to a Google Sheet via Apps Script Web App.
    //    Same pattern as the email — fire-and-forget, non-fatal on failure.
    const sheetUrl = process.env.FEEDBACK_SHEET_WEBHOOK_URL
    const sheetSecret = process.env.FEEDBACK_SHEET_SECRET
    if (sheetUrl && sheetSecret) {
      try {
        const sheetRes = await fetch(sheetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: sheetSecret,
            email: user.email ?? null,
            page_url: body.page_url ?? null,
            user_agent: userAgent,
            message,
            type,
          }),
          // Apps Script can be slow on first request; give it 10s.
          signal: AbortSignal.timeout(10_000),
        })
        if (!sheetRes.ok) {
          console.error('[feedback] sheet webhook returned', sheetRes.status)
        }
      } catch (err) {
        console.error('[feedback] sheet webhook threw:', err)
      }
    }

    return NextResponse.json({ success: true, id: row?.id })
  } catch (err) {
    console.error('[feedback] unexpected error:', err)
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
