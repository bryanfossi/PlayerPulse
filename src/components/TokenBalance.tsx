'use client'

import { useRef, useState, useEffect } from 'react'
import { Coins } from 'lucide-react'
import { useTokens } from '@/contexts/TokenContext'

interface Props {
  showLabel?: boolean
}

export function TokenBalance({ showLabel }: Props) {
  const { tokens, allowance, pack } = useTokens()
  const prevRef = useRef(tokens)
  const [bumped, setBumped] = useState(false)

  useEffect(() => {
    if (tokens !== prevRef.current) {
      setBumped(true)
      const id = setTimeout(() => setBumped(false), 600)
      prevRef.current = tokens
      return () => clearTimeout(id)
    }
  }, [tokens])

  const color = tokens === 0 ? '#E05555' : tokens < 5 ? '#E09A1A' : '#C9A227'

  const tooltip =
    tokens === 0
      ? 'No tokens remaining'
      : `${tokens} tokens (${allowance} from monthly allowance · ${pack} from packs)`

  return (
    <span
      className={`inline-flex items-center gap-1 transition-transform duration-150 ${bumped ? 'scale-125' : 'scale-100'}`}
      title={tooltip}
    >
      <Coins className="w-4 h-4 flex-shrink-0" style={{ color }} />
      <span className="font-bold text-sm tabular-nums" style={{ color }}>{tokens}</span>
      {showLabel && (
        <span className="text-xs" style={{ color: `${color}99` }}>
          {tokens === 0 ? 'no tokens' : `token${tokens !== 1 ? 's' : ''}`}
        </span>
      )}
    </span>
  )
}
