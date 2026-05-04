'use client'

import { useTransition } from 'react'
import { Flame, Snowflake, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Momentum } from '@/types/app'

interface Props {
  playerSchoolId: string
  /** Current momentum value (controlled). */
  value: Momentum | null
  /** Compact icon-only mode for kanban cards. */
  compact?: boolean
  /**
   * Called optimistically when the user clicks an option, then again
   * with the previous value if the server rejects the change. Use this
   * to update parent state for re-sorting.
   */
  onChange: (next: Momentum | null) => void
}

const OPTIONS: Array<{
  value: Momentum
  label: string
  Icon: typeof Flame
  active: string
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

export function MomentumPicker({ playerSchoolId, value, compact = false, onChange }: Props) {
  const [pending, startTransition] = useTransition()

  function handleClick(clicked: Momentum) {
    // Tap-again-to-clear: clicking the current value un-sets momentum.
    const next: Momentum | null = value === clicked ? null : clicked
    const prev = value
    onChange(next) // optimistic — parent updates items state
    startTransition(async () => {
      try {
        const res = await fetch(`/api/player-schools/${playerSchoolId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ momentum: next }),
        })
        if (!res.ok) {
          onChange(prev) // rollback via parent
          toast.error('Could not update momentum. Please try again.')
        }
      } catch {
        onChange(prev)
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
      {OPTIONS.map(({ value: optVal, label, Icon, active, hover }) => {
        const isActive = value === optVal
        return (
          <button
            key={optVal}
            type="button"
            onClick={() => handleClick(optVal)}
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
