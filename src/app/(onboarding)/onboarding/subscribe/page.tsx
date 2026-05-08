'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Trophy, Brain, BarChart3, Mail, Sparkles, MessageSquareQuote } from 'lucide-react'

const FEATURES = [
  { icon: Trophy, text: 'AI-powered Top 40 school matching tailored to your profile' },
  { icon: BarChart3, text: 'Full recruiting dashboard, kanban board, offer tracker' },
  { icon: Sparkles, text: '30 monthly AI tokens included (refresh each billing cycle)' },
  { icon: Brain, text: 'AI email drafting (1 token / draft)' },
  { icon: MessageSquareQuote, text: 'Coach email analyzer + single-school fit assessments' },
  { icon: Mail, text: 'Communications log, follow-up reminders, parent read-only link' },
]

export default function SubscribePage() {
  // useSearchParams() requires a Suspense boundary in Next.js 15. Without it,
  // the page can hang during initial hydration on production builds.
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubscribeContent />
    </Suspense>
  )
}

function LoadingFallback() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function SubscribeContent() {
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

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <p className="fuse-label">Early Adopter Pricing</p>
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
          <div className="flex items-end justify-center gap-2">
            <span className="text-4xl font-black">$14.99</span>
            <span className="text-muted-foreground text-sm mb-1">/month</span>
            <span className="text-muted-foreground/60 line-through text-sm mb-1">$29</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Locked in until you cancel · cancel anytime</p>
        </div>

        <div className="px-6 py-5 space-y-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#4ADE80] flex-shrink-0 mt-0.5" />
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
            className="w-full flex items-center justify-center gap-2 py-3 rounded-md bg-[#4ADE80] text-[#0F1120] font-bold text-sm hover:bg-[#22C55E] disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to checkout…
              </>
            ) : (
              'Get Started — $14.99/mo'
            )}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Secure payment via Stripe. No hidden fees. Price increases to $29/mo for new signups after launch — subscribe now to keep $14.99 for life.
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
        <div className="w-16 h-16 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/30 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-[#4ADE80]" />
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
