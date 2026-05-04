'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
})
type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Supabase puts the recovery token in the URL hash; the client SDK
  // exchanges it automatically on load and fires onAuthStateChange with
  // event === 'PASSWORD_RECOVERY'.
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true)
    })
    // Also check if there's already an active session from the hash exchange
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password: data.password })
    setLoading(false)
    if (err) {
      setError('Could not update your password. The link may have expired — please request a new one.')
      return
    }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  if (done) {
    return (
      <Card className="bg-[#1A1F38] border-white/10 text-white">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Password updated!</h2>
            <p className="text-green-200 text-sm mt-1">Redirecting you to the dashboard…</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!sessionReady) {
    return (
      <Card className="bg-[#1A1F38] border-white/10 text-white">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <p className="text-green-200 text-sm">Verifying your reset link…</p>
          <Link href="/forgot-password" className="inline-flex items-center gap-1 text-sm text-green-300 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Request a new link
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1A1F38] border-white/10 text-white">
      <CardHeader>
        <CardTitle className="text-xl">Set a new password</CardTitle>
        <CardDescription className="text-green-200">
          Choose a strong password for your account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-green-100">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-green-400"
              {...register('password')}
            />
            {errors.password && <p className="text-red-300 text-xs">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="text-green-100">Confirm Password</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-green-400"
              {...register('confirm')}
            />
            {errors.confirm && <p className="text-red-300 text-xs">{errors.confirm.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full bg-[#4ADE80] hover:bg-[#22C55E] text-green-950 font-semibold"
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Update Password'}
          </Button>
          <Link href="/login" className="flex items-center gap-1 text-sm text-green-300 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
