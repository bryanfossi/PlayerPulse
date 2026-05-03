-- ============================================================
-- PlayerPulse — Token Economy Refactor
-- ------------------------------------------------------------
-- Splits the single `rerun_tokens` column into two distinct buckets:
--   - allowance_tokens: monthly subscription allowance (replaced
--     each billing cycle, zeroed on cancellation)
--   - pack_tokens: tokens purchased via token pack (roll over
--     forever, never expire, kept on cancellation)
--
-- Token costs per action:
--   - AI-drafted email rerun:        1  token
--   - Single-school fit assessment:  3  tokens
--   - Full match list rerun:         10 tokens
--
-- Consumption priority: allowance_tokens consumed BEFORE pack_tokens.
--
-- Migration safety:
--   - Existing rerun_tokens balances are moved to pack_tokens
--     (most generous: existing users keep all tokens, never expire).
--   - The rerun_tokens column is kept (zeroed) for one release so
--     any straggler reads don't crash. It can be dropped in a
--     follow-up migration once all consumers use the new columns.
-- ============================================================

-- ── Schema ──────────────────────────────────────────────────
alter table public.players
  add column if not exists allowance_tokens int not null default 0,
  add column if not exists pack_tokens      int not null default 0;

-- ── Backfill ────────────────────────────────────────────────
-- Move existing rerun_tokens into pack_tokens (rollover-forever bucket).
update public.players
set
  pack_tokens   = pack_tokens + coalesce(rerun_tokens, 0),
  rerun_tokens  = 0,
  updated_at    = now()
where coalesce(rerun_tokens, 0) > 0;

-- ── RPC: atomic token consumption (allowance first, then pack) ──
-- Returns true on success, false if insufficient. Uses row-level lock
-- to prevent race conditions when concurrent requests deduct tokens.
create or replace function consume_tokens(p_user_id uuid, p_amount integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowance int;
  v_pack int;
  v_from_allowance int;
  v_from_pack int;
begin
  if p_amount <= 0 then
    return true;
  end if;

  -- Lock the row for the duration of the transaction
  select allowance_tokens, pack_tokens
    into v_allowance, v_pack
    from public.players
    where user_id = p_user_id
    for update;

  if not found then
    return false;
  end if;

  if (v_allowance + v_pack) < p_amount then
    return false;
  end if;

  v_from_allowance := least(v_allowance, p_amount);
  v_from_pack      := p_amount - v_from_allowance;

  update public.players
  set
    allowance_tokens = allowance_tokens - v_from_allowance,
    pack_tokens      = pack_tokens      - v_from_pack,
    updated_at       = now()
  where user_id = p_user_id;

  return true;
end;
$$;

-- ── RPC: refund tokens (used when an action fails post-deduction) ──
-- Refunds go to allowance first if there's room, then to pack.
-- For simplicity and to ensure the user is never worse off, always refund
-- to pack_tokens (no expiration, max user benefit).
create or replace function refund_tokens(p_user_id uuid, p_amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount <= 0 then
    return;
  end if;

  update public.players
  set
    pack_tokens = pack_tokens + p_amount,
    updated_at  = now()
  where user_id = p_user_id;
end;
$$;

-- ── RPC: grant_rerun_tokens — now grants to pack_tokens ──
-- Used by the Stripe webhook for token-pack purchases.
create or replace function grant_rerun_tokens(p_user_id uuid, p_amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.players
  set
    pack_tokens = pack_tokens + p_amount,
    updated_at  = now()
  where user_id = p_user_id;
end;
$$;

-- ── RPC: refresh_subscription_allowance ──
-- Replaces (does not add) the monthly allowance. Called on each successful
-- billing-cycle renewal (Stripe invoice.payment_succeeded). Pack tokens
-- are untouched.
create or replace function refresh_subscription_allowance(p_user_id uuid, p_amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.players
  set
    allowance_tokens      = p_amount,
    rerun_tokens_reset_at = now(),
    updated_at            = now()
  where user_id = p_user_id;
end;
$$;

-- ── RPC: activate_subscription — grants 30 to allowance (replace) ──
-- Updated to grant initial allowance instead of adding to a generic bucket.
-- Pack tokens are NOT touched here.
create or replace function activate_subscription(
  p_user_id        uuid,
  p_subscription_id text,
  p_initial_tokens  integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    subscription_active = true,
    subscription_id     = p_subscription_id,
    subscription_status = 'active'
  where id = p_user_id;

  update public.players
  set
    subscription_active   = true,
    subscription_id       = p_subscription_id,
    subscription_status   = 'active',
    allowance_tokens      = p_initial_tokens,
    rerun_tokens_reset_at = now(),
    updated_at            = now()
  where user_id = p_user_id;
end;
$$;

-- ── RPC: cancel_subscription_allowance ──
-- Called when Stripe fires customer.subscription.deleted.
-- Zeroes allowance_tokens but preserves pack_tokens.
create or replace function cancel_subscription_allowance(p_subscription_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    subscription_active = false,
    subscription_status = 'canceled'
  where subscription_id = p_subscription_id;

  update public.players
  set
    subscription_active = false,
    subscription_status = 'canceled',
    allowance_tokens    = 0,
    updated_at          = now()
  where subscription_id = p_subscription_id;
end;
$$;

-- ── Comments ────────────────────────────────────────────────
comment on column public.players.allowance_tokens is
  'Monthly subscription allowance. Refreshed (replaced) on each billing cycle. Zeroed on cancellation. Consumed BEFORE pack_tokens.';

comment on column public.players.pack_tokens is
  'Tokens purchased via token-pack one-time payments. Roll over forever, never expire, kept on subscription cancellation.';

comment on column public.players.rerun_tokens is
  'DEPRECATED — kept for backwards compatibility. Use allowance_tokens + pack_tokens. To be dropped in a future migration.';
