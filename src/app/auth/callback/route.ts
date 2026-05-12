import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Supabase email-confirmation / magic-link callback.
 * Exchanges the ?code= parameter for a session cookie, then redirects.
 *
 * Set the Site URL in Supabase to https://fuse-id.online — Supabase will
 * automatically append /auth/callback?code=... to the redirect for email
 * flows (or include the full URL in the email templates).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Successful exchange — redirect to the desired destination
      return NextResponse.redirect(new URL(next, url.origin))
    }
    console.error('[auth/callback] exchange failed:', error.message)
    return NextResponse.redirect(new URL(`/login?error=callback&reason=${encodeURIComponent(error.message)}`, url.origin))
  }

  // No code in URL — bounce them to login
  return NextResponse.redirect(new URL('/login', url.origin))
}
