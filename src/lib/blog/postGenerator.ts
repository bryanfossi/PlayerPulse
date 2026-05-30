/**
 * Daily multi-sport blog generator.
 *
 * Runs once per day via the Vercel cron at /api/blog/generate. On each run
 * it produces one post per active sport (soccer, football, basketball,
 * volleyball) using Claude. Calendar day determines which topic pool the
 * day's posts come from:
 *   - even day-of-month → Pool A (recruiting-process topics)
 *   - odd  day-of-month → Pool B (recruiting-tips topics)
 *
 * Both pools persist as post_type = 'tips_guide' (the column is a single-
 * valued holdover from when school-spotlight posts were a separate type).
 *
 * Rotation state lives in the cron_state table (migration 022 + 023):
 *   - pool_a_topic_index → cycles through POOL_A_TOPICS per sport
 *   - pool_b_topic_index → cycles through POOL_B_TOPICS per sport
 *
 * For variety, the per-sport index is offset by the sport's position so
 * the four sports don't all share the same topic on a given day.
 *
 * All 4 sport generations run in parallel via Promise.allSettled so a single
 * sport failure doesn't kill the run.
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages'
import { anthropic } from '@/lib/anthropic'
import { createServiceClient } from '@/lib/supabase/server'
import { ACTIVE_SPORTS, type PostType, type SportSlug } from '@/lib/blog/posts'

// ----------------------------- Types -----------------------------

interface ClaudeBlogJson {
  title: string
  slug: string
  content: string
  excerpt: string
  meta_description: string
  keywords: string[]
}

interface PerSportResult {
  sport: SportSlug
  status: 'ok' | 'error'
  slug?: string
  title?: string
  reason?: string
}

export type TopicPool = 'A' | 'B'

export interface DailyGenerationResult {
  status: 'ok' | 'partial' | 'error'
  post_type: PostType
  pool: TopicPool
  day_number: number
  results: PerSportResult[]
}

// --------------------------- Topic pools --------------------------
//
// Pool A — Recruiting-process topics (replaces the retired college-spotlight
// pool). Even-numbered days draw from this pool.
export const POOL_A_TOPICS = [
  'The Complete {Sport} Recruiting Guide for High School Athletes in {Year}',
  'How Early Should You Start {Sport} Recruiting? A Year-by-Year Timeline',
  'What College {Sport} Coaches Actually Look for in a Recruit',
  "How to Stand Out in {Sport} Recruiting: What Works and What Doesn't",
  'The {Sport} Recruiting Email Guide: How to Write to Coaches at Every Stage',
  'D1 vs D2 vs D3 vs NAIA vs NJCAA {Sport}: Choosing the Right Division',
  'How to Build a {Sport} Recruiting Profile That Gets Coach Responses',
  'College {Sport} Scholarships Explained: What Athletes and Parents Need to Know',
]

// Pool B — Recruiting-tips topics. Odd-numbered days draw from this pool.
export const POOL_B_TOPICS = [
  'Top 10 {Sport} Recruiting Tips for High School Athletes in {Year}',
  'How to Email a College {Sport} Coach: Templates That Actually Work',
  'D1 vs D2 vs D3 {Sport}: Which Division Is Right for You?',
  'The {Sport} Recruiting Timeline: When to Start and What to Do Each Year',
  '{Sport} Recruiting at NCAA, NAIA, and NJCAA: Everything You Need to Know',
  'How to Build a {Sport} Recruiting Profile That Gets Coach Responses',
]

const SPORT_LABEL: Record<SportSlug, string> = {
  soccer: 'Soccer',
  football: 'Football',
  basketball: 'Basketball',
  volleyball: 'Volleyball',
  baseball: 'Baseball',
  lacrosse: 'Lacrosse',
}

// --------------------------- Helpers ------------------------------

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function dayOfMonthUTC(): number {
  return new Date().getUTCDate()
}

function currentYear(): number {
  return new Date().getUTCFullYear()
}

export function fillTopicTemplate(template: string, sport: SportSlug): string {
  return template
    .replaceAll('{Sport}', SPORT_LABEL[sport])
    .replaceAll('{sport}', sport)
    .replaceAll('{Year}', String(currentYear()))
}

// Anthropic tool definition that forces Claude to emit a structured JSON
// payload. Using tool_choice + a typed input_schema eliminates the
// unescaped-newline / accidental-fences failure class entirely — the SDK
// serializes the tool input, so the content string can contain anything
// (including raw markdown newlines) without breaking JSON parsing.
const SUBMIT_POST_TOOL: Tool = {
  name: 'submit_blog_post',
  description:
    'Submit the final SEO-optimized blog post. Call this exactly once with the completed post.',
  input_schema: {
    type: 'object',
    required: ['title', 'slug', 'content', 'excerpt', 'meta_description', 'keywords'],
    properties: {
      title: { type: 'string', description: 'Post title, 60-110 characters preferred.' },
      slug: {
        type: 'string',
        description: 'Kebab-case slug derived from the title. No leading slash. Max 80 chars.',
      },
      content: {
        type: 'string',
        description:
          'Full markdown body of the post. Do NOT include an H1 heading — the title renders separately. Use ## for section headings. 1,200-1,500 words.',
      },
      excerpt: {
        type: 'string',
        description: 'Plain-text excerpt, around 150 chars, no markdown.',
      },
      meta_description: {
        type: 'string',
        description: 'Plain-text meta description, max 150 chars, no markdown.',
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: '5-8 lowercased primary SEO keyword targets.',
        minItems: 5,
        maxItems: 8,
      },
    },
  },
}

// --------------------------- Cron state ---------------------------

type AnyClient = ReturnType<typeof createServiceClient>

function untypedCronState(client: AnyClient) {
  return client as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{ data: { key: string; value: string } | null; error: unknown }>
        }
      }
      upsert: (row: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: unknown }>
    }
  }
}

async function getCronInt(key: string, fallback: number): Promise<number> {
  const service = createServiceClient()
  const { data, error } = await untypedCronState(service)
    .from('cron_state')
    .select('key, value')
    .eq('key', key)
    .maybeSingle()
  if (error || !data) return fallback
  const n = parseInt(data.value, 10)
  return Number.isFinite(n) ? n : fallback
}

async function setCronInt(key: string, value: number): Promise<void> {
  const service = createServiceClient()
  const { error } = await untypedCronState(service)
    .from('cron_state')
    .upsert(
      { key, value: String(value), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
  if (error) {
    console.error('[blog/postGenerator] setCronInt failed for', key, error)
  }
}

// --------------------------- Slug uniqueness ----------------------

function untypedPosts(client: AnyClient) {
  return client as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{ data: { id?: string } | null; error: unknown }>
        }
      }
      insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>
    }
  }
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  const service = createServiceClient()
  let candidate = baseSlug
  let suffix = 2
  while (true) {
    const { data } = await untypedPosts(service)
      .from('blog_posts')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()
    if (!data) return candidate
    candidate = `${baseSlug}-${suffix}`
    suffix += 1
    if (suffix > 50) return `${baseSlug}-${Date.now()}`
  }
}

// --------------------------- Prompts ------------------------------

const SYSTEM_PROMPT = `You are a college recruiting expert writing for FUSE-ID (fuse-id.online), an AI-powered college recruiting CRM for high school athletes (ages 13-18) and their parents.

Write in the tone of a trusted older teammate who has been through recruiting and actually gets it — encouraging, direct, specific. Never corporate, never hyped, never generic. Use concrete examples and second-person voice ("you").

Critical rules:
- Do NOT fabricate statistics, specific GPAs, current coaching staff names, exact roster sizes, or other facts you can't verify. When you need to speak about a school's level or expectations, speak in patterns ("Power 4 academic programs typically expect…", "ACC soccer programs at this level tend to recruit…").
- Use only stats you're confident are widely true. If you need a stat, prefer FUSE-ID's homepage figures (78% of recruits never follow up a second time; 3x more responses with personalized emails; coaches start tracking recruits actively ~6 months in).
- Every post's closing section should naturally cover three things in 2-3 paragraphs without feeling bolted on:
    1. A brief mention of how FUSE-ID specifically helps with the topic of the post.
    2. A matter-of-fact line noting what serious recruiting tools cost — FUSE-ID starts at $0 free, with a $9.99/month Starter tier and a $19.99/month Pro tier, while NCSA runs $99-$200+/month (often with additional consultant packages) and SportsRecruits is priced similarly to NCSA. Frame this as informational ("here's what serious recruiting tools actually cost"), not as a sales pitch. Don't compare with bullet lists or marketing language — write it like one teammate telling another the real numbers.
    3. A soft CTA inviting the reader to start their free FUSE-ID profile at https://fuse-id.online/register.

Output: Call the submit_blog_post tool with the completed post. Do not respond with text — only the tool call. The tool's input schema describes each field; the content field is plain markdown (raw newlines are fine — the tool wraps them safely).`

export function buildTipsPrompt(sport: SportSlug, topic: string): string {
  const sportLabel = SPORT_LABEL[sport]
  return `Write a 1,200–1,500 word SEO-optimized blog post.

Title: ${topic}
Sport: ${sportLabel}

Structure (use ## H2 headings — no H1):
- Intro: hook with a real challenge ${sportLabel.toLowerCase()} recruits face today.
- 4-6 ## sections with practical, actionable content (be specific — list things the reader can do this week, not vague advice).
- Closing section ("How FUSE-ID fits in" or similar): 2-3 short paragraphs covering — in this order — (a) how FUSE-ID helps with the specific topic of this post, (b) a matter-of-fact aside on what serious recruiting tools cost: FUSE-ID is free to start, with paid tiers at $9.99/month (Starter) and $19.99/month (Pro), while NCSA runs $99-$200+/month (often with extra consultant packages) and SportsRecruits is priced similarly — write it conversationally, like one teammate telling another the real numbers, no bullet lists, no marketing language, and (c) a soft CTA inviting the reader to start a free FUSE-ID profile at https://fuse-id.online/register.

Naturally weave in these phrases at least once each (lowercased except where natural):
- "college ${sportLabel.toLowerCase()} recruiting"
- "${sportLabel.toLowerCase()} recruiting tips"
- "how to get recruited for college ${sportLabel.toLowerCase()}"
- division names where relevant ("D1", "D2", "D3", "NAIA", "NJCAA")

Slug should be kebab-case from the title.`
}

// --------------------------- Per-sport generate ---------------------

async function callClaudeStructured(systemPrompt: string, userPrompt: string): Promise<ClaudeBlogJson> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: systemPrompt,
    tools: [SUBMIT_POST_TOOL],
    // Force Claude to emit a submit_blog_post tool call. With tool_choice
    // pinned to this specific tool, the SDK serializes the structured input
    // for us — no JSON parsing required, no risk of unescaped newlines or
    // accidental markdown fences breaking the response.
    tool_choice: { type: 'tool', name: SUBMIT_POST_TOOL.name },
    messages: [{ role: 'user', content: userPrompt }],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use' || toolUse.name !== SUBMIT_POST_TOOL.name) {
    throw new Error('Claude did not call submit_blog_post tool')
  }
  return toolUse.input as ClaudeBlogJson
}

export async function generateOnePost(args: {
  sport: SportSlug
  prompt: string
}): Promise<PerSportResult> {
  const { sport, prompt } = args
  try {
    // Tool-call output — the SDK gives us a structured object directly, so
    // we no longer need a JSON-parse step or a parse-failure retry. If
    // Claude somehow fails to call the tool the call below throws and
    // bubbles into the catch.
    const parsed = await callClaudeStructured(SYSTEM_PROMPT, prompt)

    // Schema-level validation — tool input_schema already enforces
    // required + types on Claude's side, but defend against partials.
    const required: (keyof ClaudeBlogJson)[] = ['title', 'slug', 'content', 'excerpt', 'meta_description', 'keywords']
    for (const k of required) {
      if (!parsed[k]) return { sport, status: 'error', reason: `Missing field: ${k}` }
    }
    if (!Array.isArray(parsed.keywords)) {
      return { sport, status: 'error', reason: 'keywords must be array' }
    }

    const baseSlug = slugify(parsed.slug || parsed.title)
    if (!baseSlug) return { sport, status: 'error', reason: 'Empty slug' }
    const slug = await ensureUniqueSlug(baseSlug)

    // Insert — post_type is the only value the column allows now.
    const service = createServiceClient()
    const { error } = await untypedPosts(service)
      .from('blog_posts')
      .insert({
        title: parsed.title.slice(0, 300),
        slug,
        sport,
        post_type: 'tips_guide' as PostType,
        content: parsed.content,
        excerpt: parsed.excerpt.slice(0, 200),
        meta_description: parsed.meta_description.slice(0, 160),
        keywords: parsed.keywords.slice(0, 12).map((k) => String(k).slice(0, 80)),
        published_at: new Date().toISOString(),
      })
    if (error) {
      return { sport, status: 'error', reason: `DB insert failed: ${String(error)}` }
    }

    return { sport, status: 'ok', slug, title: parsed.title }
  } catch (err) {
    return {
      sport,
      status: 'error',
      reason: err instanceof Error ? err.message : String(err),
    }
  }
}

// --------------------------- Public entry -------------------------

export async function generateDailyBlogPosts(): Promise<DailyGenerationResult> {
  const day = dayOfMonthUTC()
  const pool: TopicPool = day % 2 === 0 ? 'A' : 'B'

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      status: 'error',
      post_type: 'tips_guide',
      pool,
      day_number: day,
      results: ACTIVE_SPORTS.map((s) => ({ sport: s, status: 'error', reason: 'ANTHROPIC_API_KEY not set' })),
    }
  }

  // Read the index for whichever pool this day consumes.
  const stateKey = pool === 'A' ? 'pool_a_topic_index' : 'pool_b_topic_index'
  const baseIdx = await getCronInt(stateKey, 0)
  const topics = pool === 'A' ? POOL_A_TOPICS : POOL_B_TOPICS

  // Build per-sport jobs. Offset the topic index by sport position so the
  // four sports don't all draw the same topic on a given day.
  const jobs = ACTIVE_SPORTS.map((sport, sportIdx) => {
    const topicIdx = (baseIdx + sportIdx) % topics.length
    const topic = fillTopicTemplate(topics[topicIdx], sport)
    return { sport, prompt: buildTipsPrompt(sport, topic) }
  })

  // Generate in parallel — one failure shouldn't kill the others.
  const settled = await Promise.allSettled(jobs.map((j) => generateOnePost(j)))
  const results: PerSportResult[] = settled.map((s, i) => {
    if (s.status === 'fulfilled') return s.value
    return {
      sport: jobs[i].sport,
      status: 'error' as const,
      reason: s.reason instanceof Error ? s.reason.message : String(s.reason),
    }
  })

  // Advance the consumed pool's counter even on partial failure so the next
  // day rolls forward rather than retrying the same topic for failed sports.
  await setCronInt(stateKey, baseIdx + 1)

  const okCount = results.filter((r) => r.status === 'ok').length
  const status: DailyGenerationResult['status'] =
    okCount === results.length ? 'ok' : okCount === 0 ? 'error' : 'partial'

  return { status, post_type: 'tips_guide', pool, day_number: day, results }
}
