// Course v2 — server-side configuration of the v2 entitlement and the course AI
// allowance (docs/course-v2/ENTITLEMENT.md, BLUEPRINT §1.5 and §4.7).
//
// THIS IS A SYNCED COPY where it overlaps the client: V2_TRIAL_PRO_OPENS_PAID
// must equal the export of the same name in src/config/courseV2.js, and
// V2_FREE_LEVELS must equal FREE_LEVELS in src/config/freeTier.js. The
// functions bundle cannot reliably import src/ (same doctrine as
// _shared/pricing.mjs and _shared/brand.mjs), so the literal lives here and
// tests/course-v2-entitlement.test.mjs is what keeps the two sides honest.

/**
 * Owner decision D1 (BLUEPRINT §13) — PENDING. Does an active trial or a Pro
 * subscription ALSO open the paid v2 courses?
 *
 *   false (the blueprint's recommendation, and the default until the owner
 *         decides): a paid v2 level opens only with a purchase whose product
 *         covers it. Trial and Pro keep the existing tools (X-Ray, open
 *         speaking with the wallet, the legacy course while it lives).
 *   true: today's legacy rule — any active trial or subscription (including
 *         the 90-day Pro window every course purchase grants) opens every v2
 *         level, which undercuts every half-level price.
 *
 * Change it here AND in src/config/courseV2.js in the same commit.
 */
export const V2_TRIAL_PRO_OPENS_PAID = false;

/** The v2 levels anyone may open. Mirrors FREE_LEVELS (src/config/freeTier.js). */
export const V2_FREE_LEVELS = Object.freeze(['a1.1']);

/**
 * Lifetime graded attempts per bank-key slot (BLUEPRINT §4.7, design numbers —
 * the owner sets the real ones after the pilot, §13 D8). A "slot" is the bank
 * key without its lane suffix, so switching lanes never doubles an allowance.
 *
 *   aufgabe     unit Sprechen/Schreiben Aufgabe: 1 attempt + 2 graded revisions
 *   micro       micro-output of a Lernschritt (or a Plateau Projekt): 2 attempts
 *   plateau     Plateau productive part: 2 attempts
 *   halbtest    .1 closing productive part: 2 attempts
 *   modelltest  Modelltest productive part: 2 attempts
 *   diagnose    the free Diagnose: 1 attempt per part
 *
 * The free A1.1 has the same per-slot allowance as a bought level.
 */
export const COURSE_AI_SLOT_ATTEMPTS = Object.freeze({
  aufgabe: 3,
  micro: 2,
  plateau: 2,
  halbtest: 2,
  modelltest: 2,
  diagnose: 1,
});

/** Fair-use cap: graded AI evaluations per user per UTC day, across every v2 slot. */
export const COURSE_AI_DAILY_CAP = 25;
