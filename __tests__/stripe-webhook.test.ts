/**
 * Tests for the Stripe webhook handler.
 *
 * Mocks stripe.webhooks.constructEvent and supabaseAdmin.rpc to verify
 * the handler invokes the correct RPC with the correct grant amounts
 * (TOKEN_GRANTS.SUBSCRIPTION_MONTHLY_ALLOWANCE / PACK_PURCHASE) for
 * each event type, without hitting external services.
 */

import { TOKEN_GRANTS } from '@/lib/tokens/costs'

// --- Mocks must be hoisted before any imports ---
const mockConstructEvent = jest.fn()
const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = []

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  },
}))

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    rpc: jest.fn().mockImplementation((name: string, args: Record<string, unknown>) => {
      rpcCalls.push({ name, args })
      return Promise.resolve({ data: null, error: null })
    }),
    from: jest.fn(),
  },
}))

import { supabaseAdmin } from '@/lib/supabase/admin'

function makeRequest(body: string, sig?: string): Request {
  return {
    text: async () => body,
    headers: {
      get: (name: string) => (name === 'stripe-signature' ? (sig ?? null) : null),
    },
  } as unknown as Request
}

// Default `from` mock returns successful no-op chains for legacy update paths
function defaultFromMock() {
  return {
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    }),
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  }
}

import { POST } from '@/app/api/stripe/webhook/route'

beforeEach(() => {
  rpcCalls.length = 0
  jest.clearAllMocks()
  ;(supabaseAdmin.from as jest.Mock).mockImplementation(defaultFromMock)
})

describe('POST /api/stripe/webhook', () => {
  test('400 when stripe-signature header is missing', async () => {
    const req = makeRequest('{}')
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Missing signature')
  })

  test('400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error('Webhook signature verification failed')
    })
    const req = makeRequest('{}', 'bad-sig')
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid signature')
  })

  test('checkout.session.completed type=tokens grants PACK_PURCHASE (30) tokens', async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: {
        object: {
          subscription: null,
          metadata: { user_id: 'user-123', type: 'tokens' },
        },
      },
    })

    const res = await POST(makeRequest('{}', 'sig-ok'))
    expect(res.status).toBe(200)

    const grantCall = rpcCalls.find((c) => c.name === 'grant_rerun_tokens')
    expect(grantCall).toBeDefined()
    expect(grantCall!.args.p_user_id).toBe('user-123')
    expect(grantCall!.args.p_amount).toBe(TOKEN_GRANTS.PACK_PURCHASE)
  })

  test('checkout.session.completed type=subscription activates with MONTHLY_ALLOWANCE (30)', async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: {
        object: {
          subscription: 'sub_abc',
          metadata: { user_id: 'user-456', type: 'subscription' },
        },
      },
    })

    await POST(makeRequest('{}', 'sig-ok'))

    const activateCall = rpcCalls.find((c) => c.name === 'activate_subscription')
    expect(activateCall).toBeDefined()
    expect(activateCall!.args.p_user_id).toBe('user-456')
    expect(activateCall!.args.p_subscription_id).toBe('sub_abc')
    expect(activateCall!.args.p_initial_tokens).toBe(TOKEN_GRANTS.SUBSCRIPTION_MONTHLY_ALLOWANCE)
  })

  test('customer.subscription.deleted calls cancel_subscription_allowance', async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_abc', status: 'canceled' } },
    })

    await POST(makeRequest('{}', 'sig-ok'))

    const cancelCall = rpcCalls.find((c) => c.name === 'cancel_subscription_allowance')
    expect(cancelCall).toBeDefined()
    expect(cancelCall!.args.p_subscription_id).toBe('sub_abc')
  })

  test('invoice.payment_succeeded with billing_reason=subscription_cycle refreshes allowance', async () => {
    // Stub the profile lookup so the handler can resolve subscription_id → user_id
    ;(supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'user-789' },
                error: null,
              }),
            }),
          }),
        }
      }
      return defaultFromMock()
    })

    mockConstructEvent.mockReturnValueOnce({
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          subscription: 'sub_xyz',
          billing_reason: 'subscription_cycle',
        },
      },
    })

    await POST(makeRequest('{}', 'sig-ok'))

    const refreshCall = rpcCalls.find((c) => c.name === 'refresh_subscription_allowance')
    expect(refreshCall).toBeDefined()
    expect(refreshCall!.args.p_user_id).toBe('user-789')
    expect(refreshCall!.args.p_amount).toBe(TOKEN_GRANTS.SUBSCRIPTION_MONTHLY_ALLOWANCE)
  })

  test('invoice.payment_succeeded with billing_reason=subscription_create does NOT refresh', async () => {
    // The first invoice (signup) should NOT trigger a refresh — that's
    // already handled by activate_subscription. Otherwise users get 60 tokens
    // on signup instead of 30.
    mockConstructEvent.mockReturnValueOnce({
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          subscription: 'sub_xyz',
          billing_reason: 'subscription_create',
        },
      },
    })

    await POST(makeRequest('{}', 'sig-ok'))

    const refreshCall = rpcCalls.find((c) => c.name === 'refresh_subscription_allowance')
    expect(refreshCall).toBeUndefined()
  })

  test('unknown event type returns 200 with no RPC calls', async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: 'invoice.paid',
      data: { object: {} },
    })

    const res = await POST(makeRequest('{}', 'sig-ok'))
    expect(res.status).toBe(200)
    expect(rpcCalls).toHaveLength(0)
  })
})
