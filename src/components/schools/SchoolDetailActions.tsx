'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { MomentumPicker } from './MomentumPicker'
import type { PlayerSchoolStatus, Tier, Momentum } from '@/types/app'

const STATUS_LABELS: Record<PlayerSchoolStatus, string> = {
  researching: 'Researching',
  contacted: 'Contacted',
  interested: 'Interested',
  campus_visit: 'Campus Visit',
  offer_received: 'Offer Received',
  committed: 'Committed',
  declined: 'Declined',
}

interface Props {
  psId: string
  currentStatus: PlayerSchoolStatus
  currentTier: Tier | null
  currentNotes: string | null
  currentMomentum: Momentum | null
}

export function SchoolDetailActions({ psId, currentStatus, currentTier, currentNotes, currentMomentum }: Props) {
  const [status, setStatus] = useState<PlayerSchoolStatus>(currentStatus)
  const [tier, setTier] = useState<Tier | 'none'>(currentTier ?? 'none')
  const [notes, setNotes] = useState(currentNotes ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSave() {
    setError('')
    setSaved(false)
    startTransition(async () => {
      const res = await fetch(`/api/player-schools/${psId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          tier: tier === 'none' ? null : tier,
          notes: notes || null,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Failed to save')
        return
      }
      setSaved(true)
      router.refresh()
    })
  }

  const dirty =
    status !== currentStatus ||
    (tier === 'none' ? null : tier) !== currentTier ||
    (notes || null) !== currentNotes

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        {/* Momentum — saves immediately, separate from the dirty-save form below */}
        <div className="space-y-1.5">
          <Label>Momentum</Label>
          <div className="flex items-center gap-2">
            <MomentumPicker playerSchoolId={psId} initial={currentMomentum} />
            <span className="text-xs text-muted-foreground">
              How does this opportunity feel right now?
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="detail-status">Status</Label>
            <Select value={status} onValueChange={(v) => { setStatus(v as PlayerSchoolStatus); setSaved(false) }}>
              <SelectTrigger id="detail-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABELS) as PlayerSchoolStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tier */}
          <div className="space-y-1.5">
            <Label htmlFor="detail-tier">Tier</Label>
            <Select value={tier} onValueChange={(v) => { setTier(v as Tier | 'none'); setSaved(false) }}>
              <SelectTrigger id="detail-tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No tier</SelectItem>
                <SelectItem value="Lock">Lock</SelectItem>
                <SelectItem value="Realistic">Realistic</SelectItem>
                <SelectItem value="Reach">Reach</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="detail-notes">Notes</Label>
          <Textarea
            id="detail-notes"
            placeholder="Add personal notes about this school..."
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setSaved(false) }}
            rows={3}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleSave} disabled={pending || !dirty}>
            {pending ? 'Saving...' : 'Save Changes'}
          </Button>
          {saved && <span className="text-sm text-green-600 dark:text-green-400">Saved</span>}
        </div>
      </CardContent>
    </Card>
  )
}
