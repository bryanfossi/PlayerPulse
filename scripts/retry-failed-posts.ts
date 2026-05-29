/**
 * Retry the 10 posts that failed during the first bulk run.
 *
 * The original run used text-based JSON output, which intermittently failed
 * with unescaped newlines / accidental markdown fences. postGenerator has
 * since been switched to forced tool-call output, so these should now land.
 *
 * Usage:
 *   unset ANTHROPIC_API_KEY   # if shell has an empty stale value
 *   npx tsx --env-file=.env.local scripts/retry-failed-posts.ts
 */

import {
  buildCollegePrompt,
  buildTipsPrompt,
  fillTopicTemplate,
  generateOnePost,
  TIPS_TOPICS,
} from '../src/lib/blog/postGenerator'
import { getCollegeForSport } from '../src/lib/colleges'
import type { SportSlug } from '../src/lib/blog/posts'

type JobResult = Awaited<ReturnType<typeof generateOnePost>>

interface Job {
  sport: SportSlug
  type: 'college' | 'tips'
  index: number
  label: string
}

// The 10 jobs that failed in the first run. Indices match getCollegeForSport
// and TIPS_TOPICS array positions (zero-based).
const FAILED_JOBS: Job[] = [
  // Soccer
  { sport: 'soccer',     type: 'college', index: 0, label: 'soccer/college #1 (Stanford)' },
  { sport: 'soccer',     type: 'college', index: 1, label: 'soccer/college #2 (UCLA)' },
  { sport: 'soccer',     type: 'college', index: 3, label: 'soccer/college #4 (Notre Dame)' },
  { sport: 'soccer',     type: 'college', index: 4, label: 'soccer/college #5 (Duke)' },
  { sport: 'soccer',     type: 'tips',    index: 3, label: 'soccer/tips #4 (Recruiting Timeline)' },
  // Basketball
  { sport: 'basketball', type: 'college', index: 0, label: 'basketball/college #1 (Duke)' },
  { sport: 'basketball', type: 'tips',    index: 1, label: 'basketball/tips #2 (Email a Coach)' },
  { sport: 'basketball', type: 'tips',    index: 3, label: 'basketball/tips #4 (Recruiting Timeline)' },
  { sport: 'basketball', type: 'tips',    index: 4, label: 'basketball/tips #5 (NCAA/NAIA/NJCAA)' },
  // Volleyball
  { sport: 'volleyball', type: 'college', index: 1, label: 'volleyball/college #2 (Stanford)' },
]

const CONCURRENCY = 4

async function runJob(job: Job): Promise<JobResult> {
  if (job.type === 'college') {
    const school = getCollegeForSport(job.sport, job.index)
    return generateOnePost({
      sport: job.sport,
      postType: 'college_specific',
      prompt: buildCollegePrompt(job.sport, school),
      schoolName: school,
    })
  }
  const topic = fillTopicTemplate(TIPS_TOPICS[job.index], job.sport)
  return generateOnePost({
    sport: job.sport,
    postType: 'tips_guide',
    prompt: buildTipsPrompt(job.sport, topic),
    schoolName: null,
  })
}

function fmtElapsed(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[retry] ANTHROPIC_API_KEY not set — run with --env-file=.env.local and unset stale system env')
    process.exit(1)
  }

  const totalBatches = Math.ceil(FAILED_JOBS.length / CONCURRENCY)
  const startTime = Date.now()

  console.log(`[retry] re-running ${FAILED_JOBS.length} previously-failed posts in ${totalBatches} batches of ${CONCURRENCY}\n`)

  const results: { job: Job; result: JobResult }[] = []

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const from = batchIdx * CONCURRENCY
    const batch = FAILED_JOBS.slice(from, from + CONCURRENCY)
    const batchStart = Date.now()

    console.log(`──── batch ${batchIdx + 1}/${totalBatches} ────`)
    for (const j of batch) console.log(`  → ${j.label}`)

    const settled = await Promise.allSettled(batch.map(runJob))
    settled.forEach((s, i) => {
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
      const detail = result.status === 'ok' ? `${result.title} → /blog/${result.slug}` : `FAILED: ${result.reason}`
      console.log(`  ${tag} ${job.label}\n      ${detail}`)
      results.push({ job, result })
    })

    console.log(`  (batch took ${fmtElapsed(Date.now() - batchStart)})\n`)
  }

  const okCount = results.filter((r) => r.result.status === 'ok').length
  const failCount = results.length - okCount

  console.log('═════════════════════════════════════════════════════════════')
  console.log(`[retry] DONE in ${fmtElapsed(Date.now() - startTime)}`)
  console.log(`[retry] succeeded: ${okCount}/${results.length}`)
  console.log(`[retry] failed:    ${failCount}/${results.length}`)
  if (failCount > 0) {
    console.log('\n[retry] still failing:')
    for (const r of results) {
      if (r.result.status !== 'ok') {
        console.log(`  ✗ ${r.job.label}\n      ${r.result.reason}`)
      }
    }
  }
  console.log('═════════════════════════════════════════════════════════════')

  process.exit(failCount > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('[retry] unhandled error:', err)
  process.exit(1)
})
