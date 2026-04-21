// Simple in-memory rate limiter. Resets on cold start; fine for serverless
// where each AI call is expensive. For multi-instance prod, replace with Upstash.

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

interface RateLimitOptions {
  /** How many requests allowed in the window */
  limit: number
  /** Window size in seconds */
  windowSec: number
}

/**
 * Returns { allowed: true } or { allowed: false, retryAfter: number (seconds) }
 */
export function checkRateLimit(
  key: string,
  { limit, windowSec }: RateLimitOptions,
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  let entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowSec * 1000 }
  }

  entry.count += 1
  store.set(key, entry)

  if (entry.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }
  return { allowed: true }
}
