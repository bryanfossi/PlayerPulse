import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { getArticleBySlug, listArticleSlugs } from '@/lib/blog/db'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 300

// Pre-render article pages at build time when possible — newly-generated
// articles still work via on-demand rendering + ISR.
export async function generateStaticParams() {
  const slugs = await listArticleSlugs()
  return slugs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return { title: 'Article not found · FuseID Blog' }

  const url = `https://fuse-id.online/blog/${article.slug}`
  return {
    title: `${article.title} · FuseID`,
    description: article.description,
    keywords: article.tags,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.description,
      url,
      siteName: 'FuseID',
      type: 'article',
      publishedTime: article.published_at,
      authors: ['FuseID'],
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
    },
  }
}

const SPORT_LABEL: Record<string, string> = {
  soccer: 'Soccer',
  basketball: 'Basketball',
  football: 'Football',
  volleyball: 'Volleyball',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  // Schema.org Article JSON-LD for rich-result eligibility.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: { '@type': 'Organization', name: 'FuseID', url: 'https://fuse-id.online' },
    publisher: {
      '@type': 'Organization',
      name: 'FuseID',
      logo: { '@type': 'ImageObject', url: 'https://fuse-id.online/brand/logo-full.svg' },
    },
    datePublished: article.published_at,
    dateModified: article.published_at,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://fuse-id.online/blog/${article.slug}` },
    keywords: article.tags.join(', '),
  }

  return (
    <div className="min-h-screen bg-[#0F1120] text-white">
      <MarketingNav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="pt-32 pb-24 px-6 md:px-12 max-w-3xl mx-auto">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-3 h-3" />
          All articles
        </Link>

        <header className="space-y-3 mb-8">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
            {article.sport && SPORT_LABEL[article.sport] && (
              <>
                <span className="text-[#4ADE80]">{SPORT_LABEL[article.sport]}</span>
                <span className="text-muted-foreground/40">·</span>
              </>
            )}
            <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">{article.title}</h1>
          <p className="text-base leading-relaxed" style={{ color: '#9CA3AF' }}>
            {article.description}
          </p>
        </header>

        <div className="prose prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-[15px] prose-li:leading-relaxed prose-a:text-[#4ADE80] prose-a:no-underline hover:prose-a:underline prose-strong:text-white max-w-none">
          <MDXRemote
            source={article.body}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug],
              },
            }}
          />
        </div>

        {/* Closing CTA */}
        <div className="mt-16 rounded-xl border border-[#4ADE80]/30 bg-[#4ADE80]/5 p-6 text-center">
          <h3 className="text-lg font-bold mb-2">Ready to take recruiting seriously?</h3>
          <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>
            FuseID is a free tool that helps you organize your recruiting list, draft AI emails to coaches, and track every offer in one place.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-[#4ADE80] text-[#0F1120] font-bold text-sm hover:bg-[#22C55E] transition-colors"
          >
            Get started — free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {article.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 pt-6 border-t border-white/10">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}
