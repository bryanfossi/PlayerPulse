import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight, MapPin, Sparkles, Trophy,
  Check, HelpCircle,
  KanbanSquare, ClipboardCheck, Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { activeSports } from '@/lib/sports'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SUBSCRIPTION_TIERS, TOKEN_PACKS } from '@/lib/tokens/costs'

export const metadata: Metadata = {
  title: {
    absolute:
      'FUSE-ID | AI College Recruiting Platform for Student-Athletes and Parents',
  },
  description:
    'Find your best-fit college program with AI school matching, coach email drafting, offer tracking, and net-cost estimates. Affordable recruiting software for soccer and volleyball athletes.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'FUSE-ID | AI College Recruiting Platform for Student-Athletes and Parents',
    description:
      'AI school matching across 2,400+ programs, AI coach email drafting, offer tracking with net-cost estimates, and parent access — built for soccer and volleyball recruits.',
    url: 'https://fuse-id.online',
    siteName: 'FUSE-ID',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FUSE-ID — the AI college recruiting platform for student-athletes and parents',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FUSE-ID | AI College Recruiting Platform',
    description:
      'AI school matching, coach email drafting, offer tracking, and net-cost estimates — built for soccer and volleyball recruits.',
    images: ['/og-image.png'],
  },
}

// FAQ content — also emitted as FAQPage JSON-LD below so AI answer engines
// (ChatGPT, Perplexity, Google AI Overviews) can lift answers cleanly. Keep
// answers self-contained and factual; they appear verbatim in structured data.
const faqs = [
  {
    q: 'How does college athletic recruiting work?',
    a: 'College athletic recruiting is the process by which high school and club athletes get noticed, evaluated, and offered roster spots or scholarships by college coaches. Most recruits build a list of target schools across NCAA Division 1, Division 2, Division 3, NAIA, and JUCO levels, share game film and stats, email coaches with a personalized introduction, attend ID camps or unofficial visits, and track every conversation through to an offer. FUSE-ID gives recruits an AI-ranked school list and a CRM-style dashboard to manage every step in one place.',
  },
  {
    q: 'How do I email a college coach about recruiting?',
    a: 'A good first email to a college coach is short (under 200 words), personalized to that specific program, and includes: your name, graduation year, position, club or high school team, key stats and a current GPA, a 1-2 sentence reason you are interested in that program, and a link to a highlight reel. Avoid mass-blasted templates. FUSE-ID generates a personalized first email — and follow-ups — for any school on your board using the coach name, program style, and your profile, so each outreach feels written for that school.',
  },
  {
    q: 'What do college coaches look for in a recruit?',
    a: 'College coaches evaluate four areas: on-field ability (verifiable through film, stats, and live evaluations at camps or showcases), athleticism and physical projection, academics (GPA, test scores, and major fit — especially critical for D3, Ivy League, and academic-first programs), and character (coachability, work ethic, and how the recruit communicates). At every division level, coaches also weigh roster needs by position and graduation year, so timing and fit matter as much as raw talent.',
  },
  {
    q: 'When should student-athletes start the recruiting process?',
    a: 'Most serious recruits begin building a target school list and reaching out to coaches in 9th or 10th grade. NCAA contact rules vary by sport and division — Division 1 coaches generally cannot initiate contact until June 15 after sophomore year or September 1 of junior year — but recruits can email coaches and attend camps at any age. Starting earlier means more time to refine your list, build relationships, and create film. FUSE-ID is built for athletes 13 and older.',
  },
  {
    q: 'What is the difference between D1, D2, D3, NAIA, and JUCO?',
    a: 'NCAA Division 1 schools have the largest athletic budgets and offer the most athletic scholarships, with the highest competitive level in most sports. Division 2 offers partial athletic scholarships and a strong balance of athletics and academics. Division 3 does not offer athletic scholarships but uses academic aid and need-based aid, and is the largest division by school count. NAIA schools (separate from the NCAA) can offer athletic scholarships and often have more flexible recruiting rules. JUCO (junior college, governed by the NJCAA) offers two-year programs that are a strong path for late developers or recruits looking to transfer up to a four-year program.',
  },
  {
    q: 'Do I need a recruiting service or CRM to get recruited?',
    a: 'You do not need one to get recruited — many athletes manage outreach with spreadsheets and inboxes. But the recruits who get the most coach replies tend to share three habits: a curated school list that matches their level, personalized (not template) emails per school, and disciplined follow-up. FUSE-ID exists to make those three habits the default — AI-ranked school matching, AI-personalized emails per school, and a kanban board that tells you exactly who is owed a follow-up next.',
  },
  {
    q: 'Which sports does FUSE-ID support?',
    a: 'FUSE-ID is built for college soccer and college volleyball recruiting today, with sport-specific stat fields, division structures, scholarship rules, and an AI school-matching model calibrated separately per sport. Additional sports are on the roadmap.',
  },
  {
    q: 'Can parents use FUSE-ID alongside their athlete?',
    a: 'Yes. FUSE-ID is built for student-athletes and the parents in their corner. The athlete invites a parent or guardian via a secure read-only link — no separate account needed, no risk of accidentally editing the recruiting board. Parents can see every school being tracked, every coach interaction, and every offer as it comes in.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
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
      .or(`user_id.eq.${user.id},co_owner_user_id.eq.${user.id}`)
      .maybeSingle()
    if (player?.onboarding_complete) redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0F1120] text-white overflow-x-hidden">
      <MarketingNav />

      {/* FAQ JSON-LD — surfaces answers in Google AI Overviews, ChatGPT, Perplexity */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="pt-40 pb-32 px-6 md:px-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-white/10 bg-[#1A1F38] text-xs font-medium mb-6" style={{ color: '#4ADE80' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
          {activeSports.map((s) => s.name).join(' · ')} recruiting, organized
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl mx-auto">
          The AI college recruiting platform built for student-athletes —{' '}
          <span style={{ color: '#4ADE80' }}>and the parents in their corner.</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: '#9CA3AF' }}>
          Your AI match engine scores your profile against 2,400+ college programs across D1, D2,
          D3, NAIA, and NJCAA — then helps you reach coaches, track offers, and calculate your real
          cost. No consultants. No confusion. Just a clear path forward.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-md font-bold text-base transition-colors"
            style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
          >
            Start for free — no credit card
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-md border font-medium text-base transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}
          >
            See how it works
          </a>
        </div>

        <p className="mt-4 text-xs" style={{ color: '#9CA3AF' }}>
          <Link href="/login" className="hover:text-white transition-colors">Already have an account? Sign in</Link>
        </p>

        {/* Mock kanban dashboard */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="rounded-xl border p-6 text-left" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1A1F38' }}>
            <div className="flex items-center gap-3 mb-6">
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
                    <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: '#4ADE80' }}>{tier}</span>
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

      {/* ── Social proof bar ───────────────────────────────────── */}
      <section className="border-y px-6 md:px-12 py-10" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            '2,400+ college programs scored against your profile',
            '8 fit dimensions — academics, location, position, merit aid, and more',
            'Free to start — most athletes pay less than $10/month',
            'Built for soccer and volleyball athletes (more sports coming)',
          ].map((line) => (
            <div key={line} className="flex items-start gap-3">
              <Check className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: '#4ADE80' }} />
              <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{line}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem ──────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-28">
        <div className="max-w-3xl mx-auto text-center">
          <p className="fuse-label mb-3">The problem</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
            College recruiting shouldn&apos;t feel like<br />
            <span style={{ color: '#9CA3AF' }}>a second job.</span>
          </h2>
          <p className="mt-6 text-base md:text-lg leading-relaxed" style={{ color: '#9CA3AF' }}>
            Most athletes are managing spreadsheets, guessing which schools are a real fit, and
            sending generic emails that coaches ignore. Meanwhile, the platforms built to help charge
            $100&ndash;$200/month and bury you in consultant calls instead of answers.
          </p>
          <p className="mt-4 text-base md:text-lg font-bold" style={{ color: '#4ADE80' }}>
            There&apos;s a better way.
          </p>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="px-6 md:px-12 py-28 max-w-6xl mx-auto scroll-mt-16 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="text-center mb-16">
          <p className="fuse-label mb-3">What FUSE-ID does</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Everything you need to run<br />
            <span style={{ color: '#9CA3AF' }}>your own recruiting.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: MapPin,
              label: 'AI School Matching',
              title: 'Find your best-fit schools in minutes, not months.',
              body: 'Your FUSE-ID profile gets scored against 2,400+ programs across 8 fit dimensions — academic fit, geographic preference, positional need, division level, campus size, merit aid potential, and more. The result is a ranked school list built around you, not a generic search filter. Stop guessing. Start knowing.',
              callout: 'Your personalized fit score — updated every time your profile changes.',
            },
            {
              icon: Sparkles,
              label: 'AI Coach Email Generator',
              title: 'Write coach emails that actually get responses.',
              body: 'The AI coach email generator drafts personalized outreach for every stage of the recruiting process: initial contact, follow-up, thank-you notes, campus visit requests, and offer responses. Each email is tailored to the school and your profile — not a template coaches have seen a hundred times.',
              callout: 'Five email types. Drafted in seconds. Sounding like you wrote every word.',
            },
            {
              icon: KanbanSquare,
              label: 'Recruiting Pipeline Board',
              title: 'Your entire recruiting journey, organized on one board.',
              body: 'Track every school you’re pursuing — from first research to offer received — on a Kanban-style pipeline with Board, List, and Top 10 views. Log calls, campus visits, and coach interactions. Nothing slips through the cracks when your whole process lives in one place.',
              callout: 'Switch between views. Always know exactly where you stand with every program.',
            },
            {
              icon: Trophy,
              label: 'Scholarship Offer Tracker',
              title: 'Know what a school will actually cost you.',
              body: 'Log every scholarship offer side by side and let FUSE-ID calculate the net cost after financial aid and merit awards. Comparing a full-ride at a D2 school to a partial scholarship at D1 is a real decision — you deserve real numbers to make it.',
              callout: 'Net-cost estimates built in. Compare apples to apples, not sticker prices.',
            },
            {
              icon: ClipboardCheck,
              label: 'AI Profile Gap Analysis',
              title: 'Know what coaches will see — before they see it.',
              body: 'Your AI profile gap analysis reviews your recruiting profile and flags what’s missing, what’s weak, and what could be stronger. Coaches form opinions fast. Get ahead of it with a profile that represents your best self on and off the field.',
              callout: 'Specific, actionable feedback — not generic tips.',
            },
            {
              icon: Users,
              label: 'Parent Access + Shareable Profile',
              title: 'Keep parents in the loop without handing over the wheel.',
              body: 'Invite a parent or guardian to view your full recruiting board with a secure, read-only link — no separate account needed. And when a coach asks for more info, share your public recruiting profile URL in seconds. Everything they need. Nothing they can change by accident.',
              callout: 'Parent visibility built in. Your profile, shareable in one click.',
            },
          ].map(({ icon: Icon, label, title, body, callout }) => (
            <div
              key={label}
              className="rounded-xl border p-6 flex flex-col gap-3 transition-colors hover:border-white/20"
              style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1A1F38' }}
            >
              <div className="w-10 h-10 rounded-md flex items-center justify-center border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <Icon className="w-5 h-5" style={{ color: '#4ADE80' }} />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4ADE80' }}>{label}</p>
              <h3 className="font-bold text-lg leading-snug">{title}</h3>
              <p className="text-sm leading-relaxed flex-1" style={{ color: '#9CA3AF' }}>{body}</p>
              <p className="mt-2 pt-3 border-t text-xs italic leading-relaxed" style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#4ADE80' }}>
                {callout}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 md:px-12 py-28 border-t scroll-mt-16" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="fuse-label mb-3">Simple by design</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              How college recruiting works on FUSE-ID
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-sm md:text-base" style={{ color: '#9CA3AF' }}>
              Three steps from sign-up to your first personalized email to a college coach.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Build your profile', body: 'Enter your stats, GPA, position, graduation year, and target regions. FUSE-ID uses this to calibrate every recommendation.' },
              { step: '02', title: 'Get your school list', body: 'Our AI ranks 2,400+ schools by fit score. Add any school to your board in one click and start tracking your progress.' },
              { step: '03', title: 'Manage your process', body: 'Log every call, email, and campus visit. Draft coach emails with AI. Track offers. Never miss a follow-up again.' },
            ].map(({ step, title, body }) => (
              <div key={step} className="relative pl-14">
                <span className="absolute left-0 top-0 text-5xl font-bold leading-none select-none" style={{ color: 'rgba(255,255,255,0.05)' }}>
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="fuse-label mb-3">Pricing</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Serious recruiting tools.<br />
              <span style={{ color: '#9CA3AF' }}>Not serious prices.</span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto" style={{ color: '#9CA3AF' }}>
              Start completely free — run your AI school match at signup, explore the full
              platform, and only upgrade when you&apos;re ready to send your first coach email.
              Most athletes never pay more than $9.99/month.
            </p>
          </div>

          {/* 3-column plan grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {/* Free */}
            <div className="rounded-xl border p-6 flex flex-col gap-6" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1A1F38' }}>
              <div>
                <p className="fuse-label mb-2">Free</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="mb-1 text-sm" style={{ color: '#9CA3AF' }}>/forever</span>
                </div>
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Get your bearings, then upgrade when you need AI tokens.</p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {[
                  'AI-powered Top 40 school matching (1 free run)',
                  'Full recruiting dashboard + kanban board',
                  'Offer tracker',
                  'Coach communication log',
                  'Free AI profile tips',
                  'Buy token packs as you need them',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#4ADE80' }} />
                    <span style={{ color: '#9CA3AF' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="block text-center px-6 py-2.5 rounded-md font-bold text-sm transition-colors border"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}
              >
                Start free
              </Link>
            </div>

            {/* Starter */}
            <div className="rounded-xl border p-6 flex flex-col gap-6" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1A1F38' }}>
              <div>
                <p className="fuse-label mb-2">{SUBSCRIPTION_TIERS.starter.label}</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">${(SUBSCRIPTION_TIERS.starter.priceCents / 100).toFixed(2)}</span>
                  <span className="mb-1 text-sm" style={{ color: '#9CA3AF' }}>/month</span>
                </div>
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>For athletes actively reaching out to coaches.</p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {[
                  `${SUBSCRIPTION_TIERS.starter.monthlyTokens} AI tokens / month (auto-refresh)`,
                  'Everything in Free, plus:',
                  'AI email drafting (1 token / draft)',
                  'Unlimited match list reruns (10 tokens each)',
                  'Tokens roll into a fresh batch monthly',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#4ADE80' }} />
                    <span style={{ color: '#9CA3AF' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="block text-center px-6 py-2.5 rounded-md font-bold text-sm transition-colors border"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}
              >
                Choose Starter
              </Link>
            </div>

            {/* Pro — highlighted */}
            <div className="relative rounded-xl border p-6 flex flex-col gap-6" style={{ borderColor: '#4ADE80', backgroundColor: '#1A1F38' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md border text-[11px] font-bold uppercase tracking-widest" style={{ borderColor: '#4ADE80', backgroundColor: '#0F1120', color: '#4ADE80' }}>
                Most popular
              </div>

              <div>
                <p className="fuse-label mb-2">{SUBSCRIPTION_TIERS.pro.label}</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">${(SUBSCRIPTION_TIERS.pro.priceCents / 100).toFixed(2)}</span>
                  <span className="mb-1 text-sm" style={{ color: '#9CA3AF' }}>/month</span>
                </div>
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>For athletes serious about their recruiting cycle.</p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {[
                  `${SUBSCRIPTION_TIERS.pro.monthlyTokens} AI tokens / month (auto-refresh)`,
                  'Everything in Starter, plus:',
                  'Coach email analyzer + sentiment scoring',
                  'Single-school fit assessments (3 tokens)',
                  'Parent read-only access link',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#4ADE80' }} />
                    <span style={{ color: '#9CA3AF' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="block text-center px-6 py-2.5 rounded-md font-bold text-sm transition-colors"
                style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
              >
                Choose Pro
              </Link>
            </div>
          </div>

          {/* Token packs note */}
          <div className="mt-10 max-w-3xl mx-auto rounded-lg border p-6 text-center" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1A1F38' }}>
            <p className="text-sm font-medium mb-2">Need more tokens? Top up anytime.</p>
            <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
              One-time token packs — never expire. Available to every tier, including Free.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
              {(['mini', 'standard', 'max'] as const).map((id) => {
                const pack = TOKEN_PACKS[id]
                return (
                  <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#0F1120' }}>
                    <span className="font-bold" style={{ color: '#4ADE80' }}>{pack.label}</span>
                    <span style={{ color: '#9CA3AF' }}>·</span>
                    <span>{pack.amount} tokens</span>
                    <span style={{ color: '#9CA3AF' }}>·</span>
                    <span className="font-medium">${(pack.priceCents / 100).toFixed(2)}</span>
                  </span>
                )
              })}
            </div>
          </div>

          <p className="mt-6 text-xs text-center" style={{ color: '#9CA3AF' }}>
            FUSE-ID is for athletes 13 and older. Cancel any subscription anytime — no contracts, no fees.
          </p>
        </div>
      </section>

      {/* ── Competitor comparison ──────────────────────────────── */}
      <section id="compare" className="px-6 md:px-12 py-28 border-t scroll-mt-16" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="fuse-label mb-3">Compare</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Why athletes choose FUSE-ID over<br />
              <span style={{ color: '#9CA3AF' }}>NCSA, SportsRecruits, and FieldLevel</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                lead: 'Actually affordable.',
                body: 'NCSA charges $99–$200+/month and locks core features behind consultant packages. FUSE-ID starts free and maxes out at $19.99/month — with token packs for athletes who just need a burst of AI power.',
              },
              {
                lead: 'AI-native from day one.',
                body: 'Unlike FieldLevel and SportsRecruits, FUSE-ID was built around AI — not bolted on. Your match scores, email drafts, and profile analysis are powered by the same technology, not a separate add-on.',
              },
              {
                lead: 'Financial clarity built in.',
                body: 'SportsRecruits focuses on exposure. FUSE-ID helps you understand what each school will actually cost — because picking a college is a financial decision, not just an athletic one.',
              },
              {
                lead: 'Built for athletes, not for platforms.',
                body: 'No coach database to "get seen in." No pay-to-play exposure model. FUSE-ID gives you the tools to run your own recruiting — with real intelligence behind every decision.',
              },
            ].map(({ lead, body }) => (
              <div
                key={lead}
                className="rounded-xl border p-6 transition-colors hover:border-white/20"
                style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1A1F38' }}
              >
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#4ADE80' }} />
                  <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                    <span className="font-bold text-white">{lead}</span> {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Parent section ─────────────────────────────────────── */}
      <section id="parents" className="px-6 md:px-12 py-28 border-t scroll-mt-16" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="fuse-label mb-3">For parents</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Parents: you&apos;re part of<br />
            <span style={{ color: '#4ADE80' }}>this process too.</span>
          </h2>
          <p className="mt-6 text-base md:text-lg leading-relaxed" style={{ color: '#9CA3AF' }}>
            College recruiting is a family decision — and FUSE-ID was designed with that in mind.
            With parent read-only access, you can follow every school your athlete is tracking, see
            offer details as they come in, and stay fully informed without needing your own account
            or accidentally changing anything. You&apos;ll never be out of the loop again.
          </p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-lg border px-5 py-4 max-w-xl mx-auto" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1A1F38' }}>
            <Users className="w-5 h-5 flex-shrink-0" style={{ color: '#4ADE80' }} />
            <p className="text-sm text-left leading-relaxed" style={{ color: '#9CA3AF' }}>
              <span className="font-bold text-white">Secure guardian access.</span> No extra
              account. No accidental edits. Just full visibility.
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
                <p className="text-4xl font-bold mb-2" style={{ color: '#4ADE80' }}>{stat}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" className="px-6 md:px-12 py-28 border-t scroll-mt-16" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="fuse-label mb-3">FAQ</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              College recruiting questions, answered.
            </h2>
            <p className="mt-4 text-sm md:text-base" style={{ color: '#9CA3AF' }}>
              The basics every recruit and recruiting parent should know — and how FUSE-ID fits in.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border p-5 transition-colors hover:border-white/20"
                style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1A1F38' }}
              >
                <summary className="flex items-start gap-3 cursor-pointer list-none">
                  <HelpCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#4ADE80' }} />
                  <h3 className="font-bold text-base md:text-lg flex-1">{q}</h3>
                  <span
                    className="text-2xl leading-none flex-shrink-0 transition-transform group-open:rotate-45"
                    style={{ color: '#9CA3AF' }}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 pl-8 text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ─────────────────────────────────────────── */}
      <section className="px-6 md:px-12 pb-32 pt-10">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border p-12 text-center space-y-6" style={{ borderColor: '#4ADE80', backgroundColor: '#1A1F38' }}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Your recruiting window is open right now.<br />
              <span style={{ color: '#4ADE80' }}>Let&apos;s make the most of it.</span>
            </h2>
            <p className="max-w-xl mx-auto leading-relaxed" style={{ color: '#9CA3AF' }}>
              Every week you wait is a week coaches are forming their lists without you on them.
              FUSE-ID is free to start — build your profile, get your school matches, and take the
              first real step toward playing in college.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md font-bold text-base transition-colors"
                style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
              >
                Get started — it&apos;s free
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

      <MarketingFooter />
    </div>
  )
}
