// Course v2 entitlement and the purchase-aware course AI allowance
// (docs/course-v2/ENTITLEMENT.md; BLUEPRINT §1.5 and §4.7; SCHEMA §2).
//
// Three questions, one module, asked by every v2 surface on the server:
//
//   hasCourseAccess(admin, userId, level)         may this user open v2 content of this level?
//   checkCourseAiAllowance(admin, userId, bankKey) may this user have one more graded AI attempt on this slot?
//   recordCourseAiUse(admin, userId, bankKey, kind) count one graded AI attempt (after it succeeded;
//                                                   for speaking the attempt is the SESSION: speaking-session
//                                                   records it once the session row exists, because the partner
//                                                   conversation is itself the AI cost — E1 integration 2026-09-27)
//
// THE RULE (BLUEPRINT §1.5 item 3): a v2 level is open when it is free (A1.1),
// or when an ACTIVE purchases row's product covers it — the per-level keys
// course_a1_2 … course_b2_2 and the retired band keys course_a1 … course_alle.
// An active trial or Pro subscription passes too ONLY when
// V2_TRIAL_PRO_OPENS_PAID is true (owner decision D1, pending; default false).
// The legacy hasLevelAccess rule (free ∨ trial/sub ∨ purchase) is untouched and
// keeps governing the legacy courses.
//
// Every function here takes the service-role client as `admin` (so tests can
// hand in a fake), never throws, and fails CLOSED on a lookup error — a paid
// level is never opened because the database hiccuped. The one exception is a
// missing course_ai_usage table (the owner applies migrations by hand): the
// allowance then degrades to counting writing_submissions, see
// degradedAllowance() below.

import {
  V2_TRIAL_PRO_OPENS_PAID,
  V2_FREE_LEVELS,
  COURSE_AI_SLOT_ATTEMPTS,
  COURSE_AI_DAILY_CAP,
} from './courseV2Config.mjs';

// ── identifiers (SCHEMA §2, verbatim; pinned against scripts/course-v2/lib/ids.mjs) ──

export const BANK_KEY_RE =
  /^(a1[12]|a2[12]|b1[12]|b2[12])-(u(?:0[1-9]|1[0-2])|p[1-3]|ht|dx|m[abc])-(w|s|mo)([1-8])?(?:-(sd1|ga2|ta2|tb1|dtz|gb1|tb2|gb2|oza1|dtb2))?$/;
export const LEGACY_COURSE_TASK_KEY_RE = /^(a\d\d)-l\d\d$/;

const LEVEL_RE = /^(a1|a2|b1|b2)\.[12]$/;
const LANES = ['sd1', 'ga2', 'ta2', 'tb1', 'dtz', 'gb1', 'tb2', 'gb2', 'oza1', 'dtb2'];
const LANE_SUFFIX_RE = new RegExp(`-(?:${LANES.join('|')})$`);

// A v2 learner-state id (SCHEMA §2 "Learner-state ids") or anything below one
// (a Lernschritt, an item, a line): unit a2.1-u07, Plateau a2.1-p2, closing
// a2.1-ht-ga2 / a2.2-dx-ga2, Modelltest a2.2-ma-ga2. The live course's
// a1.1-lNN / a1.1-cpN cannot match.
const V2_LEKTION_ID_RE = /^((?:a1|a2|b1|b2)\.[12])-(?:u(?:0[1-9]|1[0-2])|p[1-3]|ht-|dx-|m[abc]-)/;

/** Graded-attempt kinds the ledger records. */
export const COURSE_AI_KINDS = Object.freeze(['writing', 'speaking', 'micro']);

// ── products → levels (SYNCED COPY of levelsForProduct in src/data/pricing.js) ──
// The functions bundle cannot reliably import src/, so the map lives here and
// tests/course-v2-entitlement.test.mjs compares it key by key against
// levelsForProduct() for every product the webhook can deliver.
export const PRODUCT_LEVELS = Object.freeze({
  course_a1_2: Object.freeze(['a1.2']),
  course_a2_1: Object.freeze(['a2.1']),
  course_a2_2: Object.freeze(['a2.2']),
  course_b1_1: Object.freeze(['b1.1']),
  course_b1_2: Object.freeze(['b1.2']),
  course_b2_1: Object.freeze(['b2.1']),
  course_b2_2: Object.freeze(['b2.2']),
  // Retired band products (sold 2026-09-03 → 2026-09-08): an existing purchase keeps its levels.
  course_a1: Object.freeze(['a1.1', 'a1.2']),
  course_a2: Object.freeze(['a2.1', 'a2.2']),
  course_b1: Object.freeze(['b1.1', 'b1.2']),
  course_b2: Object.freeze(['b2.1', 'b2.2']),
  course_alle: Object.freeze(['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2']),
});

/** Levels a product key unlocks — [] for unknown keys and for telc_b1_komplett. */
export function levelsForProductKey(productKey) {
  return typeof productKey === 'string' && Object.prototype.hasOwnProperty.call(PRODUCT_LEVELS, productKey)
    ? PRODUCT_LEVELS[productKey]
    : [];
}

/** 'A2.1' → 'a2.1'; null for anything that is not one of the eight half-levels. */
export function normalizeLevel(level) {
  const l = typeof level === 'string' ? level.trim().toLowerCase() : '';
  return LEVEL_RE.test(l) ? l : null;
}

/** Is this v2 level free for everyone? */
export function isCourseV2LevelFree(level) {
  const l = normalizeLevel(level);
  return !!l && V2_FREE_LEVELS.includes(l);
}

/** The level of a v2 learner-state id ('a2.1-u07-ls3' → 'a2.1'), or null for legacy/unknown ids. */
export function v2LevelOfLektionId(lektionId) {
  const m = typeof lektionId === 'string' ? lektionId.trim().toLowerCase().match(V2_LEKTION_ID_RE) : null;
  return m ? m[1] : null;
}

const KIND_OF_SLOT = { w: 'writing', s: 'speaking', mo: 'micro' };

function slotClassOf(scope, slotKind) {
  if (scope.startsWith('u')) return slotKind === 'mo' ? 'micro' : 'aufgabe';
  if (scope.startsWith('p')) return slotKind === 'mo' ? 'micro' : 'plateau';
  if (scope === 'ht') return 'halbtest';
  if (scope === 'dx') return 'diagnose';
  return 'modelltest'; // ma | mb | mc
}

/**
 * A v2 bank key, taken apart. null for legacy keys (a11-l03) and anything else.
 *   slotKey   the key without its lane suffix — the allowance is counted per
 *             slot, so a lane switch never doubles it
 *   slotClass aufgabe | micro | plateau | halbtest | modelltest | diagnose
 *   limit     lifetime graded attempts of that slot class
 *   kind      writing | speaking | micro
 */
export function bankKeyInfo(bankKey) {
  const m = typeof bankKey === 'string' ? bankKey.match(BANK_KEY_RE) : null;
  if (!m) return null;
  const [, prefix, scope, slotKind, nr, lane] = m;
  const slotClass = slotClassOf(scope, slotKind);
  return {
    bankKey,
    prefix,
    level: `${prefix.slice(0, 2)}.${prefix.slice(2)}`,
    scope,
    slotKind,
    nr: nr ? Number(nr) : null,
    lane: lane || null,
    slotKey: bankKey.replace(LANE_SUFFIX_RE, ''),
    slotClass,
    limit: COURSE_AI_SLOT_ATTEMPTS[slotClass],
    kind: KIND_OF_SLOT[slotKind],
  };
}

/** Is this a v2 bank key (never true for the legacy aNN-lNN keys)? */
export function isCourseV2BankKey(key) {
  return bankKeyInfo(key) !== null;
}

/**
 * Trial or Pro, read exactly as speakingUsage.getTier() reads it (premium, pro,
 * is_subscribed, or trial_ends_at in the future). Consulted only when
 * V2_TRIAL_PRO_OPENS_PAID is true. Kept here instead of importing getTier so
 * the two shared modules do not import each other.
 */
export function trialOrProFromProfile(profile, now = new Date()) {
  if (!profile) return false;
  if (profile.subscription_tier === 'premium' || profile.subscription_tier === 'pro' || profile.is_subscribed) return true;
  return !!(profile.trial_ends_at && new Date(profile.trial_ends_at) > now);
}

// PostgREST answers a missing table with PGRST205 ("Could not find the table …
// in the schema cache"); Postgres itself with 42P01 (undefined_table).
export function isMissingTableError(error) {
  if (!error) return false;
  if (error.code === 'PGRST205' || error.code === '42P01') return true;
  return /does not exist|schema cache/i.test(String(error.message || ''));
}

function utcDayStart(now) {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

let warnedLedgerMissing = false;
function warnLedgerMissing(where) {
  if (warnedLedgerMissing) return;
  warnedLedgerMissing = true;
  console.warn(
    `[entitlement] ${where}: public.course_ai_usage does not exist — apply migrations/2026-10-01-course-v2.sql. ` +
    'Until then the course AI allowance counts writing_submissions only (docs/course-v2/ENTITLEMENT.md).',
  );
}

// ── 1. access ────────────────────────────────────────────────────────────────

/**
 * Why a user may or may not open a v2 level.
 * → { allowed, reason, level, productKey? }
 *   reason: free | purchase | trial_pro | purchase_required | no_user | invalid_level | lookup_failed
 * options: { now?: Date, trialProOpensPaid?: boolean } (defaults: now, V2_TRIAL_PRO_OPENS_PAID)
 */
export async function courseAccess(admin, userId, level, options = {}) {
  const lvl = normalizeLevel(level);
  if (!lvl) return { allowed: false, reason: 'invalid_level', level: null };
  if (V2_FREE_LEVELS.includes(lvl)) return { allowed: true, reason: 'free', level: lvl };
  if (!userId) return { allowed: false, reason: 'no_user', level: lvl };
  if (!admin) return { allowed: false, reason: 'lookup_failed', level: lvl };

  const now = options.now || new Date();
  const opensPaid = typeof options.trialProOpensPaid === 'boolean' ? options.trialProOpensPaid : V2_TRIAL_PRO_OPENS_PAID;

  try {
    const { data, error } = await admin
      .from('purchases')
      .select('product_key')
      .eq('user_id', userId)
      .eq('status', 'active');
    if (error) {
      console.error('[entitlement] purchases lookup failed:', JSON.stringify(error));
      return { allowed: false, reason: 'lookup_failed', level: lvl };
    }
    const hit = (data || []).find((p) => levelsForProductKey(p?.product_key).includes(lvl));
    if (hit) return { allowed: true, reason: 'purchase', level: lvl, productKey: hit.product_key };

    if (opensPaid === true) {
      const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('subscription_tier, is_subscribed, trial_ends_at')
        .eq('id', userId)
        .maybeSingle();
      if (profileError) {
        console.error('[entitlement] profile lookup failed:', JSON.stringify(profileError));
      } else if (trialOrProFromProfile(profile, now)) {
        return { allowed: true, reason: 'trial_pro', level: lvl };
      }
    }
    return { allowed: false, reason: 'purchase_required', level: lvl };
  } catch (err) {
    console.error('[entitlement] access check threw:', err?.message);
    return { allowed: false, reason: 'lookup_failed', level: lvl };
  }
}

/** The v2 content gate: true when courseAccess() allows. */
export async function hasCourseAccess(admin, userId, level, options = {}) {
  return (await courseAccess(admin, userId, level, options)).allowed;
}

// ── 2. the allowance ─────────────────────────────────────────────────────────

async function countRows(admin, table, filters) {
  let q = admin.from(table).select('id', { count: 'exact', head: true });
  for (const [op, column, value] of filters) q = q[op](column, value);
  const { count, error } = await q;
  return { count: count || 0, error: error || null };
}

function decide(info, used, dailyUsed, dailyCap, extra) {
  const remaining = Math.max(0, info.limit - used);
  const base = { remaining, limit: info.limit, used, dailyUsed, dailyCap, level: info.level, slotKey: info.slotKey, ...extra };
  if (used >= info.limit) return { allowed: false, reason: 'slot_allowance_exhausted', ...base, remaining: 0 };
  if (dailyUsed >= dailyCap) return { allowed: false, reason: 'daily_cap_reached', ...base };
  return { allowed: true, reason: extra.degraded ? 'ledger_missing' : 'ok', ...base };
}

// Graceful degradation while migrations/2026-10-01-course-v2.sql is not
// applied. writing_submissions exists and the writing grader writes one row
// per graded text with task_key = the bank key, so written slots stay capped
// by their own ledger; spoken slots are gated by access only until the owner
// applies the migration. The result says so (degraded: true).
async function degradedAllowance(admin, userId, info, access, dayStart, dailyCap) {
  warnLedgerMissing('checkCourseAiAllowance');
  // Per SLOT, like the ledger (a lane variant is the same slot), and only rows a model graded:
  // the writing grader stores rule-decided zeros with model = 'deterministic', and those cost
  // no model call, so they must not use up an attempt (E1 integration, 2026-09-27).
  const slotKeys = [info.slotKey, ...LANES.map((l) => `${info.slotKey}-${l}`)];
  const slot = await countRows(admin, 'writing_submissions', [
    ['eq', 'user_id', userId],
    ['in', 'task_key', slotKeys],
    ['neq', 'model', 'deterministic'],
  ]);
  const day = await countRows(admin, 'writing_submissions', [
    ['eq', 'user_id', userId],
    ['like', 'task_key', `${info.prefix}-%`],
    ['neq', 'model', 'deterministic'],
    ['gte', 'created_at', dayStart.toISOString()],
  ]);
  if (slot.error || day.error) {
    console.error('[entitlement] degraded usage lookup failed:', JSON.stringify(slot.error || day.error));
  }
  return decide(info, slot.count, day.count, dailyCap, { degraded: true, access: access.reason });
}

/**
 * May this user have one more graded AI attempt on this bank-key slot?
 * → { allowed, reason, remaining, limit, used, dailyUsed, dailyCap, level, slotKey, access?, degraded? }
 *   remaining: graded attempts still open on the slot NOW (the attempt about to be made included)
 *   reason: ok | ledger_missing (allowed, degraded) | slot_allowance_exhausted | daily_cap_reached |
 *           purchase_required | no_user | invalid_key | legacy_key | lookup_failed | usage_lookup_failed
 * Check before the AI call; recordCourseAiUse() after it succeeded (writing: after a real model call,
 * never for a rule-decided zero; speaking: once per session, at session start).
 * options: { now?, trialProOpensPaid?, dailyCap? }
 */
export async function checkCourseAiAllowance(admin, userId, bankKey, options = {}) {
  const info = bankKeyInfo(bankKey);
  if (!info) {
    const legacy = typeof bankKey === 'string' && LEGACY_COURSE_TASK_KEY_RE.test(bankKey);
    return { allowed: false, reason: legacy ? 'legacy_key' : 'invalid_key', remaining: 0 };
  }
  const denied = (reason, extra = {}) => ({ allowed: false, reason, remaining: 0, limit: info.limit, level: info.level, slotKey: info.slotKey, ...extra });
  if (!userId) return denied('no_user');

  const access = await courseAccess(admin, userId, info.level, options);
  if (!access.allowed) return denied(access.reason);

  const now = options.now || new Date();
  const dailyCap = Number.isFinite(options.dailyCap) ? options.dailyCap : COURSE_AI_DAILY_CAP;
  const dayStart = utcDayStart(now);

  try {
    const slot = await countRows(admin, 'course_ai_usage', [['eq', 'user_id', userId], ['eq', 'slot_key', info.slotKey]]);
    if (slot.error && isMissingTableError(slot.error)) return degradedAllowance(admin, userId, info, access, dayStart, dailyCap);
    const day = slot.error
      ? slot
      : await countRows(admin, 'course_ai_usage', [['eq', 'user_id', userId], ['gte', 'created_at', dayStart.toISOString()]]);
    if (slot.error || day.error) {
      console.error('[entitlement] course_ai_usage lookup failed:', JSON.stringify(slot.error || day.error));
      return denied('usage_lookup_failed');
    }
    return decide(info, slot.count, day.count, dailyCap, { access: access.reason });
  } catch (err) {
    console.error('[entitlement] allowance check threw:', err?.message);
    return denied('usage_lookup_failed');
  }
}

/**
 * Count one graded AI attempt. Call it once per graded attempt, AFTER the grading
 * succeeded (a provider failure must not cost the learner an attempt).
 * Never throws: the grading already happened, so a failed write is logged, not
 * turned into an error response.
 * → { recorded, reason?, degraded? }
 */
export async function recordCourseAiUse(admin, userId, bankKey, kind) {
  const info = bankKeyInfo(bankKey);
  if (!info) return { recorded: false, reason: 'invalid_key' };
  if (!userId) return { recorded: false, reason: 'no_user' };
  if (!admin) return { recorded: false, reason: 'no_client' };
  // The kind follows from the key; a caller's differing kind is logged, not trusted.
  if (kind != null && kind !== info.kind) {
    console.warn(`[entitlement] recordCourseAiUse: kind '${kind}' does not match ${bankKey} — recorded as '${info.kind}'`);
  }
  try {
    const { error } = await admin.from('course_ai_usage').insert({
      user_id: userId,
      level: info.level,
      bank_key: info.bankKey,
      slot_key: info.slotKey,
      kind: info.kind,
    });
    if (error) {
      if (isMissingTableError(error)) {
        warnLedgerMissing('recordCourseAiUse');
        return { recorded: false, reason: 'ledger_missing', degraded: true };
      }
      console.error('[entitlement] course_ai_usage insert failed:', JSON.stringify(error));
      return { recorded: false, reason: 'insert_failed' };
    }
    return { recorded: true };
  } catch (err) {
    console.error('[entitlement] course_ai_usage insert threw:', err?.message);
    return { recorded: false, reason: 'insert_failed' };
  }
}
