'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Zap, Check } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  TOKEN_PACKS,
  SUBSCRIPTION_TIERS,
  type TokenPackId,
  type SubscriptionTierId,
} from '@/lib/tokens/costs'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Optional context to render at the top — e.g. "This action costs 10 tokens." */
  context?: string
  /** Should the subscription upsell be shown? Hide it for users already on a paid tier. */
  showSubscriptionUpgrade?: boolean
}

const PACK_BENEFITS: Record<TokenPackId, string[]> = {
  mini:     ['Enough for ~5 AI emails', 'Tokens never expire'],
  standard: ['Most popular — enough for steady recruiting', 'Best $/token value below Max'],
  max:      ['Best $/token value', 'Same monthly bundle as Pro subscribers'],
}

const PACK_HIGHLIGHT: TokenPackId = 'standard'

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function UpgradeModal({
  open,
  onOpenChange,
  context,
  showSubscriptionUpgrade = true,
}: Props) {
  const [loadingPack, setLoadingPack] = useState<TokenPackId | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionTierId | null>(null)
  const busy = loadingPack !== null || loadingPlan !== null

  async function handleBuyPack(pack: TokenPackId) {
    setLoadingPack(pack)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tokens', pack }),
      })
      const json = await res.json()
      if (!res.ok || !json.url) {
        toast.error(json.error ?? 'Could not open checkout. Please try again.')
        return
      }
      window.location.href = json.url
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoadingPack(null)
    }
  }

  async function handleSubscribe(plan: SubscriptionTierId) {
    setLoadingPlan(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscription', plan }),
      })
      const json = await res.json()
      if (!res.ok || !json.url) {
        toast.error(json.error ?? 'Could not open checkout. Please try again.')
        return
      }
      window.location.href = json.url
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#4ADE80]" />
            Get more tokens
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {context ?? 'Tokens unlock AI features — match list reruns, email drafts, fit assessments, coach analysis.'}
          </DialogDescription>
        </DialogHeader>

        {/* Token packs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {(Object.keys(TOKEN_PACKS) as TokenPackId[]).map((id) => {
            const pack = TOKEN_PACKS[id]
            const highlight = id === PACK_HIGHLIGHT
            const isLoading = loadingPack === id
            return (
              <div
                key={id}
                className={`relative rounded-lg border p-4 flex flex-col gap-3 ${
                  highlight
                    ? 'border-[#4ADE80]/50 bg-[#4ADE80]/5'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                {highlight && (
                  <span className="absolute -top-2 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#4ADE80] text-[#0F1120]">
                    Most popular
                  </span>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    {pack.label}
                  </p>
                  <p className="text-2xl font-black mt-0.5">
                    {pack.amount} <span className="text-sm font-normal text-muted-foreground">tokens</span>
                  </p>
                  <p className="text-lg font-bold text-[#4ADE80] mt-1">
                    {formatPrice(pack.priceCents)}
                  </p>
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground flex-1">
                  {PACK_BENEFITS[id].map((b) => (
                    <li key={b} className="flex items-start gap-1.5">
                      <Check className="w-3 h-3 text-[#4ADE80] flex-shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleBuyPack(id)}
                  disabled={busy}
                  size="sm"
                  className={`w-full ${
                    highlight
                      ? 'bg-[#4ADE80] hover:bg-[#22C55E] text-[#0F1120]'
                      : ''
                  }`}
                  variant={highlight ? 'default' : 'outline'}
                >
                  {isLoading
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Opening…</>
                    : `Buy ${pack.label}`}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Subscription upsell — Starter + Pro side-by-side */}
        {showSubscriptionUpgrade && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
            <p className="text-sm font-bold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Or get monthly tokens with a subscription
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(SUBSCRIPTION_TIERS) as SubscriptionTierId[]).map((id) => {
                const plan = SUBSCRIPTION_TIERS[id]
                const isLoading = loadingPlan === id
                return (
                  <Button
                    key={id}
                    onClick={() => handleSubscribe(id)}
                    disabled={busy}
                    size="sm"
                    variant="outline"
                    className="justify-between border-amber-500/30 hover:bg-amber-500/10 h-auto py-2.5"
                  >
                    <div className="flex flex-col items-start text-left">
                      <span className="text-xs font-bold text-amber-400">{plan.label}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {plan.monthlyTokens} tokens/mo
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {isLoading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : `$${(plan.priceCents / 100).toFixed(2)}/mo`}
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Secure payment via Stripe. Tokens are added instantly after payment confirms.
        </p>
      </DialogContent>
    </Dialog>
  )
}
