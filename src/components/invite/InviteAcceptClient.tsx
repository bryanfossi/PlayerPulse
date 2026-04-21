'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  token: string
  inviteEmail: string
  playerName: string
}

async function acceptInvite(token: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/invites/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  const json = await res.json()
  if (!res.ok) return { ok: false, error: json.error ?? 'Failed to accept invite' }
  return { ok: true }
}

export function InviteAcceptClient({ token, inviteEmail, playerName }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'choose' | 'register' | 'login' | 'verify' | 'done'>('choose')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleRegister() {
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setError('')
    startTransition(async () => {
      const supabase = createClient()
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: inviteEmail,
        password,
        options: { data: { role: 'parent' } },
      })
      if (signUpErr) { setError(signUpErr.message); return }

      // If email confirmation is required, session will be null
      if (!signUpData.session) {
        setMode('verify')
        return
      }

      const result = await acceptInvite(token)
      if (!result.ok) { setError(result.error ?? 'Accept failed'); return }
      setMode('done')
    })
  }

  function handleLogin() {
    if (!password) { setError('Enter your password'); return }
    setError('')
    startTransition(async () => {
      const supabase = createClient()
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: inviteEmail,
        password,
      })
      if (signInErr) { setError(signInErr.message); return }

      const result = await acceptInvite(token)
      if (!result.ok) { setError(result.error ?? 'Accept failed'); return }
      setMode('done')
    })
  }

  if (mode === 'done') {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-xl font-bold">You&apos;re in!</h1>
        <p className="text-sm text-muted-foreground">
          You now have parent access to {playerName}&apos;s recruiting board.
        </p>
        <Button className="w-full" onClick={() => router.push('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    )
  }

  if (mode === 'choose') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Parent Invite</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {playerName} has invited you to view their college recruiting board.
          </p>
        </div>
        <div className="rounded-md bg-muted/50 border border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Invite sent to</p>
          <p className="text-sm font-medium mt-0.5">{inviteEmail}</p>
        </div>
        <div className="space-y-3">
          <Button className="w-full" onClick={() => { setMode('register'); setError('') }}>
            Create a new account
          </Button>
          <Button variant="outline" className="w-full" onClick={() => { setMode('login'); setError('') }}>
            I already have an account
          </Button>
        </div>
      </div>
    )
  }

  if (mode === 'verify') {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-xl font-bold">Check your inbox</h1>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation email to <strong>{inviteEmail}</strong>.
          Verify your email, then return to this invite link to complete setup.
        </p>
      </div>
    )
  }

  if (mode === 'register') {
    return (
      <div className="space-y-5">
        <div>
          <button
            onClick={() => { setMode('choose'); setError('') }}
            className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Your email is pre-filled from the invite.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Email</Label>
          <Input value={inviteEmail} disabled className="bg-muted text-muted-foreground" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw" className="text-xs">Password</Label>
          <Input
            id="pw"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cpw" className="text-xs">Confirm Password</Label>
          <Input
            id="cpw"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button className="w-full" onClick={handleRegister} disabled={pending}>
          {pending ? 'Creating account…' : 'Create Account & Accept Invite'}
        </Button>
      </div>
    )
  }

  // login mode
  return (
    <div className="space-y-5">
      <div>
        <button
          onClick={() => { setMode('choose'); setError('') }}
          className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold">Sign In</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in to accept the invite.</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Email</Label>
        <Input value={inviteEmail} disabled className="bg-muted text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lpw" className="text-xs">Password</Label>
        <Input
          id="lpw"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button className="w-full" onClick={handleLogin} disabled={pending}>
        {pending ? 'Signing in…' : 'Sign In & Accept Invite'}
      </Button>
    </div>
  )
}
