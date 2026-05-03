'use client'

import { useState } from 'react'
import { RefreshCw, Zap, AlertTriangle, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useTokens } from '@/contexts/TokenContext'
import { TOKEN_COSTS } from '@/lib/tokens/costs'

interface Props {
  onRerun: () => void
  isLoading: boolean
}

export function RerunButton({ onRerun, isLoading }: Props) {
  const { tokens: tokenBalance } = useTokens()
  const cost = TOKEN_COSTS.FULL_MATCH_RERUN
  const canAfford = tokenBalance >= cost
  const [open, setOpen] = useState(false)
  const [buyLoading, setBuyLoading] = useState(false)

  async function handleBuyTokens() {
    setBuyLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tokens' }),
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
      setBuyLoading(false)
    }
  }

  function handleConfirm() {
    setOpen(false)
    onRerun()
  }

  if (!canAfford) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400 font-medium">
          <Zap className="w-3.5 h-3.5" />
          Need {cost} tokens (you have {tokenBalance})
        </div>
        <Button
          size="sm"
          onClick={handleBuyTokens}
          disabled={buyLoading}
          className="gap-1.5 bg-amber-500 hover:bg-amber-400 text-[#1a0f00] font-semibold"
        >
          {buyLoading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Plus className="w-3.5 h-3.5" />
          }
          {buyLoading ? 'Opening…' : 'Buy Tokens'}
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
        disabled={isLoading}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Generating...' : `Regenerate My List (uses ${cost} tokens)`}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Confirm Regeneration
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This will update your scored school list based on your current profile. Manually added schools will be kept.
            </p>
            <p className="text-sm font-semibold text-amber-400">
              This uses {cost} tokens. You have {tokenBalance} remaining.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleConfirm}>Confirm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
