import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  School, Mail, Trophy, CheckCircle2, Target, Activity,
  ArrowUpRight,
} from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { FollowUpReminders } from '@/components/communications/FollowUpReminders'
import { PipelineProgressWidget } from '@/components/dashboard/PipelineProgressWidget'
import { AddTokensButton } from '@/components/AddTokensButton'
import type { Database } from '@/types/database'
import type { ContactType } from '@/types/app'

type PlayerRow = Database['public']['Tables']['players']['Row']
type PSRow = Database['public']['Tables']['player_schools']['Row']
type SchoolRow = Database['public']['Tables']['schools']['Row']
type ContactRow = Database['public']['Tables']['contacts']['Row']

const STATUS_LABELS: Record<string, string> = {
  researching: 'Researching', contacted: 'Contacted', interested: 'Interested',
  campus_visit: 'Visit', offer_received: 'Offer', committed: 'Committed', declined: 'Declined',
}
const CONTACTED_STATUSES = new Set(['contacted', 'interested', 'campus_visit', 'offer_received', 'committed'])
const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  email_sent: 'Email', email_received: 'Email', call: 'Call',
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
    .select('id, first_name, last_name, grad_year, primary_position, club_team, rerun_tokens')
    .eq('user_id', user.id)
    .maybeSingle()
  if (playerError) {
    console.error('[dashboard] player query error:', playerError.message, playerError.details)
    // Fall back to basic query without billing columns (migration 004 may not have run)
    const { data: fallbackRaw } = await service
      .from('players')
      .select('id, first_name, last_name, grad_year, primary_position, club_team')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!fallbackRaw) redirect('/onboarding')
    throw new Error(`Database migration required. Run migration 004_stripe_billing.sql in Supabase. Error: ${playerError.message}`)
  }
  const player = playerRaw as Pick<PlayerRow,
    'id' | 'first_name' | 'last_name' | 'grad_year' | 'primary_position' | 'club_team' | 'rerun_tokens'
  > | null
  if (!player) redirect('/onboarding')

  // Parallel fetch — all three queries are independent once we have player.id
  const [psResult, contactsResult] = await Promise.all([
    service
      .from('player_schools')
      .select('id, tier, status, overall_score, rank_order, school:schools(id, name, verified_division)')
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

  type PSWithSchool = Pick<PSRow, 'id' | 'tier' | 'status' | 'overall_score' | 'rank_order'> & {
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
  const topSchools = playerSchools.filter((s) => s.status !== 'declined').slice(0, 5)

  // Pipeline status distribution
  const statusCounts: Record<string, number> = {}
  for (const ps of playerSchools) {
    statusCounts[ps.status] = (statusCounts[ps.status] ?? 0) + 1
  }

  const rerunTokens = player.rerun_tokens ?? 0

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
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, <span className="text-green-400">{player.first_name}</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {player.primary_position} · Class of {player.grad_year} · {player.club_team}
            </p>
          </div>
          <AddTokensButton tokens={rerunTokens} />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { href: '/schools', label: 'My Schools', icon: School },
            { href: '/communications', label: 'Log Contact', icon: Mail },
            { href: '/ai/draft', label: 'Draft Email', icon: Target },
            { href: '/profile/edit', label: 'Edit Profile', icon: Activity },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:border-green-500/30 hover:bg-green-500/5 transition-all"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Schools" value={totalSchools} icon={School} />
        <StatCard label="Contacted" value={contacted} icon={Mail} />
        <StatCard label="Offers" value={offers} icon={Trophy} color="amber" />
        <StatCard label="Committed" value={committed} icon={CheckCircle2} color="green" />
      </div>

      {/* ── Tier breakdown ── */}
      <div className="grid grid-cols-3 gap-4">
        <TierBar tier="Lock" count={tierCounts.Lock} total={totalSchools} color="green" />
        <TierBar tier="Realistic" count={tierCounts.Realistic} total={totalSchools} color="blue" />
        <TierBar tier="Reach" count={tierCounts.Reach} total={totalSchools} color="amber" />
      </div>

      {/* ── Pipeline progress ── */}
      <PipelineProgressWidget statusCounts={statusCounts} total={totalSchools} />

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Top Schools */}
          <Section
            title="Top Schools"
            icon={<Target className="w-4 h-4 text-green-400" />}
            action={{ label: 'View all', href: '/schools' }}
          >
            {topSchools.length === 0 ? (
              <EmptyState label="No schools yet." link={{ href: '/schools', label: 'Add your first school' }} />
            ) : topSchools.map((ps, i) => (
              <Link
                key={ps.id}
                href={`/schools/${ps.id}`}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <span className="text-xs tabular-nums text-muted-foreground/50 w-4 text-right flex-shrink-0">{i + 1}</span>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  ps.tier === 'Lock' ? 'bg-green-400' :
                  ps.tier === 'Realistic' ? 'bg-blue-400' : 'bg-amber-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-green-400 transition-colors">{ps.school.name}</p>
                  <p className="text-[10px] text-muted-foreground">{ps.school.verified_division ?? '—'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {ps.overall_score != null && (
                    <span className="text-xs font-bold tabular-nums text-muted-foreground">{ps.overall_score}</span>
                  )}
                  <StatusPill status={ps.status} />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-green-400/60 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </Section>

          {/* Recent Activity */}
          <Section
            title="Recent Activity"
            icon={<Activity className="w-4 h-4 text-green-400" />}
            action={{ label: 'View all', href: '/communications' }}
          >
            {contacts.slice(0, 5).length === 0 ? (
              <EmptyState label="No contacts yet." link={{ href: '/communications', label: 'Log your first contact' }} />
            ) : contacts.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-start gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{c.school.name}</p>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 bg-muted px-1.5 py-0.5 rounded">
                      {CONTACT_TYPE_LABELS[c.contact_type] ?? c.contact_type}
                    </span>
                  </div>
                  {(c.subject || c.notes) && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {c.subject ?? c.notes?.slice(0, 60)}
                    </p>
                  )}
                </div>
                <time className="text-[10px] text-muted-foreground/50 flex-shrink-0 mt-1">
                  {new Date(c.contact_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </time>
              </div>
            ))}
          </Section>

          {contacts.length > 0 && <FollowUpReminders contacts={contacts} />}
        </div>

        {/* Right (1/3) */}
        <div className="space-y-4">

          </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color?: 'green' | 'amber'
}) {
  const valueColor = color === 'green' ? 'text-green-400' : color === 'amber' ? 'text-amber-400' : 'text-foreground'
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
      <p className={`text-4xl font-black tracking-tight ${valueColor}`}>{value}</p>
    </div>
  )
}

function TierBar({ tier, count, total, color }: {
  tier: string; count: number; total: number; color: 'green' | 'blue' | 'amber'
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const cfg = {
    green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', bar: 'bg-green-500' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', bar: 'bg-blue-500' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', bar: 'bg-amber-500' },
  }[color]
  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} px-4 py-4`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs font-semibold uppercase tracking-widest ${cfg.text}`}>{tier}</p>
        <p className={`text-2xl font-black ${cfg.text}`}>{count}</p>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-1 rounded-full ${cfg.bar} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5">{pct}% of list</p>
    </div>
  )
}

function Section({ title, icon, action, children }: {
  title: string; icon: React.ReactNode;
  action?: { label: string; href: string }; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {action && (
          <Link href={action.href} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-green-400 transition-colors">
            {action.label}
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="py-1">{children}</div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    researching: 'bg-zinc-500/15 text-zinc-400',
    contacted: 'bg-blue-500/15 text-blue-400',
    interested: 'bg-cyan-500/15 text-cyan-400',
    campus_visit: 'bg-purple-500/15 text-purple-400',
    offer_received: 'bg-amber-500/15 text-amber-400',
    committed: 'bg-green-500/15 text-green-400',
    declined: 'bg-red-500/15 text-red-400',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[status] ?? styles.researching}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function EmptyState({ label, link }: { label: string; link: { href: string; label: string } }) {
  return (
    <div className="px-4 py-6 text-center">
      <p className="text-xs text-muted-foreground">{label}{' '}
        <Link href={link.href} className="text-green-400 hover:underline">{link.label}</Link>
      </p>
    </div>
  )
}
