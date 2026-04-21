'use client'

import { useState, useTransition } from 'react'
import { Zap, Loader2, AlertCircle, CheckCircle2, XCircle, ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  schoolId: string
  schoolName: string
}

interface Analysis {
  signal_level: 'Strong Interest' | 'Soft Interest' | 'Form Response' | 'Neutral' | 'Declining'
  signal_explanation: string
  recommended_action: string
  suggested_timeline: string
  red_flags: string[]
  positive_signals: string[]
}

// Maps to CoachReplyAnalyzer's AnalysisResult shape for backward compat
interface LegacyAnalysis {
  interest_level: 'High' | 'Medium' | 'Low' | 'Unclear'
  interest_explanation: string
  tone_label: string
  tone_explanation: string
  key_signals: string[]
  next_step: string
  next_step_urgency: 'High' | 'Medium' | 'Low'
}

const SIGNAL_CONFIG = {
  'Strong Interest': { bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-400', badge: 'bg-green-500/10 text-green-400 border-green-500/20' },
  'Soft Interest': { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'Form Response': { bg: 'bg-zinc-500/10 border-zinc-500/20', text: 'text-zinc-400', badge: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  'Neutral': { bg: 'bg-zinc-500/10 border-zinc-500/20', text: 'text-zinc-400', badge: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  'Declining': { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

function mapLegacyToAnalysis(legacy: LegacyAnalysis): Analysis {
  const interestMap: Record<string, Analysis['signal_level']> = {
    High: 'Strong Interest', Medium: 'Soft Interest', Low: 'Form Response', Unclear: 'Neutral',
  }
  return {
    signal_level: interestMap[legacy.interest_level] ?? 'Neutral',
    signal_explanation: legacy.interest_explanation,
    recommended_action: legacy.next_step,
    suggested_timeline: `${legacy.next_step_urgency} urgency`,
    red_flags: [],
    positive_signals: legacy.key_signals ?? [],
  }
}

export function ReplyAnalyzer({ schoolId, schoolName }: Props) {
  const [emailBody, setEmailBody] = useState('')
  const [coachName, setCoachName] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleAnalyze() {
    if (!emailBody.trim()) return
    setError('')
    setAnalysis(null)
    startTransition(async () => {
      // Try the existing analyze-reply endpoint (which uses player_school_id)
      // We'll find the player_school_id from school_id via the contacts endpoint doesn't exist
      // so we use player_school_id = school_id fallback or a lookup
      const res = await fetch('/api/ai/analyze-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_school_id: schoolId,
          coach_message: emailBody.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Analysis failed')
        return
      }
      // Handle both response shapes
      if ('signal_level' in json) {
        setAnalysis(json as Analysis)
      } else {
        setAnalysis(mapLegacyToAnalysis(json as LegacyAnalysis))
      }
    })
  }

  const cfg = analysis ? (SIGNAL_CONFIG[analysis.signal_level] ?? SIGNAL_CONFIG.Neutral) : null

  return (
    <div className="space-y-4">
      {!analysis && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="reply-coach-name" className="text-xs">Coach Name (optional)</Label>
            <Input
              id="reply-coach-name"
              placeholder="Coach Smith"
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reply-email-body" className="text-xs">Paste the coach&apos;s email *</Label>
            <Textarea
              id="reply-email-body"
              placeholder="Paste the coach's message here..."
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={6}
              className="resize-none font-mono text-sm"
              disabled={pending}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <Button
            onClick={handleAnalyze}
            disabled={pending || !emailBody.trim()}
            className="w-full gap-2"
          >
            {pending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Zap className="w-4 h-4" /> Analyze This Reply</>
            )}
          </Button>
        </div>
      )}

      {analysis && cfg && (
        <div className="space-y-4">
          {/* Signal badge */}
          <div className={cn('rounded-xl border p-4', cfg.bg)}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              {schoolName} · Coach Signal
            </p>
            <Badge variant="outline" className={cn('text-sm font-bold px-3 py-1 mb-3', cfg.badge)}>
              {analysis.signal_level}
            </Badge>
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.signal_explanation}</p>
          </div>

          {/* Recommended action */}
          <div className="rounded-xl border border-border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recommended Action</p>
            </div>
            <p className="text-sm font-medium">{analysis.recommended_action}</p>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Suggested Timeline</p>
            </div>
            <p className="text-sm text-muted-foreground">{analysis.suggested_timeline}</p>
          </div>

          {/* Positive signals */}
          {analysis.positive_signals.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-green-400">Positive Signals</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.positive_signals.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Red flags */}
          {analysis.red_flags.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Red Flags</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.red_flags.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full">
                    <XCircle className="w-3 h-3" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button variant="ghost" size="sm" onClick={() => { setAnalysis(null); setEmailBody('') }} className="text-xs text-muted-foreground">
            Analyze another reply
          </Button>
        </div>
      )}
    </div>
  )
}
