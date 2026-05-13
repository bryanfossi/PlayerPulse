/**
 * Token economy constants — single source of truth.
 *
 * All API routes, UI components, and tests must import token costs and
 * grants from this file. Hardcoding numeric token values anywhere else
 * is a bug.
 *
 * Schema:
 *   - allowance_tokens: monthly subscription allowance (replaced each
 *     billing cycle, zeroed on cancellation)
 *   - pack_tokens:      purchased via packs, roll over forever
 *
 * Consumption priority: allowance_tokens consumed BEFORE pack_tokens
 * (handled atomically by the consume_tokens Postgres RPC).
 */

export const TOKEN_COSTS = {
  /** Regenerating an AI-drafted coach outreach email. */
  EMAIL_DRAFT: 1,
  /**
   * Generic short AI query — coach email analysis, AI action generator
   * (profile tips), offer comparison, recruiting timeline, etc.
   * Anything where Claude returns a small structured response.
   */
  AI_QUERY: 1,
  /** Generating an AI fit assessment for a single school (rescore). */
  SCHOOL_FIT_ASSESSMENT: 3,
  /** Regenerating the entire ranked match list (Top 40). */
  FULL_MATCH_RERUN: 10,
} as const

export const TOKEN_GRANTS = {
  /**
   * Default monthly allowance — used for back-compat and as the Pro/legacy
   * tier value. New code that needs a per-tier amount should look up via
   * SUBSCRIPTION_TIERS instead.
   */
  SUBSCRIPTION_MONTHLY_ALLOWANCE: 30,
  /** Legacy single-pack constant — kept for back-compat. New code uses TOKEN_PACKS. */
  PACK_PURCHASE: 30,
} as const

/**
 * Token packs offered via Stripe Checkout (one-time payment).
 * Renamed 'starter' → 'mini' so the name 'Starter' is free for the
 * subscription tier.
 */
export const TOKEN_PACKS = {
  mini:     { id: 'mini',     amount: 5,  priceCents: 299,  label: 'Mini' },
  standard: { id: 'standard', amount: 15, priceCents: 799,  label: 'Standard' },
  max:      { id: 'max',      amount: 30, priceCents: 1499, label: 'Max' },
} as const

export type TokenPackId = keyof typeof TOKEN_PACKS

/**
 * Subscription tiers offered via recurring Stripe checkout. The `id` matches
 * the `tier` enum value in the database (profiles.tier / players.tier).
 *
 * 'free' and 'legacy' aren't checkoutable — free is the default state,
 * legacy is the grandfathered $14.99 plan from before the tiering existed
 * (treated as Pro for token purposes).
 */
export const SUBSCRIPTION_TIERS = {
  starter: { id: 'starter', priceCents: 999,  monthlyTokens: 20, label: 'Starter' },
  pro:     { id: 'pro',     priceCents: 1499, monthlyTokens: 30, label: 'Pro' },
} as const

export type SubscriptionTierId = keyof typeof SUBSCRIPTION_TIERS

/**
 * Resolve the monthly token allowance for any DB tier value. Legacy users
 * (grandfathered $14.99 from before the tiering) get the Pro amount.
 * Free users get nothing — they have to buy packs or upgrade.
 */
export function monthlyAllowanceForTier(
  tier: 'free' | 'starter' | 'pro' | 'legacy',
): number {
  switch (tier) {
    case 'starter': return SUBSCRIPTION_TIERS.starter.monthlyTokens
    case 'pro':     return SUBSCRIPTION_TIERS.pro.monthlyTokens
    case 'legacy':  return SUBSCRIPTION_TIERS.pro.monthlyTokens
    case 'free':    return 0
  }
}

export type TokenAction = keyof typeof TOKEN_COSTS

/**
 * Human-friendly cost summary for UI tooltips and copy.
 */
export const TOKEN_COST_LABEL: Record<TokenAction, string> = {
  EMAIL_DRAFT: '1 token',
  AI_QUERY: '1 token',
  SCHOOL_FIT_ASSESSMENT: '3 tokens',
  FULL_MATCH_RERUN: '10 tokens',
}
