import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { type }: { type: 'subscription' | 'tokens' } = await request.json()
    if (type !== 'subscription' && type !== 'tokens') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!

    if (type === 'subscription') {
      const priceId = process.env.STRIPE_PRICE_MONTHLY
      if (!priceId) return NextResponse.json({ error: 'Monthly price not configured' }, { status: 500 })

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/dashboard?billing=success`,
        cancel_url: `${appUrl}/dashboard?billing=canceled`,
        metadata: { user_id: user.id, type: 'subscription' },
      })
      return NextResponse.json({ url: session.url })
    }

    // tokens
    const priceId = process.env.STRIPE_PRICE_TOKEN_PACK
    if (!priceId) return NextResponse.json({ error: 'Token pack price not configured' }, { status: 500 })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?billing=success`,
      cancel_url: `${appUrl}/dashboard?billing=canceled`,
      metadata: { user_id: user.id, type: 'tokens' },
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
