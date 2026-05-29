#!/usr/bin/env bash
# One-shot: push env vars missing from Vercel up from .env.local.
# Uses --force so re-runs overwrite existing values. Loops over
# production, preview, development environments.

set -u

# Source .env.local so we can dereference each var by name. Quote-stripped
# automatically by bash's `source`.
set -a
# shellcheck disable=SC1091
source .env.local
set +a

VARS_TO_ADD=(
  NEXT_PUBLIC_APP_URL
  STRIPE_PRICE_MONTHLY_STARTER
  STRIPE_PRICE_MONTHLY_PRO
  STRIPE_PRICE_TOKEN_PACK_MINI
  STRIPE_PRICE_TOKEN_PACK_STANDARD
  STRIPE_PRICE_TOKEN_PACK_MAX
  STRIPE_PRICE_MONTHLY
  STRIPE_PRICE_TOKEN_PACK
  RESEND_API_KEY
  RESEND_FROM_EMAIL
  SENTRY_AUTH_TOKEN
  SENTRY_API_TOKEN
  SERPER_API_KEY
  CRON_SECRET
)

# Preview env intentionally omitted — Vercel CLI requires an explicit
# git branch for preview adds in non-interactive mode, which we don't
# need for PR previews on a solo project. Re-run manually if you want
# preview branches to mirror production values.
ENVS=(production development)

ok=0
fail=0

for name in "${VARS_TO_ADD[@]}"; do
  value="${!name:-}"
  if [ -z "$value" ]; then
    echo "  SKIP $name (empty in .env.local)"
    continue
  fi
  for env in "${ENVS[@]}"; do
    if vercel env add "$name" "$env" --value "$value" --force --yes >/dev/null 2>&1; then
      ok=$((ok + 1))
    else
      echo "  FAIL $name -> $env"
      fail=$((fail + 1))
    fi
  done
  echo "  done: $name"
done

echo ""
echo "Successful writes: $ok"
echo "Failed writes:     $fail"
