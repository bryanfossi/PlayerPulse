'use client'

import { useState, useCallback } from 'react'
import { Plus, Search, SlidersHorizontal, X, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DraftEmailModal } from './DraftEmailModal'
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
  const [draftModalOpen, setDraftModalOpen] = useState(false)
  const [editContact, setEditContact] = useState<ContactEntry | null>(null)
  const [defaultSchoolId, setDefaultSchoolId] = useState(preselectedPsId)

  // Filters
  const [search, setSearch] = useState('')
  const [filterSchool, setFilterSchool] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterDirection, setFilterDirection] = useState<string>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)

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
        <div className="space-y-2">
          {/* Top row: search + toggle + log button + draft email */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            {/* Filter toggle (visible on all sizes) */}
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-md border text-xs font-medium transition-colors flex-shrink-0 ${
                filtersOpen || filterSchool !== 'all' || filterType !== 'all' || filterDirection !== 'all'
                  ? 'border-green-500/40 bg-green-500/10 text-green-400'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {filtersOpen ? <X className="w-3.5 h-3.5" /> : <SlidersHorizontal className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Filters</span>
              {(filterSchool !== 'all' || filterType !== 'all' || filterDirection !== 'all') && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              )}
            </button>
            <Button size="sm" onClick={() => openNewDialog()} className="gap-1.5 flex-shrink-0 h-9">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Log Contact</span>
              <span className="sm:hidden">Log</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setDraftModalOpen(true)}
              className="gap-1.5 flex-shrink-0 h-9 bg-[#4ADE80] hover:bg-[#22C55E] text-[#0F1120] font-bold"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Draft Email</span>
              <span className="sm:hidden">Draft</span>
            </Button>
          </div>

          {/* Expandable filter row */}
          {filtersOpen && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
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

              {/* Clear filters */}
              {(filterSchool !== 'all' || filterType !== 'all' || filterDirection !== 'all') && (
                <button
                  onClick={() => { setFilterSchool('all'); setFilterType('all'); setFilterDirection('all') }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Clear
                </button>
              )}
            </div>
          )}
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

      <DraftEmailModal
        open={draftModalOpen}
        onClose={() => setDraftModalOpen(false)}
        schools={schools}
        defaultPsId={defaultSchoolId}
      />
    </>
  )
}
