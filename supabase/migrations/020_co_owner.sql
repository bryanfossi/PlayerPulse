-- ============================================================
-- FUSE-ID — Parent/player shared account (co-ownership)
-- ------------------------------------------------------------
-- Adds a second auth-user reference to public.players so a parent
-- and athlete can share one player record. Either co-owner has
-- full edit access. A subscription on the shared player covers
-- both auth identities.
--
-- The intended flow:
--   1. Parent signs up, enters athlete's email at /register.
--   2. handle_new_user trigger creates the parent's profile row.
--   3. /api/auth/register-extras inserts a co_owner_invite row
--      keyed to the parent's user_id and the athlete's email.
--   4. Parent runs the onboarding wizard which creates a
--      public.players row owned by the parent. The pending invite
--      is updated with the new player_id.
--   5. We send the athlete a magic-link email. They click it,
--      set a password, and a new auth.users row is created for
--      them. We set players.co_owner_user_id to their auth id.
--   6. From here on, every player lookup must check BOTH
--      user_id AND co_owner_user_id. See src/lib/player/lookup.ts
--      and the codemod that updates all routes.
-- ============================================================

-- 1. Co-owner column on players
alter table public.players
  add column if not exists co_owner_user_id uuid references auth.users on delete set null,
  add column if not exists created_by_role text
    check (created_by_role in ('player', 'parent')) default 'player';

-- One auth user can co-own at most one player record (mirror of the
-- existing unique constraint on user_id). NULL co_owner is fine for
-- non-shared accounts.
create unique index if not exists players_co_owner_user_id_unique
  on public.players (co_owner_user_id)
  where co_owner_user_id is not null;

-- Sanity: can't co-own with yourself.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'players_user_co_owner_distinct'
  ) then
    alter table public.players
      add constraint players_user_co_owner_distinct
      check (co_owner_user_id is null or co_owner_user_id <> user_id);
  end if;
end $$;

-- Fast lookups for the OR(user_id, co_owner_user_id) pattern
create index if not exists players_co_owner_user_id_idx
  on public.players (co_owner_user_id)
  where co_owner_user_id is not null;

-- 2. Co-owner invites
-- player_id is NULLABLE so an invite can be created at parent signup
-- BEFORE the parent has finished the wizard (and thus before the
-- players row exists). The /api/auth/accept route resolves the player
-- by inviter_user_id at click time if player_id is still null.
create table if not exists public.co_owner_invites (
  id                    uuid primary key default gen_random_uuid(),
  player_id             uuid references public.players(id) on delete cascade,
  invited_by_user_id    uuid references auth.users on delete cascade not null,
  invitee_email         text not null,
  invitee_role          text not null check (invitee_role in ('player', 'parent')),
  token                 text not null unique,
  accepted_at           timestamptz,
  accepted_by_user_id   uuid references auth.users on delete set null,
  expires_at            timestamptz not null,
  created_at            timestamptz not null default now()
);

create index if not exists co_owner_invites_pending_token_idx
  on public.co_owner_invites (token)
  where accepted_at is null;

create index if not exists co_owner_invites_pending_email_idx
  on public.co_owner_invites (invitee_email)
  where accepted_at is null;

create index if not exists co_owner_invites_inviter_idx
  on public.co_owner_invites (invited_by_user_id, created_at desc);

comment on table public.co_owner_invites is
  'Pending and accepted invitations from one user to add a second auth identity (parent <-> athlete) to the same players row. Tokens expire 7 days after creation.';
