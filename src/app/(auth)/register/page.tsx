'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

function ageInYears(dob: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob)
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getUTCFullYear() - d.getUTCFullYear()
  const beforeBirthday =
    now.getUTCMonth() < d.getUTCMonth() ||
    (now.getUTCMonth() === d.getUTCMonth() && now.getUTCDate() < d.getUTCDate())
  if (beforeBirthday) age -= 1
  return age
}

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['player', 'parent']),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  // Only required when role === 'parent' — see refinement below.
  player_email: z.string().optional(),
  terms_accepted: z.boolean(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((d) => {
  const age = ageInYears(d.date_of_birth)
  return age !== null && age >= 13
}, {
  message: 'You must be at least 13 years old to use FUSE-ID',
  path: ['date_of_birth'],
}).refine((d) => d.terms_accepted === true, {
  message: 'You must accept the Terms of Service and Privacy Policy to continue',
  path: ['terms_accepted'],
}).refine((d) => {
  if (d.role !== 'parent') return true
  const e = d.player_email?.trim()
  if (!e) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}, {
  message: "Enter your athlete's email so they can join the shared account",
  path: ['player_email'],
}).refine((d) => {
  if (d.role !== 'parent') return true
  return d.player_email?.trim().toLowerCase() !== d.email.trim().toLowerCase()
}, {
  message: "Athlete email must be different from your own",
  path: ['player_email'],
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'player', terms_accepted: false },
  })

  const role = watch('role')

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { role: data.role, date_of_birth: data.date_of_birth },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          data.role === 'player' ? '/onboarding' : '/dashboard',
        )}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Persist DOB + terms acceptance + (if parent) co-owner invite to the
    // player. We only do this when we have a real session — if signUp
    // returned no session (email-confirmation enabled), the user isn't
    // authenticated yet, so we pass everything through user metadata above
    // and the auth callback / server route will pick it up on first login.
    if (signUpData.session) {
      try {
        const res = await fetch('/api/auth/register-extras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date_of_birth: data.date_of_birth,
            terms_accepted: data.terms_accepted,
            player_email: data.role === 'parent' ? data.player_email?.trim() : undefined,
          }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          setError(json.error ?? 'Could not complete registration.')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }
      } catch {
        // Network failure — leave the user signed in; profile will be
        // backfilled on next login via the auth callback.
      }
    }

    if (!signUpData.session) {
      setSubmittedEmail(data.email)
      setLoading(false)
      return
    }

    window.location.href = data.role === 'player' ? '/onboarding' : '/dashboard'
  }

  if (submittedEmail) {
    return (
      <Card className="bg-[#1A1F38] border-white/10 text-white">
        <CardHeader>
          <CardTitle className="text-xl">Check your inbox</CardTitle>
          <CardDescription className="text-green-200">
            We sent a confirmation link to <strong>{submittedEmail}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-green-100">
          <p>Click the link in that email to verify your address and start onboarding.</p>
          <p className="text-green-200 text-xs">
            Didn&apos;t get it? Check spam, or try again with a different email.
          </p>
        </CardContent>
        <CardFooter>
          <Link
            href="/login"
            className="text-green-300 hover:text-white underline text-sm"
          >
            Already confirmed? Sign in
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1A1F38] border-white/10 text-white">
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription className="text-green-200">Start managing your college recruiting</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* Role selector */}
          <div className="space-y-2">
            <Label className="text-green-100">I am a…</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['player', 'parent'] as const).map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-center gap-2 p-3 rounded-md border cursor-pointer transition-colors ${
                    role === r
                      ? 'bg-green-500/30 border-green-400 text-white'
                      : 'bg-white/5 border-white/20 text-green-200 hover:bg-white/10'
                  }`}
                >
                  <input type="radio" value={r} {...register('role')} className="sr-only" />
                  <span className="capitalize font-medium text-sm">{r}</span>
                </label>
              ))}
            </div>
            {role === 'parent' && (
              <p className="text-green-200/60 text-xs">
                You&apos;ll create a shared account. We&apos;ll email your athlete a link to join — you can both log in and edit.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-green-100">
              {role === 'parent' ? 'Your email' : 'Email'}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-green-400"
              {...register('email')}
            />
            {errors.email && <p className="text-red-300 text-xs">{errors.email.message}</p>}
          </div>

          {role === 'parent' && (
            <div className="space-y-1.5">
              <Label htmlFor="player_email" className="text-green-100">Athlete&apos;s email</Label>
              <Input
                id="player_email"
                type="email"
                placeholder="athlete@example.com"
                autoComplete="off"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-green-400"
                {...register('player_email')}
              />
              {errors.player_email && <p className="text-red-300 text-xs">{errors.player_email.message}</p>}
              <p className="text-green-200/60 text-xs">
                We&apos;ll send a link they can use to set their own password and access this account.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-green-100">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-green-400"
              {...register('password')}
            />
            {errors.password && <p className="text-red-300 text-xs">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-green-100">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-green-400"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <p className="text-red-300 text-xs">{errors.confirmPassword.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date_of_birth" className="text-green-100">Date of birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-green-400"
              {...register('date_of_birth')}
            />
            {errors.date_of_birth && <p className="text-red-300 text-xs">{errors.date_of_birth.message}</p>}
            <p className="text-green-200/60 text-xs">FUSE-ID is for athletes 13 and older.</p>
          </div>

          {/* Terms + Privacy acceptance */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('terms_accepted')}
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
            {errors.terms_accepted && <p className="text-red-300 text-xs">{errors.terms_accepted.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full bg-[#4ADE80] hover:bg-[#22C55E] text-green-950 font-medium"
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
          <p className="text-green-200 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-green-300 hover:text-white underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
