'use client'

import { useState, useTransition } from 'react'
import { Sparkles, RefreshCw, Send, Copy, CheckCheck, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { UpgradeModal } from '@/components/UpgradeModal'
import { cn } from '@/lib/utils'
import type { EmailDraftType, PlayerSchoolStatus } from '@/types/app'

export interface SchoolOption {
  player_school_id: string
  school_name: string
  verified_division: string | null
  city: string | null
  state: string | null
  tier: string | null
  status: PlayerSchoolStatus
}

interface Props {
  schools: SchoolOption[]
  preselectedPsId?: string
  preselectedType?: EmailDraftType
}

const DRAFT_TYPE_LABELS: Record<EmailDraftType, string> = {
  initial_outreach: 'Initial Outreach',
  follow_up: 'Follow-Up',
  thank_you: 'Thank You',
  campus_visit_request: 'Campus Visit Request',
  offer_response: 'Offer Response',
}

function BuyTokensButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-[#4ADE80] hover:bg-[#22C55E] text-[#0F1120] transition-colors"
      >
        Get Tokens
      </button>
      <UpgradeModal
        open={open}
        onOpenChange={setOpen}
        context="Email drafting uses 1 token. Top up to keep drafting."
      />
    </>
  )
}

const TIER_COLORS: Record<string, string> = {
  Lock: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  Realistic: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  Reach: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
}

type Step = 'form' | 'generating' | 'editing' | 'sent'

export function DraftEmailClient({ schools, preselectedPsId, preselectedType }: Props) {
  const [step, setStep] = useState<Step>('form')
  const [psId, setPsId] = useState(preselectedPsId ?? '')
  const [draftType, setDraftType] = useState<EmailDraftType>(preselectedType ?? 'initial_outreach')
  const [coachName, setCoachName] = useState('')
  const [coachEmail, setCoachEmail] = useState('')
  const [personalNote, setPersonalNote] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')

  const [draftId, setDraftId] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const [generating, startGenerating] = useTransition()
  const [logging, startLogging] = useTransition()

  const selectedSchool = schools.find((s) => s.player_school_id === psId)

  async function handleGenerate() {
    if (!psId || !draftType) {
      setError('Select a school and draft type')
      return
    }
    setError('')
    setStep('generating')

    startGenerating(async () => {
      const res = await fetch('/api/ai/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_school_id: psId,
          draft_type: draftType,
          coach_name: coachName || undefined,
          coach_email: coachEmail || undefined,
          personal_note: personalNote || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Generation failed')
        setStep('form')
        return
      }
      setDraftId(json.draft_id)
      setSubject(json.subject)
      setBody(json.body)
      setStep('editing')
    })
  }

  async function handleRegenerate() {
    setStep('generating')
    setError('')
    startGenerating(async () => {
      const res = await fetch('/api/ai/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_school_id: psId,
          draft_type: draftType,
          coach_name: coachName || undefined,
          coach_email: coachEmail || undefined,
          personal_note: personalNote || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Generation failed')
        setStep('editing')
        return
      }
      setDraftId(json.draft_id)
      setSubject(json.subject)
      setBody(json.body)
      setStep('editing')
    })
  }

  async function handleCopy() {
    const text = `Subject: ${subject}\n\n${body}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — select the textarea text so user can copy manually
      const el = document.getElementById('email-body') as HTMLTextAreaElement | null
      el?.select()
      setError('Auto-copy failed. The text is selected — press Ctrl+C (or ⌘C) to copy.')
    }
  }

  function handleLogAsSent() {
    if (!psId) return
    startLogging(async () => {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_school_id: psId,
          contact_type: 'email_sent',
          direction: 'outbound',
          contact_date: new Date().toISOString().slice(0, 10),
          subject,
          email_body: body,
          coach_name: coachName || undefined,
          coach_email: coachEmail || undefined,
          follow_up_date: followUpDate || undefined,
          draft_id: draftId,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Failed to log contact')
        return
      }
      setStep('sent')
    })
  }

  function handleStartNew() {
    setStep('form')
    setSubject('')
    setBody('')
    setDraftId(null)
    setError('')
    setPersonalNote('')
    setCoachName('')
    setCoachEmail('')
    setFollowUpDate('')
  }

  // ── Step: Sent confirmation ──────────────────────────────
  if (step === 'sent') {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mx-auto">
            <CheckCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Email Logged</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Contact record saved for <span className="font-medium">{selectedSchool?.school_name}</span>.
              {selectedSchool?.status === 'researching' && ' Status updated to Contacted.'}
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={handleStartNew}>
              Draft Another
            </Button>
            <Button asChild>
              <a href="/communications">View Contacts</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Step: Generating ────────────────────────────────────
  if (step === 'generating') {
    return (
      <Card>
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium">Drafting your email...</p>
            <p className="text-sm text-muted-foreground mt-1">Claude Sonnet is writing a personalized message</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Step: Editing ────────────────────────────────────────
  if (step === 'editing') {
    return (
      <div className="space-y-4">
        {/* School + type header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{selectedSchool?.school_name}</span>
            {selectedSchool?.verified_division && (
              <Badge variant="outline" className="text-[10px]">{selectedSchool.verified_division}</Badge>
            )}
            {selectedSchool?.tier && (
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', TIER_COLORS[selectedSchool.tier])}>
                {selectedSchool.tier}
              </span>
            )}
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-sm text-muted-foreground">{DRAFT_TYPE_LABELS[draftType]}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={generating} className="gap-1.5">
            <RefreshCw className={cn('w-3.5 h-3.5', generating && 'animate-spin')} />
            Regenerate
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Card>
          <CardContent className="pt-4 space-y-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <Label htmlFor="email-body">Body</Label>
              <Textarea
                id="email-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={14}
                className="font-mono text-sm leading-relaxed resize-y"
              />
            </div>
          </CardContent>
        </Card>

        {/* Log as sent options */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Log as Sent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="log-coach-name">Coach Name</Label>
                <Input
                  id="log-coach-name"
                  placeholder="Coach Smith"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="log-followup">Follow-Up Date</Label>
                <Input
                  id="log-followup"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button onClick={handleLogAsSent} disabled={logging || !subject || !body} className="gap-1.5">
                <Send className="w-4 h-4" />
                {logging ? 'Logging...' : 'Log as Sent'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Email'}
              </Button>
              <button
                onClick={handleStartNew}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto"
              >
                Start over
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Step: Form ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      {error && (
        error === 'NO_TOKENS'
          ? (
            <div className="flex items-start gap-3 rounded-lg border px-4 py-3" style={{ borderColor: '#4ADE80', backgroundColor: 'rgba(74, 222, 128, 0.08)' }}>
              <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#4ADE80' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: '#4ADE80' }}>Out of tokens</p>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                  Each email draft costs 1 token. Buy a 30-token pack to keep drafting.
                </p>
              </div>
              <BuyTokensButton />
            </div>
          )
          : <p className="text-sm text-destructive">{error}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Email Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* School */}
          <div className="space-y-1.5">
            <Label htmlFor="school-select">School *</Label>
            <Select value={psId} onValueChange={setPsId}>
              <SelectTrigger id="school-select">
                <SelectValue placeholder="Choose a school..." />
              </SelectTrigger>
              <SelectContent>
                {schools.map((s) => (
                  <SelectItem key={s.player_school_id} value={s.player_school_id}>
                    <span className="flex items-center gap-2">
                      {s.school_name}
                      {s.verified_division && (
                        <span className="text-[10px] text-muted-foreground">({s.verified_division})</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Draft type */}
          <div className="space-y-1.5">
            <Label htmlFor="draft-type">Email Type *</Label>
            <Select value={draftType} onValueChange={(v) => setDraftType(v as EmailDraftType)}>
              <SelectTrigger id="draft-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(DRAFT_TYPE_LABELS) as EmailDraftType[]).map((t) => (
                  <SelectItem key={t} value={t}>{DRAFT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Coach info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="coach-name">Coach Name <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="coach-name"
                placeholder="Coach Johnson"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coach-email">Coach Email <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="coach-email"
                type="email"
                placeholder="coach@school.edu"
                value={coachEmail}
                onChange={(e) => setCoachEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Personal note */}
          <div className="space-y-1.5">
            <Label htmlFor="personal-note">
              Additional Context <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="personal-note"
              placeholder="e.g. I attended their ID camp last summer, I play in the same region, specific things I liked about their program..."
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected school preview */}
      {selectedSchool && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
          Generating a personalized{' '}
          <span className="font-medium text-foreground">{DRAFT_TYPE_LABELS[draftType].toLowerCase()}</span>{' '}
          email for{' '}
          <span className="font-medium text-foreground">{selectedSchool.school_name}</span>
          {selectedSchool.tier && (
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', TIER_COLORS[selectedSchool.tier])}>
              {selectedSchool.tier}
            </span>
          )}
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={!psId || generating}
        className="gap-2"
        size="lg"
      >
        <Sparkles className="w-4 h-4" />
        Generate Draft
      </Button>
    </div>
  )
}
