'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import {
  Users, UserPlus, Activity, TrendingUp, Loader2, RefreshCw, Clock,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { toast } from 'sonner'
import type { GrowthData } from './page'

interface Props {
  initialData: GrowthData
}

const COLORS = {
  green:   '#4ade80',
  greenDk: '#22c55e',
  red:     '#ef4444',
  amber:   '#f59e0b',
  blue:    '#3b82f6',
  cyan:    '#22d3ee',
  purple:  '#8b5cf6',
  muted:   'rgba(255,255,255,0.4)',
}

const SPORT_COLOR: Record<string, string> = {
  soccer:     COLORS.green,
  football:   COLORS.red,
  basketball: COLORS.amber,
  volleyball: COLORS.purple,
  baseball:   COLORS.blue,
  lacrosse:   COLORS.cyan,
  unknown:    COLORS.muted,
}

const ROLE_COLOR: Record<string, string> = {
  player:  COLORS.green,
  parent:  COLORS.amber,
  coach:   COLORS.blue,
  unknown: COLORS.muted,
}

function fmtDay(d: string): string {
  // 'YYYY-MM-DD' → 'MMM D'
  const date = new Date(d + 'T00:00:00Z')
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function relativeSeconds(then: Date, now: Date): number {
  return Math.floor((now.getTime() - then.getTime()) / 1000)
}

function formatAgo(secs: number): string {
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

export function GrowthClient({ initialData }: Props) {
  // The page is a server component — refresh is implemented as a full
  // reload, so we don't need to manage `data` in state. The render is
  // always against the server-rendered snapshot.
  const data = initialData
  const refreshedAt = new Date(initialData.generatedAt)
  const [now, setNow] = useState<Date>(new Date())
  const [refreshing, startRefresh] = useTransition()

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const doRefresh = useCallback(() => {
    startRefresh(async () => {
      try {
        const res = await fetch(window.location.pathname, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
        if (!res.ok) {
          toast.error('Refresh failed')
          return
        }
        // Hard reload — the page is a server component, so we re-fetch from the server route.
        window.location.reload()
      } catch {
        toast.error('Network error during refresh')
      }
    })
  }, [startRefresh])

  // Auto refresh every 5 min
  useEffect(() => {
    const t = setInterval(() => doRefresh(), 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [doRefresh])

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Growth & Engagement</h1>
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

      <SignupKPIBar data={data} />
      <SignupTrendSection data={data} />
      <ActivitySection data={data} />
      <FunnelSection data={data} />
      <BreakdownSection data={data} />
    </div>
  )
}

/* ─── KPI Bar ──────────────────────────────────────────────────── */

function SignupKPIBar({ data }: { data: GrowthData }) {
  const k = data.kpis
  const cards = [
    {
      label: 'Signups today',
      value: k.signupsToday.toLocaleString(),
      icon: UserPlus,
      accent: k.signupsToday > 0,
    },
    {
      label: 'Signups this week',
      value: k.signupsThisWeek.toLocaleString(),
      icon: TrendingUp,
      accent: k.signupsThisWeek > 0,
    },
    {
      label: 'Signups this month',
      value: k.signupsThisMonth.toLocaleString(),
      icon: TrendingUp,
      accent: k.signupsThisMonth > 0,
    },
    {
      label: 'Avg/day (30d)',
      value: k.avgDailySignups30.toFixed(1),
      icon: TrendingUp,
      accent: k.avgDailySignups30 >= 1,
    },
    {
      label: 'Active (24h)',
      value: k.activePlayersSince24h.toLocaleString(),
      icon: Activity,
      accent: k.activePlayersSince24h > 0,
    },
    {
      label: 'Active (7d)',
      value: k.activePlayersSince7d.toLocaleString(),
      icon: Activity,
      accent: k.activePlayersSince7d > 0,
    },
    {
      label: 'Active (30d) · MAU',
      value: k.activePlayersSince30d.toLocaleString(),
      icon: Users,
      accent: k.activePlayersSince30d > 0,
    },
    {
      label: 'DAU/MAU ratio',
      value: `${(k.dauMauRatio * 100).toFixed(1)}%`,
      icon: Activity,
      accent: k.dauMauRatio >= 0.2,
      bad: k.dauMauRatio < 0.1 && k.activePlayersSince30d > 5,
    },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => {
        const Icon = c.icon
        const border = c.bad
          ? 'border-red-500/40'
          : c.accent
          ? 'border-[#4ade80]/40'
          : 'border-white/10'
        const iconColor = c.bad ? COLORS.red : c.accent ? COLORS.green : COLORS.muted
        return (
          <div key={c.label} className={`rounded-xl border ${border} bg-[#1A1F38] p-4`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{c.label}</p>
              <Icon className="w-4 h-4" style={{ color: iconColor }} />
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Sections ─────────────────────────────────────────────────── */

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
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
  return <div className="flex items-center justify-center h-48 text-xs text-muted-foreground">{label}</div>
}

/* ─── Signup trend ────────────────────────────────────────────── */

function SignupTrendSection({ data }: { data: GrowthData }) {
  const dailyData = data.signupsByDay30.map((d) => ({ day: fmtDay(d.day), count: d.count }))
  const cumulativeData = data.cumulative90.map((d) => ({ day: fmtDay(d.day), total: d.total }))

  const dailyTotal = data.signupsByDay30.reduce((s, d) => s + d.count, 0)

  return (
    <Section title="Signups Over Time">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="New signups per day (30d)">
          {dailyTotal > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1A1F38', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
                <Bar dataKey="count" fill={COLORS.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No signups in the last 30 days" />
          )}
        </Card>

        <Card title="Cumulative signups (90d)">
          {cumulativeData.length > 0 && cumulativeData[cumulativeData.length - 1].total > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={cumulativeData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1A1F38', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
                <Area type="monotone" dataKey="total" stroke={COLORS.green} strokeWidth={2} fill="url(#cumGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No cumulative signup data yet" />
          )}
        </Card>
      </div>
    </Section>
  )
}

/* ─── Daily Active Users ──────────────────────────────────────── */

function ActivitySection({ data }: { data: GrowthData }) {
  const dauData = data.dauByDay30.map((d) => ({ day: fmtDay(d.day), users: d.count }))
  const totalActive = data.dauByDay30.reduce((s, d) => s + d.count, 0)
  return (
    <Section
      title="Active Users"
      subtitle="Distinct players who took any action (match run, email draft, contact logged, board update, action completed) on that day."
    >
      <Card>
        {totalActive > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dauData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={10} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1A1F38', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
              <Line type="monotone" dataKey="users" stroke={COLORS.blue} strokeWidth={2} dot={{ fill: COLORS.blue, r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="No active-user days yet" />
        )}
      </Card>
    </Section>
  )
}

/* ─── Activation Funnel ──────────────────────────────────────── */

function FunnelSection({ data }: { data: GrowthData }) {
  const top = data.funnel[0]?.count ?? 0
  const ob = data.onboardingTimeMinutes
  return (
    <Section
      title="Activation Funnel"
      subtitle="All-time conversion from registration through the first offer logged. Percentages relative to the top of the funnel."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card title="Funnel" className="lg:col-span-2">
          <div className="space-y-3">
            {data.funnel.map((step) => {
              const pct = top > 0 ? (step.count / top) * 100 : 0
              return (
                <div key={step.label}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="text-muted-foreground">{step.label}</span>
                    <span className="text-white">
                      {step.count.toLocaleString()} <span className="text-muted-foreground">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: COLORS.green }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card title="Onboarding completion time">
          {ob.sampleSize > 0 ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Clock className="w-3.5 h-3.5" />
                <span>From profile create → onboarding complete</span>
              </div>
              <FunnelStat label="Median (p50)" value={`${ob.p50} min`} accent />
              <FunnelStat label="p25" value={`${ob.p25} min`} />
              <FunnelStat label="p75" value={`${ob.p75} min`} />
              <FunnelStat label="p90" value={`${ob.p90} min`} />
              <p className="text-[10px] text-muted-foreground/70 mt-2 pt-2 border-t border-white/10">
                Sample: {ob.sampleSize} completed onboardings
              </p>
            </div>
          ) : (
            <EmptyChart label="No completed onboardings yet" />
          )}
        </Card>
      </div>
    </Section>
  )
}

function FunnelStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-bold ${accent ? 'text-[#4ade80]' : 'text-white'}`}>{value}</span>
    </div>
  )
}

/* ─── Sport + Role Breakdown ─────────────────────────────────── */

function BreakdownSection({ data }: { data: GrowthData }) {
  const sportData = Object.entries(data.sportSignups30)
    .map(([sport, count]) => ({ name: sport, value: count, fill: SPORT_COLOR[sport] ?? COLORS.muted }))
    .sort((a, b) => b.value - a.value)
  const roleData = Object.entries(data.roleSplit)
    .filter(([, count]) => count > 0)
    .map(([role, count]) => ({ name: role, value: count, fill: ROLE_COLOR[role] ?? COLORS.muted }))
  const sportTotal = sportData.reduce((s, d) => s + d.value, 0)
  const roleTotal = roleData.reduce((s, d) => s + d.value, 0)

  return (
    <Section title="Breakdown">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Sport mix of new signups (30d)">
          {sportTotal > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sportData} layout="vertical" margin={{ top: 4, right: 30, bottom: 4, left: 0 }}>
                <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={10} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.6)" fontSize={11} width={80} />
                <Tooltip contentStyle={{ background: '#1A1F38', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {sportData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No sport-tagged signups in last 30 days" />
          )}
        </Card>

        <Card title="Role split of last-90-day signups">
          {roleTotal > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {roleData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1A1F38', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No role data yet" />
          )}
        </Card>
      </div>
    </Section>
  )
}
