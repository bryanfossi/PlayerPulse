'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { OfferWithSchool } from './OffersClient'

export interface SchoolOption {
  player_school_id: string
  school_id: string
  school_name: string
  verified_division: string | null
  in_state_tuition: number | null
  out_state_tuition: number | null
}

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  schools: SchoolOption[]
  editOffer?: OfferWithSchool | null
}

function numVal(s: string): number {
  return parseFloat(s.replace(/[^0-9.]/g, '')) || 0
}

function fmt(n: number) {
  return n === 0 ? '' : String(Math.round(n))
}

export function OfferFormDialog({ open, onClose, onSaved, schools, editOffer }: Props) {
  const [psId, setPsId] = useState('')
  const [tuition, setTuition] = useState('')
  const [athletic, setAthletic] = useState('')
  const [merit, setMerit] = useState('')
  const [needBased, setNeedBased] = useState('')
  const [other, setOther] = useState('')
  const [offerDate, setOfferDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const totalAid = numVal(athletic) + numVal(merit) + numVal(needBased) + numVal(other)
  const netCost = numVal(tuition) - totalAid

  useEffect(() => {
    if (editOffer) {
      const ps = schools.find((s) => s.school_id === editOffer.school_id)
      setPsId(ps?.player_school_id ?? '')
      setTuition(fmt(editOffer.tuition_per_year ?? 0))
      setAthletic(fmt(editOffer.athletic_scholarship))
      setMerit(fmt(editOffer.merit_aid))
      setNeedBased(fmt(editOffer.need_based_aid))
      setOther(fmt(editOffer.other_aid))
      setOfferDate(editOffer.offer_date ?? '')
      setDeadline(editOffer.decision_deadline ?? '')
      setNotes(editOffer.notes ?? '')
    } else {
      setPsId('')
      setTuition('')
      setAthletic('')
      setMerit('')
      setNeedBased('')
      setOther('')
      setOfferDate(new Date().toISOString().slice(0, 10))
      setDeadline('')
      setNotes('')
    }
    setError('')
  }, [editOffer, open])

  // Auto-fill tuition from school's published rate when school is selected
  function handleSchoolChange(val: string) {
    setPsId(val)
    if (!editOffer && !tuition) {
      const school = schools.find((s) => s.player_school_id === val)
      if (school?.out_state_tuition) setTuition(String(school.out_state_tuition))
    }
  }

  function handleSubmit() {
    const school = schools.find((s) => s.player_school_id === psId)
    if (!school) { setError('Select a school'); return }
    if (!tuition) { setError('Tuition per year is required'); return }
    setError('')

    startTransition(async () => {
      const body = {
        player_school_id: school.player_school_id,
        school_id: school.school_id,
        tuition_per_year: numVal(tuition),
        athletic_scholarship: numVal(athletic),
        merit_aid: numVal(merit),
        need_based_aid: numVal(needBased),
        other_aid: numVal(other),
        offer_date: offerDate || null,
        decision_deadline: deadline || null,
        notes: notes || null,
      }

      const url = editOffer ? `/api/offers/${editOffer.id}` : '/api/offers'
      const method = editOffer ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Failed to save offer')
        return
      }

      onSaved()
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editOffer ? 'Edit Offer' : 'Log Offer'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* School */}
          <div className="space-y-1.5">
            <Label>School *</Label>
            <Select value={psId} onValueChange={handleSchoolChange} disabled={!!editOffer}>
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

          {/* Tuition */}
          <div className="space-y-1.5">
            <Label htmlFor="tuition">Tuition Per Year *</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
              <Input
                id="tuition"
                className="pl-6"
                placeholder="e.g. 52000"
                value={tuition}
                onChange={(e) => setTuition(e.target.value)}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Enter the actual tuition offered — may differ from the published rate.
            </p>
          </div>

          {/* Aid breakdown */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">Aid Breakdown (annual)</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'athletic', label: 'Athletic Scholarship', value: athletic, set: setAthletic },
                { id: 'merit', label: 'Merit / Academic Aid', value: merit, set: setMerit },
                { id: 'need', label: 'Need-Based Grant', value: needBased, set: setNeedBased },
                { id: 'other', label: 'Other Aid', value: other, set: setOther },
              ].map(({ id, label, value, set }) => (
                <div key={id} className="space-y-1.5">
                  <Label htmlFor={id} className="text-xs">{label}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                    <Input
                      id={id}
                      className="pl-6"
                      placeholder="0"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live net cost preview */}
          {numVal(tuition) > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>Total Aid: <span className="text-green-400 font-medium">${totalAid.toLocaleString()}/yr</span></p>
                <p>4-Year Total Aid: <span className="text-green-400 font-medium">${(totalAid * 4).toLocaleString()}</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Est. Net Cost</p>
                <p className={`text-xl font-black ${netCost <= 0 ? 'text-green-400' : 'text-foreground'}`}>
                  ${Math.max(0, netCost).toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/yr</span>
                </p>
                <p className="text-[11px] text-muted-foreground">${(Math.max(0, netCost) * 4).toLocaleString()} over 4 years</p>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="offer-date">Offer Date</Label>
              <Input
                id="offer-date"
                type="date"
                value={offerDate}
                onChange={(e) => setOfferDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Decision Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="offer-notes">Notes</Label>
            <Textarea
              id="offer-notes"
              placeholder="Housing included? Walk-on opportunity? Any conditions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={pending}>
              {pending ? 'Saving...' : editOffer ? 'Save Changes' : 'Log Offer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
