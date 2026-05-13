import { createServiceClient } from '@/lib/supabase/server'
import { FeedbackClient, type FeedbackRow, type StatusFilter } from './FeedbackClient'

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

const STATUSES: FeedbackRow['status'][] = ['new', 'read', 'responded', 'archived']

function parseFilter(raw: string | undefined): StatusFilter {
  if (!raw || raw === 'all') return 'all'
  if (STATUSES.includes(raw as FeedbackRow['status'])) return raw as StatusFilter
  return 'all'
}

export default async function AdminFeedbackPage({ searchParams }: PageProps) {
  const { status: statusParam } = await searchParams
  const filter = parseFilter(statusParam)

  const service = createServiceClient()
  // feedback isn't in the generated database.ts types, so go untyped here.
  const untyped = service as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        order: (col: string, opts: { ascending: boolean }) => {
          limit: (n: number) => Promise<{ data: FeedbackRow[] | null; error: unknown }>
          eq: (col: string, val: string) => {
            limit: (n: number) => Promise<{ data: FeedbackRow[] | null; error: unknown }>
          }
        }
      }
    }
  }

  const baseQuery = untyped
    .from('feedback')
    .select('id, user_id, email, page_url, user_agent, message, status, created_at')
    .order('created_at', { ascending: false })

  const { data: rows, error } =
    filter === 'all'
      ? await baseQuery.limit(200)
      : await baseQuery.eq('status', filter).limit(200)

  // Count totals per status for the filter chips
  const { data: allForCounts } = await untyped
    .from('feedback')
    .select('id, user_id, email, page_url, user_agent, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(1000)
  const counts: Record<FeedbackRow['status'] | 'all', number> = {
    all: allForCounts?.length ?? 0,
    new: 0,
    read: 0,
    responded: 0,
    archived: 0,
  }
  for (const r of allForCounts ?? []) {
    if (r.status in counts) counts[r.status] += 1
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight">Feedback</h1>
        <p className="text-sm text-muted-foreground">
          Every submission from the floating feedback button. Update status as you triage.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Could not load feedback: {String((error as Error).message ?? error)}
        </div>
      ) : (
        <FeedbackClient initialRows={rows ?? []} filter={filter} counts={counts} />
      )}
    </div>
  )
}
