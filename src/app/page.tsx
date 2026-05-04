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
  title: 'FuseID — Your College Recruiting Command Center',
  description:
    'AI-powered school matching, coach communication tracking, and real-time recruiting intelligence for serious college recruits. Organize your entire recruiting journey in one place.',
  openGraph: {
    title: 'FuseID — Your College Recruiting Command Center',
    description:
      'AI-powered school matching, coach communication tracking, and real-time recruiting intelligence for serious college recruits.',
    url: 'https://fuseid.app',
    siteName: 'FuseID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FuseID — College Recruiting, Fused.',
    description: 'AI-powered school matching and recruiting management for serious college recruits.',
  },
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
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
    <div className="min-h-screen bg-[#0F1120] text-white overflow-x-hidden">
      <MarketingNav />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="pt-40 pb-32 px-6 md:px-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-white/10 bg-[#1A1F38] text-xs font-semibold mb-6" style={{ color: '#4ADE80' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
          {activeSports.map((s) => s.name).join(' · ')} recruiting, organized
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl mx-auto">
          Your recruiting{' '}
          <span style={{ color: '#4ADE80' }}>command center.</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: '#9CA3AF' }}>
          AI-powered school matching, coach communication tracking, and real-time recruiting
          intelligence — all in one place.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-md font-bold text-base transition-colors"
            style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
          >
            Lock in $14.99/mo
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-md border font-medium text-base transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}
          >
            Sign in to your account
          </Link>
        </div>

        <p className="mt-4 text-xs" style={{ color: '#9CA3AF' }}>
          Early adopter pricing &nbsp;·&nbsp; locked in until you cancel
        </p>

        {/* Mock kanban dashboard */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="rounded-xl border p-5 text-left" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1A1F38' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
              <span className="ml-2 text-xs font-mono" style={{ color: '#9CA3AF' }}>fuseid · school board</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { tier: 'Researching', schools: ['Penn State', 'Ohio State'], pct: 30 },
                { tier: 'Contacted', schools: ['Villanova', 'Georgetown'], pct: 52 },
                { tier: 'Interested', schools: ['Wake Forest', 'Davidson'], pct: 74 },
                { tier: 'Offer Received', schools: ['Drexel', 'Loyola'], pct: 92 },
              ].map(({ tier, schools, pct }) => (
                <div key={tier} className="rounded-lg border p-3 space-y-2.5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#4ADE80' }}>{tier}</span>
                  </div>
                  {schools.map((s) => (
                    <div key={s} className="rounded-md border px-2.5 py-2" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#0F1120' }}>
                      <p className="text-xs font-medium truncate">{s}</p>
                      <div className="mt-1.5 h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-1 rounded-full" style={{ width: `${pct}%`, backgroundColor: '#4ADE80' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────── */}
      <section className="border-y px-6 md:px-12 py-10" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { stat: '2,400+', label: 'Schools tracked' },
            { stat: 'D1 – JUCO', label: 'All division levels' },
            { stat: 'AI-powered', label: 'School matching' },
            { stat: 'Real-time', label: 'Coach reply analysis' },
          ].map(({ stat, label }) => (
            <div key={label}>
              <p className="text-2xl font-black" style={{ color: '#4ADE80' }}>{stat}</p>
              <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="px-6 md:px-12 py-28 max-w-6xl mx-auto scroll-mt-16">
        <div className="text-center mb-16">
          <p className="fuse-label mb-3">Everything in one place</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            Stop managing recruiting<br />
            <span style={{ color: '#9CA3AF' }}>in spreadsheets.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: MapPin, title: 'AI School Matching', body: 'Get a ranked, scored list of schools that genuinely fit your level, location, academics, and playing style — not a generic search.' },
            { icon: Sparkles, title: 'AI Email Drafting', body: 'Generate personalized recruiting emails for any school — initial outreach, follow-ups, visit requests — in seconds.' },
            { icon: Trophy, title: 'Offer Tracker', body: 'Log and compare every scholarship offer — financial aid packages, division level, visit dates — side by side.' },
            { icon: MessageSquare, title: 'Coach Reply Analyzer', body: 'Paste any email from a coach and instantly know the real interest level, tone, and exactly what to do next.' },
            { icon: User, title: 'Parent Access', body: 'Invite a parent or guardian to view your recruiting board with a secure read-only link — no separate account needed.' },
            { icon: Coins, title: 'School Board', body: 'Kanban-style board to track every school across Researching, Contacted, Interested, and Offer Received stages.' },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border p-6 space-y-3 transition-colors hover:border-white/20"
              style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1A1F38' }}
            >
              <div className="w-10 h-10 rounded-md flex items-center justify-center border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <Icon className="w-5 h-5" style={{ color: '#4ADE80' }} />
              </div>
              <h3 className="font-bold">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 md:px-12 py-28 border-t scroll-mt-16" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="fuse-label mb-3">Simple by design</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Up and running in minutes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Build your profile', body: 'Enter your stats, GPA, position, graduation year, and target regions. FuseID uses this to calibrate every recommendation.' },
              { step: '02', title: 'Get your school list', body: 'Our AI ranks 2,400+ schools by fit score. Add any school to your board in one click and start tracking your progress.' },
              { step: '03', title: 'Manage your process', body: 'Log every call, email, and campus visit. Draft coach emails with AI. Track offers. Never miss a follow-up again.' },
            ].map(({ step, title, body }) => (
              <div key={step} className="relative pl-14">
                <span className="absolute left-0 top-0 text-5xl font-black leading-none select-none" style={{ color: 'rgba(255,255,255,0.05)' }}>
                  {step}
                </span>
                <div className="absolute left-0 top-1 w-8 h-8 rounded-md border flex items-center justify-center" style={{ borderColor: '#4ADE80', backgroundColor: '#1A1F38' }}>
                  <span className="text-xs font-bold" style={{ color: '#4ADE80' }}>{parseInt(step)}</span>
                </div>
                <h3 className="font-bold text-lg mb-2 mt-1">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 md:px-12 py-28 scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="fuse-label mb-3">Early adopter pricing</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">One plan. Everything you need.</h2>
            <p className="mt-4 max-w-xl mx-auto" style={{ color: '#9CA3AF' }}>
              Sign up now and lock in early adopter pricing — your $14.99/mo rate stays the same as long as you&apos;re subscribed.
            </p>
          </div>

          <div className="relative rounded-xl border p-8 space-y-6 max-w-md mx-auto" style={{ borderColor: '#4ADE80', backgroundColor: '#1A1F38' }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md border text-[11px] font-bold uppercase tracking-[0.08em]" style={{ borderColor: '#4ADE80', backgroundColor: '#0F1120', color: '#4ADE80' }}>
              Early Adopter Special
            </div>

            <div>
              <p className="fuse-label mb-2">FuseID Pro</p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black">$14.99</span>
                <span className="mb-1.5" style={{ color: '#9CA3AF' }}>/month</span>
                <span className="line-through ml-2 mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>$29</span>
              </div>
              <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Locked in until you cancel · cancel anytime</p>
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
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#4ADE80' }} />
                  {f}
                </li>
              ))}
            </ul>

            <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
              Tokens refresh monthly with your subscription. Need more? Buy a 30-token pack for $4.99 — pack tokens never expire.
            </p>

            <Link
              href="/register"
              className="block text-center px-6 py-3 rounded-md font-bold transition-colors"
              style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
            >
              Get started — $14.99/mo
            </Link>

            <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>
              Price increases to $29/mo for new signups after launch. Subscribe now to keep $14.99 forever.
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats / Trust ────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-20 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { stat: '78%', label: 'of recruits never follow up with coaches a second time' },
              { stat: '3×', label: 'more responses when emails are personalized by school' },
              { stat: '6 mo', label: 'average time coaches start tracking a recruit actively' },
            ].map(({ stat, label }) => (
              <div key={stat} className="rounded-xl border p-6" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1A1F38' }}>
                <p className="text-4xl font-black mb-2" style={{ color: '#4ADE80' }}>{stat}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <section className="px-6 md:px-12 pb-32 pt-10">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border p-12 text-center space-y-6" style={{ borderColor: '#4ADE80', backgroundColor: '#1A1F38' }}>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Ready to take control<br />of your recruiting?
            </h2>
            <p className="max-w-md mx-auto" style={{ color: '#9CA3AF' }}>
              Join players using FuseID to get more offers and make smarter decisions about their future.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md font-bold text-base transition-colors"
                style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
              >
                Lock in $14.99/mo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://calendar.app.google/96Z4Kgp9mLh35sMj9"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md border font-medium text-base transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.15)' }}
              >
                Book a consultation
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t px-6 md:px-12 py-10" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div className="space-y-3">
            <img src="/brand/logo-full.svg" alt="FuseID" style={{ height: '32px', width: 'auto' }} />
            <p className="text-xs leading-relaxed max-w-xs" style={{ color: '#9CA3AF' }}>
              The recruiting CRM for serious college athletes. AI-powered fit, organized outreach, every offer tracked.
            </p>
          </div>
          <div className="space-y-3">
            <p className="fuse-label">Product</p>
            <div className="flex flex-col gap-2">
              <a href="#features" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>Features</a>
              <a href="#how-it-works" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>How It Works</a>
              <a href="#pricing" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>Pricing</a>
              <Link href="/register" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>Get started</Link>
            </div>
          </div>
          <div className="space-y-3">
            <p className="fuse-label">Account</p>
            <div className="flex flex-col gap-2">
              <Link href="/login" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>Sign in</Link>
              <Link href="/register" className="text-sm transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>Create account</Link>
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
            <img src="/brand/logo-icon.svg" alt="FuseID" style={{ height: '18px', width: '18px' }} />
            <span className="text-xs" style={{ color: '#9CA3AF' }}>© 2026 FuseID. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: '#9CA3AF' }}>
            <Link href="/login" className="transition-colors hover:text-white">Sign in</Link>
            <Link href="/register" className="transition-colors hover:text-white">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
