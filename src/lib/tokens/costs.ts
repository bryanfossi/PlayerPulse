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
  /** Monthly allowance included with FuseID Pro subscription. */
  SUBSCRIPTION_MONTHLY_ALLOWANCE: 30,
  /** Tokens granted per token-pack purchase. */
  PACK_PURCHASE: 30,
} as const

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
