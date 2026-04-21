-- ============================================================
-- PlayerPulse Soccer Recruiting CRM — RLS Policies
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- profiles
alter table public.profiles enable row level security;

create policy "profiles_own" on public.profiles
  using (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- players: own row only
alter table public.players enable row level security;

create policy "players_own" on public.players
  using (user_id = auth.uid());

create policy "players_insert_own" on public.players
  for insert with check (user_id = auth.uid());

create policy "players_update_own" on public.players
  for update using (user_id = auth.uid());

-- schools: public read, service role for writes
alter table public.schools enable row level security;

create policy "schools_public_read" on public.schools
  for select using (true);

-- player_schools: player owns their list
alter table public.player_schools enable row level security;

create policy "player_schools_owner" on public.player_schools
  using (
    player_id in (select id from public.players where user_id = auth.uid())
  );

create policy "player_schools_insert" on public.player_schools
  for insert with check (
    player_id in (select id from public.players where user_id = auth.uid())
  );

create policy "player_schools_update" on public.player_schools
  for update using (
    player_id in (select id from public.players where user_id = auth.uid())
  );

create policy "player_schools_delete" on public.player_schools
  for delete using (
    player_id in (select id from public.players where user_id = auth.uid())
  );

-- parent read access to player_schools
create policy "player_schools_parent_read" on public.player_schools
  for select using (
    player_id in (
      select p.id from public.players p
      inner join public.profiles pr on pr.player_id = p.id
      where pr.id = auth.uid() and pr.role = 'parent'
    )
  );

-- contacts: player owns their contacts
alter table public.contacts enable row level security;

create policy "contacts_owner" on public.contacts
  using (
    player_id in (select id from public.players where user_id = auth.uid())
  );

create policy "contacts_insert" on public.contacts
  for insert with check (
    player_id in (select id from public.players where user_id = auth.uid())
  );

create policy "contacts_update" on public.contacts
  for update using (
    player_id in (select id from public.players where user_id = auth.uid())
  );

create policy "contacts_delete" on public.contacts
  for delete using (
    player_id in (select id from public.players where user_id = auth.uid())
  );

-- parent read access to contacts
create policy "contacts_parent_read" on public.contacts
  for select using (
    player_id in (
      select p.id from public.players p
      inner join public.profiles pr on pr.player_id = p.id
      where pr.id = auth.uid() and pr.role = 'parent'
    )
  );

-- ai_drafts: player only
alter table public.ai_drafts enable row level security;

create policy "ai_drafts_owner" on public.ai_drafts
  using (
    player_id in (select id from public.players where user_id = auth.uid())
  );

create policy "ai_drafts_insert" on public.ai_drafts
  for insert with check (
    player_id in (select id from public.players where user_id = auth.uid())
  );

create policy "ai_drafts_update" on public.ai_drafts
  for update using (
    player_id in (select id from public.players where user_id = auth.uid())
  );

-- match_engine_runs: player only
alter table public.match_engine_runs enable row level security;

create policy "runs_owner" on public.match_engine_runs
  using (
    player_id in (select id from public.players where user_id = auth.uid())
  );

-- parent_invites: player owns their invites
alter table public.parent_invites enable row level security;

create policy "invites_owner" on public.parent_invites
  using (
    player_id in (select id from public.players where user_id = auth.uid())
  );

create policy "invites_insert" on public.parent_invites
  for insert with check (
    player_id in (select id from public.players where user_id = auth.uid())
  );
