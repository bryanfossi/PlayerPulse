-- ============================================================
-- FuseID — School Momentum Tracking
-- ------------------------------------------------------------
-- Lets a player tag each school on their board as "hot" (heating
-- up), "cold" (going cold), or "neutral" (no movement). Useful for
-- subjective momentum tracking that isn't reflected in formal status
-- yet — e.g., a coach went silent (cold) or just sent a 1-on-1
-- email (hot).
-- ============================================================

alter table public.player_schools
  add column if not exists momentum text check (momentum in ('hot', 'neutral', 'cold')),
  add column if not exists momentum_updated_at timestamptz;

create index if not exists player_schools_momentum_idx
  on public.player_schools (player_id, momentum)
  where momentum is not null;

comment on column public.player_schools.momentum is
  'Player-set subjective signal: hot (heating up), neutral (no movement), cold (going cold). Null = no opinion.';

comment on column public.player_schools.momentum_updated_at is
  'When the momentum field was last changed. Useful for "marked hot 3 days ago" displays.';
