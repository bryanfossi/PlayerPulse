/**
 * Token audit log helper.
 *
 * Writes an append-only row to public.token_transactions for every credit
 * or debit. The current balance is still authoritative on
 * players.allowance_tokens + players.pack_tokens — this table is purely an
 * auditable history. Failures here are LOGGED but NEVER FATAL: the
 * underlying balance change has already happened by the time we get here,
 * and we don't want a missing audit row to break the user flow.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type TokenTransactionType =
  | 'signup_grant'
  | 'subscription_refresh'
  | 'pack_purchase'
  | 'match_engine_run'
  | 'email_draft'
  | 'fit_assessment'
  | 'ai_query'
  | 'refund'
  | 'admin_adjustment'

type AdminClient = SupabaseClient<Database>

interface AuditArgs {
  service: AdminClient
  userId?: string                 // either userId or playerId is fine
  playerId?: string
  type: TokenTransactionType
  amount: number                  // positive = credit, negative = debit
  sourceRef?: string | null       // Stripe id, feature ref, etc
}

/**
 * Write one audit row. Looks up player_id + current balance via untyped
 * client calls because token_transactions / athlete_token_balance are
 * defined in migration 016 and not yet reflected in the generated types.
 */
export async function recordTokenTransaction({
  service,
  userId,
  playerId,
  type,
  amount,
  sourceRef,
}: AuditArgs): Promise<void> {
  try {
    let resolvedPlayerId = playerId

    if (!resolvedPlayerId) {
      if (!userId) {
        console.warn('[audit] recordTokenTransaction: neither playerId nor userId provided')
        return
      }
      const { data: row } = await service
        .from('players')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
      const pid = (row as { id?: string } | null)?.id
      if (!pid) {
        // Player record doesn't exist yet — common for grants fired from
        // the Stripe webhook before the user finishes onboarding. We skip
        // the audit row silently; the actual balance update is gated on
        // the player existing anyway.
        return
      }
      resolvedPlayerId = pid
    }

    // Snapshot the post-change balance so the audit row is self-contained.
    const { data: balRow } = await service
      .from('players')
      .select('allowance_tokens, pack_tokens')
      .eq('id', resolvedPlayerId)
      .maybeSingle()
    const allowance = (balRow as { allowance_tokens?: number } | null)?.allowance_tokens ?? 0
    const pack = (balRow as { pack_tokens?: number } | null)?.pack_tokens ?? 0
    const balanceAfter = allowance + pack

    // Untyped insert — token_transactions is in migration 016 and types
    // haven't been regenerated yet. The shape is enforced by Postgres.
    const { error } = await (service as unknown as {
      from: (t: string) => {
        insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>
      }
    })
      .from('token_transactions')
      .insert({
        player_id: resolvedPlayerId,
        transaction_type: type,
        amount,
        balance_after: balanceAfter,
        source_ref: sourceRef ?? null,
      })

    if (error) {
      console.error('[audit] token_transactions insert failed:', error)
    }
  } catch (err) {
    console.error('[audit] recordTokenTransaction threw:', err)
  }
}
