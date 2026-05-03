'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, School, MessageSquare, Trophy, User, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/schools', label: 'Schools', icon: School },
  { href: '/offers', label: 'Offers', icon: Trophy },
  { href: '/communications', label: 'Comms', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border md:hidden">
      <div className="flex items-center justify-around h-14 px-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg flex-1 min-w-0 max-w-[60px] transition-all',
                active ? 'text-green-400' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-[9px] font-medium leading-none truncate w-full text-center">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
