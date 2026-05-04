'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Trophy, Brain, BarChart3, Mail, Star } from 'lucide-react'

const FEATURES = [
  { icon: Trophy, text: 'Personalized Top 40 school list via AI Match Engine' },
  { icon: Brain, text: 'Smart email drafting for coach outreach' },
  { icon: BarChart3, text: 'Full recruiting dashboard & pipeline tracking' },
  { icon: Mail, text: 'Contact log & follow-up reminders' },
  { icon: Star, text: '3 Match Engine reruns included + add more anytime' },
]

export default function SubscribePage() {
  const searchParams = useSearchParams()
  const billingStatus = searchParams.get('billing')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscription', successPath: '/onboarding/subscribe' }),
      })
      const json = await res.json()
      if (!res.ok || !json.url) {
        setError(json.error ?? 'Failed to start checkout. Please try again.')
        return
      }
      window.location.href = json.url
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Returned from Stripe with billing=success — webhook may still be processing
  if (billingStatus === 'success') {
    return <ActivatingState />
  }

  if (billingStatus === 'canceled') {
    // Fall through to pricing page, but show a notice
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Start Your Recruiting Journey</h1>
        <p className="text-muted-foreground text-sm">
          One plan. Everything you need to find the right college program.
        </p>
      </div>

      {billingStatus === 'canceled' && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400 text-center">
          Payment was canceled. You can try again whenever you&apos;re ready.
        </div>
      )}

      {/* Pricing card */}
      <div className="rounded-xl border border-[#4ADE80]/40 bg-card overflow-hidden">
        <div className="bg-[#4ADE80]/10 border-b border-[#4ADE80]/20 px-6 py-5 text-center">
          <p className="fuse-label mb-1">FuseID Pro</p>
          <div className="flex items-end justify-center gap-1">
            <span className="text-4xl font-black">$29</span>
            <span className="text-muted-foreground text-sm mb-1">/month</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Cancel anytime</p>
        </div>

        <div className="px-6 py-5 space-y-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{text}</span>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6">
          {error && (
            <p className="text-sm text-destructive text-center mb-3">{error}</p>
          )}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#4ADE80] text-black font-bold text-sm hover:bg-[#4ADE80]/90 disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to checkout…
              </>
            ) : (
              'Get Started — $29/mo'
            )}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Secure payment via Stripe. No hidden fees.
      </p>
    </div>
  )
}

function ActivatingState() {
  const router = useRouter()

  useEffect(() => {
    // Set a 3-minute cookie so the onboarding layout allows through even if
    // the Stripe webhook hasn't fired yet
    document.cookie = 'payment_pending=1; max-age=180; path=/'

    // Auto-redirect after 3 seconds to give the webhook time to process
    const t = setTimeout(() => router.push('/onboarding'), 3000)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div className="text-center py-12 space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Payment Successful!</h2>
        <p className="text-muted-foreground text-sm">
          Activating your account&hellip; you&apos;ll be redirected in a moment.
        </p>
      </div>
      <div className="flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
      <button
        onClick={() => router.push('/onboarding')}
        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
      >
        Continue now
      </button>
    </div>
  )
}
