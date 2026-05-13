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
            empty ? 'bg-red-500/10 border-red-500/30' : 'bg-[#4ADE80]/10 border-[#4ADE80]/20'
          }`}
        >
          <TokenBalance showLabel />
        </div>

        <button
          onClick={() => setOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            empty
              ? 'bg-red-500 hover:bg-red-400 text-white'
              : 'bg-amber-500 hover:bg-amber-400 text-[#1a0f00]'
          }`}
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
