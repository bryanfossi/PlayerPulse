'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { TokenBalance } from '@/components/TokenBalance'
import { UpgradeModal } from '@/components/UpgradeModal'
import { useTokens } from '@/contexts/TokenContext'

export function AddTokensButton() {
  const { tokens } = useTokens()
  const [open, setOpen] = useState(false)
  const empty = tokens === 0

  return (
    <>
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
            empty ? 'bg-red-500/10 border-red-500/30' : 'bg-[#4ade80]/10 border-[#4ade80]/20'
          }`}
        >
          <TokenBalance showLabel />
        </div>

        <button
          onClick={() => setOpen(true)}
          className={
            empty
              ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#ef4444] hover:bg-[#dc2626] text-white'
              : 'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80]/10'
          }
        >
          <Plus className="w-3.5 h-3.5" />
          {empty ? 'Get tokens' : 'Buy more'}
        </button>
      </div>

      <UpgradeModal
        open={open}
        onOpenChange={setOpen}
        context={
          empty
            ? "You're out of tokens. Pick a pack or go unlimited with Pro."
            : 'Top up to keep going without limits.'
        }
      />
    </>
  )
}
