import { NextResponse, type NextRequest } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/auth/admin'
import { generateNextArticle } from '@/lib/blog/generator'

// Claude generation + Serper + DB writes can take a while.
export const maxDuration = 300

/**
 * Triggered by:
 *   - Vercel Cron daily — uses CRON_SECRET via Authorization: Bearer header
 *   - Logged-in admin via UI / curl — email allowlist check
 */
export async function POST(request: NextRequest) {
  // Vercel Cron passes Authorization: Bearer <CRON_SECRET>
  // (Vercel auto-sets this; we just verify it matches our env var.)
  const auth = request.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET
  const isCron = cronSecret && auth === `Bearer ${cronSecret}`

  if (!isCron) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  try {
    const result = await generateNextArticle()

    if (result.status === 'ok') {
      // Surface the new article immediately on cached routes
      revalidatePath('/blog')
      revalidatePath(`/blog/${result.slug}`)
      revalidatePath('/sitemap.xml')
    }

    if (result.status === 'error') {
      Sentry.captureMessage(`[blog/generate] ${result.reason}`, { level: 'error', tags: { feature: 'blog-generator' } })
    }

    return NextResponse.json(result)
  } catch (err) {
    Sentry.captureException(err, { tags: { feature: 'blog-generator' } })
    return NextResponse.json(
      { status: 'error', reason: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

// Vercel Cron uses GET by default — accept both methods so the cron just works.
export const GET = POST
