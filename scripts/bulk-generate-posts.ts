/**
 * One-time bulk content seeder for the FUSE-ID blog.
 *
 * Generates 40 posts total — 10 per sport (5 college-specific + 5 tips/guide).
 * Reuses the production postGenerator helpers (so prompts, JSON parsing,
 * slug-uniqueness, and DB inserts match what the daily cron will produce).
 *
 * Usage:
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
  buildCollegePrompt,
  buildTipsPrompt,
  fillTopicTemplate,
  generateOnePost,
  TIPS_TOPICS,
} from '../src/lib/blog/postGenerator'
import { getCollegeForSport } from '../src/lib/colleges'
import { ACTIVE_SPORTS, type SportSlug } from '../src/lib/blog/posts'

const SCHOOLS_PER_SPORT = 5
const TOPICS_PER_SPORT = 5
const CONCURRENCY = 4

type JobResult = Awaited<ReturnType<typeof generateOnePost>>

interface Job {
  sport: SportSlug
  type: 'college' | 'tips'
  index: number
  label: string
}

function buildJobs(): Job[] {
  const jobs: Job[] = []
  for (const sport of ACTIVE_SPORTS) {
    for (let i = 0; i < SCHOOLS_PER_SPORT; i++) {
      const school = getCollegeForSport(sport, i)
      jobs.push({ sport, type: 'college', index: i, label: `${sport}/college #${i + 1} (${school})` })
    }
    for (let i = 0; i < TOPICS_PER_SPORT; i++) {
      const topic = fillTopicTemplate(TIPS_TOPICS[i], sport)
      jobs.push({ sport, type: 'tips', index: i, label: `${sport}/tips #${i + 1} (${topic})` })
    }
  }
  return jobs
}

async function runJob(job: Job): Promise<JobResult> {
  if (job.type === 'college') {
    const school = getCollegeForSport(job.sport, job.index)
    const prompt = buildCollegePrompt(job.sport, school)
    return generateOnePost({
      sport: job.sport,
      postType: 'college_specific',
      prompt,
      schoolName: school,
    })
  }
  const topic = fillTopicTemplate(TIPS_TOPICS[job.index], job.sport)
  const prompt = buildTipsPrompt(job.sport, topic)
  return generateOnePost({
    sport: job.sport,
    postType: 'tips_guide',
    prompt,
    schoolName: null,
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
  console.log(`[bulk] per sport: ${SCHOOLS_PER_SPORT} college-specific + ${TOPICS_PER_SPORT} tips/guide\n`)

  const settled: Settled[] = []

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const from = batchIdx * CONCURRENCY
    const batch = jobs.slice(from, from + CONCURRENCY)
    const batchStart = Date.now()

    console.log(`──── batch ${batchIdx + 1}/${totalBatches} (jobs ${from + 1}-${from + batch.length}) ────`)
    for (const j of batch) {
      console.log(`  → ${j.label}`)
    }

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

    const batchMs = Date.now() - batchStart
    console.log(`  (batch took ${fmtElapsed(batchMs)})\n`)
  }

  // Summary
  const okCount = settled.filter((s) => s.result.status === 'ok').length
  const failCount = settled.length - okCount

  console.log('═════════════════════════════════════════════════════════════')
  console.log(`[bulk] DONE in ${fmtElapsed(Date.now() - startTime)}`)
  console.log(`[bulk] succeeded: ${okCount}/${settled.length}`)
  if (failCount > 0) {
    console.log(`[bulk] failed:    ${failCount}/${settled.length}`)
    console.log('\n[bulk] failures by sport:')
    const bySport: Record<string, { ok: number; fail: number }> = {}
    for (const s of settled) {
      const key = s.job.sport
      bySport[key] ??= { ok: 0, fail: 0 }
      if (s.result.status === 'ok') bySport[key].ok += 1
      else bySport[key].fail += 1
    }
    for (const [sport, counts] of Object.entries(bySport)) {
      console.log(`  ${sport.padEnd(11)} ok ${counts.ok}  fail ${counts.fail}`)
    }
    console.log('\n[bulk] failure details:')
    for (const s of settled) {
      if (s.result.status !== 'ok') {
        console.log(`  ✗ ${s.job.label}`)
        console.log(`      ${s.result.reason}`)
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
