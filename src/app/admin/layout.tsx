import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/auth/admin'
import { FeedbackButton } from '@/components/FeedbackButton'
import { brand } from '@/lib/brand'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/admin/feedback')
  if (!isAdminEmail(user.email)) {
    // Not an admin — bounce to dashboard rather than show a "Forbidden" page
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <header className="border-b border-white/10 bg-[#0F1120] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <img
              src={brand.logo.icon}
              alt={brand.appName}
              style={{ height: '24px', width: 'auto' }}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Admin
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/admin/feedback"
              className="text-muted-foreground hover:text-white transition-colors"
            >
              Feedback
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{user.email}</span>
          <Link href="/dashboard" className="hover:text-white transition-colors underline">
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="px-6 py-8">{children}</main>

      <FeedbackButton />
    </div>
  )
}
