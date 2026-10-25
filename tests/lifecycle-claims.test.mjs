import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { PLACEMENT_TEST_MINUTES } from '../src/data/marketing.js';

// The mailers read their secrets at import time and fail closed without them.
process.env.UNSUB_SECRET = process.env.UNSUB_SECRET || 'test-only-unsub-secret';
delete process.env.SUPABASE_SERVICE_ROLE_KEY; // no live client in tests

const recipients = ['learner-1', 'learner-2'].map((id) => ({ id, email: `${id}@example.test` }));
const mailers = ['trial-lifecycle', 'activation-lifecycle', 'course-reminder', 'confirmation-nudge'];

function claimClient(existing = []) {
  const ledger = new Set(existing);
  return {
    from(table) {
      assert.equal(table, 'lifecycle_emails');
      return {
        upsert(rows, options) {
          assert.equal(options.onConflict, 'user_id,kind');
          assert.equal(options.ignoreDuplicates, true);
          let returning = false;
          const query = {
            select() { returning = true; return this; },
            then(resolve, reject) {
              return Promise.resolve().then(() => {
                const inserted = rows.filter((row) => {
                  if (ledger.has(row.user_id)) return false;
                  ledger.add(row.user_id);
                  return true;
                });
                return { data: returning ? inserted : null, error: null };
              }).then(resolve, reject);
            },
          };
          return query;
        },
      };
    },
  };
}

// Run each mailer's actual claim/send path with selection and delivery replaced.
// The stale selection is deliberate: two scheduled invocations can select the
// same people before either one commits its claim.
function loadMailer(name, client, deliveries) {
  const src = readFileSync(new URL(`../netlify/functions/${name}.mjs`, import.meta.url), 'utf8');
  const isKind = name === 'trial-lifecycle' || name === 'activation-lifecycle';
  const start = src.indexOf(isKind ? 'async function sendKind(' : 'const innerHandler = async (event) => {');
  const end = src.indexOf(isKind ? '\n// ───' : '\nexport const handler = schedule(', start);
  assert.ok(start >= 0 && end > start, `${name}: claim/send path missing`);
  const ctx = {
    supabase: client,
    process: { env: { RESEND_API_KEY: 'test-key', COURSE_REMINDER_ENABLED: 'true', CONFIRM_NUDGE_ENABLED: 'true' } },
    supabaseKey: 'test-key', UNSUB_SECRET: 'test-secret', SECRET: 'test-secret', CAMPAIGN_SECRET: 'test-secret',
    FROM_ADDRESS: 'sender@example.test', BATCH_SIZE: 100, SUBJECT: 'Test',
    TEMPLATES: { test: { subject: 'Test' } },
    selectRecipients: async () => recipients,
    selectCandidates: async () => recipients,
    recheckStillNew: async (rows) => rows,
    recheckStillIdle: async (rows) => rows,
    renderHtml: () => 'test', bodyHtml: () => 'test', continueUrl: () => 'https://example.test/',
    reminderKindFor: () => 'course_reminder_2026-10-22',
    buildMessage: () => ({ subject: 'Test' }), SHELL: () => 'test', unsubscribeUrl: () => 'https://example.test/',
    mailItem: (_kind, r) => ({ to: [r.email], subject: 'Test', html: 'test' }),
    reminderItem: (r) => ({ to: [r.email], subject: 'Test', html: 'test' }),
    sendBatch: async (_key, items) => { deliveries.push(...items); },
    console: { log() {}, error() {}, warn() {} },
  };
  const fn = vm.runInNewContext(`${src.slice(start, end)}\n${isKind ? 'sendKind' : 'innerHandler'};`, ctx);
  return async () => {
    const result = isKind
      ? await fn('test-key', 'test', { dry: false, canary: new Set() })
      : await fn({ body: '{}', queryStringParameters: { secret: 'test-secret' } });
    return isKind ? result : JSON.parse(result.body);
  };
}

for (const name of mailers) {
  test(`${name}: ignored duplicate claims send nothing`, async () => {
    const deliveries = [];
    const result = await loadMailer(name, claimClient(recipients.map((r) => r.id)), deliveries)();
    assert.equal(deliveries.length, 0);
    assert.equal(result.sent, 0);
    assert.equal(result.failed, 0);
  });

  test(`${name}: only rows inserted by this run are sent and counted`, async () => {
    const deliveries = [];
    const result = await loadMailer(name, claimClient([recipients[0].id]), deliveries)();
    assert.deepEqual(deliveries.map((item) => Array.from(item.to)), [[recipients[1].email]]);
    assert.equal(result.sent, 1);
    assert.equal(result.failed, 0);
  });

  test(`${name}: concurrent stale selections deliver each claim once`, async () => {
    const deliveries = [];
    const run = loadMailer(name, claimClient(), deliveries);
    const results = await Promise.all([run(), run(), run()]);
    assert.deepEqual(deliveries.map((item) => item.to[0]).sort(), recipients.map((r) => r.email));
    assert.equal(results.reduce((sum, result) => sum + result.sent, 0), recipients.length);
    assert.equal(results.reduce((sum, result) => sum + result.failed, 0), 0);
  });
}

// ---------------------------------------------------------------------------
// The placement-test duration (review 2026-10-25, C-035/C-139/C-152/C-203)
// ---------------------------------------------------------------------------
//
// activation_d1 promised "the level test. Ten minutes" (subject: "Ten minutes is
// enough for a first step") while marketing.js says about PLACEMENT_TEST_MINUTES
// and the test's own first screen says 15-20. A function cannot import
// marketing.js, so the rule is: a mail that mentions or links the level test
// states no duration but PLACEMENT_TEST_MINUTES, anywhere in its subject or body.

const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  fifteen: 15, twenty: 20, thirty: 30, fünf: 5, zehn: 10, fünfzehn: 15, zwanzig: 20, dreißig: 30,
};
const DURATION = new RegExp(`\\b(\\d+|${Object.keys(NUMBER_WORDS).join('|')})(?:\\s*[-–]\\s*(\\d+))?[\\s-]*(?:minutes?|mins?\\b|Minuten)`, 'gi');
const MENTIONS_LEVEL_TEST = /level[- ]test|placement test|Einstufungstest|\/level-test\//i;

/** Every duration (in minutes) a mail states, when it mentions the level test; [] otherwise. */
function placementDurations(subject, html) {
  const text = `${subject}\n${html}`;
  if (!MENTIONS_LEVEL_TEST.test(text)) return [];
  const visible = text.replace(/<[^>]+>/g, ' ');
  const out = [];
  for (const m of visible.matchAll(DURATION)) {
    for (const v of [m[1], m[2]].filter(Boolean)) out.push(NUMBER_WORDS[v.toLowerCase()] ?? Number(v));
  }
  return out;
}

test('the rule catches the old activation_d1 copy and passes the canonical figure', () => {
  const old = '<p>So here\'s the smallest useful first step: the <strong>level test</strong>. Ten minutes, and it tells you exactly which lesson to start with.</p><a href="https://deutsch-meister.de/level-test/">Find your level</a>';
  assert.deepEqual(placementDurations('Ten minutes is enough for a first step', old), [10, 10]);
  assert.deepEqual(placementDurations('x', `<p>The level test takes about ${PLACEMENT_TEST_MINUTES} minutes.</p>`), [PLACEMENT_TEST_MINUTES]);
  assert.deepEqual(placementDurations('x', '<p>The 15-20 Minuten Einstufungstest</p>'), [15, 20]);
  assert.deepEqual(placementDurations('Three things worth 10 minutes', '<p>Sentence X-Ray</p>'), [], 'a mail without the level test is not this rule\'s business');
});

test('no mailer states a placement-test duration other than PLACEMENT_TEST_MINUTES', async () => {
  const trial = await import('../netlify/functions/trial-lifecycle.mjs');
  const activation = await import('../netlify/functions/activation-lifecycle.mjs');
  const course = await import('../netlify/functions/course-reminder.mjs');
  const welcome = await import('../netlify/functions/send-welcome-email.mjs');
  const nudge = await import('../netlify/functions/confirmation-nudge.mjs');
  const daily = await import('../netlify/functions/daily-sentence.mjs');
  const r = { id: '00000000-0000-4000-8000-000000000001', email: 'learner@example.test' };

  const mails = [
    ...trial.TRIAL_KINDS.map((kind) => [kind, trial.mailItem(kind, r)]),
    ...Object.keys(activation.TEMPLATES).map((kind) => [kind, activation.mailItem(kind, r)]),
    ['course-reminder lektion', course.reminderItem({ ...r, level: 'a1.1', nextNr: 4 })],
    ['course-reminder checkpoint', course.reminderItem({ ...r, level: 'a1.2', checkpointNr: 2 })],
    ['course-reminder generic', course.reminderItem({ ...r, level: 'b1.1' })],
    ['welcome', { subject: 'Welcome to DeutschMeister', html: welcome.welcomeHtml(r.email) }],
    ['confirm-nudge', { subject: '', html: nudge.bodyHtml('https://deutsch-meister.de/.netlify/functions/confirm-continue?uid=x&exp=1&token=y') }],
  ];
  const bodies = [];
  await daily.sendDailyBatches({
    recipients: [{ ...r, confirmedAt: '2026-08-01T00:00:00.000Z' }],
    sentence: { sentence_de: 'Ich habe heute keine Zeit.', level: 'A1', grammar_focus: 'Akkusativ', hint: 'kein or keine?' },
    runDate: '2026-10-25', resendKey: 'test', live: false,
    fetchImpl: async (_url, init) => { bodies.push(...JSON.parse(init.body)); return { ok: true, status: 200, text: async () => '{}' }; },
  });
  mails.push(['daily-sentence', bodies[0]]);

  for (const [name, item] of mails) {
    for (const minutes of placementDurations(item.subject, item.html)) {
      assert.equal(minutes, PLACEMENT_TEST_MINUTES, `${name}: states a ${minutes}-minute level test`);
    }
  }
  // activation_d1 still points at the level test (a text link), and says no duration at all.
  assert.match(activation.mailItem('activation_d1', r).html, /\/level-test\/\?utm_source=email/);
  assert.deepEqual(placementDurations(activation.TEMPLATES.activation_d1.subject, activation.mailItem('activation_d1', r).html), []);
});
