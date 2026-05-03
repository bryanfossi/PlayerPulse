-- ============================================================
-- PlayerPulse — Multi-Sport Foundation
-- ------------------------------------------------------------
-- Adds a sport_id column to sport-scoped tables so that the
-- platform can support multiple sports (soccer, basketball,
-- lacrosse, baseball, etc.) from a single schema.
--
-- All existing rows are backfilled with 'soccer' so that current
-- soccer-only functionality is preserved exactly as-is.
--
-- The canonical list of valid sport ids lives in
--   src/lib/sports/index.ts
-- We intentionally do NOT create a sports lookup table or a
-- foreign key here — sports are config-driven in code so adding
-- a new sport never requires a new migration.
--
-- NOTE: original spec called for filename `004_multi_sport.sql`,
-- but `004_stripe_billing.sql` already exists in this repo.
-- This migration uses the next free number (007) to preserve
-- existing migration history.
-- ============================================================

-- ------------------------------------------------------------
-- players: add sport_id
-- ------------------------------------------------------------
alter table public.players
  add column if not exists sport_id text not null default 'soccer';

-- Backfill any historical rows (no-op when default applied above,
-- but explicit so re-runs against partially-migrated data are safe).
update public.players
  set sport_id = 'soccer'
  where sport_id is null;

-- Index for fast per-sport queries (dashboards, match engine).
create index if not exists players_sport_id_idx
  on public.players (sport_id);

-- Optional comment for schema introspection / future devs.
comment on column public.players.sport_id is
  'Slug of the sport this player belongs to. Source of truth: src/lib/sports/index.ts. Defaults to ''soccer'' for the launch sport.';
