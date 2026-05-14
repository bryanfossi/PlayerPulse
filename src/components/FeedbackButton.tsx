'use client'

import { useState, useTransition } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, Loader2, Send, X, CheckCircle2, Bug, Lightbulb, HelpCircle, MoreHorizontal } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type FeedbackType = 'bug' | 'feature' | 'question' | 'other'

const TYPE_OPTIONS: { id: FeedbackType; label: string; icon: typeof Bug }[] = [
  { id: 'bug',      label: 'Bug',     icon: Bug },
  { id: 'feature',  label: 'Feature', icon: Lightbulb },
  { id: 'question', label: 'Question', icon: HelpCircle },
  { id: 'other',    label: 'Other',   icon: MoreHorizontal },
]

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('other')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [pending, startTransition] = useTransition()
  const pathname = usePathname()

  function handleSubmit() {
    const trimmed = message.trim()
    if (!trimmed) return
    if (trimmed.length > 5000) {
      toast.error('Message is too long (max 5000 characters)')
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            type,
            page_url: typeof window !== 'undefined'
              ? window.location.origin + pathname
              : pathname,
          }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          toast.error(json.error ?? 'Could not send feedback. Please try again.')
          return
        }
        setSent(true)
      } catch {
        toast.error('Network error — could not send feedback.')
      }
    })
  }

  function handleClose() {
    setOpen(false)
    // Small delay so the user sees the success state before reset
    setTimeout(() => {
      setType('other')
      setMessage('')
      setSent(false)
    }, 300)
  }

  return (
    <>
      {/* Floating button — bottom-right, above the mobile bottom nav */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed z-40 right-5 bottom-20 md:bottom-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-transform hover:scale-105 active:translate-y-px"
        style={{
          backgroundColor: '#4ADE80',
          color: '#0F1120',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" style={{ color: '#4ADE80' }} />
              Send Feedback
            </DialogTitle>
            <DialogDescription className="text-xs" style={{ color: '#9CA3AF' }}>
              Bug reports, ideas, complaints — all welcome. Goes directly to Bryan.
            </DialogDescription>
          </DialogHeader>

          {sent ? (
            <div className="py-6 flex flex-col items-center gap-3 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(74,222,128,0.15)', border: '1px solid #4ADE80' }}
              >
                <CheckCircle2 className="w-6 h-6" style={{ color: '#4ADE80' }} />
              </div>
              <div>
                <p className="font-semibold">Thanks — your feedback was sent.</p>
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                  Bryan will read every one personally.
                </p>
              </div>
              <Button onClick={handleClose} variant="outline" size="sm" className="mt-2 gap-1.5">
                <X className="w-3.5 h-3.5" />
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#9CA3AF' }}>
                  Type
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const active = type === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setType(opt.id)}
                        className={`flex flex-col items-center gap-1 px-2 py-2 rounded-md border text-[11px] font-medium transition-colors ${
                          active
                            ? 'bg-[#4ADE80]/15 border-[#4ADE80] text-[#4ADE80]'
                            : 'bg-white/[0.02] border-white/10 text-muted-foreground hover:text-white hover:border-white/20'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <Textarea
                autoFocus
                placeholder={
                  type === 'bug'
                    ? "What's broken? Steps to reproduce help a lot."
                    : type === 'feature'
                    ? "What would make FuseID better for you?"
                    : type === 'question'
                    ? "What are you trying to figure out?"
                    : "What's on your mind?"
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={5000}
                className="resize-y"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px]" style={{ color: '#9CA3AF' }}>
                  {message.length} / 5000
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleClose} disabled={pending}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={pending || !message.trim()}
                    className="gap-1.5"
                    style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
                  >
                    {pending ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="w-3.5 h-3.5" /> Send</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
