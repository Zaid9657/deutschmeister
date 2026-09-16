// The pure allocation policy — plan:
// docs/superpowers/plans/2026-09-15-speaking-entitlements-ledger.md Task 2.
//
// This mirrors reserve_speaking_seconds' SQL order (expiring first, soonest
// expiry first, then permanent, oldest first) so the UI can PREDICT what the
// database will do — it is never authoritative for a charge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allocateSeconds, summarizeBalance } from '../netlify/functions/_shared/speakingAllowance.mjs';

test('uses expiring monthly seconds before permanent seconds', () => {
  const result = allocateSeconds([
    { id: 'permanent', remainingSeconds: 3600, expiresAt: null },
    { id: 'monthly', remainingSeconds: 300, expiresAt: '2026-10-01T00:00:00Z' },
  ], 420);
  assert.deepEqual(result, {
    allocations: [{ bucketId: 'monthly', seconds: 300 }, { bucketId: 'permanent', seconds: 120 }],
    shortfallSeconds: 0,
  });
});

test('reports a shortfall without inventing seconds', () => {
  assert.equal(allocateSeconds([{ id: 'a', remainingSeconds: 20, expiresAt: null }], 60).shortfallSeconds, 40);
});

test('zero buckets is a pure shortfall', () => {
  assert.deepEqual(allocateSeconds([], 60), { allocations: [], shortfallSeconds: 60 });
});

test('exact depletion leaves no shortfall and no over-allocation', () => {
  const r = allocateSeconds([{ id: 'a', remainingSeconds: 60, expiresAt: null }], 60);
  assert.deepEqual(r, { allocations: [{ bucketId: 'a', seconds: 60 }], shortfallSeconds: 0 });
});

test('two expiring buckets drain soonest-expiry first', () => {
  const r = allocateSeconds([
    { id: 'later', remainingSeconds: 100, expiresAt: '2026-11-01T00:00:00Z' },
    { id: 'sooner', remainingSeconds: 100, expiresAt: '2026-10-01T00:00:00Z' },
  ], 150);
  assert.deepEqual(r.allocations, [
    { bucketId: 'sooner', seconds: 100 },
    { bucketId: 'later', seconds: 50 },
  ]);
});

test('permanent buckets drain oldest first', () => {
  const r = allocateSeconds([
    { id: 'newer', remainingSeconds: 100, expiresAt: null, createdAt: '2026-09-10T00:00:00Z' },
    { id: 'older', remainingSeconds: 100, expiresAt: null, createdAt: '2026-09-01T00:00:00Z' },
  ], 150);
  assert.deepEqual(r.allocations, [
    { bucketId: 'older', seconds: 100 },
    { bucketId: 'newer', seconds: 50 },
  ]);
});

test('expired and empty buckets are ignored', () => {
  const now = new Date('2026-09-16T12:00:00Z');
  const r = allocateSeconds([
    { id: 'expired', remainingSeconds: 500, expiresAt: '2026-09-01T00:00:00Z' },
    { id: 'empty', remainingSeconds: 0, expiresAt: null },
    { id: 'live', remainingSeconds: 30, expiresAt: null },
  ], 60, now);
  assert.deepEqual(r, { allocations: [{ bucketId: 'live', seconds: 30 }], shortfallSeconds: 30 });
});

test('invalid requests are rejected, never silently coerced', () => {
  for (const bad of [0, -1, 1.5, NaN, Infinity, '60', null, undefined]) {
    assert.throws(() => allocateSeconds([], bad), /INVALID_SECONDS/, `accepted ${String(bad)}`);
  }
});

test('input is never mutated and the invariant sum(allocations)+shortfall === requested holds', () => {
  const buckets = [
    { id: 'm', remainingSeconds: 45, expiresAt: '2026-10-01T00:00:00Z' },
    { id: 'p', remainingSeconds: 100, expiresAt: null },
  ];
  const snapshot = JSON.parse(JSON.stringify(buckets));
  for (const requested of [1, 45, 46, 145, 500]) {
    const r = allocateSeconds(buckets, requested);
    const allocated = r.allocations.reduce((s, a) => s + a.seconds, 0);
    assert.equal(allocated + r.shortfallSeconds, requested, `invariant broken at ${requested}`);
  }
  assert.deepEqual(buckets, snapshot, 'allocateSeconds mutated its input');
});

test('summarizeBalance splits monthly and permanent and drops expired seconds', () => {
  const now = new Date('2026-09-16T12:00:00Z');
  const b = summarizeBalance([
    { id: 'm', remainingSeconds: 1200, expiresAt: '2026-10-01T00:00:00Z' },
    { id: 'old', remainingSeconds: 999, expiresAt: '2026-09-01T00:00:00Z' },
    { id: 'p1', remainingSeconds: 3600, expiresAt: null },
    { id: 'p2', remainingSeconds: 60, expiresAt: null },
  ], now);
  assert.deepEqual(b, { monthlySeconds: 1200, permanentSeconds: 3660, totalSeconds: 4860 });
});
