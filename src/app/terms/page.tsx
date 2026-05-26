import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { TERMS_MD } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Terms of Service · FUSE-ID',
  description: 'The Terms of Service governing your use of the FUSE-ID platform.',
  alternates: { canonical: '/terms' },
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0f1120] text-white">
      <MarketingNav />
      <article className="pt-32 pb-24 px-6 md:px-12 max-w-3xl mx-auto">
        <div className="prose prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-4xl prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-[15px] prose-li:leading-relaxed prose-a:text-[#4ade80] prose-a:no-underline hover:prose-a:underline prose-strong:text-white max-w-none">
          <MDXRemote source={TERMS_MD} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
        </div>
      </article>
    </div>
  )
}
