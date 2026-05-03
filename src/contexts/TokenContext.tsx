'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface TokenContextValue {
  /** Monthly subscription allowance — refreshed each billing cycle. */
  allowance: number
  /** Tokens purchased via packs — never expire. */
  pack: number
  /** Total displayed balance (allowance + pack). */
  tokens: number
  /** Replace the entire balance — use when re-syncing from server. */
  setBalance: (allowance: number, pack: number) => void
  /** Optimistic client-side decrement after a successful API call.
   *  Drains allowance first, then pack — mirrors the server's consume_tokens RPC. */
  spend: (amount: number) => void
}

const TokenContext = createContext<TokenContextValue | null>(null)

export function TokenProvider({
  initialAllowance,
  initialPack,
  children,
}: {
  initialAllowance: number
  initialPack: number
  children: React.ReactNode
}) {
  const [allowance, setAllowance] = useState(initialAllowance)
  const [pack, setPack] = useState(initialPack)

  const setBalance = useCallback((a: number, p: number) => {
    setAllowance(Math.max(0, a))
    setPack(Math.max(0, p))
  }, [])

  const spend = useCallback((amount: number) => {
    if (amount <= 0) return
    setAllowance((prevA) => {
      const fromAllowance = Math.min(prevA, amount)
      const fromPack = amount - fromAllowance
      if (fromPack > 0) {
        setPack((prevP) => Math.max(0, prevP - fromPack))
      }
      return prevA - fromAllowance
    })
  }, [])

  return (
    <TokenContext.Provider value={{ allowance, pack, tokens: allowance + pack, setBalance, spend }}>
      {children}
    </TokenContext.Provider>
  )
}

export function useTokens(): TokenContextValue {
  const ctx = useContext(TokenContext)
  if (!ctx) throw new Error('useTokens must be used inside <TokenProvider>')
  return ctx
}
