import { createServiceClient } from '../src/lib/supabase/server'

async function main() {
  const c = createServiceClient()
  const untyped = c as unknown as {
    from: (t: string) => {
      select: (cols: string, opts?: { count?: 'exact'; head?: boolean }) => Promise<{
        data: { sport: string; post_type: string }[] | null
        count: number | null
        error: { message?: string } | null
      }>
    }
  }
  const r = await untyped.from('blog_posts').select('sport, post_type', { count: 'exact' })
  if (r.error) {
    console.log('query failed:', r.error)
    process.exit(1)
  }
  console.log('total rows:', r.count)
  const byKey: Record<string, number> = {}
  for (const row of r.data ?? []) {
    const k = `${row.sport}/${row.post_type}`
    byKey[k] = (byKey[k] ?? 0) + 1
  }
  console.log('breakdown:')
  for (const [k, v] of Object.entries(byKey).sort()) {
    console.log(`  ${k.padEnd(28)} ${v}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
