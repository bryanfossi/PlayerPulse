'use client'

import { useState } from 'react'
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
  email: z.string().email('Enter a valid email address'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) {
      setError('Something went wrong. Please check the email address and try again.')
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <Card className="bg-[#1A1F38] border-white/10 text-white">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Check your email</h2>
            <p className="text-green-200 text-sm mt-1">
              We sent a password reset link to{' '}
              <span className="font-medium text-white">{getValues('email')}</span>.
            </p>
            <p className="text-green-300/70 text-xs mt-2">
              Didn&apos;t get it? Check your spam folder, or{' '}
              <button
                onClick={() => { setSent(false) }}
                className="text-green-300 hover:text-white underline"
              >
                try again
              </button>
              .
            </p>
          </div>
          <Link href="/login" className="inline-flex items-center gap-1 text-sm text-green-300 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1A1F38] border-white/10 text-white">
      <CardHeader>
        <CardTitle className="text-xl">Forgot your password?</CardTitle>
        <CardDescription className="text-green-200">
          Enter your email and we&apos;ll send you a reset link.
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
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full bg-[#4ADE80] hover:bg-[#22C55E] text-green-950 font-semibold"
            disabled={loading}
          >
            {loading ? 'Sending…' : 'Send Reset Link'}
          </Button>
          <Link href="/login" className="flex items-center gap-1 text-sm text-green-300 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
