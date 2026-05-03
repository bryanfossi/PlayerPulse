# Token Economy Audit — 2026-05-03

## TL;DR

The codebase has **two parallel quota systems** that need to be unified:
1. **`rerun_tokens`** — generic token currency (used by match engine reruns and email drafts > 10/month)
2. **`email_drafts_this_month`** — separate monthly quota that gives 10 free email drafts per month

The new spec eliminates this dual system: **everything becomes tokens**.

The current schema also has no way to distinguish **subscription allowance tokens** (monthly, replaced on refresh) from **pack tokens** (roll over forever). Adding this distinction is a P0 schema change.

---

## Schema as-is (`players` table, migration 004)

| Column | Current use |
|---|---|
| `rerun_tokens` | Single token bucket — both subscription and pack tokens commingled |
| `rerun_tokens_used` | Cumulative counter, never read anywhere — dead-ish (audit-only) |
| `rerun_tokens_reset_at` | Last monthly refresh timestamp |
| `email_drafts_this_month` | Counts email drafts toward 10/month limit |
| `email_drafts_reset_at` | Last email-draft window reset |

## RPCs as-is

- `grant_rerun_tokens(user_id, amount)` — additive (`tokens = tokens + amount`)
- `activate_subscription(user_id, sub_id, initial_tokens)` — sets sub flags + `tokens = tokens + initial_tokens`, resets email_drafts to 0

## Hardcoded costs as-is

| File | Action | Current cost |
|---|---|---|
| `src/app/api/ai/match-engine/route.ts:63` | Full match list rerun | 1 token (free first run) |
| `src/app/api/ai/draft-email/route.ts:56-63` | Email draft | Free up to 10/month, then 1 token |
| `src/app/api/ai/rescore-school/route.ts` | Single-school fit assessment | **FREE — no token cost or quota** |
| `src/app/api/stripe/webhook/route.ts:41` | Subscription signup | +3 tokens |
| `src/app/api/stripe/webhook/route.ts:49` | Token pack purchase | +3 tokens |
| `src/app/api/stripe/reset-monthly/route.ts:13` | Monthly refresh | **Sets** to 3 (NOT additive — pack tokens are lost!) |

## UI surface area

- `src/components/RerunButton.tsx:81,97` — "Regenerate My List (uses 1 token)" / "This uses 1 rerun token"
- `src/components/communications/DraftEmailModal.tsx:95` — "No tokens remaining" toast
- `src/components/AddTokensButton.tsx` — Buy Tokens button → `/api/stripe/checkout` type=tokens
- `src/components/TokenBalance.tsx` — displays balance from TokenContext
- `src/contexts/TokenContext.tsx` — single tokens balance, optimistically updated client-side
- `src/app/page.tsx:311` — landing page says **"Unlimited AI email drafting"** (lies — currently 10/month then tokens; under new spec, every rerun costs 1 token)

## Tests

- `__tests__/token-deduction.test.ts` covers match-engine and draft-email deduction (existing 10/month logic)
- `__tests__/stripe-webhook.test.ts` covers subscription and token-pack webhook events
- **Will need updating** — existing tests assume current costs (3-token grants, 10/mo free drafts)

---

## Critical decisions needed before any edits

### 1. Schema: how to track subscription allowance vs. pack tokens?

Your spec says monthly allowance must be consumed before pack tokens. Current schema has one `rerun_tokens` column — can't distinguish.

**Recommended:** Add two new columns. Drop `rerun_tokens` semantically (keep column, repurpose).

```sql
alter table public.players
  add column if not exists allowance_tokens int not null default 0,
  add column if not exists pack_tokens int not null default 0;

-- Migration: split existing rerun_tokens into allowance + pack
-- (Conservative: assume all existing tokens are pack tokens — they roll over)
update public.players
set pack_tokens = coalesce(rerun_tokens, 0)
where pack_tokens = 0;
```

Then change every read/write site to consume `allowance_tokens` first, fall back to `pack_tokens`.

**Alternative (simpler but uglier):** keep one `rerun_tokens` column, add `allowance_tokens_remaining` that's deducted *first* before regular `rerun_tokens`. Same end behavior, less migration churn.

I lean toward two clean columns.

### 2. Email drafts — first one free, or cost from start?

Your spec: "AI-drafted email rerun (regenerating a coach outreach email): 1 token"

The word **"rerun"** is significant — does this mean:
- (a) The first email draft for any given school is free; only re-generations cost 1 token? OR
- (b) Every email generation (first or rerun) costs 1 token, and "rerun" is just informal phrasing?

Different implementations. I'll assume (b) — every email costs 1 token — unless you say otherwise. The current 10-free-drafts/month system goes away entirely.

### 3. School rescore — currently free. Should it cost 3 tokens now?

Your spec says "Single-school fit assessment (when a user adds a new school to their list and we generate an AI-powered fit analysis): 3 tokens"

The existing `/api/ai/rescore-school` route generates fit scores for an existing school. There's also score generation when a school is **added manually** to the board (likely in `/api/player-schools/route.ts` — I should check). Both should cost 3 tokens?

I'll need to verify which user-facing actions trigger fit assessment so we charge consistently.

### 4. Subscription cancellation behavior

Currently when a user cancels:
- `subscription_active` → `false`
- Tokens are **untouched** (they keep both allowance and pack tokens)

Your spec implies allowance refreshes on each billing renewal. On cancellation, what happens to unused allowance?

**Recommended:** On cancellation, zero out `allowance_tokens`. Pack tokens roll over forever as paid for.

If you re-subscribe, you get a fresh 30 allowance.

### 5. Landing page copy

`src/app/page.tsx:311` currently says **"Unlimited AI email drafting"**. Under the new economy this is false — every email costs a token. Need to update to something like:
- "AI email drafting (1 token per email)"
- Or list a sample: "30 monthly tokens — enough for 30 emails or 3 full match list reruns"

I'll propose specific copy when we get to that step.

### 6. Subscription token grant on activation

Current: `activate_subscription(..., p_initial_tokens: 3)` grants 3.
New: should grant 30 (the monthly allowance) into `allowance_tokens`.

### 7. Token pack grant on purchase

Current: `grant_rerun_tokens(..., p_amount: 3)` grants 3 to commingled bucket.
New: should grant 30 to `pack_tokens` specifically.

### 8. Monthly refresh

Current: `reset-monthly` endpoint sets `rerun_tokens = 3` for all subscribers older than 30 days. **This destroys pack tokens — bug.**

New: Refresh `allowance_tokens = 30`, leave `pack_tokens` alone.

**Better — use Stripe's `invoice.payment_succeeded` webhook** (which fires on every successful subscription renewal), not a 30-day cron. More reliable, doesn't require Vercel cron, and tied to actual billing cycle.

---

## Proposed implementation plan (for your approval)

**Phase 1 — Schema + RPC + constants** (no UI changes yet)
1. New migration `012_token_economy.sql`:
   - Add `allowance_tokens int default 0` and `pack_tokens int default 0` to `players`
   - Backfill: move existing `rerun_tokens` → `pack_tokens` (conservative: existing balances roll over forever)
   - Update `grant_rerun_tokens` RPC → grants to `pack_tokens`
   - Update `activate_subscription` RPC → grants 30 to `allowance_tokens`
   - New RPC `refresh_subscription_allowance(user_id, amount)` → sets `allowance_tokens = amount`, leaves `pack_tokens` alone
   - New RPC `consume_tokens(user_id, amount)` → atomically subtracts from `allowance_tokens` first, then `pack_tokens`. Returns success or throws if insufficient.
2. New constants file `src/lib/tokens/costs.ts`:
   ```typescript
   export const TOKEN_COSTS = {
     EMAIL_DRAFT: 1,
     SCHOOL_FIT_ASSESSMENT: 3,
     FULL_MATCH_RERUN: 10,
   } as const

   export const TOKEN_GRANTS = {
     SUBSCRIPTION_MONTHLY_ALLOWANCE: 30,
     PACK_PURCHASE: 30,
   } as const
   ```
3. Update `src/types/database.ts` to reflect new columns and RPCs

**Phase 2 — API routes use the new system**
4. `match-engine/route.ts` — change deduction from 1 → 10 via `consume_tokens` RPC (still free first run)
5. `draft-email/route.ts` — remove the `email_drafts_this_month` logic entirely. Every draft costs 1 token via `consume_tokens`. (Decision needed: keep first-draft-free, or charge from first?)
6. `rescore-school/route.ts` — charge 3 tokens via `consume_tokens`
7. Check `/api/player-schools` add path — if it generates fit scores, also charge 3 tokens
8. `stripe/webhook/route.ts` — token pack grant changes 3 → 30, subscription initial grant changes 3 → 30, add handler for `invoice.payment_succeeded` to refresh monthly allowance
9. Delete `stripe/reset-monthly/route.ts` — replaced by webhook

**Phase 3 — UI updates**
10. `RerunButton.tsx` — copy update: "Regenerate My List (uses 10 tokens)"
11. `DraftEmailModal.tsx`, `DraftEmailClient.tsx` — copy + token check
12. New unified balance display — show `allowance + pack` total, optionally drill-down "Includes 18 monthly + 12 pack tokens"
13. `AddTokensButton.tsx` — copy update for "30 tokens for $4.99"
14. Landing page (`page.tsx`) — fix the "unlimited" copy, optionally show token cost breakdown

**Phase 4 — Tests**
15. Update existing token-deduction tests for new costs
16. New tests for `consume_tokens` priority (allowance before pack)
17. New tests for monthly refresh on `invoice.payment_succeeded`
18. New tests for cancellation behavior

**Phase 5 — Stripe**
19. Tell you which prices to (re-)create in Stripe and what env vars to update

---

## What I need from you before I start writing code

Please answer these so I don't have to re-do anything:

1. **Schema:** Two new columns (`allowance_tokens` + `pack_tokens`)? Or single column with separate counter? My recommendation: two columns. ✅ / ❌
2. **Email drafts:** Every email costs 1 token, or first email per school is free and reruns cost 1 token? My assumption: every email = 1 token. ✅ / ❌
3. **School rescore:** Charge 3 tokens for `/api/ai/rescore-school`? Also charge 3 when a school is first added? ✅ / ❌
4. **Cancellation:** Zero out `allowance_tokens` on cancel, keep `pack_tokens`? ✅ / ❌
5. **Monthly refresh:** Use Stripe `invoice.payment_succeeded` webhook (recommended) or keep the cron-style `reset-monthly` endpoint? My recommendation: switch to webhook.
6. **Landing page copy:** OK to remove "Unlimited AI email drafting" and replace with token-aware copy?
7. **Existing balances:** All existing `rerun_tokens` get moved to `pack_tokens` (roll over forever)? Or split somehow? My recommendation: all → pack_tokens.

Once you answer (or tell me to use my recommendations), I'll start with Phase 1 (schema + RPCs + constants), pause for review, then continue.
