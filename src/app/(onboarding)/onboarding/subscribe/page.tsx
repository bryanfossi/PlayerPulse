'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { SUBSCRIPTION_TIERS, type SubscriptionTierId } from '@/lib/tokens/costs'

interface PlanCard {
  id: SubscriptionTierId
  name: string
  priceCents: number
  tokens: number
  tagline: string
  features: string[]
  highlight: boolean
  ctaLabel: string
}

const PLANS: PlanCard[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceCents: SUBSCRIPTION_TIERS.starter.priceCents,
    tokens: SUBSCRIPTION_TIERS.starter.monthlyTokens,
    tagline: 'For athletes just starting their search',
    features: [
      `${SUBSCRIPTION_TIERS.starter.monthlyTokens} monthly AI tokens (auto-refresh)`,
      'AI-powered Top 40 school matching',
      'Full recruiting dashboard + kanban board',
      'AI email drafting (1 token / draft)',
      'Communications log + follow-up reminders',
    ],
    highlight: false,
    ctaLabel: 'Start with Starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    priceCents: SUBSCRIPTION_TIERS.pro.priceCents,
    tokens: SUBSCRIPTION_TIERS.pro.monthlyTokens,
    tagline: 'For athletes serious about recruiting',
    features: [
      `${SUBSCRIPTION_TIERS.pro.monthlyTokens} monthly AI tokens (auto-refresh)`,
      'Everything in Starter, plus:',
      'Coach email analyzer + sentiment scoring',
      'Single-school fit assessments',
      'Parent read-only link',
    ],
    highlight: true,
    ctaLabel: 'Start with Pro',
  },
]

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export default function SubscribePage() {
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

  const [loadingPlan, setLoadingPlan] = useState<SubscriptionTierId | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe(plan: SubscriptionTierId) {
    setLoadingPlan(plan)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          plan,
          successPath: '/onboarding/subscribe',
        }),
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
      setLoadingPlan(null)
    }
  }

  // Returned from Stripe with billing=success — webhook may still be processing
  if (billingStatus === 'success') {
    return <ActivatingState />
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <p className="fuse-label">Pick a plan</p>
        <h1 className="text-2xl font-bold tracking-tight">Start Your Recruiting Journey</h1>
        <p className="text-muted-foreground text-sm">
          Two plans. Both auto-refresh your AI tokens every month. Cancel anytime.
        </p>
      </div>

      {billingStatus === 'canceled' && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400 text-center">
          Payment was canceled. You can try again whenever you&apos;re ready.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 text-center">
          {error}
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLANS.map((plan) => {
          const loading = loadingPlan === plan.id
          return (
            <div
              key={plan.id}
              className={`rounded-xl border overflow-hidden flex flex-col ${
                plan.highlight
                  ? 'border-[#4ADE80]/50 bg-card'
                  : 'border-white/10 bg-card'
              }`}
            >
              <div
                className={`px-6 py-5 text-center border-b ${
                  plan.highlight
                    ? 'bg-[#4ADE80]/10 border-[#4ADE80]/20'
                    : 'bg-white/[0.02] border-white/10'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <p className="fuse-label">{plan.name}</p>
                  {plan.highlight && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#4ADE80] text-[#0F1120]">
                      Most popular
                    </span>
                  )}
                </div>
                <div className="flex items-end justify-center gap-2">
                  <span className="text-4xl font-black">{formatPrice(plan.priceCents)}</span>
                  <span className="text-muted-foreground text-sm mb-1">/month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{plan.tagline}</p>
              </div>

              <div className="px-6 py-5 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#4ADE80] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>

              <div className="px-6 pb-6">
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingPlan !== null}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-md font-bold text-sm transition-colors disabled:opacity-60 ${
                    plan.highlight
                      ? 'bg-[#4ADE80] text-[#0F1120] hover:bg-[#22C55E]'
                      : 'bg-white/10 text-white hover:bg-white/15 border border-white/15'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {plan.ctaLabel}
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Secure payment via Stripe. No hidden fees. Cancel anytime in one click.
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
