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
  title: 'FUSE-ID | College Recruiting CRM',
  description: 'AI-powered college recruiting CRM. Find your fit, organize your outreach, track every offer.',
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
    var theme = saved === 'light' || saved === 'neutral' ? saved : 'dark';
    var root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'light') root.classList.add('theme-light');
    else if (theme === 'neutral') root.classList.add('theme-neutral');
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
