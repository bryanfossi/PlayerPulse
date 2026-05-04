import { TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Props {
  /** Array of YYYY-MM-DD strings for each completed action over the lookback window. */
  completedDates: string[]
  /** How many days to show. Default 90. */
  days?: number
}

/**
 * Bar chart showing the count of completed actions per day for the last N days.
 * Hand-rolled SVG — no chart library. Brand-spec compliant: no gradients,
 * no shadows, just sharp bars.
 */
export function ActionsChart({ completedDates, days = 90 }: Props) {
  // Build a count-by-day map
  const counts = new Map<string, number>()
  for (const d of completedDates) {
    counts.set(d, (counts.get(d) ?? 0) + 1)
  }

  // Build the ordered array of (date, count) for the last N days
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const series: Array<{ date: string; count: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    series.push({ date: key, count: counts.get(key) ?? 0 })
  }

  const total = series.reduce((sum, s) => sum + s.count, 0)
  const maxCount = Math.max(1, ...series.map((s) => s.count))

  // Compute axis labels — pick 4 evenly spaced ticks
  const tickIndices = [0, Math.floor(days * 0.33), Math.floor(days * 0.66), days - 1]
  const tickLabels = tickIndices.map((i) => {
    const d = new Date(series[i].date + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  // Last 7 days vs previous 7 days — for trend indicator
  const last7 = series.slice(-7).reduce((s, x) => s + x.count, 0)
  const prev7 = series.slice(-14, -7).reduce((s, x) => s + x.count, 0)
  const trend = prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 100)

  return (
    <div className="rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#9CA3AF' }}>
            Actions completed
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black tabular-nums">{total}</span>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>last {days} days</span>
          </div>
        </div>
        {last7 > 0 && (
          <div className="text-right">
            <p className="text-[10px]" style={{ color: '#9CA3AF' }}>last 7 days</p>
            <p className="text-sm font-bold tabular-nums">{last7}</p>
            {trend !== 0 && Math.abs(trend) < 1000 && (
              <p className="text-[10px] inline-flex items-center gap-0.5" style={{ color: trend > 0 ? '#4ADE80' : '#9CA3AF' }}>
                <TrendingUp className="w-3 h-3" style={{ transform: trend < 0 ? 'rotate(180deg)' : undefined }} />
                {trend > 0 ? '+' : ''}{trend}%
              </p>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="px-4 pb-2">
        {total === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              No actions completed yet.{' '}
              <Link href="/actions" className="hover:underline" style={{ color: '#4ADE80' }}>Add one →</Link>
            </p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${days} 60`}
            preserveAspectRatio="none"
            className="w-full h-20"
            role="img"
            aria-label={`${total} actions completed in the last ${days} days`}
          >
            {/* Subtle baseline */}
            <line x1="0" y1="59.5" x2={days} y2="59.5" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
            {series.map((s, i) => {
              const heightPct = (s.count / maxCount) * 100
              const barHeight = Math.max(s.count > 0 ? 2 : 0, (heightPct / 100) * 56)
              return (
                <rect
                  key={s.date}
                  x={i + 0.15}
                  y={60 - barHeight}
                  width={0.7}
                  height={barHeight}
                  fill="#4ADE80"
                  opacity={s.count > 0 ? 0.9 : 0}
                >
                  <title>{`${new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${s.count} ${s.count === 1 ? 'action' : 'actions'}`}</title>
                </rect>
              )
            })}
          </svg>
        )}
      </div>

      {/* X-axis labels */}
      {total > 0 && (
        <div className="flex justify-between px-4 pb-3 pt-1 text-[10px]" style={{ color: '#9CA3AF' }}>
          {tickLabels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
      )}
    </div>
  )
}
