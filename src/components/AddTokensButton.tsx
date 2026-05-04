'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { TokenBalance } from '@/components/TokenBalance'
import { useTokens } from '@/contexts/TokenContext'
import { TOKEN_GRANTS } from '@/lib/tokens/costs'

export function AddTokensButton() {
  const { tokens } = useTokens()
  const [loading, setLoading] = useState(false)
  const empty = tokens === 0

  async function handleClick() {
    setLoading(true)
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
      toast.error('Network error. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
        empty ? 'bg-red-500/10 border-red-500/30' : 'bg-[#4ADE80]/10 border-[#4ADE80]/20'
      }`}>
        <TokenBalance showLabel />
      </div>

      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${
          empty
            ? 'bg-red-500 hover:bg-red-400 text-white'
            : 'bg-amber-500 hover:bg-amber-400 text-[#1a0f00]'
        }`}
      >
        {loading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Plus className="w-3.5 h-3.5" />
        }
        {loading ? 'Opening…' : empty ? `Buy ${TOKEN_GRANTS.PACK_PURCHASE} tokens` : `+${TOKEN_GRANTS.PACK_PURCHASE} tokens`}
      </button>
    </div>
  )
}
