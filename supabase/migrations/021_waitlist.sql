-- ============================================================
-- FuseID — Waitlist Signups
-- ------------------------------------------------------------
-- Captures email captures from sport-specific "coming soon"
-- landing pages (e.g. /volleyball-recruiting). Anonymous —
-- no auth required to submit.
-- ============================================================

create table if not exists public.waitlist_signups (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  sport       text,
  source      text,
  user_agent  text,
  created_at  timestamptz default now()
);

-- One row per (email, sport) — re-submitting the same email for the same
-- sport is a no-op rather than a duplicate.
create unique index if not exists waitlist_signups_email_sport_unique
  on public.waitlist_signups (lower(email), coalesce(sport, ''));

create index if not exists waitlist_signups_created_at_idx
  on public.waitlist_signups (created_at desc);

alter table public.waitlist_signups enable row level security;

-- Service role writes only — there is no client-side read or write path.
-- The API route uses createServiceClient() to insert.
create policy "waitlist_signups_no_anon_access"
  on public.waitlist_signups
  for all
  using (false);

comment on table public.waitlist_signups is
  'Anonymous email captures from sport-specific landing pages. The API route /api/waitlist writes here via the service client.';
