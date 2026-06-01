'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SUBSCRIPTION_TIERS } from '@/lib/tokens/costs'

type Tier = 'free' | 'starter' | 'pro' | 'legacy'

interface Props {
  tier: Tier
  /** Whether the user has any Stripe billing history (subscription or pack purchase) */
  hasBillingHistory: boolean
}

const TIER_LABEL: Record<Tier, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  legacy: 'Legacy ($14.99 grandfathered)',
}

export function BillingSection({ tier, hasBillingHistory }: Props) {
  const [loading, setLoading] = useState(false)

  async function openPortal() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.url) {
        toast.error(json.error ?? 'Could not open billing portal.')
        return
      }
      window.location.href = json.url
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const monthlyPrice =
    tier === 'starter' ? SUBSCRIPTION_TIERS.starter.priceCents / 100 :
    tier === 'pro' || tier === 'legacy' ? SUBSCRIPTION_TIERS.pro.priceCents / 100 :
    0
  const monthlyTokens =
    tier === 'starter' ? SUBSCRIPTION_TIERS.starter.monthlyTokens :
    tier === 'pro' || tier === 'legacy' ? SUBSCRIPTION_TIERS.pro.monthlyTokens :
    0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          Billing & subscription
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Manage your subscription, update payment method, or download invoices.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current plan summary */}
        <div className="flex items-center justify-between p-3 rounded-md border border-white/10 bg-white/[0.02]">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Current plan</p>
            <p className="text-base font-bold mt-0.5">{TIER_LABEL[tier]}</p>
            {tier !== 'free' && (
              <p className="text-xs text-muted-foreground mt-0.5">
                ${monthlyPrice.toFixed(2)}/mo · {monthlyTokens} tokens/month
              </p>
            )}
          </div>
          {tier === 'free' && (
            <Link
              href="/onboarding/subscribe"
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-[#4ade80] text-[#052e16] hover:bg-[#22c55e] transition-colors"
            >
              Upgrade
            </Link>
          )}
        </div>

        {/* Manage subscription via Stripe Portal */}
        {hasBillingHistory ? (
          <div className="space-y-2">
            <Button
              onClick={openPortal}
              disabled={loading}
              variant="outline"
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                Manage subscription
              </span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Button>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Opens Stripe&apos;s secure billing portal where you can cancel, switch tiers, update your card, or download invoices.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            You haven&apos;t made any purchases yet. Subscribe to a paid plan or buy a token pack to unlock the billing portal.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
