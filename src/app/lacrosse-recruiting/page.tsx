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
    absolute: 'FUSE-ID | AI Lacrosse Recruiting Platform for High School Athletes',
  },
  description:
    'The AI-powered lacrosse recruiting platform that scores your profile against NCAA D1, D2, D3, NAIA, and NJCAA programs, drafts coach emails, and tracks every offer. Start free.',
  keywords: [
    'lacrosse recruiting platform',
    'college lacrosse recruiting',
    'AI lacrosse recruiting',
    'lacrosse recruiting software',
    'D1 lacrosse recruiting',
    'D2 lacrosse recruiting',
    'D3 lacrosse recruiting',
    'NAIA lacrosse recruiting',
    'NJCAA lacrosse recruiting',
    'men\'s lacrosse recruiting',
    'women\'s lacrosse recruiting',
    'lacrosse club tournaments',
    'college lacrosse scholarships',
    'how to get recruited for college lacrosse',
    'lacrosse scholarship tracker',
  ],
  alternates: { canonical: '/lacrosse-recruiting' },
  openGraph: {
    title: 'FUSE-ID | AI Lacrosse Recruiting Platform',
    description:
      'AI school matching across NCAA D1, D2, D3, NAIA, and NJCAA lacrosse programs, personalized coach email drafting, and a full scholarship offer tracker with net-cost estimates.',
    url: 'https://fuse-id.online/lacrosse-recruiting',
    siteName: 'FUSE-ID',
    type: 'website',
    images: [
      { url: '/og-image.png', width: 1200, height: 630, alt: 'FUSE-ID — the AI lacrosse recruiting platform' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FUSE-ID | AI Lacrosse Recruiting Platform',
    description: 'AI school matching, coach email drafting, and offer tracking for serious college lacrosse recruits.',
    images: ['/og-image.png'],
  },
}

const lacrosseSoftwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FUSE-ID Lacrosse Recruiting',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'College Lacrosse Recruiting Platform',
  operatingSystem: 'Web',
  url: 'https://fuse-id.online/lacrosse-recruiting',
  about: { '@type': 'Sport', name: 'Lacrosse' },
  description:
    'AI-powered college lacrosse recruiting platform. Match with best-fit NCAA D1, D2, D3, NAIA, and NJCAA lacrosse programs, draft personalized coach emails, track every scholarship offer with net-cost estimates, and run AI gap analysis on your recruiting profile.',
  offers: [
    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Starter', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Pro', priceCurrency: 'USD' },
  ],
  audience: {
    '@type': 'Audience',
    audienceType: 'High school lacrosse players pursuing college recruitment',
  },
  featureList: [
    'AI lacrosse school matching across NCAA D1, D2, D3, NAIA, and NJCAA programs',
    '8-dimension fit score for college lacrosse programs',
    'AI coach email drafting for initial outreach, tournament invites, follow-ups, visit requests, and offer responses',
    'Recruiting pipeline board with Kanban, List, and Top 10 views',
    'Lacrosse scholarship offer tracker with net-cost estimates (equivalency aid math built in)',
    'AI profile gap analysis for lacrosse recruits (position, club tournaments, film, academics)',
    'Parent and guardian read-only access plus shareable public lacrosse profile URL',
  ],
}

const features = [
  {
    icon: MapPin,
    label: 'AI School Matching',
    title: 'Find college lacrosse programs that actually fit.',
    body: 'College lacrosse has grown to 400+ programs across NCAA D1, D2, D3, NAIA, and the NJCAA pipeline — and the right level depends on far more than your club tournament results. Your profile gets scored on academic fit, geographic preference, position (Attack, Midfield, Defense, LSM, FOGO, Goalie), level, campus size, and merit aid potential. The result is a ranked list of programs where you have a real shot.',
    callout: 'Fit score updated every time your profile changes.',
  },
  {
    icon: Sparkles,
    label: 'AI Coach Email Generator',
    title: 'Coach emails that sound like a real recruit wrote them.',
    body: 'Draft initial outreach, tournament invites, follow-ups, thank-you notes, visit requests, and offer responses in seconds. Each email is personalized to the program and your lacrosse profile — position, club, summer tournaments — not a template that 500 other recruits sent this month.',
    callout: 'Five email types. Personalized to every program.',
  },
  {
    icon: KanbanSquare,
    label: 'Recruiting Pipeline',
    title: 'Track every program through every contact window.',
    body: 'NCAA D1 lacrosse contact rules opened September 1 of junior year — and the early-commit wave moves fast in this sport. Manage your entire pipeline on a Kanban board with Board, List, and Top 10 views. Log every summer tournament evaluation, club showcase, and coach conversation so nothing slips between travel weekends.',
    callout: 'Full pipeline visibility — one board, every program.',
  },
  {
    icon: Trophy,
    label: 'Scholarship Offer Tracker',
    title: 'Compare lacrosse offers side by side.',
    body: 'Lacrosse is an equivalency sport at every scholarship-offering level — D1 men split 12.6 scholarships, women split 12. Partials are the norm. D3 has no athletic aid but real academic packages. Log every offer and let FUSE-ID calculate the real net cost after merit and need-based aid — so you can compare a D1 partial to a D3 academic package to a D2 ride on real numbers.',
    callout: 'Equivalency aid math built in. Real numbers for real decisions.',
  },
  {
    icon: ClipboardCheck,
    label: 'AI Profile Gap Analysis',
    title: 'Know what’s missing from your recruiting profile.',
    body: 'The AI gap analysis reviews your profile and flags what lacrosse coaches look for that you haven’t included — position-specific film, club tournament history, summer travel schedule, GPA, and test scores. Get ahead of it before coaches see your page.',
    callout: 'Specific gaps flagged. Specific fixes suggested.',
  },
  {
    icon: Users,
    label: 'Parent Access + Shareable Profile',
    title: 'Parents stay in the loop — without slowing you down.',
    body: 'Share a secure read-only link with a parent or guardian so they can follow your board, see offers, and stay informed without needing their own account or editing anything by accident. Plus share your public recruiting profile URL directly with college coaches and club directors.',
    callout: 'Parent access built in. Your profile shareable in one click.',
  },
]

export default function LacrosseRecruitingPage() {
  return (
    <div className="min-h-screen bg-[#0F1120] text-white overflow-x-hidden">
      <MarketingNav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(lacrosseSoftwareJsonLd) }}
      />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="pt-40 pb-24 px-6 md:px-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-white/10 bg-[#1A1F38] text-xs font-medium mb-6" style={{ color: '#4ADE80' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
          Lacrosse recruiting — live on FUSE-ID
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl mx-auto">
          The AI lacrosse recruiting platform built for{' '}
          <span style={{ color: '#4ADE80' }}>serious players.</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: '#9CA3AF' }}>
          FUSE-ID matches your lacrosse profile to NCAA D1, D2, D3, NAIA, and NJCAA programs across
          8 fit dimensions — then helps you reach coaches with personalized emails, track every
          offer, and know your real cost. Built for lacrosse players who want more than a list.
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
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            '400+ college lacrosse programs — D1, D2, D3, NAIA, NJCAA',
            'Equivalency-aid math built in — real net-cost estimates',
            'AI coach emails for outreach, tournament invites, and offer responses',
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
          <p className="fuse-label mb-3">The problem with lacrosse recruiting</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
            Lacrosse recruiting moves fast —<br />
            <span style={{ color: '#9CA3AF' }}>and the network still skews regional.</span>
          </h2>
          <p className="mt-6 text-base md:text-lg leading-relaxed" style={{ color: '#9CA3AF' }}>
            400+ programs across five levels. Every scholarship is partial. Top D1 programs build
            their boards a year before the September 1 contact window even opens. The Northeast and
            Mid-Atlantic still produce a disproportionate share of D1 recruits — but the sport is
            growing nationally and the matching problem is harder for players outside the
            traditional pipeline. FUSE-ID matches you to programs that genuinely fit your level
            and position, then helps you reach coaches in a way that actually gets a response.
          </p>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 md:px-12 py-28 max-w-6xl mx-auto scroll-mt-16 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="text-center mb-16">
          <p className="fuse-label mb-3">What FUSE-ID does for lacrosse recruits</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Everything you need to get<br />
            <span style={{ color: '#9CA3AF' }}>recruited for college lacrosse.</span>
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
              <span style={{ color: '#9CA3AF' }}>NCSA and SportsRecruits for lacrosse.</span>
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
                body: 'SportsRecruits is built around exposure. FUSE-ID is built around fit — your AI match score tells you which lacrosse programs are realistic for your level, position, and academics across D1, D2, D3, NAIA, and NJCAA.',
              },
              {
                lead: 'Real-cost clarity for an equivalency sport.',
                body: 'Lacrosse is an equivalency sport — every athletic-aid offer is a partial. A 35% D1 partial, a 50% D2 offer, and a D3 academic package look very different on paper. FUSE-ID estimates the net cost after aid so you can compare them on real numbers.',
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
              Lacrosse boards build a year ahead<br />
              <span style={{ color: '#4ADE80' }}>of the contact window.</span>
            </h2>
            <p className="max-w-xl mx-auto leading-relaxed" style={{ color: '#9CA3AF' }}>
              D1 lacrosse programs identify their top targets at sophomore-year summer tournaments
              and lock down commits the moment the September 1 contact window opens junior year. By
              the time most recruits start outreach, the early commits are already in. FUSE-ID is
              free to start — build your profile, get your lacrosse school matches, and take
              control of your recruiting today.
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
