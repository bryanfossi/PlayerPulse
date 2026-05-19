/**
 * Activity helpers. The codebase doesn't have a dedicated events table, so
 * "active in last N days" is derived by unioning timestamps across the
 * tables that represent meaningful user actions:
 *
 *   - match_engine_runs.run_at      (ran the match engine)
 *   - ai_drafts.created_at          (drafted an email)
 *   - contacts.created_at           (logged a coach interaction)
 *   - player_schools.updated_at     (moved a school across the board)
 *   - actions.updated_at            (created or completed an action)
 *
 * Returns distinct player_ids active in the window.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

type AnyClient = SupabaseClient<Record<string, unknown>>

interface PlayerIdRow {
  player_id: string
}

async function selectPlayerIdsSince(
  service: AnyClient,
  table: string,
  column: string,
  sinceIso: string,
  limit = 2000,
): Promise<Set<string>> {
  const untyped = service as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        gte: (col: string, val: string) => {
          limit: (n: number) => Promise<{ data: PlayerIdRow[] | null; error: unknown }>
        }
      }
    }
  }
  const { data, error } = await untyped
    .from(table)
    .select('player_id')
    .gte(column, sinceIso)
    .limit(limit)
  if (error) {
    console.error(`[activity] ${table} query failed:`, error)
    return new Set()
  }
  const out = new Set<string>()
  for (const row of data ?? []) {
    if (row.player_id) out.add(row.player_id)
  }
  return out
}

/**
 * Distinct player_ids that did something in the window [sinceIso, now].
 */
export async function getActivePlayerIds(
  service: AnyClient,
  sinceIso: string,
): Promise<Set<string>> {
  const [matchRuns, drafts, contacts, schoolUpdates, actions] = await Promise.all([
    selectPlayerIdsSince(service, 'match_engine_runs', 'run_at', sinceIso),
    selectPlayerIdsSince(service, 'ai_drafts', 'created_at', sinceIso),
    selectPlayerIdsSince(service, 'contacts', 'created_at', sinceIso),
    selectPlayerIdsSince(service, 'player_schools', 'updated_at', sinceIso),
    selectPlayerIdsSince(service, 'actions', 'updated_at', sinceIso),
  ])
  const all = new Set<string>()
  for (const set of [matchRuns, drafts, contacts, schoolUpdates, actions]) {
    for (const id of set) all.add(id)
  }
  return all
}

export function isoNDaysAgo(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString()
}
