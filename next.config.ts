import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'kzuzdsxnnujibtkxrcfs.supabase.co' },
    ],
  },
  // Silence Turbopack warning — no webpack customization needed
  turbopack: {},
}

export default nextConfig
