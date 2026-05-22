-- ============================================================
-- FuseID — Blog content engine
-- ------------------------------------------------------------
-- Stores SEO keywords + generated articles. Article bodies live
-- in the database (not on disk) because Vercel's serverless
-- filesystem is read-only at runtime.
-- ============================================================

create table if not exists public.fuse_keywords (
  id          uuid primary key default gen_random_uuid(),
  keyword     text not null unique,
  priority    int not null default 5,
  sport       text check (sport in ('soccer', 'basketball', 'football', 'volleyball')),
  used        bool not null default false,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists fuse_keywords_unused_priority_idx
  on public.fuse_keywords (priority desc, created_at asc)
  where used = false;

create table if not exists public.fuse_articles (
  id            uuid primary key default gen_random_uuid(),
  keyword       text not null,
  slug          text not null unique,
  title         text not null,
  description   text not null,
  body          text not null,
  tags          text[] not null default '{}',
  sport         text,
  word_count    int,
  published_at  timestamptz not null default now()
);

create index if not exists fuse_articles_published_idx
  on public.fuse_articles (published_at desc);

create index if not exists fuse_articles_sport_idx
  on public.fuse_articles (sport, published_at desc) where sport is not null;

-- Seed keywords — only inserted if the table is empty.
-- Using on conflict do nothing means re-running the migration is safe.
insert into public.fuse_keywords (keyword, priority, sport) values
  -- General recruiting (priority 10)
  ('college recruiting process explained', 10, null),
  ('how to get recruited for college sports', 10, null),
  ('college recruiting timeline by grade', 10, null),
  ('what coaches look for in recruits', 10, null),
  ('how to email a college coach', 10, null),
  ('college recruiting mistakes to avoid', 10, null),
  ('d1 vs d2 vs d3 athletics differences', 10, null),
  ('how to build a college recruiting profile', 10, null),
  ('college recruiting CRM for athletes', 10, null),
  ('best college recruiting tools 2025', 10, null),
  -- Soccer (priority 9)
  ('college soccer recruiting timeline', 9, 'soccer'),
  ('how to get recruited for college soccer', 9, 'soccer'),
  ('ncaa soccer recruiting rules', 9, 'soccer'),
  ('college soccer recruiting showcases', 9, 'soccer'),
  ('soccer recruiting email to coaches template', 9, 'soccer'),
  ('d1 college soccer recruiting process', 9, 'soccer'),
  ('club soccer vs high school soccer recruiting', 9, 'soccer'),
  ('soccer recruiting profile tips', 9, 'soccer'),
  ('id camp college soccer', 9, 'soccer'),
  ('how early do college soccer coaches recruit', 9, 'soccer'),
  -- Basketball (priority 8)
  ('college basketball recruiting process', 8, 'basketball'),
  ('how to get recruited for college basketball', 8, 'basketball'),
  ('aau basketball recruiting exposure', 8, 'basketball'),
  ('college basketball recruiting profile', 8, 'basketball'),
  ('how to email a college basketball coach', 8, 'basketball'),
  -- Football (priority 7)
  ('college football recruiting timeline', 7, 'football'),
  ('how to get a football scholarship', 7, 'football'),
  ('college football recruiting profile', 7, 'football'),
  ('hudl film for college football recruiting', 7, 'football'),
  -- Volleyball (priority 7)
  ('college volleyball recruiting process', 7, 'volleyball'),
  ('how to get recruited for volleyball', 7, 'volleyball'),
  ('volleyball recruiting profile tips', 7, 'volleyball'),
  ('club volleyball recruiting timeline', 7, 'volleyball')
on conflict (keyword) do nothing;

comment on table public.fuse_keywords is 'SEO keywords to be turned into blog articles by the content generator.';
comment on table public.fuse_articles is 'Generated blog articles. The MDX body lives here in the body column.';
