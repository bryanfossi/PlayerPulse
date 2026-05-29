import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { getPostBySlug, listAllSlugs, listRelatedPosts, type SportSlug } from '@/lib/blog/posts'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await listAllSlugs()
  return slugs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Post not found · FUSE-ID Blog' }

  const url = `https://fuse-id.online/blog/${post.slug}`
  return {
    title: { absolute: `${post.title} · FUSE-ID` },
    description: post.meta_description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.meta_description,
      url,
      siteName: 'FUSE-ID',
      type: 'article',
      publishedTime: post.published_at,
      authors: ['FUSE-ID'],
      tags: post.keywords,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.meta_description,
      images: ['/og-image.png'],
    },
  }
}

const SPORT_LABEL: Record<SportSlug, string> = {
  soccer: 'Soccer',
  football: 'Football',
  basketball: 'Basketball',
  volleyball: 'Volleyball',
}

const SPORT_COLOR: Record<SportSlug, string> = {
  soccer: 'text-[#4ADE80]',
  football: 'text-red-300',
  basketball: 'text-amber-300',
  volleyball: 'text-purple-300',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const related = await listRelatedPosts(post.sport, post.slug, 3)

  // Schema.org Article JSON-LD — includes sport context.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description,
    author: { '@type': 'Organization', name: 'FUSE-ID', url: 'https://fuse-id.online' },
    publisher: {
      '@type': 'Organization',
      name: 'FUSE-ID',
      logo: { '@type': 'ImageObject', url: 'https://fuse-id.online/brand/logo-full.svg' },
    },
    datePublished: post.published_at,
    dateModified: post.published_at,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://fuse-id.online/blog/${post.slug}` },
    about: { '@type': 'Sport', name: SPORT_LABEL[post.sport] },
    keywords: post.keywords.join(', '),
    image: 'https://fuse-id.online/og-image.png',
  }

  return (
    <div className="min-h-screen bg-[#0F1120] text-white">
      <MarketingNav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="pt-32 pb-16 px-6 md:px-12 max-w-3xl mx-auto">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-xs font-medium transition-colors mb-6 hover:text-white"
          style={{ color: '#9CA3AF' }}
        >
          <ArrowLeft className="w-3 h-3" />
          All posts
        </Link>

        <header className="space-y-3 mb-8">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold" style={{ color: '#9CA3AF' }}>
            <span className={SPORT_COLOR[post.sport]}>{SPORT_LABEL[post.sport]}</span>
            <span style={{ color: 'rgba(156,163,175,0.4)' }}>·</span>
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">{post.title}</h1>
          <p className="text-base leading-relaxed" style={{ color: '#9CA3AF' }}>
            {post.excerpt}
          </p>
        </header>

        <div className="prose prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-[15px] prose-li:leading-relaxed prose-a:text-[#4ADE80] prose-a:no-underline hover:prose-a:underline prose-strong:text-white max-w-none">
          <MDXRemote
            source={post.content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug],
              },
            }}
          />
        </div>

        {/* Closing CTA card */}
        <div className="mt-16 rounded-xl border p-6 md:p-8 text-center" style={{ borderColor: '#4ADE80', backgroundColor: '#1A1F38' }}>
          <h3 className="text-xl md:text-2xl font-bold mb-2">
            Ready to put this into action?
          </h3>
          <p className="text-sm mb-5 max-w-md mx-auto leading-relaxed" style={{ color: '#9CA3AF' }}>
            FUSE-ID is the free AI college recruiting platform — school matching, coach email
            drafting, and offer tracking, all in one place.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-bold text-sm transition-colors"
            style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
          >
            Start your free recruiting profile on FUSE-ID
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {post.keywords.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            {post.keywords.map((kw) => (
              <span
                key={kw}
                className="px-2.5 py-1 rounded-full border text-[10px] font-medium uppercase tracking-wider"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#9CA3AF' }}
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Related posts (same sport, 3 most recent) */}
      {related.length > 0 && (
        <section className="px-6 md:px-12 pb-24 max-w-5xl mx-auto">
          <p className="fuse-label mb-6 text-center">More {SPORT_LABEL[post.sport].toLowerCase()} recruiting posts</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="group rounded-xl border p-5 hover:border-[#4ADE80]/40 transition-colors flex flex-col"
                style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1A1F38' }}
              >
                <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-wider font-bold">
                  <span className={SPORT_COLOR[r.sport]}>{SPORT_LABEL[r.sport]}</span>
                  <span style={{ color: 'rgba(156,163,175,0.4)' }}>·</span>
                  <span style={{ color: '#9CA3AF' }}>{formatDate(r.published_at)}</span>
                </div>
                <h3 className="text-sm font-bold tracking-tight leading-snug group-hover:text-[#4ADE80] transition-colors flex-1">
                  {r.title}
                </h3>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[#4ADE80] group-hover:gap-2 transition-all">
                  Read <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <MarketingFooter />
    </div>
  )
}
