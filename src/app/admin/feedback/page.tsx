import { createServiceClient } from '@/lib/supabase/server'
import {
  FeedbackClient,
  type FeedbackRow,
  type StatusFilter,
  type TypeFilter,
} from './FeedbackClient'

interface PageProps {
  searchParams: Promise<{ status?: string; type?: string }>
}

const STATUSES: FeedbackRow['status'][] = ['new', 'read', 'responded', 'archived']
const TYPES: FeedbackRow['type'][] = ['bug', 'feature', 'question', 'other']

function parseStatus(raw: string | undefined): StatusFilter {
  if (!raw || raw === 'all') return 'all'
  if (STATUSES.includes(raw as FeedbackRow['status'])) return raw as StatusFilter
  return 'all'
}

function parseType(raw: string | undefined): TypeFilter {
  if (!raw || raw === 'all') return 'all'
  if (TYPES.includes(raw as FeedbackRow['type'])) return raw as TypeFilter
  return 'all'
}

export default async function AdminFeedbackPage({ searchParams }: PageProps) {
  const { status: statusParam, type: typeParam } = await searchParams
  const statusFilter = parseStatus(statusParam)
  const typeFilter = parseType(typeParam)

  const service = createServiceClient()
  // feedback isn't in the generated database.ts types, so go untyped here.
  type Query = {
    eq: (col: string, val: string) => Query
    limit: (n: number) => Promise<{ data: FeedbackRow[] | null; error: unknown }>
  }
  const untyped = service as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        order: (col: string, opts: { ascending: boolean }) => Query
      }
    }
  }

  let q: Query = untyped
    .from('feedback')
    .select('id, user_id, email, page_url, user_agent, message, status, type, created_at')
    .order('created_at', { ascending: false })
  if (statusFilter !== 'all') q = q.eq('status', statusFilter)
  if (typeFilter !== 'all') q = q.eq('type', typeFilter)
  const { data: rows, error } = await q.limit(200)

  // Counts across the most recent 1000 rows (for filter chip badges)
  const { data: allForCounts } = await untyped
    .from('feedback')
    .select('id, user_id, email, page_url, user_agent, message, status, type, created_at')
    .order('created_at', { ascending: false })
    .limit(1000)

  const statusCounts: Record<StatusFilter, number> = {
    all: allForCounts?.length ?? 0,
    new: 0,
    read: 0,
    responded: 0,
    archived: 0,
  }
  const typeCounts: Record<TypeFilter, number> = {
    all: allForCounts?.length ?? 0,
    bug: 0,
    feature: 0,
    question: 0,
    other: 0,
  }
  for (const r of allForCounts ?? []) {
    if (r.status in statusCounts) statusCounts[r.status] += 1
    if (r.type in typeCounts) typeCounts[r.type] += 1
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight">Feedback</h1>
        <p className="text-sm text-muted-foreground">
          Every submission from the floating feedback button. Filter by type and status as you triage.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Could not load feedback: {String((error as Error).message ?? error)}
        </div>
      ) : (
        <FeedbackClient
          initialRows={rows ?? []}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          statusCounts={statusCounts}
          typeCounts={typeCounts}
        />
      )}
    </div>
  )
}
