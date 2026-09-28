// Guard suite for the daily-sentence mailer: once per recipient per day, even
// when Netlify invokes the scheduled function more than once. Run with `npm test`.
//
// Why it exists: on 2026-09-27 every confirmed recipient got the daily sentence
// twice. Resend's API log shows two complete sets of 12 batch requests
// (07:00:32 and 07:01:22 UTC) and its metrics 2,236 sends from deutsch-meister.de
// in that hour against 1,117 the day before. The schedule is registered once and
// the bundle had not changed since 09-12; Netlify retries a scheduled invocation
// it counts as failed, and the handler had no memory of the first run.
//
// The fix is a Resend Idempotency-Key per (UTC run date, batch index). These
// tests run the real batch builder against a fake Resend that implements the
// documented contract (same key + same payload within 24 h → cached answer,
// nothing sent; same key + different payload → 409), so they prove our half of
// it: a retry rebuilds byte-identical batches under the same keys.
//
// Addresses here are synthetic (`@example.test`); no real recipient appears.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// The module reads its secrets at import time and fails closed without them.
process.env.UNSUB_SECRET = 'test-only-unsub-secret';
delete process.env.SUPABASE_SERVICE_ROLE_KEY; // no live client in tests
const {
  sendDailyBatches,
  dailyBatchKey,
  orderRecipients,
  utcRunDate,
} = await import('../netlify/functions/daily-sentence.mjs');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = readFileSync(join(ROOT, 'netlify/functions/daily-sentence.mjs'), 'utf8');

const SENTENCE = {
  sentence_de: 'Ich habe heute keine Zeit.',
  level: 'A1',
  grammar_focus: 'Akkusativ',
  hint: 'Why is it "keine" and not "kein"?',
};

/** n synthetic recipients, confirmed one minute apart, in listUsers-ish (newest first) order. */
function people(n, { from = 0 } = {}) {
  const out = [];
  for (let i = from; i < from + n; i++) {
    out.push({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      email: `learner${i}@example.test`,
      confirmedAt: new Date(Date.UTC(2026, 7, 1, 0, i)).toISOString(),
    });
  }
  return out.reverse();
}

/** Fake Resend /emails/batch with the documented idempotency contract. */
function fakeResend() {
  const byKey = new Map(); // key -> body
  const deliveries = new Map(); // address -> count
  const requests = [];
  let killAfter = Infinity; // simulate a run that dies mid-way
  const fetchImpl = async (url, init) => {
    assert.equal(url, 'https://api.resend.com/emails/batch');
    const key = init.headers['Idempotency-Key'];
    requests.push({ key, body: init.body });
    if (requests.length > killAfter) throw new Error('function killed');
    if (key && byKey.has(key)) {
      if (byKey.get(key) !== init.body) {
        return { ok: false, status: 409, text: async () => '{"name":"invalid_idempotent_request"}' };
      }
      return { ok: true, status: 200, text: async () => '{"data":[]}' }; // replay: nothing sent
    }
    if (key) byKey.set(key, init.body);
    for (const item of JSON.parse(init.body)) {
      const to = item.to[0];
      deliveries.set(to, (deliveries.get(to) || 0) + 1);
    }
    return { ok: true, status: 200, text: async () => '{"data":[]}' };
  };
  return {
    fetchImpl,
    deliveries,
    requests,
    killAfterRequests(n) { killAfter = n; },
    revive() { killAfter = Infinity; requests.length = 0; },
  };
}

const run = (resend, recipients, { runDate = '2026-09-27', live = true } = {}) =>
  sendDailyBatches({
    recipients: orderRecipients(recipients),
    sentence: SENTENCE,
    runDate,
    resendKey: 're_test',
    live,
    fetchImpl: resend.fetchImpl,
  });

const counts = (resend) => [...resend.deliveries.values()];

// ---------------------------------------------------------------------------
// 1. the 2026-09-27 incident: the scheduler invokes the job twice
// ---------------------------------------------------------------------------

test('a retried scheduled run mails nobody twice (1,118 recipients, as on 09-27)', async () => {
  const resend = fakeResend();
  const list = people(1118);
  const first = await run(resend, list);
  // listUsers may return a different order the second time; the job must not care.
  const second = await run(resend, [...list].reverse());

  assert.equal(resend.deliveries.size, 1118, 'every recipient got the first run');
  assert.ok(counts(resend).every((c) => c === 1), 'someone got the daily sentence twice');
  assert.deepEqual(first, { sent: 1118, failed: 0, conflicts: 0 });
  assert.equal(second.conflicts, 0, 'the retry rebuilt different batches — Resend would refuse them (409)');
  assert.equal(second.failed, 0);
});

test('control: without keys the same retry double-sends (this is the bug the keys close)', async () => {
  const resend = fakeResend();
  const list = people(250);
  await run(resend, list, { live: false });
  await run(resend, list, { live: false });
  assert.ok(counts(resend).every((c) => c === 2));
});

test('a retry rebuilds byte-identical requests under identical keys', async () => {
  const a = fakeResend();
  const b = fakeResend();
  const list = people(230);
  await run(a, list);
  await run(b, [...list.slice(100), ...list.slice(0, 100)]); // rotated input order
  assert.deepEqual(
    b.requests.map((r) => [r.key, r.body]),
    a.requests.map((r) => [r.key, r.body]),
  );
});

// ---------------------------------------------------------------------------
// 2. the other ways a day's list changes between two runs
// ---------------------------------------------------------------------------

test('a run killed half-way is resumed exactly by the retry', async () => {
  const resend = fakeResend();
  const list = people(1118); // 12 batches
  resend.killAfterRequests(5); // batches 1–5 go out, then the function dies
  const first = await run(resend, list);
  assert.equal(first.sent, 500);
  resend.revive();
  await run(resend, list);
  assert.equal(resend.deliveries.size, 1118, 'the retry must reach the batches the first run never sent');
  assert.ok(counts(resend).every((c) => c === 1));
});

test('someone confirming between the runs joins the end; nobody is mailed twice', async () => {
  const resend = fakeResend();
  const list = people(1118);
  await run(resend, list);
  const withNew = [...people(1, { from: 5000 }), ...list]; // newest first, as listUsers would
  const second = await run(resend, withNew);
  assert.ok(counts(resend).every((c) => c === 1));
  // Only the last, partial batch changed members — it is refused, not re-sent.
  assert.equal(second.conflicts, 19);
});

test('a new confirmation that opens a new batch is mailed once', async () => {
  const resend = fakeResend();
  const list = people(200); // exactly two full batches
  await run(resend, list);
  await run(resend, [...people(1, { from: 5000 }), ...list]);
  assert.equal(resend.deliveries.get('learner5000@example.test'), 1);
  assert.ok(counts(resend).every((c) => c === 1));
});

test('the next day is a new day: the keys roll over and everyone gets the new sentence', async () => {
  const resend = fakeResend();
  const list = people(150);
  await run(resend, list, { runDate: '2026-09-27' });
  await run(resend, list, { runDate: '2026-09-28' });
  assert.ok(counts(resend).every((c) => c === 2));
});

// ---------------------------------------------------------------------------
// 3. the key itself
// ---------------------------------------------------------------------------

test('dailyBatchKey is (run date, batch index) and nothing else', () => {
  assert.equal(dailyBatchKey('2026-09-27', 0), 'daily-sentence/2026-09-27/batch-0');
  assert.equal(dailyBatchKey('2026-09-27', 11), 'daily-sentence/2026-09-27/batch-11');
  assert.throws(() => dailyBatchKey('27.09.2026', 0));
  assert.throws(() => dailyBatchKey('2026-09-27', -1));
  assert.throws(() => dailyBatchKey('2026-09-27', 1.5));
  assert.ok(dailyBatchKey('2026-09-27', 3).length <= 256, 'Resend caps keys at 256 characters');
});

test('the run date is the UTC calendar day', () => {
  assert.equal(utcRunDate(new Date('2026-09-27T07:00:32Z')), '2026-09-27');
  assert.equal(utcRunDate(new Date('2026-09-27T23:59:59Z')), '2026-09-27');
  assert.equal(utcRunDate(new Date('2026-09-28T00:00:00Z')), '2026-09-28');
});

test('recipients are ordered by confirmation time, then id — not by input order', () => {
  const list = people(5);
  const ordered = orderRecipients(list);
  assert.deepEqual(ordered.map((r) => r.email), [0, 1, 2, 3, 4].map((i) => `learner${i}@example.test`));
  assert.deepEqual(orderRecipients([...list].reverse()), ordered);
  const tie = [{ id: 'b', confirmedAt: 'x' }, { id: 'a', confirmedAt: 'x' }];
  assert.deepEqual(orderRecipients(tie).map((r) => r.id), ['a', 'b']);
});

test('test sends carry no key, so a morning test can never occupy a live batch key', async () => {
  const resend = fakeResend();
  await run(resend, people(1), { live: false });
  assert.equal(resend.requests[0].key, undefined);
  await run(resend, people(1));
  assert.equal(resend.requests[1].key, 'daily-sentence/2026-09-27/batch-0');
});

// ---------------------------------------------------------------------------
// 4. the handler wiring (read from the source)
// ---------------------------------------------------------------------------

test('the handler sends live runs through the keyed path', () => {
  assert.match(SRC, /sendDailyBatches\(\{[\s\S]*?live: !isTest/);
  assert.match(SRC, /headers\['Idempotency-Key'\] = idempotencyKey/);
  assert.match(SRC, /return orderRecipients\(emails\.filter/, 'getRecipients must return a deterministic order');
  assert.doesNotMatch(SRC, /new Date\(\)\.toLocaleDateString/, 'the header date must come from the run date, or a retry payload can differ');
});

test('the auth gate is unchanged: scheduler marker, secret, or bounded test', () => {
  assert.match(SRC, /const isScheduled = typeof bodyPayload\.next_run === 'string';/);
  assert.match(SRC, /const secretOk = Boolean\(CAMPAIGN_SECRET\) && qs\.secret === CAMPAIGN_SECRET;/);
  assert.match(SRC, /if \(!isTest && !isScheduled && !secretOk\)/);
  assert.match(SRC, /if \(!UNSUB_SECRET\) return \{ statusCode: 500/);
  assert.match(SRC, /schedule\('0 7 \* \* \*', innerHandler\)/);
});
