'use client'

import { useState } from 'react'
import { Zap, Plus } from 'lucide-react'

interface Props {
  tokens: number
}

export function AddTokensButton({ tokens }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tokens' }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <Zap className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-sm font-bold text-amber-400">{tokens}</span>
        <span className="text-xs text-amber-400/70">tokens</span>
      </div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-[#1a0f00] transition-colors disabled:opacity-60"
      >
        <Plus className="w-3.5 h-3.5" />
        {loading ? 'Loading…' : 'Add More Tokens'}
      </button>
    </div>
  )
}
