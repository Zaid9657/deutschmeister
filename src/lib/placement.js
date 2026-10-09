// The level-test result a SIGNED-OUT visitor earns, carried through signup
// (docs/SCORECARD.md §3 #5c, 2026-09-28).
//
// WHY. "Find your level — free" is the homepage's primary button (twice), and
// 14 of the 15 attributed signups since 2026-09-20 landed on the homepage. The
// test ends on a card that says "Sign up free — save my results". It saved
// nothing: the result lived in React state only, the link went to
// /signup?level=B1.2 and SignupPage never read `level`, so a visitor who took a
// 15–20 minute test and signed up to keep it arrived with the column default
// ('a1') and was offered the placement test again. And the door carried no
// tag, so how many signups the homepage's main path produces was invisible.
//
// What this module does:
//   * the results screen REMEMBERS the result it shows (localStorage), for a
//     signed-out visitor only — a signed-in tester is written directly
//     (src/pages/LevelTest.jsx);
//   * the door is an attributed link (?ref=level-test&utm_medium=onsite), the
//     shape src/lib/xray.js and astro-site/src/lib/onsiteLinks.js already use;
//   * the first profile load after sign-in on this browser SETTLES it
//     (src/contexts/SubscriptionContext.jsx): the result is written to
//     profiles.current_level when the account holds no placement yet, and the
//     store is cleared.
//
// Rules it keeps (same as src/lib/course/localProgress.js):
//   1. NEVER THROWS — every access goes through safeStorage.
//   2. NEVER OVERWRITES SERVER TRUTH. An account that already has a placement
//      keeps it; the local result is dropped.
//   3. CLAIMS ONCE. The store is cleared after a successful write, and on any
//      record that can no longer be claimed (malformed, expired, superseded).
// Deliberately NOT importing firstRun.js for its placedSublevel: that module
// pulls the grammar topic list, and this one is loaded by the always-mounted
// SubscriptionContext. normalizeSublevel below is the same definition ("on the
// ladder" = placed), and tests/placement.test.mjs holds the two equal.
import { LEVEL_ORDER } from '../config/levels.js';
import { safeGetJSON, safeSetJSON, safeRemove } from '../utils/safeStorage.js';

export const PLACEMENT_KEY = 'dm_placement';

/** A result older than this is not claimed: the learner has moved on, or it is someone else's browser session. */
export const PLACEMENT_MAX_AGE_DAYS = 30;

/** The on-site surface label public/attribution.js records for this door (docs/tracking-links.md). */
export const PLACEMENT_REF = 'level-test';

const DAY_MS = 86_400_000;

/** 'b1.2' | 'B1.2' → 'B1.2' (the DB spelling); anything off the ladder → null. */
export function normalizeSublevel(value) {
  const upper = String(value ?? '').trim().toUpperCase();
  return LEVEL_ORDER.includes(upper) ? upper : null;
}

/** The record the results screen stores; null for a value that is not a sub-level. */
export function placementRecord(sublevel, now = Date.now()) {
  const level = normalizeSublevel(sublevel);
  return level ? { level, at: new Date(now).toISOString() } : null;
}

/** A stored record → its sub-level while it is still claimable, else null. */
export function claimableLevel(stored, now = Date.now()) {
  if (!stored || typeof stored !== 'object') return null;
  const level = normalizeSublevel(stored.level);
  const at = Date.parse(stored.at);
  if (!level || !Number.isFinite(at)) return null;
  const age = now - at;
  if (age < -DAY_MS || age > PLACEMENT_MAX_AGE_DAYS * DAY_MS) return null;
  return level;
}

/**
 * What to do with a stored result once an account is loaded.
 * @param {object} args
 * @param {unknown} args.stored        the raw dm_placement value (null when absent)
 * @param {string|null|undefined} args.currentLevel  profiles.current_level ('a1' is the column default, not a placement)
 * @param {number} [args.now]
 * @returns {{ claim: string|null, forget: boolean }}
 *   claim  — the sub-level to write to profiles.current_level (then forget)
 *   forget — clear the store without writing (nothing stored → false)
 */
export function settlePlacement({ stored, currentLevel, now = Date.now() } = {}) {
  if (stored == null) return { claim: null, forget: false };
  const level = claimableLevel(stored, now);
  if (!level || normalizeSublevel(currentLevel)) return { claim: null, forget: true };
  return { claim: level, forget: false };
}

/**
 * The results-screen signup door. A plain href, NOT a router <Link>:
 * public/attribution.js records a ref only on a page load. /signup is a
 * rewrite-served SPA route, so no trailing slash (CLAUDE.md case 3).
 */
export function placementSignupHref(sublevel) {
  const params = new URLSearchParams({ ref: PLACEMENT_REF, utm_medium: 'onsite' });
  const level = normalizeSublevel(sublevel);
  if (level) params.set('utm_content', level.toLowerCase());
  return `/signup?${params}`;
}

// --- storage (browser only; every call is safe without storage) -----------

export const rememberPlacement = (sublevel, now = Date.now()) => {
  const record = placementRecord(sublevel, now);
  return record ? safeSetJSON(PLACEMENT_KEY, record) : false;
};

export const readStoredPlacement = () => safeGetJSON(PLACEMENT_KEY, null);

/** The sub-level waiting to be saved on this browser, or null. */
export const pendingPlacement = (now = Date.now()) => claimableLevel(readStoredPlacement(), now);

export const forgetPlacement = () => safeRemove(PLACEMENT_KEY);
