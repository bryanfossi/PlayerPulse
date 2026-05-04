-- ============================================================
-- FuseID — Actions / Todo
-- ------------------------------------------------------------
-- A unified "things I need to do" surface. Actions can be:
--   - manual    — user typed it themselves
--   - profile_tip — saved from an AI profile-tip card
--   - follow_up — auto-created from a contact's follow_up_date
--   - system    — created by other automation
--
-- An action can optionally reference a player_school (e.g. "email
-- Coach Smith") or a contact (e.g. "follow up on the 3/15 call").
-- ============================================================

create table if not exists public.actions (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references public.players(id) on delete cascade,

  title       text not null,
  description text,

  status      text not null default 'open'
              check (status in ('open', 'completed', 'snoozed', 'archived')),
  due_date    date,
  completed_at timestamptz,

  player_school_id uuid references public.player_schools(id) on delete set null,
  contact_id       uuid references public.contacts(id) on delete set null,

  source       text not null default 'manual'
               check (source in ('manual', 'profile_tip', 'follow_up', 'system')),
  source_payload jsonb,

  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists actions_player_status_idx
  on public.actions (player_id, status);

create index if not exists actions_player_completed_idx
  on public.actions (player_id, completed_at)
  where completed_at is not null;

create index if not exists actions_player_due_idx
  on public.actions (player_id, due_date)
  where due_date is not null and status = 'open';

comment on table public.actions is
  'Player-facing todo list. Each action belongs to one player, optionally references a school or contact, and tracks who created it (manual vs ai-tip vs system).';
