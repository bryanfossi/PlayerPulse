'use client'

import { CalendarClock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ContactEntry } from './ContactCard'

interface Props {
  contacts: ContactEntry[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date(new Date().toDateString())
  return Math.round((d.getTime() - now.getTime()) / 86400000)
}

export function FollowUpReminders({ contacts }: Props) {
  const today = new Date().toDateString()
  const sevenDaysLater = new Date(new Date(today).getTime() + 7 * 86400000)

  const reminders = contacts
    .filter((c) => {
      if (!c.follow_up_date) return false
      const d = new Date(c.follow_up_date + 'T00:00:00')
      return d <= sevenDaysLater
    })
    .sort((a, b) => new Date(a.follow_up_date!).getTime() - new Date(b.follow_up_date!).getTime())

  if (reminders.length === 0) return null

  const overdue = reminders.filter((c) => daysUntil(c.follow_up_date!) < 0)
  const upcoming = reminders.filter((c) => daysUntil(c.follow_up_date!) >= 0)

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarClock className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">
          Follow-up Reminders
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({reminders.length} due within 7 days)
          </span>
        </h3>
      </div>

      <div className="space-y-2">
        {overdue.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Overdue
            </p>
            {overdue.map((c) => (
              <ReminderItem key={c.id} contact={c} days={daysUntil(c.follow_up_date!)} />
            ))}
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="space-y-1.5">
            {overdue.length > 0 && <p className="text-xs font-medium text-muted-foreground">Upcoming</p>}
            {upcoming.map((c) => (
              <ReminderItem key={c.id} contact={c} days={daysUntil(c.follow_up_date!)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReminderItem({ contact, days }: { contact: ContactEntry; days: number }) {
  const label = days < 0
    ? `${Math.abs(days)}d overdue`
    : days === 0
    ? 'Today'
    : `In ${days}d`

  return (
    <div className={cn(
      'flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm',
      days < 0 ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800' :
      days === 0 ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800' :
      'bg-background border border-border'
    )}>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{contact.school.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {contact.subject || contact.notes?.slice(0, 60) || 'Follow up'}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={cn(
          'text-xs font-medium',
          days < 0 ? 'text-red-600 dark:text-red-400' :
          days === 0 ? 'text-amber-600 dark:text-amber-400' :
          'text-muted-foreground'
        )}>
          {label}
        </span>
        <span className="text-xs text-muted-foreground">{new Date(contact.follow_up_date! + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  )
}
