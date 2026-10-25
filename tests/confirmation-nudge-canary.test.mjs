// Guard suite: a confirmation-nudge canary address is selected however long
// the backlog in front of it is. Run with `npm test`.
//
// Why (review 2026-10-25, X-030): selectCandidates() sorted the unconfirmed
// cohort oldest first and cut it to PER_RUN (40) before the handler applied the
// LIFECYCLE_TEST_RECIPIENTS allowlist. The 40 oldest accounts were never
// claimed in canary mode, so they filled the same 40 slots on every run, and a
// fresh test account behind them could never be sent: the canary could not
// test anything while a backlog existed. The allowlist now narrows the cohort
// inside the selection, ahead of the cut. Synthetic addresses only.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

process.env.UNSUB_SECRET = 'test-only-unsub-secret';
delete process.env.SUPABASE_SERVICE_ROLE_KEY; // no live client in tests

const { selectCandidates, PER_RUN, MIN_AGE_DAYS } = await import('../netlify/functions/confirmation-nudge.mjs');

const DAY = 24 * 60 * 60 * 1000;
const CANARY = 'Owner.Canary@example.test';

/** `older` unconfirmed accounts 30 days old, then the canary, MIN_AGE_DAYS + 1 days old (the newest). */
function world({ older = PER_RUN + 1, claimed = [] } = {}) {
  const base = Date.now() - 30 * DAY;
  const users = Array.from({ length: older }, (_, i) => ({
    id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    email: `learner${i}@example.test`,
    email_confirmed_at: null,
    created_at: new Date(base + i * 1000).toISOString(),
    app_metadata: { provider: 'email' },
  }));
  users.push({ id: 'canary-user', email: CANARY, email_confirmed_at: null, created_at: new Date(Date.now() - (MIN_AGE_DAYS + 1) * DAY).toISOString(), app_metadata: { provider: 'email' } });
  const tables = { profiles: users.map((u) => ({ id: u.id, email_daily_sentence: true })), lifecycle_emails: claimed.map((id) => ({ user_id: id, kind: 'confirm_nudge' })) };
  const reads = [];
  class Q {
    constructor(name) { Object.assign(this, { name, rows: [...(tables[name] || [])], lo: 0, hi: Infinity }); }
    select() { return this; }
    eq(k, v) { this.rows = this.rows.filter((r) => r[k] === v); return this; }
    in(k, vs) { reads.push({ table: this.name, ids: vs.length }); this.rows = this.rows.filter((r) => vs.includes(r[k])); return this; }
    order() { return this; }
    range(a, b) { this.lo = a; this.hi = b; return this; }
    then(res, rej) { return Promise.resolve({ data: this.rows.slice(this.lo, this.hi + 1), error: null }).then(res, rej); }
  }
  return {
    reads,
    from: (name) => new Q(name),
    auth: { admin: { listUsers: async ({ page = 1, perPage = 50 } = {}) => ({ data: { users: users.slice((page - 1) * perPage, page * perPage) }, error: null }) } },
  };
}

test('the control: without the allowlist, the per-run cut is the 40 oldest accounts', async () => {
  const picked = await selectCandidates(world());
  assert.equal(picked.length, PER_RUN);
  assert.ok(!picked.some((r) => r.id === 'canary-user'), 'the canary sits behind 41 older accounts');
});

test('with the allowlist, the canary behind 41 older accounts is selected (it never was before)', async () => {
  const db = world();
  const picked = await selectCandidates(db, { canary: new Set([CANARY.toLowerCase()]) });
  assert.deepEqual(picked.map((r) => [r.id, r.email]), [['canary-user', CANARY.toLowerCase()]]);
  // The narrowing happens before the ledger read, so the id list stays short.
  assert.deepEqual(db.reads, [{ table: 'lifecycle_emails', ids: 1 }]);
});

test('the allowlist keeps the one-nudge-ever promise and leaves everyone else unclaimed', async () => {
  assert.deepEqual(await selectCandidates(world({ claimed: ['canary-user'] }), { canary: new Set([CANARY.toLowerCase()]) }), [], 'an already nudged canary is not nudged twice');
  assert.deepEqual(await selectCandidates(world(), { canary: new Set(['nobody@example.test']) }), [], 'an allowlist that matches nobody selects nobody');
  // An empty allowlist is "no canary mode": the ordinary run.
  assert.equal((await selectCandidates(world(), { canary: new Set() })).length, PER_RUN);
});

test('the sentinel contract is unchanged: limit Infinity and no allowlist returns the whole due cohort', async () => {
  assert.equal((await selectCandidates(world(), { limit: Infinity })).length, PER_RUN + 2);
});

test('the handler passes its allowlist into the selection instead of filtering after the cut', () => {
  const src = readFileSync(new URL('../netlify/functions/confirmation-nudge.mjs', import.meta.url), 'utf8');
  const handler = src.slice(src.indexOf('const innerHandler'));
  assert.match(handler, /selectCandidates\(supabase, \{ canary \}\)/);
  assert.doesNotMatch(handler, /recipients\.filter\(\(r\) => canary\.has/, 'a filter after the PER_RUN cut starves the canary');
});
