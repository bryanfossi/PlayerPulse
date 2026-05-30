import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { ACTIVE_SPORTS, listPosts, type SportSlug } from '@/lib/blog/posts'

export const metadata: Metadata = {
  title: {
    absolute: 'FUSE-ID Blog | College Recruiting Tips, Guides & School Spotlights',
  },
  description:
    'Daily college recruiting tips, division-by-division guides, and school-by-school spotlights for soccer, football, basketball, and volleyball recruits.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'FUSE-ID Blog | College Recruiting Tips, Guides & School Spotlights',
    description:
      'Daily college recruiting tips, division-by-division guides, and school spotlights for soccer, football, basketball, and volleyball recruits.',
    url: 'https://fuse-id.online/blog',
    siteName: 'FUSE-ID',
    type: 'website',
    images: [
      { url: '/og-image.png', width: 1200, height: 630, alt: 'FUSE-ID Blog' },
    ],
  },
}

// Revalidate every 5 minutes so newly-generated posts appear without redeploy.
export const revalidate = 300

const POSTS_PER_PAGE = 12

const SPORT_LABEL: Record<SportSlug, string> = {
  soccer: 'Soccer',
  football: 'Football',
  basketball: 'Basketball',
  volleyball: 'Volleyball',
  baseball: 'Baseball',
  lacrosse: 'Lacrosse',
}

// Sport → text color (matches existing pattern)
const SPORT_COLOR: Record<SportSlug, string> = {
  soccer: 'text-[#4ADE80]',
  football: 'text-red-300',
  basketball: 'text-amber-300',
  volleyball: 'text-purple-300',
  baseball: 'text-blue-300',
  lacrosse: 'text-cyan-300',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function parseSport(v: unknown): SportSlug | undefined {
  if (typeof v !== 'string') return undefined
  return (ACTIVE_SPORTS as readonly string[]).includes(v) ? (v as SportSlug) : undefined
}

function parsePage(v: unknown): number {
  const n = typeof v === 'string' ? parseInt(v, 10) : NaN
  return Number.isFinite(n) && n >= 1 ? n : 1
}

interface PageProps {
  searchParams: Promise<{ sport?: string; page?: string }>
}

export default async function BlogIndexPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const sport = parseSport(sp.sport)
  const page = parsePage(sp.page)
  const offset = (page - 1) * POSTS_PER_PAGE

  const { posts, total } = await listPosts(POSTS_PER_PAGE, offset, sport)
  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE))

  const tabs: { key: 'all' | SportSlug; label: string; href: string }[] = [
    { key: 'all', label: 'All', href: '/blog' },
    ...ACTIVE_SPORTS.map((s) => ({ key: s, label: SPORT_LABEL[s], href: `/blog?sport=${s}` })),
  ]
  const activeTab: 'all' | SportSlug = sport ?? 'all'

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    if (sport) params.set('sport', sport)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/blog?${qs}` : '/blog'
  }

  return (
    <div className="min-h-screen bg-[#0F1120] text-white">
      <MarketingNav />

      <section className="pt-32 pb-10 px-6 md:px-12 text-center">
        <p className="fuse-label mb-3">FUSE-ID Blog</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          College Recruiting, <span style={{ color: '#4ADE80' }}>Explained.</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-base" style={{ color: '#9CA3AF' }}>
          Daily recruiting tips, division-by-division guides, and school spotlights for soccer,
          football, basketball, and volleyball recruits.
        </p>
      </section>

      {/* Filter tabs */}
      <section className="px-6 md:px-12">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-2 mb-10">
          {tabs.map((t) => {
            const isActive = t.key === activeTab
            return (
              <Link
                key={t.key}
                href={t.href}
                className="px-4 py-1.5 rounded-md border text-sm font-medium transition-colors"
                style={{
                  borderColor: isActive ? '#4ADE80' : 'rgba(255,255,255,0.1)',
                  backgroundColor: isActive ? 'rgba(74,222,128,0.1)' : 'transparent',
                  color: isActive ? '#4ADE80' : '#9CA3AF',
                }}
              >
                {t.label}
              </Link>
            )
          })}
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16 max-w-5xl mx-auto">
        {posts.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#9CA3AF' }}>
            <p className="text-sm">No posts yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-xl border p-6 hover:border-[#4ADE80]/40 transition-colors flex flex-col"
                style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1A1F38' }}
              >
                <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-wider font-bold">
                  <span className={SPORT_COLOR[post.sport]}>{SPORT_LABEL[post.sport]}</span>
                  <span style={{ color: 'rgba(156,163,175,0.4)' }}>·</span>
                  <span style={{ color: '#9CA3AF' }}>{formatDate(post.published_at)}</span>
                </div>
                <h2 className="text-lg font-bold tracking-tight leading-snug group-hover:text-[#4ADE80] transition-colors">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed flex-1" style={{ color: '#9CA3AF' }}>
                  {post.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#4ADE80] group-hover:gap-2 transition-all">
                  Read more <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav
            className="mt-12 flex items-center justify-center gap-2"
            aria-label="Pagination"
          >
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors hover:border-white/30"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#9CA3AF' }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </Link>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-medium opacity-40"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#9CA3AF' }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </span>
            )}
            <span className="px-3 text-xs" style={{ color: '#9CA3AF' }}>
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors hover:border-white/30"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#9CA3AF' }}
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-medium opacity-40"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#9CA3AF' }}
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            )}
          </nav>
        )}
      </section>

      <MarketingFooter />
    </div>
  )
}
