import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
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
        await supabaseAdmin
          .from('players')
          .update({
            subscription_active: true,
            subscription_id: session.subscription as string,
            subscription_status: 'active',
            rerun_tokens: 3,
            rerun_tokens_reset_at: new Date().toISOString(),
            email_drafts_this_month: 0,
            email_drafts_reset_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
      } else if (type === 'tokens') {
        const { data: player } = await supabaseAdmin
          .from('players')
          .select('rerun_tokens')
          .eq('user_id', userId)
          .maybeSingle()

        await supabaseAdmin
          .from('players')
          .update({
            rerun_tokens: (player?.rerun_tokens ?? 0) + 3,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
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
      await supabaseAdmin
        .from('players')
        .update({
          subscription_active: false,
          subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('subscription_id', sub.id)
    }
  } catch (err) {
    console.error('[webhook] handler error for', event.type, ':', err instanceof Error ? err.message : err)
  }

  return NextResponse.json({ received: true })
}
