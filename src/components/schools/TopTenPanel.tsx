'use client'

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
import { GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import type { BoardItem } from './SchoolCard'

const TIER_DOT: Record<string, string> = {
  Lock: 'bg-[#C9A227]',
  Realistic: 'bg-blue-400',
  Reach: 'bg-amber-400',
}

const TIER_PILL: Record<string, string> = {
  Lock: 'bg-[#C9A227]/15 text-[#C9A227]',
  Realistic: 'bg-blue-500/15 text-blue-400',
  Reach: 'bg-amber-500/15 text-amber-400',
}

function SortableRow({ item, rank, highlight }: { item: BoardItem; rank: number; highlight: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors ${highlight ? '' : 'opacity-60'}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground/25 hover:text-muted-foreground/60 transition-colors flex-shrink-0"
        aria-label={`Drag to reorder ${item.school?.name}`}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <span className="w-5 text-center text-xs font-black tabular-nums text-muted-foreground/50 flex-shrink-0">
        {rank}
      </span>

      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${TIER_DOT[item.tier ?? ''] ?? 'bg-muted'}`} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.school?.name ?? '–'}</p>
        <p className="text-[10px] text-muted-foreground">{item.school?.verified_division ?? ''}</p>
      </div>

      {item.overall_score != null && (
        <span className="text-xs font-bold tabular-nums text-muted-foreground/50 flex-shrink-0">
          {item.overall_score}
        </span>
      )}

      {item.tier && (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${TIER_PILL[item.tier] ?? 'bg-muted text-muted-foreground'}`}>
          {item.tier}
        </span>
      )}
    </div>
  )
}

interface Props {
  items: BoardItem[]
  onItemsChange: (items: BoardItem[]) => void
}

export function TopTenPanel({ items, onItemsChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const visible = items.filter((i) => i.status !== 'declined')

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = visible.findIndex((i) => i.id === active.id)
    const newIndex = visible.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(visible, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      rank_order: idx + 1,
    }))

    // Declined schools keep their existing rank_orders at the tail
    const declinedIds = new Set(items.filter((i) => i.status === 'declined').map((i) => i.id))
    const declined = items.filter((i) => declinedIds.has(i.id))

    onItemsChange([...reordered, ...declined])

    fetch('/api/player-schools/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: reordered.map(({ id, rank_order }) => ({ id, rank_order })),
      }),
    })
      .then((res) => {
        if (!res.ok) toast.error('Failed to save order. Please try again.')
        else toast.success('Order saved')
      })
      .catch(() => toast.error('Network error — order not saved.'))
  }

  if (visible.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-10">
        No schools yet. Run the Match Engine or add schools manually.
      </p>
    )
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground px-4 pb-3">
        Drag to reorder. The top 10 appear on your dashboard and public profile.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visible.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {visible.slice(0, 10).map((item, i) => (
            <SortableRow key={item.id} item={item} rank={i + 1} highlight />
          ))}
          {visible.length > 10 && (
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">Below Top 10</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}
          {visible.slice(10).map((item, i) => (
            <SortableRow key={item.id} item={item} rank={i + 11} highlight={false} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}
