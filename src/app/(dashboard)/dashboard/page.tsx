import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  School, Mail, Trophy, CheckCircle2, Target, Activity,
  ArrowUpRight, Flame, Snowflake, Minus, Phone, MessageSquare,
  CalendarCheck, Users, ClipboardList,
} from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { FollowUpReminders } from '@/components/communications/FollowUpReminders'
import { AddTokensButton } from '@/components/AddTokensButton'
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
  'researching', 'contacted', 'interested', 'campus_visit', 'offer_received', 'committed', 'declined',
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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: playerRaw, error: playerError } = await service
    .from('players')
    .select('id, first_name, last_name, grad_year, primary_position, club_team')
    .eq('user_id', user.id)
    .maybeSingle()
  if (playerError) {
    console.error('[dashboard] player query error:', playerError.message, playerError.details)
    const { data: fallbackRaw } = await service
      .from('players')
      .select('id, first_name, last_name, grad_year, primary_position, club_team')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!fallbackRaw) redirect('/onboarding')
    throw new Error(`Database migration required. Run migration 004_stripe_billing.sql in Supabase. Error: ${playerError.message}`)
  }
  const player = playerRaw as Pick<PlayerRow,
    'id' | 'first_name' | 'last_name' | 'grad_year' | 'primary_position' | 'club_team'
  > | null
  if (!player) redirect('/onboarding')

  const [psResult, contactsResult] = await Promise.all([
    service
      .from('player_schools')
      .select('id, tier, status, overall_score, rank_order, momentum, school:schools(id, name, verified_division)')
      .eq('player_id', player.id)
      .order('rank_order', { ascending: true }),
    service
      .from('contacts')
      .select('id, contact_type, direction, contact_date, subject, notes, email_body, coach_name, coach_email, follow_up_date, created_at, school:schools(id, name, verified_division)')
      .eq('player_id', player.id)
      .order('contact_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  type PSWithSchool = Pick<PSRow, 'id' | 'tier' | 'status' | 'overall_score' | 'rank_order' | 'momentum'> & {
    school: Pick<SchoolRow, 'id' | 'name' | 'verified_division'>
  }
  const playerSchools = ((psResult.data ?? []) as unknown as PSWithSchool[])

  const totalSchools = playerSchools.length
  const contacted = playerSchools.filter((s) => CONTACTED_STATUSES.has(s.status)).length
  const offers = playerSchools.filter((s) => s.status === 'offer_received').length
  const committed = playerSchools.filter((s) => s.status === 'committed').length
  const tierCounts = {
    Lock: playerSchools.filter((s) => s.tier === 'Lock').length,
    Realistic: playerSchools.filter((s) => s.tier === 'Realistic').length,
    Reach: playerSchools.filter((s) => s.tier === 'Reach').length,
  }
  const momentumCounts = {
    hot: playerSchools.filter((s) => s.momentum === 'hot' && s.status !== 'declined').length,
    neutral: playerSchools.filter(
      (s) => (s.momentum === 'neutral' || s.momentum == null) && s.status !== 'declined'
    ).length,
    cold: playerSchools.filter((s) => s.momentum === 'cold' && s.status !== 'declined').length,
  }
  // Top 10 — sort by momentum priority first (hot → neutral/null → cold), then rank_order
  const topSchools = playerSchools
    .filter((s) => s.status !== 'declined')
    .sort((a, b) => {
      const pa = momentumPriority(a.momentum)
      const pb = momentumPriority(b.momentum)
      if (pa !== pb) return pa - pb
      return a.rank_order - b.rank_order
    })
    .slice(0, 10)

  const statusCounts: Record<string, number> = {}
  for (const ps of playerSchools) {
    statusCounts[ps.status] = (statusCounts[ps.status] ?? 0) + 1
  }
  const pipelineStages = PIPELINE_ORDER
    .filter((s) => s !== 'declined')
    .map((status) => ({ status, count: statusCounts[status] ?? 0 }))

  type ContactWithSchool = Omit<ContactRow, 'player_id' | 'school_id'> & {
    school: Pick<SchoolRow, 'id' | 'name' | 'verified_division'>
  }
  const contacts = ((contactsResult.data ?? []) as unknown as ContactWithSchool[]).map((c) => ({
    id: c.id, contact_type: c.contact_type as ContactType,
    direction: c.direction as 'outbound' | 'inbound', contact_date: c.contact_date,
    subject: c.subject, notes: c.notes, email_body: c.email_body,
    coach_name: c.coach_name, coach_email: c.coach_email,
    follow_up_date: c.follow_up_date, created_at: c.created_at, school: c.school,
  }))

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

      {/* ── Page header ── */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#4ADE80' }}>
              Dashboard
            </p>
            <h1 className="text-3xl font-bold tracking-tight mt-1">
              Welcome back, <span style={{ color: '#4ADE80' }}>{player.first_name}</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {player.primary_position} · Class of {player.grad_year} · {player.club_team}
            </p>
          </div>
          <AddTokensButton />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap pt-2">
          {[
            { href: '/schools', label: 'My Schools', icon: School },
            { href: '/communications', label: 'Log Contact', icon: Mail },
            { href: '/ai/draft', label: 'Draft Email', icon: Target },
            { href: '/profile/edit', label: 'Edit Profile', icon: Activity },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-card text-xs font-medium transition-colors hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── BIG stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <BigStat label="Total Schools" value={totalSchools} icon={School} />
        <BigStat label="In Contact" value={contacted} icon={Mail} sub={totalSchools > 0 ? `${Math.round((contacted / totalSchools) * 100)}% of list` : undefined} />
        <BigStat label="Offers" value={offers} icon={Trophy} accent />
        <BigStat label="Committed" value={committed} icon={CheckCircle2} accent={committed > 0} />
      </div>

      {/* ── Momentum + tier rings ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Momentum */}
        <Card>
          <CardHeader title="Momentum" subtitle="How your active schools are trending" />
          <div className="grid grid-cols-3 gap-3 px-4 pb-4">
            <MomentumStat
              label="Heating up"
              count={momentumCounts.hot}
              icon={Flame}
              ring="rgba(249,115,22,0.5)"
              text="#FB923C"
              fill="rgba(249,115,22,0.1)"
            />
            <MomentumStat
              label="Neutral"
              count={momentumCounts.neutral}
              icon={Minus}
              ring="rgba(255,255,255,0.2)"
              text="#FFFFFF"
              fill="rgba(255,255,255,0.04)"
            />
            <MomentumStat
              label="Going cold"
              count={momentumCounts.cold}
              icon={Snowflake}
              ring="rgba(14,165,233,0.5)"
              text="#38BDF8"
              fill="rgba(14,165,233,0.1)"
            />
          </div>
        </Card>

        {/* Tier rings */}
        <Card>
          <CardHeader title="Tier breakdown" subtitle={`${totalSchools} schools across all tiers`} />
          <div className="grid grid-cols-3 gap-3 px-4 pb-4">
            <TierRing label="Lock" count={tierCounts.Lock} total={totalSchools} color="#4ADE80" />
            <TierRing label="Realistic" count={tierCounts.Realistic} total={totalSchools} color="#60A5FA" />
            <TierRing label="Reach" count={tierCounts.Reach} total={totalSchools} color="#FBBF24" />
          </div>
        </Card>
      </div>

      {/* ── Pipeline funnel ── */}
      <Card>
        <CardHeader title="Pipeline" subtitle="Where your schools sit right now" action={{ label: 'View all', href: '/schools' }} />
        {totalSchools === 0 ? (
          <EmptyState label="No schools yet." link={{ href: '/schools', label: 'Add your first school' }} />
        ) : (
          <div className="px-4 pb-4 space-y-3">
            {pipelineStages.map(({ status, count }) => {
              const pct = totalSchools > 0 ? (count / totalSchools) * 100 : 0
              const intensity = STAGE_INTENSITY[status] ?? 0.4
              return (
                <div key={status} className="flex items-center gap-4">
                  <div className="w-32 flex-shrink-0">
                    <p className="text-xs font-medium">{STATUS_LABELS[status]}</p>
                  </div>
                  <div className="flex-1 h-7 rounded-md overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <div
                      className="h-full transition-all flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.max(pct, count > 0 ? 4 : 0)}%`,
                        backgroundColor: `rgba(74, 222, 128, ${intensity})`,
                      }}
                    >
                      {count > 0 && pct > 8 && (
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: '#0F1120' }}>{count}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color: count === 0 ? '#9CA3AF' : '#FFFFFF' }}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ── Top 10 Schools — visual grid ── */}
      <Card>
        <CardHeader
          title="My Top 10 Schools"
          subtitle="Sorted by momentum, then your manual ranking"
          icon={<Trophy className="w-4 h-4" style={{ color: '#4ADE80' }} />}
          action={{ label: 'Reorder', href: '/schools' }}
        />
        {topSchools.length === 0 ? (
          <EmptyState label="No schools yet." link={{ href: '/schools', label: 'Add your first school' }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-3 pb-4">
            {topSchools.map((ps, i) => (
              <Top10Card key={ps.id} ps={ps} rank={i + 1} />
            ))}
          </div>
        )}
      </Card>

      {/* ── Activity timeline + Follow-ups ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Recent Activity"
              icon={<Activity className="w-4 h-4" style={{ color: '#4ADE80' }} />}
              action={{ label: 'View all', href: '/communications' }}
            />
            {contacts.slice(0, 6).length === 0 ? (
              <EmptyState label="No contacts yet." link={{ href: '/communications', label: 'Log your first contact' }} />
            ) : (
              <div className="px-4 pb-4">
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-3.5 top-2 bottom-2 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                  <div className="space-y-1">
                    {contacts.slice(0, 6).map((c) => {
                      const Icon = CONTACT_TYPE_ICONS[c.contact_type] ?? Mail
                      return (
                        <div key={c.id} className="relative flex items-start gap-3 py-2 pl-0">
                          <div className="relative z-10 w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.12)', backgroundColor: '#0F1120' }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="text-sm font-medium truncate">{c.school.name}</p>
                              <time className="text-[10px] flex-shrink-0" style={{ color: '#9CA3AF' }}>
                                {new Date(c.contact_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </time>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
                                {CONTACT_TYPE_LABELS[c.contact_type]}
                              </span>
                              {(c.subject || c.notes) && (
                                <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                                  · {c.subject ?? c.notes?.slice(0, 60)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div>
          {contacts.length > 0 ? (
            <FollowUpReminders contacts={contacts} />
          ) : (
            <Card>
              <CardHeader title="Follow-ups" icon={<CalendarCheck className="w-4 h-4" style={{ color: '#4ADE80' }} />} />
              <p className="px-4 pb-4 text-xs" style={{ color: '#9CA3AF' }}>
                No follow-up reminders yet. Add follow-up dates when logging coach contacts.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function momentumPriority(m: Momentum | null): number {
  if (m === 'hot') return 0
  if (m === 'cold') return 2
  return 1
}

// Pipeline funnel — bar opacity intensifies as schools advance
const STAGE_INTENSITY: Record<string, number> = {
  researching: 0.18,
  contacted: 0.30,
  interested: 0.45,
  campus_visit: 0.60,
  offer_received: 0.78,
  committed: 1.0,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
      {children}
    </div>
  )
}

function CardHeader({ title, subtitle, icon, action }: {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="flex items-start gap-2">
        {icon && <div className="mt-0.5">{icon}</div>}
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{subtitle}</p>}
        </div>
      </div>
      {action && (
        <Link href={action.href} className="flex items-center gap-1 text-xs transition-colors hover:text-white" style={{ color: '#9CA3AF' }}>
          {action.label}
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  )
}

function BigStat({ label, value, icon: Icon, sub, accent }: {
  label: string
  value: number
  icon: React.ElementType
  sub?: string
  accent?: boolean
}) {
  return (
    <div className="rounded-xl border bg-card px-5 py-5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#9CA3AF' }}>{label}</p>
        <Icon className="w-4 h-4" style={{ color: accent ? '#4ADE80' : '#9CA3AF' }} />
      </div>
      <p className="text-5xl font-black tracking-tight tabular-nums" style={{ color: accent && value > 0 ? '#4ADE80' : '#FFFFFF' }}>
        {value}
      </p>
      {sub && <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>{sub}</p>}
    </div>
  )
}

function MomentumStat({ label, count, icon: Icon, ring, text, fill }: {
  label: string
  count: number
  icon: React.ElementType
  ring: string
  text: string
  fill: string
}) {
  return (
    <div className="rounded-lg border px-3 py-3" style={{ borderColor: ring, backgroundColor: fill }}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color: text }} />
        <span className="text-3xl font-black tabular-nums" style={{ color: text }}>{count}</span>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: text }}>{label}</p>
    </div>
  )
}

function TierRing({ label, count, total, color }: {
  label: string; count: number; total: number; color: string
}) {
  const pct = total > 0 ? (count / total) * 100 : 0
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
          {/* Track */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
          />
          {/* Progress */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 600ms ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black tabular-nums" style={{ color }}>{count}</span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#9CA3AF' }}>
            {Math.round(pct)}%
          </span>
        </div>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color }}>{label}</p>
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
      ? { borderColor: 'rgba(249,115,22,0.45)', boxShadow: '0 0 14px rgba(249,115,22,0.18)' }
      : ps.momentum === 'cold'
      ? { borderColor: 'rgba(14,165,233,0.45)', boxShadow: '0 0 14px rgba(14,165,233,0.18)' }
      : { borderColor: 'rgba(255,255,255,0.08)' }

  return (
    <Link
      href={`/schools/${ps.id}`}
      className="flex items-center gap-3 px-3 py-3 rounded-lg border transition-all hover:bg-white/5 group"
      style={momentumStyle}
    >
      {/* Rank */}
      <div className="flex flex-col items-center justify-center w-8 flex-shrink-0">
        <span className="text-[9px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#9CA3AF' }}>
          #
        </span>
        <span className="text-lg font-black leading-none tabular-nums">{rank}</span>
      </div>

      {/* Tier color bar */}
      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: tierColor }} />

      {/* School info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate group-hover:text-[#4ADE80] transition-colors">
          {ps.school.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-[10px]" style={{ color: '#9CA3AF' }}>
          {ps.school.verified_division && <span>{ps.school.verified_division}</span>}
          {ps.tier && (
            <>
              <span>·</span>
              <span style={{ color: tierColor }}>{ps.tier}</span>
            </>
          )}
        </div>
      </div>

      {/* Momentum icon */}
      {ps.momentum === 'hot' && <Flame className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#FB923C' }} />}
      {ps.momentum === 'cold' && <Snowflake className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#38BDF8' }} />}

      {/* Score */}
      {ps.overall_score != null && (
        <div className="flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-lg font-black leading-none tabular-nums" style={{ color: '#4ADE80' }}>
            {ps.overall_score}
          </span>
          <span className="text-[8px] mt-0.5" style={{ color: '#9CA3AF' }}>/ 100</span>
        </div>
      )}

      <ArrowUpRight className="w-3.5 h-3.5 transition-colors flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
    </Link>
  )
}

function EmptyState({ label, link }: { label: string; link: { href: string; label: string } }) {
  return (
    <div className="px-4 py-8 text-center">
      <p className="text-xs" style={{ color: '#9CA3AF' }}>
        {label}{' '}
        <Link href={link.href} className="hover:underline" style={{ color: '#4ADE80' }}>{link.label}</Link>
      </p>
    </div>
  )
}
