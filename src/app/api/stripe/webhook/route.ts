import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { TOKEN_GRANTS } from '@/lib/tokens/costs'
import type Stripe from 'stripe'

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
        const { error: rpcErr } = await supabaseAdmin.rpc('activate_subscription', {
          p_user_id: userId,
          p_subscription_id: session.subscription as string,
          p_initial_tokens: TOKEN_GRANTS.SUBSCRIPTION_MONTHLY_ALLOWANCE,
        })
        if (rpcErr) {
          console.error('[webhook] activate_subscription RPC failed:', rpcErr)
        }
      } else if (type === 'tokens') {
        const { error: rpcErr } = await supabaseAdmin.rpc('grant_rerun_tokens', {
          p_user_id: userId,
          p_amount: TOKEN_GRANTS.PACK_PURCHASE,
        })
        if (rpcErr) {
          console.error('[webhook] grant_rerun_tokens RPC failed:', rpcErr)
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
        // Look up the user_id by subscription_id
        const { data: profileRow } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('subscription_id', invoice.subscription)
          .maybeSingle()

        if (profileRow) {
          const { error: rpcErr } = await supabaseAdmin.rpc('refresh_subscription_allowance', {
            p_user_id: (profileRow as { id: string }).id,
            p_amount: TOKEN_GRANTS.SUBSCRIPTION_MONTHLY_ALLOWANCE,
          })
          if (rpcErr) {
            console.error('[webhook] refresh_subscription_allowance RPC failed:', rpcErr)
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
      // Use the cancel RPC to zero out allowance_tokens and update both profiles + players atomically
      const { error: rpcErr } = await supabaseAdmin.rpc('cancel_subscription_allowance', {
        p_subscription_id: sub.id,
      })
      if (rpcErr) {
        console.error('[webhook] cancel_subscription_allowance RPC failed:', rpcErr)
      }
    }
  } catch (err) {
    console.error('[webhook] handler error for', event.type, ':', err instanceof Error ? err.message : err)
  }

  return NextResponse.json({ received: true })
}
