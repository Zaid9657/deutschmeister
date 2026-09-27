// The course v2 AI allowance, as the grading functions see it.
//
// The rule itself — who may use AI grading on which level, how many attempts a
// slot has, the daily fair-use cap — lives in ../entitlement.mjs (BLUEPRINT §1.5,
// §4.7; owned by the entitlement track). This wrapper only:
//   - maps its answer onto HTTP statuses (403 no access · 429 allowance used up ·
//     503 the check itself failed),
//   - records a use after a model call was actually made,
//   - tolerates the module being absent while the tracks are built in parallel:
//     in tests and `netlify dev` it ALLOWS and logs loudly; in a deployed function
//     it REFUSES (503), so a missing module can never turn into free AI grading.

let entitlementPromise;
let testOverride = null;

/** Test seam: inject an entitlement module (or `false` to simulate its absence). Pass null to reset. */
export function __setEntitlementForTests(mod) {
  testOverride = mod;
  entitlementPromise = undefined;
}

function loadEntitlement() {
  if (testOverride !== null) return Promise.resolve(testOverride || null);
  if (!entitlementPromise) {
    entitlementPromise = import('../entitlement.mjs').then(
      (m) => m,
      (e) => {
        console.error('[course-v2] _shared/entitlement.mjs could not be loaded:', e.message);
        return null;
      },
    );
  }
  return entitlementPromise;
}

const isDeployed = () => !!process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.NETLIFY_DEV;

// entitlement.mjs reasons → HTTP: no access → 403; the check itself failed → 503;
// slot allowance or daily cap used up → 429.
const ACCESS_REASON_RE = /purchase_required|no_user|invalid_level|invalid_key|legacy_key|access/i;
const FAILURE_REASON_RE = /lookup_failed|unavailable/i;

/**
 * May this user spend one AI grading on `bankKey` (level 'a2.1', for logs and
 * the response; the entitlement module derives the level from the key itself)?
 * → { allowed: true, remaining } | { allowed: false, status, error, reason, remaining }
 */
export async function checkCourseAi(admin, userId, bankKey, level) {
  const mod = await loadEntitlement();
  if (!mod || typeof mod.checkCourseAiAllowance !== 'function') {
    if (isDeployed()) {
      console.error('[course-v2] entitlement module missing in a deployed function — refusing');
      return { allowed: false, status: 503, error: 'entitlement_unavailable', reason: 'entitlement_module_missing', remaining: 0 };
    }
    console.error('[course-v2] entitlement module missing — ALLOWING (dev/test stub only)', bankKey);
    return { allowed: true, remaining: null, stubbed: true };
  }
  try {
    // checkCourseAiAllowance() decides access (hasCourseAccess) AND the slot/daily allowance.
    const r = await mod.checkCourseAiAllowance(admin, userId, bankKey);
    if (r?.allowed) return { allowed: true, remaining: Number.isFinite(r.remaining) ? r.remaining : null, degraded: r.degraded === true };
    const reason = typeof r?.reason === 'string' && r.reason ? r.reason : 'limit_reached';
    const access = ACCESS_REASON_RE.test(reason);
    const failed = !access && FAILURE_REASON_RE.test(reason);
    return {
      allowed: false,
      status: access ? 403 : failed ? 503 : 429,
      error: access ? 'course_access_required' : failed ? 'entitlement_unavailable' : 'limit_reached',
      reason,
      level: level || null,
      remaining: Number.isFinite(r?.remaining) ? r.remaining : 0,
    };
  } catch (e) {
    console.error('[course-v2] allowance check failed:', e.message);
    return { allowed: false, status: 503, error: 'entitlement_unavailable', reason: 'allowance_check_failed', remaining: 0 };
  }
}

/** The use kind recorded for a bank key: w → writing, s → speaking, mo → micro. */
export function useKindFor(parsedKey) {
  if (parsedKey?.kind === 'w') return 'writing';
  if (parsedKey?.kind === 's') return 'speaking';
  return 'micro';
}

/** Record one AI use. Best effort: a failed write is logged, never shown to the learner. */
export async function recordCourseAi(admin, userId, bankKey, kind) {
  const mod = await loadEntitlement();
  if (!mod || typeof mod.recordCourseAiUse !== 'function') {
    console.error('[course-v2] recordCourseAiUse unavailable — use NOT recorded', bankKey, kind);
    return false;
  }
  try {
    await mod.recordCourseAiUse(admin, userId, bankKey, kind);
    return true;
  } catch (e) {
    console.error('[course-v2] recordCourseAiUse failed:', e.message);
    return false;
  }
}
