-- ============================================================
-- FuseID — Daily Blog System (v2)
-- ------------------------------------------------------------
-- Replaces the keyword-driven fuse_articles pipeline with a
-- daily, multi-sport pipeline. Posts come in two flavors that
-- alternate by calendar day:
--   - college_specific: "How to Get Recruited by {School} for {Sport}"
--   - tips_guide:       "Top 10 ... / D1 vs D2 vs D3 ... / etc."
--
-- The cron (/api/blog/generate, daily at 06:00 UTC) writes one
-- post per active sport (soccer, football, basketball, volleyball).
--
-- A small cron_state table tracks rotation indices so the generator
-- is stateless between runs.
-- ============================================================

-- ---------- blog_posts ----------
create table if not exists public.blog_posts (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  slug              text not null unique,
  sport             text not null check (sport in ('soccer', 'football', 'basketball', 'volleyball')),
  post_type         text not null check (post_type in ('college_specific', 'tips_guide')),
  school_name       text,
  content           text not null,
  excerpt           text not null,
  meta_description  text not null,
  keywords          text[] not null default '{}',
  published_at      timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists blog_posts_sport_published_idx
  on public.blog_posts (sport, published_at desc);

create index if not exists blog_posts_published_idx
  on public.blog_posts (published_at desc);

create index if not exists blog_posts_slug_idx
  on public.blog_posts (slug);

comment on table public.blog_posts is
  'Daily-generated SEO blog posts. Two post types alternate by calendar day. One post per active sport per day via the cron at /api/blog/generate.';

alter table public.blog_posts enable row level security;

-- Public reads (anon + authenticated) — only posts whose publish time has arrived.
create policy "blog_posts_public_read_published"
  on public.blog_posts
  for select
  using (published_at <= now());

-- Service role is exempt from RLS in Supabase, but we declare a permissive
-- policy explicitly for clarity. Writes only happen via the service client.
create policy "blog_posts_service_all"
  on public.blog_posts
  for all
  to service_role
  using (true)
  with check (true);


-- ---------- cron_state ----------
create table if not exists public.cron_state (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);

comment on table public.cron_state is
  'Generic key-value store for cron rotation indices and other tiny stateful counters. Initial keys: college_queue_index, tips_topic_index.';

alter table public.cron_state enable row level security;

create policy "cron_state_service_all"
  on public.cron_state
  for all
  to service_role
  using (true)
  with check (true);

-- Seed rotation counters at zero.
insert into public.cron_state (key, value) values
  ('college_queue_index', '0'),
  ('tips_topic_index',    '0')
on conflict (key) do nothing;


-- ---------- Backfill from the old fuse_articles table (one-time) ----------
-- Idempotent: skips rows whose slug already exists in blog_posts. Only
-- migrates rows whose sport is one of the four active sports — articles
-- tagged 'general' in the old table are left behind.
insert into public.blog_posts
  (title, slug, sport, post_type, content, excerpt, meta_description, keywords, published_at, created_at)
select
  fa.title,
  fa.slug,
  fa.sport,
  'tips_guide'::text as post_type,
  fa.body            as content,
  left(coalesce(fa.description, fa.body), 155) as excerpt,
  left(fa.description, 160)                    as meta_description,
  fa.tags            as keywords,
  fa.published_at,
  fa.published_at
from public.fuse_articles fa
where fa.sport in ('soccer', 'football', 'basketball', 'volleyball')
on conflict (slug) do nothing;
