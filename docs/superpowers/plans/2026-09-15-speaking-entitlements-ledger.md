# Speaking Entitlements and Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace cents, daily freebies and session-count quotas with secure fixed speaking allowances that survive retries, concurrent requests, refunds and billing renewals.

**Architecture:** Postgres owns grants, reservations, consumption and refunds. A pure allocator consumes expiring monthly seconds before permanent seconds; transactional SQL functions lock eligible buckets and write an immutable ledger. Netlify functions authenticate the user and call those functions, while the browser can only read its summarized balance.

**Tech Stack:** Supabase/Postgres, Netlify Functions, Lemon Squeezy webhooks, Node test runner, React.

**Spec:** `docs/superpowers/specs/2026-09-15-deutschmeister-speaking-a11-commercial-rebuild-design.md`

## Contract

- A DeutschStart A1.1 purchase grants 3,600 permanent seconds and one included attempt for each of 12 mission keys.
- An AI Coach billing period grants 7,200 seconds expiring at that period's end.
- A top-up grants 3,600 permanent seconds.
- Monthly seconds are consumed before permanent seconds.
- Start reserves; end finalizes actual usage and refunds the unused reservation.
- A technical failure refunds all affected seconds. User cancellation finalizes elapsed usage.
- Every mutation has a stable idempotency key. The browser never supplies an authoritative balance or price.

---

### Task 1: Model buckets, reservations and immutable ledger entries

**Files:**
- Create: `migrations/2026-09-16-speaking-allowances.sql`
- Create: `tests/speaking-allowance-schema.test.mjs`
- Modify: `netlify/functions/_shared/speakingUsage.mjs`

**Interfaces:**
- Produces tables `speaking_credit_buckets`, `speaking_session_reservations`, `speaking_minute_ledger`, and `speaking_mission_entitlements`.
- Produces RPCs `grant_speaking_seconds`, `reserve_speaking_seconds`, `finalize_speaking_session`, and `refund_speaking_session`.
- All durations are integer seconds.

- [ ] **Step 1: Write the failing schema contract**

```js
// tests/speaking-allowance-schema.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../migrations/2026-09-16-speaking-allowances.sql', import.meta.url), 'utf8');

test('speaking allowance migration is second-based, atomic and idempotent', () => {
  for (const name of ['speaking_credit_buckets', 'speaking_session_reservations', 'speaking_minute_ledger', 'speaking_mission_entitlements']) {
    assert.match(sql, new RegExp(`create table(?: if not exists)? public\\.${name}`, 'i'));
  }
  for (const fn of ['grant_speaking_seconds', 'reserve_speaking_seconds', 'finalize_speaking_session', 'refund_speaking_session']) {
    assert.match(sql, new RegExp(`create or replace function public\\.${fn}`, 'i'));
  }
  assert.match(sql, /for update/i);
  assert.match(sql, /idempotency_key text not null unique/i);
  assert.doesNotMatch(sql, /balance_cents|cost_cents/i);
});
```

- [ ] **Step 2: Confirm the migration is missing**

Run:

```powershell
node --test tests/speaking-allowance-schema.test.mjs
```

Expected: FAIL because the migration does not exist.

- [ ] **Step 3: Create the tables and policies**

Use these canonical fields:

```sql
create table public.speaking_credit_buckets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('subscription', 'course', 'topup', 'adjustment')),
  source_ref text not null,
  granted_seconds integer not null check (granted_seconds > 0),
  remaining_seconds integer not null check (remaining_seconds >= 0),
  period_start timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, source, source_ref)
);

create table public.speaking_session_reservations (
  session_token uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket_id uuid not null references public.speaking_credit_buckets(id),
  reserved_seconds integer not null check (reserved_seconds > 0),
  consumed_seconds integer not null default 0 check (consumed_seconds >= 0),
  refunded_seconds integer not null default 0 check (refunded_seconds >= 0),
  status text not null default 'reserved' check (status in ('reserved', 'finalized', 'refunded')),
  created_at timestamptz not null default now(),
  finalized_at timestamptz,
  primary key (session_token, bucket_id)
);

create table public.speaking_minute_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_token uuid,
  bucket_id uuid references public.speaking_credit_buckets(id),
  kind text not null check (kind in ('grant', 'reserve', 'finalize', 'refund', 'expire', 'revoke')),
  seconds integer not null check (seconds > 0),
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

Add `speaking_mission_entitlements(user_id, mission_key, source_ref, attempts_total, attempts_remaining, unique(user_id, mission_key, source_ref))`. Enable RLS on all four tables. Learners may select only their own rows; no client insert/update/delete policy exists. Service-role and security-definer RPCs perform writes with an explicit `search_path`.

- [ ] **Step 4: Implement transactional RPCs**

`reserve_speaking_seconds` must:

1. Return the existing reservation for the same start idempotency key.
2. Lock active buckets with `FOR UPDATE`.
3. Sort expiring buckets first, then permanent buckets, oldest first.
4. Fail without mutation when total eligible seconds are insufficient.
5. Decrement buckets and write one reservation/ledger row per allocation.

`finalize_speaking_session` caps used seconds at the reserved total, distributes consumption in reservation order, restores the difference to buckets, and records finalize/refund entries once. `refund_speaking_session` restores the complete unfinalized reservation once. Add constraints that `consumed_seconds + refunded_seconds <= reserved_seconds`.

- [ ] **Step 5: Apply to a disposable database and run the contract**

```powershell
supabase db reset
node --test tests/speaking-allowance-schema.test.mjs
```

Expected: migration succeeds and the test passes.

- [ ] **Step 6: Commit**

```powershell
git add migrations/2026-09-16-speaking-allowances.sql tests/speaking-allowance-schema.test.mjs netlify/functions/_shared/speakingUsage.mjs
git commit -m "feat: add atomic speaking allowance ledger"
```

### Task 2: Implement and test allocation policy independent of the database

**Files:**
- Create: `netlify/functions/_shared/speakingAllowance.mjs`
- Create: `tests/speaking-allowance.test.mjs`

**Interfaces:**
- Produces `allocateSeconds(buckets, requestedSeconds) -> { allocations, shortfallSeconds }`.
- Produces `summarizeBalance(buckets, now) -> { monthlySeconds, permanentSeconds, totalSeconds }`.

- [ ] **Step 1: Write the failing allocator tests**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allocateSeconds, summarizeBalance } from '../netlify/functions/_shared/speakingAllowance.mjs';

test('uses expiring monthly seconds before permanent seconds', () => {
  const result = allocateSeconds([
    { id: 'permanent', remainingSeconds: 3600, expiresAt: null },
    { id: 'monthly', remainingSeconds: 300, expiresAt: '2026-10-01T00:00:00Z' },
  ], 420);
  assert.deepEqual(result, {
    allocations: [{ bucketId: 'monthly', seconds: 300 }, { bucketId: 'permanent', seconds: 120 }],
    shortfallSeconds: 0,
  });
});

test('reports a shortfall without inventing seconds', () => {
  assert.equal(allocateSeconds([{ id: 'a', remainingSeconds: 20, expiresAt: null }], 60).shortfallSeconds, 40);
});
```

- [ ] **Step 2: Confirm module-not-found failure**

```powershell
node --test tests/speaking-allowance.test.mjs
```

- [ ] **Step 3: Implement the pure functions**

Normalize invalid/expired buckets out, use a stable sort by `expiresAt ?? Infinity` then creation time, never mutate input, and reject non-positive/non-integer requests. Keep property names in camelCase at the JS boundary and map database snake_case in one adapter.

- [ ] **Step 4: Add edge and invariant tests**

Cover zero buckets, exact depletion, two expiring buckets, expired rows, invalid seconds, input immutability, and `sum(allocations) + shortfall === requestedSeconds`.

- [ ] **Step 5: Run and commit**

```powershell
node --test tests/speaking-allowance.test.mjs
git add netlify/functions/_shared/speakingAllowance.mjs tests/speaking-allowance.test.mjs
git commit -m "test: lock speaking allocation policy"
```

### Task 3: Replace browser-trusted session charging with reserve/finalize/refund

**Files:**
- Modify: `netlify/functions/speaking-session.mjs`
- Modify: `netlify/functions/check-speaking-usage.mjs`
- Create: `netlify/functions/_shared/speakingEntitlements.mjs`
- Modify: `src/pages/SpeakingPage.jsx`
- Modify: `src/components/speaking/SpeakingSession.jsx`
- Create: `tests/speaking-session-contract.test.mjs`
- Create: `tests/speaking-cost.test.mjs`
- Create: `tests/speaking-ui.test.mjs`

**Interfaces:**
- Start body: `{ action: 'start', mode, level, missionId, durationSeconds, idempotencyKey }`.
- End body: `{ action: 'end', sessionToken, usedSeconds, outcome, idempotencyKey }`.
- Start result: `{ sessionToken, reservedSeconds, balance, includedMissionAttempt }`.
- End result: `{ consumedSeconds, refundedSeconds, balance }`.

- [ ] **Step 1: Add failing source and pure-handler contract tests**

Assert that only `durationSeconds` values `300`, `600`, or `900` are accepted for live sessions; guided sessions reserve a server-calculated cap. Reject missing idempotency keys, mismatched users, and unrecognized outcomes. Assert source contains RPC calls and no `balance_cents`, `cost_cents`, daily-free or browser-supplied price logic.

- [ ] **Step 2: Implement server entitlement resolution**

`speakingEntitlements.mjs` returns one of:

```js
{ kind: 'included-mission', missionKey, maxSeconds: 300 }
{ kind: 'allowance', requestedSeconds }
{ kind: 'denied', code: 'INSUFFICIENT_ALLOWANCE' }
```

For a course purchaser's first attempt at the named mission, consume the mission entitlement instead of minute buckets. Every retry uses minute buckets. Validate course ownership and mission identity server-side.

- [ ] **Step 3: Update session endpoints**

On start, authenticate, validate mode/level, consume the included attempt or invoke `reserve_speaking_seconds`, then create the session row. If session-row creation fails, call refund immediately. On end, clamp `usedSeconds` to server timestamps and the reserved cap; invoke finalize. Provider/application failures use refund. Return 409 for a duplicate token belonging to a different user and 402 for insufficient allowance.

- [ ] **Step 4: Update balance UI**

Display balances as human-readable minutes, but retain seconds internally. Show two labeled values when both exist: “Monthly allowance” and “Permanent minutes.” Remove wallet currency and daily-free wording. Disable starts that exceed the total and offer the AI Coach/top-up choices defined in Plan 5.

- [ ] **Step 5: Verify contracts and regressions**

```powershell
node --test tests/speaking-allowance.test.mjs tests/speaking-session-contract.test.mjs tests/speaking-cost.test.mjs tests/speaking-ui.test.mjs
```

Expected: PASS; legacy cost tests are rewritten to assert allowance behavior rather than retained as false compatibility.

- [ ] **Step 6: Commit**

```powershell
git add netlify/functions/speaking-session.mjs netlify/functions/check-speaking-usage.mjs netlify/functions/_shared/speakingEntitlements.mjs src/pages/SpeakingPage.jsx src/components/speaking/SpeakingSession.jsx tests/speaking-session-contract.test.mjs tests/speaking-cost.test.mjs tests/speaking-ui.test.mjs
git commit -m "feat: reserve and settle speaking seconds"
```

### Task 4: Grant purchases, renewals and top-ups exactly once

**Files:**
- Modify: `netlify/functions/lemonsqueezy-webhook.mjs`
- Modify: `netlify/functions/_shared/pricing.mjs`
- Modify: `src/data/pricing.js`
- Modify: `astro-site/src/data/pricing.js`
- Modify: `src/config/lemonsqueezy.js`
- Create: `tests/webhook.test.mjs`
- Create: `tests/speaking-grants.test.mjs`

**Interfaces:**
- Product `course_a1_1`: 3,600 permanent seconds + mission attempts 1–12.
- Product `speaking_topup_60`: 3,600 permanent seconds.
- Successful AI Coach invoice: 7,200 expiring seconds keyed by subscription ID and billing-period start.

- [ ] **Step 1: Write failing idempotency tests**

Use a fake Supabase adapter and replay each webhook twice. Assert a course order creates one course bucket and 12 mission rows; a top-up creates one bucket; a renewal creates one period bucket. Assert grandfathered subscription price values do not change entitlement quantity.

- [ ] **Step 2: Add products and environment mappings**

Add `speaking_topup_60` at €6.99 and update AI Coach public prices to €12.99/month and €129/year. Keep existing Lemon Squeezy subscription rows untouched: users already paying €9.99/€79.99 remain on those remote variants while continuously subscribed. Add new variant environment names; do not commit IDs.

- [ ] **Step 3: Grant through database RPCs**

Course source ref: `order:{orderId}:course-a11`. Top-up source ref: `order:{orderId}:topup-60`. Subscription source ref: `subscription:{subscriptionId}:period:{periodStart}`. Use payload billing dates rather than local month boundaries. A replay must return the existing grant.

- [ ] **Step 4: Define refund semantics**

On a course/top-up refund, mark unspent grant seconds unavailable with a `revoke` entry without deleting used history or making a bucket negative. Revoke unused included mission attempts from that order. A subscription refund/expiry prevents future grants; already consumed seconds remain historical.

- [ ] **Step 5: Run and commit**

```powershell
node --test tests/webhook.test.mjs tests/speaking-grants.test.mjs tests/purchases.test.mjs
npm run check:duplicates
git add netlify/functions/lemonsqueezy-webhook.mjs netlify/functions/_shared/pricing.mjs src/data/pricing.js astro-site/src/data/pricing.js src/config/lemonsqueezy.js tests/webhook.test.mjs tests/speaking-grants.test.mjs
git commit -m "feat: grant fixed speaking allowances"
```

### Task 5: Reconcile abandoned reservations and prove concurrency safety

**Files:**
- Create: `netlify/functions/reconcile-speaking-reservations.mjs`
- Modify: `netlify.toml`
- Create: `tests/speaking-ledger-concurrency.test.mjs`
- Create: `tests/privacy.test.mjs`
- Modify: `netlify/functions/admin-user360.mjs`
- Modify: `netlify/functions/admin-usage.mjs`

- [ ] **Step 1: Write database integration tests**

Create two simultaneous reserve calls against a bucket with only one session's capacity. Assert exactly one succeeds. Replay start/end/refund requests and assert every balance and ledger sum is unchanged after the first application.

- [ ] **Step 2: Add reconciliation function**

Run every 15 minutes. Select reservations still `reserved` after their planned duration plus 10 minutes. Finalize to server-observed elapsed time when a session began successfully; otherwise fully refund. Use `reconcile:{sessionToken}` as the idempotency key and record counts only, never transcript text.

- [ ] **Step 3: Replace admin wallet reporting**

Show `monthlySeconds`, `permanentSeconds`, active reservations and recent ledger events. Remove `speaking_wallet.balance_cents` and transcript browsing from the default admin response. Detailed transcript access is removed because transcripts are no longer persisted by default.

- [ ] **Step 4: Verify**

```powershell
node --test tests/speaking-ledger-concurrency.test.mjs tests/admin-ops.test.mjs tests/privacy.test.mjs
npm run lint
```

Expected: concurrency, replay and privacy tests pass.

- [ ] **Step 5: Commit**

```powershell
git add netlify/functions/reconcile-speaking-reservations.mjs netlify.toml netlify/functions/admin-user360.mjs netlify/functions/admin-usage.mjs tests/speaking-ledger-concurrency.test.mjs tests/admin-ops.test.mjs tests/privacy.test.mjs
git commit -m "feat: reconcile speaking reservations"
```
