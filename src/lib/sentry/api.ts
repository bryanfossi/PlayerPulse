/**
 * Sentry REST API helpers for the admin dashboard.
 *
 * Auth uses SENTRY_API_TOKEN — a separate token from SENTRY_AUTH_TOKEN
 * (which the wizard creates for source-map uploads with project:releases
 * scope only). This token needs event:read + project:read + org:read.
 *
 * Cached 5 min per Vercel instance so auto-refresh doesn't burn through
 * the API quota (40 req/sec/org).
 */

const DEFAULT_ORG = 'promoted-soccer-consultants'
const DEFAULT_PROJECT = 'fuse-id'
const TTL_MS = 5 * 60 * 1000

type CacheEntry<T> = { value: T; expiresAt: number }
const cache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(key: string): T | null {
  const e = cache.get(key)
  if (!e) return null
  if (Date.now() > e.expiresAt) {
    cache.delete(key)
    return null
  }
  return e.value as T
}

function setCached<T>(key: string, value: T): void {
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS })
}

export function sentryApiConfigured(): boolean {
  return !!process.env.SENTRY_API_TOKEN
}

function getOrg(): string {
  return process.env.SENTRY_ORG ?? DEFAULT_ORG
}

function getProject(): string {
  return process.env.SENTRY_PROJECT ?? DEFAULT_PROJECT
}

async function sentryFetch<T>(path: string, query: Record<string, string> = {}): Promise<T | null> {
  const token = process.env.SENTRY_API_TOKEN
  if (!token) return null

  const url = new URL(`https://sentry.io${path}`)
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    // Sentry's API can be slow on cold cache — give it 15s.
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    console.error(`[sentry-api] ${path} returned ${res.status}:`, await res.text().catch(() => ''))
    return null
  }
  return (await res.json()) as T
}

export interface SentryIssue {
  id: string
  shortId: string
  title: string
  culprit: string | null
  level: string
  status: string
  count: string         // returned as string from Sentry
  userCount: number
  firstSeen: string
  lastSeen: string
  permalink: string
  metadata?: { type?: string; value?: string }
}

export interface SentryDashboardData {
  errors24h: number
  errors7d: number
  topIssues: SentryIssue[]
  byDay: { day: string; count: number }[]
  /** Direct link to filtered issues view in Sentry. */
  issuesUrl: string
}

/**
 * One-shot fetch of everything the admin dashboard needs from Sentry.
 * Cached 5 min. Returns null if SENTRY_API_TOKEN isn't set.
 */
export async function getSentryDashboardData(): Promise<SentryDashboardData | null> {
  if (!sentryApiConfigured()) return null

  const cached = getCached<SentryDashboardData>('sentry-dashboard')
  if (cached) return cached

  const org = getOrg()
  const project = getProject()
  const issuesUrl = `https://${org}.sentry.io/issues/?project=&query=is%3Aunresolved&statsPeriod=24h`

  // Fetch top unresolved issues over 7d (sorted by frequency) — we'll
  // derive 24h counts from the per-issue stats.
  const issuesResp = await sentryFetch<SentryIssue[]>(
    `/api/0/projects/${org}/${project}/issues/`,
    {
      query: 'is:unresolved',
      statsPeriod: '7d',
      sort: 'freq',
      limit: '10',
    },
  )
  const topIssues = issuesResp ?? []

  // Sum events over 7d from the issues themselves (count returned per issue).
  const errors7d = topIssues.reduce((sum, i) => sum + (parseInt(i.count, 10) || 0), 0)

  // For 24h, we need a separate query (or could re-page issues w/ statsPeriod=24h).
  const issues24hResp = await sentryFetch<SentryIssue[]>(
    `/api/0/projects/${org}/${project}/issues/`,
    {
      query: 'is:unresolved',
      statsPeriod: '24h',
      sort: 'freq',
      limit: '100',
    },
  )
  const errors24h = (issues24hResp ?? []).reduce((sum, i) => sum + (parseInt(i.count, 10) || 0), 0)

  // 14-day series via Sentry's stats endpoint.
  const statsResp = await sentryFetch<{
    intervals: string[]
    groups: Array<{ totals: { 'sum(quantity)': number }; series: { 'sum(quantity)': number[] } }>
  }>(`/api/0/organizations/${org}/events-stats/`, {
    project: '-1', // all projects in the org — fine since we have one
    statsPeriod: '14d',
    interval: '1d',
    query: 'event.type:error',
    yAxis: 'count()',
  })

  let byDay: { day: string; count: number }[] = []
  if (statsResp && Array.isArray((statsResp as unknown as { data?: unknown[] }).data)) {
    // events-stats returns: { data: [[timestamp, [{count}]], ...] }
    const rawData = (statsResp as unknown as { data: Array<[number, Array<{ count: number }>]> }).data
    byDay = rawData.map(([ts, points]) => ({
      day: new Date(ts * 1000).toISOString().slice(0, 10),
      count: points.reduce((s, p) => s + (p.count ?? 0), 0),
    }))
  }

  const result: SentryDashboardData = {
    errors24h,
    errors7d,
    topIssues: topIssues.slice(0, 5),
    byDay,
    issuesUrl,
  }
  setCached('sentry-dashboard', result)
  return result
}
