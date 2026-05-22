import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/blog'],
        disallow: ['/dashboard', '/admin', '/api', '/onboarding'],
      },
    ],
    sitemap: 'https://fuse-id.online/sitemap.xml',
    host: 'https://fuse-id.online',
  }
}
