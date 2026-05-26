/**
 * Blog content generator.
 *
 * Pulls the highest-priority unused keyword from fuse_keywords, optionally
 * researches the SERP via Serper.dev, asks Claude to write the article,
 * persists it to fuse_articles, and marks the keyword used.
 *
 * Designed to be called from:
 *   - Vercel Cron (POST /api/admin/generate-article)
 *   - Local CLI (scripts/generate-article.ts)
 *
 * Returns a structured result so callers can log or surface what happened.
 */

import { anthropic } from '@/lib/anthropic'
import { createServiceClient } from '@/lib/supabase/server'

export type GenerationResult =
  | { status: 'ok'; slug: string; title: string; keyword: string; wordCount: number }
  | { status: 'no_keywords' }
  | { status: 'error'; reason: string }

interface KeywordRow {
  id: string
  keyword: string
  priority: number
  sport: 'soccer' | 'basketball' | 'football' | 'volleyball' | null
}

interface SerpResult {
  title: string
  link: string
  snippet: string
}

interface ClaudeArticle {
  title: string
  description: string
  slug: string
  tags: string[]
  sport: 'soccer' | 'basketball' | 'football' | 'volleyball' | 'general'
  body: string
}

const SYSTEM_PROMPT = `You are a college recruiting expert and content strategist writing for FUSE-ID (fuse-id.online) — an AI-powered college recruiting CRM for high school athletes. Your readers are high school athletes (ages 13–18), their parents, and club coaches.

Write a 1,200–1,600 word SEO-optimized article for the keyword provided. Structure:
- H1: compelling, keyword-rich title
- Introduction: hook with a specific pain point or stat, establish stakes
- 3–5 H2 sections with practical, specific advice (not generic platitudes)
- Each section should have actionable takeaways the reader can use today
- Naturally weave in how technology and AI tools are changing recruiting
- Closing section: brief, non-pushy mention of FUSE-ID as a free tool that helps athletes organize their recruiting process, draft emails, and track offers — link to https://fuse-id.online/register
- Tone: knowledgeable, direct, encouraging. Write like a coach who actually knows recruiting, not a content marketer.
- Do not fabricate statistics. If referencing stats, use the ones from the FUSE-ID homepage (78% of recruits never follow up a second time; 3x more responses with personalized emails; coaches start tracking recruits actively ~6 months in).

Output format: return a JSON object with keys: title, description (140-160 chars), slug (kebab-case, no leading slash), tags (array of 3-6 strings), sport ('soccer' / 'basketball' / 'football' / 'volleyball' / 'general'), and body (full MDX-ready markdown WITHOUT the H1 — the title is rendered separately as a heading on the page; start the body with the introduction paragraph).

Return only valid JSON, no backticks, no preamble.`

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

async function searchSerper(keyword: string): Promise<SerpResult[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return []
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: keyword, num: 10 }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      console.error('[generator] Serper returned', res.status)
      return []
    }
    const json = (await res.json()) as { organic?: Array<{ title?: string; link?: string; snippet?: string }> }
    return (json.organic ?? []).slice(0, 10).map((r) => ({
      title: r.title ?? '',
      link: r.link ?? '',
      snippet: r.snippet ?? '',
    }))
  } catch (err) {
    console.error('[generator] Serper fetch failed:', err)
    return []
  }
}

function parseClaudeJson(raw: string): ClaudeArticle | null {
  // Try direct parse first
  try {
    return JSON.parse(raw) as ClaudeArticle
  } catch {
    // Try to extract the first JSON object via regex (in case Claude wrapped
    // the response in ```json fences despite instructions)
    const match = raw.match(/\{[\s\S]+\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0]) as ClaudeArticle
    } catch {
      return null
    }
  }
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  const service = createServiceClient()
  const untyped = service as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{ data: { id?: string } | null }>
        }
      }
    }
  }

  let candidate = baseSlug
  let suffix = 2
  while (true) {
    const { data } = await untyped.from('fuse_articles').select('id').eq('slug', candidate).maybeSingle()
    if (!data) return candidate
    candidate = `${baseSlug}-${suffix}`
    suffix += 1
    if (suffix > 50) {
      // Safety valve — should never happen
      return `${baseSlug}-${Date.now()}`
    }
  }
}

export async function generateNextArticle(): Promise<GenerationResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { status: 'error', reason: 'ANTHROPIC_API_KEY not set' }
  }

  const service = createServiceClient()
  const untypedKw = service as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (col: string, val: string) => {
          order: (col: string, opts: { ascending: boolean }) => {
            order: (col: string, opts: { ascending: boolean }) => {
              limit: (n: number) => Promise<{ data: KeywordRow[] | null; error: unknown }>
            }
          }
        }
      }
      update: (row: Record<string, unknown>) => {
        eq: (col: string, val: string) => Promise<{ error: unknown }>
      }
      insert: (row: Record<string, unknown>) => {
        select: (c: string) => {
          single: () => Promise<{ data: { id: string; slug: string } | null; error: unknown }>
        }
      }
    }
  }

  // 1. Pull next keyword
  const { data: keywords, error: kwErr } = await untypedKw
    .from('fuse_keywords')
    .select('id, keyword, priority, sport')
    .eq('used', 'false')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)

  if (kwErr) {
    return { status: 'error', reason: `Keyword fetch failed: ${String(kwErr)}` }
  }
  if (!keywords || keywords.length === 0) {
    return { status: 'no_keywords' }
  }
  const kw = keywords[0]

  // 2. SERP research
  const serpResults = await searchSerper(kw.keyword)
  const serpContext = serpResults.length > 0
    ? `\n\nTOP-RANKING RESULTS for "${kw.keyword}" — use these to identify content gaps, NOT to copy:\n${serpResults
        .map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}`)
        .join('\n')}`
    : ''

  // 3. Claude generation — retry once on JSON-parse failure. Claude
  // occasionally wraps the response in markdown fences or adds a brief
  // preamble despite the system prompt; a second attempt almost always
  // produces clean JSON. Each attempt is a fresh ~30-60s call, so cap
  // at 2 attempts to stay well under the 300s function ceiling.
  const MAX_ATTEMPTS = 2
  let parsed: ClaudeArticle | null = null
  let lastRaw = ''
  let lastErr = ''

  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !parsed; attempt++) {
    const userContent = attempt === 1
      ? `KEYWORD: ${kw.keyword}\nSPORT: ${kw.sport ?? 'general'}${serpContext}`
      : `KEYWORD: ${kw.keyword}\nSPORT: ${kw.sport ?? 'general'}${serpContext}\n\nRETRY: your previous response could not be parsed as JSON. Return ONLY the raw JSON object with no markdown fences, no preamble, no commentary.`

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      })
      lastRaw = message.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { type: 'text'; text: string }).text)
        .join('')
        .trim()
      parsed = parseClaudeJson(lastRaw)
      if (!parsed) {
        lastErr = 'unparseable JSON'
        console.warn(`[generator] attempt ${attempt}/${MAX_ATTEMPTS} parse failed for "${kw.keyword}". First 200 chars: ${lastRaw.slice(0, 200)}`)
      }
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err)
      console.warn(`[generator] attempt ${attempt}/${MAX_ATTEMPTS} threw for "${kw.keyword}": ${lastErr}`)
      // Don't break — retry on transient API errors too
    }
  }

  if (!parsed) {
    return {
      status: 'error',
      reason: `Could not parse Claude response after ${MAX_ATTEMPTS} attempts (${lastErr}). Last sample: ${lastRaw.slice(0, 120)}`,
    }
  }
  if (!parsed.title || !parsed.body) {
    return { status: 'error', reason: 'Claude response missing title or body' }
  }

  // 5. Slug uniqueness
  const baseSlug = slugify(parsed.slug || parsed.title)
  const slug = await ensureUniqueSlug(baseSlug)

  // Normalize sport: keep null for 'general' so the DB stores it cleanly
  const sport = parsed.sport === 'general' ? null : parsed.sport

  const wordCount = countWords(parsed.body)

  // 6. Persist article
  const { data: inserted, error: insertErr } = await untypedKw
    .from('fuse_articles')
    .insert({
      keyword: kw.keyword,
      slug,
      title: parsed.title,
      description: parsed.description || parsed.title.slice(0, 155),
      body: parsed.body,
      tags: parsed.tags ?? [],
      sport,
      word_count: wordCount,
    })
    .select('id, slug')
    .single()

  if (insertErr) {
    return { status: 'error', reason: `Insert failed: ${String(insertErr)}` }
  }

  // 7. Mark keyword used
  const { error: updErr } = await untypedKw
    .from('fuse_keywords')
    .update({ used: true, used_at: new Date().toISOString() })
    .eq('id', kw.id)

  if (updErr) {
    // Article saved but keyword not marked — log it. Better than failing the whole job.
    console.error('[generator] keyword update failed:', updErr)
  }

  return {
    status: 'ok',
    slug: inserted?.slug ?? slug,
    title: parsed.title,
    keyword: kw.keyword,
    wordCount,
  }
}
