'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface School {
  rank_order: number
  tier: string | null
  overall_score: number | null
  school: { name: string; verified_division: string | null; city: string | null; state: string | null }
}

interface StepCompleteProps {
  firstName: string
  topSchools: School[]
  totalCount: number
}

const TIER_STYLES: Record<string, string> = {
  Lock:      'bg-green-100 text-green-800 border-green-200',
  Realistic: 'bg-blue-100 text-blue-800 border-blue-200',
  Reach:     'bg-amber-100 text-amber-800 border-amber-200',
}

export function StepComplete({ firstName, topSchools, totalCount }: StepCompleteProps) {
  return (
    <div className="space-y-6 text-center">
      <div>
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold">Your Top {totalCount} is Ready, {firstName}!</h2>
        <p className="text-muted-foreground mt-2">
          The Match Engine analyzed thousands of programs and ranked your best fits.
        </p>
      </div>

      {/* Top 5 preview */}
      <div className="text-left space-y-2">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Top 5 Schools</p>
        {topSchools.map((ps) => (
          <div
            key={ps.rank_order}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm font-mono w-5 text-right">
                {ps.rank_order}
              </span>
              <div>
                <p className="font-semibold text-sm">{ps.school.name}</p>
                <p className="text-xs text-muted-foreground">
                  {ps.school.verified_division} · {ps.school.city}, {ps.school.state}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{ps.overall_score}</span>
              {ps.tier && (
                <Badge
                  variant="outline"
                  className={cn('text-xs', TIER_STYLES[ps.tier] ?? '')}
                >
                  {ps.tier}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button asChild size="lg" className="w-full">
        <Link href="/schools">View All {totalCount} Schools →</Link>
      </Button>
      <p className="text-muted-foreground text-xs">
        You can re-run the Match Engine anytime from your profile.
      </p>
    </div>
  )
}
