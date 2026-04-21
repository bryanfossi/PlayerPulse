import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight, Zap, Target, MessageSquareQuote,
  BarChart3, Shield, Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#080f08] text-white overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-[#080f08]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center">
            <span className="text-[#080f08] font-black text-xs">PP</span>
          </div>
          <span className="font-bold tracking-tight">PlayerPulse</span>
          <span className="hidden sm:block text-xs text-white/30 font-medium border-l border-white/10 pl-2.5 ml-0.5">by Promoted Soccer Consultants</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5">
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold bg-green-500 hover:bg-green-400 text-[#080f08] px-4 py-1.5 rounded-lg transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-32 px-6 md:px-12 text-center">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-24">
          <div className="w-[600px] h-[400px] rounded-full bg-green-500/10 blur-[120px]" />
        </div>

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-semibold mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Built for serious college soccer recruits
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl mx-auto">
          Your recruiting{' '}
          <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
            command center.
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
          AI-powered school matching, coach communication tracking, and real-time recruiting intelligence — all in one place.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-green-500 hover:bg-green-400 text-[#080f08] font-bold text-base transition-all hover:scale-105 shadow-lg shadow-green-500/25"
          >
            Start for free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-medium text-base transition-all"
          >
            Sign in to your account
          </Link>
        </div>

        {/* Hero card mock */}
        <div className="mt-20 max-w-3xl mx-auto relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-green-500/10 to-transparent blur-xl" />
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-left shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-white/30 font-mono">playerPulse · school board</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { tier: 'Lock', color: 'border-green-500/40 bg-green-500/5', dot: 'bg-green-400', schools: ['Duke University', 'Georgetown', 'Wake Forest'] },
                { tier: 'Realistic', color: 'border-blue-500/40 bg-blue-500/5', dot: 'bg-blue-400', schools: ['Villanova', 'Loyola Chicago', 'Davidson'] },
                { tier: 'Reach', color: 'border-amber-500/40 bg-amber-500/5', dot: 'bg-amber-400', schools: ['UNC Chapel Hill', 'Notre Dame', 'Stanford'] },
              ].map(({ tier, color, dot, schools }) => (
                <div key={tier} className={`rounded-xl border p-3 space-y-2.5 ${color}`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-xs font-bold text-white/70">{tier}</span>
                  </div>
                  {schools.map((s) => (
                    <div key={s} className="rounded-lg bg-white/5 border border-white/5 px-3 py-2">
                      <p className="text-xs font-medium text-white/80 truncate">{s}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <div className="h-1 flex-1 rounded-full bg-white/10">
                          <div className="h-1 rounded-full bg-green-400/60" style={{ width: `${Math.floor(Math.random() * 40) + 55}%` }} />
                        </div>
                        <span className="text-[9px] text-white/30">{Math.floor(Math.random() * 20) + 70}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.02] px-6 md:px-12 py-10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { stat: '2,400+', label: 'Schools in database' },
            { stat: 'D1–JUCO', label: 'All division levels' },
            { stat: 'AI-powered', label: 'School matching' },
            { stat: 'Real-time', label: 'Coach reply analysis' },
          ].map(({ stat, label }) => (
            <div key={label}>
              <p className="text-2xl font-black text-green-400">{stat}</p>
              <p className="text-sm text-white/40 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-28 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">Everything in one place</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            Stop managing recruiting<br />
            <span className="text-white/40">in spreadsheets.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Target,
              color: 'text-green-400',
              bg: 'bg-green-500/10 border-green-500/20',
              title: 'AI Match Engine',
              body: 'Get a ranked, scored list of schools that genuinely fit your level, location, academics, and playing style — not just a generic search.',
            },
            {
              icon: MessageSquareQuote,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10 border-blue-500/20',
              title: 'Coach Reply Analyzer',
              body: 'Paste any email from a coach and instantly know the real interest level, tone, and exactly what to do next.',
            },
            {
              icon: Zap,
              color: 'text-amber-400',
              bg: 'bg-amber-500/10 border-amber-500/20',
              title: 'AI Email Drafting',
              body: 'Generate personalized recruiting emails for any school — initial outreach, follow-ups, visit requests — in seconds.',
            },
            {
              icon: BarChart3,
              color: 'text-purple-400',
              bg: 'bg-purple-500/10 border-purple-500/20',
              title: 'School Board',
              body: 'Kanban-style board to track every school across Lock, Realistic, and Reach tiers with status, notes, and scores.',
            },
            {
              icon: Shield,
              color: 'text-rose-400',
              bg: 'bg-rose-500/10 border-rose-500/20',
              title: 'Communications Log',
              body: 'Every call, email, and campus visit in a clean timeline. Never lose track of who said what or when to follow up.',
            },
            {
              icon: Users,
              color: 'text-cyan-400',
              bg: 'bg-cyan-500/10 border-cyan-500/20',
              title: 'Parent Access',
              body: 'Invite a parent or guardian to view your recruiting board with a secure read-only link — no separate account needed.',
            },
          ].map(({ icon: Icon, color, bg, title, body }) => (
            <div
              key={title}
              className={`rounded-2xl border p-6 space-y-3 hover:bg-white/5 transition-colors ${bg}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <h3 className="font-bold text-white">{title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 pb-32">
        <div className="max-w-3xl mx-auto relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/5 blur-2xl" />
          <div className="relative rounded-3xl border border-green-500/20 bg-green-500/5 p-12 text-center space-y-6">
            <p className="text-green-400 text-xs font-bold uppercase tracking-widest">Promoted Soccer Consultants</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Ready to take control<br />of your recruiting?
            </h2>
            <p className="text-white/50 max-w-md mx-auto">
              Join players using PlayerPulse to get more offers and make smarter decisions about their future.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-green-500 hover:bg-green-400 text-[#080f08] font-bold text-base transition-all hover:scale-105 shadow-xl shadow-green-500/20"
            >
              Create your free account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 md:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
            <span className="text-[#080f08] font-black text-[9px]">PP</span>
          </div>
          <span className="text-xs text-white/30">© 2025 Promoted Soccer Consultants. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-white/30">
          <Link href="/login" className="hover:text-white/60 transition-colors">Sign in</Link>
          <Link href="/register" className="hover:text-white/60 transition-colors">Register</Link>
        </div>
      </footer>
    </div>
  )
}
