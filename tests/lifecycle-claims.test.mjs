import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

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
