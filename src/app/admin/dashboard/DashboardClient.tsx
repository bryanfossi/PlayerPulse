'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import {
  Users, DollarSign, Activity, CheckCircle2, Repeat, Zap, RefreshCw,
  Loader2, AlertTriangle, ExternalLink, ChevronDown, ChevronRight,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { toast } from 'sonner'
import type { DashboardData } from './page'

interface Props {
  initialData: DashboardData
}

const COLORS = {
  navy: '#1A3A5C',
  gold: '#C9A227',
  green: '#4ADE80',
  red: '#EF4444',
  amber: '#F59E0B',
  blue: '#3B82F6',
  purple: '#A855F7',
  muted: 'rgba(255,255,255,0.4)',
}

const TIER_COLORS: Record<string, string> = {
  free: COLORS.muted,
  starter: COLORS.amber,
  pro: COLORS.green,
  legacy: COLORS.blue,
}

const PIPELINE_COLORS: Record<string, string> = {
  researching:    COLORS.muted,
  contacted:      COLORS.blue,
  interested:     COLORS.amber,
  campus_visit:   COLORS.purple,
  offer_received: COLORS.gold,
  committed:      COLORS.green,
  declined:       COLORS.red,
}

const PIE_COLORS = [COLORS.green, COLORS.gold, COLORS.blue, COLORS.amber, COLORS.purple, COLORS.red, COLORS.muted]

function dollars(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString(undefined, { month: 'short', year: '2-digit' })
}

function relativeSeconds(then: Date, now: Date): number {
  return Math.floor((now.getTime() - then.getTime()) / 1000)
}

function formatAgo(secs: number): string {
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

export function DashboardClient({ initialData }: Props) {
  const [data, setData] = useState<DashboardData>(initialData)
  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date(initialData.generatedAt))
  const [now, setNow] = useState<Date>(new Date())
  const [refreshing, startRefresh] = useTransition()

  // Tick "X seconds ago" once per second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const doRefresh = useCallback(() => {
    startRefresh(async () => {
      try {
        const res = await fetch('/api/admin/dashboard-stats', { cache: 'no-store' })
        if (!res.ok) {
          toast.error('Refresh failed')
          return
        }
        const fresh = (await res.json()) as DashboardData
        setData(fresh)
        setRefreshedAt(new Date(fresh.generatedAt))
      } catch {
        toast.error('Network error during refresh')
      }
    })
  }, [startRefresh])

  // Auto-refresh every 5 min
  useEffect(() => {
    const t = setInterval(() => doRefresh(), 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [doRefresh])

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Platform Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Last refreshed {formatAgo(relativeSeconds(refreshedAt, now))} · auto-refreshes every 5 min
          </p>
        </div>
        <button
          onClick={doRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-sm text-muted-foreground hover:text-white hover:border-white/20 transition-colors disabled:opacity-60"
        >
          {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      <KPIBar data={data} />
      <RevenueSection data={data} />
      <EngagementSection data={data} />
      <AISection data={data} />
      <PipelineSection data={data} />
      <RecentSignupsSection data={data} />
      <HealthSection data={data} />
    </div>
  )
}

/* ─── Sections ─────────────────────────────────────────────────── */

function KPIBar({ data }: { data: DashboardData }) {
  const k = data.kpis
  const cards = [
    {
      label: 'Total Athletes',
      value: k.totalPlayers.toLocaleString(),
      icon: Users,
      accent: false,
    },
    {
      label: 'MRR',
      value: dollars(k.mrrCents),
      icon: DollarSign,
      accent: k.mrrCents > 0,
    },
    {
      label: 'Active (7d)',
      value: k.active7d.toLocaleString(),
      icon: Activity,
      accent: k.active7d > 0,
    },
    {
      label: 'Onboarding Rate',
      value: `${k.onboardingRatePct.toFixed(1)}%`,
      icon: CheckCircle2,
      accent: k.onboardingRatePct >= 75,
      bad: k.onboardingRatePct < 75 && data.kpis.totalPlayers > 0,
    },
    {
      label: 'D30 Retention',
      value: `${k.d30RetentionPct.toFixed(1)}%`,
      icon: Repeat,
      accent: k.d30RetentionPct >= 45,
      bad: k.d30RetentionPct < 45 && data.kpis.totalPlayers > 0,
    },
    {
      label: 'Token Revenue (30d)',
      value: dollars(k.tokenRevenue30Cents),
      icon: Zap,
      accent: k.tokenRevenue30Cents > 0,
    },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cards.map((c) => {
        const Icon = c.icon
        const border = c.bad
          ? 'border-red-500/40'
          : c.accent
          ? 'border-[#C9A227]/40'
          : 'border-white/10'
        const iconColor = c.bad ? '#EF4444' : c.accent ? COLORS.gold : COLORS.muted
        return (
          <div key={c.label} className={`rounded-xl border ${border} bg-[#1A1F38] p-4`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                {c.label}
              </p>
              <Icon className="w-4 h-4" style={{ color: iconColor }} />
            </div>
            <p className="text-3xl font-black">{c.value}</p>
          </div>
        )
      })}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

function Card({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-[#1A1F38] p-4 ${className}`}>
      {title && <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{title}</h3>}
      {children}
    </div>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-48 text-xs text-muted-foreground">
      {label}
    </div>
  )
}

/* ─── Revenue ──────────────────────────────────────────────────── */

function RevenueSection({ data }: { data: DashboardData }) {
  const r = data.revenue
  const planData = Object.entries(r.planCounts).map(([tier, count]) => ({
    tier: tier[0].toUpperCase() + tier.slice(1),
    count,
    color: TIER_COLORS[tier] ?? COLORS.muted,
  }))
  const totalAthletesInPlans = planData.reduce((s, p) => s + p.count, 0)

  const trendData = r.mrrTrend.map((p) => ({
    month: formatMonth(p.month),
    amount: p.amountCents / 100,
  }))

  const packData = Object.entries(r.packSales).map(([label, p]) => ({
    label,
    purchases: p.purchases,
    revenue: p.revenueCents / 100,
  }))

  return (
    <Section title="Revenue & Subscriptions">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card title="Plan Distribution">
          {totalAthletesInPlans > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={planData} layout="vertical" margin={{ top: 4, right: 30, bottom: 4, left: 0 }}>
                <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <YAxis dataKey="tier" type="category" stroke="rgba(255,255,255,0.6)" fontSize={11} width={70} />
                <Tooltip contentStyle={{ background: '#1A1F38', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
                <Bar dataKey="count" fill={COLORS.gold} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No subscribers yet" />
          )}
        </Card>

        <Card title="MRR Trend (Last 6 Months)">
          {trendData.length > 0 && trendData.some((p) => p.amount > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: '#1A1F38', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} formatter={(v) => `$${Number(v ?? 0).toFixed(2)}`} />
                <Line type="monotone" dataKey="amount" stroke={COLORS.gold} strokeWidth={2} dot={{ fill: COLORS.gold, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No paid invoices yet" />
          )}
        </Card>

        <Card title="Token Pack Sales (30d)">
          {packData.some((p) => p.purchases > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={packData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <Tooltip contentStyle={{ background: '#1A1F38', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="purchases" fill={COLORS.green} />
                <Bar dataKey="revenue" fill={COLORS.gold} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No pack purchases in last 30 days" />
          )}
        </Card>
      </div>

      <Card title={`Active Subscriptions (${r.subscriptions.length})`}>
        {r.subscriptions.length === 0 ? (
          <EmptyChart label="No active or trialing subscriptions" />
        ) : (
          <PaginatedTable rows={r.subscriptions} renderRow={(s) => (
            <>
              <td className="px-3 py-2 text-xs">{s.email ?? '(no email)'}</td>
              <td className="px-3 py-2 text-xs capitalize">{s.tier}</td>
              <td className="px-3 py-2 text-xs">
                <StatusPill status={s.subscription_status ?? 'unknown'} />
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{formatDate(s.created_at)}</td>
              <td className="px-3 py-2 text-xs">
                {s.subscription_id ? (
                  <a href={`https://dashboard.stripe.com/subscriptions/${s.subscription_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#4ADE80] hover:underline">
                    Stripe <ExternalLink className="w-3 h-3" />
                  </a>
                ) : <span className="text-muted-foreground/60">—</span>}
              </td>
            </>
          )}
          columns={['Email', 'Plan', 'Status', 'Signed Up', 'Stripe']}
          />
        )}
      </Card>
    </Section>
  )
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active:     'bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/30',
    trialing:   'bg-[#C9A227]/10 text-[#C9A227] border-[#C9A227]/30',
    past_due:   'bg-red-500/10 text-red-300 border-red-500/30',
    canceled:   'bg-white/5 text-muted-foreground border-white/10',
    cancelled:  'bg-white/5 text-muted-foreground border-white/10',
    incomplete: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize ${styles[status] ?? styles.canceled}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function PaginatedTable<T>({
  rows,
  renderRow,
  columns,
  pageSize = 25,
}: {
  rows: T[]
  renderRow: (row: T) => React.ReactNode
  columns: string[]
  pageSize?: number
}) {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const slice = rows.slice(page * pageSize, (page + 1) * pageSize)
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/10">
              {columns.map((c) => (
                <th key={c} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                {renderRow(row)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-2 py-1 rounded border border-white/10 disabled:opacity-40">Prev</button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page === totalPages - 1} className="px-2 py-1 rounded border border-white/10 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Engagement ───────────────────────────────────────────────── */

function EngagementSection({ data }: { data: DashboardData }) {
  const e = data.engagement
  const [showInactive, setShowInactive] = useState(false)

  return (
    <Section title="Athlete Engagement (Last 30 Days)">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="Onboarding Completions" value={e.onboardingCompleted30} />
        <MiniStat label="Match Engine Runs" value={e.matchRuns30} />
        <MiniStat label="Emails Drafted" value={e.drafts30} />
        <MiniStat label="Offers Logged" value={e.offers30} />
      </div>

      <Card title="Engagement Funnel">
        <div className="space-y-3">
          {e.funnel.map((step) => {
            const meetsTarget = step.pct >= step.target
            const barColor = meetsTarget ? COLORS.green : COLORS.red
            return (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="text-muted-foreground">{step.label}</span>
                  <span className={meetsTarget ? 'text-[#4ADE80]' : 'text-red-300'}>
                    {step.pct.toFixed(1)}% <span className="text-muted-foreground">/ target {step.target}%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full transition-all" style={{ width: `${Math.min(100, step.pct)}%`, backgroundColor: barColor }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="Top 10 Most Engaged Athletes (30d)">
        {e.topEngaged.length === 0 ? (
          <EmptyChart label="No engagement data yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/10">
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rank</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Athlete</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sport</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Grad</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Plan</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Match</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Emails</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Schools</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contacts</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Score</th>
                </tr>
              </thead>
              <tbody>
                {e.topEngaged.map((p, i) => (
                  <tr key={p.id} className="border-b border-white/5 last:border-0">
                    <td className="px-3 py-2 text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 text-xs">{`${p.first_name} ${p.last_name}`.trim() || '(no name)'}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground capitalize">{p.sport_id ?? '—'}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{p.grad_year}</td>
                    <td className="px-3 py-2 text-xs capitalize">{p.tier}</td>
                    <td className="px-3 py-2 text-xs text-right">{p.match}</td>
                    <td className="px-3 py-2 text-xs text-right">{p.draft}</td>
                    <td className="px-3 py-2 text-xs text-right">{p.school}</td>
                    <td className="px-3 py-2 text-xs text-right">{p.contact}</td>
                    <td className="px-3 py-2 text-xs text-right font-bold text-[#C9A227]">{p.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {e.inactive.length > 0 && (
        <Card>
          <button
            onClick={() => setShowInactive((v) => !v)}
            className="w-full flex items-center justify-between text-sm"
          >
            <span className="font-semibold text-amber-300">
              {e.inactive.length} {e.inactive.length === 1 ? 'athlete has' : 'athletes have'} been inactive for 30+ days
            </span>
            {showInactive ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {showInactive && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/10">
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Athlete</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Plan</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Signed Up</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Match Run</th>
                  </tr>
                </thead>
                <tbody>
                  {e.inactive.slice(0, 50).map((p) => (
                    <tr key={p.id} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-2 text-xs">{p.name || '(no name)'}</td>
                      <td className="px-3 py-2 text-xs capitalize">{p.tier}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(p.signed_up)}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {p.last_match_run ? formatDate(p.last_match_run) : 'never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {e.inactive.length > 50 && (
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  Showing first 50 of {e.inactive.length}
                </p>
              )}
            </div>
          )}
        </Card>
      )}
    </Section>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1A1F38] p-4">
      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">{label}</p>
      <p className="text-2xl font-black">{value.toLocaleString()}</p>
    </div>
  )
}

/* ─── AI ───────────────────────────────────────────────────────── */

function AISection({ data }: { data: DashboardData }) {
  const a = data.ai
  const matchLineData = a.matchEngineByDay.map((d) => ({ day: d.day.slice(5), runs: d.runs }))
  const emailDonutData = Object.entries(a.emailTypeCounts).map(([type, count], i) => ({
    name: type.replace(/_/g, ' '),
    value: count,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }))
  const balanceData = Object.entries(a.balanceBuckets).map(([bucket, count]) => ({ bucket, count }))

  const totalRuns = matchLineData.reduce((s, p) => s + p.runs, 0)

  return (
    <Section title="AI Feature Usage">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card title="Match Engine Usage (30d)">
          {totalRuns > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={matchLineData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1A1F38', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
                <Line type="monotone" dataKey="runs" stroke={COLORS.green} strokeWidth={2} dot={{ fill: COLORS.green, r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No match engine runs in last 30 days" />
          )}
        </Card>

        <Card title="Email Drafts by Type (30d)">
          {emailDonutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={emailDonutData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                  {emailDonutData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1A1F38', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No emails drafted yet" />
          )}
        </Card>

        <Card title="Token Balance Distribution">
          {balanceData.some((b) => b.count > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={balanceData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="bucket" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1A1F38', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
                <Bar dataKey="count" fill={COLORS.gold} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No athletes yet" />
          )}
        </Card>
      </div>

      <Card title="AI Feature Usage Table">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/10">
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Feature</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Uses (7d)</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Uses (30d)</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unique Athletes (30d)</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg per Active User</th>
              </tr>
            </thead>
            <tbody>
              {a.featureUsage.map((f) => (
                <tr key={f.feature} className="border-b border-white/5 last:border-0">
                  <td className="px-3 py-2 text-xs">{f.feature}</td>
                  <td className="px-3 py-2 text-xs text-right">{f.uses7d}</td>
                  <td className="px-3 py-2 text-xs text-right">{f.uses30d}</td>
                  <td className="px-3 py-2 text-xs text-right">{f.uniquePlayers30d}</td>
                  <td className="px-3 py-2 text-xs text-right">
                    {f.uniquePlayers30d > 0 ? (f.uses30d / f.uniquePlayers30d).toFixed(1) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  )
}

/* ─── Pipeline ─────────────────────────────────────────────────── */

function PipelineSection({ data }: { data: DashboardData }) {
  const p = data.pipeline
  const stageData = Object.entries(p.stages).map(([status, count]) => ({
    status: status.replace(/_/g, ' '),
    count,
    fill: PIPELINE_COLORS[status] ?? COLORS.muted,
  }))
  const divData = Object.entries(p.divisions).map(([div, count], i) => ({
    name: div,
    value: count,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }))
  const sportData = Object.entries(p.sports).map(([sport, count]) => ({
    sport,
    count,
  }))

  return (
    <Section title="Recruiting Pipeline">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card title="Pipeline Stage">
          {stageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stageData} layout="vertical" margin={{ top: 4, right: 30, bottom: 4, left: 0 }}>
                <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <YAxis dataKey="status" type="category" stroke="rgba(255,255,255,0.6)" fontSize={10} width={90} />
                <Tooltip contentStyle={{ background: '#1A1F38', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stageData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No schools on player boards yet" />
          )}
        </Card>

        <Card title="Division Targets">
          {divData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={divData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {divData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1A1F38', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No schools yet" />
          )}
        </Card>

        <Card title="Sport Breakdown">
          {sportData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sportData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="sport" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1A1F38', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
                <Bar dataKey="count" fill={COLORS.gold} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No athletes yet" />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="Total Offers Logged" value={p.offersAll} />
        <MiniStat label="Offers Logged (30d)" value={p.offers30} />
        <MiniStat label="Commitments" value={p.commitments} />
        <Card title="Avg Net Cost">
          <p className="text-2xl font-black">${p.avgNetCostUsd.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Across logged offers</p>
        </Card>
      </div>
    </Section>
  )
}

/* ─── Recent signups ───────────────────────────────────────────── */

function RecentSignupsSection({ data }: { data: DashboardData }) {
  return (
    <Section title="Recent Athlete Signups">
      <Card>
        {data.recentSignups.length === 0 ? (
          <EmptyChart label="No signups yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/10">
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Athlete</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sport</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Grad</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Club</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Plan</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Onboarding</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Signed Up</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSignups.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-2 text-xs">{`${p.first_name} ${p.last_name}`.trim() || '(no name)'}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground capitalize">{p.sport_id ?? '—'}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{p.grad_year}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{p.club_team}</td>
                    <td className="px-3 py-2 text-xs capitalize">{p.tier}</td>
                    <td className="px-3 py-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                        p.onboarding_complete
                          ? 'bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/30'
                          : 'bg-[#C9A227]/10 text-[#C9A227] border-[#C9A227]/30'
                      }`}>
                        {p.onboarding_complete ? 'Complete' : 'Incomplete'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Section>
  )
}

/* ─── Health & Alerts ──────────────────────────────────────────── */

function HealthSection({ data }: { data: DashboardData }) {
  const a = data.alerts
  const s = data.system
  const hasAlerts = a.pastDue.length > 0 || a.stuckOnboarding.length > 0 || a.zeroTokenSubscribers.length > 0 || a.expiringInvites.length > 0
  return (
    <Section title="Platform Health">
      {hasAlerts && (
        <div className="space-y-3">
          {a.pastDue.length > 0 && (
            <AlertCard color="red" title={`Past-Due Subscriptions (${a.pastDue.length})`}>
              <ul className="text-xs space-y-1">
                {a.pastDue.slice(0, 10).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <span>{p.email}</span>
                    {p.subscription_id && (
                      <a href={`https://dashboard.stripe.com/subscriptions/${p.subscription_id}`} target="_blank" rel="noopener noreferrer" className="text-red-200 hover:underline inline-flex items-center gap-1">
                        Stripe <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </AlertCard>
          )}
          {a.stuckOnboarding.length > 0 && (
            <AlertCard color="amber" title={`Stuck in Onboarding 7+ Days (${a.stuckOnboarding.length})`}>
              <ul className="text-xs space-y-1">
                {a.stuckOnboarding.slice(0, 10).map((p) => (
                  <li key={p.id}>{`${p.first_name} ${p.last_name}`.trim() || '(no name)'} — signed up {formatDate(p.created_at)}</li>
                ))}
              </ul>
            </AlertCard>
          )}
          {a.zeroTokenSubscribers.length > 0 && (
            <AlertCard color="gold" title={`Active Subscribers with 0 Tokens (${a.zeroTokenSubscribers.length})`}>
              <ul className="text-xs space-y-1">
                {a.zeroTokenSubscribers.slice(0, 10).map((p) => (
                  <li key={p.id}>{`${p.first_name} ${p.last_name}`.trim()} — {p.tier}</li>
                ))}
              </ul>
            </AlertCard>
          )}
          {a.expiringInvites.length > 0 && (
            <AlertCard color="gold" title={`Parent Invites Expiring within 48h (${a.expiringInvites.length})`}>
              <ul className="text-xs space-y-1">
                {a.expiringInvites.slice(0, 10).map((p) => (
                  <li key={p.id}>{p.email} — expires {formatDate(p.expires_at)}</li>
                ))}
              </ul>
            </AlertCard>
          )}
        </div>
      )}

      <Card title="System Status">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <SystemIndicator label="Supabase" ok={s.supabase} okLabel="Connected" badLabel="Unreachable" />
          <SystemIndicator label="Stripe" ok={s.stripe} okLabel={s.stripeLive ? 'Live mode' : 'Test mode'} badLabel="Not configured" />
          <SystemIndicator label="Resend" ok={s.resend} okLabel="Connected" badLabel="Not configured" />
          <SystemIndicator label="Sentry" ok={s.sentry} okLabel="Monitoring active" badLabel="Not configured" />
        </div>
      </Card>
    </Section>
  )
}

function AlertCard({ color, title, children }: { color: 'red' | 'amber' | 'gold'; title: string; children: React.ReactNode }) {
  const styles = {
    red:   'border-red-500/30 bg-red-500/10 text-red-200',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    gold:  'border-[#C9A227]/30 bg-[#C9A227]/10 text-[#C9A227]',
  }[color]
  return (
    <div className={`rounded-xl border p-4 ${styles}`}>
      <p className="text-sm font-bold mb-2 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        {title}
      </p>
      {children}
    </div>
  )
}

function SystemIndicator({ label, ok, okLabel, badLabel }: { label: string; ok: boolean; okLabel: string; badLabel: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${ok ? 'bg-[#4ADE80]' : 'bg-muted-foreground/40'}`} />
      <span className="text-xs font-bold">{label}</span>
      <span className={`text-xs ml-auto ${ok ? 'text-[#4ADE80]' : 'text-muted-foreground'}`}>
        {ok ? okLabel : badLabel}
      </span>
    </div>
  )
}
