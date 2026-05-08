-- ============================================================
-- FuseID — User Feedback
-- ------------------------------------------------------------
-- Captures in-app feedback submissions. Every submission is saved
-- here as an audit trail; the API also tries to email it to the
-- product owner if a Resend API key is configured.
-- ============================================================

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete set null,
  email       text,
  page_url    text,
  user_agent  text,
  message     text not null,
  status      text not null default 'new'
              check (status in ('new', 'read', 'responded', 'archived')),
  created_at  timestamptz default now()
);

create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);

create index if not exists feedback_status_idx
  on public.feedback (status, created_at desc);

comment on table public.feedback is
  'In-app feedback submissions from the floating feedback button. The API route attempts to email these to the product owner via Resend; this table is the durable record regardless.';
