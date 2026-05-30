/**
 * Bulk content seeder for the FUSE-ID blog.
 *
 * Generates 40 posts total — 10 per sport (5 from Pool A, 5 from Pool B).
 * Reuses the production postGenerator helpers (so prompts, tool-call
 * serialization, slug-uniqueness, and DB inserts match what the daily cron
 * will produce).
 *
 * Usage:
 *   unset ANTHROPIC_API_KEY   # if shell has a stale empty value
 *   npx tsx --env-file=.env.local scripts/bulk-generate-posts.ts
 *
 * Env vars (same as the cron route):
 *   ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Notes:
 *   - Runs jobs in batches of CONCURRENCY in parallel.
 *   - Per-post failures are logged but do not abort the run.
 *   - Each post is inserted with published_at = now() so it is immediately
 *     visible on /blog and /blog/[slug].
 */

import {
  buildTipsPrompt,
  fillTopicTemplate,
  generateOnePost,
  POOL_A_TOPICS,
  POOL_B_TOPICS,
} from '../src/lib/blog/postGenerator'
import { ACTIVE_SPORTS, type SportSlug } from '../src/lib/blog/posts'

const TOPICS_PER_POOL_PER_SPORT = 5
const CONCURRENCY = 4

type JobResult = Awaited<ReturnType<typeof generateOnePost>>

interface Job {
  sport: SportSlug
  pool: 'A' | 'B'
  index: number
  label: string
}

function buildJobs(): Job[] {
  const jobs: Job[] = []
  for (const sport of ACTIVE_SPORTS) {
    for (let i = 0; i < TOPICS_PER_POOL_PER_SPORT; i++) {
      const topic = fillTopicTemplate(POOL_A_TOPICS[i], sport)
      jobs.push({ sport, pool: 'A', index: i, label: `${sport}/A#${i + 1} (${topic})` })
    }
    for (let i = 0; i < TOPICS_PER_POOL_PER_SPORT; i++) {
      const topic = fillTopicTemplate(POOL_B_TOPICS[i], sport)
      jobs.push({ sport, pool: 'B', index: i, label: `${sport}/B#${i + 1} (${topic})` })
    }
  }
  return jobs
}

async function runJob(job: Job): Promise<JobResult> {
  const templates = job.pool === 'A' ? POOL_A_TOPICS : POOL_B_TOPICS
  const topic = fillTopicTemplate(templates[job.index], job.sport)
  return generateOnePost({
    sport: job.sport,
    prompt: buildTipsPrompt(job.sport, topic),
  })
}

interface Settled {
  job: Job
  result: JobResult
}

function fmtElapsed(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[bulk] ANTHROPIC_API_KEY not set — load .env.local with --env-file=.env.local')
    process.exit(1)
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SECRET_KEY) {
    console.error('[bulk] SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) not set')
    process.exit(1)
  }

  const jobs = buildJobs()
  const totalBatches = Math.ceil(jobs.length / CONCURRENCY)
  const startTime = Date.now()

  console.log(`[bulk] starting — ${jobs.length} posts in ${totalBatches} batches of ${CONCURRENCY}`)
  console.log(`[bulk] sports: ${ACTIVE_SPORTS.join(', ')}`)
  console.log(`[bulk] per sport: ${TOPICS_PER_POOL_PER_SPORT} Pool A + ${TOPICS_PER_POOL_PER_SPORT} Pool B\n`)

  const settled: Settled[] = []

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const from = batchIdx * CONCURRENCY
    const batch = jobs.slice(from, from + CONCURRENCY)
    const batchStart = Date.now()

    console.log(`──── batch ${batchIdx + 1}/${totalBatches} (jobs ${from + 1}-${from + batch.length}) ────`)
    for (const j of batch) console.log(`  → ${j.label}`)

    const batchResults = await Promise.allSettled(batch.map(runJob))
    batchResults.forEach((s, i) => {
      const job = batch[i]
      let result: JobResult
      if (s.status === 'fulfilled') {
        result = s.value
      } else {
        result = {
          sport: job.sport,
          status: 'error',
          reason: s.reason instanceof Error ? s.reason.message : String(s.reason),
        }
      }
      const tag = result.status === 'ok' ? '✓' : '✗'
      const detail =
        result.status === 'ok'
          ? `${result.title} → /blog/${result.slug}`
          : `FAILED: ${result.reason}`
      console.log(`  ${tag} ${job.label}\n      ${detail}`)
      settled.push({ job, result })
    })

    console.log(`  (batch took ${fmtElapsed(Date.now() - batchStart)})\n`)
  }

  const okCount = settled.filter((s) => s.result.status === 'ok').length
  const failCount = settled.length - okCount

  console.log('═════════════════════════════════════════════════════════════')
  console.log(`[bulk] DONE in ${fmtElapsed(Date.now() - startTime)}`)
  console.log(`[bulk] succeeded: ${okCount}/${settled.length}`)
  if (failCount > 0) {
    console.log(`[bulk] failed:    ${failCount}/${settled.length}`)
    const bySport: Record<string, { ok: number; fail: number }> = {}
    for (const s of settled) {
      const k = s.job.sport
      bySport[k] ??= { ok: 0, fail: 0 }
      if (s.result.status === 'ok') bySport[k].ok += 1
      else bySport[k].fail += 1
    }
    console.log('\n[bulk] tally by sport:')
    for (const [sport, counts] of Object.entries(bySport)) {
      console.log(`  ${sport.padEnd(11)} ok ${counts.ok}  fail ${counts.fail}`)
    }
    console.log('\n[bulk] failure details:')
    for (const s of settled) {
      if (s.result.status !== 'ok') {
        console.log(`  ✗ ${s.job.label}\n      ${s.result.reason}`)
      }
    }
  }
  console.log('═════════════════════════════════════════════════════════════')

  process.exit(failCount === settled.length ? 1 : 0)
}

main().catch((err) => {
  console.error('[bulk] unhandled error:', err)
  process.exit(1)
})
