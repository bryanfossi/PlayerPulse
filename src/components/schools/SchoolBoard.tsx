'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SchoolCard, type BoardItem } from './SchoolCard'
import { cn } from '@/lib/utils'
import type { PlayerSchoolStatus, Tier, Momentum } from '@/types/app'

// Sort key for momentum: hot at top (0), neutral/null in middle (1), cold at bottom (2).
function momentumPriority(m: Momentum | null): number {
  if (m === 'hot') return 0
  if (m === 'cold') return 2
  return 1 // neutral or null
}

interface TierColumnProps {
  tier: Tier
  items: BoardItem[]
  onStatusChange: (id: string, status: PlayerSchoolStatus) => void
  onMomentumChange: (id: string, momentum: Momentum | null) => void
  onRemove: (id: string) => void
}

const TIER_HEADER: Record<Tier, { label: string; description: string; headerClass: string }> = {
  Lock: {
    label: 'Lock',
    description: 'High-fit schools',
    headerClass: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800',
  },
  Realistic: {
    label: 'Realistic',
    description: 'Strong matches',
    headerClass: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
  },
  Reach: {
    label: 'Reach',
    description: 'Stretch goals',
    headerClass: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800',
  },
}

function SortableCard({
  item,
  onStatusChange,
  onMomentumChange,
  onRemove,
}: {
  item: BoardItem
  onStatusChange: (id: string, status: PlayerSchoolStatus) => void
  onMomentumChange: (id: string, momentum: Momentum | null) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-50 z-50')}>
      <SchoolCard
        item={item}
        dragHandleProps={{ ...attributes, ...listeners }}
        onStatusChange={onStatusChange}
        onMomentumChange={onMomentumChange}
        onRemove={onRemove}
      />
    </div>
  )
}

function TierColumn({ tier, items, onStatusChange, onMomentumChange, onRemove }: TierColumnProps) {
  const config = TIER_HEADER[tier]
  const ids = items.map((i) => i.id)

  return (
    <div className="flex flex-col min-h-0">
      {/* Column header */}
      <div className={cn('rounded-t-lg border px-4 py-3', config.headerClass)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{config.label}</h3>
          <span className="text-xs font-medium tabular-nums bg-background/60 rounded-full px-2 py-0.5">
            {items.length}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
      </div>

      {/* Cards */}
      <div className="flex-1 border border-t-0 border-border rounded-b-lg bg-muted/20 p-2 space-y-2 min-h-[120px]">
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableCard
              key={item.id}
              item={item}
              onStatusChange={onStatusChange}
              onMomentumChange={onMomentumChange}
              onRemove={onRemove}
            />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No schools</p>
        )}
      </div>
    </div>
  )
}

interface SchoolBoardProps {
  items: BoardItem[]
  playerId: string
  onItemsChange: (items: BoardItem[]) => void
  onStatusChange: (id: string, status: PlayerSchoolStatus) => void
  onMomentumChange: (id: string, momentum: Momentum | null) => void
  onRemove: (id: string) => void
}

export function SchoolBoard({ items, playerId, onItemsChange, onStatusChange, onMomentumChange, onRemove }: SchoolBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const tiers: Tier[] = ['Lock', 'Realistic', 'Reach']
  const grouped = tiers.reduce<Record<Tier, BoardItem[]>>(
    (acc, t) => {
      // Sort by momentum priority first (hot → neutral/null → cold), then rank_order
      acc[t] = items
        .filter((i) => i.tier === t)
        .sort((a, b) => {
          const pa = momentumPriority(a.momentum)
          const pb = momentumPriority(b.momentum)
          if (pa !== pb) return pa - pb
          return a.rank_order - b.rank_order
        })
      return acc
    },
    { Lock: [], Realistic: [], Reach: [] }
  )

  // Items without a tier go into Reach
  const untiered = items.filter((i) => !i.tier)
  if (untiered.length) grouped.Reach.push(...untiered)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Find which tier this drag happened in
    const tier = tiers.find((t) => grouped[t].some((i) => i.id === active.id))
    if (!tier) return

    const column = grouped[tier]
    const oldIndex = column.findIndex((i) => i.id === active.id)
    const newIndex = column.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(column, oldIndex, newIndex)

    // Assign new rank_orders: keep spacing from other tiers intact by using the min rank in this tier as base
    const minRank = column.reduce((m, i) => Math.min(m, i.rank_order), Infinity)
    const reorderedWithRanks = reordered.map((item, idx) => ({
      ...item,
      rank_order: minRank + idx,
    }))

    // Rebuild full items list
    const next = items.map((item) => {
      const updated = reorderedWithRanks.find((r) => r.id === item.id)
      return updated ?? item
    })
    onItemsChange(next)

    // Persist
    fetch('/api/player-schools/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: reorderedWithRanks.map(({ id, rank_order }) => ({ id, rank_order })),
      }),
    })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => (
          <TierColumn
            key={tier}
            tier={tier}
            items={grouped[tier]}
            onStatusChange={onStatusChange}
            onMomentumChange={onMomentumChange}
            onRemove={onRemove}
          />
        ))}
      </div>
    </DndContext>
  )
}
