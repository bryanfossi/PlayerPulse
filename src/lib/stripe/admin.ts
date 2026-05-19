/**
 * Admin-dashboard Stripe helpers. Cached in-memory per Vercel instance
 * with a 10-minute TTL so the dashboard doesn't hit Stripe on every load.
 *
 * Cold-start: first request after a deploy / cold instance pays the
 * Stripe API latency (~1-2s). Subsequent requests within the TTL window
 * read from memory.
 */

import { stripe } from '@/lib/stripe'

type CacheEntry<T> = { value: T; expiresAt: number }
const cache = new Map<string, CacheEntry<unknown>>()
const TTL_MS = 10 * 60 * 1000

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.value as T
}

function setCached<T>(key: string, value: T): void {
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS })
}

export interface MRRSummary {
  mrrCents: number
  activeSubscriptionCount: number
  /** Counts by raw Stripe interval (month/year/week/day). */
  byInterval: Record<string, number>
}

export async function getMRRSummary(): Promise<MRRSummary> {
  const cached = getCached<MRRSummary>('mrr-summary')
  if (cached) return cached

  let mrrCents = 0
  let count = 0
  const byInterval: Record<string, number> = {}

  // Paginate through active subscriptions (rare to exceed 100, but be safe).
  for await (const sub of stripe.subscriptions.list({ status: 'active', limit: 100 })) {
    count += 1
    for (const item of sub.items.data) {
      const price = item.price
      const unit = price.unit_amount ?? 0
      const qty = item.quantity ?? 1
      const interval = price.recurring?.interval ?? 'month'
      byInterval[interval] = (byInterval[interval] ?? 0) + 1
      // Normalize to monthly
      switch (interval) {
        case 'year':
          mrrCents += Math.round((unit * qty) / 12)
          break
        case 'week':
          mrrCents += Math.round((unit * qty * 52) / 12)
          break
        case 'day':
          mrrCents += Math.round((unit * qty * 365) / 12)
          break
        case 'month':
        default:
          mrrCents += unit * qty
          break
      }
    }
  }

  // Add trialing subs separately so the "subscription_status" filter still works,
  // but they don't contribute to MRR until they convert.

  const summary: MRRSummary = { mrrCents, activeSubscriptionCount: count, byInterval }
  setCached('mrr-summary', summary)
  return summary
}

export interface MRRMonthPoint {
  /** YYYY-MM */
  month: string
  /** Total $ paid in that month, in cents. */
  amountCents: number
}

/**
 * Last N months of paid invoice totals from Stripe.
 */
export async function getRevenueTrend(monthCount = 6): Promise<MRRMonthPoint[]> {
  const cacheKey = `revenue-trend-${monthCount}`
  const cached = getCached<MRRMonthPoint[]>(cacheKey)
  if (cached) return cached

  const cutoff = new Date()
  cutoff.setUTCMonth(cutoff.getUTCMonth() - monthCount)
  cutoff.setUTCDate(1)
  cutoff.setUTCHours(0, 0, 0, 0)

  const buckets = new Map<string, number>()
  for (let i = 0; i < monthCount; i++) {
    const d = new Date()
    d.setUTCMonth(d.getUTCMonth() - i)
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    buckets.set(key, 0)
  }

  for await (const invoice of stripe.invoices.list({
    status: 'paid',
    created: { gte: Math.floor(cutoff.getTime() / 1000) },
    limit: 100,
  })) {
    const ts = invoice.status_transitions?.paid_at ?? invoice.created
    if (!ts) continue
    const d = new Date(ts * 1000)
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    if (!buckets.has(key)) continue
    buckets.set(key, (buckets.get(key) ?? 0) + (invoice.amount_paid ?? 0))
  }

  const points = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amountCents]) => ({ month, amountCents }))

  setCached(cacheKey, points)
  return points
}

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

export function stripeLiveMode(): boolean {
  return process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ?? false
}
