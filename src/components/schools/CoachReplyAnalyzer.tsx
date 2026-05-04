'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageSquareQuote, Loader2, Zap, AlertCircle,
  CheckCircle2, ArrowRight, Radio, Sparkles,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { AnalysisResult } from '@/app/api/ai/analyze-reply/route'

interface Props {
  psId: string
  schoolName: string
}

// ─── visual config ────────────────────────────────────────────────────────────

const INTEREST_CONFIG = {
  High: {
    gradient: 'border-[#4ADE80] bg-[#4ADE80]/10',
    glow: '',
    badge: 'bg-[#4ADE80]/20 text-[#4ADE80]',
    bars: 4,
  },
  Medium: {
    gradient: 'border-amber-400 bg-amber-400/10',
    glow: '',
    badge: 'bg-amber-400/20 text-amber-400',
    bars: 2,
  },
  Low: {
    gradient: 'border-red-500 bg-red-500/10',
    glow: '',
    badge: 'bg-red-500/20 text-red-400',
    bars: 1,
  },
  Unclear: {
    gradient: 'border-white/15 bg-white/5',
    glow: '',
    badge: 'bg-white/10 text-white/70',
    bars: 0,
  },
}

const URGENCY_CONFIG = {
  High: { bg: 'bg-red-100 dark:bg-red-950/50', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500', border: 'border-l-red-500' },
  Medium: { bg: 'bg-amber-100 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', border: 'border-l-amber-500' },
  Low: { bg: 'bg-green-100 dark:bg-green-950/50', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500', border: 'border-l-green-500' },
}

// ─── subcomponents ────────────────────────────────────────────────────────────

function SignalBars({ level, bars }: { level: string; bars: number }) {
  return (
    <div className="flex items-end gap-0.5">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className={cn(
            'w-1.5 rounded-sm transition-all',
            n <= bars ? 'bg-white' : 'bg-white/25',
          )}
          style={{ height: `${6 + n * 4}px` }}
        />
      ))}
    </div>
  )
}

function InterestBanner({ result }: { result: AnalysisResult }) {
  const cfg = INTEREST_CONFIG[result.interest_level] ?? INTEREST_CONFIG.Unclear
  return (
    <div className={cn(
      'rounded-xl border p-5',
      cfg.gradient,
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Coach Interest Level</p>
          <p className="text-white text-4xl font-black tracking-tight leading-none">{result.interest_level}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SignalBars level={result.interest_level} bars={cfg.bars} />
          <Radio className="w-5 h-5 text-white/60" />
        </div>
      </div>
      <p className="mt-3 text-white/90 text-sm leading-relaxed">{result.interest_explanation}</p>
    </div>
  )
}

function ToneCard({ result }: { result: AnalysisResult }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="bg-muted/50 px-4 py-2.5 flex items-center gap-2 border-b border-border">
        <MessageSquareQuote className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tone</span>
      </div>
      <div className="px-4 py-3 flex items-center gap-3">
        <span className="flex-1 text-sm font-semibold">{result.tone_label}</span>
      </div>
      <div className="px-4 pb-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{result.tone_explanation}</p>
      </div>
    </div>
  )
}

function SignalsCard({ signals }: { signals: string[] }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="bg-muted/50 px-4 py-2.5 flex items-center gap-2 border-b border-border">
        <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Key Signals</span>
        <span className="ml-auto text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">{signals.length} found</span>
      </div>
      <div className="divide-y divide-border">
        {signals.map((signal, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <div className={cn(
              'mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold',
              i === 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
            )}>
              {i + 1}
            </div>
            <p className="text-sm leading-snug">{signal}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function NextStepCard({ result }: { result: AnalysisResult }) {
  const cfg = URGENCY_CONFIG[result.next_step_urgency] ?? URGENCY_CONFIG.Low
  return (
    <div className={cn('rounded-xl border-l-4 border border-border overflow-hidden', cfg.border)}>
      <div className="bg-muted/50 px-4 py-2.5 flex items-center gap-2 border-b border-border">
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recommended Next Step</span>
        <span className={cn('ml-auto flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full', cfg.bg, cfg.text)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
          {result.next_step_urgency} urgency
        </span>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm leading-relaxed font-medium">{result.next_step}</p>
      </div>
    </div>
  )
}

// ─── loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="rounded-xl h-32 bg-muted" />
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="h-10 bg-muted" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-3 bg-muted rounded w-full" />
        </div>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="h-10 bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-t border-border">
            <div className="w-5 h-5 rounded-full bg-muted flex-shrink-0" />
            <div className="h-3 bg-muted rounded flex-1" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border overflow-hidden border-l-4 border-l-muted">
        <div className="h-10 bg-muted" />
        <div className="p-4 space-y-2">
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
      </div>
    </div>
  )
}

// ─── main components ──────────────────────────────────────────────────────────

export function CoachReplyAnalyzerButton({ psId, schoolName }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <MessageSquareQuote className="w-4 h-4" />
        Analyze Coach Reply
      </Button>
      <CoachReplyAnalyzerModal open={open} onClose={() => setOpen(false)} psId={psId} schoolName={schoolName} />
    </>
  )
}

function CoachReplyAnalyzerModal({
  open, onClose, psId, schoolName,
}: {
  open: boolean
  onClose: () => void
  psId: string
  schoolName: string
}) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const [logged, setLogged] = useState(false)
  const [logging, startLogging] = useTransition()

  function handleAnalyze() {
    if (!message.trim()) return
    setError('')
    setResult(null)
    startTransition(async () => {
      const res = await fetch('/api/ai/analyze-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_school_id: psId, coach_message: message }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Analysis failed'); return }
      setResult(json as AnalysisResult)
    })
  }

  function handleLogContact() {
    if (!result) return
    startLogging(async () => {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_school_id: psId,
          contact_type: 'email_received',
          direction: 'inbound',
          contact_date: new Date().toISOString().slice(0, 10),
          notes: `Coach Reply Analysis — Interest: ${result.interest_level}. ${result.interest_explanation}`,
          email_body: message,
        }),
      })
      if (res.ok) { setLogged(true); router.refresh() }
    })
  }

  function handleClose() {
    setMessage(''); setResult(null); setError(''); setLogged(false); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            Analyze Coach Reply
            <span className="text-muted-foreground font-normal text-sm ml-1">· {schoolName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Input panel — stays visible while pending so user can see their text */}
          {!result && (
            <div className="space-y-3">
              <Textarea
                placeholder="Paste the coach's message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={7}
                className="resize-none text-sm font-mono leading-relaxed"
                disabled={pending}
              />
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <Button onClick={handleAnalyze} disabled={pending || !message.trim()} className="w-full gap-2">
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Reading between the lines...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Analyze Message
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Loading skeleton */}
          {pending && <LoadingSkeleton />}

          {/* Results */}
          {result && !pending && (
            <div className="space-y-3">
              <InterestBanner result={result} />
              <ToneCard result={result} />
              <SignalsCard signals={result.key_signals} />
              <NextStepCard result={result} />

              {/* Action row */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button onClick={() => router.push(`/ai/draft?ps=${psId}&type=follow_up`)} className="gap-2 flex-1">
                  <MessageSquareQuote className="w-4 h-4" />
                  Draft a Reply
                </Button>

                {logged ? (
                  <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 px-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Logged
                  </span>
                ) : (
                  <Button variant="outline" onClick={handleLogContact} disabled={logging} className="gap-2">
                    {logging ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Log as Email
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setResult(null); setLogged(false) }}
                  className="text-muted-foreground text-xs"
                >
                  Try another
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
