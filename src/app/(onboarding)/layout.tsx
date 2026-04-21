import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">PP</span>
          </div>
          <span className="font-bold text-lg">PlayerPulse</span>
        </div>
        {children}
      </div>
    </div>
  )
}
