import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/api/invites/accept',
  '/api/stripe/webhook',
  '/api/contacts/inbound',
  '/player/',
  '/brand/',
]
const AUTH_PATHS = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let static assets and API routes through (except protected API routes)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/schools/search')
  ) {
    return NextResponse.next()
  }

  // Inject pathname into request headers so server components can read it via headers()
  const { supabaseResponse, user } = await updateSession(request, { 'x-pathname': pathname })

  // Not authenticated → redirect to login (unless already on a public path)
  if (!user) {
    const isPublic = pathname === '/' || PUBLIC_PATHS.some((p) => pathname.startsWith(p))
    if (!isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Authenticated → redirect away from auth pages to dashboard
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Onboarding completeness check is handled inside the dashboard layout
  // to avoid a DB call on every middleware invocation.

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
