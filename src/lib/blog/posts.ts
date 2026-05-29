/**
 * Read helpers for the blog_posts table (migration 022).
 *
 * The blog_posts table isn't in the generated database.ts (we don't regen
 * types per project rule), so we cast to an untyped builder shape and
 * project the result into the BlogPost interface below.
 *
 * This module replaces lib/blog/db.ts for the new daily-generated blog.
 * lib/blog/db.ts is left in place for the old fuse_articles pipeline.
 */

import { createServiceClient } from '@/lib/supabase/server'

export type SportSlug = 'soccer' | 'football' | 'basketball' | 'volleyball'
export type PostType = 'college_specific' | 'tips_guide'

export const ACTIVE_SPORTS: SportSlug[] = ['soccer', 'football', 'basketball', 'volleyball']

export interface BlogPost {
  id: string
  title: string
  slug: string
  sport: SportSlug
  post_type: PostType
  school_name: string | null
  content: string
  excerpt: string
  meta_description: string
  keywords: string[]
  published_at: string
  created_at: string
}

const POST_COLS =
  'id, title, slug, sport, post_type, school_name, content, excerpt, meta_description, keywords, published_at, created_at'

type AnyClient = ReturnType<typeof createServiceClient>

interface SelectChain<T> {
  order: (col: string, opts: { ascending: boolean }) => SelectChain<T>
  eq: (col: string, val: string) => SelectChain<T>
  neq: (col: string, val: string) => SelectChain<T>
  lte: (col: string, val: string) => SelectChain<T>
  limit: (n: number) => Promise<{ data: T[] | null; error: unknown }>
  range: (from: number, to: number) => Promise<{ data: T[] | null; count: number | null; error: unknown }>
  maybeSingle: () => Promise<{ data: T | null; error: unknown }>
}

interface QueryRoot {
  select: (cols: string, opts?: { count?: 'exact' }) => SelectChain<BlogPost>
}

function fromPosts(client: AnyClient): QueryRoot {
  return (client as unknown as { from: (t: string) => QueryRoot }).from('blog_posts')
}

const nowIso = () => new Date().toISOString()

export async function listPosts(limit = 12, offset = 0, sport?: SportSlug): Promise<{ posts: BlogPost[]; total: number }> {
  const service = createServiceClient()
  let q = fromPosts(service)
    .select(POST_COLS, { count: 'exact' })
    .lte('published_at', nowIso())
    .order('published_at', { ascending: false })
  if (sport) q = q.eq('sport', sport)

  const { data, count, error } = await q.range(offset, offset + limit - 1)
  if (error) {
    console.error('[blog] listPosts failed:', error)
    return { posts: [], total: 0 }
  }
  return { posts: data ?? [], total: count ?? 0 }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const service = createServiceClient()
  const { data, error } = await fromPosts(service)
    .select(POST_COLS)
    .eq('slug', slug)
    .lte('published_at', nowIso())
    .maybeSingle()
  if (error) {
    console.error('[blog] getPostBySlug failed:', error)
    return null
  }
  return data
}

/** Three most recent posts in the same sport, excluding the current post. */
export async function listRelatedPosts(sport: SportSlug, excludeSlug: string, limit = 3): Promise<BlogPost[]> {
  const service = createServiceClient()
  const { data, error } = await fromPosts(service)
    .select(POST_COLS)
    .eq('sport', sport)
    .neq('slug', excludeSlug)
    .lte('published_at', nowIso())
    .order('published_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('[blog] listRelatedPosts failed:', error)
    return []
  }
  return data ?? []
}

export async function listAllSlugs(): Promise<{ slug: string; published_at: string }[]> {
  const { posts } = await listPosts(1000, 0)
  return posts.map((p) => ({ slug: p.slug, published_at: p.published_at }))
}
