'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizard } from '@/hooks/useWizard'

const MESSAGES = [
  'Searching 1,000+ programs across all divisions…',
  'Calculating athletic fit scores…',
  'Evaluating academic compatibility…',
  'Assessing playing time opportunities…',
  'Analyzing merit aid potential…',
  'Ranking your personalized Top 40…',
]

const MESSAGE_INTERVAL_MS = 7000

export function StepGenerating() {
  const router = useRouter()
  const { data, update, clear } = useWizard()
  const [messageIndex, setMessageIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const hasRun = useRef(false)

  async function run() {
    setError(null)

    // Step 1: Upsert the player record
    const setupRes = await fetch('/api/player/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!setupRes.ok) {
      const body = await setupRes.json().catch(() => ({}))
      setError(body.error ?? 'Failed to save your profile. Please try again.')
      return
    }
    const { player_id } = await setupRes.json()
    update({ player_id })

    // Step 2: Run the Match Engine
    const meRes = await fetch('/api/ai/match-engine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id }),
    })
    if (!meRes.ok) {
      const body = await meRes.json().catch(() => ({}))
      setError(body.error ?? 'The Match Engine encountered an error. Please try again.')
      return
    }

    // Success — clear wizard state and go to the results page
    clear()
    router.push('/onboarding/complete')
  }

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rotate loading messages
  useEffect(() => {
    if (error) return
    const interval = setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, MESSAGES.length - 1))
    }, MESSAGE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [error])

  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-4xl">⚠️</div>
        <p className="font-semibold text-lg">Something went wrong</p>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">{error}</p>
        <button
          onClick={() => {
            hasRun.current = false
            setRetrying(true)
            setMessageIndex(0)
            setError(null)
            run().finally(() => setRetrying(false))
          }}
          disabled={retrying}
          className="mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
        >
          {retrying ? 'Retrying…' : 'Try Again'}
        </button>
      </div>
    )
  }

  return (
    <div className="text-center py-12 space-y-8">
      {/* Animated soccer ball */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-foreground flex items-center justify-center animate-bounce">
            {/* suppressHydrationWarning: sport_id comes from localStorage, intentionally differs from SSR default */}
            <span className="text-4xl select-none" suppressHydrationWarning>
              {data.sport_id === 'volleyball' ? '🏐' : data.sport_id === 'basketball' ? '🏀' : data.sport_id === 'football' ? '🏈' : '⚽'}
            </span>
          </div>
          <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-primary animate-ping opacity-20" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-bold text-xl">Generating Your Top 40</p>
        <p className="text-muted-foreground text-sm h-5 transition-all duration-500">
          {MESSAGES[messageIndex]}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              i <= messageIndex ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <p className="text-muted-foreground text-xs">This takes 30–45 seconds. Please don&apos;t close this tab.</p>
    </div>
  )
}
