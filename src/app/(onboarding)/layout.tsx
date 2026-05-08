import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { FeedbackButton } from '@/components/FeedbackButton'
import { brand } from '@/lib/brand'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check subscription via profiles table (exists for all users from signup trigger)
  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('subscription_active')
    .eq('id', user.id)
    .maybeSingle()

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  const isSubscribePage = pathname === '/onboarding/subscribe'

  const cookieStore = await cookies()
  const paymentPending = cookieStore.get('payment_pending')?.value === '1'

  if (!profile?.subscription_active && !isSubscribePage && !paymentPending) {
    redirect('/onboarding/subscribe')
  }

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
