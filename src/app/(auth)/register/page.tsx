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
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((d) => {
  const age = ageInYears(d.date_of_birth)
  return age !== null && age >= 13
}, {
  message: 'You must be at least 13 years old to use FuseID',
  path: ['date_of_birth'],
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'player' },
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

    // Persist DOB to profiles (and run the server-side COPPA check). We only
    // do this when we have a real session — if signUp returned no session
    // (email-confirmation enabled), the user isn't authenticated yet, so we
    // pass the DOB through user metadata above and the auth callback /
    // server route will pick it up on first login.
    if (signUpData.session) {
      try {
        const res = await fetch('/api/auth/register-extras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date_of_birth: data.date_of_birth }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          setError(json.error ?? 'Could not complete registration.')
          // Sign the half-registered user back out so they don't get stuck
          // in a logged-in-but-not-onboarded state.
          await supabase.auth.signOut()
          setLoading(false)
          return
        }
      } catch {
        // Network failure — leave the user signed in; profile will be
        // backfilled on next login via the auth callback.
      }
    }

    // If Supabase has email confirmation enabled, signUpData.session is null
    // and the user needs to click the link in their inbox before being signed
    // in. Show a "check your inbox" screen instead of redirecting them to a
    // gated page that bounces back to /login.
    if (!signUpData.session) {
      setSubmittedEmail(data.email)
      setLoading(false)
      return
    }

    // No email confirmation — user is logged in already. Use a full navigation
    // so the auth cookie is included on the next request (router.push() races
    // the cookie write and causes a blank first paint).
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
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-green-100">Email</Label>
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
            <p className="text-green-200/60 text-xs">FuseID is for athletes 13 and older.</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full bg-[#4ADE80] hover:bg-[#22C55E] text-green-950 font-semibold"
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
