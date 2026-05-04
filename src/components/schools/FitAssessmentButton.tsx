'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTokens } from '@/contexts/TokenContext'
import { TOKEN_COSTS } from '@/lib/tokens/costs'

interface Props {
  schoolId: string
  schoolName: string
  hasExistingScores: boolean
}

export function FitAssessmentButton({ schoolId, schoolName, hasExistingScores }: Props) {
  const { tokens, spend } = useTokens()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const cost = TOKEN_COSTS.SCHOOL_FIT_ASSESSMENT
  const canAfford = tokens >= cost

  function handleConfirm() {
    setOpen(false)
    startTransition(async () => {
      try {
        const res = await fetch('/api/ai/rescore-school', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ school_id: schoolId }),
        })
        const json = await res.json()
        if (!res.ok) {
          if (json.error === 'NO_TOKENS') {
            toast.error(json.message ?? `Fit assessment costs ${cost} tokens. Purchase a pack to continue.`)
          } else if (json.error === 'AI_PARSE_ERROR') {
            toast.error('AI returned an unexpected response — your tokens were refunded. Please try again.')
          } else {
            toast.error(json.error ?? 'Failed to generate assessment. Please try again.')
          }
          return
        }
        spend(cost)
        toast.success(`Fit assessment generated for ${schoolName}. Refreshing…`)
        // Hard reload — router.refresh() doesn't reliably pick up server-side
        // Supabase reads in Next.js 15 because the data isn't a tracked fetch.
        setTimeout(() => window.location.reload(), 800)
      } catch {
        toast.error('Network error — could not generate assessment.')
      }
    })
  }

  const buttonLabel = hasExistingScores ? 'Re-score Fit' : 'Generate Fit Assessment'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={pending}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium hover:border-green-500/30 hover:text-green-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" />
            {buttonLabel}
            <span className="text-xs text-muted-foreground">({cost} tokens)</span>
          </>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-400" />
              {buttonLabel}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {hasExistingScores
                ? `Re-evaluate ${schoolName} against your current profile. Useful after updating your stats, GPA, or target divisions.`
                : `Generate an AI fit assessment for ${schoolName} — overall fit score, tier, playing time outlook, and merit aid potential.`}
            </p>
            {!canAfford ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  This costs {cost} tokens. You have {tokens}. Purchase a token pack to continue.
                </span>
              </div>
            ) : (
              <p className="text-sm font-semibold text-amber-400">
                This uses {cost} tokens. You have {tokens} remaining.
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleConfirm} disabled={!canAfford}>
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
