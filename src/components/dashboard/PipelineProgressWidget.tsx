import { BarChart3 } from 'lucide-react'

const STAGES = [
  { key: 'researching', label: 'Research' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'interested', label: 'Interested' },
  { key: 'campus_visit', label: 'Visit' },
  { key: 'offer_received', label: 'Offer' },
  { key: 'committed', label: 'Committed' },
] as const

interface Props {
  statusCounts: Record<string, number>
  total: number
}

export function PipelineProgressWidget({ statusCounts, total }: Props) {
  if (total === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pipeline</p>
      </div>

      <div className="space-y-2">
        {STAGES.map((stage) => {
          const count = statusCounts[stage.key] ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={stage.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{stage.label}</span>
                <span className="text-[10px] tabular-nums text-muted-foreground">{count}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-1.5 rounded-full bg-[#4ADE80] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
