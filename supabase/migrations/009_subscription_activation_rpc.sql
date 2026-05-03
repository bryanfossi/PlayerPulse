-- Atomic subscription activation.
-- Uses additive rerun_tokens = rerun_tokens + p_initial_tokens so concurrent
-- Stripe events can't overwrite tokens the user already earned from purchases.

CREATE OR REPLACE FUNCTION activate_subscription(
  p_user_id        uuid,
  p_subscription_id text,
  p_initial_tokens  integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.players
  SET
    subscription_active     = true,
    subscription_id         = p_subscription_id,
    subscription_status     = 'active',
    rerun_tokens            = rerun_tokens + p_initial_tokens,
    rerun_tokens_reset_at   = now(),
    email_drafts_this_month = 0,
    email_drafts_reset_at   = now(),
    updated_at              = now()
  WHERE user_id = p_user_id;
END;
$$;
