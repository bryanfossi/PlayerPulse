'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Sparkles, MessageSquareQuote, ArrowRight, Loader2, Plus,
  School as SchoolIcon, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SchoolOption {
  player_school_id: string
  school_name: string
  verified_division: string | null
}

interface AnalysisResult {
  interest_level: 'High' | 'Medium' | 'Low' | 'Unclear'
  interest_explanation: string
  tone_label: string
  tone_explanation: string
  key_signals: string[]
  next_step: string
  next_step_urgency: 'High' | 'Medium' | 'Low'
  created_player_school_id?: string | null
}

interface Props {
  schools: SchoolOption[]
}

const INTEREST_BORDER: Record<AnalysisResult['interest_level'], string> = {
  High: '#4ADE80',
  Medium: '#FBBF24',
  Low: '#F87171',
  Unclear: 'rgba(255,255,255,0.15)',
}
const INTEREST_BG: Record<AnalysisResult['interest_level'], string> = {
  High: 'rgba(74,222,128,0.08)',
  Medium: 'rgba(251,191,36,0.08)',
  Low: 'rgba(248,113,113,0.08)',
  Unclear: 'rgba(255,255,255,0.04)',
}
const URGENCY_BG: Record<AnalysisResult['next_step_urgency'], string> = {
  High: 'rgba(248,113,113,0.12)',
  Medium: 'rgba(251,191,36,0.12)',
  Low: 'rgba(74,222,128,0.12)',
}
const URGENCY_TEXT: Record<AnalysisResult['next_step_urgency'], string> = {
  High: '#F87171',
  Medium: '#FBBF24',
  Low: '#4ADE80',
}

const DIVISIONS = ['D1', 'D2', 'D3', 'NAIA', 'JUCO']

type Mode = 'existing' | 'new'

export function CoachAnalyzerClient({ schools }: Props) {
  const [mode, setMode] = useState<Mode>(schools.length > 0 ? 'existing' : 'new')
  const [psId, setPsId] = useState('')
  const [newSchoolName, setNewSchoolName] = useState('')
  const [newDivision, setNewDivision] = useState<string>('')
  const [saveToList, setSaveToList] = useState(true)
  const [coachMessage, setCoachMessage] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [analyzing, startAnalyzing] = useTransition()

  function handleAnalyze() {
    setError('')
    setResult(null)

    // Validate based on mode
    if (mode === 'existing' && !psId) {
      setError('Pick a school from your list')
      return
    }
    if (mode === 'new' && !newSchoolName.trim()) {
      setError('Enter the school name')
      return
    }
    if (!coachMessage.trim()) {
      setError('Paste the coach\'s email')
      return
    }

    startAnalyzing(async () => {
      try {
        const body =
          mode === 'existing'
            ? { player_school_id: psId, coach_message: coachMessage }
            : {
                school_name: newSchoolName.trim(),
                verified_division: newDivision || null,
                save_to_list: saveToList,
                coach_message: coachMessage,
              }

        const res = await fetch('/api/ai/analyze-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? 'Analysis failed. Please try again.')
          return
        }
        setResult(json as AnalysisResult)
        if (mode === 'new' && saveToList && json.created_player_school_id) {
          toast.success(`${newSchoolName.trim()} added to your schools list`)
        }
      } catch {
        setError('Network error — could not analyze.')
      }
    })
  }

  function handleStartOver() {
    setResult(null)
    setError('')
    setCoachMessage('')
    if (mode === 'new') {
      setNewSchoolName('')
      setNewDivision('')
    }
  }

  // Derive school name for the result header
  const schoolNameForResult =
    mode === 'existing'
      ? schools.find((s) => s.player_school_id === psId)?.school_name
      : newSchoolName.trim()

  return (
    <div className="space-y-6">
      {/* ── Form ── */}
      {!result && (
        <Card>
          <CardContent className="pt-5 space-y-5">
            {/* Mode toggle */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: '#9CA3AF' }}>
                Which school is the email from?
              </Label>
              <div className="mt-2 inline-flex rounded-md border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <button
                  type="button"
                  onClick={() => setMode('existing')}
                  disabled={schools.length === 0}
                  className={cn(
                    'px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                    mode === 'existing' ? 'bg-[#4ADE80] text-[#0F1120]' : 'hover:bg-white/5 text-muted-foreground',
                  )}
                >
                  <SchoolIcon className="inline w-3.5 h-3.5 mr-1.5" />
                  From My Schools
                </button>
                <button
                  type="button"
                  onClick={() => setMode('new')}
                  className={cn(
                    'px-4 py-1.5 text-xs font-semibold transition-colors border-l',
                    mode === 'new' ? 'bg-[#4ADE80] text-[#0F1120]' : 'hover:bg-white/5 text-muted-foreground',
                  )}
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  <Plus className="inline w-3.5 h-3.5 mr-1.5" />
                  Add New School
                </button>
              </div>
            </div>

            {/* Existing school picker */}
            {mode === 'existing' && (
              <div className="space-y-1.5">
                <Label htmlFor="school-select">School *</Label>
                {schools.length === 0 ? (
                  <p className="text-sm" style={{ color: '#9CA3AF' }}>
                    You don&apos;t have any schools on your list yet.{' '}
                    <button
                      type="button"
                      onClick={() => setMode('new')}
                      className="underline"
                      style={{ color: '#4ADE80' }}
                    >
                      Add a new school instead
                    </button>
                  </p>
                ) : (
                  <Select value={psId} onValueChange={setPsId}>
                    <SelectTrigger id="school-select">
                      <SelectValue placeholder="Choose a school…" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => (
                        <SelectItem key={s.player_school_id} value={s.player_school_id}>
                          {s.school_name}
                          {s.verified_division && (
                            <span className="text-muted-foreground ml-1 text-[10px]">
                              ({s.verified_division})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* New school form */}
            {mode === 'new' && (
              <div className="space-y-4 rounded-lg border px-4 py-4" style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="new-school-name">School Name *</Label>
                    <Input
                      id="new-school-name"
                      placeholder="e.g. Wake Forest University"
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                      maxLength={120}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-division">
                      Division <span className="text-muted-foreground text-xs">(optional)</span>
                    </Label>
                    <Select value={newDivision} onValueChange={(v) => setNewDivision(v === '__none__' ? '' : v)}>
                      <SelectTrigger id="new-division">
                        <SelectValue placeholder="Unknown" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Unknown</SelectItem>
                        {DIVISIONS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Save to list toggle */}
                <div className="rounded-md border p-3 flex items-start gap-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Add this school to My Schools?</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                      We&apos;ll save it to your tracking board so you can log future contacts and analyze fit.
                    </p>
                  </div>
                  <div className="inline-flex rounded-md border overflow-hidden flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <button
                      type="button"
                      onClick={() => setSaveToList(true)}
                      className={cn(
                        'px-3 py-1 text-xs font-semibold transition-colors',
                        saveToList ? 'bg-[#4ADE80] text-[#0F1120]' : 'hover:bg-white/5 text-muted-foreground',
                      )}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaveToList(false)}
                      className={cn(
                        'px-3 py-1 text-xs font-semibold transition-colors border-l',
                        !saveToList ? 'bg-white text-[#0F1120]' : 'hover:bg-white/5 text-muted-foreground',
                      )}
                      style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Coach email */}
            <div className="space-y-1.5">
              <Label htmlFor="coach-message">Coach&apos;s email *</Label>
              <Textarea
                id="coach-message"
                placeholder="Paste the entire email here, including greeting and signature…"
                value={coachMessage}
                onChange={(e) => setCoachMessage(e.target.value)}
                rows={10}
                className="font-mono text-sm leading-relaxed resize-y"
              />
              <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                More context = better analysis. Include the full message including greetings.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border px-3 py-2" style={{ borderColor: '#F87171', backgroundColor: 'rgba(248,113,113,0.08)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#F87171' }} />
                <p className="text-sm" style={{ color: '#F87171' }}>{error}</p>
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              size="lg"
              className="w-full gap-2"
              style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Result ── */}
      {result && (
        <div className="space-y-4">
          {/* School + start over */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#9CA3AF' }}>
                Analysis for
              </p>
              <p className="text-lg font-bold mt-0.5">{schoolNameForResult}</p>
            </div>
            <div className="flex items-center gap-2">
              {result.created_player_school_id && (
                <Link
                  href={`/schools/${result.created_player_school_id}`}
                  className="text-xs font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors hover:bg-white/5"
                  style={{ borderColor: '#4ADE80', color: '#4ADE80' }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  View on My Schools
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={handleStartOver}>
                Analyze another
              </Button>
            </div>
          </div>

          {/* Interest banner */}
          <div
            className="rounded-xl border p-5"
            style={{
              borderColor: INTEREST_BORDER[result.interest_level],
              backgroundColor: INTEREST_BG[result.interest_level],
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: INTEREST_BORDER[result.interest_level] }}>
                  Coach interest level
                </p>
                <p className="text-3xl md:text-4xl font-black tracking-tight mt-1" style={{ color: INTEREST_BORDER[result.interest_level] }}>
                  {result.interest_level}
                </p>
              </div>
              <SignalBars level={result.interest_level} />
            </div>
            <p className="text-sm leading-relaxed mt-3" style={{ color: '#FFFFFF' }}>
              {result.interest_explanation}
            </p>
          </div>

          {/* Tone */}
          <div className="rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <MessageSquareQuote className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#9CA3AF' }}>
                Tone
              </span>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm font-semibold">{result.tone_label}</p>
              <p className="text-sm leading-relaxed mt-1" style={{ color: '#9CA3AF' }}>
                {result.tone_explanation}
              </p>
            </div>
          </div>

          {/* Key signals */}
          <div className="rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#9CA3AF' }}>
                Key signals
              </span>
              <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF' }}>
                {result.key_signals.length} found
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {result.key_signals.map((signal, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className={cn(
                      'mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold',
                    )}
                    style={{
                      backgroundColor: i === 0 ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
                      color: i === 0 ? '#4ADE80' : '#9CA3AF',
                    }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-sm leading-snug">{signal}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Next step */}
          <div
            className="rounded-xl border-l-2 border"
            style={{
              borderLeftColor: URGENCY_TEXT[result.next_step_urgency],
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <ArrowRight className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#9CA3AF' }}>
                Recommended next step
              </span>
              <span
                className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={{ backgroundColor: URGENCY_BG[result.next_step_urgency], color: URGENCY_TEXT[result.next_step_urgency] }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: URGENCY_TEXT[result.next_step_urgency] }} />
                {result.next_step_urgency} urgency
              </span>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm leading-relaxed font-medium">{result.next_step}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SignalBars({ level }: { level: AnalysisResult['interest_level'] }) {
  const filled = level === 'High' ? 4 : level === 'Medium' ? 3 : level === 'Low' ? 1 : 0
  return (
    <div className="flex items-end gap-1">
      {[1, 2, 3, 4].map((i) => {
        const isOn = i <= filled
        const heights = [10, 14, 18, 22]
        return (
          <div
            key={i}
            className="w-1.5 rounded-sm"
            style={{
              height: heights[i - 1],
              backgroundColor: isOn ? INTEREST_BORDER[level] : 'rgba(255,255,255,0.1)',
            }}
          />
        )
      })}
    </div>
  )
}
