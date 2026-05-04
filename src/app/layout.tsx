import type { Metadata, Viewport } from 'next'
import { Inter, DM_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' })
const dmSans = DM_Sans({ variable: '--font-dm-sans', subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'FuseID | College Recruiting CRM',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${dmSans.variable} antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
