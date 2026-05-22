import type { MetadataRoute } from 'next'
import { listArticleSlugs } from '@/lib/blog/db'

const BASE = 'https://fuse-id.online'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await listArticleSlugs().catch((e) => {
    console.error('[sitemap] listArticleSlugs failed:', e)
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

  const articleUrls: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE}/blog/${a.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
    lastModified: new Date(a.published_at),
  }))

  return [...staticUrls, ...articleUrls]
}
