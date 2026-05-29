'use client'

import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'

interface Props {
  sport: string
  source?: string
}

export function WaitlistForm({ sport, source }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sport, source }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setErrorMsg(body?.error ?? 'Something went wrong')
        setStatus('error')
        return
      }
      setStatus('success')
    } catch {
      setErrorMsg('Network error — try again')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div
        className="rounded-xl border p-6 flex items-start gap-3 max-w-xl mx-auto"
        style={{ borderColor: '#4ADE80', backgroundColor: '#1A1F38' }}
      >
        <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#4ADE80' }} />
        <div>
          <p className="font-bold">You&apos;re on the list.</p>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
            We&apos;ll email <span className="text-white">{email}</span> the moment {sport}{' '}
            recruiting goes live on FUSE-ID.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading'}
          className="flex-1 px-4 py-3 rounded-md border text-base outline-none focus:border-white/30 transition-colors"
          style={{
            borderColor: 'rgba(255,255,255,0.15)',
            backgroundColor: '#1A1F38',
            color: '#FFFFFF',
          }}
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-bold text-base transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
        >
          {status === 'loading' ? 'Joining…' : 'Join the waitlist'}
          {status !== 'loading' && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
      {status === 'error' && errorMsg && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {errorMsg}
        </p>
      )}
      <p className="mt-3 text-xs text-center" style={{ color: '#9CA3AF' }}>
        We&apos;ll only email you about the {sport} launch. No spam.
      </p>
    </form>
  )
}
