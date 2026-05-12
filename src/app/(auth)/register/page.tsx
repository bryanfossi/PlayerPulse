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

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['player', 'parent']),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
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
        data: { role: data.role },
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
