'use client'

import { useState, useTransition } from 'react'
import { UserPlus, Copy, CheckCheck, Send, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Invite {
  email: string
  token: string
  accepted: boolean
  expires_at: string
}

interface Props {
  existingInvites: Invite[]
}

export function ParentInviteWidget({ existingInvites }: Props) {
  const [invites, setInvites] = useState<Invite[]>(existingInvites)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  const inviteUrl = (token: string) =>
    `${window.location.origin}/invite/accept?token=${token}`

  function handleSend() {
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address')
      return
    }
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to create invite'); return }
      const newInvite: Invite = {
        email: email.trim().toLowerCase(),
        token: json.token,
        accepted: false,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
      setInvites((prev) => [newInvite, ...prev.filter((i) => i.email !== newInvite.email)])
      setSent(json.token)
      setEmail('')
    })
  }

  async function handleCopy(token: string) {
    try {
      await navigator.clipboard.writeText(inviteUrl(token))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access denied or unavailable — silently ignore
    }
  }

  const activeInvite = invites[0]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          Parent Access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeInvite && activeInvite.accepted ? (
          <div className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-3 py-2">
            <p className="text-xs font-medium text-green-700 dark:text-green-400">Parent access granted</p>
            <p className="text-xs text-muted-foreground mt-0.5">{activeInvite.email}</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Invite a parent or guardian to view your recruiting board (read-only).
            </p>

            {/* Show link if just sent */}
            {sent && (
              <div className="rounded-md bg-muted/50 border border-border p-3 space-y-2">
                <p className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Send className="w-3 h-3" /> Invite created
                </p>
                <p className="text-xs text-muted-foreground">Share this link with {invites[0]?.email}:</p>
                <div className="flex items-center gap-2">
                  <code className="text-[10px] bg-background border border-border rounded px-2 py-1 flex-1 truncate">
                    {inviteUrl(sent)}
                  </code>
                  <button onClick={() => handleCopy(sent)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                    {copied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Existing pending invites */}
            {invites.filter((i) => !i.accepted && i.token !== sent).map((inv) => (
              <div key={inv.token} className="rounded-md bg-muted/30 border border-border px-3 py-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium">{inv.email}</p>
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                </div>
                <button onClick={() => handleCopy(inv.token)} className="text-muted-foreground hover:text-foreground transition-colors">
                  {copied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <ExternalLink className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}

            {/* Email input */}
            <div className="space-y-1.5">
              <Label htmlFor="parent-email" className="text-xs">Parent email</Label>
              <div className="flex gap-2">
                <Input
                  id="parent-email"
                  type="email"
                  placeholder="parent@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="h-8 text-sm flex-1"
                />
                <Button size="sm" onClick={handleSend} disabled={pending} className="h-8 px-3">
                  {pending ? '...' : 'Send'}
                </Button>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
