-- ============================================================
-- PlayerPulse — School Sport URLs
-- ------------------------------------------------------------
-- The schools table currently has a soccer_url column that only
-- supports a single sport. This migration adds a sport_urls jsonb
-- column that stores a map of sport_id → program URL, so any sport
-- can have its own program page link without schema changes.
--
-- Existing soccer_url values are migrated into sport_urls and the
-- original column is kept for backwards compatibility. It should be
-- removed in a future migration once all read paths use sport_urls.
-- ============================================================

-- Add the new sport_urls column
alter table public.schools
  add column if not exists sport_urls jsonb not null default '{}';

-- Backfill: copy existing soccer_url values into sport_urls
update public.schools
  set sport_urls = jsonb_build_object('soccer', soccer_url)
  where soccer_url is not null
    and (sport_urls is null or sport_urls = '{}');

comment on column public.schools.sport_urls is
  'Map of sport_id slug → program page URL. e.g. {"soccer": "https://...", "volleyball": "https://..."}. Source of truth for sport-specific program links.';
