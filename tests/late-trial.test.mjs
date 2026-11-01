import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
process.env.UNSUB_SECRET = 'test-only-late-secret';
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
const { LATE_TRIAL_DAYS, lateTrialBounds, lateTrialEnabled, lateTrialItem, recheckLateRecipients, runLateTrial, selectLateRecipients } = await import('../netlify/functions/_shared/lateTrial.mjs');
const { TRIAL_KINDS, trialWindowBounds } = await import('../netlify/functions/trial-lifecycle.mjs');
const DAY = 86400000, now = Date.parse('2026-11-01T08:00:00Z');

test('late sequence is inert unless the owner explicitly enables it and sets a cohort', async () => {
  for (const env of [{}, { LIFECYCLE_LATE_TRIAL_ENABLED: 'TRUE' }, { LIFECYCLE_LATE_TRIAL_ENABLED: 'true' }]) {
    assert.equal(lateTrialEnabled(env), false);
    assert.deepEqual(await runLateTrial({ client: { from() { throw new Error('must not read'); } }, env }), { enabled: false, sent: 0 });
  }
});
test('14/30/60 windows are one day wide and disjoint from earlier trial/activation windows', () => {
  const ranges = TRIAL_KINDS.map((kind) => {
    const w = trialWindowBounds(kind, { now });
    // Convert signup-relative trial_day3 to the corresponding trial end.
    const offset = kind === 'trial_day3' ? 7 * DAY : 0;
    return [Date.parse(w.lower) + offset, Date.parse(w.upper) + offset];
  });
  for (const [kind, day] of Object.entries(LATE_TRIAL_DAYS)) {
    const w = lateTrialBounds(kind, now);
    const range = [Date.parse(w.lower), Date.parse(w.upper)];
    assert.equal(range[1] - range[0], DAY);
    assert.equal(now - range[1], day * DAY);
    for (const prior of ranges) assert.ok(range[1] <= prior[0] || prior[1] <= range[0]);
    assert.ok(day + 7 > 5, 'activation windows end by signup day five');
    ranges.push(range);
  }
});
function clientFor({ optedOut = false, subscribed = false, purchases = [], ledger = [], error = false } = {}) {
  const calls = [];
  const client = { calls, auth: { admin: { async listUsers() { return { data: { users: [{ id: 'u', email: 'learner@example.test', email_confirmed_at: '2026-01-01' }, { id: 'unconfirmed', email: 'unconfirmed@example.test' }] } }; } } }, from(table) {
    const query = { select() { return this; }, eq() { return this; }, is() { return this; }, gte(col, v) { calls.push([table, col, 'gte', v]); return this; }, lt(col, v) { calls.push([table, col, 'lt', v]); return this; }, in() { return this; },
      then(resolve) { return Promise.resolve({ error: error ? { message: 'unavailable' } : null, data: table === 'lifecycle_emails' ? ledger : table === 'mail_delivery_claims' ? [] : table === 'profiles' ? [{ id: 'u' }, { id: 'unconfirmed' }] : table === 'purchases' ? purchases : [{ user_id: 'u', is_subscribed: subscribed, email_opted_out: optedOut }, { user_id: 'unconfirmed', is_subscribed: false, email_opted_out: false }] }).then(resolve); } };
    return query;
  } };
  return client;
}
test('view is authoritative and any purchase, subscription, opt-out or read error stops follow-up', async () => {
  const recipients = [{ id: 'u', email: 'learner@example.test' }];
  assert.deepEqual(await recheckLateRecipients(clientFor(), recipients), recipients);
  for (const data of [{ optedOut: true }, { subscribed: true }, { purchases: [{ user_id: 'u' }] }]) assert.deepEqual(await recheckLateRecipients(clientFor(data), recipients), []);
  await assert.rejects(recheckLateRecipients(clientFor({ error: true }), recipients));
});
test('cohort, confirmed-address, dry and canary guards leave nonrecipients unclaimed', async () => {
  const client = clientFor();
  const cohortStart = new Date(now - 14.5 * DAY).toISOString();
  assert.deepEqual(await selectLateRecipients(client, 'trial_followup_d14', { now, cohortStart }), [{ id: 'u', email: 'learner@example.test' }]);
  assert.equal(client.calls[0][3], cohortStart);
  const env = { LIFECYCLE_LATE_TRIAL_ENABLED: 'true', LIFECYCLE_LATE_TRIAL_COHORT_START: cohortStart };
  const dry = await runLateTrial({ client, env, now, dry: true });
  assert.ok(dry.results.every((r) => r.sent === 0 && r.wouldSend === 1));
  const canary = await runLateTrial({ client, env, now, canary: new Set(['someone-else@example.test']) });
  assert.ok(canary.results.every((r) => r.sent === 0));
});
test('drafts use Sie, tagged useful/free links and unsubscribe, without urgency or inactivity claims', () => {
  for (const kind of Object.keys(LATE_TRIAL_DAYS)) {
    const item = lateTrialItem(kind, { id: 'u', email: 'learner@example.test' });
    assert.match(item.html, /Sie/);
    assert.match(item.html, /lang="de"/);
    assert.match(item.html, /utm_source=email/);
    assert.match(item.html, /course\/a1.1/);
    assert.ok(item.headers['List-Unsubscribe']);
    assert.doesNotMatch(item.html, /\bdu\b|\bdein\b|inaktiv|nicht genutzt|nur heute|letzte Chance|garantiert/i);
  }
  const source = readFileSync(new URL('../netlify/functions/_shared/lateTrial.mjs', import.meta.url), 'utf8');
  assert.match(source, /recheckLateRecipients\(client, \[r\]\)/);
  assert.match(source, /key: `lifecycle:\$\{r.id\}:\$\{kind\}`/);
});


test('an accepted or historical lifecycle claim is not counted as a new dry-run recipient', async () => {
  const client = clientFor({ ledger: [{ user_id: 'u' }, { user_id: 'unconfirmed' }] });
  assert.deepEqual(await selectLateRecipients(client, 'trial_followup_d14', { now, cohortStart: '2026-01-01' }), []);
});
