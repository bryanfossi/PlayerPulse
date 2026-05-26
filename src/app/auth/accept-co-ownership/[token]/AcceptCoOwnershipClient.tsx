'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface InviteInfo {
  invitee_email: string
  inviter_email: string | null
  invitee_role: 'player' | 'parent'
}

interface Props {
  token: string
}

type State =
  | { kind: 'loading' }
  | { kind: 'invalid'; reason: string }
  | { kind: 'ready'; info: InviteInfo }
  | { kind: 'submitting'; info: InviteInfo }
  | { kind: 'done'; email: string; hasPlayerRecord: boolean }

export function AcceptCoOwnershipClient({ token }: Props) {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [acceptTos, setAcceptTos] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/auth/accept-co-ownership/${token}`)
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setState({ kind: 'invalid', reason: json.error ?? 'Invite invalid' })
          return
        }
        setState({ kind: 'ready', info: json as InviteInfo })
      } catch {
        if (!cancelled) setState({ kind: 'invalid', reason: 'Could not load invite — check your connection.' })
      }
    })()
    return () => { cancelled = true }
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state.kind !== 'ready') return
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (!acceptTos) {
      setError('Please accept the Terms of Service and Privacy Policy')
      return
    }

    setState({ kind: 'submitting', info: state.info })
    try {
      const res = await fetch(`/api/auth/accept-co-ownership/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Could not complete signup')
        setState({ kind: 'ready', info: state.info })
        return
      }

      // Sign the new user in so the next navigation lands on a logged-in page.
      const supabase = createClient()
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: state.info.invitee_email,
        password,
      })
      if (signInErr) {
        // Account created but login failed — point them to /login.
        setError(`Account created. Please sign in: ${signInErr.message}`)
        setState({ kind: 'done', email: state.info.invitee_email, hasPlayerRecord: !!json.player_record_exists })
        return
      }
      setState({ kind: 'done', email: state.info.invitee_email, hasPlayerRecord: !!json.player_record_exists })
    } catch {
      setError('Network error — try again')
      setState({ kind: 'ready', info: state.info })
    }
  }

  if (state.kind === 'loading') {
    return (
      <Card className="w-full max-w-md bg-[#1A1F38] border-white/10 text-white">
        <CardContent className="pt-6 flex items-center justify-center gap-3 py-12">
          <Loader2 className="w-5 h-5 animate-spin text-[#4ade80]" />
          <span className="text-sm text-muted-foreground">Loading your invite…</span>
        </CardContent>
      </Card>
    )
  }

  if (state.kind === 'invalid') {
    return (
      <Card className="w-full max-w-md bg-[#1A1F38] border-white/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
            Invite unavailable
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>{state.reason}</p>
          <p>
            If you think this is a mistake, ask the person who invited you to send a fresh link.
          </p>
          <Link href="/login" className="text-[#4ade80] hover:underline text-sm inline-block">
            Already have an account? Sign in
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (state.kind === 'done') {
    return (
      <Card className="w-full max-w-md bg-[#1A1F38] border-white/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5 text-[#4ade80]" />
            You&apos;re in
          </CardTitle>
          <CardDescription className="text-green-200">
            Signed in as <strong>{state.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {state.hasPlayerRecord ? (
            <>
              <p className="text-muted-foreground">
                Your shared profile is ready. Both you and the person who invited you can log in and edit everything.
              </p>
              <Link
                href="/dashboard"
                className="inline-block w-full text-center px-4 py-2.5 rounded-md bg-[#4ade80] hover:bg-[#22c55e] text-[#052e16] font-medium transition-colors"
              >
                Go to dashboard
              </Link>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                Your account is created. The person who invited you hasn&apos;t finished the onboarding wizard yet — let&apos;s set up the profile now.
              </p>
              <Link
                href="/onboarding"
                className="inline-block w-full text-center px-4 py-2.5 rounded-md bg-[#4ade80] hover:bg-[#22c55e] text-[#052e16] font-medium transition-colors"
              >
                Start onboarding
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  const info = state.kind === 'ready' ? state.info : state.info
  const submitting = state.kind === 'submitting'

  return (
    <Card className="w-full max-w-md bg-[#1A1F38] border-white/10 text-white">
      <CardHeader>
        <CardTitle className="text-lg">Join the shared account</CardTitle>
        <CardDescription className="text-green-200">
          {info.inviter_email
            ? <><strong>{info.inviter_email}</strong> invited <strong>{info.invitee_email}</strong> to share a FUSE-ID account.</>
            : <>You were invited to share a FUSE-ID account as <strong>{info.invitee_email}</strong>.</>}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-green-100">Set a password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-green-400"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="text-green-100">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-green-400"
              required
            />
          </div>

          <div className="pt-2 border-t border-white/10">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTos}
                onChange={(e) => setAcceptTos(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/10 accent-[#4ade80]"
              />
              <span className="text-xs text-green-100 leading-relaxed">
                I&apos;ve read and agree to the{' '}
                <Link href="/terms" target="_blank" className="text-green-300 hover:text-white underline">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" target="_blank" className="text-green-300 hover:text-white underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>
        </CardContent>
        <div className="px-6 pb-6 flex flex-col gap-3">
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#4ADE80] hover:bg-[#22C55E] text-green-950 font-medium"
          >
            {submitting ? 'Creating account…' : 'Set password and join'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Already have a FUSE-ID account?{' '}
            <Link href="/login" className="text-[#4ade80] hover:underline">Sign in</Link>
          </p>
        </div>
      </form>
    </Card>
  )
}
