import { createServiceClient } from '../src/lib/supabase/server'

async function main() {
  const c = createServiceClient()
  const untyped = c as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{ data: { content: string } | null }>
        }
      }
    }
  }
  const r = await untyped
    .from('blog_posts')
    .select('content')
    .eq('slug', 'how-to-get-recruited-by-stanford-university-for-soccer')
    .maybeSingle()
  if (!r.data) {
    console.log('not found')
    return
  }
  const content = r.data.content
  // Find the FUSE-ID / pricing closing block by locating the first occurrence
  // of "$9.99" and printing ~600 chars around it.
  const idx = content.indexOf('$9.99')
  if (idx < 0) {
    console.log('no $9.99 found')
    return
  }
  const from = Math.max(0, idx - 400)
  const to = Math.min(content.length, idx + 700)
  console.log('—— Pricing section excerpt ——')
  console.log(content.slice(from, to))
}
main().catch((e) => { console.error(e); process.exit(1) })
