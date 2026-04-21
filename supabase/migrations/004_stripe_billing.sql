-- Stripe billing + token economy columns on players
alter table public.players
  add column if not exists subscription_active    bool default false,
  add column if not exists subscription_id        text,
  add column if not exists subscription_status    text,
  add column if not exists rerun_tokens           int default 3,
  add column if not exists rerun_tokens_used      int default 0,
  add column if not exists rerun_tokens_reset_at  timestamptz,
  add column if not exists email_drafts_this_month int default 0,
  add column if not exists email_drafts_reset_at  timestamptz,
  add column if not exists public_profile_slug    text unique,
  add column if not exists public_profile_enabled bool default false;
