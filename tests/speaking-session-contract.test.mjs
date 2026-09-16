// Source-level contract for the speaking session endpoints — plan:
// docs/superpowers/plans/2026-09-15-speaking-entitlements-ledger.md Task 3.
//
// The browser may not be authoritative for entitlement, price, duration or
// balance. These pins read the function sources the way tests/claims.test.mjs
// reads the limit enforcers: the session function must charge through the
// ledger RPCs and nothing else.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const session = read('netlify/functions/speaking-session.mjs');
const usage = read('netlify/functions/check-speaking-usage.mjs');
const entitlements = read('netlify/functions/_shared/speakingEntitlements.mjs');

test('the session function charges through the ledger RPCs only', () => {
  assert.match(session, /reserve_speaking_seconds/);
  assert.match(session, /finalize_speaking_session/);
  assert.match(session, /refund_speaking_session/);
  assert.doesNotMatch(session, /balance_cents|cost_cents|PRICE_CENTS/, 'cents-based charging survived');
  assert.doesNotMatch(session, /SUBSCRIBER_FREE_5MIN_PER_DAY|freeFiveMinuteSessionsToday/, 'daily-free logic survived');
  assert.doesNotMatch(session, /debit_speaking_wallet|speaking_wallet/, 'wallet writes survived');
});

test('live durations are exactly 300/600/900 seconds, decided server-side', () => {
  assert.match(session, /LIVE_DURATIONS/);
  const m = session.match(/LIVE_DURATIONS\s*=\s*\[([^\]]+)\]/);
  assert.ok(m, 'LIVE_DURATIONS list missing');
  assert.deepEqual(m[1].split(',').map((s) => Number(s.trim())), [300, 600, 900]);
  // Guided sessions reserve a server-calculated cap, never a client number.
  assert.match(entitlements, /GUIDED_MISSION_SECONDS\s*=\s*300/);
});

test('every state change carries an idempotency key and identity from the JWT', () => {
  assert.match(session, /idempotencyKey/);
  assert.match(session, /getAuthenticatedUserId/);
  assert.doesNotMatch(session, /body\.user_id|body\.userId/, 'identity must never come from the body');
});

test('failure semantics: 402 insufficient, 409 foreign token, refund on failure outcome', () => {
  assert.match(session, /INSUFFICIENT_ALLOWANCE/);
  assert.match(session, /statusCode: 402/);
  assert.match(session, /DUPLICATE_SESSION/);
  assert.match(session, /statusCode: 409/);
});

test('usedSeconds is clamped to server time and the reserved cap', () => {
  assert.match(session, /clampUsedSeconds\(/, 'the end path must clamp through the shared helper');
  assert.match(entitlements, /export function clampUsedSeconds/);
});

test('the balance endpoint reports seconds, not cents or session counts', () => {
  assert.match(usage, /summarizeBalance|monthlySeconds/);
  assert.doesNotMatch(usage, /balance_cents|checkUsage\(/);
});

test('entitlement resolution consumes the included mission attempt server-side', () => {
  assert.match(entitlements, /consume_mission_attempt/);
  assert.match(entitlements, /included-mission/);
  assert.match(entitlements, /INSUFFICIENT_ALLOWANCE/);
});
