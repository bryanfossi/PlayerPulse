/**
 * Tests for token deduction logic in the AI routes.
 *
 * Verifies that each route calls the consume_tokens RPC with the correct
 * amount BEFORE the AI call, and refund_tokens with the correct amount
 * if the AI call fails after deduction.
 *
 * NOTE: The actual "allowance-before-pack" priority logic lives in the
 * Postgres consume_tokens function (migration 012). That priority is
 * verified at the SQL level and is out of scope for these unit tests —
 * we only verify here that routes call the RPC with the right inputs.
 */

import { TOKEN_COSTS } from '@/lib/tokens/costs'

// ---- Mocks ----
const mockMessagesCreate = jest.fn()

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: { create: mockMessagesCreate },
  })),
  Anthropic: jest.fn().mockImplementation(() => ({
    messages: { create: mockMessagesCreate },
  })),
}))

jest.mock('@/lib/anthropic', () => ({
  anthropic: { messages: { create: mockMessagesCreate } },
}))

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({ allowed: true }),
}))

jest.mock('@/lib/prompts/match-engine', () => ({
  buildMatchEnginePrompt: jest.fn().mockReturnValue('mock prompt'),
}))

const mockParseTSV = jest.fn()
jest.mock('@/lib/parsers/match-engine-tsv', () => ({
  parseMatchEngineTSV: mockParseTSV,
}))

jest.mock('@/lib/prompts/draft-email', () => ({
  buildDraftEmailPrompt: jest.fn().mockReturnValue('mock email prompt'),
}))

// ---- Chainable Supabase mock ----
let mockPlayerData: Record<string, unknown> | null = null

// Tracks RPC calls so tests can assert deduction/refund happened correctly
const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = []

// Default: consume_tokens returns true (sufficient balance)
let mockConsumeTokensResult = true

function chain(resolveWith: unknown = null): Record<string, jest.Mock> {
  const node: Record<string, jest.Mock> = {
    eq: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    select: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data: resolveWith, error: null }),
    single: jest.fn().mockResolvedValue({ data: resolveWith, error: null }),
    then: undefined as unknown as jest.Mock,
  }
  node.eq.mockReturnValue(node)
  node.order.mockReturnValue(node)
  node.limit.mockReturnValue(node)
  node.select.mockReturnValue(node)
  return node
}

function makeServiceClient() {
  return {
    rpc: jest.fn().mockImplementation((name: string, args: Record<string, unknown>) => {
      rpcCalls.push({ name, args })
      if (name === 'consume_tokens') {
        return Promise.resolve({ data: mockConsumeTokensResult, error: null })
      }
      // refund_tokens, etc.
      return Promise.resolve({ data: null, error: null })
    }),
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'players') {
        return {
          select: jest.fn().mockReturnValue(chain(mockPlayerData)),
          update: jest.fn().mockReturnValue(chain(null)),
        }
      }
      if (table === 'player_schools') {
        return {
          select: jest.fn().mockReturnValue(
            chain({ school_id: 'school-1', player_id: 'player-1' }),
          ),
          insert: jest.fn().mockResolvedValue({ error: null }),
          delete: jest.fn().mockReturnValue(chain(null)),
          upsert: jest.fn().mockReturnValue(chain({ id: 'ps-1' })),
        }
      }
      if (table === 'schools') {
        return {
          upsert: jest.fn().mockReturnValue(chain({ id: 'school-1' })),
          select: jest.fn().mockReturnValue(
            chain({ id: 'school-1', name: 'Test U', verified_division: 'D3', city: 'Austin', state: 'TX', conference: 'Mock' })
          ),
        }
      }
      if (table === 'match_engine_runs') {
        return {
          insert: jest.fn().mockReturnValue(chain({ id: 'run-1' })),
        }
      }
      if (table === 'ai_drafts') {
        return {
          insert: jest.fn().mockReturnValue(chain({ id: 'draft-1' })),
        }
      }
      return {
        select: jest.fn().mockReturnValue(chain(null)),
        update: jest.fn().mockReturnValue(chain(null)),
        insert: jest.fn().mockReturnValue(chain(null)),
        delete: jest.fn().mockReturnValue(chain(null)),
      }
    }),
  }
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
      }),
    },
  }),
  createServiceClient: jest.fn().mockImplementation(makeServiceClient),
}))

import { createServiceClient } from '@/lib/supabase/server'
import { POST as matchEnginePost } from '@/app/api/ai/match-engine/route'
import { POST as draftEmailPost } from '@/app/api/ai/draft-email/route'

const VALID_MATCH_BODY = { player_id: 'player-1' }
const VALID_DRAFT_BODY = { player_school_id: 'ps-1', draft_type: 'initial_contact' }

function makeRequest(body: object): Request {
  return {
    json: async () => body,
  } as unknown as Request
}

const BASE_PLAYER = {
  id: 'player-1',
  user_id: 'user-123',
  sport_id: 'soccer',
  grad_year: 2026,
  gender: 'male',
  primary_position: 'MF',
  highest_club_level: 'regional',
  club_team: 'FC Test',
  home_city: 'Austin',
  home_state: 'TX',
  unweighted_gpa: 3.5,
  target_levels: ['D3'],
  recruiting_radius_mi: 500,
  tuition_importance: 3,
  first_name: 'Test',
  last_name: 'Player',
  secondary_position: null,
  high_school: 'Test HS',
  sat_score: 1200,
  act_score: 26,
  highlight_url: null,
  height_inches: 70,
}

// Build a TSV result with at least 30 rows so the match-engine accepts it
function buildValidTSV() {
  const baseRow = {
    school: 'Test University',
    verified_division: 'D3' as const,
    conference: 'Mock',
    city_state: 'Austin, TX',
    campus_type: 'Urban' as const,
    in_state_tuition: 20000,
    out_state_tuition: 25000,
    prestige: 'Mid' as const,
    soccer_url: '',
    program_url: '',
    tier: 'Realistic' as const,
    overall_score: 85,
    geo_score: 80,
    acad_score: 90,
    level_score: 85,
    need_score: 80,
    pt_score: 90,
    tuition_score: 75,
    merit_value_score: 80,
    player_level_band: 'B' as const,
    roster_level_band: 'B' as const,
    roster_depth: '3',
    first_year_opportunity: 'Possible' as const,
    merit_aid_potential: 'High' as const,
    estimated_merit_aid: '8000',
    merit_aid_confidence: 'Medium' as const,
    merit_aid_note: 'likely',
    distance_miles: 150,
    acad_note: 'good fit',
    level_note: 'competitive',
    pt_note: 'open',
  }
  return {
    rows: Array.from({ length: 40 }, (_, i) => ({ ...baseRow, school: `Test U ${i}` })),
    errorRows: [],
  }
}

beforeEach(() => {
  rpcCalls.length = 0
  mockConsumeTokensResult = true
  mockMessagesCreate.mockReset()
  mockParseTSV.mockReset()
  ;(createServiceClient as jest.Mock).mockImplementation(makeServiceClient)
})

// ---- match-engine ----

describe('match-engine token gate', () => {
  test('rejects with 402 when consume_tokens returns false on a rerun', async () => {
    mockPlayerData = {
      ...BASE_PLAYER,
      match_engine_run_at: '2024-01-01T00:00:00Z',
    }
    mockConsumeTokensResult = false

    const res = await matchEnginePost(makeRequest(VALID_MATCH_BODY))
    expect(res.status).toBe(402)
    const json = await res.json()
    expect(json.error).toBe('NO_TOKENS')

    // Should have attempted to consume FULL_MATCH_RERUN (10) tokens
    const consumeCall = rpcCalls.find((c) => c.name === 'consume_tokens')
    expect(consumeCall).toBeDefined()
    expect(consumeCall!.args.p_amount).toBe(TOKEN_COSTS.FULL_MATCH_RERUN)
    expect(consumeCall!.args.p_user_id).toBe('user-123')
  })

  test('first run does NOT call consume_tokens (free regardless of balance)', async () => {
    mockPlayerData = {
      ...BASE_PLAYER,
      match_engine_run_at: null,
    }
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'tsv-data' }],
    })
    mockParseTSV.mockReturnValueOnce(buildValidTSV())

    const res = await matchEnginePost(makeRequest(VALID_MATCH_BODY))
    expect(res.status).toBe(200)

    const consumeCall = rpcCalls.find((c) => c.name === 'consume_tokens')
    expect(consumeCall).toBeUndefined()
  })

  test('rerun calls consume_tokens with FULL_MATCH_RERUN before AI call', async () => {
    mockPlayerData = {
      ...BASE_PLAYER,
      match_engine_run_at: '2024-01-01T00:00:00Z',
    }
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'tsv-data' }],
    })
    mockParseTSV.mockReturnValueOnce(buildValidTSV())

    const res = await matchEnginePost(makeRequest(VALID_MATCH_BODY))
    expect(res.status).toBe(200)

    const consumeCall = rpcCalls.find((c) => c.name === 'consume_tokens')
    expect(consumeCall).toBeDefined()
    expect(consumeCall!.args.p_amount).toBe(TOKEN_COSTS.FULL_MATCH_RERUN)
  })

  test('refunds tokens when AI returns too few rows on a rerun', async () => {
    mockPlayerData = {
      ...BASE_PLAYER,
      match_engine_run_at: '2024-01-01T00:00:00Z',
    }
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'tsv-data' }],
    })
    // Return only 5 rows — below the 30-row minimum
    mockParseTSV.mockReturnValueOnce({ rows: Array(5).fill({}), errorRows: [] })

    await matchEnginePost(makeRequest(VALID_MATCH_BODY))

    const refundCall = rpcCalls.find((c) => c.name === 'refund_tokens')
    expect(refundCall).toBeDefined()
    expect(refundCall!.args.p_amount).toBe(TOKEN_COSTS.FULL_MATCH_RERUN)
    expect(refundCall!.args.p_user_id).toBe('user-123')
  })

  test('does NOT refund on first-run failure (nothing was deducted)', async () => {
    mockPlayerData = {
      ...BASE_PLAYER,
      match_engine_run_at: null,
    }
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: '' }],
    })
    mockParseTSV.mockReturnValueOnce({ rows: [], errorRows: [] })

    await matchEnginePost(makeRequest(VALID_MATCH_BODY))

    const refundCall = rpcCalls.find((c) => c.name === 'refund_tokens')
    expect(refundCall).toBeUndefined()
  })
})

// ---- draft-email ----

describe('draft-email token gate', () => {
  test('rejects with 402 when consume_tokens returns false', async () => {
    mockPlayerData = { ...BASE_PLAYER }
    mockConsumeTokensResult = false

    const res = await draftEmailPost(makeRequest(VALID_DRAFT_BODY))
    expect(res.status).toBe(402)
    const json = await res.json()
    expect(json.error).toBe('NO_TOKENS')

    const consumeCall = rpcCalls.find((c) => c.name === 'consume_tokens')
    expect(consumeCall).toBeDefined()
    expect(consumeCall!.args.p_amount).toBe(TOKEN_COSTS.EMAIL_DRAFT)
  })

  test('successful draft calls consume_tokens with EMAIL_DRAFT (1)', async () => {
    mockPlayerData = { ...BASE_PLAYER }
    mockMessagesCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ subject: 'Test Subject', body: 'Hello Coach!' }),
        },
      ],
    })

    const res = await draftEmailPost(makeRequest(VALID_DRAFT_BODY))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.subject).toBe('Test Subject')
    expect(json.body).toBe('Hello Coach!')

    const consumeCall = rpcCalls.find((c) => c.name === 'consume_tokens')
    expect(consumeCall).toBeDefined()
    expect(consumeCall!.args.p_amount).toBe(TOKEN_COSTS.EMAIL_DRAFT)
  })

  test('refunds when AI returns empty body', async () => {
    mockPlayerData = { ...BASE_PLAYER }
    mockMessagesCreate.mockResolvedValueOnce({
      // Empty body string after JSON parse
      content: [{ type: 'text', text: JSON.stringify({ subject: 'S', body: '' }) }],
    })

    await draftEmailPost(makeRequest(VALID_DRAFT_BODY))

    const refundCall = rpcCalls.find((c) => c.name === 'refund_tokens')
    expect(refundCall).toBeDefined()
    expect(refundCall!.args.p_amount).toBe(TOKEN_COSTS.EMAIL_DRAFT)
  })
})
