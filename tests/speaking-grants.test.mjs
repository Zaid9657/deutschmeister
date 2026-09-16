// Grant orchestration — plan Task 4 (speaking-entitlements-ledger).
//
// A course order grants 3,600 permanent seconds + 12 mission attempts; a
// top-up grants 3,600 permanent seconds; a subscription invoice grants 7,200
// seconds for its billing period. Replays must not double-grant: the ledger's
// (user, source, source_ref) uniqueness decides, which the fake adapter
// simulates here and tests/speaking-ledger-concurrency.test.mjs proves live.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  grantCourseSpeaking,
  grantTopupSpeaking,
  grantSubscriptionSpeaking,
  revokeSpeakingForOrder,
  COURSE_SPEAKING_SECONDS,
  TOPUP_SECONDS,
  AI_COACH_MONTHLY_SECONDS,
  subscriptionPeriodRef,
} from '../netlify/functions/_shared/speakingGrants.mjs';

// Fake Supabase adapter: records rpc calls and enforces the same
// once-per-(user, source, source_ref) rule the real grant RPC enforces.
function fakeSupabase() {
  const calls = [];
  const buckets = new Set();
  const missions = new Set();
  return {
    calls,
    buckets,
    missions,
    rpc(fn, args) {
      calls.push({ fn, args });
      if (fn === 'grant_speaking_seconds') {
        const key = `${args.p_user_id}|${args.p_source}|${args.p_source_ref}`;
        const replayed = buckets.has(key);
        buckets.add(key);
        return Promise.resolve({ data: { bucketId: key, replayed }, error: null });
      }
      if (fn === 'grant_mission_attempts') {
        const key = `${args.p_user_id}|${args.p_source_ref}`;
        const created = missions.has(key) ? 0 : args.p_mission_keys.length;
        missions.add(key);
        return Promise.resolve({ data: created, error: null });
      }
      if (fn === 'revoke_speaking_grant') {
        return Promise.resolve({ data: { replayed: false, revokedSeconds: 100 }, error: null });
      }
      return Promise.resolve({ data: null, error: { message: `unknown rpc ${fn}` } });
    },
  };
}

const USER = 'user-1';

test('a course order creates one bucket and 12 mission attempts — replay creates nothing', async () => {
  const db = fakeSupabase();
  const first = await grantCourseSpeaking(db, { userId: USER, orderId: '900' });
  assert.equal(first.replayed, false);
  assert.equal(first.missionAttemptsCreated, 12);

  const replay = await grantCourseSpeaking(db, { userId: USER, orderId: '900' });
  assert.equal(replay.replayed, true);
  assert.equal(replay.missionAttemptsCreated, 0);

  assert.equal(db.buckets.size, 1, 'exactly one course bucket');
  const grant = db.calls.find((c) => c.fn === 'grant_speaking_seconds');
  assert.equal(grant.args.p_seconds, COURSE_SPEAKING_SECONDS);
  assert.equal(grant.args.p_source, 'course');
  assert.equal(grant.args.p_source_ref, 'order:900:course-a11');
  assert.equal(grant.args.p_expires_at ?? null, null, 'course seconds never expire');

  const attempts = db.calls.find((c) => c.fn === 'grant_mission_attempts');
  assert.equal(attempts.args.p_mission_keys.length, 12);
  assert.deepEqual(attempts.args.p_mission_keys.slice(0, 2), ['a11-m1', 'a11-m2']);
});

test('a top-up creates one permanent bucket', async () => {
  const db = fakeSupabase();
  await grantTopupSpeaking(db, { userId: USER, orderId: '901' });
  await grantTopupSpeaking(db, { userId: USER, orderId: '901' });
  assert.equal(db.buckets.size, 1);
  const grant = db.calls.find((c) => c.fn === 'grant_speaking_seconds');
  assert.equal(grant.args.p_seconds, TOPUP_SECONDS);
  assert.equal(grant.args.p_source, 'topup');
  assert.equal(grant.args.p_source_ref, 'order:901:topup-60');
  assert.equal(grant.args.p_expires_at ?? null, null, 'top-up seconds never expire');
});

test('a renewal creates one expiring period bucket keyed by subscription and billing period', async () => {
  const db = fakeSupabase();
  const periodStart = '2026-09-12T00:00:00Z';
  const expiresAt = '2026-10-12T00:00:00Z';
  await grantSubscriptionSpeaking(db, { userId: USER, subscriptionId: 'sub-7', periodStart, expiresAt });
  await grantSubscriptionSpeaking(db, { userId: USER, subscriptionId: 'sub-7', periodStart, expiresAt });
  assert.equal(db.buckets.size, 1, 'a replayed invoice must not double-grant');
  const grant = db.calls.find((c) => c.fn === 'grant_speaking_seconds');
  assert.equal(grant.args.p_seconds, AI_COACH_MONTHLY_SECONDS);
  assert.equal(grant.args.p_source, 'subscription');
  assert.equal(grant.args.p_source_ref, subscriptionPeriodRef('sub-7', periodStart));
  assert.equal(grant.args.p_expires_at, expiresAt, 'monthly seconds must expire');
});

test('grandfathered price values never change entitlement quantity', async () => {
  // A €9.99 grandfathered invoice and a €12.99 public invoice grant the same
  // 7,200 seconds — price is not an input to the grant at all.
  const db = fakeSupabase();
  const result = await grantSubscriptionSpeaking(db, {
    userId: USER, subscriptionId: 'sub-legacy', periodStart: '2026-09-01T00:00:00Z', expiresAt: '2026-10-01T00:00:00Z',
  });
  assert.equal(result.replayed, false);
  const grant = db.calls.find((c) => c.fn === 'grant_speaking_seconds');
  assert.ok(!('p_price' in grant.args) && !('price' in grant.args), 'price must not reach the grant');
  assert.equal(grant.args.p_seconds, AI_COACH_MONTHLY_SECONDS);
});

test('a refund revokes by the order source_ref without inventing negative buckets', async () => {
  const db = fakeSupabase();
  await revokeSpeakingForOrder(db, { userId: USER, orderId: '900', productKey: 'course_a1_1' });
  await revokeSpeakingForOrder(db, { userId: USER, orderId: '901', productKey: 'speaking_topup_60' });
  const revokes = db.calls.filter((c) => c.fn === 'revoke_speaking_grant');
  assert.equal(revokes.length, 2);
  assert.deepEqual(revokes.map((c) => [c.args.p_source, c.args.p_source_ref]), [
    ['course', 'order:900:course-a11'],
    ['topup', 'order:901:topup-60'],
  ]);
});
