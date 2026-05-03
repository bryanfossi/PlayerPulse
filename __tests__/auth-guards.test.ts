/**
 * Auth guard tests — verifies that every protected API route returns 401
 * when no authenticated session exists, and proceeds when one does.
 */

// Shared mock state — tests flip this to simulate auth/no-auth
let mockUser: { id: string } | null = null

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockImplementation(async () => ({
    auth: {
      getUser: jest.fn().mockImplementation(async () => ({
        data: { user: mockUser },
      })),
    },
  })),
  createServiceClient: jest.fn().mockImplementation(() => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'new-1' }, error: null }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }),
  })),
}))

// Stub out downstream deps so routes don't crash before reaching auth guard
jest.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: 'https://stripe.com/checkout/test' }),
      },
    },
    webhooks: { constructEvent: jest.fn() },
  },
}))

jest.mock('@/lib/anthropic', () => ({
  anthropic: { messages: { create: jest.fn().mockResolvedValue({ content: [] }) } },
}))

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({ allowed: true }),
}))

jest.mock('@/lib/prompts/match-engine', () => ({
  buildMatchEnginePrompt: jest.fn().mockReturnValue('prompt'),
}))

jest.mock('@/lib/parsers/match-engine-tsv', () => ({
  parseMatchEngineTSV: jest.fn().mockReturnValue({ rows: [], errorRows: [] }),
}))

jest.mock('@/lib/prompts/draft-email', () => ({
  buildDraftEmailPrompt: jest.fn().mockReturnValue('prompt'),
}))

// ---- Import route handlers ----
import { GET as offersGet, POST as offersPost } from '@/app/api/offers/route'
import { GET as invitesGet, POST as invitesPost } from '@/app/api/invites/route'
import { POST as checkoutPost } from '@/app/api/stripe/checkout/route'
import { POST as matchEnginePost } from '@/app/api/ai/match-engine/route'
import { POST as draftEmailPost } from '@/app/api/ai/draft-email/route'

function makeRequest(body: object = {}): Request {
  return {
    json: async () => body,
    text: async () => JSON.stringify(body),
    headers: { get: () => null },
  } as unknown as Request
}

// Helper — assert a route returns 401 when unauthenticated
async function expect401(handler: (req: Request) => Promise<Response>, body: object = {}) {
  mockUser = null
  const res = await handler(makeRequest(body))
  expect(res.status).toBe(401)
  const json = await res.json()
  expect(json.error).toBe('Unauthorized')
}

describe('Auth guards — unauthenticated requests return 401', () => {
  test('GET /api/offers → 401', () => expect401(offersGet))
  test('POST /api/offers → 401', () => expect401(offersPost, { school_id: 'school-1' }))
  test('GET /api/invites → 401', () => expect401(invitesGet))
  test('POST /api/invites → 401', () => expect401(invitesPost, { email: 'test@example.com' }))
  test('POST /api/stripe/checkout → 401', () => expect401(checkoutPost, { type: 'tokens' }))
  test('POST /api/ai/match-engine → 401', () => expect401(matchEnginePost, { player_id: 'p1' }))
  test('POST /api/ai/draft-email → 401', () =>
    expect401(draftEmailPost, { player_school_id: 'ps-1', draft_type: 'initial_contact' }))
})

describe('Auth guards — authenticated requests proceed past 401', () => {
  beforeEach(() => {
    mockUser = { id: 'user-123' }
  })

  async function expectNot401(handler: (req: Request) => Promise<Response>, body: object = {}) {
    const res = await handler(makeRequest(body))
    expect(res.status).not.toBe(401)
  }

  test('GET /api/offers → not 401', () => expectNot401(offersGet))
  test('POST /api/offers → not 401', () => expectNot401(offersPost, { school_id: 'school-1' }))
  test('GET /api/invites → not 401', () => expectNot401(invitesGet))
  test('POST /api/invites → not 401', () => expectNot401(invitesPost, { email: 'test@example.com' }))
  test('POST /api/stripe/checkout → not 401', () =>
    expectNot401(checkoutPost, { type: 'tokens' }))
  test('POST /api/ai/match-engine → not 401', () =>
    expectNot401(matchEnginePost, { player_id: 'p1' }))
  test('POST /api/ai/draft-email → not 401', () =>
    expectNot401(draftEmailPost, { player_school_id: 'ps-1', draft_type: 'initial_contact' }))
})
