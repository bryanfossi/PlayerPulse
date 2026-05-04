'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Trophy, Plus, Pencil, Trash2, CheckCircle2, XCircle,
  CalendarClock, TrendingDown, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { OfferFormDialog, type SchoolOption } from './OfferFormDialog'
import type { Database } from '@/types/database'

type OfferRow = Database['public']['Tables']['offers']['Row']
type SchoolRow = Database['public']['Tables']['schools']['Row']

export type OfferWithSchool = OfferRow & {
  school: Pick<SchoolRow, 'id' | 'name' | 'verified_division' | 'city' | 'state' | 'in_state_tuition' | 'out_state_tuition'>
}

export interface OfferSchoolRecord {
  id: string
  updated_at: string
  notes: string | null
  school: Pick<SchoolRow, 'id' | 'name' | 'verified_division' | 'city' | 'state'>
}

interface Props {
  initialOffers: OfferWithSchool[]
  schools: SchoolOption[]
  offerSchools?: OfferSchoolRecord[]
}

function fmt$(n: number) {
  return `$${n.toLocaleString()}`
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr + 'T00:00:00').getTime() - new Date(new Date().toDateString()).getTime()
  return Math.ceil(diff / 86400000)
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const STATUS_CONFIG = {
  evaluating: { label: 'Evaluating', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  accepted: { label: 'Accepted ✓', class: 'bg-green-500/10 text-green-400 border-green-500/20' },
  declined: { label: 'Declined', class: 'bg-muted text-muted-foreground border-border' },
}

function AidRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  if (value === 0) return null
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn('font-medium text-xs', highlight ? 'text-green-400' : '')}>
        {fmt$(value)}
      </span>
    </div>
  )
}

function OfferCard({
  offer,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  offer: OfferWithSchool
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: 'evaluating' | 'accepted' | 'declined') => void
}) {
  const [deleting, startDelete] = useTransition()
  const [updating, startUpdate] = useTransition()

  const totalAid = offer.athletic_scholarship + offer.merit_aid + offer.need_based_aid + offer.other_aid
  const tuition = offer.tuition_per_year ?? 0
  const netCost = Math.max(0, tuition - totalAid)
  const days = daysUntil(offer.decision_deadline)
  const deadlineUrgent = days !== null && days <= 14
  const deadlinePassed = days !== null && days < 0
  const cfg = STATUS_CONFIG[offer.status]

  function handleDelete() {
    if (!confirm('Remove this offer?')) return
    startDelete(async () => {
      try {
        const res = await fetch(`/api/offers/${offer.id}`, { method: 'DELETE' })
        if (!res.ok) { toast.error('Could not remove offer. Please try again.'); return }
        onDelete()
      } catch {
        toast.error('Network error — could not remove offer.')
      }
    })
  }

  function handleStatus(status: 'evaluating' | 'accepted' | 'declined') {
    const prevStatus = offer.status
    onStatusChange(status)
    startUpdate(async () => {
      try {
        const res = await fetch(`/api/offers/${offer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        if (!res.ok) {
          onStatusChange(prevStatus)
          toast.error('Could not update offer status.')
          return
        }
        if (status === 'accepted') toast.success(`Offer from ${offer.school.name} accepted!`)
        if (status === 'declined') toast.success(`Offer from ${offer.school.name} declined.`)
      } catch {
        onStatusChange(prevStatus)
        toast.error('Network error — could not update offer.')
      }
    })
  }

  return (
    <div className={cn(
      'relative bg-card border border-border rounded-xl overflow-hidden flex flex-col transition-opacity',
      offer.status === 'declined' && 'opacity-60',
      (deleting || updating) && 'opacity-50 pointer-events-none',
    )}>
      {/* Accepted accent */}
      {offer.status === 'accepted' && (
        <div className="h-1 bg-[#4ADE80]" />
      )}

      {/* Header */}
      <div className="p-5 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-base leading-tight truncate">{offer.school.name}</h3>
            {offer.school.verified_division && (
              <Badge variant="outline" className="text-[10px] flex-shrink-0">
                {offer.school.verified_division}
              </Badge>
            )}
          </div>
          {(offer.school.city || offer.school.state) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {[offer.school.city, offer.school.state].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${cfg.class}`}>
          {cfg.label}
        </span>
      </div>

      {/* Financial breakdown */}
      <div className="px-5 pb-3 border-b border-border space-y-0.5">
        <div className="flex items-center justify-between py-1 border-b border-border/50 mb-1">
          <span className="text-xs text-muted-foreground">Tuition / Year</span>
          <span className="text-sm font-semibold">{tuition > 0 ? fmt$(tuition) : '—'}</span>
        </div>
        <AidRow label="Athletic Scholarship" value={offer.athletic_scholarship} highlight />
        <AidRow label="Merit / Academic" value={offer.merit_aid} highlight />
        <AidRow label="Need-Based Grant" value={offer.need_based_aid} highlight />
        <AidRow label="Other Aid" value={offer.other_aid} highlight />
        {totalAid > 0 && (
          <div className="flex items-center justify-between py-1 border-t border-border/50 mt-1">
            <span className="text-xs text-muted-foreground">Total Aid</span>
            <span className="text-xs font-semibold text-green-400">{fmt$(totalAid)}/yr</span>
          </div>
        )}
      </div>

      {/* Net cost — hero stat */}
      <div className="px-5 py-4 flex items-center justify-between bg-muted/20">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Est. Net Cost</p>
          <p className="text-3xl font-black text-foreground leading-none mt-0.5">
            {tuition > 0 ? fmt$(netCost) : '—'}
            {tuition > 0 && <span className="text-sm font-normal text-muted-foreground">/yr</span>}
          </p>
          {tuition > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              {fmt$(netCost * 4)} over 4 years
            </p>
          )}
        </div>
        {tuition > 0 && totalAid > 0 && (
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Aid covers</p>
            <p className="text-2xl font-black text-green-400">
              {Math.round((totalAid / tuition) * 100)}%
            </p>
          </div>
        )}
      </div>

      {/* Deadline + dates */}
      {(offer.decision_deadline || offer.offer_date) && (
        <div className="px-5 py-3 border-t border-border space-y-1">
          {offer.offer_date && (
            <p className="text-xs text-muted-foreground">
              Received: {formatDate(offer.offer_date)}
            </p>
          )}
          {offer.decision_deadline && (
            <div className={cn(
              'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
              deadlinePassed ? 'bg-red-500/10 text-red-400' :
              deadlineUrgent ? 'bg-amber-500/10 text-amber-400' :
              'bg-muted text-muted-foreground'
            )}>
              <CalendarClock className="w-3 h-3" />
              Deadline: {formatDate(offer.decision_deadline)}
              {days !== null && !deadlinePassed && ` · ${days}d left`}
              {deadlinePassed && ' · Passed'}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {offer.notes && (
        <div className="px-5 pb-3">
          <p className="text-xs text-muted-foreground line-clamp-2">{offer.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-3 border-t border-border mt-auto flex items-center gap-2 flex-wrap">
        {offer.status !== 'accepted' && (
          <Button
            size="sm"
            className="h-7 text-xs gap-1 bg-[#4ADE80] hover:bg-[#22C55E] text-[#0F1120]"
            onClick={() => handleStatus('accepted')}
            disabled={updating}
          >
            {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Accept
          </Button>
        )}
        {offer.status !== 'declined' && offer.status !== 'accepted' && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => handleStatus('declined')}
            disabled={updating}
          >
            {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
            Decline
          </Button>
        )}
        {offer.status !== 'evaluating' && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => handleStatus('evaluating')}
            disabled={updating}
          >
            Re-open
          </Button>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function OfferSchoolCard({ record }: { record: OfferSchoolRecord }) {
  return (
    <div className="bg-card border border-[#4ADE80]/20 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm leading-tight truncate">{record.school.name}</h3>
            {record.school.verified_division && (
              <Badge variant="outline" className="text-[10px] flex-shrink-0">
                {record.school.verified_division}
              </Badge>
            )}
          </div>
          {(record.school.city || record.school.state) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {[record.school.city, record.school.state].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        <Trophy className="w-4 h-4 text-[#4ADE80] flex-shrink-0 mt-0.5" />
      </div>
      <p className="text-xs text-muted-foreground">
        Offer received: {formatDate(record.updated_at)}
      </p>
      {record.notes && (
        <p className="text-xs text-muted-foreground line-clamp-2 border-t border-border pt-2">
          {record.notes}
        </p>
      )}
      <div className="pt-1">
        <Link
          href="/offers"
          className="text-[11px] text-[#4ADE80] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Log full offer details →
        </Link>
      </div>
    </div>
  )
}

export function OffersClient({ initialOffers, schools, offerSchools = [] }: Props) {
  const [offers, setOffers] = useState(initialOffers)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<OfferWithSchool | null>(null)

  function handleSaved() {
    // Reload from server
    fetch('/api/offers')
      .then((r) => r.json())
      .then((json) => setOffers(json.offers ?? []))
  }

  function handleDelete(id: string) {
    setOffers((prev) => prev.filter((o) => o.id !== id))
  }

  function handleStatusChange(id: string, status: 'evaluating' | 'accepted' | 'declined') {
    setOffers((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
  }

  const evaluating = offers.filter((o) => o.status === 'evaluating')
  const accepted = offers.filter((o) => o.status === 'accepted')
  const declined = offers.filter((o) => o.status === 'declined')

  const bestValue = [...offers].filter((o) => o.tuition_per_year)
    .sort((a, b) => {
      const netA = (a.tuition_per_year ?? 0) - (a.athletic_scholarship + a.merit_aid + a.need_based_aid + a.other_aid)
      const netB = (b.tuition_per_year ?? 0) - (b.athletic_scholarship + b.merit_aid + b.need_based_aid + b.other_aid)
      return netA - netB
    })[0]

  const soonestDeadline = [...offers]
    .filter((o) => o.decision_deadline && o.status === 'evaluating')
    .sort((a, b) => a.decision_deadline!.localeCompare(b.decision_deadline!))[0]

  return (
    <>
      {/* Summary bar */}
      {offers.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Offers', value: String(offers.length), sub: null },
            { label: 'Evaluating', value: String(evaluating.length), sub: null },
            {
              label: 'Best Value',
              value: bestValue ? bestValue.school.name.split(' ').slice(-1)[0] : '—',
              sub: bestValue
                ? fmt$(Math.max(0, (bestValue.tuition_per_year ?? 0) - (bestValue.athletic_scholarship + bestValue.merit_aid + bestValue.need_based_aid + bestValue.other_aid))) + '/yr net'
                : null,
            },
            {
              label: 'Next Deadline',
              value: soonestDeadline ? (() => { const d = daysUntil(soonestDeadline.decision_deadline); return d !== null ? `${d}d` : '—' })() : '—',
              sub: soonestDeadline ? soonestDeadline.school.name.split(' ').slice(-1)[0] : null,
            },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-card border border-border rounded-xl px-4 py-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-xl font-black mt-0.5">{value}</p>
              {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Recruited schools (from player_school status = offer_received) */}
      {offerSchools.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-[#4ADE80]">
            <Trophy className="w-4 h-4" /> Schools That Have Offered
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {offerSchools.map((r) => (
              <OfferSchoolCard key={r.id} record={r} />
            ))}
          </div>
        </div>
      )}

      {/* Add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {offers.length === 0
            ? 'Log offers as you receive them to compare financials side-by-side.'
            : `${offers.length} offer${offers.length !== 1 ? 's' : ''} · ${accepted.length} accepted`}
        </p>
        <Button
          size="sm"
          className="gap-1.5 bg-[#4ADE80] hover:bg-[#22C55E] text-[#0F1120] font-semibold"
          onClick={() => { setEditing(null); setDialogOpen(true) }}
        >
          <Plus className="w-4 h-4" />
          Log Offer
        </Button>
      </div>

      {/* Empty state */}
      {offers.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <p className="font-semibold">No offers yet</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            When coaches extend offers, log them here to compare net costs and deadlines side-by-side.
          </p>
          <Button
            size="sm"
            className="mt-2 gap-1.5 bg-[#4ADE80] hover:bg-[#22C55E] text-[#0F1120] font-semibold"
            onClick={() => { setEditing(null); setDialogOpen(true) }}
          >
            <Plus className="w-4 h-4" /> Log First Offer
          </Button>
        </div>
      )}

      {/* Accepted */}
      {accepted.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-green-400">
            <CheckCircle2 className="w-4 h-4" /> Accepted
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accepted.map((o) => (
              <OfferCard
                key={o.id}
                offer={o}
                onEdit={() => { setEditing(o); setDialogOpen(true) }}
                onDelete={() => handleDelete(o.id)}
                onStatusChange={(s) => handleStatusChange(o.id, s)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Evaluating */}
      {evaluating.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Evaluating</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {evaluating.map((o) => (
              <OfferCard
                key={o.id}
                offer={o}
                onEdit={() => { setEditing(o); setDialogOpen(true) }}
                onDelete={() => handleDelete(o.id)}
                onStatusChange={(s) => handleStatusChange(o.id, s)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Declined */}
      {declined.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Declined</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {declined.map((o) => (
              <OfferCard
                key={o.id}
                offer={o}
                onEdit={() => { setEditing(o); setDialogOpen(true) }}
                onDelete={() => handleDelete(o.id)}
                onStatusChange={(s) => handleStatusChange(o.id, s)}
              />
            ))}
          </div>
        </div>
      )}

      <OfferFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
        schools={schools}
        editOffer={editing}
      />
    </>
  )
}
