import { createServiceClient } from '../src/lib/supabase/server'

async function main() {
  const c = createServiceClient()
  const untyped = c as unknown as {
    from: (t: string) => {
      select: (
        cols: string,
        opts?: { head?: boolean; count?: 'exact' }
      ) => Promise<{ data: unknown; count: number | null; error: { message?: string } | null }>
    }
  }

  const bp = await untyped.from('blog_posts').select('id', { head: true, count: 'exact' })
  if (bp.error) {
    console.log('blog_posts: MISSING —', bp.error.message ?? bp.error)
  } else {
    console.log('blog_posts: OK, current rows =', bp.count)
  }

  const cs = await untyped.from('cron_state').select('key,value')
  if (cs.error) {
    console.log('cron_state: MISSING —', cs.error.message ?? cs.error)
  } else {
    console.log('cron_state:', cs.data)
  }
}

main().catch((e) => {
  console.error('probe failed:', e)
  process.exit(1)
})
