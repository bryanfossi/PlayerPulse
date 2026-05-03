-- Atomic token grant to eliminate the read-then-write race condition in the webhook handler.
-- Uses UPDATE ... SET col = col + n so concurrent Stripe events can't double-count.

CREATE OR REPLACE FUNCTION grant_rerun_tokens(p_user_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.players
  SET
    rerun_tokens = rerun_tokens + p_amount,
    updated_at   = now()
  WHERE user_id = p_user_id;
END;
$$;
