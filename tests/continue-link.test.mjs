// Guard suite for the signed continue link (netlify/functions/continue.mjs)
// and the next-step resolver it opens (course-reminder.mjs resolveNextPaths).
// Run with `npm test`.
//
// Why (2026-11-15, plan "Stop the leaks", step 2): no lifecycle mail signed a
// learner in, and only the course reminder linked to the learner's own next
// step. Trial day 3, trial ended and activation day 4 now carry a link that
// does both. It is a bearer credential for seven days, so these tests pin:
//   1. the token: it verifies for its own uid, destination and expiry, and for
//      nothing else (expired, tampered, another purpose's token);
//   2. the destination: only the course's own pages, checked when the link is
//      built and when it is clicked: never an open redirect;
//   3. fail closed: no secret, no link and no sign-in;
//   4. the click: a valid link mints a magic link that lands on
//      /login?next=<step> with the mail's tags; anything else lands on /login
//      and mints nothing; a link checker's HEAD mints nothing;
//   5. the resolver: the step it names is the step the course home opens next;
//   6. end to end, for each changed mail: the button, resolved for a learner
//      with progress, is a signed continue URL whose destination is that
//      learner's next step, and LoginPage's own ?next= rule accepts it.
//
// Ids and addresses are synthetic; no real recipient appears.

import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.UNSUB_SECRET = 'test-only-unsub-secret';
delete process.env.SUPABASE_SERVICE_ROLE_KEY; // no live client in tests

const cont = await import('../netlify/functions/continue.mjs');
const confirm = await import('../netlify/functions/confirm-continue.mjs');
const course = await import('../netlify/functions/course-reminder.mjs');
const trial = await import('../netlify/functions/trial-lifecycle.mjs');
const activation = await import('../netlify/functions/activation-lifecycle.mjs');
const { nextPath: loginNextPath } = await import('../src/lib/loginReturn.js');
const { FIRST_LESSON_HREF } = await import('../src/lib/firstRun.js');

const SECRET = process.env.UNSUB_SECRET;
const SITE = 'https://deutsch-meister.de';
const UID = '00000000-0000-4000-8000-000000000001';
const NOW = Date.UTC(2026, 10, 15, 8);
const DAY = 24 * 3600 * 1000;
const TAGS = { medium: 'lifecycle', campaign: 'trial-day3', content: 'cta' };

const paramsOf = (href) => Object.fromEntries(new URL(href).searchParams);

// ─── 1. the token ────────────────────────────────────────────────────────────

test('a link verifies for seven days, for its own uid, destination and expiry only', () => {
  const p = paramsOf(cont.continueUrl(UID, '/course/a1.1/l/4', TAGS, { secret: SECRET, now: NOW }));
  assert.equal(cont.CONTINUE_TTL_DAYS, 7, 'founder-approved: seven days');
  assert.equal(Number(p.exp), Math.floor(NOW / 1000) + 7 * 24 * 3600);
  assert.ok(cont.verifyContinue(p, { secret: SECRET, now: NOW }));
  assert.ok(cont.verifyContinue(p, { secret: SECRET, now: NOW + 7 * DAY - 1000 }), 'still valid just before the end');
  assert.ok(!cont.verifyContinue(p, { secret: SECRET, now: NOW + 7 * DAY + 1000 }), 'expired after seven days');

  // Tampering with any signed field, or the token itself, fails.
  for (const [field, value] of [
    ['uid', '00000000-0000-4000-8000-000000000002'],
    ['dest', '/course/a1.1/l/5'],
    ['exp', String(Number(p.exp) + 3600)],
    ['token', p.token.replace(/^./, p.token[0] === 'a' ? 'b' : 'a')],
    ['token', 'not-hex'],
    ['token', ''],
  ]) {
    assert.ok(!cont.verifyContinue({ ...p, [field]: value }, { secret: SECRET, now: NOW }), `tampered ${field}`);
  }
  assert.ok(!cont.verifyContinue({ ...p, exp: `${p.exp}.5` }, { secret: SECRET, now: NOW }), 'a non-integer expiry');
  assert.ok(!cont.verifyContinue(p, { secret: 'another-secret', now: NOW }), 'another secret');
});

test('single purpose: a confirmation-nudge token never verifies here, nor this one there', () => {
  const exp = Math.floor(NOW / 1000) + 3600;
  const confirmToken = confirm.continueToken(SECRET, UID, exp);
  assert.ok(!cont.verifyContinue({ uid: UID, dest: '/course/a1.1', exp: String(exp), token: confirmToken }, { secret: SECRET, now: NOW }));
  assert.notEqual(cont.continueToken(SECRET, UID, '/course/a1.1', exp), confirmToken);
});

// ─── 2. the destination ──────────────────────────────────────────────────────

const SAFE = ['/course/a1.1', '/course/a1.1/l/1', '/course/a1.1/l/12', '/course/a1.2/checkpoint/4', '/course/a1.2/l/7'];
const UNSAFE = [
  'https://evil.example/', '//evil.example', '/\\evil.example', '/login', '/admin', '/dashboard', '/subscription?buy=monthly',
  '/course/a1.1/', '/course/a1.1/l/1?x=1', '/course/a1.1/l/1#x', '/course/a1.1/l/13', '/course/a1.1/l/0', '/course/a1.1/l/01',
  '/course/a1.1/checkpoint/5', '/course/b1.1', '/course/a1.1/../admin', '/course/A1.1', '/modelltest/abschlusstest-a1-1',
  '/course/a1.1/l/1\n', '', null, undefined, 42,
];

test('only the course’s own pages are destinations, checked when built and when clicked', () => {
  for (const path of SAFE) assert.ok(cont.isContinuePath(path), path);
  for (const path of UNSAFE) {
    assert.ok(!cont.isContinuePath(path), String(path));
    assert.throws(() => cont.continueUrl(UID, path, TAGS, { secret: SECRET, now: NOW }), /not a continue destination/, String(path));
    // Even correctly signed, an unsafe destination does not verify.
    const exp = Math.floor(NOW / 1000) + 3600;
    assert.ok(!cont.verifyContinue({ uid: UID, dest: path, exp: String(exp), token: cont.continueToken(SECRET, UID, path, exp) }, { secret: SECRET, now: NOW }), String(path));
  }
  // Every page the course tables hold is reachable, and nothing beyond them.
  for (const [level, titles] of Object.entries(course.LEKTION_TITLES)) {
    assert.ok(cont.isContinuePath(`/course/${level}/l/${titles.length}`));
    assert.ok(!cont.isContinuePath(`/course/${level}/l/${titles.length + 1}`));
  }
});

test('the landing is /login on our own host, never a destination from the query', () => {
  const landing = new URL(cont.loginLanding('/course/a1.1/l/4', { utm_source: 'email', utm_medium: 'lifecycle', utm_campaign: 'trial-day3', utm_content: 'cta', token: 'secret' }));
  assert.equal(landing.origin, SITE);
  assert.equal(landing.pathname, '/login');
  assert.equal(landing.searchParams.get('next'), '/course/a1.1/l/4');
  assert.equal(landing.searchParams.get('utm_campaign'), 'trial-day3');
  assert.ok(!landing.search.includes('token') && !landing.search.includes(UID), 'the credential never reaches the page');
  assert.equal(cont.loginLanding('https://evil.example/', {}), `${SITE}/login`, 'an unsafe destination is dropped');
  // Tags are forwarded only as the mail wrote them: email source, valid labels.
  assert.equal(cont.loginLanding('/course/a1.1', { utm_source: 'evil', utm_medium: 'x', utm_campaign: 'y', utm_content: 'z' }), `${SITE}/login?next=%2Fcourse%2Fa1.1`);
  assert.equal(cont.loginLanding('/course/a1.1', { utm_source: 'email', utm_medium: 'lifecycle', utm_campaign: 'Bad Label', utm_content: 'cta' }), `${SITE}/login?next=%2Fcourse%2Fa1.1`);
  // LoginPage honours exactly this next (src/lib/loginReturn.js).
  for (const path of SAFE) assert.equal(loginNextPath(new URL(cont.loginLanding(path)).searchParams.get('next')), path, path);
});

// ─── 3. fail closed ──────────────────────────────────────────────────────────

test('without the secret nothing is signed and nothing signs in', async () => {
  assert.equal(cont.continueSecret({}), null);
  assert.equal(cont.continueSecret({ CAMPAIGN_SECRET: 'c' }), 'c');
  assert.throws(() => cont.continueUrl(UID, '/course/a1.1/l/1', TAGS, { secret: null, now: NOW }), /not set/);
  const p = paramsOf(cont.continueUrl(UID, '/course/a1.1/l/1', TAGS, { secret: SECRET, now: NOW }));
  assert.ok(!cont.verifyContinue(p, { secret: null, now: NOW }));
  const db = authDb();
  const res = await cont.continueHandler({ httpMethod: 'GET', queryStringParameters: p }, { client: db, secret: null, now: NOW });
  assert.equal(res.statusCode, 500);
  assert.equal((await cont.continueHandler({ httpMethod: 'GET', queryStringParameters: p }, { client: null, secret: SECRET, now: NOW })).statusCode, 500);
  assert.deepEqual(db.calls, [], 'nothing was looked up or minted');
  // The mailers refuse too: no secret, no mail with a button.
  assert.throws(() => cont.continueUrl(UID, '/course/a1.1/l/1', TAGS, { secret: cont.continueSecret({}) }), /not set/);
});

// ─── 4. the click ────────────────────────────────────────────────────────────

/** auth.admin with one confirmed learner; records every call. */
function authDb({ users = { [UID]: { id: UID, email: 'learner@example.test', email_confirmed_at: '2026-11-01T00:00:00Z' } }, linkError = null } = {}) {
  const calls = [];
  return {
    calls,
    auth: {
      admin: {
        getUserById: async (id) => { calls.push(['getUserById', id]); return users[id] ? { data: { user: users[id] }, error: null } : { data: null, error: { message: 'not found' } }; },
        generateLink: async (args) => {
          calls.push(['generateLink', args]);
          return linkError ? { data: null, error: linkError } : { data: { properties: { action_link: 'https://omqyueddktqeyrrqvnyq.supabase.co/auth/v1/verify?token=t&type=magiclink' } }, error: null };
        },
      },
    },
  };
}

const click = (href, opts = {}, method = 'GET') => cont.continueHandler(
  { httpMethod: method, queryStringParameters: paramsOf(href) },
  { secret: SECRET, now: NOW, ...opts },
);

test('a valid click mints a fresh magic link that lands on /login?next=<step>, with the mail’s tags', async () => {
  const href = cont.continueUrl(UID, '/course/a1.1/checkpoint/1', TAGS, { secret: SECRET, now: NOW });
  const db = authDb();
  const res = await click(href, { client: db });
  assert.equal(res.statusCode, 302);
  assert.match(res.headers.Location, /^https:\/\/omqyueddktqeyrrqvnyq\.supabase\.co\/auth\/v1\/verify\?/);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(res.headers['Referrer-Policy'], 'no-referrer', 'the token never leaks as a referrer');
  assert.deepEqual(db.calls[0], ['getUserById', UID], 'identity from the token only');
  const [, args] = db.calls[1];
  assert.equal(args.type, 'magiclink');
  assert.equal(args.email, 'learner@example.test');
  const landing = new URL(args.options.redirectTo);
  assert.equal(`${landing.origin}${landing.pathname}`, `${SITE}/login`);
  assert.equal(landing.searchParams.get('next'), '/course/a1.1/checkpoint/1');
  assert.deepEqual(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].map((k) => landing.searchParams.get(k)), ['email', 'lifecycle', 'trial-day3', 'cta']);
});

test('anything but a valid click lands on /login and mints nothing', async () => {
  const href = cont.continueUrl(UID, '/course/a1.1/l/2', TAGS, { secret: SECRET, now: NOW });
  const p = paramsOf(href);
  const cases = [
    ['expired', { now: NOW + 8 * DAY }, p],
    ['tampered destination', {}, { ...p, dest: '/course/a1.1/l/9' }],
    ['open redirect attempt', {}, { ...p, dest: 'https://evil.example/' }],
    ['no token', {}, { ...p, token: undefined }],
  ];
  for (const [name, opts, qs] of cases) {
    const db = authDb();
    const res = await cont.continueHandler({ httpMethod: 'GET', queryStringParameters: qs }, { client: db, secret: SECRET, now: NOW, ...opts });
    assert.equal(res.statusCode, 302, name);
    assert.equal(new URL(res.headers.Location).pathname, '/login', name);
    assert.ok(!res.headers.Location.includes('evil'), name);
    assert.deepEqual(db.calls, [], `${name}: nothing looked up or minted`);
  }
  // An expired link still opens the step after an ordinary login.
  const expired = await click(href, { client: authDb(), now: NOW + 8 * DAY });
  assert.equal(new URL(expired.headers.Location).searchParams.get('next'), '/course/a1.1/l/2');

  // Deleted, banned, or a failed mint: the ordinary way in, no session.
  for (const [name, db] of [
    ['unknown user', authDb({ users: {} })],
    ['banned user', authDb({ users: { [UID]: { id: UID, email: 'learner@example.test', banned_until: '2099-01-01T00:00:00Z' } } })],
    ['mint failed', authDb({ linkError: { message: 'boom' } })],
  ]) {
    const res = await click(href, { client: db });
    assert.equal(new URL(res.headers.Location).pathname, '/login', name);
  }
});

test('a link checker’s HEAD mints nothing, and other methods are refused', async () => {
  const href = cont.continueUrl(UID, '/course/a1.1/l/2', TAGS, { secret: SECRET, now: NOW });
  const db = authDb();
  assert.equal((await click(href, { client: db }, 'HEAD')).statusCode, 204);
  assert.equal((await click(href, { client: db }, 'POST')).statusCode, 405);
  assert.deepEqual(db.calls, []);
});

// ─── 5. the resolver ─────────────────────────────────────────────────────────

const done = (...ids) => ids.map((lektion_id) => ({ lektion_id, status: 'complete' }));

test('nextStepPath names the page the course opens next', () => {
  assert.equal(course.FIRST_STEP_PATH, FIRST_LESSON_HREF, 'no progress: the SPA first run’s Lektion 1');
  const cases = [
    [[], '/course/a1.1/l/1'],
    [[{ lektion_id: 'a1.1-l1', status: 'started' }], '/course/a1.1/l/1'],
    [done('a1.1-l1', 'a1.1-l2'), '/course/a1.1/l/3'],
    [done('a1.1-l1', 'a1.1-l2', 'a1.1-l3'), '/course/a1.1/checkpoint/1'],
    [done('a1.1-l1', 'a1.1-l2', 'a1.1-l3', 'a1.1-cp1'), '/course/a1.1/l/4'],
    [done('a1.1-l12', 'a1.1-cp4'), '/course/a1.1'], // the Abschlusstest, the course home's last node
    [done('a1.1-l5', 'a1.2-l2'), '/course/a1.2/l/3'], // the later level is the one they are in
    [done('a1.2-l1'), '/course/a1.2/l/2'],
    [done('a1.2-l12', 'a1.2-cp4'), '/course/a1.2'],
  ];
  for (const [rows, path] of cases) {
    assert.equal(course.nextStepPath(rows), path, JSON.stringify(rows));
    assert.ok(cont.isContinuePath(path), path);
  }
  assert.equal(course.nextStepPath(done('a1.1-l12', 'a1.1-cp4'), { finalTestPassed: true }), '/course/a1.2/l/1', 'A1.1 passed: A1.2 starts');
  assert.equal(course.nextStepPath(done('a1.2-l12', 'a1.2-cp4'), { finalTestPassed: true }), '/course/a1.2', 'the last level passed: its course home');
});

/** The reads resolveNextPaths makes, over fixed tables. */
function progressDb({ lesson_progress = [], program_progress = [], exam_attempts = [], fail = null } = {}) {
  const tables = { lesson_progress, program_progress, exam_attempts };
  class Q {
    constructor(name) { this.name = name; this.rows = [...(tables[name] || [])]; this.lo = 0; this.hi = Infinity; }
    select() { return this; }
    in(k, vs) { this.rows = this.rows.filter((r) => vs.includes(r[k])); return this; }
    eq(k, v) { this.rows = this.rows.filter((r) => r[k] === v); return this; }
    order() { return this; }
    range(a, b) { this.lo = a; this.hi = b; return this; }
    then(res, rej) {
      const out = this.name === fail ? { data: null, error: { message: 'down' } } : { data: this.rows.slice(this.lo, this.hi + 1), error: null };
      return Promise.resolve(out).then(res, rej);
    }
  }
  return { from: (name) => new Q(name) };
}

test('resolveNextPaths reads every learner’s progress and the final test, and a failed read throws', async () => {
  const row = (user_id, lektion_id) => ({ user_id, lektion_id, status: 'complete' });
  const db = progressDb({
    lesson_progress: [row('mid', 'a1.1-l1'), row('mid', 'a1.1-l2'), row('final', 'a1.1-l12'), row('final', 'a1.1-cp4'), row('passed', 'a1.1-l12'), row('passed', 'a1.1-cp4')],
    program_progress: [{ user_id: 'passed', program_key: 'a11_course', item_id: 'a1.1-leveltest' }],
  });
  const paths = await course.resolveNextPaths(db, ['mid', 'final', 'passed', 'new']);
  assert.deepEqual(Object.fromEntries(paths), {
    mid: '/course/a1.1/l/3',
    final: '/course/a1.1',
    passed: '/course/a1.2/l/1',
    new: '/course/a1.1/l/1',
  });
  assert.deepEqual([...(await course.resolveNextPaths(db, []))], []);
  await assert.rejects(course.resolveNextPaths(progressDb({ fail: 'lesson_progress' }), ['mid']), /progress read failed/);
});

// ─── 6. end to end, per changed mail ─────────────────────────────────────────

const MAILERS = [
  ['trial_day3', trial, 'trial-day3'],
  ['trial_ended', trial, 'trial-ended'],
  ['activation_d4', activation, 'activation-d4'],
];

test('each changed mail’s button is a signed continue URL to that learner’s next step, and the click opens it signed in', async () => {
  const db = progressDb({ lesson_progress: ['a1.1-l1', 'a1.1-l2', 'a1.1-l3', 'a1.1-cp1', 'a1.1-l4'].map((id) => ({ user_id: UID, lektion_id: id, status: 'complete' })) });
  for (const [kind, mailer, campaign] of MAILERS) {
    const [recipient] = await mailer.withNextPaths(kind, [{ id: UID, email: 'learner@example.test' }], db);
    assert.equal(recipient.nextPath, '/course/a1.1/l/5', kind);
    const item = mailer.mailItem(kind, recipient, { now: NOW });
    const cta = [...item.html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]).find((h) => new URL(h).searchParams.get('utm_content') === 'cta');
    const url = new URL(cta);
    assert.equal(`${url.origin}${url.pathname}`, `${SITE}${cont.CONTINUE_FUNCTION_PATH}`, `${kind}: the button is the continue link`);
    assert.equal(url.searchParams.get('dest'), '/course/a1.1/l/5', `${kind}: the learner's next step`);
    assert.equal(url.searchParams.get('utm_campaign'), campaign, `${kind}: the tags stay`);
    assert.ok(cont.verifyContinue(paramsOf(cta), { now: NOW }), `${kind}: signed`);

    const auth = authDb();
    const res = await click(cta, { client: auth });
    assert.equal(res.statusCode, 302, kind);
    const landing = new URL(auth.calls[1][1].options.redirectTo);
    assert.equal(loginNextPath(landing.searchParams.get('next')), '/course/a1.1/l/5', `${kind}: LoginPage sends the signed-in learner to the step`);
    assert.equal(landing.searchParams.get('utm_campaign'), campaign, kind);
  }
});

test('the other kinds keep their buttons, and a failed progress read sends nothing for a next-step kind', async () => {
  const untouched = [{ id: UID, email: 'learner@example.test' }];
  assert.equal(await trial.withNextPaths('trial_day6', untouched, progressDb({ fail: 'lesson_progress' })), untouched, 'day 6 reads nothing');
  assert.equal(await activation.withNextPaths('activation_d1', untouched, progressDb({ fail: 'lesson_progress' })), untouched);
  await assert.rejects(trial.withNextPaths('trial_day3', untouched, progressDb({ fail: 'lesson_progress' })), /progress read failed/);
  // The read happens before the claim in both send paths.
  const { readFileSync } = await import('node:fs');
  for (const file of ['trial-lifecycle', 'activation-lifecycle']) {
    const src = readFileSync(new URL(`../netlify/functions/${file}.mjs`, import.meta.url), 'utf8');
    const send = src.slice(src.indexOf('async function sendKind('));
    assert.ok(send.indexOf('await withNextPaths(kind, recipients)') !== -1, `${file}: next steps resolved in the send path`);
    assert.ok(send.indexOf('await withNextPaths(kind, recipients)') < send.indexOf('.upsert('), `${file}: before the claim`);
  }
});
