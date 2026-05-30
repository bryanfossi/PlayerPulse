'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronDown } from 'lucide-react'
import { brand } from '@/lib/brand'

const topLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
]

const sportLinks: { label: string; href: string; status: 'live' | 'soon' }[] = [
  { label: 'Soccer', href: '/soccer-recruiting', status: 'live' },
  { label: 'Volleyball', href: '/volleyball-recruiting', status: 'live' },
  { label: 'Football', href: '/football-recruiting', status: 'live' },
  { label: 'Basketball', href: '/basketball-recruiting', status: 'live' },
  { label: 'Baseball', href: '/baseball-recruiting', status: 'live' },
  { label: 'Lacrosse', href: '/lacrosse-recruiting', status: 'live' },
]

const trailingLinks = [
  { label: 'Blog', href: '/blog' },
]

function StatusBadge({ status }: { status: 'live' | 'soon' }) {
  const isLive = status === 'live'
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
      style={{
        color: isLive ? '#4ADE80' : '#9CA3AF',
        backgroundColor: isLive ? 'rgba(74,222,128,0.1)' : 'rgba(156,163,175,0.1)',
      }}
    >
      {isLive ? 'Live' : 'Soon'}
    </span>
  )
}

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sportsOpen, setSportsOpen] = useState(false)
  const sportsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the Sports dropdown when the user clicks outside or hits Escape.
  useEffect(() => {
    if (!sportsOpen) return
    const onClick = (e: MouseEvent) => {
      if (sportsRef.current && !sportsRef.current.contains(e.target as Node)) {
        setSportsOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSportsOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [sportsOpen])

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logo.full} alt={brand.appName} style={{ height: '32px', width: 'auto' }} />
        </Link>
      </div>

      {/* Desktop nav links */}
      <div className="hidden md:flex items-center gap-8">
        {topLinks.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="text-sm transition-colors hover:text-white"
            style={{ color: '#9CA3AF' }}
          >
            {l.label}
          </a>
        ))}

        {/* Sports dropdown */}
        <div ref={sportsRef} className="relative">
          <button
            type="button"
            onClick={() => setSportsOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-sm transition-colors hover:text-white"
            style={{ color: '#9CA3AF' }}
            aria-haspopup="menu"
            aria-expanded={sportsOpen}
          >
            Sports
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sportsOpen ? 'rotate-180' : ''}`} />
          </button>
          {sportsOpen && (
            <div
              role="menu"
              className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 rounded-lg border shadow-xl py-1.5 z-50"
              style={{ backgroundColor: '#1A1F38', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              {sportLinks.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  role="menuitem"
                  onClick={() => setSportsOpen(false)}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                  style={{ color: '#FFFFFF' }}
                >
                  <span>{s.label}</span>
                  <StatusBadge status={s.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {trailingLinks.map((l) => (
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
          className="text-sm font-medium px-4 py-1.5 rounded-md transition-colors"
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
          className="absolute top-16 left-0 right-0 border-b px-6 py-6 flex flex-col gap-4 md:hidden"
          style={{ backgroundColor: '#0F1120', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          {topLinks.map((l) => (
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

          {/* Sports section — flattened on mobile (no nested dropdown) */}
          <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#4ADE80' }}>
              Sports
            </p>
            <div className="flex flex-col gap-3 pl-1">
              {sportLinks.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between gap-3 text-sm transition-colors hover:text-white"
                  style={{ color: '#9CA3AF' }}
                >
                  <span>{s.label}</span>
                  <StatusBadge status={s.status} />
                </Link>
              ))}
            </div>
          </div>

          {trailingLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm transition-colors hover:text-white border-t pt-4"
              style={{ color: '#9CA3AF', borderColor: 'rgba(255,255,255,0.1)' }}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </a>
          ))}

          <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <Link
              href="/register"
              className="block text-sm font-medium px-4 py-2.5 rounded-md transition-colors text-center"
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
