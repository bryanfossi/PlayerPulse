import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight, MapPin, Sparkles, Trophy,
  MessageSquare, User, Coins, Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { activeSports } from '@/lib/sports'
import { MarketingNav } from '@/components/marketing/MarketingNav'

export const metadata: Metadata = {
  title: 'PlayerPulse — Your College Recruiting Command Center',
  description:
    'AI-powered school matching, coach communication tracking, and real-time recruiting intelligence for serious college recruits. Organize your entire recruiting journey in one place.',
  openGraph: {
    title: 'PlayerPulse — Your College Recruiting Command Center',
    description:
      'AI-powered school matching, coach communication tracking, and real-time recruiting intelligence for serious college recruits.',
    url: 'https://playerpulse.app',
    siteName: 'PlayerPulse',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PlayerPulse — College Recruiting, Organized.',
    description: 'AI-powered school matching and recruiting management for serious college recruits.',
  },
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Only redirect if they've subscribed and completed onboarding
    const { createServiceClient } = await import('@/lib/supabase/server')
    const service = createServiceClient()
    const { data: player } = await service
      .from('players')
      .select('onboarding_complete')
      .eq('user_id', user.id)
      .maybeSingle()
    if (player?.onboarding_complete) redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#060e1c] text-white overflow-x-hidden">

      <MarketingNav />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-32 px-6 md:px-12 text-center">
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-24">
          <div className="w-[700px] h-[450px] rounded-full bg-green-500/8 blur-[140px]" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-semibold mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {activeSports.map((s) => s.name).join(' · ')} recruiting, organized
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl mx-auto">
          Your recruiting{' '}
          <span className="text-green-400">
            command center.
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
          AI-powered school matching, coach communication tracking, and real-time recruiting
          intelligence — all in one place.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-green-500 hover:bg-green-400 text-[#080f08] font-bold text-base transition-all hover:scale-105 shadow-lg shadow-green-500/25"
          >
            Lock in $14.99/mo
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-medium text-base transition-all"
          >
            Sign in to your account
          </Link>
        </div>

        <p className="mt-4 text-xs text-white/30">Early adopter pricing &nbsp;·&nbsp; locked in until you cancel</p>

        {/* Mock kanban dashboard */}
        <div className="mt-20 max-w-4xl mx-auto relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-green-500/10 to-transparent blur-xl" />
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 text-left shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-white/30 font-mono">playerPulse · school board</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  tier: 'Researching',
                  color: 'border-white/15 bg-white/[0.02]',
                  dot: 'bg-white/40',
                  schools: ['Penn State', 'Ohio State'],
                },
                {
                  tier: 'Contacted',
                  color: 'border-blue-500/30 bg-blue-500/5',
                  dot: 'bg-blue-400',
                  schools: ['Villanova', 'Georgetown'],
                },
                {
                  tier: 'Interested',
                  color: 'border-amber-500/30 bg-amber-500/5',
                  dot: 'bg-amber-400',
                  schools: ['Wake Forest', 'Davidson'],
                },
                {
                  tier: 'Offer Received',
                  color: 'border-green-500/30 bg-green-500/5',
                  dot: 'bg-green-400',
                  schools: ['Drexel', 'Loyola'],
                },
              ].map(({ tier, color, dot, schools }) => (
                <div key={tier} className={`rounded-xl border p-3 space-y-2.5 ${color}`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-[10px] font-bold text-white/60 leading-tight">{tier}</span>
                  </div>
                  {schools.map((s) => (
                    <div key={s} className="rounded-lg bg-white/5 border border-white/5 px-2.5 py-2">
                      <p className="text-xs font-medium text-white/80 truncate">{s}</p>
                      <div className="mt-1.5 h-1 rounded-full bg-white/10">
                        <div
                          className="h-1 rounded-full bg-green-400/60"
                          style={{ width: `${tier === 'Offer Received' ? 92 : tier === 'Interested' ? 74 : tier === 'Contacted' ? 52 : 30}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof / stats bar ──────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.015] px-6 md:px-12 py-10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { stat: '2,400+', label: 'Schools tracked' },
            { stat: 'D1 – JUCO', label: 'All division levels' },
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
      <section id="features" className="px-6 md:px-12 py-28 max-w-6xl mx-auto scroll-mt-16">
        <div className="text-center mb-16">
          <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">Everything in one place</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            Stop managing recruiting<br />
            <span className="text-white/35">in spreadsheets.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: MapPin,
              color: 'text-green-400',
              bg: 'bg-green-500/10 border-green-500/20',
              title: 'AI School Matching',
              body: 'Get a ranked, scored list of schools that genuinely fit your level, location, academics, and playing style — not a generic search.',
            },
            {
              icon: Sparkles,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10 border-blue-500/20',
              title: 'AI Email Drafting',
              body: 'Generate personalized recruiting emails for any school — initial outreach, follow-ups, visit requests — in seconds.',
            },
            {
              icon: Trophy,
              color: 'text-amber-400',
              bg: 'bg-amber-500/10 border-amber-500/20',
              title: 'Offer Tracker',
              body: 'Log and compare every scholarship offer — financial aid packages, division level, visit dates — side by side.',
            },
            {
              icon: MessageSquare,
              color: 'text-purple-400',
              bg: 'bg-purple-500/10 border-purple-500/20',
              title: 'Coach Reply Analyzer',
              body: 'Paste any email from a coach and instantly know the real interest level, tone, and exactly what to do next.',
            },
            {
              icon: User,
              color: 'text-rose-400',
              bg: 'bg-rose-500/10 border-rose-500/20',
              title: 'Parent Access',
              body: 'Invite a parent or guardian to view your recruiting board with a secure read-only link — no separate account needed.',
            },
            {
              icon: Coins,
              color: 'text-cyan-400',
              bg: 'bg-cyan-500/10 border-cyan-500/20',
              title: 'School Board',
              body: 'Kanban-style board to track every school across Researching, Contacted, Interested, and Offer Received stages.',
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

      {/* ── How It Works ────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 md:px-12 py-28 border-t border-white/5 scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">Simple by design</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Up and running in minutes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Build your profile',
                body: 'Enter your stats, GPA, position, graduation year, and target regions. PlayerPulse uses this to calibrate every recommendation.',
              },
              {
                step: '02',
                title: 'Get your school list',
                body: 'Our AI ranks 2,400+ schools by fit score. Add any school to your board in one click and start tracking your progress.',
              },
              {
                step: '03',
                title: 'Manage your process',
                body: 'Log every call, email, and campus visit. Draft coach emails with AI. Track offers. Never miss a follow-up again.',
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="relative pl-14">
                <span className="absolute left-0 top-0 text-5xl font-black text-white/8 leading-none select-none">
                  {step}
                </span>
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-400">{parseInt(step)}</span>
                </div>
                <h3 className="font-bold text-white text-lg mb-2 mt-1">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 md:px-12 py-28 scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">Early adopter pricing</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">One plan. Everything you need.</h2>
            <p className="mt-4 text-white/50 max-w-xl mx-auto">
              Sign up now and lock in early adopter pricing — your $14.99/mo rate stays the same as long as you&apos;re subscribed.
            </p>
          </div>

          {/* Single early-bird card */}
          <div className="relative rounded-2xl border border-green-500/40 bg-green-500/5 p-8 space-y-6 max-w-md mx-auto">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-bold uppercase tracking-wider">
              Early Adopter Special
            </div>

            <div>
              <p className="text-sm font-semibold text-green-400 uppercase tracking-widest mb-2">PlayerPulse Pro</p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black">$14.99</span>
                <span className="text-white/40 mb-1.5">/month</span>
                <span className="text-white/30 line-through ml-2 mb-1.5">$29</span>
              </div>
              <p className="text-sm text-white/40 mt-1">Locked in until you cancel · cancel anytime</p>
            </div>

            <ul className="space-y-3">
              {[
                'AI-powered Top 40 school matching',
                'Unlimited schools on your board',
                '30 monthly tokens included',
                'AI email drafting (1 token each)',
                'Single-school fit assessments (3 tokens)',
                'Coach reply analysis',
                'Offer tracker & comparisons',
                'Parent read-only link',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-xs text-white/40 leading-relaxed">
              Tokens refresh monthly with your subscription. Need more? Buy a 30-token pack for $4.99 — pack tokens never expire.
            </p>

            <Link
              href="/register"
              className="block text-center px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-[#080f08] font-bold transition-all hover:scale-[1.02] shadow-lg shadow-green-500/25"
            >
              Get started — $14.99/mo
            </Link>

            <p className="text-xs text-white/35 text-center">
              Price increases to $29/mo for new signups after launch. Subscribe now to keep $14.99 forever.
            </p>
          </div>
        </div>
      </section>

      {/* ── Trust / quote ────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center space-y-16">
          <blockquote className="space-y-4">
            <p className="text-2xl md:text-3xl font-bold text-white/90 leading-snug max-w-2xl mx-auto">
              &ldquo;Most recruits lose track of schools, miss follow-up windows, and send generic
              emails. PlayerPulse fixes all three.&rdquo;
            </p>
            <footer className="text-sm text-white/40">
              Promoted Soccer Consultants &mdash; college recruiting advisors since 2015
            </footer>
          </blockquote>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { stat: '78%', label: 'of recruits never follow up with coaches a second time' },
              { stat: '3×', label: 'more responses when emails are personalized by school' },
              { stat: '6 mo', label: 'average time coaches start tracking a recruit actively' },
            ].map(({ stat, label }) => (
              <div key={stat} className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
                <p className="text-4xl font-black text-green-400 mb-2">{stat}</p>
                <p className="text-sm text-white/45 leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <section className="px-6 md:px-12 pb-32 pt-10">
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-green-500 hover:bg-green-400 text-[#080f08] font-bold text-base transition-all hover:scale-105 shadow-xl shadow-green-500/20"
              >
                Lock in $14.99/mo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://calendar.app.google/96Z4Kgp9mLh35sMj9"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-medium text-base transition-all"
              >
                Book a free consultation
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 md:px-12 py-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div className="space-y-3">
            <img src="/brand/logo-full.svg" alt="PlayerPulse" style={{ height: '32px', width: 'auto' }} />
            <p className="text-xs text-white/35 leading-relaxed max-w-xs">
              Your recruiting process, organized. Built by Promoted Soccer Consultants for serious college recruits.
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40">Product</p>
            <div className="flex flex-col gap-2">
              <a href="#features" className="text-sm text-white/50 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-white/50 hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</a>
              <Link href="/register" className="text-sm text-white/50 hover:text-white transition-colors">Get started</Link>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40">Promoted Soccer</p>
            <div className="flex flex-col gap-2">
              <a
                href="https://www.promotedsoccerconsultants.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                PromotedSoccerConsultants.com
              </a>
              <a
                href="https://calendar.app.google/96Z4Kgp9mLh35sMj9"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Free Consultation
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/brand/logo-icon.svg" alt="PlayerPulse" style={{ height: '18px', width: '18px' }} />
            <span className="text-xs text-white/25">© 2025 Promoted Soccer Consultants. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/25">
            <Link href="/login" className="hover:text-white/50 transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-white/50 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
