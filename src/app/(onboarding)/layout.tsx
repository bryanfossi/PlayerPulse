import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FeedbackButton } from '@/components/FeedbackButton'
import { brand } from '@/lib/brand'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Free tier means everyone gets through onboarding without paying. The
  // /onboarding/subscribe page is still accessible as an opt-in upgrade
  // path, but it's no longer a mandatory gate. Subscription state is
  // checked at the per-feature level via token costs instead.

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center mb-10">
          <Link href="/">
            <img
              src={brand.logo.full}
              alt={brand.appName}
              style={{ height: '36px', width: 'auto' }}
            />
          </Link>
        </div>
        {children}
      </div>
      <FeedbackButton />
    </div>
  )
}
