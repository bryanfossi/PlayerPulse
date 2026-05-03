-- Add subscription_active to profiles so it can be checked before a player record exists
alter table public.profiles
  add column if not exists subscription_active bool default false,
  add column if not exists subscription_id     text,
  add column if not exists subscription_status text;

-- Update activate_subscription to also mark the profile row
CREATE OR REPLACE FUNCTION activate_subscription(
  p_user_id        uuid,
  p_subscription_id text,
  p_initial_tokens  integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark the profile (exists for all users from signup trigger)
  UPDATE public.profiles
  SET
    subscription_active  = true,
    subscription_id      = p_subscription_id,
    subscription_status  = 'active'
  WHERE id = p_user_id;

  -- Mark the player record if it already exists (post-onboarding re-subscribe)
  UPDATE public.players
  SET
    subscription_active     = true,
    subscription_id         = p_subscription_id,
    subscription_status     = 'active',
    rerun_tokens            = rerun_tokens + p_initial_tokens,
    updated_at              = now()
  WHERE user_id = p_user_id;
END;
$$;
