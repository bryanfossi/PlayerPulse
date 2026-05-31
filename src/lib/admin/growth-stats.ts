/**
 * Growth + engagement analytics for /admin/growth.
 *
 * Computes time-series for new signups and daily active users, the
 * sport mix of recent signups, the onboarding-to-activation funnel,
 * and time-to-onboarding metrics.
 *
 * All data is derived from existing tables (profiles, players,
 * match_engine_runs, ai_drafts, contacts, player_schools, actions).
 * No analytics layer (Vercel Analytics, Plausible, GA4) is wired up
 * yet — so visitor/page-view metrics aren't available here.
 */

import { createServiceClient } from '@/lib/supabase/server'
import { isoNDaysAgo } from '@/lib/admin/activity'

export type GrowthStats = Awaited<ReturnType<typeof loadGrowthStats>>

type AnyClient = ReturnType<typeof createServiceClient>
type AnyRow = Record<string, unknown>

interface QueryChain<T> {
  gte: (col: string, val: string) => QueryChain<T>
  lt: (col: string, val: string) => QueryChain<T>
  not: (col: string, op: string, val: unknown) => QueryChain<T>
  order: (col: string, opts: { ascending: boolean }) => QueryChain<T>
  limit: (n: number) => Promise<{ data: T[] | null; error: unknown }>
}

function untypedFrom(client: AnyClient, table: string) {
  return (client as unknown as {
    from: (t: string) => {
      select: (cols: string) => QueryChain<AnyRow>
    }
  }).from(table)
}

function startOfUTCDay(iso: string): string {
  return iso.slice(0, 10)
}

function emptyDayBuckets(daysBack: number): Map<string, number> {
  const m = new Map<string, number>()
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    m.set(d.toISOString().slice(0, 10), 0)
  }
  return m
}

interface ActivityRow { player_id: string; ts: string }

async function activityRowsSince(
  service: AnyClient,
  table: string,
  column: string,
  sinceIso: string,
  limit = 20000,
): Promise<ActivityRow[]> {
  const untyped = service as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        gte: (col: string, val: string) => {
          limit: (n: number) => Promise<{ data: Array<Record<string, unknown>> | null }>
        }
      }
    }
  }
  const { data } = await untyped
    .from(table)
    .select(`player_id, ${column}`)
    .gte(column, sinceIso)
    .limit(limit)
  return (data ?? [])
    .map((r) => ({ player_id: r.player_id as string, ts: r[column] as string }))
    .filter((r) => r.player_id && r.ts)
}

export async function loadGrowthStats() {
  const service = createServiceClient()

  const since7   = isoNDaysAgo(7)
  const since30  = isoNDaysAgo(30)
  const since60  = isoNDaysAgo(60)
  const since90  = isoNDaysAgo(90)
  const sinceToday = (() => {
    const d = new Date()
    d.setUTCHours(0, 0, 0, 0)
    return d.toISOString()
  })()

  // ─── Parallel data pulls ──────────────────────────────────────
  const [
    profilesAll,
    playersAll,
    profilesLast90,
    matchRuns30,
    drafts30,
    contacts30,
    schoolUpdates30,
    actions30,
    playersWithMatchAll,
    playersWithDraftAll,
    playersWithOfferAll,
  ] = await Promise.all([
    // Total signups count — head:true gives us count without rows
    (service as unknown as {
      from: (t: string) => {
        select: (c: string, opts: { count: 'exact'; head: true }) => Promise<{ count: number | null }>
      }
    }).from('profiles').select('id', { count: 'exact', head: true }),

    // Total players count (onboarding-started)
    (service as unknown as {
      from: (t: string) => {
        select: (c: string, opts: { count: 'exact'; head: true }) => Promise<{ count: number | null }>
      }
    }).from('players').select('id', { count: 'exact', head: true }),

    // Profile rows from the last 90 days for daily/cumulative signup chart
    untypedFrom(service, 'profiles')
      .select('id, created_at, role')
      .gte('created_at', since90)
      .order('created_at', { ascending: true })
      .limit(50000),

    // Activity for the last 30 days (for DAU + activation rate)
    activityRowsSince(service, 'match_engine_runs', 'run_at', since30),
    activityRowsSince(service, 'ai_drafts', 'created_at', since30),
    activityRowsSince(service, 'contacts', 'created_at', since30),
    activityRowsSince(service, 'player_schools', 'updated_at', since30),
    activityRowsSince(service, 'actions', 'updated_at', since30),

    // Players who have EVER run match engine / drafted / had an offer
    // (used for the lifetime activation funnel)
    untypedFrom(service, 'players')
      .select('id, match_engine_run_at')
      .not('match_engine_run_at', 'is', null)
      .limit(50000),
    untypedFrom(service, 'ai_drafts')
      .select('player_id')
      .order('created_at', { ascending: false })
      .limit(50000),
    untypedFrom(service, 'offers')
      .select('player_id')
      .order('created_at', { ascending: false })
      .limit(50000),
  ])

  const totalSignups = profilesAll.count ?? 0
  const totalPlayers = playersAll.count ?? 0

  // ─── Player table read (sport mix + onboarding stats) ────────
  const playersDataPromise = untypedFrom(service, 'players')
    .select('id, user_id, sport_id, onboarding_complete, created_at, updated_at, match_engine_run_at')
    .order('created_at', { ascending: false })
    .limit(50000)
  const { data: playersData } = await playersDataPromise

  // ─── Signup time series ──────────────────────────────────────
  type ProfileRow = { id: string; created_at: string; role: string | null }
  const profileRows = (profilesLast90.data as ProfileRow[] | null) ?? []

  const signupsByDay30 = emptyDayBuckets(30)
  const signupsByDay90 = emptyDayBuckets(90)
  for (const p of profileRows) {
    const day = startOfUTCDay(p.created_at)
    if (signupsByDay30.has(day)) signupsByDay30.set(day, (signupsByDay30.get(day) ?? 0) + 1)
    if (signupsByDay90.has(day)) signupsByDay90.set(day, (signupsByDay90.get(day) ?? 0) + 1)
  }

  // Cumulative: prefix sum across the 90-day window. We need a starting
  // baseline = (total signups before since90).
  const signupsBefore90 = totalSignups - profileRows.length
  let running = signupsBefore90
  const cumulative90: Array<{ day: string; total: number }> = []
  for (const day of signupsByDay90.keys()) {
    running += signupsByDay90.get(day) ?? 0
    cumulative90.push({ day, total: running })
  }

  // Today / this week / this month counts
  const todayKey = startOfUTCDay(sinceToday)
  const signupsToday = signupsByDay30.get(todayKey) ?? 0
  let signupsThisWeek = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    signupsThisWeek += signupsByDay30.get(d.toISOString().slice(0, 10)) ?? 0
  }
  let signupsThisMonth = 0
  for (const v of signupsByDay30.values()) signupsThisMonth += v
  const avgDailySignups30 = signupsThisMonth / 30

  // Role split
  const roleSplit: Record<string, number> = { player: 0, parent: 0, coach: 0, unknown: 0 }
  for (const p of profileRows) {
    const r = p.role ?? 'unknown'
    if (r in roleSplit) roleSplit[r] += 1
    else roleSplit.unknown += 1
  }

  // ─── Daily Active Users ──────────────────────────────────────
  const dauByDay = emptyDayBuckets(30)
  // Build a Map<day, Set<player_id>> so dedupe is per-day across event types
  const dayPlayerSets = new Map<string, Set<string>>()
  for (const day of dauByDay.keys()) dayPlayerSets.set(day, new Set())
  const allEvents: ActivityRow[] = [
    ...matchRuns30,
    ...drafts30,
    ...contacts30,
    ...schoolUpdates30,
    ...actions30,
  ]
  for (const ev of allEvents) {
    const day = startOfUTCDay(ev.ts)
    const set = dayPlayerSets.get(day)
    if (set) set.add(ev.player_id)
  }
  for (const [day, set] of dayPlayerSets) {
    dauByDay.set(day, set.size)
  }

  // ─── Sport mix of last-30-day signups ────────────────────────
  type PlayerRow = {
    id: string; user_id: string; sport_id: string | null;
    onboarding_complete: boolean; created_at: string;
    updated_at: string; match_engine_run_at: string | null
  }
  const allPlayers = (playersData as PlayerRow[] | null) ?? []

  const sportSignups30: Record<string, number> = {}
  for (const p of allPlayers) {
    if (p.created_at >= since30) {
      const s = p.sport_id ?? 'unknown'
      sportSignups30[s] = (sportSignups30[s] ?? 0) + 1
    }
  }

  // ─── Onboarding funnel (all-time) ────────────────────────────
  // Stage 1: Registered (profile created)
  // Stage 2: Started wizard (player row exists)
  // Stage 3: Onboarding complete
  // Stage 4: Ran match engine at least once
  // Stage 5: Drafted at least one email
  // Stage 6: Has at least one offer logged
  const playersWithMatchSet = new Set<string>(
    ((playersWithMatchAll.data as Array<{ id: string }> | null) ?? []).map((r) => r.id),
  )
  const playersWithDraftSet = new Set<string>(
    ((playersWithDraftAll.data as Array<{ player_id: string }> | null) ?? []).map((r) => r.player_id),
  )
  const playersWithOfferSet = new Set<string>(
    ((playersWithOfferAll.data as Array<{ player_id: string }> | null) ?? []).map((r) => r.player_id),
  )

  const completedOnboarding = allPlayers.filter((p) => p.onboarding_complete).length

  const funnel = [
    { label: 'Registered', count: totalSignups },
    { label: 'Started wizard', count: totalPlayers },
    { label: 'Completed onboarding', count: completedOnboarding },
    { label: 'Ran match engine', count: playersWithMatchSet.size },
    { label: 'Drafted email', count: playersWithDraftSet.size },
    { label: 'Logged offer', count: playersWithOfferSet.size },
  ]

  // ─── Time to onboarding completion ───────────────────────────
  // For players with onboarding_complete=true, the gap between
  // created_at and updated_at is a rough proxy. Not perfect but
  // gives us a distribution.
  const completionGapsMs: number[] = []
  for (const p of allPlayers) {
    if (p.onboarding_complete && p.created_at && p.updated_at) {
      const gap = new Date(p.updated_at).getTime() - new Date(p.created_at).getTime()
      if (gap >= 0 && gap < 30 * 24 * 60 * 60 * 1000) completionGapsMs.push(gap)
    }
  }
  completionGapsMs.sort((a, b) => a - b)

  function pctMinutes(p: number): number {
    if (completionGapsMs.length === 0) return 0
    const idx = Math.min(completionGapsMs.length - 1, Math.floor((p / 100) * completionGapsMs.length))
    return Math.round(completionGapsMs[idx] / 60_000)
  }

  // ─── Last 24h, 7d, 30d active counts ─────────────────────────
  const activePlayersSince24h = new Set<string>()
  const activePlayersSince7d = new Set<string>()
  const activePlayersSince30d = new Set<string>()
  const since24Iso = isoNDaysAgo(1)
  for (const ev of allEvents) {
    activePlayersSince30d.add(ev.player_id)
    if (ev.ts >= since7) activePlayersSince7d.add(ev.player_id)
    if (ev.ts >= since24Iso) activePlayersSince24h.add(ev.player_id)
  }

  // ─── Stickiness: DAU/MAU ─────────────────────────────────────
  // Yesterday's DAU / 30-day distinct actives
  const yKey = (() => {
    const d = new Date(); d.setUTCDate(d.getUTCDate() - 1)
    return d.toISOString().slice(0, 10)
  })()
  const dauYesterday = dauByDay.get(yKey) ?? 0
  const mau = activePlayersSince30d.size
  const dauMauRatio = mau > 0 ? dauYesterday / mau : 0

  // Suppress unused since60
  void since60

  return {
    generatedAt: new Date().toISOString(),
    kpis: {
      signupsToday,
      signupsThisWeek,
      signupsThisMonth,
      avgDailySignups30,
      totalSignups,
      totalPlayers,
      activePlayersSince24h: activePlayersSince24h.size,
      activePlayersSince7d: activePlayersSince7d.size,
      activePlayersSince30d: mau,
      dauYesterday,
      dauMauRatio,
    },
    signupsByDay30: Array.from(signupsByDay30.entries()).map(([day, count]) => ({ day, count })),
    cumulative90,
    dauByDay30: Array.from(dauByDay.entries()).map(([day, count]) => ({ day, count })),
    sportSignups30,
    roleSplit,
    funnel,
    onboardingTimeMinutes: {
      sampleSize: completionGapsMs.length,
      p25: pctMinutes(25),
      p50: pctMinutes(50),
      p75: pctMinutes(75),
      p90: pctMinutes(90),
    },
  }
}
