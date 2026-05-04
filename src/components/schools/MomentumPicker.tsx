'use client'

import { useState, useTransition } from 'react'
import { Flame, Snowflake, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Momentum } from '@/types/app'

interface Props {
  playerSchoolId: string
  initial: Momentum | null
  /** Compact icon-only mode for kanban cards. */
  compact?: boolean
  /** Optional callback fired after the API call succeeds (with the new value). */
  onChange?: (next: Momentum | null) => void
}

const OPTIONS: Array<{
  value: Momentum
  label: string
  Icon: typeof Flame
  /** Active-state classes (selected). */
  active: string
  /** Inactive hover hint. */
  hover: string
}> = [
  {
    value: 'hot',
    label: 'Heating up',
    Icon: Flame,
    active: 'bg-orange-500/15 text-orange-400 border-orange-500/40',
    hover: 'hover:text-orange-400',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    Icon: Minus,
    active: 'bg-white/10 text-white border-white/30',
    hover: 'hover:text-white',
  },
  {
    value: 'cold',
    label: 'Going cold',
    Icon: Snowflake,
    active: 'bg-sky-500/15 text-sky-400 border-sky-500/40',
    hover: 'hover:text-sky-400',
  },
]

export function MomentumPicker({ playerSchoolId, initial, compact = false, onChange }: Props) {
  const [current, setCurrent] = useState<Momentum | null>(initial)
  const [pending, startTransition] = useTransition()

  function handleClick(value: Momentum) {
    // Tap-again-to-clear: clicking the same option un-sets momentum.
    const next: Momentum | null = current === value ? null : value
    const prev = current
    setCurrent(next) // optimistic
    onChange?.(next)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/player-schools/${playerSchoolId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ momentum: next }),
        })
        if (!res.ok) {
          setCurrent(prev) // rollback
          onChange?.(prev)
          toast.error('Could not update momentum. Please try again.')
        }
      } catch {
        setCurrent(prev)
        onChange?.(prev)
        toast.error('Network error — could not update momentum.')
      }
    })
  }

  const sizeBtn = compact ? 'w-6 h-6' : 'w-8 h-8'
  const sizeIcon = compact ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <div
      className={cn('inline-flex items-center gap-1', pending && 'opacity-60 pointer-events-none')}
      role="group"
      aria-label="Momentum"
    >
      {OPTIONS.map(({ value, label, Icon, active, hover }) => {
        const isActive = current === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => handleClick(value)}
            title={label}
            aria-label={label}
            aria-pressed={isActive}
            className={cn(
              'inline-flex items-center justify-center rounded-md border transition-colors',
              sizeBtn,
              isActive
                ? active
                : cn('border-transparent text-muted-foreground/50', hover),
            )}
          >
            <Icon className={sizeIcon} />
          </button>
        )
      })}
    </div>
  )
}
