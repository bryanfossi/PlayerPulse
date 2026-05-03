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
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 transition-all duration-300 ${
        scrolled ? 'bg-[#060e1c]/95 backdrop-blur-md border-b border-white/8 shadow-xl shadow-black/20' : 'bg-transparent'
      }`}
    >
      {/* Logo + brand */}
      <div className="flex items-center gap-3">
        <Link href="/">
          <img src={brand.logo.full} alt={brand.appName} style={{ height: '38px', width: 'auto' }} />
        </Link>
        <span className="hidden sm:block text-xs text-white/25 font-medium border-l border-white/10 pl-3 ml-1">
          by Promoted Soccer Consultants
        </span>
      </div>

      {/* Desktop nav links */}
      <div className="hidden md:flex items-center gap-8">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            {l.label}
          </a>
        ))}
      </div>

      {/* Desktop CTAs */}
      <div className="hidden md:flex items-center gap-3">
        <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5">
          Sign in
        </Link>
        <Link
          href="/register"
          className="text-sm font-semibold bg-green-500 hover:bg-green-400 text-[#080f08] px-4 py-1.5 rounded-lg transition-colors"
        >
          Get started free
        </Link>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden text-white/70 hover:text-white p-1"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-[#060e1c]/98 border-b border-white/8 px-6 py-5 flex flex-col gap-4 md:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-white/70 hover:text-white transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <div className="border-t border-white/8 pt-4 flex flex-col gap-3">
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-green-500 hover:bg-green-400 text-[#080f08] px-4 py-2.5 rounded-lg transition-colors text-center"
              onClick={() => setMenuOpen(false)}
            >
              Get started free
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
