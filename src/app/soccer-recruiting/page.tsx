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
    absolute: 'FUSE-ID | AI Soccer Recruiting Platform for High School Athletes',
  },
  description:
    'The AI-powered soccer recruiting platform that scores your profile against 2,400+ college programs, drafts coach emails, and tracks every offer. Start free.',
  keywords: [
    'soccer recruiting platform',
    'college soccer recruiting',
    'AI soccer recruiting',
    'soccer recruiting software',
    'college soccer scholarships',
    'D1 soccer recruiting',
    'D2 soccer recruiting',
    'D3 soccer recruiting',
    'NAIA soccer recruiting',
    'NJCAA soccer recruiting',
    'JUCO soccer recruiting',
    'how to get recruited for college soccer',
    'college soccer coach email',
    'soccer scholarship tracker',
  ],
  alternates: { canonical: '/soccer-recruiting' },
  openGraph: {
    title: 'FUSE-ID | AI Soccer Recruiting Platform',
    description:
      'AI school matching across 2,400+ college soccer programs, personalized coach email drafting, and a full scholarship offer tracker with net-cost estimates.',
    url: 'https://fuse-id.online/soccer-recruiting',
    siteName: 'FUSE-ID',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FUSE-ID — the AI soccer recruiting platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FUSE-ID | AI Soccer Recruiting Platform',
    description:
      'AI school matching, coach email drafting, and offer tracking for serious college soccer recruits.',
    images: ['/og-image.png'],
  },
}

const soccerSoftwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FUSE-ID Soccer Recruiting',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'College Soccer Recruiting Platform',
  operatingSystem: 'Web',
  url: 'https://fuse-id.online/soccer-recruiting',
  about: {
    '@type': 'Sport',
    name: 'Soccer',
  },
  description:
    'AI-powered college soccer recruiting platform. Match with best-fit D1, D2, D3, NAIA, and NJCAA soccer programs, draft personalized coach emails, track every scholarship offer with net-cost estimates, and run AI gap analysis on your recruiting profile.',
  offers: [
    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Starter', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Pro', priceCurrency: 'USD' },
  ],
  audience: {
    '@type': 'Audience',
    audienceType: 'High school and club soccer players pursuing college recruitment',
  },
  featureList: [
    'AI soccer school matching across 2,400+ D1, D2, D3, NAIA, and NJCAA programs',
    '8-dimension fit score for college soccer programs',
    'AI coach email drafting for initial outreach, follow-ups, thank-yous, visit requests, and offer responses',
    'Recruiting pipeline board with Kanban, List, and Top 10 views',
    'Soccer scholarship offer tracker with net-cost estimates',
    'AI profile gap analysis for soccer recruits',
    'Parent and guardian read-only access plus shareable public soccer profile URL',
  ],
}

const features = [
  {
    icon: MapPin,
    label: 'AI School Matching',
    title: 'Find college soccer programs that actually fit.',
    body: 'Your profile gets scored against 2,400+ soccer programs on academic fit, geographic preference, positional need, division level, campus size, and merit aid potential. The result is a ranked list of programs where you have a real shot — not just schools you’ve heard of.',
    callout: 'Fit score updated every time your profile changes.',
  },
  {
    icon: Sparkles,
    label: 'AI Coach Email Generator',
    title: 'Coach emails that sound like a real recruit wrote them.',
    body: 'Draft initial outreach, follow-ups, thank-you notes, campus visit requests, and offer responses in seconds. Each email is personalized to the school and your soccer profile — not a template that 500 other recruits sent this month.',
    callout: 'Five email types. Personalized to every program.',
  },
  {
    icon: KanbanSquare,
    label: 'Recruiting Pipeline',
    title: 'Track every program from first contact to offer.',
    body: 'Manage your entire soccer recruiting pipeline on a Kanban board with Board, List, and Top 10 views. Log every coach interaction, campus visit, and follow-up in one place so nothing gets missed during the busiest months of your junior year.',
    callout: 'Full pipeline visibility — one board, every program.',
  },
  {
    icon: Trophy,
    label: 'Scholarship Offer Tracker',
    title: 'Compare scholarship offers side by side.',
    body: 'Log every soccer scholarship offer and calculate the real net cost after financial aid and merit awards. A partial D1 scholarship and a full D3 ride look very different on paper — FUSE-ID shows you what you’d actually pay at each school.',
    callout: 'Net-cost estimates built in. Real numbers for real decisions.',
  },
  {
    icon: ClipboardCheck,
    label: 'AI Profile Gap Analysis',
    title: 'Know what’s missing from your recruiting profile.',
    body: 'The AI gap analysis reviews your profile and flags what coaches look for that you haven’t included — GPA, highlight links, playing style, tournament history. Get ahead of it before coaches see your page.',
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

export default function SoccerRecruitingPage() {
  return (
    <div className="min-h-screen bg-[#0F1120] text-white overflow-x-hidden">
      <MarketingNav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(soccerSoftwareJsonLd) }}
      />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="pt-40 pb-24 px-6 md:px-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-white/10 bg-[#1A1F38] text-xs font-medium mb-6" style={{ color: '#4ADE80' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
          Soccer recruiting — live on FUSE-ID
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl mx-auto">
          The AI soccer recruiting platform built for{' '}
          <span style={{ color: '#4ADE80' }}>serious players.</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: '#9CA3AF' }}>
          FUSE-ID matches your soccer profile to D1, D2, D3, NAIA, and NJCAA programs across 8 fit
          dimensions — then helps you reach coaches with personalized emails, track every offer, and
          know your real cost. Built for soccer players who want more than a list.
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
            '2,400+ college soccer programs in the database',
            'D1, D2, D3, NAIA, and NJCAA — every division covered',
            'AI coach emails for initial outreach, follow-ups, and offer responses',
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
          <p className="fuse-label mb-3">The problem with soccer recruiting</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
            Most players send the same email<br />
            <span style={{ color: '#9CA3AF' }}>to 30 schools and hope.</span>
          </h2>
          <p className="mt-6 text-base md:text-lg leading-relaxed" style={{ color: '#9CA3AF' }}>
            Coaches can spot a mass email in seconds — and they move on. FUSE-ID matches you to
            programs that genuinely fit your level, location, and style of play, then helps you
            reach out in a way that gets a response.
          </p>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 md:px-12 py-28 max-w-6xl mx-auto scroll-mt-16 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="text-center mb-16">
          <p className="fuse-label mb-3">What FUSE-ID does for soccer recruits</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Everything you need to get<br />
            <span style={{ color: '#9CA3AF' }}>recruited for college soccer.</span>
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
              <span style={{ color: '#9CA3AF' }}>NCSA and SportsRecruits for soccer.</span>
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
                body: 'SportsRecruits is built around exposure. FUSE-ID is built around fit — your AI match score tells you which programs are realistic, not just which ones exist.',
              },
              {
                lead: 'Real-cost clarity.',
                body: 'Neither platform estimates what a school will actually cost you after aid. FUSE-ID does — so you can compare a partial D1 ride to a full D3 package on real numbers.',
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
              Your soccer recruiting window<br />
              <span style={{ color: '#4ADE80' }}>is shorter than you think.</span>
            </h2>
            <p className="max-w-xl mx-auto leading-relaxed" style={{ color: '#9CA3AF' }}>
              Coaches start tracking recruits as early as freshman year. The sooner you have a real
              system, the more options you&apos;ll have. FUSE-ID is free to start — build your
              profile, get your soccer school matches, and take control of your recruiting today.
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
