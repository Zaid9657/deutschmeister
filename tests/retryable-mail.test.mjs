import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sendRetryableMail, MAIL_RETRY_MS } from '../netlify/functions/_shared/retryableMail.mjs';

const now = Date.parse('2026-11-01T12:00:00Z');
function harness() {
  const claims = new Map(), accepted = new Map(), requests = [];
  let failStamp = false, status = 200, loseResponse = false;
  const client = {
    async rpc(_name, p) {
      if (!claims.has(p.p_key)) claims.set(p.p_key, { message_key: p.p_key, message: p.p_message, first_attempt_at: new Date(now).toISOString() });
      return { data: [{ ...claims.get(p.p_key) }] };
    },
    from(table) {
      assert.equal(table, 'mail_delivery_claims');
      return { update(patch) { return { eq(_col, key) { return { async is() {
        if (failStamp && patch.accepted_at) return { error: { message: 'db unavailable' } };
        if (!claims.get(key).accepted_at) Object.assign(claims.get(key), patch);
        return { error: null };
      } }; } }; } };
    },
  };
  const fetchImpl = async (_url, init) => {
    const key = init.headers['Idempotency-Key'];
    requests.push(init);
    if (status !== 200) return { ok: false, status };
    if (accepted.has(key)) assert.equal(accepted.get(key), init.body, 'same key must keep the exact payload');
    accepted.set(key, init.body);
    if (loseResponse) throw new Error('response lost');
    return { ok: true, json: async () => ({ id: 'provider-1' }) };
  };
  const send = (overrides = {}) => sendRetryableMail({ client, fetchImpl, now, maxAttempts: 1, pause: async () => {}, resendKey: 'stub', key: 'lifecycle:u:trial_ended', scope: 'lifecycle:u:trial_ended', kind: 'trial_ended', userId: 'u', message: { to: ['first@example.test'], html: 'original' }, ...overrides });
  return { claims, accepted, requests, send, client, setStatus: (v) => { status = v; }, setLoseResponse: (v) => { loseResponse = v; }, setFailStamp: (v) => { failStamp = v; } };
}
test('failed sends keep their claim and retry the exact stored payload/key', async () => {
  const h = harness(); h.setStatus(503);
  assert.equal((await h.send()).status, 'retryable');
  assert.equal(h.claims.size, 1);
  h.setStatus(200);
  assert.equal((await h.send({ message: { to: ['first@example.test'], html: 'changed release' } })).status, 'accepted');
  assert.equal(h.requests[0].body, h.requests[1].body);
  assert.equal((await h.send()).status, 'already_accepted');
  assert.equal(h.requests.length, 2);
});
test('lost responses, lost stamps and concurrent retries cannot create another provider message', async () => {
  const h = harness(); h.setLoseResponse(true);
  assert.equal((await h.send()).status, 'retryable');
  h.setLoseResponse(false); h.setFailStamp(true);
  await assert.rejects(h.send(), /stamp failed/);
  h.setFailStamp(false);
  await Promise.all([h.send(), h.send(), h.send()]);
  assert.equal(h.accepted.size, 1);
  assert.equal(h.claims.size, 1);
});
test('an ambiguous claim is held for review after the safe provider retry window, never deleted', async () => {
  const h = harness(); h.setLoseResponse(true); await h.send();
  assert.equal((await h.send({ now: now + MAIL_RETRY_MS })).status, 'needs_review');
  assert.equal(h.requests.length, 1);
  assert.equal(h.claims.size, 1);
});
test('claim failures and 409 conflicts never count as acceptance', async () => {
  const h = harness(); h.setStatus(409);
  assert.equal((await h.send()).status, 'retryable');
  assert.equal(h.accepted.size, 0);
  h.client.rpc = async () => ({ error: { message: 'schema missing' } });
  await assert.rejects(h.send(), /claim failed/);
  assert.equal(h.requests.length, 1);
});
test('database claim contract serializes subscriptions and preserves old lifecycle claims', () => {
  const sql = readFileSync(new URL('../migrations/2026-11-01-retryable-lifecycle-mail.sql', import.meta.url), 'utf8');
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /on conflict \(user_id, kind\) do nothing/);
  assert.match(sql, /if claimed is null then return/);
  assert.match(sql, /scope_key = p_scope and accepted_at is null/);
  assert.match(sql, /accepted_at > now\(\) - make_interval/);
  assert.doesNotMatch(sql.replace(/--[^\n]*/g, ''), /\bdelete\s+from\b/i);
  assert.match(sql, /revoke all on function[\s\S]*from public, anon, authenticated/);
  const webhook = readFileSync(new URL('../netlify/functions/lemonsqueezy-webhook.mjs', import.meta.url), 'utf8');
  assert.match(webhook, /PAYMENT_RECOVERY_RETRY_ENABLED === 'true'/);
  assert.match(webhook, /if \(error\) return; \/\/ no send without the failure record/);
  assert.match(webhook, /key: `dunning:\$\{eventId\}`/);
  assert.match(webhook, /scope: `dunning:\$\{subscriptionId\}`/);
});


test('transient errors are retried within the same invocation and original claim', async () => {
  const h = harness(); let attempts = 0;
  const result = await h.send({ maxAttempts: 3, fetchImpl: async (_url, init) => {
    attempts++;
    assert.ok(init.headers['Idempotency-Key']);
    return attempts < 3 ? { ok: false, status: 503 } : { ok: true, json: async () => ({ id: 'recovered' }) };
  } });
  assert.equal(result.status, 'accepted');
  assert.equal(attempts, 3);
  assert.equal(h.claims.size, 1);
});


test('a changed recipient or revoked eligibility stops a retained claim before sending', async () => {
  const h = harness(); h.setStatus(503); await h.send(); h.setStatus(200);
  assert.equal((await h.send({ message: { to: ['changed@example.test'], html: 'original' } })).status, 'needs_review');
  assert.equal((await h.send({ isEligible: async () => false })).status, 'skipped');
  assert.equal(h.requests.length, 1);
  assert.equal(h.claims.size, 1);
});


test('an owner-resolved unaccepted claim stays closed without deletion or a false acceptance stamp', async () => {
  const h = harness(); h.setStatus(503); await h.send();
  const claim = [...h.claims.values()][0];
  claim.closed_at = new Date(now).toISOString();
  claim.last_error = 'Owner verified no acceptance';
  assert.equal((await h.send()).status, 'closed');
  assert.equal(h.requests.length, 1);
  assert.equal(claim.accepted_at, undefined);
});
