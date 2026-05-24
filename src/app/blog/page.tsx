import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { listArticles } from '@/lib/blog/db'

export const metadata: Metadata = {
  title: 'FuseID Blog — College Recruiting Insights',
  description:
    'Practical advice on the college recruiting process for soccer, basketball, football, and volleyball athletes. Timelines, email templates, scholarship strategy.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'FuseID Blog — College Recruiting Insights',
    description:
      'Practical advice on the college recruiting process for soccer, basketball, football, and volleyball athletes.',
    url: 'https://fuse-id.online/blog',
    siteName: 'FuseID',
    type: 'website',
  },
}

// Revalidate the blog index every 5 minutes so newly-generated articles
// show up without needing a redeploy.
export const revalidate = 300

const SPORT_COLOR: Record<string, string> = {
  soccer:     'text-[#4ADE80]',
  basketball: 'text-amber-300',
  football:   'text-red-300',
  volleyball: 'text-purple-300',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogIndexPage() {
  const articles = await listArticles(100)

  return (
    <div className="min-h-screen bg-[#0F1120] text-white">
      <MarketingNav />

      <section className="pt-32 pb-12 px-6 md:px-12 text-center">
        <p className="fuse-label mb-3">FuseID Blog</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">College Recruiting, Explained</h1>
        <p className="mt-4 max-w-2xl mx-auto text-base" style={{ color: '#9CA3AF' }}>
          Practical advice on getting recruited — timelines, email templates, scholarship strategy — for soccer, basketball, football, and volleyball athletes.
        </p>
      </section>

      <section className="px-6 md:px-12 pb-32 max-w-5xl mx-auto">
        {articles.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#9CA3AF' }}>
            <p className="text-sm">No articles yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group rounded-xl border border-white/10 bg-[#1A1F38] p-6 hover:border-[#4ADE80]/40 transition-colors flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-wider font-bold">
                  {article.sport && (
                    <span className={`${SPORT_COLOR[article.sport] ?? 'text-muted-foreground'}`}>
                      {article.sport}
                    </span>
                  )}
                  {article.sport && <span className="text-muted-foreground/40">·</span>}
                  <span className="text-muted-foreground">{formatDate(article.published_at)}</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight group-hover:text-[#4ADE80] transition-colors">
                  {article.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed flex-1" style={{ color: '#9CA3AF' }}>
                  {article.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#4ADE80] group-hover:gap-2 transition-all">
                  Read more <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
