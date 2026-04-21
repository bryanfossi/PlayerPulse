'use client'

import { useState, useTransition } from 'react'
import {
  Mail, MailOpen, Phone, MessageSquare, MapPin, Star,
  Eye, ClipboardList, ChevronDown, ChevronUp, Trash2, Pencil,
  ArrowUpRight, ArrowDownLeft, CalendarClock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ContactType } from '@/types/app'

export interface ContactEntry {
  id: string
  contact_type: ContactType
  direction: 'outbound' | 'inbound'
  contact_date: string
  subject: string | null
  notes: string | null
  email_body: string | null
  coach_name: string | null
  coach_email: string | null
  follow_up_date: string | null
  created_at: string
  school: { id: string; name: string; verified_division: string | null }
  player_school_id?: string
}

const TYPE_LABELS: Record<ContactType, string> = {
  email_sent: 'Email Sent',
  email_received: 'Email Received',
  call: 'Phone Call',
  text: 'Text Message',
  campus_visit: 'Campus Visit',
  official_visit: 'Official Visit',
  unofficial_visit: 'Unofficial Visit',
  coach_at_game: 'Coach at Game',
  questionnaire: 'Questionnaire',
}

const TYPE_ICONS: Record<ContactType, React.ElementType> = {
  email_sent: Mail,
  email_received: MailOpen,
  call: Phone,
  text: MessageSquare,
  campus_visit: MapPin,
  official_visit: Star,
  unofficial_visit: MapPin,
  coach_at_game: Eye,
  questionnaire: ClipboardList,
}

const TYPE_COLORS: Record<ContactType, string> = {
  email_sent: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30',
  email_received: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/30',
  call: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30',
  text: 'text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950/30',
  campus_visit: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30',
  official_visit: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30',
  unofficial_visit: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30',
  coach_at_game: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30',
  questionnaire: 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/30',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isOverdue(dateStr: string | null) {
  if (!dateStr) return false
  return new Date(dateStr + 'T00:00:00') < new Date(new Date().toDateString())
}

function isDueSoon(dateStr: string | null) {
  if (!dateStr) return false
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date(new Date().toDateString())
  const diff = (d.getTime() - now.getTime()) / 86400000
  return diff >= 0 && diff <= 7
}

interface Props {
  contact: ContactEntry
  onDelete: (id: string) => void
  onEdit: (contact: ContactEntry) => void
}

export function ContactCard({ contact, onDelete, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [pending, startTransition] = useTransition()

  const Icon = TYPE_ICONS[contact.contact_type]
  const colorClass = TYPE_COLORS[contact.contact_type]
  const overdue = isOverdue(contact.follow_up_date)
  const dueSoon = isDueSoon(contact.follow_up_date)

  function handleDelete() {
    if (!confirm('Delete this contact log?')) return
    startTransition(async () => {
      await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' })
      onDelete(contact.id)
    })
  }

  return (
    <div className={cn('bg-card border border-border rounded-lg overflow-hidden', pending && 'opacity-60')}>
      <div className="flex items-start gap-3 p-4">
        {/* Type icon */}
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-sm leading-tight">{contact.school.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground">{TYPE_LABELS[contact.contact_type]}</span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  {contact.direction === 'outbound'
                    ? <><ArrowUpRight className="w-3 h-3" /> Outbound</>
                    : <><ArrowDownLeft className="w-3 h-3" /> Inbound</>
                  }
                </span>
                {contact.school.verified_division && (
                  <>
                    <span className="text-muted-foreground text-xs">·</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{contact.school.verified_division}</Badge>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-muted-foreground">{formatDate(contact.contact_date)}</span>
              <button onClick={() => onEdit(contact)} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive transition-colors p-0.5">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Subject */}
          {contact.subject && (
            <p className="text-sm font-medium mt-1.5 text-foreground">{contact.subject}</p>
          )}

          {/* Coach */}
          {contact.coach_name && (
            <p className="text-xs text-muted-foreground mt-1">
              Coach: {contact.coach_name}{contact.coach_email && ` · ${contact.coach_email}`}
            </p>
          )}

          {/* Follow-up date */}
          {contact.follow_up_date && (
            <div className={cn(
              'inline-flex items-center gap-1 mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full',
              overdue ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' :
              dueSoon ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
              'bg-muted text-muted-foreground'
            )}>
              <CalendarClock className="w-3 h-3" />
              Follow-up: {formatDate(contact.follow_up_date)}
              {overdue && ' (overdue)'}
              {dueSoon && !overdue && ' (soon)'}
            </div>
          )}
        </div>
      </div>

      {/* Notes / body — collapsible */}
      {(contact.notes || contact.email_body) && (
        <div className="border-t border-border">
          <button
            onClick={() => setExpanded((o) => !o)}
            className="flex items-center justify-between w-full px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Notes {contact.email_body ? '· Email Body' : ''}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {expanded && (
            <div className="px-4 pb-4 space-y-2">
              {contact.notes && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
              )}
              {contact.email_body && (
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted/50 rounded p-3 max-h-48 overflow-y-auto">
                  {contact.email_body}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
