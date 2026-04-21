'use client'

import { useState, useCallback, useTransition } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SchoolBoard } from './SchoolBoard'
import { SchoolListView } from './SchoolListView'
import { AddSchoolDialog } from './AddSchoolDialog'
import { cn } from '@/lib/utils'
import type { PlayerSchoolStatus } from '@/types/app'
import type { BoardItem } from './SchoolCard'

interface Props {
  initialItems: BoardItem[]
  playerId: string
}

export function SchoolsBoardClient({ initialItems, playerId }: Props) {
  const [items, setItems] = useState<BoardItem[]>(initialItems)
  const [view, setView] = useState<'board' | 'list'>('board')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleStatusChange = useCallback((id: string, status: PlayerSchoolStatus) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
  }, [])

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleItemsChange = useCallback((next: BoardItem[]) => {
    setItems(next)
  }, [])

  async function handleAdded() {
    // Refetch the list from server by refreshing the page
    window.location.reload()
  }

  const lockCount = items.filter((i) => i.tier === 'Lock').length
  const realisticCount = items.filter((i) => i.tier === 'Realistic').length
  const reachCount = items.filter((i) => i.tier === 'Reach').length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Tier summary */}
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            <span className="font-semibold text-green-600 dark:text-green-400">{lockCount}</span> Lock
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-blue-600 dark:text-blue-400">{realisticCount}</span> Realistic
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-amber-600 dark:text-amber-400">{reachCount}</span> Reach
          </span>
          <span className="text-muted-foreground">· {items.length} total</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setView('board')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                view === 'board' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border',
                view === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
              )}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          <AddSchoolDialog playerId={playerId} onAdded={handleAdded} />
        </div>
      </div>

      {/* Content */}
      {view === 'board' ? (
        <SchoolBoard
          items={items}
          playerId={playerId}
          onItemsChange={handleItemsChange}
          onStatusChange={handleStatusChange}
          onRemove={handleRemove}
        />
      ) : (
        <SchoolListView
          items={items}
          onStatusChange={handleStatusChange}
          onRemove={handleRemove}
        />
      )}
    </div>
  )
}
