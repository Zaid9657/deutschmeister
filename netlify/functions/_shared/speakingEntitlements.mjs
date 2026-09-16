// Server-side speaking entitlement resolution — plan:
// docs/superpowers/plans/2026-09-15-speaking-entitlements-ledger.md Task 3.
//
// Decides, from trusted server data only, how a session start is paid:
//   { kind: 'included-mission', missionKey, maxSeconds }  — a course buyer's
//     first attempt at a course mission; consumes the mission entitlement
//     atomically (consume_mission_attempt), never the minute buckets.
//   { kind: 'allowance', requestedSeconds }               — reserve from the
//     minute buckets (reserve_speaking_seconds decides sufficiency).
//   { kind: 'denied', code }                              — invalid request.
// The browser supplies wishes (mode, duration); it never supplies price,
// entitlement or balance.

/** Guided sessions reserve this server-calculated cap — never a client number. */
export const GUIDED_MISSION_SECONDS = 300;

/** The denial the reserve RPC raises when eligible seconds are short. */
export const INSUFFICIENT_ALLOWANCE = 'INSUFFICIENT_ALLOWANCE';

/**
 * Map a reserve_speaking_seconds RPC error onto the entitlement result
 * shape: { kind: 'denied', code: 'INSUFFICIENT_ALLOWANCE' } for a shortfall,
 * { kind: 'denied', code: 'DUPLICATE_SESSION' } for a foreign token, null
 * for anything else (a real server error).
 */
export function deniedFromReserveError(message) {
  const text = String(message || '');
  if (text.includes(INSUFFICIENT_ALLOWANCE)) return { kind: 'denied', code: INSUFFICIENT_ALLOWANCE };
  if (text.includes('DUPLICATE_SESSION')) return { kind: 'denied', code: 'DUPLICATE_SESSION' };
  return null;
}

/** The A1.1 course product whose purchase carries the included attempts. */
export const COURSE_PRODUCT_KEY = 'course_a1_1';

/** Mission entitlement key: level 'A1.1' + mission_order 12 → 'a11-m12'. */
export const missionEntitlementKey = (level, missionOrder) =>
  `${String(level || '').toLowerCase().replace(/\./g, '')}-m${Number(missionOrder)}`;

/** All 12 course mission keys for a level — what the webhook grants. */
export const courseMissionKeys = (level) =>
  Array.from({ length: 12 }, (_, i) => missionEntitlementKey(level, i + 1));

/**
 * Clamp a client-reported usedSeconds to what the server can defend: at most
 * the reserved cap, at most the observed elapsed time (with a small grace for
 * clock skew and the final turn in flight), never negative, integer.
 */
export function clampUsedSeconds({ usedSeconds, startedAt, reservedSeconds, now = Date.now() }) {
  const GRACE_SECONDS = 15;
  const reported = Number.isFinite(Number(usedSeconds)) ? Math.max(0, Math.floor(Number(usedSeconds))) : 0;
  const started = startedAt ? new Date(startedAt).getTime() : null;
  const elapsed = started && Number.isFinite(started)
    ? Math.max(0, Math.floor((Number(now) - started) / 1000)) + GRACE_SECONDS
    : reported;
  return Math.min(reported, elapsed, Math.max(0, Math.floor(Number(reservedSeconds) || 0)));
}

/**
 * Resolve how this start is paid. `mission` is the server-loaded
 * speaking_missions row (or null); `requestedSeconds` only matters for live
 * mode and must already be validated by the caller.
 */
export async function resolveEntitlement({ supabase, userId, mode, mission, requestedSeconds }) {
  if (mode === 'live') {
    if (!Number.isInteger(requestedSeconds) || requestedSeconds <= 0) {
      return { kind: 'denied', code: 'INVALID_DURATION' };
    }
    return { kind: 'allowance', requestedSeconds };
  }

  // Guided: a course buyer's FIRST attempt at a course mission is included.
  if (mission && mission.level && Number.isInteger(mission.mission_order)) {
    const missionKey = missionEntitlementKey(mission.level, mission.mission_order);
    const { data: owns, error: ownsError } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('product_key', COURSE_PRODUCT_KEY)
      .limit(1)
      .maybeSingle();
    if (!ownsError && owns) {
      const { data: consumed, error: consumeError } = await supabase
        .rpc('consume_mission_attempt', { p_user_id: userId, p_mission_key: missionKey });
      if (!consumeError && consumed === true) {
        return { kind: 'included-mission', missionKey, maxSeconds: GUIDED_MISSION_SECONDS };
      }
      // No attempt left (or RPC missing pre-migration): fall through to the
      // allowance — every retry uses minute buckets.
    }
  }

  return { kind: 'allowance', requestedSeconds: GUIDED_MISSION_SECONDS };
}

/**
 * Restore an included attempt after a start that consumed it could not
 * create its session row — the learner must not lose the attempt to our
 * insert failure.
 */
export async function restoreMissionAttempt({ supabase, userId, missionKey }) {
  const { data: row } = await supabase
    .from('speaking_mission_entitlements')
    .select('id, attempts_remaining, attempts_total')
    .eq('user_id', userId)
    .eq('mission_key', missionKey)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!row || row.attempts_remaining >= row.attempts_total) return false;
  const { error } = await supabase
    .from('speaking_mission_entitlements')
    .update({ attempts_remaining: row.attempts_remaining + 1 })
    .eq('id', row.id);
  return !error;
}
