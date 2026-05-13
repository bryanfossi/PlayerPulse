import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import {
  TOKEN_PACKS,
  SUBSCRIPTION_TIERS,
  type TokenPackId,
  type SubscriptionTierId,
} from '@/lib/tokens/costs'

// Map pack id → env var holding the Stripe Price ID for that pack.
const PACK_PRICE_ENV: Record<TokenPackId, string> = {
  mini:     'STRIPE_PRICE_TOKEN_PACK_MINI',
  standard: 'STRIPE_PRICE_TOKEN_PACK_STANDARD',
  max:      'STRIPE_PRICE_TOKEN_PACK_MAX',
}

function resolvePackPriceId(pack: TokenPackId): string | null {
  const direct = process.env[PACK_PRICE_ENV[pack]]
  if (direct) return direct
  // Legacy fallback — the original single-pack env var is the 30-token 'max'.
  if (pack === 'max') return process.env.STRIPE_PRICE_TOKEN_PACK ?? null
  return null
}

// Map subscription tier → env var with the recurring Stripe Price ID.
const PLAN_PRICE_ENV: Record<SubscriptionTierId, string> = {
  starter: 'STRIPE_PRICE_MONTHLY_STARTER',
  pro:     'STRIPE_PRICE_MONTHLY_PRO',
}

function resolvePlanPriceId(plan: SubscriptionTierId): string | null {
  const direct = process.env[PLAN_PRICE_ENV[plan]]
  if (direct) return direct
  // Legacy fallback — the original single-monthly env var is the $14.99 Pro plan.
  if (plan === 'pro') return process.env.STRIPE_PRICE_MONTHLY ?? null
  return null
}

type Body = {
  type: 'subscription' | 'tokens'
  pack?: TokenPackId           // required when type === 'tokens'; defaults to 'max'
  plan?: SubscriptionTierId    // required when type === 'subscription'; defaults to 'pro'
  successPath?: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { type, pack, plan, successPath }: Body = await request.json()
    if (type !== 'subscription' && type !== 'tokens') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!

    // Allowlist return paths to prevent open redirect
    const ALLOWED_SUCCESS_PATHS = ['/dashboard', '/onboarding/subscribe']
    const resolvedSuccess = ALLOWED_SUCCESS_PATHS.includes(successPath ?? '') ? successPath! : '/dashboard'
    const resolvedCancel = resolvedSuccess

    if (type === 'subscription') {
      // Default to 'pro' for back-compat with old clients that don't send plan.
      const planId: SubscriptionTierId =
        plan && plan in SUBSCRIPTION_TIERS ? plan : 'pro'
      const priceId = resolvePlanPriceId(planId)
      if (!priceId) {
        return NextResponse.json(
          { error: `Subscription plan '${planId}' is not configured` },
          { status: 500 },
        )
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}${resolvedSuccess}?billing=success`,
        cancel_url: `${appUrl}${resolvedCancel}?billing=canceled`,
        allow_promotion_codes: true,
        metadata: {
          user_id: user.id,
          type: 'subscription',
          plan: planId,
          tokens: String(SUBSCRIPTION_TIERS[planId].monthlyTokens),
        },
      })
      return NextResponse.json({ url: session.url })
    }

    // tokens — pick a pack (default 'max' for back-compat with the old single-pack button)
    const packId: TokenPackId = pack && pack in TOKEN_PACKS ? pack : 'max'
    const priceId = resolvePackPriceId(packId)
    if (!priceId) {
      return NextResponse.json(
        { error: `Token pack '${packId}' is not configured` },
        { status: 500 },
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?billing=success`,
      cancel_url: `${appUrl}/dashboard?billing=canceled`,
      allow_promotion_codes: true,
      metadata: {
        user_id: user.id,
        type: 'tokens',
        pack: packId,
        // Snapshot the amount so the webhook doesn't have to re-derive it
        // if we ever change the pack catalog.
        tokens: String(TOKEN_PACKS[packId].amount),
      },
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[stripe/checkout] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
