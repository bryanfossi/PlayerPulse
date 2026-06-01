-- ============================================================
-- FUSE-ID — Persist Stripe customer id on profiles
-- ------------------------------------------------------------
-- Stores the Stripe customer id captured at checkout completion
-- so the Stripe Billing Portal can be opened in one query, with
-- no email-based lookup at the Stripe API.
-- ============================================================

alter table public.profiles
  add column if not exists stripe_customer_id text;

create index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

comment on column public.profiles.stripe_customer_id is
  'Stripe customer id (cus_...) captured from the checkout session that created the user''s first subscription or pack purchase. Used to open the Stripe Billing Portal.';
