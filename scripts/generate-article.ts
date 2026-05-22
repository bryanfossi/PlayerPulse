/**
 * Local CLI for the blog generator. Pulls the highest-priority unused
 * keyword from Supabase, runs the full pipeline, and prints a summary.
 *
 * Usage:
 *   npx tsx scripts/generate-article.ts
 *
 * Reads from .env.local (loaded by tsx if present) — same env vars as
 * the prod API route: ANTHROPIC_API_KEY, SERPER_API_KEY (optional),
 * NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY.
 */

import { generateNextArticle } from '../src/lib/blog/generator'

async function main() {
  console.log('[generate-article] starting…')
  const result = await generateNextArticle()

  if (result.status === 'ok') {
    console.log('\n  Generated article')
    console.log('  Keyword: ', result.keyword)
    console.log('  Title:   ', result.title)
    console.log('  Slug:    ', result.slug)
    console.log('  Words:   ', result.wordCount)
    console.log(`\n  URL: https://fuse-id.online/blog/${result.slug}`)
    process.exit(0)
  }

  if (result.status === 'no_keywords') {
    console.log('\n  All keywords exhausted — add more to fuse_keywords in Supabase.')
    process.exit(0)
  }

  console.error('\n  Generation failed:', result.reason)
  process.exit(1)
}

main().catch((err) => {
  console.error('[generate-article] unhandled error:', err)
  process.exit(1)
})
