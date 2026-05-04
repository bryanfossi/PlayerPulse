'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { MomentumPicker } from './MomentumPicker'
import type { PlayerSchoolStatus } from '@/types/app'
import type { BoardItem } from './SchoolCard'

type SortKey = 'rank_order' | 'overall_score' | 'school.name' | 'status' | 'tier' | 'distance_miles'
type SortDir = 'asc' | 'desc'

const STATUS_LABELS: Record<PlayerSchoolStatus, string> = {
  researching: 'Researching',
  contacted: 'Contacted',
  interested: 'Interested',
  campus_visit: 'Campus Visit',
  offer_received: 'Offer Received',
  committed: 'Committed',
  declined: 'Declined',
}

const STATUS_COLORS: Record<PlayerSchoolStatus, string> = {
  researching: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  contacted: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  interested: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
  campus_visit: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  offer_received: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  committed: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  declined: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
}

const TIER_ORDER = { Lock: 0, Realistic: 1, Reach: 2 }

function sortItems(items: BoardItem[], key: SortKey, dir: SortDir): BoardItem[] {
  return [...items].sort((a, b) => {
    let va: string | number | null
    let vb: string | number | null

    if (key === 'school.name') {
      va = a.school.name
      vb = b.school.name
    } else if (key === 'tier') {
      va = a.tier ? TIER_ORDER[a.tier] : 99
      vb = b.tier ? TIER_ORDER[b.tier] : 99
    } else {
      va = a[key as keyof BoardItem] as string | number | null
      vb = b[key as keyof BoardItem] as string | number | null
    }

    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1

    const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number)
    return dir === 'asc' ? cmp : -cmp
  })
}

interface Props {
  items: BoardItem[]
  onStatusChange: (id: string, status: PlayerSchoolStatus) => void
  onRemove: (id: string) => void
}

export function SchoolListView({ items, onStatusChange, onRemove }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('rank_order')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [, startTransition] = useTransition()

  const sorted = sortItems(items, sortKey, sortDir)

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 opacity-40" />
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
  }

  function Th({ label, k }: { label: string; k: SortKey }) {
    return (
      <th
        onClick={() => handleSort(k)}
        className="px-3 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
      >
        <span className="inline-flex items-center gap-1">
          {label} <SortIcon k={k} />
        </span>
      </th>
    )
  }

  function handleStatus(id: string, status: PlayerSchoolStatus) {
    startTransition(async () => {
      await fetch(`/api/player-schools/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      onStatusChange(id, status)
    })
  }

  function handleRemove(id: string, name: string) {
    if (!confirm(`Remove ${name} from your list?`)) return
    startTransition(async () => {
      await fetch(`/api/player-schools/${id}`, { method: 'DELETE' })
      onRemove(id)
    })
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <Th label="#" k="rank_order" />
            <Th label="School" k="school.name" />
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Div</th>
            <Th label="Tier" k="tier" />
            <Th label="Status" k="status" />
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Momentum</th>
            <Th label="Score" k="overall_score" />
            <Th label="Distance" k="distance_miles" />
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Merit Aid</th>
            <th className="px-3 py-2 text-xs font-medium text-muted-foreground" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((item) => (
            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">
                {item.rank_order}
              </td>
              <td className="px-3 py-2.5">
                <Link href={`/schools/${item.id}`} className="font-medium hover:text-primary transition-colors">
                  {item.school.name}
                </Link>
                {(item.school.city || item.school.state) && (
                  <p className="text-xs text-muted-foreground">
                    {[item.school.city, item.school.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </td>
              <td className="px-3 py-2.5">
                {item.school.verified_division && (
                  <Badge variant="outline" className="text-[10px]">
                    {item.school.verified_division}
                  </Badge>
                )}
              </td>
              <td className="px-3 py-2.5">
                {item.tier && (
                  <span className={cn(
                    'text-[11px] font-medium px-2 py-0.5 rounded-full',
                    item.tier === 'Lock' && 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
                    item.tier === 'Realistic' && 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
                    item.tier === 'Reach' && 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                  )}>
                    {item.tier}
                  </span>
                )}
              </td>
              <td className="px-3 py-2.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', STATUS_COLORS[item.status])}>
                      {STATUS_LABELS[item.status]} ▾
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    {(Object.keys(STATUS_LABELS) as PlayerSchoolStatus[]).map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onClick={() => handleStatus(item.id, s)}
                        className={cn('text-xs', item.status === s && 'font-semibold')}
                      >
                        {STATUS_LABELS[s]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
              <td className="px-3 py-2.5">
                <MomentumPicker playerSchoolId={item.id} initial={item.momentum} compact />
              </td>
              <td className="px-3 py-2.5">
                {item.overall_score != null && (
                  <span className="font-bold text-primary">{item.overall_score}</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">
                {item.distance_miles != null ? `${item.distance_miles} mi` : '–'}
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">
                {item.merit_aid_potential ?? '–'}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/schools/${item.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleRemove(item.id, item.school.name)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
