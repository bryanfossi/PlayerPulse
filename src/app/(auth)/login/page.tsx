'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Respect ?redirectTo= if the middleware sent the user here from a
    // gated page. Allowlist same-origin paths only to prevent open redirect.
    const redirectToParam = searchParams.get('redirectTo')
    const redirectTo =
      redirectToParam && redirectToParam.startsWith('/') && !redirectToParam.startsWith('//')
        ? redirectToParam
        : '/dashboard'

    // Use a full browser navigation rather than router.push() — this guarantees
    // the auth cookie set by signInWithPassword is included in the next request.
    // router.push() races the cookie write and causes a blank first paint.
    window.location.href = redirectTo
  }

  return (
    <Card className="bg-[#1A1F38] border-white/10 text-white">
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription className="text-green-200">Sign in to your recruiting account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm rounded-md px-3 py-2">
              {error}
            </div>
          )}
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-green-100">Password</Label>
              <Link href="/forgot-password" className="text-xs text-green-300 hover:text-white transition-colors">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-green-400"
              {...register('password')}
            />
            {errors.password && <p className="text-red-300 text-xs">{errors.password.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full bg-[#4ADE80] hover:bg-[#22C55E] text-green-950 font-semibold"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
          <p className="text-green-200 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-green-300 hover:text-white underline">
              Create one
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
