'use client'

import { useState } from 'react'
import { RefreshCw, Zap, AlertTriangle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { UpgradeModal } from '@/components/UpgradeModal'
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
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  function handleConfirm() {
    setOpen(false)
    onRerun()
  }

  if (!canAfford) {
    return (
      <>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400 font-medium">
            <Zap className="w-3.5 h-3.5" />
            Need {cost} tokens (you have {tokenBalance})
          </div>
          <Button
            size="sm"
            onClick={() => setUpgradeOpen(true)}
            className="gap-1.5 bg-amber-500 hover:bg-amber-400 text-[#1a0f00] font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Get Tokens
          </Button>
        </div>
        <UpgradeModal
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          context={`Regenerating your match list costs ${cost} tokens — you have ${tokenBalance}.`}
        />
      </>
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
