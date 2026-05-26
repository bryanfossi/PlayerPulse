/**
 * Player lookup helpers.
 *
 * Since migration 020, a player record may be owned by one OR TWO auth
 * users (the primary user_id and an optional co_owner_user_id). Routes
 * that previously did `.eq('user_id', userId)` MUST now check both
 * columns or they break for the co-owner.
 *
 * `getPlayerForUser` is the canonical replacement for that pattern.
 * It returns the player record where either column matches the given
 * auth user id.
 *
 * Both columns are indexed (players_user_id_unique + co_owner index)
 * so the OR query is a cheap index union, not a scan.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type AnyClient = SupabaseClient<Database>

/**
 * Returns the player row where `user_id = userId` OR `co_owner_user_id = userId`.
 * Pass a comma-separated column list (default '*'). Returns null on missing
 * row or error (errors are logged).
 */
export async function getPlayerForUser<T = Record<string, unknown>>(
  service: AnyClient,
  userId: string,
  select: string = '*',
): Promise<T | null> {
  // Untyped facade — co_owner_user_id is a migration-020 column not yet
  // in the generated database.ts. Per the project rule we don't regen
  // types, we tunnel around them at the call site.
  const untyped = service as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        or: (filter: string) => {
          maybeSingle: () => Promise<{ data: T | null; error: unknown }>
        }
      }
    }
  }

  const { data, error } = await untyped
    .from('players')
    .select(select)
    .or(`user_id.eq.${userId},co_owner_user_id.eq.${userId}`)
    .maybeSingle()

  if (error) {
    console.error('[player/lookup] getPlayerForUser failed:', error)
    return null
  }
  return data
}

/**
 * Strict variant: throws if no player is found. Use when the route
 * has already gated on the user being onboarded.
 */
export async function requirePlayerForUser<T = Record<string, unknown>>(
  service: AnyClient,
  userId: string,
  select: string = '*',
): Promise<T> {
  const player = await getPlayerForUser<T>(service, userId, select)
  if (!player) throw new Error(`No player record found for user ${userId}`)
  return player
}

/**
 * Both auth-user ids on the player record. Useful for fanout updates
 * (e.g., mirroring subscription state to the co-owner's profile).
 */
export async function getPlayerOwnerIds(
  service: AnyClient,
  userId: string,
): Promise<{ primary: string; coOwner: string | null } | null> {
  type Row = { user_id: string; co_owner_user_id: string | null }
  const row = await getPlayerForUser<Row>(service, userId, 'user_id, co_owner_user_id')
  if (!row) return null
  return { primary: row.user_id, coOwner: row.co_owner_user_id }
}
