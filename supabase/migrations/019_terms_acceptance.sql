-- ============================================================
-- FUSE-ID — ToS / Privacy acceptance tracking
-- ------------------------------------------------------------
-- Captures when each user accepted the Terms of Service and
-- Privacy Policy, plus the version they accepted. Versions are
-- kept so we can prompt re-acceptance after material updates
-- without trapping users on an obsolete agreement.
-- ============================================================

alter table public.profiles
  add column if not exists accepted_terms_at timestamptz,
  add column if not exists accepted_terms_version text,
  add column if not exists accepted_privacy_at timestamptz,
  add column if not exists accepted_privacy_version text;

create index if not exists profiles_accepted_terms_version_idx
  on public.profiles (accepted_terms_version) where accepted_terms_version is not null;

comment on column public.profiles.accepted_terms_at is
  'UTC timestamp when the user accepted the Terms of Service. Null if never accepted (legacy accounts).';
comment on column public.profiles.accepted_privacy_at is
  'UTC timestamp when the user accepted the Privacy Policy.';
