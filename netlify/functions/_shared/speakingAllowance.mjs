// Pure allocation policy for speaking seconds — the JS mirror of
// reserve_speaking_seconds in migrations/2026-09-16-speaking-allowances.sql.
//
// The database is the authority for every charge; this module exists so the
// server can pre-check requests and the UI can display an honest prediction
// (tests/speaking-allowance.test.mjs pins that both sides sort the same way:
// expiring buckets first, soonest expiry first, then permanent buckets,
// oldest first). camelCase at the JS boundary; snake_case rows are mapped in
// bucketFromRow once, nowhere else.

/** Map a speaking_credit_buckets row to the JS shape this module reads. */
export function bucketFromRow(row) {
  return {
    id: row.id,
    remainingSeconds: row.remaining_seconds,
    expiresAt: row.expires_at ?? null,
    createdAt: row.created_at ?? null,
  };
}

const isValidRequest = (n) => Number.isInteger(n) && n > 0;

function activeBuckets(buckets, now) {
  const t = (now instanceof Date ? now : new Date(now ?? Date.now())).getTime();
  return (buckets || [])
    .filter((b) => b && Number.isInteger(b.remainingSeconds) && b.remainingSeconds > 0)
    .filter((b) => !b.expiresAt || new Date(b.expiresAt).getTime() > t)
    .slice()
    .sort((a, b) => {
      const ax = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
      const bx = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
      if (ax !== bx) return ax - bx;
      const ac = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bc = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ac - bc;
    });
}

/**
 * allocateSeconds(buckets, requestedSeconds, now?) →
 *   { allocations: [{ bucketId, seconds }], shortfallSeconds }
 * Never mutates input. Invariant: sum(allocations) + shortfall === requested.
 */
export function allocateSeconds(buckets, requestedSeconds, now) {
  if (!isValidRequest(requestedSeconds)) throw new Error('INVALID_SECONDS');
  const allocations = [];
  let left = requestedSeconds;
  for (const bucket of activeBuckets(buckets, now)) {
    if (left === 0) break;
    const take = Math.min(bucket.remainingSeconds, left);
    allocations.push({ bucketId: bucket.id, seconds: take });
    left -= take;
  }
  return { allocations, shortfallSeconds: left };
}

/**
 * summarizeBalance(buckets, now?) →
 *   { monthlySeconds, permanentSeconds, totalSeconds }
 * "Monthly" = any unexpired expiring bucket; expired seconds are gone.
 */
export function summarizeBalance(buckets, now) {
  let monthlySeconds = 0;
  let permanentSeconds = 0;
  for (const bucket of activeBuckets(buckets, now)) {
    if (bucket.expiresAt) monthlySeconds += bucket.remainingSeconds;
    else permanentSeconds += bucket.remainingSeconds;
  }
  return { monthlySeconds, permanentSeconds, totalSeconds: monthlySeconds + permanentSeconds };
}
