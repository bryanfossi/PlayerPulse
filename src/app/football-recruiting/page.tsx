import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight, MapPin, Sparkles, Trophy, Check,
  KanbanSquare, ClipboardCheck, Users,
} from 'lucide-react'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

export const metadata: Metadata = {
  title: {
    absolute: 'FUSE-ID | AI Football Recruiting Platform for High School Athletes',
  },
  description:
    'The AI-powered football recruiting platform that scores your profile against FBS, FCS, D2, D3, NAIA, and NJCAA programs, drafts coach emails, and tracks every offer. Start free.',
  keywords: [
    'football recruiting platform',
    'college football recruiting',
    'AI football recruiting',
    'football recruiting software',
    'D1 football recruiting',
    'FBS recruiting',
    'FCS recruiting',
    'D2 football recruiting',
    'D3 football recruiting',
    'NAIA football recruiting',
    'NJCAA football recruiting',
    'JUCO football recruiting',
    'college football scholarships',
    'how to get recruited for college football',
    'college football coach email',
    'football scholarship tracker',
  ],
  alternates: { canonical: '/football-recruiting' },
  openGraph: {
    title: 'FUSE-ID | AI Football Recruiting Platform',
    description:
      'AI school matching across FBS, FCS, D2, D3, NAIA, and NJCAA football programs, personalized coach email drafting, and a full scholarship offer tracker with net-cost estimates.',
    url: 'https://fuse-id.online/football-recruiting',
    siteName: 'FUSE-ID',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FUSE-ID — the AI football recruiting platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FUSE-ID | AI Football Recruiting Platform',
    description:
      'AI school matching, coach email drafting, and offer tracking for serious college football recruits.',
    images: ['/og-image.png'],
  },
}

const footballSoftwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FUSE-ID Football Recruiting',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'College Football Recruiting Platform',
  operatingSystem: 'Web',
  url: 'https://fuse-id.online/football-recruiting',
  about: {
    '@type': 'Sport',
    name: 'Football',
  },
  description:
    'AI-powered college football recruiting platform. Match with best-fit D1 (FBS and FCS), D2, D3, NAIA, and NJCAA football programs, draft personalized coach emails, track every scholarship offer with net-cost estimates, and run AI gap analysis on your recruiting profile.',
  offers: [
    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Starter', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Pro', priceCurrency: 'USD' },
  ],
  audience: {
    '@type': 'Audience',
    audienceType: 'High school football players pursuing college recruitment',
  },
  featureList: [
    'AI football school matching across D1 FBS, D1 FCS, D2, D3, NAIA, and NJCAA programs',
    '8-dimension fit score for college football programs',
    'AI coach email drafting for initial outreach, follow-ups, camp invites, official visit requests, and offer responses',
    'Recruiting pipeline board with Kanban, List, and Top 10 views',
    'Football scholarship offer tracker with net-cost estimates',
    'AI profile gap analysis for football recruits',
    'Parent and guardian read-only access plus shareable public football profile URL',
  ],
}

const features = [
  {
    icon: MapPin,
    label: 'AI School Matching',
    title: 'Find college football programs that actually fit.',
    body: 'Football recruiting spans 700+ programs across FBS, FCS, D2, D3, NAIA, and NJCAA — and most recruits don’t know where they realistically fit. Your profile gets scored on academic fit, geographic preference, position (QB, RB, WR, OL, DL, LB, DB), level, campus size, and merit aid potential. The result is a ranked list of programs where you have a real shot.',
    callout: 'Fit score updated every time your profile changes.',
  },
  {
    icon: Sparkles,
    label: 'AI Coach Email Generator',
    title: 'Coach emails that sound like a real recruit wrote them.',
    body: 'Draft initial outreach, follow-ups, thank-you notes, camp invites, official visit requests, and offer responses in seconds. Each email is personalized to the program and your football profile — not a template that 500 other recruits sent this month.',
    callout: 'Five email types. Personalized to every program.',
  },
  {
    icon: KanbanSquare,
    label: 'Recruiting Pipeline',
    title: 'Track every program through every contact window.',
    body: 'D1 contact rules are strict and the football calendar — camps, junior days, official visits, signing periods — moves fast. Manage your entire pipeline on a Kanban board with Board, List, and Top 10 views. Log every coach interaction, camp evaluation, and follow-up so nothing slips between the dead and contact periods.',
    callout: 'Full pipeline visibility — one board, every program.',
  },
  {
    icon: Trophy,
    label: 'Scholarship Offer Tracker',
    title: 'Compare scholarship offers side by side.',
    body: 'FBS programs offer full scholarships; FCS, D2, NAIA, and JUCO are often partials; D3 has no athletic aid but strong academic packages. Log every offer and let FUSE-ID calculate the real net cost after financial aid and merit awards — so you can compare a P4 partial to an FCS full ride to a D3 academic package on real numbers.',
    callout: 'Net-cost estimates built in. Real numbers for real decisions.',
  },
  {
    icon: ClipboardCheck,
    label: 'AI Profile Gap Analysis',
    title: 'Know what’s missing from your recruiting profile.',
    body: 'The AI gap analysis reviews your profile and flags what football coaches look for that you haven’t included — verified height/weight, 40 time, position-specific film, GPA and test scores, and camp history. Get ahead of it before coaches see your page.',
    callout: 'Specific gaps flagged. Specific fixes suggested.',
  },
  {
    icon: Users,
    label: 'Parent Access + Shareable Profile',
    title: 'Parents stay in the loop — without slowing you down.',
    body: 'Share a secure read-only link with a parent or guardian so they can follow your board, see offers, and stay informed without needing their own account or editing anything by accident. Plus share your public recruiting profile URL directly with coaches.',
    callout: 'Parent access built in. Your profile shareable in one click.',
  },
]

export default function FootballRecruitingPage() {
  return (
    <div className="min-h-screen bg-[#0F1120] text-white overflow-x-hidden">
      <MarketingNav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(footballSoftwareJsonLd) }}
      />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="pt-40 pb-24 px-6 md:px-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-white/10 bg-[#1A1F38] text-xs font-medium mb-6" style={{ color: '#4ADE80' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
          Football recruiting — live on FUSE-ID
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl mx-auto">
          The AI football recruiting platform built for{' '}
          <span style={{ color: '#4ADE80' }}>serious players.</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: '#9CA3AF' }}>
          FUSE-ID matches your football profile to FBS, FCS, D2, D3, NAIA, and NJCAA programs
          across 8 fit dimensions — then helps you reach coaches with personalized emails, track
          every offer, and know your real cost. Built for football players who want more than a
          list.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-md font-bold text-base transition-colors"
            style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
          >
            Start free — no credit card
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
      </section>

      {/* ── Social proof bar ───────────────────────────────────── */}
      <section className="border-y px-6 md:px-12 py-10" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            '700+ college football programs — FBS, FCS, D2, D3, NAIA, NJCAA',
            'D1 contact-rule aware — never miss a window',
            'AI coach emails for outreach, camp invites, and offer responses',
            'Free to start — upgrade only when you’re ready',
          ].map((line) => (
            <div key={line} className="flex items-start gap-3">
              <Check className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: '#4ADE80' }} />
              <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{line}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pain point ─────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-28">
        <div className="max-w-3xl mx-auto text-center">
          <p className="fuse-label mb-3">The problem with football recruiting</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
            Football recruiting is the<br />
            <span style={{ color: '#9CA3AF' }}>most complex sport to navigate.</span>
          </h2>
          <p className="mt-6 text-base md:text-lg leading-relaxed" style={{ color: '#9CA3AF' }}>
            700+ programs across six levels. Strict contact rules with calendar windows that
            change by year. Camp invites, junior days, official visits, two signing periods. Most
            recruits drown in it — or send the same email to 50 schools and hope. FUSE-ID matches
            you to programs that genuinely fit your level and position, then helps you reach
            coaches in a way that actually gets a response.
          </p>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 md:px-12 py-28 max-w-6xl mx-auto scroll-mt-16 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="text-center mb-16">
          <p className="fuse-label mb-3">What FUSE-ID does for football recruits</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Everything you need to get<br />
            <span style={{ color: '#9CA3AF' }}>recruited for college football.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, label, title, body, callout }) => (
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

      {/* ── Comparison ─────────────────────────────────────────── */}
      <section id="compare" className="px-6 md:px-12 py-28 border-t scroll-mt-16" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="fuse-label mb-3">Compare</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              A better alternative to<br />
              <span style={{ color: '#9CA3AF' }}>NCSA and SportsRecruits for football.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                lead: 'Built for athletes, not consultants.',
                body: 'NCSA charges $99–$200+/month for a service that’s mostly consultants and a database coaches rarely use. FUSE-ID gives you AI tools that you control — for free to start.',
              },
              {
                lead: 'Match score, not just exposure.',
                body: 'SportsRecruits is built around exposure. FUSE-ID is built around fit — your AI match score tells you which football programs are realistic for your level, position, and academics across FBS, FCS, D2, D3, NAIA, and NJCAA.',
              },
              {
                lead: 'Real-cost clarity.',
                body: 'A P4 partial, an FCS full ride, and a D3 academic package look very different on paper. FUSE-ID estimates the net cost after aid so you can compare them on real numbers — not sticker prices.',
              },
              {
                lead: 'Affordable by design.',
                body: 'Most athletes never pay more than $9.99/month. Token packs are available for athletes who just need a burst of AI power.',
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

      {/* ── Closing CTA ─────────────────────────────────────────── */}
      <section className="px-6 md:px-12 pb-32 pt-10">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border p-12 text-center space-y-6" style={{ borderColor: '#4ADE80', backgroundColor: '#1A1F38' }}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Your football recruiting window<br />
              <span style={{ color: '#4ADE80' }}>closes faster than you think.</span>
            </h2>
            <p className="max-w-xl mx-auto leading-relaxed" style={{ color: '#9CA3AF' }}>
              FBS programs build boards as early as freshman year. FCS and D2 fill rosters in
              waves. By the time most recruits start outreach, the early commits are already in.
              FUSE-ID is free to start — build your profile, get your football school matches, and
              take control of your recruiting today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md font-bold text-base transition-colors"
                style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
              >
                Start free — no credit card
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
