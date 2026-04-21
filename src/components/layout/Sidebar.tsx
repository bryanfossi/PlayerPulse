'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, School, MessageSquare, Sparkles, User,
  LogOut, Zap, Trophy, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/schools', label: 'My Schools', icon: School },
  { href: '/offers', label: 'Offers', icon: Trophy },
  { href: '/communications', label: 'Communications', icon: MessageSquare },
  { href: '/ai/draft', label: 'AI Email Draft', icon: Sparkles },
  { href: '/profile', label: 'Profile', icon: User },
]


export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-screen sticky top-0 bg-background border-r border-border">

      {/* Brand */}
      <div className="px-5 h-16 flex items-center gap-3 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-[#080f08]" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm leading-none tracking-tight">PlayerPulse</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">Promoted Soccer</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Recruiting
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-green-500/10 text-green-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-green-400 rounded-r-full" />
              )}
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-green-400' : '')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-1',
              pathname === '/settings'
                ? 'bg-green-500/10 text-green-400'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
