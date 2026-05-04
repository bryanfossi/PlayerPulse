'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { brand } from '@/lib/brand'

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 transition-colors duration-200 ${
        scrolled ? 'border-b' : ''
      }`}
      style={{
        backgroundColor: scrolled ? '#0F1120' : 'transparent',
        borderColor: scrolled ? 'rgba(255,255,255,0.1)' : 'transparent',
      }}
    >
      {/* Logo + brand */}
      <div className="flex items-center gap-3">
        <Link href="/">
          <img src={brand.logo.full} alt={brand.appName} style={{ height: '32px', width: 'auto' }} />
        </Link>
      </div>

      {/* Desktop nav links */}
      <div className="hidden md:flex items-center gap-8">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="text-sm transition-colors hover:text-white"
            style={{ color: '#9CA3AF' }}
          >
            {l.label}
          </a>
        ))}
      </div>

      {/* Desktop CTAs */}
      <div className="hidden md:flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm transition-colors hover:text-white px-3 py-1.5"
          style={{ color: '#9CA3AF' }}
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="text-sm font-semibold px-4 py-1.5 rounded-md transition-colors"
          style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
        >
          Get started
        </Link>
      </div>

      {/* Mobile: always-visible Sign in + hamburger */}
      <div className="md:hidden flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm transition-colors hover:text-white"
          style={{ color: '#9CA3AF' }}
        >
          Sign in
        </Link>
        <button
          className="p-1 transition-colors hover:text-white"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          style={{ color: '#9CA3AF' }}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="absolute top-16 left-0 right-0 border-b px-6 py-5 flex flex-col gap-4 md:hidden"
          style={{ backgroundColor: '#0F1120', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm transition-colors hover:text-white"
              style={{ color: '#9CA3AF' }}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <Link
              href="/register"
              className="block text-sm font-semibold px-4 py-2.5 rounded-md transition-colors text-center"
              style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
              onClick={() => setMenuOpen(false)}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
