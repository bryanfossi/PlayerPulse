import Link from 'next/link'

export function MarketingFooter() {
  return (
    <footer className="border-t px-6 md:px-12 py-10" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-full.svg" alt="FUSE-ID" style={{ height: '32px', width: 'auto' }} />
          <p className="text-xs leading-relaxed max-w-xs" style={{ color: '#9CA3AF' }}>
            The AI college recruiting platform built for student-athletes and the parents in their corner.
          </p>
        </div>
        <div className="space-y-3">
          <p className="fuse-label">Product</p>
          <div className="flex flex-col gap-2">
            <Link href="/#features" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>Features</Link>
            <Link href="/#how-it-works" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>How It Works</Link>
            <Link href="/#pricing" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>Pricing</Link>
            <Link href="/#compare" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>Compare</Link>
            <Link href="/#parents" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>For Parents</Link>
            <Link href="/#faq" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>FAQ</Link>
            <Link href="/blog" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>Blog</Link>
          </div>
        </div>
        <div className="space-y-3">
          <p className="fuse-label">Sports</p>
          <div className="flex flex-col gap-2">
            <Link href="/soccer-recruiting" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>Soccer Recruiting</Link>
            <Link href="/volleyball-recruiting" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>Volleyball Recruiting</Link>
            <Link href="/football-recruiting" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>Football Recruiting</Link>
            <Link href="/basketball-recruiting" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>Basketball Recruiting</Link>
            <Link href="/login" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>Sign in</Link>
            <a
              href="https://calendar.app.google/96Z4Kgp9mLh35sMj9"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm transition-colors hover:text-white"
              style={{ color: '#9CA3AF' }}
            >
              Book a consultation
            </a>
          </div>
        </div>
      </div>
      <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-icon.svg" alt="FUSE-ID" style={{ height: '18px', width: '18px' }} />
          <span className="text-xs" style={{ color: '#9CA3AF' }}>© 2026 FUSE-ID. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6 text-xs" style={{ color: '#9CA3AF' }}>
          <Link href="/terms" className="transition-colors hover:text-white">Terms</Link>
          <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
          <Link href="/login" className="transition-colors hover:text-white">Sign in</Link>
          <Link href="/register" className="transition-colors hover:text-white">Register</Link>
        </div>
      </div>
    </footer>
  )
}
