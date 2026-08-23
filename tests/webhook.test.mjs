// Who gets charged.
//
// The Lemon Squeezy webhook is the ONLY thing in this system that grants paid
// access: RLS blocks the browser from writing `subscriptions` or
// `profiles.is_subscribed`, so a forged POST that this handler accepts is a
// free subscription. Until this file existed, nothing tested that gate.
//
// Scope: the gate, not the handlers. Everything up to and including signature
// verification runs without a database. The per-event handlers do real writes,
// so what is asserted about them here is the ack-vs-retry contract, which is
// observable without one — see the last two tests.
//
// Hermetic: SUPABASE_URL points at a closed local port, so the client
// constructs and every query fails immediately with a connection error. No
// network leaves the machine, and no external service is contacted.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';

const SECRET = 'test-webhook-secret';
const FN = '../netlify/functions/lemonsqueezy-webhook.mjs';

// The module reads process.env and builds its Supabase client at import time,
// so the environment has to be in place before the dynamic import below.
process.env.SUPABASE_URL = 'http://127.0.0.1:1';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.LEMONSQUEEZY_WEBHOOK_SECRET = SECRET;

const { handler } = await import(FN);

const sign = (body, secret = SECRET) => createHmac('sha256', secret).update(body).digest('hex');
const post = (body, signature) => ({
  httpMethod: 'POST',
  headers: signature === undefined ? {} : { 'x-signature': signature },
  body,
});

const payload = (eventName, extra = {}) =>
  JSON.stringify({
    meta: { event_name: eventName, custom_data: { user_id: 'user-1' } },
    data: { id: 1, attributes: {} },
    ...extra,
  });

test('only POST reaches the gate', async () => {
  assert.equal((await handler({ httpMethod: 'OPTIONS', headers: {}, body: '' })).statusCode, 200,
    'preflight is answered so the browser can call it');
  for (const method of ['GET', 'PUT', 'DELETE', 'PATCH']) {
    assert.equal((await handler({ httpMethod: method, headers: {}, body: '' })).statusCode, 405, method);
  }
});

test('an unsigned request is rejected', async () => {
  const res = await handler(post(payload('subscription_created')));
  assert.equal(res.statusCode, 401);
  assert.match(String(res.body), /signature/i);
});

test('a wrong signature is rejected — both wrong-length and right-length', async () => {
  const body = payload('subscription_created');

  // Wrong length: timingSafeEqual throws, verifySignature catches, returns false.
  assert.equal((await handler(post(body, 'deadbeef'))).statusCode, 401, 'short signature');

  // Right length, wrong value: exercises the actual constant-time comparison
  // rather than the length exception. This is the case that matters.
  const forged = sign(body, 'not-the-real-secret');
  assert.equal(forged.length, sign(body).length, 'same length, so the comparison runs');
  assert.notEqual(forged, sign(body));
  assert.equal((await handler(post(body, forged))).statusCode, 401, 'forged signature');
});

test('the signature is over the body, not just the secret', async () => {
  // A signature harvested from one delivery must not authenticate another
  // payload. Without this, a replayed header could carry an attacker's body.
  const real = payload('subscription_created');
  const swapped = payload('subscription_created', { data: { id: 999, attributes: {} } });
  assert.notEqual(real, swapped);

  const res = await handler(post(swapped, sign(real)));
  assert.equal(res.statusCode, 401, 'signature of a different body must not verify');
});

test('a correctly signed request passes the gate', async () => {
  // The positive control. Without it, every assertion above would still pass if
  // the handler simply rejected everything.
  const body = payload('an_event_this_handler_does_not_implement');
  const res = await handler(post(body, sign(body)));
  assert.equal(res.statusCode, 200, 'a valid signature is accepted');
});

test('a missing secret fails closed, it does not skip verification', async () => {
  // A deployment error must never degrade into an open endpoint. Re-imported in
  // a child process because the module captures the environment at load.
  const { execFileSync } = await import('node:child_process');
  const script = `
    process.env.SUPABASE_URL = 'http://127.0.0.1:1';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k';
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    const { handler } = await import('./netlify/functions/lemonsqueezy-webhook.mjs');
    const res = await handler({ httpMethod: 'POST', headers: { 'x-signature': 'anything' }, body: '{}' });
    process.stdout.write(String(res.statusCode));
  `;
  const out = execFileSync(process.execPath, ['--input-type=module', '-e', script],
    { cwd: new URL('..', import.meta.url).pathname, stdio: ['ignore', 'pipe', 'ignore'] });
  assert.equal(out.toString(), '500', 'no secret → 500, never 200');
});

test('unknown events are acked; known events that fail are left for retry', async () => {
  // Lemon Squeezy retries on non-2xx. The distinction is deliberate and worth
  // pinning: an event this handler does not implement is final (200, no retry
  // storm), while an event it does implement failing mid-write is transient
  // (500, retry). Here the write fails because the database is unreachable.
  const unknown = payload('some_event_added_by_lemonsqueezy_later');
  assert.equal((await handler(post(unknown, sign(unknown)))).statusCode, 200,
    'unhandled event type is acknowledged, not retried forever');

  const known = payload('subscription_created');
  assert.equal((await handler(post(known, sign(known)))).statusCode, 500,
    'a handled event whose write fails must return non-2xx so it is retried');
});

test('the dispatch covers every Lemon Squeezy event the integration relies on', async () => {
  // Structural, in the style of tests/claims.test.mjs: read the source and
  // compare the switch arms to the expected set. Guards against an event
  // handler being dropped in a refactor — which would silently stop granting
  // or revoking access for that event, with no error anywhere.
  const src = readFileSync(new URL(FN, import.meta.url), 'utf8');
  const handled = [...src.matchAll(/^\s*case '([a-z_]+)':/gm)].map((m) => m[1]).sort();

  assert.deepEqual(handled, [
    'order_created',
    'subscription_cancelled',
    'subscription_created',
    'subscription_expired',
    'subscription_payment_failed',
    'subscription_payment_success',
    'subscription_updated',
  ], 'the handled event set changed — update this list in the same commit, deliberately');

  // Each arm must actually call something; an empty case is a silent drop.
  for (const name of handled) {
    const arm = src.slice(src.indexOf(`case '${name}':`));
    assert.match(arm.slice(0, 200), /await handle[A-Za-z]+\(/, `${name} dispatches to a handler`);
  }
});
