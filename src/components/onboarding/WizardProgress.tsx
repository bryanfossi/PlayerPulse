'use client'

import { usePathname } from 'next/navigation'
import { WIZARD_STEPS } from '@/types/wizard'
import { cn } from '@/lib/utils'

export function WizardProgress() {
  const pathname = usePathname()
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.path === pathname)
  const visibleSteps = WIZARD_STEPS.slice(0, 5) // show steps 1–5 only (6–7 are generating/complete)

  return (
    <div className="mb-8">
      <div className="flex items-center gap-0">
        {visibleSteps.map((step, i) => {
          const done = currentIndex > i
          const active = currentIndex === i
          return (
            <div key={step.path} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors',
                    done
                      ? 'bg-primary border-primary text-primary-foreground'
                      : active
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-border text-muted-foreground'
                  )}
                >
                  {done ? '✓' : i + 1}
                </div>
                <span className={cn(
                  'text-[10px] mt-1 font-medium hidden sm:block',
                  active ? 'text-primary' : done ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {step.label}
                </span>
              </div>
              {i < visibleSteps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mb-4',
                  done ? 'bg-primary' : 'bg-border'
                )} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
