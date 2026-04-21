'use client'

import { useState, useCallback } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContactCard, type ContactEntry } from './ContactCard'
import { ContactFormDialog, type SchoolOption } from './ContactFormDialog'
import { FollowUpReminders } from './FollowUpReminders'
import type { ContactType } from '@/types/app'

const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  email_sent: 'Email Sent',
  email_received: 'Email Received',
  call: 'Phone Call',
  text: 'Text',
  campus_visit: 'Campus Visit',
  official_visit: 'Official Visit',
  unofficial_visit: 'Unofficial Visit',
  coach_at_game: 'Coach at Game',
  questionnaire: 'Questionnaire',
}

interface Props {
  initialContacts: ContactEntry[]
  schools: SchoolOption[]
  preselectedPsId?: string
}

export function CommunicationsClient({ initialContacts, schools, preselectedPsId }: Props) {
  const [contacts, setContacts] = useState<ContactEntry[]>(initialContacts)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editContact, setEditContact] = useState<ContactEntry | null>(null)
  const [defaultSchoolId, setDefaultSchoolId] = useState(preselectedPsId)

  // Filters
  const [search, setSearch] = useState('')
  const [filterSchool, setFilterSchool] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterDirection, setFilterDirection] = useState<string>('all')

  const handleSaved = useCallback((contact: ContactEntry) => {
    setContacts((prev) => {
      const idx = prev.findIndex((c) => c.id === contact.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = contact
        return next
      }
      return [contact, ...prev]
    })
    setEditContact(null)
    setDefaultSchoolId(undefined)
  }, [])

  const handleDelete = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const handleEdit = useCallback((contact: ContactEntry) => {
    setEditContact(contact)
    setDialogOpen(true)
  }, [])

  function openNewDialog(schoolPsId?: string) {
    setEditContact(null)
    setDefaultSchoolId(schoolPsId)
    setDialogOpen(true)
  }

  // Apply filters
  const filtered = contacts.filter((c) => {
    if (filterSchool !== 'all' && c.school.id !== filterSchool) return false
    if (filterType !== 'all' && c.contact_type !== filterType) return false
    if (filterDirection !== 'all' && c.direction !== filterDirection) return false
    if (search) {
      const q = search.toLowerCase()
      const match =
        c.school.name.toLowerCase().includes(q) ||
        c.subject?.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q) ||
        c.coach_name?.toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })

  const uniqueSchools = Array.from(
    new Map(contacts.map((c) => [c.school.id, c.school])).values()
  ).sort((a, b) => a.name.localeCompare(b.name))

  // Group by date for timeline display
  const grouped = filtered.reduce<Record<string, ContactEntry[]>>((acc, c) => {
    const key = c.contact_date
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  function formatGroupDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date(new Date().toDateString())
    const diff = Math.round((today.getTime() - d.getTime()) / 86400000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      <div className="space-y-4">
        {/* Follow-up reminders */}
        <FollowUpReminders contacts={contacts} />

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>

            {/* School filter */}
            <Select value={filterSchool} onValueChange={setFilterSchool}>
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue placeholder="All schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {uniqueSchools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 text-xs w-36">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {(Object.keys(CONTACT_TYPE_LABELS) as ContactType[]).map((t) => (
                  <SelectItem key={t} value={t}>{CONTACT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Direction filter */}
            <Select value={filterDirection} onValueChange={setFilterDirection}>
              <SelectTrigger className="h-8 text-xs w-32">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" onClick={() => openNewDialog()} className="gap-1.5 flex-shrink-0">
            <Plus className="w-4 h-4" />
            Log Contact
          </Button>
        </div>

        {/* Count */}
        <p className="text-xs text-muted-foreground">
          {filtered.length} contact{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== contacts.length && ` (filtered from ${contacts.length})`}
        </p>

        {/* Timeline */}
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="font-medium text-muted-foreground">
              {contacts.length === 0 ? 'No contacts logged yet' : 'No contacts match your filters'}
            </p>
            {contacts.length === 0 && (
              <Button size="sm" variant="outline" className="mt-3" onClick={() => openNewDialog()}>
                Log your first contact
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {formatGroupDate(date)}
                </p>
                <div className="space-y-2">
                  {grouped[date].map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ContactFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditContact(null) }}
        onSaved={handleSaved}
        schools={schools}
        editContact={editContact}
        defaultSchoolId={defaultSchoolId}
      />
    </>
  )
}
