import type { MetadataRoute } from 'next'
import { listAllSlugs } from '@/lib/blog/posts'

const BASE = 'https://fuse-id.online'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await listAllSlugs().catch((e) => {
    console.error('[sitemap] listAllSlugs failed:', e)
    return []
  })

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/`,
      changeFrequency: 'weekly',
      priority: 1.0,
      lastModified: new Date(),
    },
    {
      url: `${BASE}/soccer-recruiting`,
      changeFrequency: 'weekly',
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: `${BASE}/volleyball-recruiting`,
      changeFrequency: 'weekly',
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: `${BASE}/football-recruiting`,
      changeFrequency: 'weekly',
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: `${BASE}/basketball-recruiting`,
      changeFrequency: 'weekly',
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: `${BASE}/baseball-recruiting`,
      changeFrequency: 'weekly',
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: `${BASE}/lacrosse-recruiting`,
      changeFrequency: 'weekly',
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: `${BASE}/blog`,
      changeFrequency: 'daily',
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: `${BASE}/register`,
      changeFrequency: 'monthly',
      priority: 0.7,
      lastModified: new Date(),
    },
    {
      url: `${BASE}/login`,
      changeFrequency: 'yearly',
      priority: 0.3,
      lastModified: new Date(),
    },
  ]

  const postUrls: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
    lastModified: new Date(p.published_at),
  }))

  return [...staticUrls, ...postUrls]
}
