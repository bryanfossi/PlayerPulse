-- ============================================================
-- FUSE-ID — Activate baseball + lacrosse as supported sports
-- ------------------------------------------------------------
-- Expands the sport check constraints on fuse_keywords (migration
-- 018) and blog_posts (migration 022) to accept 'baseball' and
-- 'lacrosse' alongside the original four sports.
--
-- Postgres doesn't support modifying CHECK constraints in place,
-- so we drop the auto-generated *_check constraint and re-add it
-- with the expanded list.
-- ============================================================

-- fuse_keywords.sport
alter table public.fuse_keywords
  drop constraint if exists fuse_keywords_sport_check;

alter table public.fuse_keywords
  add constraint fuse_keywords_sport_check
  check (sport in ('soccer', 'basketball', 'football', 'volleyball', 'baseball', 'lacrosse'));

-- blog_posts.sport
alter table public.blog_posts
  drop constraint if exists blog_posts_sport_check;

alter table public.blog_posts
  add constraint blog_posts_sport_check
  check (sport in ('soccer', 'football', 'basketball', 'volleyball', 'baseball', 'lacrosse'));
