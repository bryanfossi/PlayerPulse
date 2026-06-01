/**
 * Stripe Billing Portal — opens Stripe's hosted self-serve UI where the
 * user can cancel their subscription, switch tiers (Starter ↔ Pro),
 * update card details, and download invoices.
 *
 * Customer resolution (in order):
 *   1. profiles.stripe_customer_id (captured at checkout via webhook,
 *      migration 025).
 *   2. Fallback: if the profile has a subscription_id but no customer id
 *      (legacy account), retrieve the subscription from Stripe to find
 *      the customer, then backfill profiles.stripe_customer_id.
 *   3. If still no customer (free-tier user with no purchase history),
 *      we return 400 — they have nothing to manage in the portal.
 */

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

interface ProfileRow {
  id: string
  stripe_customer_id: string | null
  subscription_id: string | null
}

async function loadProfile(userId: string): Promise<ProfileRow | null> {
  const service = createServiceClient()
  const untyped = service as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (k: string, v: string) => {
          maybeSingle: () => Promise<{ data: ProfileRow | null; error: unknown }>
        }
      }
    }
  }
  const { data } = await untyped
    .from('profiles')
    .select('id, stripe_customer_id, subscription_id')
    .eq('id', userId)
    .maybeSingle()
  return data
}

async function backfillCustomerId(userId: string, customerId: string): Promise<void> {
  const service = createServiceClient()
  const untyped = service as unknown as {
    from: (t: string) => {
      update: (row: Record<string, unknown>) => {
        eq: (k: string, v: string) => Promise<{ error: unknown }>
      }
    }
  }
  const { error } = await untyped
    .from('profiles')
    .update({ stripe_customer_id: customerId })
    .eq('id', userId)
  if (error) {
    console.error('[stripe/portal] backfill stripe_customer_id failed:', error)
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await loadProfile(user.id)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let customerId = profile.stripe_customer_id

    // Fallback for accounts that subscribed before migration 025 added the column
    if (!customerId && profile.subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(profile.subscription_id)
        const subCustomer = sub.customer
        if (typeof subCustomer === 'string') {
          customerId = subCustomer
          await backfillCustomerId(user.id, customerId)
        } else if (subCustomer && 'id' in subCustomer) {
          customerId = subCustomer.id
          await backfillCustomerId(user.id, customerId)
        }
      } catch (err) {
        console.error('[stripe/portal] subscription fallback failed:', err)
      }
    }

    if (!customerId) {
      return NextResponse.json(
        {
          error: 'No billing history found. Subscribe to a plan or buy a token pack first.',
        },
        { status: 400 },
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://fuse-id.online'
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[stripe/portal] error:', msg)
    Sentry.captureException(err, { tags: { feature: 'stripe-portal' } })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
