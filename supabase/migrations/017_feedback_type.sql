-- ============================================================
-- FuseID — Feedback type classifier
-- ------------------------------------------------------------
-- Adds a `type` column to public.feedback so admins can triage
-- by bug / feature idea / question / other instead of reading
-- every row. Existing rows backfill to 'other'.
-- ============================================================

alter table public.feedback
  add column if not exists type text not null default 'other'
  check (type in ('bug', 'feature', 'question', 'other'));

create index if not exists feedback_type_idx
  on public.feedback (type, created_at desc);

comment on column public.feedback.type is
  'User-classified feedback type. Defaults to "other" when the submitter does not choose one.';
