'use client'

import { useState, useTransition, useEffect } from 'react'
import { Mail, Sparkles, Save, Loader2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { toast } from 'sonner'
import { TokenBalance } from '@/components/TokenBalance'
import { useTokens } from '@/contexts/TokenContext'
import { TOKEN_COSTS } from '@/lib/tokens/costs'
import type { SchoolOption } from './ContactFormDialog'

interface Props {
  open: boolean
  onClose: () => void
  schools: SchoolOption[]
  defaultPsId?: string
}

function BuyMoreButton() {
  const [loading, setLoading] = useState(false)
  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tokens' }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
    } finally {
      setLoading(false)
    }
  }
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs font-semibold underline text-[#4ADE80] hover:text-[#22C55E] disabled:opacity-60"
    >
      {loading ? 'Opening…' : 'Buy More'}
    </button>
  )
}

export function DraftEmailModal({ open, onClose, schools, defaultPsId }: Props) {
  const { tokens, spend } = useTokens()
  const [psId, setPsId] = useState(defaultPsId ?? '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [generating, startGenerating] = useTransition()
  const [saving, startSaving] = useTransition()

  useEffect(() => {
    if (open) {
      setPsId(defaultPsId ?? '')
      setSubject('')
      setBody('')
      setIsDirty(false)
    }
  }, [open, defaultPsId])

  function handleClose() {
    if (isDirty && !confirm('Discard unsaved changes?')) return
    onClose()
  }

  function markDirty() {
    setIsDirty(true)
  }

  function handleGenerate() {
    if (!psId) { toast.error('Select a school first'); return }
    startGenerating(async () => {
      try {
        const res = await fetch('/api/ai/draft-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player_school_id: psId, draft_type: 'initial_outreach' }),
        })
        const json = await res.json()
        if (!res.ok) {
          if (json.error === 'NO_TOKENS') {
            toast.error(json.message ?? `Each draft costs ${TOKEN_COSTS.EMAIL_DRAFT} token. Purchase a pack to continue.`)
          } else {
            toast.error(json.error ?? 'Generation failed. Please try again.')
          }
          return
        }
        setSubject(json.subject ?? '')
        setBody(json.body ?? '')
        setIsDirty(true)
        spend(TOKEN_COSTS.EMAIL_DRAFT)
        toast.success('Draft generated!')
      } catch {
        toast.error('Network error — could not generate draft.')
      }
    })
  }

  function handleSaveDraft() {
    if (!psId) { toast.error('Select a school first'); return }
    if (!body.trim()) { toast.error('Add some body text before saving'); return }
    const school = schools.find((s) => s.player_school_id === psId)
    startSaving(async () => {
      try {
        const res = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player_school_id: psId,
            contact_type: 'email_sent',
            direction: 'outbound',
            contact_date: new Date().toISOString().slice(0, 10),
            subject: subject.trim() || '(Draft)',
            email_body: body,
          }),
        })
        if (!res.ok) {
          const json = await res.json()
          toast.error(json.error ?? 'Could not save draft')
          return
        }
        toast.success(`Draft saved for ${school?.school_name ?? 'school'}`)
        setIsDirty(false)
        onClose()
      } catch {
        toast.error('Network error — could not save draft.')
      }
    })
  }

  const selectedSchool = schools.find((s) => s.player_school_id === psId)
  const hasTokens = tokens > 0

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#4ADE80]" />
            Draft Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* To: school selector */}
          <div className="space-y-1.5">
            <Label>To (School)</Label>
            <Select value={psId} onValueChange={(v) => { setPsId(v); markDirty() }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a school..." />
              </SelectTrigger>
              <SelectContent>
                {schools.map((s) => (
                  <SelectItem key={s.player_school_id} value={s.player_school_id}>
                    <span>
                      {s.school_name}
                      {s.verified_division && (
                        <span className="text-muted-foreground ml-1 text-[10px]">
                          ({s.verified_division})
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSchool && (
              <p className="text-[11px] text-muted-foreground">
                {selectedSchool.school_name}
                {selectedSchool.verified_division && ` · ${selectedSchool.verified_division}`}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="draft-subject">Subject</Label>
            <Input
              id="draft-subject"
              placeholder="Email subject..."
              value={subject}
              onChange={(e) => { setSubject(e.target.value); markDirty() }}
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label htmlFor="draft-body">Body</Label>
            <Textarea
              id="draft-body"
              placeholder="Write your email here, or use Generate with AI below..."
              value={body}
              onChange={(e) => { setBody(e.target.value); markDirty() }}
              rows={8}
              className="resize-y font-mono text-sm leading-relaxed"
            />
          </div>

          {/* Token balance + AI generate */}
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Token balance</span>
              <TokenBalance showLabel />
            </div>

            {!hasTokens && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                No tokens remaining —{' '}
                <BuyMoreButton />
              </p>
            )}

            <Button
              onClick={handleGenerate}
              disabled={generating || !psId || !hasTokens}
              variant="outline"
              size="sm"
              className="w-full gap-2 border-[#4ADE80]/30 text-[#4ADE80] hover:bg-[#4ADE80]/10 disabled:opacity-50"
            >
              {generating ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> Generate with AI</>
              )}
            </Button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <Button
              onClick={handleSaveDraft}
              disabled={saving || !psId || !body.trim()}
              className="gap-2 bg-[#4ADE80] hover:bg-[#22C55E] text-[#0F1120] font-bold"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Draft</>
              )}
            </Button>
            <Button variant="outline" onClick={handleClose} className="gap-1.5">
              <X className="w-3.5 h-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
