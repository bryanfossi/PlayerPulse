'use client'

import { useState } from 'react'
import { Zap, Crown, ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Props {
  rerunTokens: number
  emailDraftsRemaining: number
  subscriptionActive: boolean
}

export function TokenBalance({ rerunTokens, emailDraftsRemaining, subscriptionActive }: Props) {
  const [loading, setLoading] = useState<'subscription' | 'tokens' | null>(null)

  async function handleCheckout(type: 'subscription' | 'tokens') {
    setLoading(type)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      }
    } catch {
      // silently fail — user stays on page
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-2xl border border-[#C9A227]/20 bg-[#1A3A5C]/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-[#C9A227]/10 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-[#C9A227]" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Token Balance</p>
        {subscriptionActive && (
          <Crown className="w-3.5 h-3.5 text-[#C9A227] ml-auto" />
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Match Engine reruns</span>
          <Badge
            variant="outline"
            className={`text-[10px] font-bold ${rerunTokens > 0 ? 'border-[#C9A227]/40 text-[#C9A227]' : 'border-red-500/40 text-red-400'}`}
          >
            {rerunTokens} remaining
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Email drafts this month</span>
          <Badge
            variant="outline"
            className={`text-[10px] font-bold ${emailDraftsRemaining > 0 ? 'border-green-500/40 text-green-400' : 'border-red-500/40 text-red-400'}`}
          >
            {emailDraftsRemaining} remaining
          </Badge>
        </div>
      </div>

      {subscriptionActive ? (
        (rerunTokens === 0 || emailDraftsRemaining === 0) && (
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5 border-[#C9A227]/30 text-[#C9A227] hover:bg-[#C9A227]/10 text-xs"
            onClick={() => handleCheckout('tokens')}
            disabled={loading === 'tokens'}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {loading === 'tokens' ? 'Loading...' : 'Buy 3 more tokens — $2.99'}
          </Button>
        )
      ) : (
        <Button
          size="sm"
          className="w-full gap-1.5 bg-[#C9A227] hover:bg-[#d4ac2e] text-[#1A3A5C] font-bold text-xs"
          onClick={() => handleCheckout('subscription')}
          disabled={loading === 'subscription'}
        >
          <Crown className="w-3.5 h-3.5" />
          {loading === 'subscription' ? 'Loading...' : 'Subscribe for $15/month'}
        </Button>
      )}
    </div>
  )
}
