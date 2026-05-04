'use client'

import { useState, useCallback } from 'react'
import { LayoutGrid, List, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { SchoolBoard } from './SchoolBoard'
import { SchoolListView } from './SchoolListView'
import { TopTenPanel } from './TopTenPanel'
import { AddSchoolDialog } from './AddSchoolDialog'
import { RerunButton } from '@/components/RerunButton'
import { useTokens } from '@/contexts/TokenContext'
import { TOKEN_COSTS } from '@/lib/tokens/costs'
import { cn } from '@/lib/utils'
import type { PlayerSchoolStatus, Momentum } from '@/types/app'
import type { BoardItem } from './SchoolCard'

interface Props {
  initialItems: BoardItem[]
  playerId: string
}

export function SchoolsBoardClient({ initialItems, playerId }: Props) {
  const { spend } = useTokens()
  const [items, setItems] = useState<BoardItem[]>(initialItems)
  const [view, setView] = useState<'board' | 'list' | 'top10'>('board')
  const [rerunLoading, setRerunLoading] = useState(false)

  const handleStatusChange = useCallback((id: string, status: PlayerSchoolStatus) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
  }, [])

  const handleMomentumChange = useCallback((id: string, momentum: Momentum | null) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, momentum } : item)))
  }, [])

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleItemsChange = useCallback((next: BoardItem[]) => {
    setItems(next)
  }, [])

  async function handleAdded() {
    window.location.reload()
  }

  async function handleRerun() {
    setRerunLoading(true)
    try {
      const res = await fetch('/api/ai/match-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (json.error === 'NO_TOKENS') {
          toast.error(json.message ?? `Regenerating costs ${TOKEN_COSTS.FULL_MATCH_RERUN} tokens. Purchase more to continue.`)
        } else {
          toast.error(json.message ?? json.error ?? 'Failed to regenerate list. Please try again.')
        }
        return
      }
      spend(TOKEN_COSTS.FULL_MATCH_RERUN)
      toast.success(`Match engine complete — ${json.schools_generated} schools updated. Reloading…`)
      setTimeout(() => window.location.reload(), 1500)
    } catch {
      toast.error('Network error — could not run match engine.')
    } finally {
      setRerunLoading(false)
    }
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
            <button
              onClick={() => setView('top10')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border',
                view === 'top10' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
              )}
            >
              <Trophy className="w-3.5 h-3.5" />
              Top 10
            </button>
          </div>

          <RerunButton onRerun={handleRerun} isLoading={rerunLoading} />
          <AddSchoolDialog playerId={playerId} onAdded={handleAdded} />
        </div>
      </div>

      {/* Content */}
      {view === 'board' && (
        <SchoolBoard
          items={items}
          playerId={playerId}
          onItemsChange={handleItemsChange}
          onStatusChange={handleStatusChange}
          onMomentumChange={handleMomentumChange}
          onRemove={handleRemove}
        />
      )}
      {view === 'list' && (
        <SchoolListView
          items={items}
          onStatusChange={handleStatusChange}
          onMomentumChange={handleMomentumChange}
          onRemove={handleRemove}
        />
      )}
      {view === 'top10' && (
        <TopTenPanel items={items} onItemsChange={handleItemsChange} />
      )}
    </div>
  )
}
