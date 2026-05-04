'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, School, MessageSquare, Sparkles, User,
  LogOut, Trophy, Settings, ListTodo,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { brand } from '@/lib/brand'
import { TokenBalance } from '@/components/TokenBalance'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/actions', label: 'Actions', icon: ListTodo },
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
      <div className="px-4 h-16 flex items-center border-b border-border">
        <Link href="/dashboard">
          {/* Plain img bypasses Next.js image optimizer cache — correct for SVGs */}
          <img
            src={brand.logo.full}
            alt={brand.appName}
            width={200}
            height={48}
            style={{ height: '48px', width: 'auto' }}
          />
        </Link>
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

      {/* Token balance */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Tokens</span>
          <TokenBalance />
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
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
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
