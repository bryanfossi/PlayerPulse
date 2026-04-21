'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlayerSchool } from '@/types/app'

interface Props {
  ps: Pick<
    PlayerSchool,
    | 'overall_score'
    | 'geo_score'
    | 'acad_score'
    | 'level_score'
    | 'need_score'
    | 'pt_score'
    | 'tuition_score'
    | 'merit_value_score'
    | 'acad_note'
    | 'level_note'
    | 'pt_note'
    | 'merit_aid_potential'
    | 'merit_aid_confidence'
    | 'estimated_merit_aid'
    | 'merit_aid_note'
    | 'first_year_opportunity'
    | 'roster_depth'
    | 'player_level_band'
    | 'roster_level_band'
    | 'distance_miles'
  >
  defaultOpen?: boolean
}

const SCORE_BARS: { label: string; key: keyof Props['ps']; max: number; color: string }[] = [
  { label: 'Geo', key: 'geo_score', max: 15, color: 'bg-sky-500' },
  { label: 'Academic', key: 'acad_score', max: 20, color: 'bg-violet-500' },
  { label: 'Level Fit', key: 'level_score', max: 25, color: 'bg-emerald-500' },
  { label: 'Roster Need', key: 'need_score', max: 25, color: 'bg-amber-500' },
  { label: 'PT Opportunity', key: 'pt_score', max: 15, color: 'bg-rose-500' },
  { label: 'Tuition', key: 'tuition_score', max: 10, color: 'bg-indigo-400' },
  { label: 'Merit Value', key: 'merit_value_score', max: 10, color: 'bg-orange-400' },
]

export function ScoreBreakdown({ ps, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>Score Breakdown</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Score bars */}
          <div className="space-y-2">
            {SCORE_BARS.map(({ label, key, max, color }) => {
              const val = ps[key] as number | null
              const pct = val != null ? Math.round((val / max) * 100) : 0
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium tabular-nums">
                      {val ?? '–'}<span className="text-muted-foreground">/{max}</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-border pt-3 space-y-2">
            {/* Band info */}
            {(ps.player_level_band || ps.roster_level_band) && (
              <div className="flex gap-4 text-xs">
                {ps.player_level_band && (
                  <span className="text-muted-foreground">
                    Player Band: <span className="font-semibold text-foreground">{ps.player_level_band}</span>
                  </span>
                )}
                {ps.roster_level_band && (
                  <span className="text-muted-foreground">
                    Roster Band: <span className="font-semibold text-foreground">{ps.roster_level_band}</span>
                  </span>
                )}
              </div>
            )}

            {/* PT opportunity */}
            {ps.first_year_opportunity && (
              <p className="text-xs text-muted-foreground">
                Year-1 Opportunity: <span className="font-medium text-foreground">{ps.first_year_opportunity}</span>
                {ps.roster_depth && ` (Depth: ${ps.roster_depth})`}
              </p>
            )}

            {/* Notes */}
            {ps.level_note && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Level: </span>{ps.level_note}
              </p>
            )}
            {ps.acad_note && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Academics: </span>{ps.acad_note}
              </p>
            )}
            {ps.pt_note && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">PT: </span>{ps.pt_note}
              </p>
            )}

            {/* Merit aid */}
            {ps.merit_aid_potential && (
              <div className="rounded-md bg-muted/50 p-2 space-y-1">
                <p className="text-xs font-medium">Merit Aid</p>
                <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                  <span>Potential: <span className="font-medium text-foreground">{ps.merit_aid_potential}</span></span>
                  {ps.estimated_merit_aid && (
                    <span>Est: <span className="font-medium text-foreground">{ps.estimated_merit_aid}</span></span>
                  )}
                  {ps.merit_aid_confidence && (
                    <span>Confidence: <span className="font-medium text-foreground">{ps.merit_aid_confidence}</span></span>
                  )}
                </div>
                {ps.merit_aid_note && (
                  <p className="text-xs text-muted-foreground">{ps.merit_aid_note}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
