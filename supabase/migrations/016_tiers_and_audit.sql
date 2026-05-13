-- ============================================================
-- FuseID — Tiers (Free / Starter / Pro / Legacy) + Token Audit Log
-- ------------------------------------------------------------
-- Adds a tier enum so we can support a free tier alongside paid
-- subscriptions, plus a date-of-birth field for COPPA compliance,
-- plus an append-only token_transactions audit log.
--
-- This migration is non-breaking — existing balance columns
-- (allowance_tokens, pack_tokens) and existing RPCs continue to
-- work. The audit log is written by API routes from this point
-- forward; backfilling history isn't possible and isn't required.
-- ============================================================

-- ── Profiles: tier + DOB ────────────────────────────────────
alter table public.profiles
  add column if not exists tier text not null default 'free'
    check (tier in ('free', 'starter', 'pro', 'legacy')),
  add column if not exists date_of_birth date;

create index if not exists profiles_tier_idx on public.profiles (tier);

-- Backfill: anyone currently subscription_active = true keeps their
-- access by being marked 'legacy' (treated as Pro for token purposes
-- but on the grandfathered $14.99/mo plan).
update public.profiles
set tier = 'legacy'
where subscription_active = true
  and tier = 'free';

-- ── Players: mirror tier so server-side checks are one-query ──
alter table public.players
  add column if not exists tier text not null default 'free'
    check (tier in ('free', 'starter', 'pro', 'legacy'));

create index if not exists players_tier_idx on public.players (tier);

-- Mirror the backfill
update public.players p
set tier = pr.tier
from public.profiles pr
where pr.id = p.user_id
  and pr.tier <> 'free';

-- ── Token transactions audit log ────────────────────────────
-- Append-only. Every credit or debit writes a row.
-- balance_after is a snapshot at the time of the transaction
-- (sum of allowance_tokens + pack_tokens after the change).
create table if not exists public.token_transactions (
  id              uuid primary key default gen_random_uuid(),
  player_id       uuid not null references public.players(id) on delete cascade,
  transaction_type text not null
    check (transaction_type in (
      'signup_grant',
      'subscription_refresh',
      'pack_purchase',
      'match_engine_run',
      'email_draft',
      'fit_assessment',
      'ai_query',
      'refund',
      'admin_adjustment'
    )),
  amount          integer not null,                 -- positive = credit, negative = debit
  balance_after   integer not null,
  source_ref      text,                              -- Stripe payment_intent / subscription / feature ref
  created_at      timestamptz default now()
);

create index if not exists token_transactions_player_idx
  on public.token_transactions (player_id, created_at desc);

create index if not exists token_transactions_type_idx
  on public.token_transactions (transaction_type, created_at desc);

comment on table public.token_transactions is
  'Append-only audit log for every token credit/debit. The current balance is still read from players.allowance_tokens + players.pack_tokens; this table provides the auditable history.';

-- ── View: current balance per player ──────────────────────────
create or replace view public.athlete_token_balance as
select
  p.id as player_id,
  p.user_id,
  p.tier,
  p.allowance_tokens,
  p.pack_tokens,
  (p.allowance_tokens + p.pack_tokens) as total_balance
from public.players p;

comment on view public.athlete_token_balance is
  'Convenience view exposing current token balance per player. Total = allowance + pack.';
