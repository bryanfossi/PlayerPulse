import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
import Script from 'next/script'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

// DM Sans is the only brand font. Inter was removed per FUSE-ID brand kit.
const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://fuse-id.online'),
  title: {
    default: 'FUSE-ID | AI College Recruiting Platform for Student-Athletes and Parents',
    template: '%s · FUSE-ID',
  },
  description:
    'Find your best-fit college program with AI school matching, coach email drafting, offer tracking, and net-cost estimates. Affordable recruiting software for soccer and volleyball athletes.',
  keywords: [
    'AI college recruiting platform',
    'college recruiting software',
    'recruiting CRM for athletes',
    'AI school matching',
    'AI coach email generator',
    'scholarship offer tracker',
    'college recruiting for parents',
    'student-athlete recruiting',
    'D1 recruiting',
    'D2 recruiting',
    'D3 recruiting',
    'NAIA recruiting',
    'NJCAA recruiting',
    'JUCO recruiting',
    'college soccer recruiting',
    'college volleyball recruiting',
    'how to email a college coach',
    'NCSA alternative',
    'SportsRecruits alternative',
    'FieldLevel alternative',
  ],
  applicationName: 'FUSE-ID',
  authors: [{ name: 'FUSE-ID' }],
  creator: 'FUSE-ID',
  publisher: 'FUSE-ID',
  category: 'sports',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    siteName: 'FUSE-ID',
    locale: 'en_US',
    url: 'https://fuse-id.online',
    title: 'FUSE-ID | AI College Recruiting Platform for Student-Athletes and Parents',
    description:
      'AI school matching, coach email drafting, offer tracking, and net-cost estimates. Affordable recruiting software for soccer and volleyball athletes.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FUSE-ID — the college recruiting CRM for athletes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@fuseid',
    creator: '@fuseid',
    title: 'FUSE-ID | AI College Recruiting Platform for Student-Athletes and Parents',
    description:
      'AI school matching, coach email drafting, offer tracking, and net-cost estimates — built for soccer and volleyball recruits.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
}

// JSON-LD: SoftwareApplication describes the FUSE-ID product for search engines
// and AI answer engines (ChatGPT, Perplexity, Google AI Overviews). Rendered on
// every page since it's product-level metadata, not page-specific.
const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FUSE-ID',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Sports Recruiting CRM',
  operatingSystem: 'Web',
  url: 'https://fuse-id.online',
  description:
    'AI college recruiting platform for student-athletes and parents. AI school matching against 2,400+ NCAA, NAIA, and NJCAA programs across 8 fit dimensions, AI coach email drafting, scholarship offer tracking with net-cost estimates, and AI profile gap analysis. Built for soccer and volleyball recruits.',
  offers: [
    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Starter', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Pro', priceCurrency: 'USD' },
  ],
  audience: {
    '@type': 'Audience',
    audienceType: 'High school and club student-athletes (and their parents) pursuing college recruitment',
  },
  featureList: [
    'AI school matching across 2,400+ D1, D2, D3, NAIA, and NJCAA programs',
    '8-dimension fit score: academics, location, position, division, campus size, merit aid potential, and more',
    'AI coach email generator for initial outreach, follow-ups, thank-yous, visit requests, and offer responses',
    'Recruiting pipeline board with Kanban, list, and Top 10 views',
    'Scholarship offer tracker with net-cost estimates after financial and merit aid',
    'AI profile gap analysis',
    'Parent and guardian read-only access plus shareable public profile URL',
  ],
  publisher: { '@type': 'Organization', name: 'FUSE-ID', url: 'https://fuse-id.online' },
}

export const viewport: Viewport = {
  themeColor: '#0F1120',
}

// Tiny pre-hydration script that sets the dark class before React mounts.
// Prevents flash of light-mode content for users on dark. Reads the same
// localStorage key ThemeProvider uses.
const themeBootstrap = `
(function() {
  try {
    var saved = localStorage.getItem('fuseid-theme');
    if (saved !== 'light') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive">{themeBootstrap}</Script>
        <Script
          id="ld-software-application"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
        />
      </head>
      <body className={`${dmSans.variable} antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
