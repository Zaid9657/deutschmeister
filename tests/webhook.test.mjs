// Webhook fulfilment pins — plan Task 4 (speaking-entitlements-ledger).
//
// The behavioral replay tests live in tests/speaking-grants.test.mjs (fake
// adapter) and tests/speaking-ledger-concurrency.test.mjs (live RPCs); these
// pins hold the WIRING: which events call which grants, with which inputs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../netlify/functions/lemonsqueezy-webhook.mjs', import.meta.url), 'utf8');

test('a course_a1_1 order grants speaking benefits exactly once', () => {
  assert.match(src, /course\.productKey === 'course_a1_1'/);
  assert.match(src, /grantCourseSpeaking\(supabase, \{ userId, orderId \}\)/);
});

test('the top-up routes through its own handler, never the course path', () => {
  assert.match(src, /LEMONSQUEEZY_SPEAKING_TOPUP_60_VARIANT_ID: 'speaking_topup_60'/);
  assert.match(src, /handleTopupOrder\(/);
  assert.match(src, /grantTopupSpeaking\(supabase, \{ userId, orderId \}\)/);
  // The top-up must not appear in COURSE_VARIANT_ENV (it would get a Pro
  // window and a course subscriptions row it must not have).
  const courseMap = src.slice(src.indexOf('const COURSE_VARIANT_ENV'), src.indexOf('};', src.indexOf('const COURSE_VARIANT_ENV')));
  assert.ok(!courseMap.includes('speaking_topup_60'), 'top-up leaked into the course variant map');
});

test('a paid invoice grants the period allowance from payload billing dates', () => {
  assert.match(src, /grantSubscriptionSpeaking\(supabase, \{/);
  assert.match(src, /attributes\.billing_on/);
  assert.doesNotMatch(src, /getUTCMonth\(\)[^\n]*period/, 'period must come from the payload, not a local clock month');
});

test('an order refund revokes the order\'s speaking benefits', () => {
  assert.match(src, /revokeSpeakingForOrder\(supabase, \{/);
  const refundFn = src.slice(src.indexOf('async function handleOrderRefunded'), src.indexOf('function getSubscriptionTier'));
  assert.ok(refundFn.includes('revokeSpeakingForOrder'), 'refund handler does not revoke speaking benefits');
});
