import { createServiceClient } from '../src/lib/supabase/server'

async function main() {
  const c = createServiceClient()
  const untyped = c as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{ data: { content: string } | null; error: { message?: string } | null }>
        }
      }
    }
  }
  const slugs = [
    'how-to-get-recruited-by-stanford-university-for-soccer',
    'how-to-get-recruited-by-duke-university-for-basketball',
    'how-to-email-a-college-basketball-coach-templates-that-actually-work',
  ]
  for (const slug of slugs) {
    const { data, error } = await untyped.from('blog_posts').select('content').eq('slug', slug).maybeSingle()
    if (error || !data) {
      console.log(`${slug}: not found / error`)
      continue
    }
    const c = data.content
    const flags = {
      mentionsFree: /\$0|free to start|free tier/i.test(c),
      mentionsStarter: /\$9\.?99/i.test(c),
      mentionsPro: /\$19\.?99/i.test(c),
      mentionsNCSA: /NCSA/.test(c),
      mentionsSportsRecruits: /SportsRecruits/i.test(c),
      mentionsRegister: /fuse-id\.online\/register/i.test(c),
    }
    const passed = Object.values(flags).every(Boolean)
    console.log(`${passed ? '✓' : '✗'} ${slug}`)
    console.log(`   ${JSON.stringify(flags)}`)
    console.log(`   content length: ${c.length} chars`)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
