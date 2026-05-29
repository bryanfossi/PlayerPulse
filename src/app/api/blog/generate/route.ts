/**
 * Daily blog generation cron endpoint.
 *
 * Triggered by Vercel Cron once per day at 06:00 UTC. Each run produces one
 * blog post per active sport (soccer, football, basketball, volleyball) into
 * the blog_posts table.
 *
 * AUTH: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`. Same
 * pattern as /api/admin/generate-article. The endpoint is also callable
 * by a logged-in admin (via the admin email allowlist) for manual runs.
 *
 * Required env vars:
 *   - ANTHROPIC_API_KEY     — Claude API key
 *   - CRON_SECRET           — shared secret Vercel sends in the Auth header
 *   - SUPABASE_SERVICE_ROLE — used by createServiceClient() for DB writes
 *   - (NEXT_PUBLIC_SUPABASE_URL and the publishable key as elsewhere)
 *
 * Optional env vars:
 *   - none — the generator does not call Serper, only Claude.
 */

import { NextResponse, type NextRequest } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/auth/admin'
import { generateDailyBlogPosts } from '@/lib/blog/postGenerator'

// 4 sport posts × ~30-60s each, run in parallel → ~60-120s typical.
// Cap at 300s to be safe.
export const maxDuration = 300

async function handler(request: NextRequest) {
  // Vercel Cron auth: Authorization: Bearer <CRON_SECRET>
  const auth = request.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET
  const isCron = !!cronSecret && auth === `Bearer ${cronSecret}`

  if (!isCron) {
    // Manual invocation — require an admin email
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  try {
    const result = await generateDailyBlogPosts()

    // Surface new posts on cached routes immediately
    revalidatePath('/blog')
    for (const r of result.results) {
      if (r.status === 'ok' && r.slug) {
        revalidatePath(`/blog/${r.slug}`)
      }
    }
    revalidatePath('/sitemap.xml')

    if (result.status !== 'ok') {
      Sentry.captureMessage(
        `[blog/generate] ${result.status} — ${result.results.filter((r) => r.status === 'error').length} sport(s) failed`,
        { level: result.status === 'error' ? 'error' : 'warning', tags: { feature: 'blog-generator-v2' }, extra: { result } }
      )
    }

    const httpStatus = result.status === 'error' ? 500 : 200
    return NextResponse.json(result, { status: httpStatus })
  } catch (err) {
    Sentry.captureException(err, { tags: { feature: 'blog-generator-v2' } })
    return NextResponse.json(
      { status: 'error', reason: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  return handler(request)
}

// Vercel Cron uses GET by default — accept both methods.
export async function GET(request: NextRequest) {
  return handler(request)
}
