-- ============================================================
-- PlayerPulse Soccer Recruiting CRM — Initial Schema
-- Run in Supabase SQL Editor or via supabase db push
-- ============================================================

-- profiles
create table if not exists public.profiles (
  id          uuid references auth.users primary key,
  email       text not null,
  role        text check (role in ('player', 'parent')) default 'player',
  player_id   uuid,  -- FK added after players table exists
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- players
create table if not exists public.players (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users not null unique,
  first_name            text not null,
  last_name             text not null,
  grad_year             int not null,
  gender                text check (gender in ('Male', 'Female')) not null,
  primary_position      text not null,
  secondary_position    text,
  height_inches         int,
  weight_lbs            int,
  unweighted_gpa        decimal(3,2),
  sat_score             int,
  act_score             int,
  club_team             text not null,
  highest_club_level    text not null,
  high_school           text,
  home_city             text not null,
  home_state            text not null,
  recruiting_radius_mi  int,
  target_levels         text[],
  forced_schools        text[],
  tuition_importance    text check (tuition_importance in (
                          'Not a factor', 'Somewhat important',
                          'Very important', 'Critical'
                        )) default 'Not a factor',
  annual_tuition_budget text,
  bio                   text,
  profile_photo         text,
  highlight_url         text,
  onboarding_complete   bool default false,
  match_engine_run_at   timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- add FK from profiles to players now that players exists
alter table public.profiles
  add constraint profiles_player_id_fkey
  foreign key (player_id) references public.players(id);

-- schools
create table if not exists public.schools (
  id                uuid primary key default gen_random_uuid(),
  name              text not null unique,
  verified_division text check (verified_division in ('D1','D2','D3','NAIA','JUCO')),
  conference        text,
  city              text,
  state             text,
  campus_type       text check (campus_type in ('Urban','Suburban','Rural')),
  enrollment        int,
  avg_gpa           decimal(3,2),
  acceptance_rate   decimal(5,2),
  in_state_tuition  int,
  out_state_tuition int,
  has_scholarship   bool default true,
  soccer_url        text,
  logo_url          text,
  usc_top25_seasons int default 0,
  prestige          text check (prestige in ('Low','Mid','High')),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- player_schools (Top 40 list — core junction table)
create table if not exists public.player_schools (
  id                    uuid primary key default gen_random_uuid(),
  player_id             uuid references public.players(id) not null,
  school_id             uuid references public.schools(id) not null,
  rank_order            int,
  tier                  text check (tier in ('Lock','Realistic','Reach')),
  status                text check (status in (
                          'researching','contacted','interested',
                          'campus_visit','offer_received','committed','declined'
                        )) default 'researching',
  -- Match Engine score components
  overall_score         int,
  geo_score             int,
  acad_score            int,
  level_score           int,
  need_score            int,
  pt_score              int,
  tuition_score         int,
  merit_value_score     int,
  -- Match Engine metadata
  player_level_band     text,
  roster_level_band     text,
  roster_depth          text,
  first_year_opportunity text check (first_year_opportunity in ('Likely','Possible','Developmental','Unlikely')),
  merit_aid_potential   text check (merit_aid_potential in ('High','Medium','Low','Unknown')),
  estimated_merit_aid   text,
  merit_aid_confidence  text check (merit_aid_confidence in ('High','Medium','Low')),
  merit_aid_note        text,
  distance_miles        int,
  acad_note             text,
  level_note            text,
  pt_note               text,
  -- Player-managed fields
  notes                 text,
  added_at              timestamptz default now(),
  updated_at            timestamptz default now(),
  source                text check (source in ('match_engine','manual')) default 'match_engine',
  unique(player_id, school_id)
);

-- contacts
create table if not exists public.contacts (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid references public.players(id) not null,
  school_id     uuid references public.schools(id) not null,
  contact_type  text check (contact_type in (
                  'email_sent','email_received','call','text',
                  'campus_visit','official_visit','unofficial_visit',
                  'coach_at_game','questionnaire'
                )),
  direction     text check (direction in ('outbound','inbound')),
  contact_date  date not null,
  subject       text,
  notes         text,
  email_body    text,
  coach_name    text,
  coach_email   text,
  follow_up_date date,
  created_at    timestamptz default now()
);

-- ai_drafts
create table if not exists public.ai_drafts (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid references public.players(id) not null,
  school_id   uuid references public.schools(id),
  draft_type  text check (draft_type in (
                'initial_outreach','follow_up','thank_you',
                'campus_visit_request','offer_response'
              )),
  subject     text,
  body        text,
  used        bool default false,
  contact_id  uuid references public.contacts(id),
  created_at  timestamptz default now()
);

-- match_engine_runs
create table if not exists public.match_engine_runs (
  id              uuid primary key default gen_random_uuid(),
  player_id       uuid references public.players(id) not null,
  raw_tsv         text not null,
  parsed_count    int,
  error_rows      jsonb,
  run_at          timestamptz default now(),
  player_snapshot jsonb
);

-- parent_invites
create table if not exists public.parent_invites (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid references public.players(id) not null,
  email       text not null,
  token       text not null unique,
  accepted    bool default false,
  expires_at  timestamptz not null,
  created_at  timestamptz default now()
);

-- ============================================================
-- Triggers: auto-update updated_at columns
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger players_updated_at
  before update on public.players
  for each row execute function public.handle_updated_at();

create trigger schools_updated_at
  before update on public.schools
  for each row execute function public.handle_updated_at();

create trigger player_schools_updated_at
  before update on public.player_schools
  for each row execute function public.handle_updated_at();

-- ============================================================
-- Trigger: create profile on new user signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'player')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
