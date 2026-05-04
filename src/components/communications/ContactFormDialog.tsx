'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ContactType } from '@/types/app'
import type { ContactEntry } from './ContactCard'

export interface SchoolOption {
  player_school_id: string
  school_id: string
  school_name: string
  verified_division: string | null
  city: string | null
  state: string | null
  tier: string | null
  status: import('@/types/app').PlayerSchoolStatus
}

const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
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

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (contact: ContactEntry) => void
  schools: SchoolOption[]
  editContact?: ContactEntry | null
  defaultSchoolId?: string
}

export function ContactFormDialog({ open, onClose, onSaved, schools, editContact, defaultSchoolId }: Props) {
  const today = new Date().toISOString().slice(0, 10)

  const [psId, setPsId] = useState('')
  const [contactType, setContactType] = useState<ContactType>('email_sent')
  const [direction, setDirection] = useState<'outbound' | 'inbound'>('outbound')
  const [contactDate, setContactDate] = useState(today)
  const [subject, setSubject] = useState('')
  const [coachName, setCoachName] = useState('')
  const [coachEmail, setCoachEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  // Populate form when editing or when defaults change
  useEffect(() => {
    if (editContact) {
      const ps = schools.find((s) => s.school_id === editContact.school.id)
      setPsId(ps?.player_school_id ?? '')
      setContactType(editContact.contact_type)
      setDirection(editContact.direction)
      setContactDate(editContact.contact_date)
      setSubject(editContact.subject ?? '')
      setCoachName(editContact.coach_name ?? '')
      setCoachEmail(editContact.coach_email ?? '')
      setNotes(editContact.notes ?? '')
      setFollowUpDate(editContact.follow_up_date ?? '')
    } else {
      setPsId(defaultSchoolId ?? '')
      setContactType('email_sent')
      setDirection('outbound')
      setContactDate(today)
      setSubject('')
      setCoachName('')
      setCoachEmail('')
      setNotes('')
      setFollowUpDate('')
    }
    setError('')
  }, [editContact, defaultSchoolId, open])

  function handleClose() {
    setError('')
    onClose()
  }

  function handleSubmit() {
    if (!psId) { setError('Select a school'); return }
    if (!contactDate) { setError('Contact date is required'); return }
    setError('')

    startTransition(async () => {
      if (editContact) {
        // Edit mode — PATCH
        const res = await fetch(`/api/contacts/${editContact.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contact_type: contactType,
            direction,
            contact_date: contactDate,
            subject: subject || null,
            notes: notes || null,
            coach_name: coachName || null,
            coach_email: coachEmail || null,
            follow_up_date: followUpDate || null,
          }),
        })
        if (!res.ok) {
          const json = await res.json()
          setError(json.error ?? 'Failed to update')
          return
        }
        onSaved({
          ...editContact,
          contact_type: contactType,
          direction,
          contact_date: contactDate,
          subject: subject || null,
          notes: notes || null,
          coach_name: coachName || null,
          coach_email: coachEmail || null,
          follow_up_date: followUpDate || null,
        })
      } else {
        // Create mode — POST
        const res = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player_school_id: psId,
            contact_type: contactType,
            direction,
            contact_date: contactDate,
            subject: subject || undefined,
            notes: notes || undefined,
            coach_name: coachName || undefined,
            coach_email: coachEmail || undefined,
            follow_up_date: followUpDate || undefined,
          }),
        })
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? 'Failed to log contact')
          return
        }
        const school = schools.find((s) => s.player_school_id === psId)
        if (!school) { setError('School not found'); return }
        onSaved({
          id: json.contact_id,
          contact_type: contactType,
          direction,
          contact_date: contactDate,
          subject: subject || null,
          notes: notes || null,
          email_body: null,
          coach_name: coachName || null,
          coach_email: coachEmail || null,
          follow_up_date: followUpDate || null,
          created_at: new Date().toISOString(),
          school: { id: school.school_id, name: school.school_name, verified_division: school.verified_division },
        })
      }
      handleClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editContact ? 'Edit Contact Log' : 'Log Contact'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* School */}
          <div className="space-y-1.5">
            <Label>School *</Label>
            <Select value={psId} onValueChange={setPsId} disabled={!!editContact}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a school..." />
              </SelectTrigger>
              <SelectContent>
                {schools.map((s) => (
                  <SelectItem key={s.player_school_id} value={s.player_school_id}>
                    {s.school_name}{s.verified_division ? ` (${s.verified_division})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Type */}
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={contactType} onValueChange={(v) => setContactType(v as ContactType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CONTACT_TYPE_LABELS) as ContactType[]).map((t) => (
                    <SelectItem key={t} value={t}>{CONTACT_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Direction */}
            <div className="space-y-1.5">
              <Label>Direction *</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as 'outbound' | 'inbound')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound (you initiated)</SelectItem>
                  <SelectItem value="inbound">Inbound (coach initiated)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="contact-date">Date *</Label>
              <Input
                id="contact-date"
                type="date"
                value={contactDate}
                onChange={(e) => setContactDate(e.target.value)}
              />
            </div>

            {/* Follow-up */}
            <div className="space-y-1.5">
              <Label htmlFor="followup-date">Follow-up Date</Label>
              <Input
                id="followup-date"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="contact-subject">Subject</Label>
            <Input
              id="contact-subject"
              placeholder="Email subject or call topic..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact-coach">Coach Name</Label>
              <Input
                id="contact-coach"
                placeholder="Coach Smith"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-coach-email">Coach Email</Label>
              <Input
                id="contact-coach-email"
                type="email"
                placeholder="coach@school.edu"
                value={coachEmail}
                onChange={(e) => setCoachEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="contact-notes">Notes</Label>
            <Textarea
              id="contact-notes"
              placeholder="What was discussed, key takeaways..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={pending}>
              {pending ? 'Saving...' : editContact ? 'Save Changes' : 'Log Contact'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
