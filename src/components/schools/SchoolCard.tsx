'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { GripVertical, ExternalLink, Trash2, Loader2, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScoreBreakdown } from './ScoreBreakdown'
import { cn } from '@/lib/utils'
import type { PlayerSchool, School, PlayerSchoolStatus } from '@/types/app'

export type BoardItem = PlayerSchool & { school: School }

const TIER_STYLES = {
  Lock: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-[#4ADE80]/15 dark:text-[#4ADE80] dark:border-[#4ADE80]/30',
  Realistic: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  Reach: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
}

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

const ALL_STATUSES = Object.keys(STATUS_LABELS) as PlayerSchoolStatus[]

interface Props {
  item: BoardItem
  dragHandleProps?: Record<string, unknown>
  onStatusChange: (id: string, status: PlayerSchoolStatus) => void
  onRemove: (id: string) => void
  className?: string
}

export function SchoolCard({ item, dragHandleProps, onStatusChange, onRemove, className }: Props) {
  const [pending, startTransition] = useTransition()
  const { school: s } = item

  function handleStatus(status: PlayerSchoolStatus) {
    const prevStatus = item.status
    onStatusChange(item.id, status)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/player-schools/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        if (!res.ok) {
          onStatusChange(item.id, prevStatus)
          toast.error('Failed to update status. Please try again.')
        } else if (status === 'offer_received') {
          toast.success('🎉 Offer added to your Offers page')
        }
      } catch {
        onStatusChange(item.id, prevStatus)
        toast.error('Network error — could not update status.')
      }
    })
  }

  function handleRemove() {
    if (!confirm(`Remove ${s.name} from your list?`)) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/player-schools/${item.id}`, { method: 'DELETE' })
        if (!res.ok) {
          toast.error('Failed to remove school. Please try again.')
          return
        }
        onRemove(item.id)
      } catch {
        toast.error('Network error — could not remove school.')
      }
    })
  }

  return (
    <div className={cn('bg-card border border-border rounded-lg overflow-hidden', pending && 'opacity-60', className)}>
      {/* Card header */}
      <div className="flex items-start gap-2 p-3">
        {/* Drag handle / loading indicator */}
        <div
          {...dragHandleProps}
          className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          {pending
            ? <Loader2 className="w-4 h-4 animate-spin text-green-400" />
            : <GripVertical className="w-4 h-4" />
          }
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <Link
              href={`/schools/${item.id}`}
              className="font-semibold text-sm leading-tight hover:text-primary transition-colors line-clamp-2 flex items-center gap-1"
            >
              {s.name}
              {item.status === 'offer_received' && (
                <Trophy className="w-3.5 h-3.5 text-[#4ADE80] flex-shrink-0" />
              )}
            </Link>
            <button
              onClick={handleRemove}
              className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors p-0.5"
              title="Remove school"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {s.verified_division && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {s.verified_division}
              </Badge>
            )}
            {item.tier && (
              <span className={cn('text-[10px] font-medium px-1.5 py-0 rounded border', TIER_STYLES[item.tier])}>
                {item.tier}
              </span>
            )}
          </div>

          {(s.city || s.state) && (
            <p className="text-xs text-muted-foreground mt-1 leading-none">
              {[s.city, s.state].filter(Boolean).join(', ')}
              {item.distance_miles != null && ` · ${item.distance_miles} mi`}
            </p>
          )}
        </div>

        {/* Score circle */}
        {item.overall_score != null && (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/25 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-[#4ADE80] leading-none">{item.overall_score}</span>
          </div>
        )}
      </div>

      {/* Status row */}
      <div className="px-3 pb-3 flex items-center justify-between gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'text-[11px] font-medium px-2 py-1 rounded-full transition-colors',
                STATUS_COLORS[item.status]
              )}
            >
              {STATUS_LABELS[item.status]} ▾
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {ALL_STATUSES.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => handleStatus(s)}
                className={cn('text-xs', item.status === s && 'font-semibold')}
              >
                {STATUS_LABELS[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          href={`/schools/${item.id}`}
          className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          Details <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Score breakdown */}
      <ScoreBreakdown ps={item} />
    </div>
  )
}
