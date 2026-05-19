/**
 * Aggregates every section the admin dashboard needs into a single
 * structured payload. Designed to run in one server-side pass so the
 * page can render from one fetch.
 *
 * All Supabase queries use the service-role client. Stripe data is
 * cached 10 minutes by the helper.
 */

import { createServiceClient } from '@/lib/supabase/server'
import { getMRRSummary, getRevenueTrend, stripeConfigured, stripeLiveMode } from '@/lib/stripe/admin'
import { getActivePlayerIds, isoNDaysAgo } from '@/lib/admin/activity'
import { getSentryDashboardData, sentryApiConfigured, type SentryDashboardData } from '@/lib/sentry/api'

export type DashboardStats = Awaited<ReturnType<typeof loadDashboardStats>>

type AnyRow = Record<string, unknown>

async function countAll(table: string, opts?: { filterEq?: [string, string]; filterGte?: [string, string] }): Promise<number> {
  const service = createServiceClient()
  const untyped = service as unknown as {
    from: (t: string) => {
      select: (c: string, o: { count: 'exact'; head: true }) => {
        eq: (col: string, val: string) => Promise<{ count: number | null; error: unknown }>
        gte: (col: string, val: string) => Promise<{ count: number | null; error: unknown }>
        is: (col: string, val: null) => Promise<{ count: number | null; error: unknown }>
        limit: (n: number) => Promise<{ count: number | null; error: unknown }>
      }
    }
  }
  let q = untyped.from(table).select('id', { count: 'exact', head: true }) as unknown as {
    eq: (col: string, val: string) => Promise<{ count: number | null; error: unknown }>
    gte: (col: string, val: string) => Promise<{ count: number | null; error: unknown }>
    limit: (n: number) => Promise<{ count: number | null; error: unknown }>
  }
  if (opts?.filterEq) {
    q = q.eq(opts.filterEq[0], opts.filterEq[1]) as unknown as typeof q
  }
  if (opts?.filterGte) {
    q = q.gte(opts.filterGte[0], opts.filterGte[1]) as unknown as typeof q
  }
  const { count, error } = await q.limit(1)
  if (error) {
    console.error(`[dashboard-stats] countAll(${table}) failed:`, error)
    return 0
  }
  return count ?? 0
}

export async function loadDashboardStats() {
  const service = createServiceClient()
  const untyped = service as unknown as {
    from: (t: string) => {
      select: (c: string, o?: { count?: 'exact'; head?: boolean }) => AnyChain
    }
  }
  type AnyChain = {
    eq: (col: string, val: string) => AnyChain
    in: (col: string, vals: string[]) => AnyChain
    gte: (col: string, val: string) => AnyChain
    lt: (col: string, val: string) => AnyChain
    order: (col: string, opts: { ascending: boolean }) => AnyChain
    limit: (n: number) => Promise<{ data: AnyRow[] | null; count: number | null; error: unknown }>
    is: (col: string, val: null) => AnyChain
    not: (col: string, op: string, val: unknown) => AnyChain
  }

  const now = new Date().toISOString()
  const since7 = isoNDaysAgo(7)
  const since30 = isoNDaysAgo(30)
  const since60 = isoNDaysAgo(60)

  // Run independent queries in parallel
  const [
    totalPlayers,
    onboardingCompleteCount,
    activePlayers7d,
    activePlayers30d,
    cohort30to60,
    cohort30to60Active30,
    plansBreakdownRows,
    matchRunsCount30,
    aiDraftsCount30,
    offersCount30,
    onboardingCompleted30Count,
    tokenRevenue30Rows,
    tokenPackSales30Rows,
    pipelineStageRows,
    sportRows,
    divisionRows,
    offersAllCount,
    commitmentsCount,
    avgOfferNetCostRow,
    profilesPastDueRows,
    stuckOnboardingRows,
    zeroTokenSubscribersRows,
    parentInvitesExpiring,
    recentSignupsRows,
    subscriptionsTableRows,
    matchEngineDailyRows,
    emailDraftTypeRows,
    tokenBalanceBucketsRows,
    mrrSummary,
    revenueTrend,
    inactiveAthletesRows,
    topEngagedRows,
    sentryData,
  ] = await Promise.all([
    countAll('players'),
    countAll('players', { filterEq: ['onboarding_complete', 'true'] }),
    getActivePlayerIds(service, since7).then((s) => s.size),
    getActivePlayerIds(service, since30),
    countAll('players', { filterGte: ['created_at', since60] }).then(async () => {
      const { data } = await untyped
        .from('players')
        .select('id, created_at')
        .gte('created_at', since60)
        .lt('created_at', since30)
        .limit(2000) as { data: AnyRow[] | null; error: unknown; count: number | null }
      return data ?? []
    }),
    Promise.resolve(null), // placeholder, computed after cohort
    untyped
      .from('profiles')
      .select('tier')
      .limit(10000),
    countAll('match_engine_runs', { filterGte: ['run_at', since30] }),
    countAll('ai_drafts', { filterGte: ['created_at', since30] }),
    countAll('offers', { filterGte: ['created_at', since30] }),
    untyped
      .from('players')
      .select('id, updated_at, onboarding_complete')
      .eq('onboarding_complete', 'true')
      .gte('updated_at', since30)
      .limit(2000),
    untyped
      .from('token_transactions')
      .select('id, amount, transaction_type, created_at, source_ref')
      .eq('transaction_type', 'pack_purchase')
      .gte('created_at', since30)
      .limit(5000),
    untyped
      .from('token_transactions')
      .select('id, amount, transaction_type, created_at, source_ref')
      .eq('transaction_type', 'pack_purchase')
      .gte('created_at', since30)
      .limit(5000),
    untyped
      .from('player_schools')
      .select('status')
      .limit(20000),
    untyped
      .from('players')
      .select('sport_id')
      .limit(10000),
    untyped
      .from('player_schools')
      .select('school_id, schools(verified_division)')
      .limit(20000),
    countAll('offers'),
    untyped
      .from('player_schools')
      .select('id')
      .eq('status', 'committed')
      .limit(1000),
    untyped
      .from('offers')
      .select('athletic_scholarship, merit_aid, need_based_aid, other_aid, tuition_per_year, status')
      .limit(5000),
    untyped
      .from('profiles')
      .select('id, email, tier, subscription_status, subscription_id')
      .eq('subscription_status', 'past_due')
      .limit(500),
    untyped
      .from('players')
      .select('id, user_id, first_name, last_name, created_at, onboarding_complete')
      .eq('onboarding_complete', 'false')
      .lt('created_at', isoNDaysAgo(7))
      .order('created_at', { ascending: false })
      .limit(500),
    untyped
      .from('players')
      .select('id, first_name, last_name, allowance_tokens, pack_tokens, tier, subscription_active')
      .in('tier', ['starter', 'pro', 'legacy'])
      .limit(5000),
    untyped
      .from('parent_invites')
      .select('id, player_id, email, expires_at, accepted')
      .eq('accepted', 'false')
      .gte('expires_at', now)
      .lt('expires_at', new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString())
      .limit(500),
    untyped
      .from('players')
      .select('id, user_id, first_name, last_name, sport_id, grad_year, club_team, tier, subscription_active, onboarding_complete, created_at')
      .order('created_at', { ascending: false })
      .limit(25),
    untyped
      .from('profiles')
      .select('id, email, tier, subscription_status, subscription_id, created_at')
      .in('tier', ['starter', 'pro', 'legacy'])
      .order('created_at', { ascending: false })
      .limit(200),
    untyped
      .from('match_engine_runs')
      .select('run_at')
      .gte('run_at', since30)
      .limit(5000),
    untyped
      .from('ai_drafts')
      .select('draft_type')
      .gte('created_at', since30)
      .limit(5000),
    untyped
      .from('players')
      .select('id, allowance_tokens, pack_tokens')
      .limit(10000),
    stripeConfigured() ? getMRRSummary().catch((e) => {
      console.error('[dashboard-stats] MRR fetch failed:', e)
      return { mrrCents: 0, activeSubscriptionCount: 0, byInterval: {} }
    }) : Promise.resolve({ mrrCents: 0, activeSubscriptionCount: 0, byInterval: {} }),
    stripeConfigured() ? getRevenueTrend(6).catch((e) => {
      console.error('[dashboard-stats] revenue trend failed:', e)
      return []
    }) : Promise.resolve([]),
    // Inactive athletes — active subs that haven't shown activity in 30+ days
    untyped
      .from('players')
      .select('id, user_id, first_name, last_name, tier, subscription_active, created_at, match_engine_run_at')
      .eq('subscription_active', 'true')
      .eq('onboarding_complete', 'true')
      .limit(2000),
    // Top engaged — pull recent activity rows and score in JS
    Promise.all([
      untyped.from('match_engine_runs').select('player_id').gte('run_at', since30).limit(5000),
      untyped.from('ai_drafts').select('player_id').gte('created_at', since30).limit(5000),
      untyped.from('player_schools').select('player_id').gte('updated_at', since30).limit(20000),
      untyped.from('contacts').select('player_id').gte('created_at', since30).limit(10000),
    ]),
    // Sentry — last in the array so the destructure ordering stays simple.
    sentryApiConfigured() ? getSentryDashboardData().catch((e) => {
      console.error('[dashboard-stats] sentry fetch failed:', e)
      return null as SentryDashboardData | null
    }) : Promise.resolve(null as SentryDashboardData | null),
  ])

  // ── KPI bar ──
  const onboardingRatePct = totalPlayers > 0 ? (onboardingCompleteCount / totalPlayers) * 100 : 0

  // D30 retention: cohort = registered 30-60d ago; numerator = cohort intersect active30
  type CohortRow = { id: string }
  const cohortRows = (cohort30to60 ?? []) as unknown as CohortRow[]
  const cohortIds = new Set(cohortRows.map((r) => r.id))
  let retained = 0
  for (const id of activePlayers30d) if (cohortIds.has(id)) retained += 1
  const d30RetentionPct = cohortIds.size > 0 ? (retained / cohortIds.size) * 100 : 0

  // Token revenue (30d) from token_transactions.source_ref — we don't store
  // dollar amount per transaction, just token count. Map back via TOKEN_PACKS:
  // amount=5 → $2.99, 15 → $7.99, 30 → $14.99.
  const PACK_CENTS_BY_AMOUNT: Record<number, number> = { 5: 299, 15: 799, 30: 1499 }
  const packRows = (tokenRevenue30Rows.data ?? []) as { amount: number }[]
  const tokenRevenue30Cents = packRows.reduce((sum, r) => sum + (PACK_CENTS_BY_AMOUNT[r.amount] ?? 0), 0)

  // ── Revenue ──
  type ProfileTier = { tier: string }
  const tierBreakdownRows = (plansBreakdownRows.data ?? []) as ProfileTier[]
  const planCounts: Record<string, number> = { free: 0, starter: 0, pro: 0, legacy: 0 }
  for (const row of tierBreakdownRows) {
    if (row.tier in planCounts) planCounts[row.tier] += 1
  }

  // Token pack sales by pack name (last 30d)
  const packSalesRows = (tokenPackSales30Rows.data ?? []) as { amount: number }[]
  const packSales: Record<string, { purchases: number; revenueCents: number }> = {
    Mini:     { purchases: 0, revenueCents: 0 },
    Standard: { purchases: 0, revenueCents: 0 },
    Max:      { purchases: 0, revenueCents: 0 },
  }
  for (const r of packSalesRows) {
    const label = r.amount === 5 ? 'Mini' : r.amount === 15 ? 'Standard' : r.amount === 30 ? 'Max' : null
    if (!label) continue
    packSales[label].purchases += 1
    packSales[label].revenueCents += PACK_CENTS_BY_AMOUNT[r.amount] ?? 0
  }

  // Subscription table rows (profile-level)
  type SubRow = {
    id: string
    email: string
    tier: string
    subscription_status: string | null
    subscription_id: string | null
    created_at: string
  }
  const subsForTable = (subscriptionsTableRows.data ?? []) as SubRow[]

  // ── Engagement ──
  const onboardingCompleted30 = (onboardingCompleted30Count.data ?? []).length

  // Funnel
  // (1) Registered → Onboarding complete
  const funnelOnboardPct = totalPlayers > 0 ? (onboardingCompleteCount / totalPlayers) * 100 : 0
  // (2) Onboarding complete → Match Engine run (count distinct players with match_engine_run_at)
  const { data: playersWithMatchRunRaw } = await untyped
    .from('players')
    .select('id, match_engine_run_at, onboarding_complete')
    .eq('onboarding_complete', 'true')
    .not('match_engine_run_at', 'is', null)
    .limit(10000)
  const playersWithMatchRun = (playersWithMatchRunRaw ?? []).length
  const funnelMatchPct = onboardingCompleteCount > 0
    ? (playersWithMatchRun / onboardingCompleteCount) * 100
    : 0
  // (3) Match engine run → First email drafted within 7 days of run — approximation:
  // count distinct players with both a match run AND at least one ai_draft
  const { data: playersWithDraftRaw } = await untyped
    .from('ai_drafts')
    .select('player_id')
    .limit(20000)
  const playersWithDraftSet = new Set(((playersWithDraftRaw ?? []) as { player_id: string }[]).map((r) => r.player_id))
  const funnelEmailPct = playersWithMatchRun > 0
    ? (playersWithDraftSet.size / playersWithMatchRun) * 100
    : 0
  // (4) Of players with offers, % who logged one
  const { data: playersWithOfferRaw } = await untyped
    .from('offers')
    .select('player_id')
    .limit(10000)
  const playersWithOfferSet = new Set(((playersWithOfferRaw ?? []) as { player_id: string }[]).map((r) => r.player_id))
  const funnelOfferPct = totalPlayers > 0 ? (playersWithOfferSet.size / totalPlayers) * 100 : 0
  // (5) Parent invites sent / total players
  const parentInvitesCount = await countAll('parent_invites')
  const funnelParentInvitePct = totalPlayers > 0 ? (parentInvitesCount / totalPlayers) * 100 : 0

  // Top engaged (score = match*4 + draft*3 + school_update*2 + contact*1)
  const [matchRunPlayerData, draftPlayerData, schoolUpdatePlayerData, contactPlayerData] = topEngagedRows
  const scoreMap = new Map<string, { match: number; draft: number; school: number; contact: number }>()
  function bump(id: string, key: 'match' | 'draft' | 'school' | 'contact') {
    if (!scoreMap.has(id)) scoreMap.set(id, { match: 0, draft: 0, school: 0, contact: 0 })
    scoreMap.get(id)![key] += 1
  }
  for (const r of ((matchRunPlayerData.data ?? []) as { player_id: string }[])) bump(r.player_id, 'match')
  for (const r of ((draftPlayerData.data ?? []) as { player_id: string }[])) bump(r.player_id, 'draft')
  for (const r of ((schoolUpdatePlayerData.data ?? []) as { player_id: string }[])) bump(r.player_id, 'school')
  for (const r of ((contactPlayerData.data ?? []) as { player_id: string }[])) bump(r.player_id, 'contact')

  const scoredPlayerIds = Array.from(scoreMap.entries()).map(([id, c]) => ({
    id,
    match: c.match, draft: c.draft, school: c.school, contact: c.contact,
    score: c.match * 4 + c.draft * 3 + c.school * 2 + c.contact * 1,
  })).sort((a, b) => b.score - a.score).slice(0, 10)

  // Look up player names for the top 10
  const topPlayerIds = scoredPlayerIds.map((s) => s.id)
  let topEngagedPlayers: Array<{
    id: string; first_name: string; last_name: string; sport_id: string | null;
    grad_year: number; tier: string;
    match: number; draft: number; school: number; contact: number; score: number;
  }> = []
  if (topPlayerIds.length > 0) {
    const { data: topPlayersData } = await untyped
      .from('players')
      .select('id, first_name, last_name, sport_id, grad_year, tier')
      .in('id', topPlayerIds)
      .limit(50)
    const topPlayersById = new Map<string, AnyRow>()
    for (const p of (topPlayersData ?? []) as AnyRow[]) {
      topPlayersById.set(p.id as string, p)
    }
    topEngagedPlayers = scoredPlayerIds.map((s) => {
      const p = topPlayersById.get(s.id)
      return {
        id: s.id,
        first_name: (p?.first_name as string) ?? '',
        last_name: (p?.last_name as string) ?? '',
        sport_id: (p?.sport_id as string | null) ?? null,
        grad_year: (p?.grad_year as number) ?? 0,
        tier: (p?.tier as string) ?? 'free',
        match: s.match, draft: s.draft, school: s.school, contact: s.contact,
        score: s.score,
      }
    })
  }

  // Inactive athletes
  type PlayerActive = {
    id: string; user_id: string; first_name: string; last_name: string;
    tier: string; subscription_active: boolean; created_at: string; match_engine_run_at: string | null
  }
  const activeSubPlayers = (inactiveAthletesRows.data ?? []) as PlayerActive[]
  const inactiveAthletes: PlayerActive[] = activeSubPlayers.filter((p) => {
    // Active in last 30d?
    return !activePlayers30d.has(p.id)
  })

  // ── AI ──
  // Match engine daily series
  const matchEngineDaily = (matchEngineDailyRows.data ?? []) as { run_at: string }[]
  const matchEngineByDay = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    matchEngineByDay.set(d.toISOString().slice(0, 10), 0)
  }
  for (const r of matchEngineDaily) {
    const day = r.run_at.slice(0, 10)
    if (matchEngineByDay.has(day)) {
      matchEngineByDay.set(day, (matchEngineByDay.get(day) ?? 0) + 1)
    }
  }

  // Email type donut
  const emailRows = (emailDraftTypeRows.data ?? []) as { draft_type: string }[]
  const emailTypeCounts: Record<string, number> = {}
  for (const r of emailRows) {
    emailTypeCounts[r.draft_type] = (emailTypeCounts[r.draft_type] ?? 0) + 1
  }

  // Token balance distribution
  const balanceRows = (tokenBalanceBucketsRows.data ?? []) as { allowance_tokens: number; pack_tokens: number }[]
  const balanceBuckets: Record<string, number> = {
    '0': 0, '1–5': 0, '6–15': 0, '16–30': 0, '30+': 0,
  }
  for (const r of balanceRows) {
    const total = (r.allowance_tokens ?? 0) + (r.pack_tokens ?? 0)
    if (total === 0) balanceBuckets['0'] += 1
    else if (total <= 5) balanceBuckets['1–5'] += 1
    else if (total <= 15) balanceBuckets['6–15'] += 1
    else if (total <= 30) balanceBuckets['16–30'] += 1
    else balanceBuckets['30+'] += 1
  }

  // AI feature usage 7d/30d counts
  const matchRunsCount7 = await countAll('match_engine_runs', { filterGte: ['run_at', since7] })
  const aiDraftsCount7 = await countAll('ai_drafts', { filterGte: ['created_at', since7] })

  // Unique players w/ match runs 30d
  const matchRunPlayers30 = await selectDistinctPlayerIds(service, 'match_engine_runs', 'run_at', since30)
  const draftPlayers30 = await selectDistinctPlayerIds(service, 'ai_drafts', 'created_at', since30)

  // ── Pipeline ──
  const pipelineRows = (pipelineStageRows.data ?? []) as { status: string }[]
  const pipelineCounts: Record<string, number> = {}
  for (const r of pipelineRows) {
    pipelineCounts[r.status] = (pipelineCounts[r.status] ?? 0) + 1
  }

  const sportRowsData = (sportRows.data ?? []) as { sport_id: string | null }[]
  const sportCounts: Record<string, number> = {}
  for (const r of sportRowsData) {
    const s = r.sport_id ?? 'unknown'
    sportCounts[s] = (sportCounts[s] ?? 0) + 1
  }

  type DivRow = { school_id: string; schools: { verified_division: string | null } | null }
  const divRowsData = (divisionRows.data ?? []) as unknown as DivRow[]
  const divisionCounts: Record<string, number> = {}
  for (const r of divRowsData) {
    const d = r.schools?.verified_division ?? 'Unknown'
    divisionCounts[d] = (divisionCounts[d] ?? 0) + 1
  }

  // Offers / commitments
  const commitmentsCountValue = ((commitmentsCount.data ?? []) as AnyRow[]).length
  const offerNetCosts = ((avgOfferNetCostRow.data ?? []) as Array<{
    athletic_scholarship: number; merit_aid: number; need_based_aid: number;
    other_aid: number; tuition_per_year: number | null; status: string
  }>).filter((o) => o.status !== 'declined' && o.tuition_per_year != null)
  const avgNetCost = offerNetCosts.length > 0
    ? Math.round(offerNetCosts.reduce((s, o) => s + ((o.tuition_per_year ?? 0) - (o.athletic_scholarship + o.merit_aid + o.need_based_aid + o.other_aid)), 0) / offerNetCosts.length)
    : 0

  // ── Recent signups ──
  type RecentSignup = {
    id: string; user_id: string; first_name: string; last_name: string;
    sport_id: string | null; grad_year: number; club_team: string; tier: string;
    subscription_active: boolean; onboarding_complete: boolean; created_at: string
  }
  const recentSignups = (recentSignupsRows.data ?? []) as RecentSignup[]

  // ── Alerts ──
  const pastDueSubs = (profilesPastDueRows.data ?? []) as Array<{ id: string; email: string; tier: string; subscription_id: string | null }>
  const stuckOnboarding = (stuckOnboardingRows.data ?? []) as Array<{ id: string; user_id: string; first_name: string; last_name: string; created_at: string }>
  const zeroTokenSubs = ((zeroTokenSubscribersRows.data ?? []) as Array<{ id: string; first_name: string; last_name: string; allowance_tokens: number; pack_tokens: number; tier: string }>).filter((p) => (p.allowance_tokens ?? 0) + (p.pack_tokens ?? 0) === 0)
  const expiringInvites = (parentInvitesExpiring.data ?? []) as Array<{ id: string; player_id: string; email: string; expires_at: string }>

  // ── System status ──
  let supabaseOk = false
  try {
    const { error: pingErr } = await untyped.from('players').select('id').limit(1)
    supabaseOk = !pingErr
  } catch {
    supabaseOk = false
  }
  const stripeOk = stripeConfigured()
  const stripeLive = stripeLiveMode()
  const resendOk = !!process.env.RESEND_API_KEY
  // Sentry: the wizard hardcodes the DSN in sentry.server.config.ts (DSN is a
  // public identifier), so check for SENTRY_AUTH_TOKEN instead — that's the
  // one Vercel env var that has to be set for production source-map uploads
  // and is a good proxy for "Sentry is fully wired up".
  const sentryOk = !!process.env.SENTRY_AUTH_TOKEN || !!process.env.SENTRY_DSN

  // Avoid unused-variable warnings on cohort placeholder
  void onboardingRatePct
  void d30RetentionPct
  void cohort30to60Active30
  void offersCount30
  void matchRunsCount30
  void aiDraftsCount30
  void onboardingCompleted30
  void mrrSummary
  void revenueTrend

  return {
    generatedAt: now,
    kpis: {
      totalPlayers,
      mrrCents: mrrSummary.mrrCents,
      active7d: activePlayers7d,
      onboardingRatePct: round1(onboardingRatePct),
      d30RetentionPct: round1(d30RetentionPct),
      tokenRevenue30Cents,
    },
    revenue: {
      planCounts,
      mrrTrend: revenueTrend,
      packSales,
      subscriptions: subsForTable,
      stripeActiveSubCount: mrrSummary.activeSubscriptionCount,
    },
    engagement: {
      onboardingCompleted30,
      matchRuns30: matchRunsCount30,
      drafts30: aiDraftsCount30,
      offers30: offersCount30,
      funnel: [
        { label: 'Registered → Onboarding Complete', pct: round1(funnelOnboardPct), target: 75 },
        { label: 'Onboarding Complete → Match Engine Run', pct: round1(funnelMatchPct), target: 90 },
        { label: 'Match Engine Run → Email Drafted', pct: round1(funnelEmailPct), target: 60 },
        { label: 'Any Offer Logged', pct: round1(funnelOfferPct), target: 80 },
        { label: 'Parent Invite Sent', pct: round1(funnelParentInvitePct), target: 40 },
      ],
      topEngaged: topEngagedPlayers,
      inactive: inactiveAthletes.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        name: `${p.first_name} ${p.last_name}`.trim(),
        tier: p.tier,
        signed_up: p.created_at,
        last_match_run: p.match_engine_run_at,
      })),
    },
    ai: {
      matchEngineByDay: Array.from(matchEngineByDay.entries()).map(([day, runs]) => ({ day, runs })),
      emailTypeCounts,
      balanceBuckets,
      featureUsage: [
        { feature: 'Match Engine Runs', uses7d: matchRunsCount7, uses30d: matchRunsCount30, uniquePlayers30d: matchRunPlayers30.size },
        { feature: 'Email Drafts', uses7d: aiDraftsCount7, uses30d: aiDraftsCount30, uniquePlayers30d: draftPlayers30.size },
      ],
    },
    pipeline: {
      stages: pipelineCounts,
      divisions: divisionCounts,
      sports: sportCounts,
      offersAll: offersAllCount,
      offers30: offersCount30,
      commitments: commitmentsCountValue,
      avgNetCostUsd: avgNetCost,
    },
    recentSignups,
    alerts: {
      pastDue: pastDueSubs,
      stuckOnboarding,
      zeroTokenSubscribers: zeroTokenSubs,
      expiringInvites,
    },
    system: {
      supabase: supabaseOk,
      stripe: stripeOk,
      stripeLive,
      resend: resendOk,
      sentry: sentryOk,
    },
    sentry: sentryData,
  }
}

async function selectDistinctPlayerIds(
  service: ReturnType<typeof createServiceClient>,
  table: string,
  column: string,
  sinceIso: string,
): Promise<Set<string>> {
  const untyped = service as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        gte: (col: string, val: string) => {
          limit: (n: number) => Promise<{ data: { player_id: string }[] | null }>
        }
      }
    }
  }
  const { data } = await untyped.from(table).select('player_id').gte(column, sinceIso).limit(20000)
  return new Set((data ?? []).map((r) => r.player_id))
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

