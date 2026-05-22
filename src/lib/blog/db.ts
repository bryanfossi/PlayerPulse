/**
 * Read helpers for blog articles. fuse_* tables aren't in the generated
 * database.ts (we don't regen types per project rule), so we go untyped
 * here and shape the result via interfaces below.
 */

import { createServiceClient } from '@/lib/supabase/server'

export type SportSlug = 'soccer' | 'basketball' | 'football' | 'volleyball'

export interface BlogArticle {
  id: string
  keyword: string
  slug: string
  title: string
  description: string
  body: string
  tags: string[]
  sport: SportSlug | null
  word_count: number | null
  published_at: string
}

type AnyClient = ReturnType<typeof createServiceClient>

function untypedFrom(client: AnyClient, table: string) {
  return (client as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        order: (col: string, opts: { ascending: boolean }) => {
          limit: (n: number) => Promise<{ data: BlogArticle[] | null; error: unknown }>
        }
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{ data: BlogArticle | null; error: unknown }>
        }
      }
    }
  }).from(table)
}

export async function listArticles(limit = 100): Promise<BlogArticle[]> {
  const service = createServiceClient()
  const { data, error } = await untypedFrom(service, 'fuse_articles')
    .select('id, keyword, slug, title, description, body, tags, sport, word_count, published_at')
    .order('published_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('[blog] listArticles failed:', error)
    return []
  }
  return data ?? []
}

export async function getArticleBySlug(slug: string): Promise<BlogArticle | null> {
  const service = createServiceClient()
  const { data, error } = await untypedFrom(service, 'fuse_articles')
    .select('id, keyword, slug, title, description, body, tags, sport, word_count, published_at')
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error('[blog] getArticleBySlug failed:', error)
    return null
  }
  return data
}

export async function listArticleSlugs(): Promise<{ slug: string; published_at: string }[]> {
  const articles = await listArticles(1000)
  return articles.map((a) => ({ slug: a.slug, published_at: a.published_at }))
}
