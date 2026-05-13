import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  TOKEN_GRANTS,
  TOKEN_PACKS,
  SUBSCRIPTION_TIERS,
  monthlyAllowanceForTier,
  type TokenPackId,
  type SubscriptionTierId,
} from '@/lib/tokens/costs'
import { recordTokenTransaction } from '@/lib/tokens/audit'
import type Stripe from 'stripe'

type DbTier = 'free' | 'starter' | 'pro' | 'legacy'

/**
 * Mirror the chosen plan onto profiles.tier and players.tier so server-side
 * checks (and the onboarding flow) can read it in one query. Non-fatal on
 * failure — the subscription is already active, the user can still use the
 * site, and we'll log it for follow-up.
 */
async function setUserTier(userId: string, tier: DbTier): Promise<void> {
  // tier is a migration-016 column not yet in the generated database.ts —
  // use an untyped facade to issue the update without a build error.
  const untyped = supabaseAdmin as unknown as {
    from: (t: string) => {
      update: (row: Record<string, unknown>) => {
        eq: (k: string, v: string) => Promise<{ error: unknown }>
      }
    }
  }
  const { error: profileErr } = await untyped.from('profiles').update({ tier }).eq('id', userId)
  if (profileErr) {
    console.error('[webhook] profiles.tier update failed:', profileErr)
  }
  const { error: playerErr } = await untyped.from('players').update({ tier }).eq('user_id', userId)
  if (playerErr) {
    // It's normal for there to be no player row yet (subscription bought
    // before wizard finished) — supabase update with no match is not an error.
    console.error('[webhook] players.tier update failed:', playerErr)
  }
}

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] signature verification failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[webhook] event.type:', event.type)

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const type = session.metadata?.type

      if (!userId) {
        console.error('[webhook] checkout.session.completed missing user_id')
        return NextResponse.json({ received: true })
      }

      if (type === 'subscription') {
        const planMeta = session.metadata?.plan as SubscriptionTierId | undefined
        const planId: SubscriptionTierId =
          planMeta && planMeta in SUBSCRIPTION_TIERS ? planMeta : 'pro'
        const tokens = SUBSCRIPTION_TIERS[planId].monthlyTokens

        const { error: rpcErr } = await supabaseAdmin.rpc('activate_subscription', {
          p_user_id: userId,
          p_subscription_id: session.subscription as string,
          p_initial_tokens: tokens,
        })
        if (rpcErr) {
          console.error('[webhook] activate_subscription RPC failed:', rpcErr)
        } else {
          await setUserTier(userId, planId)
          await recordTokenTransaction({
            service: supabaseAdmin,
            userId,
            type: 'subscription_refresh',
            amount: tokens,
            sourceRef: (session.subscription as string) ?? session.id,
          })
        }
      } else if (type === 'tokens') {
        // Look up the pack id and amount from metadata. Default to 'max' for
        // back-compat with old checkout sessions that pre-date the pack catalog.
        const packMeta = session.metadata?.pack as TokenPackId | undefined
        const packId: TokenPackId = packMeta && packMeta in TOKEN_PACKS ? packMeta : 'max'
        const metaAmount = parseInt(session.metadata?.tokens ?? '', 10)
        const amount = Number.isFinite(metaAmount) && metaAmount > 0
          ? metaAmount
          : TOKEN_PACKS[packId].amount

        const { error: rpcErr } = await supabaseAdmin.rpc('grant_rerun_tokens', {
          p_user_id: userId,
          p_amount: amount,
        })
        if (rpcErr) {
          console.error('[webhook] grant_rerun_tokens RPC failed:', rpcErr)
        } else {
          await recordTokenTransaction({
            service: supabaseAdmin,
            userId,
            type: 'pack_purchase',
            amount,
            sourceRef: (session.payment_intent as string) ?? session.id,
          })
        }
      }
    } else if (event.type === 'invoice.payment_succeeded') {
      // Subscription renewal — refresh the monthly allowance.
      // Stripe fires this on every successful billing-cycle charge,
      // including the very first one. We only refresh on subsequent
      // cycles (billing_reason = 'subscription_cycle') to avoid
      // double-granting allowance on activation.
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null }
      if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
        // Look up the user_id + tier by subscription_id so the renewal grants
        // the correct amount for whichever plan they're on (Starter = 20,
        // Pro/legacy = 30). Free is unreachable here since they have no sub.
        // Untyped read because tier isn't in the generated database.ts yet.
        const untypedRead = supabaseAdmin as unknown as {
          from: (t: string) => {
            select: (cols: string) => {
              eq: (k: string, v: string) => {
                maybeSingle: () => Promise<{ data: { id?: string; tier?: DbTier } | null }>
              }
            }
          }
        }
        const { data: profileRow } = await untypedRead
          .from('profiles')
          .select('id, tier')
          .eq('subscription_id', invoice.subscription)
          .maybeSingle()

        if (profileRow && profileRow.id) {
          const subscriberUserId = profileRow.id
          const tier = (profileRow.tier ?? 'pro') as DbTier
          const amount = monthlyAllowanceForTier(tier) || TOKEN_GRANTS.SUBSCRIPTION_MONTHLY_ALLOWANCE
          const { error: rpcErr } = await supabaseAdmin.rpc('refresh_subscription_allowance', {
            p_user_id: subscriberUserId,
            p_amount: amount,
          })
          if (rpcErr) {
            console.error('[webhook] refresh_subscription_allowance RPC failed:', rpcErr)
          } else {
            await recordTokenTransaction({
              service: supabaseAdmin,
              userId: subscriberUserId,
              type: 'subscription_refresh',
              amount,
              sourceRef: invoice.subscription ?? invoice.id,
            })
          }
        } else {
          console.warn('[webhook] no profile found for subscription_id:', invoice.subscription)
        }
      }
    } else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription
      await supabaseAdmin
        .from('players')
        .update({
          subscription_status: sub.status,
          updated_at: new Date().toISOString(),
        })
        .eq('subscription_id', sub.id)
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      // Zero out allowance_tokens and update both profiles + players atomically
      const { error: rpcErr } = await supabaseAdmin.rpc('cancel_subscription_allowance', {
        p_subscription_id: sub.id,
      })
      if (rpcErr) {
        console.error('[webhook] cancel_subscription_allowance RPC failed:', rpcErr)
      }
      // Revert tier to 'free' on both profiles + players. Look up the user
      // by subscription_id so we don't have to thread it through the RPC.
      const { data: profileRow } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('subscription_id', sub.id)
        .maybeSingle()
      if (profileRow) {
        await setUserTier((profileRow as { id: string }).id, 'free')
      }
    }
  } catch (err) {
    console.error('[webhook] handler error for', event.type, ':', err instanceof Error ? err.message : err)
  }

  return NextResponse.json({ received: true })
}
