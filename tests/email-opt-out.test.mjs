// Guard suite: every mailer that picks its own audience honours unsubscribes,
// at any list size, and a failed opt-out read sends nothing. Run with `npm test`.
//
// Why it exists (measured 2026-09-28, Supabase edge logs + Resend API log):
// daily-sentence.mjs read the opt-out flag for every confirmed account in one
// request, `.from('profiles').select('id, email_daily_sentence').in('id', <all
// 1,149 ids>)`. PostgREST filters travel in the URL, so that request carried
// every id (~45 KB) and the API answered 400. The code treated the error as
// "the column may not exist yet" and mailed everyone. The read answered 400 on
// every daily run checked from 2026-08-30 to 09-28, and the 09-28 run sent 12
// batches (11 x 100 + 49 = 1,149, every confirmed account). With the 61
// opt-outs honoured it would have been 1,088 in 11 batches. send-campaign.mjs,
// which the staged course-launch email goes through, had the same query and
// the same fallback. Nothing alerted, because a fail-soft fallback looks like
// a normal day.
//
// The class, closed by a rule instead of by patching two call sites:
//   1. Opt-outs have ONE reader, _shared/emailOptOut.mjs. It reads the
//      opted-out rows themselves (a set that does not grow with the audience),
//      pages past the server's row cap, and throws on any error.
//   2. No other `profiles` read in netlify/functions may filter on the flag,
//      and no read that names the flag may carry an `.in()` id list.
//   3. Each mailer is run here against a fake PostgREST that refuses an
//      over-long URL the way production does, at production's size and bigger.
//
// Addresses here are synthetic (`@example.test`); no real recipient appears.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { listSourceFiles, scanFiles } from './helpers/supabaseQueries.mjs';

// The modules read their secrets at import time and fail closed without them.
process.env.UNSUB_SECRET = 'test-only-unsub-secret';
delete process.env.SUPABASE_SERVICE_ROLE_KEY; // no live client in tests

const { fetchOptedOutIds, withoutOptedOut, OPT_OUT_PAGE_SIZE } = await import('../netlify/functions/_shared/emailOptOut.mjs');
const { getRecipients, orderRecipients } = await import('../netlify/functions/daily-sentence.mjs');
const { fetchAllUserEmails } = await import('../netlify/functions/send-campaign.mjs');
const { selectCandidates, MIN_AGE_DAYS, MAX_AGE_DAYS, PER_RUN } = await import('../netlify/functions/confirmation-nudge.mjs');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');

// Production refused the 1,149-id URL (~45 KB) and served every id list the
// lifecycle jobs send (a few dozen ids) in the same 24 h. 16 KB sits between
// the two, so this fake refuses what production refused and serves what it served.
const GATEWAY_URL_LIMIT = 16 * 1024;
// PostgREST on Supabase returns at most this many rows per request.
const MAX_ROWS = 1000;

const DAY = 24 * 60 * 60 * 1000;
const uuid = (i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;

/**
 * n synthetic auth users. `optedOut(i)` and `confirmed(i)` decide each one;
 * confirmed users confirmed one minute apart, all created `ageDays` ago.
 */
function accounts(n, { optedOut = () => false, confirmed = () => true, ageDays = 30 } = {}) {
  const users = [];
  const out = new Set();
  const created = new Date(Date.now() - ageDays * DAY);
  for (let i = 0; i < n; i++) {
    const id = uuid(i);
    users.push({
      id,
      email: `learner${i}@example.test`,
      email_confirmed_at: confirmed(i) ? new Date(Date.UTC(2026, 5, 1, 0, i)).toISOString() : null,
      created_at: new Date(created.getTime() + i * 1000).toISOString(),
      app_metadata: { provider: 'email' },
    });
    if (optedOut(i)) out.add(id);
  }
  // listUsers returns newest first; the mailers must not depend on that order.
  return { users: users.reverse(), optedOut: out };
}

/** 09-28's shape: 1,686 accounts, 1,149 confirmed, 61 of them opted out. */
function productionShape() {
  // Confirmed: the first 1,149. Opted out: every 19th confirmed account (61).
  return accounts(1686, {
    confirmed: (i) => i < 1149,
    optedOut: (i) => i < 1149 && i % 19 === 0,
  });
}

/**
 * A fake Supabase client: auth.admin.listUsers pages, and a PostgREST query
 * builder that renders the request URL the way supabase-js does, refuses one
 * over GATEWAY_URL_LIMIT with a 400, and caps rows at MAX_ROWS.
 * `failOptOutFrom`: the opt-out read errors once its range starts at or past
 * this offset (0 = always), to prove a failure on any page stops the send.
 */
function fakeDb({ users, optedOut }, { failOptOutFrom = Infinity } = {}) {
  const requests = [];
  const tables = {
    profiles: users.map((u) => ({ id: u.id, email_daily_sentence: !optedOut.has(u.id) })),
    lifecycle_emails: [],
  };

  class Query {
    constructor(table) {
      this.table = table;
      this.params = [];
      this.filters = [];
      this.cols = '*';
      this.orderCol = null;
      this.from = 0;
      this.to = Infinity;
    }
    select(cols = '*') { this.cols = cols; this.params.push(`select=${encodeURIComponent(cols)}`); return this; }
    eq(col, v) { this.params.push(`${col}=eq.${v}`); this.filters.push((r) => r[col] === v); return this; }
    in(col, vals) {
      this.params.push(`${col}=in.${encodeURIComponent(`(${vals.join(',')})`)}`);
      const s = new Set(vals);
      this.filters.push((r) => s.has(r[col]));
      return this;
    }
    order(col) { this.orderCol = col; this.params.push(`order=${col}.asc`); return this; }
    range(from, to) { this.from = from; this.to = to; return this; }
    then(resolve, reject) { return Promise.resolve().then(() => this.run()).then(resolve, reject); }
    run() {
      const url = `https://project.supabase.co/rest/v1/${this.table}?${this.params.join('&')}`;
      const namesFlag = this.params.some((p) => p.includes('email_daily_sentence'));
      requests.push({ table: this.table, url, namesFlag, hasIn: this.params.some((p) => p.includes('=in.')) });
      if (url.length > GATEWAY_URL_LIMIT) return { data: null, error: { message: 'Bad Request', status: 400 } };
      if (this.table === 'profiles' && namesFlag && this.from >= failOptOutFrom) {
        return { data: null, error: { message: 'canceling statement due to statement timeout' } };
      }
      let rows = (tables[this.table] || []).filter((r) => this.filters.every((f) => f(r)));
      if (this.orderCol) rows = [...rows].sort((a, b) => (a[this.orderCol] < b[this.orderCol] ? -1 : a[this.orderCol] > b[this.orderCol] ? 1 : 0));
      rows = rows.slice(this.from, Math.min(this.to + 1, this.from + MAX_ROWS));
      const cols = this.cols.split(',').map((c) => c.trim());
      return {
        data: rows.map((r) => (this.cols === '*' ? { ...r } : Object.fromEntries(cols.map((c) => [c, r[c]])))),
        error: null,
      };
    }
  }

  return {
    requests,
    auth: {
      admin: {
        listUsers: async ({ page = 1, perPage = 50 } = {}) => ({
          data: { users: users.slice((page - 1) * perPage, page * perPage) },
          error: null,
        }),
      },
    },
    from: (table) => new Query(table),
  };
}

const optOutReads = (db) => db.requests.filter((r) => r.table === 'profiles' && r.namesFlag);

// ---------------------------------------------------------------------------
// 0. the fake reproduces the incident
// ---------------------------------------------------------------------------

test('the fake refuses the old query at 1,149 ids, as production did, and serves a short id list', async () => {
  const shape = productionShape();
  const db = fakeDb(shape);
  const confirmedIds = shape.users.filter((u) => u.email_confirmed_at).map((u) => u.id);
  assert.equal(confirmedIds.length, 1149);

  const big = await db.from('profiles').select('id, email_daily_sentence').in('id', confirmedIds);
  assert.ok(big.error, 'the fake must refuse what production refused, or these tests prove nothing');
  assert.equal(big.error.status, 400);

  const small = await db.from('profiles').select('id, email_daily_sentence').in('id', confirmedIds.slice(0, 40));
  assert.equal(small.error, null);
  assert.equal(small.data.length, 40);
});

// ---------------------------------------------------------------------------
// 1. the shared reader
// ---------------------------------------------------------------------------

test('the reader asks for the opted-out rows only, so its request does not grow with the audience', async () => {
  for (const n of [1149, 5000, 20000]) {
    const shape = accounts(n, { optedOut: (i) => i % 19 === 0 });
    const db = fakeDb(shape);
    const ids = await fetchOptedOutIds(db);
    assert.deepEqual([...ids].sort(), [...shape.optedOut].sort(), `wrong opt-out set at ${n} accounts`);
    for (const r of optOutReads(db)) {
      assert.equal(r.hasIn, false, 'the opt-out read carries an id list');
      assert.ok(r.url.length < 300, `opt-out read URL is ${r.url.length} bytes at ${n} accounts`);
      assert.match(r.url, /email_daily_sentence=eq\.false/);
    }
  }
});

test('the reader pages past the server row cap', async () => {
  // 2,500 opt-outs: more than two full pages at the 1,000-row cap.
  const shape = accounts(3000, { optedOut: (i) => i < 2500 });
  const db = fakeDb(shape);
  const ids = await fetchOptedOutIds(db);
  assert.equal(ids.size, 2500, 'opt-outs past the first page were dropped');
  assert.equal(optOutReads(db).length, 3, 'pages of 1,000, 1,000 and 500');
});

test('the page size never exceeds the server row cap (a capped page would read as the last one)', () => {
  assert.ok(OPT_OUT_PAGE_SIZE <= MAX_ROWS, `page size ${OPT_OUT_PAGE_SIZE} > the ${MAX_ROWS}-row cap drops every opt-out past the cap`);
});

test('the reader throws when any page fails: a mailer that cannot tell who said stop must not send', async () => {
  const shape = accounts(3000, { optedOut: (i) => i < 2500 });
  await assert.rejects(fetchOptedOutIds(fakeDb(shape, { failOptOutFrom: 0 })), /opt-out read failed/);
  await assert.rejects(fetchOptedOutIds(fakeDb(shape, { failOptOutFrom: 1000 })), /opt-out read failed/);
  await assert.rejects(fetchOptedOutIds(null), /no database client/);
});

test('withoutOptedOut removes exactly the opted-out ids', () => {
  const people = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.deepEqual(withoutOptedOut(people, new Set(['b'])), [{ id: 'a' }, { id: 'c' }]);
  assert.deepEqual(withoutOptedOut(people, new Set()), people);
});

// ---------------------------------------------------------------------------
// 2. the daily sentence
// ---------------------------------------------------------------------------

test('daily sentence, 09-28 shape: 1,088 recipients, nobody who unsubscribed, nobody unconfirmed', async () => {
  const shape = productionShape();
  const db = fakeDb(shape);
  const list = await getRecipients(db);

  assert.equal(list.length, 1088, 'expected 1,149 confirmed - 61 opted out');
  assert.equal(Math.ceil(list.length / 100), 11, 'batches of 100: 11, not the 12 that went out on 09-28');
  assert.ok(list.every((r) => !shape.optedOut.has(r.id)), 'an opted-out account is still on the list');
  const unconfirmed = new Set(shape.users.filter((u) => !u.email_confirmed_at).map((u) => u.id));
  assert.ok(list.every((r) => !unconfirmed.has(r.id)), 'an unconfirmed account is on the list');
  assert.deepEqual(list, orderRecipients(list), 'the idempotency order was lost');
  assert.ok(db.requests.every((r) => r.url.length <= GATEWAY_URL_LIMIT), 'a request would be refused in production');
});

test('daily sentence still honours opt-outs at 5,000 confirmed accounts', async () => {
  const shape = accounts(5000, { optedOut: (i) => i % 7 === 0 });
  const list = await getRecipients(fakeDb(shape));
  assert.equal(list.length, 5000 - shape.optedOut.size);
  assert.ok(list.every((r) => !shape.optedOut.has(r.id)));
});

test('daily sentence: a failed opt-out read rejects, and the handler answers 500 before any batch', async () => {
  await assert.rejects(getRecipients(fakeDb(productionShape(), { failOptOutFrom: 0 })), /opt-out read failed/);

  const src = read('netlify/functions/daily-sentence.mjs');
  const call = src.indexOf('recipients = await getRecipients()');
  const send = src.indexOf('await sendDailyBatches({');
  assert.ok(call > 0 && send > call, 'recipients must be read before the send');
  assert.match(src.slice(call, send), /catch \(err\)[\s\S]*statusCode: 500/, 'a failed recipient read must end the run with 500');
});

// ---------------------------------------------------------------------------
// 3. send-campaign (the staged course-launch email goes through it)
// ---------------------------------------------------------------------------

test('send-campaign, 09-28 shape: 1,088 eligible, nobody who unsubscribed', async () => {
  const shape = productionShape();
  const list = await fetchAllUserEmails(fakeDb(shape));
  assert.equal(list.length, 1088);
  assert.ok(list.every((r) => !shape.optedOut.has(r.id)), 'an opted-out account would get the campaign');
});

test('send-campaign: a failed opt-out read rejects, and the handler answers 500 before any batch', async () => {
  await assert.rejects(fetchAllUserEmails(fakeDb(productionShape(), { failOptOutFrom: 0 })), /opt-out read failed/);

  const src = read('netlify/functions/send-campaign.mjs');
  const call = src.indexOf('recipients = await fetchAllUserEmails()');
  const send = src.indexOf('await sendBatch(resendKey');
  assert.ok(call > 0 && send > call, 'recipients must be read before the send');
  assert.match(src.slice(call, send), /catch \(err\)[\s\S]*statusCode: 500/, 'a failed recipient read must end the run with 500');
});

// ---------------------------------------------------------------------------
// 4. the confirmation nudge (bounded cohort, same reader)
// ---------------------------------------------------------------------------

test('confirmation nudge leaves out an unconfirmed account that opted out, and a failed read throws', async () => {
  const age = Math.floor((MIN_AGE_DAYS + MAX_AGE_DAYS) / 2);
  const shape = accounts(30, { confirmed: () => false, optedOut: (i) => i % 6 === 0, ageDays: age });
  const list = await selectCandidates(fakeDb(shape));
  assert.equal(list.length, Math.min(30 - shape.optedOut.size, PER_RUN));
  assert.ok(list.every((r) => !shape.optedOut.has(r.id)), 'an opted-out account would get the nudge');

  await assert.rejects(selectCandidates(fakeDb(shape, { failOptOutFrom: 0 })), /opt-out read failed/);
});

// ---------------------------------------------------------------------------
// 5. the rule: one reader, and no id list on an opt-out read
// ---------------------------------------------------------------------------

/** supabase-js chains in netlify/functions, as [{ file, line, table, refs }]. */
function functionChains() {
  const { refs } = scanFiles(listSourceFiles(['netlify/functions'], ROOT), ROOT);
  const chains = [];
  for (const r of refs) {
    if (r.method === 'from') chains.push({ file: r.file, line: r.line, table: r.table, refs: [] });
    else chains.at(-1)?.refs.push(r);
  }
  return chains;
}

const FILTERS = new Set(['eq', 'neq', 'is', 'not', 'filter', 'match', 'or', 'in', 'gt', 'gte', 'lt', 'lte']);
const READER = path.join('netlify', 'functions', '_shared', 'emailOptOut.mjs');

test('rule: only the shared reader filters on the opt-out flag, and no read that names it carries an id list', () => {
  const chains = functionChains().filter((c) => c.table === 'profiles');
  assert.ok(chains.length > 0, 'the scanner found no profiles queries — the rule would pass vacuously');

  const readerChains = chains.filter((c) => c.file === READER);
  assert.equal(readerChains.length, 1, 'the shared reader should hold exactly one profiles query');
  assert.ok(
    readerChains[0].refs.some((r) => r.column === 'email_daily_sentence' && r.method === 'eq'),
    'the shared reader no longer filters email_daily_sentence = false',
  );

  const offenders = [];
  for (const c of chains) {
    if (c.file === READER) continue;
    const flag = c.refs.filter((r) => r.column === 'email_daily_sentence');
    if (flag.length === 0) continue;
    if (flag.every((r) => r.method === 'update')) continue; // unsubscribe writes it
    if (flag.some((r) => FILTERS.has(r.method))) offenders.push(`${c.file}:${c.line} filters on the opt-out flag (use fetchOptedOutIds)`);
    if (c.refs.some((r) => r.method === 'in')) offenders.push(`${c.file}:${c.line} reads the opt-out flag through an .in() id list`);
  }
  assert.deepEqual(offenders, []);
});

test('rule: every mailer that reads opt-outs itself imports the shared reader', () => {
  for (const f of ['daily-sentence.mjs', 'send-campaign.mjs', 'confirmation-nudge.mjs']) {
    const src = read(`netlify/functions/${f}`);
    assert.match(src, /from '\.\/_shared\/emailOptOut\.mjs'/, `${f} does not import the shared opt-out reader`);
    assert.ok(src.includes('fetchOptedOutIds('), `${f} does not call the shared opt-out reader`);
    assert.ok(!/may not exist yet/.test(src), `${f} still carries the "column may not exist yet" send-to-everyone fallback`);
  }
});
