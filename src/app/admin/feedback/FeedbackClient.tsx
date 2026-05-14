'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Loader2, ExternalLink, RefreshCw, Bug, Lightbulb, HelpCircle, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'

export type FeedbackStatus = 'new' | 'read' | 'responded' | 'archived'
export type StatusFilter = 'all' | FeedbackStatus
export type FeedbackType = 'bug' | 'feature' | 'question' | 'other'
export type TypeFilter = 'all' | FeedbackType

export interface FeedbackRow {
  id: string
  user_id: string | null
  email: string | null
  page_url: string | null
  user_agent: string | null
  message: string
  status: FeedbackStatus
  type: FeedbackType
  created_at: string
}

const STATUSES: FeedbackStatus[] = ['new', 'read', 'responded', 'archived']
const STATUS_FILTERS: StatusFilter[] = ['all', 'new', 'read', 'responded', 'archived']
const TYPE_FILTERS: TypeFilter[] = ['all', 'bug', 'feature', 'question', 'other']

const STATUS_STYLES: Record<FeedbackStatus, string> = {
  new:       'bg-red-500/10 text-red-300 border-red-500/30',
  read:      'bg-amber-500/10 text-amber-300 border-amber-500/30',
  responded: 'bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/30',
  archived:  'bg-white/5 text-muted-foreground border-white/10',
}

const TYPE_STYLES: Record<FeedbackType, string> = {
  bug:      'bg-red-500/10 text-red-300 border-red-500/30',
  feature:  'bg-amber-500/10 text-amber-300 border-amber-500/30',
  question: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  other:    'bg-white/5 text-muted-foreground border-white/10',
}

const TYPE_ICONS: Record<FeedbackType, typeof Bug> = {
  bug: Bug,
  feature: Lightbulb,
  question: HelpCircle,
  other: MoreHorizontal,
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface Props {
  initialRows: FeedbackRow[]
  statusFilter: StatusFilter
  typeFilter: TypeFilter
  statusCounts: Record<StatusFilter, number>
  typeCounts: Record<TypeFilter, number>
}

export function FeedbackClient({
  initialRows,
  statusFilter,
  typeFilter,
  statusCounts,
  typeCounts,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [rows, setRows] = useState<FeedbackRow[]>(initialRows)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [refreshing, startRefresh] = useTransition()

  function applyFilter(key: 'status' | 'type', value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') params.delete(key)
    else params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  async function updateStatus(id: string, status: FeedbackStatus) {
    setPendingId(id)
    // Optimistic update
    const prev = rows
    setRows((r) => r.map((row) => (row.id === id ? { ...row, status } : row)))
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error ?? 'Could not update status')
        setRows(prev)
        return
      }
      toast.success('Updated')
      // Re-trigger server fetch so counts stay in sync
      startRefresh(() => router.refresh())
    } catch {
      toast.error('Network error')
      setRows(prev)
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Type filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mr-1">
          Type
        </span>
        {TYPE_FILTERS.map((f) => {
          const active = f === typeFilter
          return (
            <button
              key={f}
              onClick={() => applyFilter('type', f)}
              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors capitalize ${
                active
                  ? 'bg-[#4ADE80] border-[#4ADE80] text-[#0F1120]'
                  : 'bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:border-white/20'
              }`}
            >
              {f}
              <span className={`ml-1.5 text-[10px] ${active ? 'text-[#0F1120]/70' : 'text-muted-foreground/60'}`}>
                {typeCounts[f] ?? 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* Status filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mr-1">
          Status
        </span>
        {STATUS_FILTERS.map((f) => {
          const active = f === statusFilter
          return (
            <button
              key={f}
              onClick={() => applyFilter('status', f)}
              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors capitalize ${
                active
                  ? 'bg-[#4ADE80] border-[#4ADE80] text-[#0F1120]'
                  : 'bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:border-white/20'
              }`}
            >
              {f}
              <span className={`ml-1.5 text-[10px] ${active ? 'text-[#0F1120]/70' : 'text-muted-foreground/60'}`}>
                {statusCounts[f] ?? 0}
              </span>
            </button>
          )
        })}

        <button
          onClick={() => startRefresh(() => router.refresh())}
          disabled={refreshing}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-muted-foreground hover:text-white hover:border-white/20 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-12 text-center text-sm text-muted-foreground">
          No feedback {statusFilter !== 'all' || typeFilter !== 'all'
            ? `matches the current filters`
            : `yet`}.
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/10">
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">When</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">From</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Message</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Page</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isPending = pendingId === row.id
                const TypeIcon = TYPE_ICONS[row.type]
                return (
                  <tr key={row.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors align-top">
                    <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(row.created_at)}
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize ${TYPE_STYLES[row.type]}`}
                      >
                        <TypeIcon className="w-3 h-3" />
                        {row.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {row.email ? (
                        <a
                          href={`mailto:${row.email}`}
                          className="text-[#4ADE80] hover:underline"
                        >
                          {row.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground/60">(no email)</span>
                      )}
                      {row.user_id && (
                        <div className="text-[10px] text-muted-foreground/60 font-mono mt-0.5 truncate max-w-[12rem]">
                          {row.user_id}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs max-w-[24rem]">
                      <p className="whitespace-pre-wrap break-words">{row.message}</p>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {row.page_url ? (
                        <Link
                          href={new URL(row.page_url, 'https://fuse-id.online').pathname}
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-white transition-colors"
                          title={row.page_url}
                        >
                          {new URL(row.page_url, 'https://fuse-id.online').pathname}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize ${STATUS_STYLES[row.status]}`}
                        >
                          {row.status}
                        </span>
                        <select
                          value={row.status}
                          onChange={(e) => updateStatus(row.id, e.target.value as FeedbackStatus)}
                          disabled={isPending}
                          className="bg-[#1A1F38] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#4ADE80]/50 disabled:opacity-60"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-[#1A1F38]">
                              {s}
                            </option>
                          ))}
                        </select>
                        {isPending && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        Showing up to 200 rows · counts reflect the most recent 1,000
      </p>
    </div>
  )
}
