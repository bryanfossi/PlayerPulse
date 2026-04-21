'use client'

import { useState } from 'react'
import { RefreshCw, Zap, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  rerunTokens: number
  onRerun: () => void
  isLoading: boolean
}

export function RerunButton({ rerunTokens, onRerun, isLoading }: Props) {
  const [open, setOpen] = useState(false)

  function handleConfirm() {
    setOpen(false)
    onRerun()
  }

  if (rerunTokens <= 0) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5 text-muted-foreground">
        <Zap className="w-3.5 h-3.5" />
        No tokens remaining
      </Button>
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
        {isLoading ? 'Generating...' : `Regenerate My List (uses 1 token)`}
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
              This uses 1 rerun token. You have {rerunTokens} remaining.
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
