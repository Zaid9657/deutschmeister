// Guard suite for SPEAKING SESSIONS WITH ZERO LEARNER TURNS (scorecard work
// order #5, 2026-09-27).
//
// Measured over the preceding 30 days: 45 sessions, 24 (53 %) with
// user_turns 0. Behind that figure were three defects:
//   - The allowance was reserved at START and never given back: 7 of 20 trial
//     sessions recorded belonged to sessions with no learner message at all
//     (two users lost both lifetime sessions that way). The mic permission was
//     only asked on the first tap — after the session was already counted.
//   - A session the learner walked away from never sent 'end' and stayed
//     'active' forever (18 of them), and user_turns was only written by that
//     client call — so 12 of those 18 "zero-turn" rows actually had 1–8
//     learner turns.
//   - Finish (or the timer) during an in-flight turn counted 0 turns, skipped
//     the evaluation and threw the answer away.
//
// What this pins:
//   1. THE RULE (_shared/speakingCloseout.mjs): a session closes on the learner
//      turns the SERVER counted; zero → 'cancelled' + reservation released
//      (trial unit deleted by its linked id, wallet debit refunded); any →
//      'completed'. Driven end-to-end against an in-memory database.
//   2. RACE SAFETY: a second close is a no-op — nothing is released twice.
//   3. STALENESS: the same grace window as speaking-turn; only stale 'active'
//      rows are swept, and a per-user sweep never touches another user.
//   4. THE WIRING: 'end' uses the rule (no client count/status), start links
//      the trial unit to its session and mints the token itself, the
//      subscriber count skips cancelled rows on both sides, check-speaking-
//      usage settles before it reports, the hourly job exists, and the client
//      asks for the microphone BEFORE the session is created.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  SESSION_GRACE_MINUTES,
  usageIdForToken,
  sessionDeadlineMs,
  isStale,
  closeOutPlan,
  closeOutSession,
  closeOutStaleSessions,
} from '../netlify/functions/_shared/speakingCloseout.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// --- a tiny in-memory stand-in for the supabase-js query builder -------------
// Supports exactly the chain shapes speakingCloseout.mjs uses.
function fakeDb(seed) {
  const tables = JSON.parse(JSON.stringify(seed));
  const log = [];
  class Query {
    constructor(name) {
      this.name = name;
      this.op = 'select';
      this.filters = [];
      this.single = false;
      this.max = null;
    }
    select() { return this; }
    update(patch) { this.op = 'update'; this.patch = patch; return this; }
    delete() { this.op = 'delete'; return this; }
    insert(rows) { this.op = 'insert'; this.rows = [].concat(rows); return this; }
    eq(k, v) { this.filters.push((r) => r[k] === v); return this; }
    lt(k, v) { this.filters.push((r) => r[k] < v); return this; }
    order() { return this; }
    limit(n) { this.max = n; return this; }
    maybeSingle() { this.single = true; return this; }
    then(resolve, reject) { return Promise.resolve().then(() => this.run()).then(resolve, reject); }
    run() {
      const rows = (tables[this.name] ||= []);
      const hit = (r) => this.filters.every((f) => f(r));
      log.push({ table: this.name, op: this.op });
      if (this.op === 'insert') {
        rows.push(...this.rows.map((r) => ({ ...r })));
        return { data: null, error: null };
      }
      if (this.op === 'delete') {
        tables[this.name] = rows.filter((r) => !hit(r));
        return { data: null, error: null };
      }
      let matched = rows.filter(hit);
      if (this.op === 'update') matched.forEach((r) => Object.assign(r, this.patch));
      if (this.max !== null) matched = matched.slice(0, this.max);
      const data = matched.map((r) => ({ ...r }));
      return { data: this.single ? (data[0] ?? null) : data, error: null };
    }
  }
  return { from: (name) => new Query(name), tables: () => tables, log };
}

const U1 = '11111111-1111-4111-8111-111111111111';
const U2 = '22222222-2222-4222-8222-222222222222';
const T_ZERO = 'sp_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const T_SPOKE = 'sp_bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const T_PAID = 'sp_cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const T_FRESH = 'sp_dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const T_OTHER = 'sp_eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const T_PLACE = 'sp_ffffffff-ffff-4fff-8fff-ffffffffffff';

const NOW = new Date('2026-09-27T12:00:00.000Z');
const ago = (min) => new Date(NOW.getTime() - min * 60000).toISOString();

const session = (token, userId, extra = {}) => ({
  session_token: token, user_id: userId, mode: 'free', status: 'active',
  started_at: ago(30), planned_minutes: 5, cost_cents: 0, user_turns: 0, ...extra,
});
const msg = (token, role, minAgo) => ({ session_token: token, role, created_at: ago(minAgo) });

function seed() {
  return {
    speaking_sessions: [
      session(T_ZERO, U1),                                   // opening only
      session(T_SPOKE, U1, { started_at: ago(40) }),         // learner spoke 3×
      session(T_PAID, U1, { cost_cents: 200, planned_minutes: 10 }),
      session(T_FRESH, U1, { started_at: ago(1) }),          // still live
      session(T_OTHER, U2),                                  // someone else's
      session(T_PLACE, U1, { mode: 'placement' }),           // quota-exempt
    ],
    speaking_messages: [
      msg(T_ZERO, 'assistant', 30),
      msg(T_SPOKE, 'assistant', 40), msg(T_SPOKE, 'user', 39), msg(T_SPOKE, 'assistant', 39),
      msg(T_SPOKE, 'user', 38), msg(T_SPOKE, 'assistant', 38), msg(T_SPOKE, 'user', 37),
      msg(T_PAID, 'assistant', 30),
      msg(T_FRESH, 'assistant', 1),
      msg(T_OTHER, 'assistant', 30),
      msg(T_PLACE, 'assistant', 30),
    ],
    speaking_usage: [
      { id: usageIdForToken(T_ZERO), user_id: U1 },
      { id: usageIdForToken(T_SPOKE), user_id: U1 },
      { id: usageIdForToken(T_FRESH), user_id: U1 },
      { id: 'legacy-row', user_id: U1 },
      { id: usageIdForToken(T_OTHER), user_id: U2 },
    ],
    speaking_wallet: [{ user_id: U1, balance_cents: 0 }],
    speaking_wallet_transactions: [],
  };
}

const row = (db, token) => db.tables().speaking_sessions.find((s) => s.session_token === token);
const usageIds = (db) => db.tables().speaking_usage.map((u) => u.id);

// --- 1. the pure rule --------------------------------------------------------

test('usageIdForToken links a server-minted token to its usage row, nothing else', () => {
  assert.equal(usageIdForToken(T_ZERO), 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  assert.equal(usageIdForToken('sp_AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA'), 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  for (const bad of [null, undefined, '', 'sp_', 'sp_not-a-uuid', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', `x${T_ZERO}`]) {
    assert.equal(usageIdForToken(bad), null, String(bad));
  }
});

test('closeOutPlan: any learner turn completes, zero turns cancels and releases', () => {
  assert.deepEqual(closeOutPlan({ userTurns: 3, mode: 'free', costCents: 0 }),
    { status: 'completed', userTurns: 3, releaseTrial: false, refundCents: 0 });
  assert.deepEqual(closeOutPlan({ userTurns: 1, mode: 'mission', costCents: 200 }),
    { status: 'completed', userTurns: 1, releaseTrial: false, refundCents: 0 }, 'a used paid session is not refunded');
  assert.deepEqual(closeOutPlan({ userTurns: 0, mode: 'free', costCents: 0 }),
    { status: 'cancelled', userTurns: 0, releaseTrial: true, refundCents: 0 });
  assert.deepEqual(closeOutPlan({ userTurns: 0, mode: 'mission', costCents: 300 }),
    { status: 'cancelled', userTurns: 0, releaseTrial: false, refundCents: 300 });
  assert.deepEqual(closeOutPlan({ userTurns: 0, mode: 'placement', costCents: 0 }),
    { status: 'cancelled', userTurns: 0, releaseTrial: false, refundCents: 0 }, 'placement is quota-exempt');
  assert.equal(closeOutPlan({ userTurns: null, mode: 'free', costCents: 0 }).status, 'cancelled');
});

// --- 2. close-out against the database --------------------------------------

test('a zero-turn trial session is cancelled and gives back exactly its own usage row', async () => {
  const db = fakeDb(seed());
  const out = await closeOutSession(db, row(db, T_ZERO), { now: NOW });
  assert.equal(out.closed, true);
  assert.equal(out.status, 'cancelled');
  assert.equal(out.released, true);
  assert.equal(row(db, T_ZERO).status, 'cancelled');
  assert.equal(row(db, T_ZERO).user_turns, 0);
  assert.ok(!usageIds(db).includes(usageIdForToken(T_ZERO)), 'its trial unit is released');
  for (const kept of [usageIdForToken(T_SPOKE), usageIdForToken(T_FRESH), 'legacy-row', usageIdForToken(T_OTHER)]) {
    assert.ok(usageIds(db).includes(kept), `must not touch ${kept}`);
  }
});

test('a session with learner turns completes on the SERVER count and keeps its charge', async () => {
  const db = fakeDb(seed());
  // The client reports a stale count (the turn in flight at Finish): ignored.
  const out = await closeOutSession(db, row(db, T_SPOKE), { durationSeconds: 120, now: NOW });
  assert.equal(out.status, 'completed');
  assert.equal(out.released, false);
  assert.equal(row(db, T_SPOKE).user_turns, 3);
  assert.equal(row(db, T_SPOKE).duration_seconds, 120);
  assert.ok(usageIds(db).includes(usageIdForToken(T_SPOKE)), 'a used session stays counted');
});

test('a zero-turn paid session is refunded once, and a second close is a no-op', async () => {
  const db = fakeDb(seed());
  const first = await closeOutSession(db, row(db, T_PAID), { now: NOW });
  assert.equal(first.refundCents, 200);
  assert.equal(db.tables().speaking_wallet[0].balance_cents, 200);
  const refunds = db.tables().speaking_wallet_transactions;
  assert.equal(refunds.length, 1);
  assert.equal(refunds[0].amount_cents, 200);
  assert.equal(refunds[0].session_token, T_PAID);

  const again = await closeOutSession(db, { ...row(db, T_PAID), status: 'active' }, { now: NOW });
  assert.equal(again.closed, false, 'the status flip is conditional on active');
  assert.equal(db.tables().speaking_wallet[0].balance_cents, 200, 'never refunded twice');
  assert.equal(db.tables().speaking_wallet_transactions.length, 1);
});

test('a client duration is bounded by the session budget', async () => {
  const db = fakeDb(seed());
  await closeOutSession(db, row(db, T_SPOKE), { durationSeconds: 99999, now: NOW });
  assert.equal(row(db, T_SPOKE).duration_seconds, (5 + SESSION_GRACE_MINUTES) * 60);
});

// --- 3. staleness and the sweep ---------------------------------------------

test('stale means past planned_minutes + the grace speaking-turn allows', () => {
  const s = session(T_ZERO, U1, { started_at: NOW.toISOString(), planned_minutes: 10 });
  const deadline = sessionDeadlineMs(s);
  assert.equal(deadline, NOW.getTime() + (10 + SESSION_GRACE_MINUTES) * 60000);
  assert.equal(isStale(s, deadline), false, 'a turn is still accepted at the deadline');
  assert.equal(isStale(s, deadline + 1), true);
  assert.equal(isStale({ ...s, status: 'completed' }, deadline + 1), false);
  assert.equal(isStale({ ...s, started_at: null }, deadline + 1), false);

  const turn = read('netlify/functions/speaking-turn.mjs');
  assert.ok(turn.includes("import { SESSION_GRACE_MINUTES } from './_shared/speakingCloseout.mjs'"),
    'speaking-turn must refuse turns on the same clock the sweep uses');
  assert.ok(!/const\s+GRACE_MINUTES\s*=/.test(turn), 'no second grace constant');
});

test("a per-user sweep closes only that user's stale sessions", async () => {
  const db = fakeDb(seed());
  const summary = await closeOutStaleSessions(db, { userId: U1, now: NOW });
  assert.deepEqual(summary, { scanned: 4, closed: 4, cancelled: 3, completed: 1 });
  assert.equal(row(db, T_FRESH).status, 'active', 'a live session is left alone');
  assert.equal(row(db, T_OTHER).status, 'active', "another user's session is left alone");
  assert.equal(row(db, T_PLACE).status, 'cancelled');
  assert.ok(usageIds(db).includes(usageIdForToken(T_FRESH)));
  assert.ok(usageIds(db).includes(usageIdForToken(T_OTHER)));

  const everyone = await closeOutStaleSessions(db, { now: NOW });
  assert.deepEqual(everyone, { scanned: 1, closed: 1, cancelled: 1, completed: 0 }, 'the schedule then settles the rest');
  assert.ok(!usageIds(db).includes(usageIdForToken(T_OTHER)));
  assert.equal(db.tables().speaking_sessions.filter((s) => s.status === 'active').length, 1);
});

// --- 4. the wiring -----------------------------------------------------------

test("speaking-session 'end' closes on the server count, never the client's", () => {
  const src = read('netlify/functions/speaking-session.mjs');
  const end = src.slice(src.indexOf("if (action === 'end')"), src.indexOf("action 'start'"));
  assert.ok(end.includes('closeOutSession(supabase, row'), "'end' must go through the one close-out rule");
  assert.ok(end.includes(".eq('user_id', user_id)"), 'only the caller can end their own session');
  assert.ok(!/user_turns\s*:\s*Number\.isFinite\(user_turns\)/.test(src), 'a client-reported turn count must not be written');
  assert.ok(!/status:\s*endStatus/.test(src), 'a client-supplied status must not be written');
  assert.ok(src.includes('const user_id = await getAuthenticatedUserId(event)'));
  assert.ok(src.includes('export const handler'), 'v1 handler signature');
  assert.ok(src.includes("'Access-Control-Allow-Origin'"), 'CORS preamble');
});

test('start links the trial unit to its session and settles stale sessions first', () => {
  const src = read('netlify/functions/speaking-session.mjs');
  assert.ok(src.includes('const sessionToken = `sp_${randomUUID()}`;'), 'the token is minted server-side, never chosen by the client');
  assert.ok(!src.includes('providedToken ||'), 'no client-chosen token on start');
  assert.ok(src.includes('incrementUsage(user_id, { id: usageIdForToken(sessionToken) })'),
    'the trial unit must be written under the session id so it can be released');
  const settle = src.indexOf('closeOutStaleSessions(supabase, { userId: user_id })');
  assert.ok(settle > 0 && settle < src.indexOf('await checkUsage(user_id)'), 'settle before the allowance is checked');
});

test('a cancelled session never uses up a subscriber free session — server and page agree', () => {
  const server = read('netlify/functions/speaking-session.mjs');
  const fn = server.slice(server.indexOf('async function freeFiveMinuteSessionsToday'), server.indexOf('async function walletBalance'));
  assert.ok(fn.includes(".neq('status', 'cancelled')"));
  const page = read('src/pages/SpeakingPage.jsx');
  const meta = page.slice(page.indexOf('const loadMeta'), page.indexOf("fetch('/api/speaking/check-speaking-usage'"));
  assert.ok(meta.includes(".neq('status', 'cancelled')"), 'the setup screen must count what the server counts');
});

test('check-speaking-usage settles the caller before it reports the allowance', () => {
  const src = read('netlify/functions/check-speaking-usage.mjs');
  const settle = src.indexOf('closeOutStaleSessions(supabase, { userId: authUserId })');
  assert.ok(settle > 0 && settle < src.indexOf('await checkUsage(authUserId)'));
});

test('the hourly close-out job is scheduled, locked down, and mirrored in netlify.toml', () => {
  const src = read('netlify/functions/speaking-closeout.mjs');
  const cron = (src.match(/export const handler = schedule\('([^']+)'/) || [])[1];
  assert.ok(cron, 'schedule() with a literal cron');
  assert.ok(src.includes("typeof bodyPayload.next_run === 'string'"), 'scheduler invocations only (or the secret)');
  assert.ok(src.includes('closeOutStaleSessions(supabase'), 'the job uses the one rule');
  const toml = read('netlify.toml');
  const mirrored = (toml.match(/\[functions\."speaking-closeout"\]\s*\n\s*schedule = "([^"]+)"/) || [])[1];
  assert.equal(mirrored, cron, 'netlify.toml must mirror the schedule() cron');
});

test('speaking-turn tells the client when a recording held no speech', () => {
  const src = read('netlify/functions/speaking-turn.mjs');
  assert.ok(src.includes('...(userTranscript ? {} : { noSpeech: true })'));
  assert.ok(read('src/components/speaking/SpeakingSession.jsx').includes('data.noSpeech === true'));
});

test('the microphone is granted BEFORE a session is created', () => {
  for (const file of ['src/pages/SpeakingPage.jsx', 'src/components/LevelTest/LevelTestSpeaking.jsx']) {
    const src = read(file);
    const mic = src.indexOf('await acquireMicrophone()');
    const start = src.indexOf("fetch('/api/speaking/speaking-session'");
    assert.ok(mic > 0 && start > mic, `${file}: mic permission must come before the start call`);
    assert.ok(src.includes('micStream={session.micStream}'), `${file}: hand the granted stream to the session`);
    assert.ok(src.includes('releaseMicrophone(mic)'), `${file}: release the mic when the start fails`);
  }
});

test('the session waits for a turn in flight and Cancel closes it on the server', () => {
  const src = read('src/components/speaking/SpeakingSession.jsx');
  const end = src.slice(src.indexOf('const endSession = useCallback'), src.indexOf('// ---- timer'));
  const wait = end.indexOf('await turnInFlightRef.current');
  const count = end.indexOf("filter((m) => m.role === 'user')");
  assert.ok(wait > 0 && count > wait, 'Finish/timer must wait for the pending turn before counting');
  assert.ok(src.includes('messagesRef.current = next;'), 'the landed turn is visible to endSession immediately');
  assert.ok(/inFlight \? inFlight\.then\(reportEnd, reportEnd\) : reportEnd\(\)/.test(src),
    'Cancel must send end (after any pending turn) — it used to leave the session active forever');
  assert.ok(!/action: 'end'[^}]*user_turns/.test(src), 'the client no longer reports a turn count');
});

test('the repair migration is data-only and wrapped in one transaction', () => {
  const sql = read('migrations/2026-09-27-speaking-zero-turn-closeout.sql');
  const body = sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n').toLowerCase();
  assert.ok(/^\s*begin;/m.test(body) && /^\s*commit;/m.test(body));
  assert.ok(!/\b(alter|create|drop|grant|revoke|truncate)\b/.test(body), 'no schema change');
  assert.ok(body.includes('delete from public.speaking_usage'));
  assert.ok(body.includes("make_interval(mins => ss.planned_minutes + 2)"), `same grace as the code (${SESSION_GRACE_MINUTES} min)`);
  assert.equal(SESSION_GRACE_MINUTES, 2);
  assert.ok(read('migrations/README.md').includes('2026-09-27-speaking-zero-turn-closeout.sql'));
});
