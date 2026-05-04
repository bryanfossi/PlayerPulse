import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  School, Mail, Trophy, CheckCircle2, Target, Activity,
  ArrowRight, Flame, Snowflake, Phone, MessageSquare,
  CalendarCheck, Users, ClipboardList, Sparkles,
} from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { AddTokensButton } from '@/components/AddTokensButton'
import { ProfileTipsButton } from '@/components/dashboard/ProfileTipsButton'
import { ActionsChart } from '@/components/dashboard/ActionsChart'
import type { Database } from '@/types/database'
import type { ContactType, Momentum } from '@/types/app'

type PlayerRow = Database['public']['Tables']['players']['Row']
type PSRow = Database['public']['Tables']['player_schools']['Row']
type SchoolRow = Database['public']['Tables']['schools']['Row']
type ContactRow = Database['public']['Tables']['contacts']['Row']

const STATUS_LABELS: Record<string, string> = {
  researching: 'Researching', contacted: 'Contacted', interested: 'Interested',
  campus_visit: 'Visit', offer_received: 'Offer', committed: 'Committed', declined: 'Declined',
}
const PIPELINE_ORDER = [
  'researching', 'contacted', 'interested', 'campus_visit', 'offer_received', 'committed',
]
const CONTACTED_STATUSES = new Set(['contacted', 'interested', 'campus_visit', 'offer_received', 'committed'])
const CONTACT_TYPE_ICONS: Record<ContactType, typeof Mail> = {
  email_sent: Mail, email_received: Mail, call: Phone,
  text: MessageSquare, campus_visit: CalendarCheck, official_visit: CalendarCheck,
  unofficial_visit: CalendarCheck, coach_at_game: Users, questionnaire: ClipboardList,
}
const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  email_sent: 'Email Sent', email_received: 'Email Received', call: 'Call',
  text: 'Text', campus_visit: 'Visit', official_visit: 'Official Visit',
  unofficial_visit: 'Unofficial Visit', coach_at_game: 'Coach at Game',
  questionnaire: 'Questionnaire',
}

// Pipeline funnel — bar opacity intensifies as schools advance
const STAGE_INTENSITY: Record<string, number> = {
  researching: 0.18, contacted: 0.32, interested: 0.48,
  campus_visit: 0.65, offer_received: 0.82, committed: 1.0,
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: playerRaw } = await service
    .from('players')
    .select('id, first_name, last_name, grad_year, primary_position, club_team')
    .eq('user_id', user.id)
    .maybeSingle()
  const player = playerRaw as Pick<PlayerRow,
    'id' | 'first_name' | 'last_name' | 'grad_year' | 'primary_position' | 'club_team'
  > | null
  if (!player) redirect('/onboarding')

  // 90 days ago in ISO form for the actions chart query
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const ninetyDaysAgoIso = ninetyDaysAgo.toISOString()

  const [psResult, contactsResult, actionsResult] = await Promise.all([
    service
      .from('player_schools')
      .select('id, tier, status, overall_score, rank_order, momentum, school:schools(id, name, verified_division)')
      .eq('player_id', player.id)
      .order('rank_order', { ascending: true }),
    service
      .from('contacts')
      .select('id, contact_type, direction, contact_date, subject, notes, follow_up_date, created_at, school:schools(id, name, verified_division)')
      .eq('player_id', player.id)
      .order('contact_date', { ascending: false })
      .limit(20),
    service
      .from('actions')
      .select('completed_at')
      .eq('player_id', player.id)
      .eq('status', 'completed')
      .gte('completed_at', ninetyDaysAgoIso),
  ])

  const completedActionDates = ((actionsResult.data ?? []) as Array<{ completed_at: string | null }>)
    .filter((a) => a.completed_at)
    .map((a) => a.completed_at!.slice(0, 10))

  type PSWithSchool = Pick<PSRow, 'id' | 'tier' | 'status' | 'overall_score' | 'rank_order' | 'momentum'> & {
    school: Pick<SchoolRow, 'id' | 'name' | 'verified_division'>
  }
  const playerSchools = ((psResult.data ?? []) as unknown as PSWithSchool[])

  // ─── Aggregations ───────────────────────────────────────────
  const totalSchools = playerSchools.length
  const activeSchools = playerSchools.filter((s) => s.status !== 'declined')
  const contacted = playerSchools.filter((s) => CONTACTED_STATUSES.has(s.status)).length
  const offers = playerSchools.filter((s) => s.status === 'offer_received').length
  const committed = playerSchools.filter((s) => s.status === 'committed').length

  const hotSchools = activeSchools.filter((s) => s.momentum === 'hot')
  const coldSchools = activeSchools.filter((s) => s.momentum === 'cold')

  // Follow-ups due in the next 7 days
  const todayMs = new Date(new Date().toDateString()).getTime()
  const sevenDaysMs = todayMs + 7 * 86400000
  type ContactWithSchool = Omit<ContactRow, 'player_id' | 'school_id'> & {
    school: Pick<SchoolRow, 'id' | 'name' | 'verified_division'>
  }
  const allContacts = ((contactsResult.data ?? []) as unknown as ContactWithSchool[])
  const upcomingFollowUps = allContacts.filter((c) => {
    if (!c.follow_up_date) return false
    const t = new Date(c.follow_up_date + 'T00:00:00').getTime()
    return t >= todayMs && t <= sevenDaysMs
  })

  // ─── Action cards ("Today" zone) ────────────────────────────
  type ActionCard = {
    eyebrow: string
    eyebrowColor: string
    title: string
    body: string
    href: string
    cta: string
    icon: typeof Mail
    primary?: boolean
  }
  const actions: ActionCard[] = []

  if (offers > 0) {
    actions.push({
      eyebrow: 'Decision time',
      eyebrowColor: '#4ADE80',
      title: `${offers} offer${offers > 1 ? 's' : ''} on the table`,
      body: 'Compare aid, deadlines, and division before responding.',
      href: '/offers',
      cta: 'Review offers',
      icon: Trophy,
      primary: true,
    })
  }
  if (upcomingFollowUps.length > 0) {
    actions.push({
      eyebrow: 'Due this week',
      eyebrowColor: '#4ADE80',
      title: `${upcomingFollowUps.length} follow-up${upcomingFollowUps.length > 1 ? 's' : ''} coming up`,
      body: 'Stay on top of coach communication.',
      href: '/communications',
      cta: 'See follow-ups',
      icon: CalendarCheck,
      primary: actions.length === 0,
    })
  }
  if (hotSchools.length > 0) {
    actions.push({
      eyebrow: 'Heating up',
      eyebrowColor: '#FB923C',
      title: `${hotSchools.length} school${hotSchools.length > 1 ? 's are' : ' is'} trending`,
      body: 'Capitalize on the momentum — send a follow-up or schedule a visit.',
      href: '/schools',
      cta: 'View hot schools',
      icon: Flame,
      primary: actions.length === 0,
    })
  }
  if (coldSchools.length > 0 && actions.length < 3) {
    actions.push({
      eyebrow: 'Going cold',
      eyebrowColor: '#38BDF8',
      title: `${coldSchools.length} school${coldSchools.length > 1 ? 's are' : ' is'} cooling`,
      body: 'Re-engage with a thoughtful message — or move on.',
      href: '/schools',
      cta: 'View cold schools',
      icon: Snowflake,
    })
  }
  if (totalSchools > 0 && contacted === 0 && actions.length < 3) {
    actions.push({
      eyebrow: 'First step',
      eyebrowColor: '#4ADE80',
      title: 'Reach out to your top schools',
      body: 'Use AI to draft personalized intro emails to coaches in minutes.',
      href: '/ai/draft',
      cta: 'Draft an email',
      icon: Sparkles,
      primary: actions.length === 0,
    })
  }
  if (totalSchools === 0 && actions.length === 0) {
    actions.push({
      eyebrow: 'Get started',
      eyebrowColor: '#4ADE80',
      title: 'Build your school list',
      body: 'Run the Match Engine to get a personalized Top 40, then start tracking.',
      href: '/schools',
      cta: 'Go to My Schools',
      icon: Target,
      primary: true,
    })
  }

  const primaryAction = actions[0]
  const secondaryActions = actions.slice(1, 3)

  // Pipeline (compact, single bar)
  const statusCounts: Record<string, number> = {}
  for (const ps of playerSchools) statusCounts[ps.status] = (statusCounts[ps.status] ?? 0) + 1
  const pipelineStages = PIPELINE_ORDER.map((status) => ({
    status,
    count: statusCounts[status] ?? 0,
  }))

  // Top 10 — sorted by momentum, then rank
  const topSchools = activeSchools
    .sort((a, b) => {
      const pa = momentumPriority(a.momentum)
      const pb = momentumPriority(b.momentum)
      if (pa !== pb) return pa - pb
      return a.rank_order - b.rank_order
    })
    .slice(0, 10)

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-10">

      {/* ── Header (minimal) ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, <span style={{ color: '#4ADE80' }}>{player.first_name}</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
            {player.primary_position} · Class of {player.grad_year} · {player.club_team}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ProfileTipsButton />
          <AddTokensButton />
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* HERO: Today's action zone — the focal point of the page */}
      {/* ───────────────────────────────────────────────────────── */}
      {primaryAction && (
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: '#9CA3AF' }}>
            Today
          </p>

          {/* Primary action — biggest, most prominent */}
          <Link
            href={primaryAction.href}
            className="block rounded-xl border p-6 transition-colors hover:bg-white/[0.03] group"
            style={{ borderColor: primaryAction.eyebrowColor + '50', backgroundColor: '#1A1F38' }}
          >
            <div className="flex items-start gap-5">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: primaryAction.eyebrowColor + '15', border: `1px solid ${primaryAction.eyebrowColor}40` }}
              >
                <primaryAction.icon className="w-5 h-5" style={{ color: primaryAction.eyebrowColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: primaryAction.eyebrowColor }}>
                  {primaryAction.eyebrow}
                </p>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight mt-1">
                  {primaryAction.title}
                </h2>
                <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>
                  {primaryAction.body}
                </p>
                <div className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold transition-colors group-hover:gap-2" style={{ color: primaryAction.eyebrowColor }}>
                  {primaryAction.cta}
                  <ArrowRight className="w-4 h-4 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Secondary actions — smaller, side-by-side */}
          {secondaryActions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {secondaryActions.map((a) => (
                <Link
                  key={a.title}
                  href={a.href}
                  className="flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-white/[0.03] group"
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: a.eyebrowColor + '12' }}
                  >
                    <a.icon className="w-4 h-4" style={{ color: a.eyebrowColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: a.eyebrowColor }}>
                      {a.eyebrow}
                    </p>
                    <p className="text-sm font-semibold mt-0.5">{a.title}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: '#9CA3AF' }} />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* AT A GLANCE — single tight stat strip, low visual weight */}
      {/* ───────────────────────────────────────────────────────── */}
      <section>
        <div className="rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <InlineStat label="Schools" value={totalSchools} icon={School} />
            <InlineStat label="In Contact" value={contacted} icon={Mail} />
            <InlineStat label="Offers" value={offers} icon={Trophy} accent={offers > 0} />
            <InlineStat label="Committed" value={committed} icon={CheckCircle2} accent={committed > 0} />
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────── */}
      {/* TOP 10 — the main browse content                          */}
      {/* ───────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#9CA3AF' }}>
              Your top 10
            </p>
            <h2 className="text-lg font-bold tracking-tight mt-1">Schools you&apos;re tracking most</h2>
          </div>
          <Link href="/schools" className="text-xs font-medium transition-colors hover:text-white inline-flex items-center gap-1" style={{ color: '#9CA3AF' }}>
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {topSchools.length === 0 ? (
          <div className="rounded-xl border px-6 py-10 text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              No schools yet.{' '}
              <Link href="/schools" className="hover:underline" style={{ color: '#4ADE80' }}>Add your first school</Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {topSchools.map((ps, i) => (
              <Top10Card key={ps.id} ps={ps} rank={i + 1} />
            ))}
          </div>
        )}
      </section>

      {/* ───────────────────────────────────────────────────────── */}
      {/* ACTIONS CHART — 90-day completion trend                    */}
      {/* ───────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#9CA3AF' }}>
            Action history
          </p>
          <Link href="/actions" className="text-xs font-medium transition-colors hover:text-white inline-flex items-center gap-1" style={{ color: '#9CA3AF' }}>
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <ActionsChart completedDates={completedActionDates} days={90} />
      </section>

      {/* ───────────────────────────────────────────────────────── */}
      {/* SUPPORTING CONTEXT — pipeline + activity, two columns      */}
      {/* ───────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: '#9CA3AF' }}>
            Pipeline
          </p>
          {totalSchools === 0 ? (
            <p className="text-sm" style={{ color: '#9CA3AF' }}>No schools yet.</p>
          ) : (
            <div className="space-y-2.5">
              {pipelineStages.map(({ status, count }) => {
                const pct = totalSchools > 0 ? (count / totalSchools) * 100 : 0
                const intensity = STAGE_INTENSITY[status] ?? 0.4
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs w-24 flex-shrink-0" style={{ color: '#9CA3AF' }}>
                      {STATUS_LABELS[status]}
                    </span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${Math.max(pct, count > 0 ? 3 : 0)}%`,
                          backgroundColor: `rgba(74, 222, 128, ${intensity})`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold tabular-nums w-6 text-right" style={{ color: count === 0 ? '#9CA3AF' : '#FFFFFF' }}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Activity */}
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#9CA3AF' }}>
              Recent activity
            </p>
            <Link href="/communications" className="text-xs transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>
              View all
            </Link>
          </div>
          {allContacts.length === 0 ? (
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              No contacts yet.{' '}
              <Link href="/communications" className="hover:underline" style={{ color: '#4ADE80' }}>Log your first contact</Link>
            </p>
          ) : (
            <div className="space-y-3">
              {allContacts.slice(0, 5).map((c) => {
                const Icon = CONTACT_TYPE_ICONS[c.contact_type as ContactType] ?? Mail
                return (
                  <div key={c.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{c.school.name}</p>
                        <time className="text-[10px] flex-shrink-0" style={{ color: '#9CA3AF' }}>
                          {new Date(c.contact_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </time>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                        {CONTACT_TYPE_LABELS[c.contact_type as ContactType]}
                        {(c.subject || c.notes) && ` · ${c.subject ?? c.notes?.slice(0, 50)}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function momentumPriority(m: Momentum | null): number {
  if (m === 'hot') return 0
  if (m === 'cold') return 2
  return 1
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InlineStat({ label, value, icon: Icon, accent }: {
  label: string
  value: number
  icon: React.ElementType
  accent?: boolean
}) {
  return (
    <div className="px-5 py-4 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#9CA3AF' }}>
          {label}
        </p>
        <p className="text-2xl font-black tabular-nums mt-1" style={{ color: accent ? '#4ADE80' : '#FFFFFF' }}>
          {value}
        </p>
      </div>
      <Icon className="w-4 h-4" style={{ color: accent ? '#4ADE80' : '#9CA3AF' }} />
    </div>
  )
}

function Top10Card({ ps, rank }: {
  ps: {
    id: string
    school: { name: string; verified_division: string | null }
    tier: 'Lock' | 'Realistic' | 'Reach' | null
    status: string
    overall_score: number | null
    momentum: Momentum | null
  }
  rank: number
}) {
  const tierColor =
    ps.tier === 'Lock' ? '#4ADE80' :
    ps.tier === 'Realistic' ? '#60A5FA' :
    ps.tier === 'Reach' ? '#FBBF24' :
    '#9CA3AF'

  const momentumStyle =
    ps.momentum === 'hot'
      ? { borderColor: 'rgba(249,115,22,0.45)' }
      : ps.momentum === 'cold'
      ? { borderColor: 'rgba(14,165,233,0.45)' }
      : { borderColor: 'rgba(255,255,255,0.08)' }

  return (
    <Link
      href={`/schools/${ps.id}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors hover:bg-white/[0.03] group"
      style={momentumStyle}
    >
      <span className="text-sm font-black tabular-nums w-6 text-center flex-shrink-0" style={{ color: '#9CA3AF' }}>
        {rank}
      </span>
      <div className="w-1 h-9 rounded-full flex-shrink-0" style={{ backgroundColor: tierColor }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate group-hover:text-[#4ADE80] transition-colors">
          {ps.school.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 text-[10px]" style={{ color: '#9CA3AF' }}>
          {ps.school.verified_division && <span>{ps.school.verified_division}</span>}
          {ps.tier && (
            <>
              <span>·</span>
              <span style={{ color: tierColor }}>{ps.tier}</span>
            </>
          )}
        </div>
      </div>
      {ps.momentum === 'hot' && <Flame className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#FB923C' }} />}
      {ps.momentum === 'cold' && <Snowflake className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#38BDF8' }} />}
      {ps.overall_score != null && (
        <span className="text-base font-black tabular-nums flex-shrink-0" style={{ color: '#4ADE80' }}>
          {ps.overall_score}
        </span>
      )}
    </Link>
  )
}
