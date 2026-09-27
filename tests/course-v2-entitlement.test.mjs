// Course v2 entitlement + the purchase-aware course AI allowance
// (docs/course-v2/ENTITLEMENT.md; BLUEPRINT §1.5, §4.7; SCHEMA §2, §14).
//
// What each block defends:
//   1. SYNCED COPIES — the functions bundle cannot import src/, so the product → levels
//      map, the free levels, the D1 flag and BANK_KEY_RE live twice. Each pair is
//      compared here, or a purchase opens a level on one side and not the other.
//   2. KEY-01 — every one of the eight course prefixes × every slot kind parses to the
//      right level, slot and allowance; legacy aNN-lNN keys never enter the v2 path.
//   3. THE RULE — free A1.1 ∨ an active purchase covering the level (per-level and legacy
//      band keys); trial/Pro only when V2_TRIAL_PRO_OPENS_PAID; lookup errors fail closed.
//   4. THE ALLOWANCE — lifetime per slot (lane-stripped), a daily cap, and a graceful
//      degradation while the migration is not applied.
//   5. THE CALLERS — score-readaloud, speakingUsage, SubscriptionContext and the route
//      guard ask the v2 question on v2 surfaces and leave the legacy rule alone.
//   6. THE MIGRATION — idempotent, RLS on, the ledger service-role-write only, the
//      columns the code writes exist.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  BANK_KEY_RE,
  LEGACY_COURSE_TASK_KEY_RE,
  PRODUCT_LEVELS,
  COURSE_AI_KINDS,
  levelsForProductKey,
  normalizeLevel,
  isCourseV2LevelFree,
  v2LevelOfLektionId,
  bankKeyInfo,
  isCourseV2BankKey,
  trialOrProFromProfile,
  isMissingTableError,
  courseAccess,
  hasCourseAccess,
  checkCourseAiAllowance,
  recordCourseAiUse,
} from '../netlify/functions/_shared/entitlement.mjs';
import {
  V2_TRIAL_PRO_OPENS_PAID,
  V2_FREE_LEVELS,
  COURSE_AI_SLOT_ATTEMPTS,
  COURSE_AI_DAILY_CAP,
} from '../netlify/functions/_shared/courseV2Config.mjs';
import { LEVEL_COURSES, LEGACY_LEVEL_COURSES, COURSES, ALL_LEVELS, levelsForProduct } from '../src/data/pricing.js';
import { FREE_LEVELS } from '../src/config/freeTier.js';
import { PRODUCT_KEYS } from '../netlify/functions/_shared/adminOpsLib.mjs';
import * as ids from '../scripts/course-v2/lib/ids.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const USER = '00000000-0000-4000-8000-000000000001';
const NOW = new Date('2026-10-05T12:00:00Z');
const PREFIXES = ['a11', 'a12', 'a21', 'a22', 'b11', 'b12', 'b21', 'b22'];
const LANES = ['sd1', 'ga2', 'ta2', 'tb1', 'dtz', 'gb1', 'tb2', 'gb2', 'oza1', 'dtb2'];

// ── a fake service-role client: the supabase-js calls entitlement.mjs makes ──────────
function fakeAdmin(tables = {}, { missing = [], errors = {}, throws = false } = {}) {
  const db = Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, [...v]]));
  const inserts = [];
  const failure = (table) => {
    if (missing.includes(table)) {
      return { code: 'PGRST205', message: `Could not find the table 'public.${table}' in the schema cache` };
    }
    return errors[table] || null;
  };
  const from = (table) => {
    if (throws) throw new Error('network down');
    const filters = [];
    let head = false;
    const run = (single) => {
      const error = failure(table);
      if (error) return { data: null, count: null, error };
      const rows = (db[table] || []).filter((r) => filters.every((f) => f(r)));
      if (single) return { data: rows[0] || null, error: null };
      return { data: head ? null : rows, count: rows.length, error: null };
    };
    const q = {
      select(_cols, opts) { head = !!(opts && opts.head); return q; },
      eq(c, v) { filters.push((r) => r[c] === v); return q; },
      gte(c, v) { filters.push((r) => new Date(r[c]) >= new Date(v)); return q; },
      like(c, pattern) {
        const re = new RegExp(`^${pattern.split('%').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);
        filters.push((r) => re.test(String(r[c])));
        return q;
      },
      maybeSingle() { return Promise.resolve(run(true)); },
      insert(row) {
        const error = failure(table);
        if (!error) {
          inserts.push({ table, row });
          (db[table] = db[table] || []).push({ ...row, created_at: NOW.toISOString() });
        }
        return Promise.resolve({ error });
      },
      then(resolve, reject) { return Promise.resolve(run(false)).then(resolve, reject); },
    };
    return q;
  };
  return { from, inserts, db };
}

const purchase = (product_key, status = 'active') => ({ user_id: USER, product_key, status });
const usage = (bank_key, created_at = NOW.toISOString()) => {
  const info = bankKeyInfo(bank_key);
  return { user_id: USER, level: info.level, bank_key, slot_key: info.slotKey, kind: info.kind, created_at };
};

// ---------------------------------------------------------------------------
// 1. Synced copies
// ---------------------------------------------------------------------------

test('the server product → levels map equals levelsForProduct() for every deliverable product', () => {
  const keys = new Set([
    ...Object.keys(LEVEL_COURSES),
    ...Object.keys(LEGACY_LEVEL_COURSES),
    ...Object.keys(COURSES),
    ...PRODUCT_KEYS,
    'unknown_product',
  ]);
  for (const key of keys) {
    assert.deepEqual([...levelsForProductKey(key)], levelsForProduct(key), `${key}: server and client unlock different levels`);
  }
  // No product in the server map that the data layer does not know.
  for (const key of Object.keys(PRODUCT_LEVELS)) {
    assert.ok(levelsForProduct(key).length > 0, `${key} unlocks levels on the server but not in src/data/pricing.js`);
  }
  assert.deepEqual([...levelsForProductKey('telc_b1_komplett')], [], 'the telc course is not a level course');
  assert.deepEqual([...levelsForProductKey('constructor')], [], 'prototype keys must not resolve');
});

test('the free v2 levels mirror FREE_LEVELS', () => {
  assert.deepEqual([...V2_FREE_LEVELS], FREE_LEVELS);
});

test('owner decision D1 defaults to "no": trial/Pro do not open paid v2 levels', () => {
  assert.equal(V2_TRIAL_PRO_OPENS_PAID, false, 'flip only on the owner\'s decision D1 (BLUEPRINT §13), in both config files');
  const client = join(ROOT, 'src/config/courseV2.js');
  if (!existsSync(client)) {
    console.warn('SKIP: src/config/courseV2.js does not exist yet — the client twin of V2_TRIAL_PRO_OPENS_PAID is unverified.');
    return;
  }
  const src = read('src/config/courseV2.js');
  const m = src.match(/export const V2_TRIAL_PRO_OPENS_PAID\s*=\s*(true|false)\b/);
  assert.ok(m, 'src/config/courseV2.js must export V2_TRIAL_PRO_OPENS_PAID as a plain boolean literal');
  assert.equal(m[1] === 'true', V2_TRIAL_PRO_OPENS_PAID, 'client and server disagree on whether trial/Pro open paid v2 levels');
});

test('BANK_KEY_RE is SCHEMA §2 verbatim, identical to the compiler\'s copy', () => {
  assert.equal(BANK_KEY_RE.source, ids.BANK_KEY_RE.source);
  assert.equal(BANK_KEY_RE.flags, ids.BANK_KEY_RE.flags);
  assert.equal(LEGACY_COURSE_TASK_KEY_RE.source, ids.LEGACY_COURSE_TASK_KEY_RE.source);
});

// ---------------------------------------------------------------------------
// 2. KEY-01: every prefix × every slot kind
// ---------------------------------------------------------------------------

test('every course prefix × slot kind parses to its level, slot and allowance', () => {
  const scopes = [
    ...Array.from({ length: 12 }, (_, i) => [`u${String(i + 1).padStart(2, '0')}`, null]),
    ['p1', 'plateau'], ['p2', 'plateau'], ['p3', 'plateau'],
    ['ht', 'halbtest'], ['dx', 'diagnose'], ['ma', 'modelltest'], ['mb', 'modelltest'], ['mc', 'modelltest'],
  ];
  for (const prefix of PREFIXES) {
    const level = `${prefix.slice(0, 2)}.${prefix.slice(2)}`;
    assert.ok(ALL_LEVELS.includes(level));
    for (const [scope, cls] of scopes) {
      for (const slot of ['w', 's', 'mo', 'w1', 's2', 'mo3']) {
        for (const lane of [null, ...LANES]) {
          const key = `${prefix}-${scope}-${slot}${lane ? `-${lane}` : ''}`;
          const info = bankKeyInfo(key);
          assert.ok(info, `${key} must parse`);
          assert.equal(info.level, level, key);
          assert.equal(info.lane, lane, key);
          assert.equal(info.slotKey, `${prefix}-${scope}-${slot}`, `${key}: the lane suffix must not change the slot`);
          const isMicro = slot.startsWith('mo');
          const expected = cls || (isMicro ? 'micro' : 'aufgabe');
          const expectedClass = scope.startsWith('p') && isMicro ? 'micro' : expected;
          assert.equal(info.slotClass, expectedClass, key);
          assert.equal(info.limit, COURSE_AI_SLOT_ATTEMPTS[expectedClass], key);
          assert.equal(info.kind, isMicro ? 'micro' : slot.startsWith('w') ? 'writing' : 'speaking', key);
          assert.ok(isCourseV2BankKey(key));
        }
      }
    }
  }
});

test('legacy and malformed keys never enter the v2 path', () => {
  for (const key of ['a11-l03', 'a12-l12', 'c11-u01-w', 'a21-u13-w', 'a21-u00-s', 'a21-u07-w9', 'a21-u07-x', 'a21-u07-w-xx', 'A21-u07-w', '', null, 42]) {
    assert.equal(bankKeyInfo(key), null, `${key} must not parse as a v2 bank key`);
    assert.equal(isCourseV2BankKey(key), false);
  }
});

test('the design allowance numbers are the BLUEPRINT §4.7 ones', () => {
  assert.deepEqual({ ...COURSE_AI_SLOT_ATTEMPTS }, { aufgabe: 3, micro: 2, plateau: 2, halbtest: 2, modelltest: 2, diagnose: 1 });
  assert.equal(COURSE_AI_DAILY_CAP, 25);
});

test('levels and v2 learner-state ids normalise at the boundary', () => {
  assert.equal(normalizeLevel('A2.1'), 'a2.1');
  assert.equal(normalizeLevel(' b2.2 '), 'b2.2');
  for (const bad of ['a3.1', 'a1', 'placement', '', null]) assert.equal(normalizeLevel(bad), null);
  assert.equal(isCourseV2LevelFree('A1.1'), true);
  assert.equal(isCourseV2LevelFree('a1.2'), false);
  const cases = {
    'a2.1-u07': 'a2.1', 'a2.1-u07-ls3-p06': 'a2.1', 'A2.1-U07': 'a2.1', 'b1.2-p2': 'b1.2', 'b1.1-ht-tb1': 'b1.1',
    'a2.2-dx-ga2': 'a2.2', 'a2.2-ma-ga2': 'a2.2', 'b2.2-mc-tb2-lesen': 'b2.2',
    'a1.1-l03': null, 'a1.1-cp1': null, 'a1.1-u13': null, 'a1.1-u00': null, '': null, undefined: null,
  };
  for (const [id, level] of Object.entries(cases)) {
    assert.equal(v2LevelOfLektionId(id === 'undefined' ? undefined : id), level, id);
  }
});

// ---------------------------------------------------------------------------
// 3. The rule
// ---------------------------------------------------------------------------

test('A1.1 is open to everyone, signed in or not, without a database call', async () => {
  const r = await courseAccess(null, null, 'a1.1');
  assert.deepEqual(r, { allowed: true, reason: 'free', level: 'a1.1' });
  assert.equal(await hasCourseAccess(null, null, 'A1.1'), true);
});

test('a paid level opens with the per-level purchase and the legacy band keys', async () => {
  const cases = [
    ['course_a1_2', 'a1.2', true], ['course_b2_2', 'b2.2', true], ['course_a1', 'a1.2', true],
    ['course_b1', 'b1.1', true], ['course_alle', 'b2.1', true],
    ['course_a1_2', 'a2.1', false], ['course_a2', 'b1.1', false], ['telc_b1_komplett', 'b1.1', false],
  ];
  for (const [product, level, allowed] of cases) {
    const admin = fakeAdmin({ purchases: [purchase(product)] });
    const r = await courseAccess(admin, USER, level);
    assert.equal(r.allowed, allowed, `${product} → ${level}`);
    assert.equal(r.reason, allowed ? 'purchase' : 'purchase_required', `${product} → ${level}`);
    if (allowed) assert.equal(r.productKey, product);
  }
});

test('a refunded purchase opens nothing, and another user\'s purchase is not yours', async () => {
  const admin = fakeAdmin({
    purchases: [purchase('course_a2_1', 'refunded'), { user_id: 'someone-else', product_key: 'course_a2_1', status: 'active' }],
  });
  assert.equal((await courseAccess(admin, USER, 'a2.1')).reason, 'purchase_required');
});

test('trial and Pro open paid v2 levels only when the D1 flag says so', async () => {
  const trial = { id: USER, subscription_tier: null, is_subscribed: false, trial_ends_at: '2026-10-09T00:00:00Z' };
  const pro = { id: USER, subscription_tier: 'pro', is_subscribed: true, trial_ends_at: null };
  const expired = { id: USER, subscription_tier: null, is_subscribed: false, trial_ends_at: '2026-09-01T00:00:00Z' };
  for (const [profile, opens] of [[trial, true], [pro, true], [expired, false]]) {
    const admin = fakeAdmin({ purchases: [], profiles: [profile] });
    const off = await courseAccess(admin, USER, 'b1.2', { now: NOW });
    assert.equal(off.allowed, false, 'default: trial/Pro never open a paid v2 level');
    assert.equal(off.reason, 'purchase_required');
    const on = await courseAccess(admin, USER, 'b1.2', { now: NOW, trialProOpensPaid: true });
    assert.equal(on.allowed, opens);
    assert.equal(on.reason, opens ? 'trial_pro' : 'purchase_required');
  }
  assert.equal(trialOrProFromProfile(null), false);
  assert.equal(trialOrProFromProfile({ subscription_tier: 'premium' }), true);
});

test('lookup errors, missing users and bad levels fail closed', async () => {
  const broken = fakeAdmin({}, { errors: { purchases: { code: '500', message: 'boom' } } });
  assert.deepEqual(await courseAccess(broken, USER, 'a2.2'), { allowed: false, reason: 'lookup_failed', level: 'a2.2' });
  assert.equal((await courseAccess(fakeAdmin({}, { throws: true }), USER, 'a2.2')).reason, 'lookup_failed');
  assert.equal((await courseAccess(null, USER, 'a2.2')).reason, 'lookup_failed');
  assert.equal((await courseAccess(fakeAdmin(), null, 'a2.2')).reason, 'no_user');
  assert.equal((await courseAccess(fakeAdmin(), USER, 'placement')).reason, 'invalid_level');
  assert.equal(await hasCourseAccess(broken, USER, 'a2.2'), false);
});

// ---------------------------------------------------------------------------
// 4. The allowance
// ---------------------------------------------------------------------------

test('an entitled learner gets the slot allowance, counted per slot across lanes', async () => {
  const admin = fakeAdmin({ purchases: [purchase('course_a2_1')], course_ai_usage: [usage('a21-u07-w-ta2')] });
  const r = await checkCourseAiAllowance(admin, USER, 'a21-u07-w', { now: NOW });
  assert.equal(r.allowed, true);
  assert.equal(r.reason, 'ok');
  assert.equal(r.limit, 3);
  assert.equal(r.used, 1, 'the telc A2 variant of the same slot counts against it');
  assert.equal(r.remaining, 2);
  assert.equal(r.slotKey, 'a21-u07-w');
  assert.equal(r.access, 'purchase');
});

test('the slot allowance runs out; other slots stay open', async () => {
  const admin = fakeAdmin({
    purchases: [purchase('course_a2_1')],
    course_ai_usage: [usage('a21-u07-mo1'), usage('a21-u07-mo1')],
  });
  const spent = await checkCourseAiAllowance(admin, USER, 'a21-u07-mo1', { now: NOW });
  assert.equal(spent.allowed, false);
  assert.equal(spent.reason, 'slot_allowance_exhausted');
  assert.equal(spent.remaining, 0);
  assert.equal((await checkCourseAiAllowance(admin, USER, 'a21-u07-mo2', { now: NOW })).allowed, true);
});

test('the daily fair-use cap counts every v2 slot since 00:00 UTC', async () => {
  const today = Array.from({ length: COURSE_AI_DAILY_CAP }, (_, i) => usage(`a11-u${String((i % 12) + 1).padStart(2, '0')}-mo${(i % 3) + 1}`, NOW.toISOString()));
  const admin = fakeAdmin({ course_ai_usage: today });
  const capped = await checkCourseAiAllowance(admin, USER, 'a11-u01-w', { now: NOW });
  assert.equal(capped.allowed, false);
  assert.equal(capped.reason, 'daily_cap_reached');
  assert.equal(capped.remaining, 3, 'the slot itself is untouched — tomorrow it opens again');
  const yesterday = today.map((r) => ({ ...r, created_at: '2026-10-04T23:59:00Z' }));
  const fresh = await checkCourseAiAllowance(fakeAdmin({ course_ai_usage: yesterday }), USER, 'a11-u01-w', { now: NOW });
  assert.equal(fresh.allowed, true);
  assert.equal(fresh.dailyUsed, 0);
});

test('no access, no allowance — and keys outside v2 are named, not guessed', async () => {
  const noBuy = await checkCourseAiAllowance(fakeAdmin({ purchases: [] }), USER, 'b12-u03-s', { now: NOW });
  assert.equal(noBuy.allowed, false);
  assert.equal(noBuy.reason, 'purchase_required');
  assert.equal((await checkCourseAiAllowance(fakeAdmin(), USER, 'a11-l03')).reason, 'legacy_key');
  assert.equal((await checkCourseAiAllowance(fakeAdmin(), USER, 'nonsense')).reason, 'invalid_key');
  assert.equal((await checkCourseAiAllowance(fakeAdmin(), null, 'a11-u01-w')).reason, 'no_user');
});

test('without the migration the allowance degrades to writing_submissions, never to a crash', async () => {
  const admin = fakeAdmin(
    {
      purchases: [purchase('course_a1_2')],
      writing_submissions: [
        { user_id: USER, task_key: 'a12-u04-w', created_at: NOW.toISOString() },
        { user_id: USER, task_key: 'a12-u04-w', created_at: NOW.toISOString() },
        { user_id: USER, task_key: 'a12-u04-w', created_at: NOW.toISOString() },
      ],
    },
    { missing: ['course_ai_usage'] },
  );
  const written = await checkCourseAiAllowance(admin, USER, 'a12-u04-w', { now: NOW });
  assert.equal(written.allowed, false, 'written slots stay capped by their own ledger');
  assert.equal(written.reason, 'slot_allowance_exhausted');
  assert.equal(written.degraded, true);
  const spoken = await checkCourseAiAllowance(admin, USER, 'a12-u04-s', { now: NOW });
  assert.equal(spoken.allowed, true);
  assert.equal(spoken.reason, 'ledger_missing');
  assert.equal(spoken.degraded, true);
  const rec = await recordCourseAiUse(admin, USER, 'a12-u04-s', 'speaking');
  assert.deepEqual(rec, { recorded: false, reason: 'ledger_missing', degraded: true });
  assert.ok(isMissingTableError({ code: '42P01' }));
  assert.ok(!isMissingTableError({ code: '23505', message: 'duplicate key' }));
});

test('any other ledger error fails closed', async () => {
  const admin = fakeAdmin({ purchases: [purchase('course_a2_2')] }, { errors: { course_ai_usage: { code: '57014', message: 'timeout' } } });
  const r = await checkCourseAiAllowance(admin, USER, 'a22-u01-w', { now: NOW });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'usage_lookup_failed');
  const free = await checkCourseAiAllowance(null, USER, 'a11-u01-w', { now: NOW });
  assert.equal(free.allowed, false, 'even on the free level: no ledger, no AI call');
  assert.equal(free.reason, 'usage_lookup_failed');
});

test('recordCourseAiUse writes the columns the migration declares, kind derived from the key', async () => {
  const admin = fakeAdmin({ course_ai_usage: [] });
  assert.deepEqual(await recordCourseAiUse(admin, USER, 'b21-p2-w-tb2', 'writing'), { recorded: true });
  assert.deepEqual(await recordCourseAiUse(admin, USER, 'b21-u03-mo2', 'speaking'), { recorded: true });
  assert.deepEqual(admin.inserts.map((i) => i.row), [
    { user_id: USER, level: 'b2.1', bank_key: 'b21-p2-w-tb2', slot_key: 'b21-p2-w', kind: 'writing' },
    { user_id: USER, level: 'b2.1', bank_key: 'b21-u03-mo2', slot_key: 'b21-u03-mo2', kind: 'micro' },
  ]);
  assert.equal((await recordCourseAiUse(admin, USER, 'a11-l01', 'writing')).reason, 'invalid_key');
  assert.equal((await recordCourseAiUse(admin, null, 'a11-u01-w', 'writing')).reason, 'no_user');
  assert.equal((await recordCourseAiUse(fakeAdmin({}, { throws: true }), USER, 'a11-u01-w')).reason, 'insert_failed');
  // Recording then checking closes the loop.
  const loop = fakeAdmin({ course_ai_usage: [] });
  for (let i = 0; i < 3; i += 1) {
    assert.equal((await checkCourseAiAllowance(loop, USER, 'a11-u05-s', { now: NOW })).allowed, true);
    await recordCourseAiUse(loop, USER, 'a11-u05-s', 'speaking');
  }
  assert.equal((await checkCourseAiAllowance(loop, USER, 'a11-u05-s', { now: NOW })).reason, 'slot_allowance_exhausted');
});

// ---------------------------------------------------------------------------
// 5. The callers
// ---------------------------------------------------------------------------

test('speakingUsage routes a course task key to the allowance and leaves the tiers alone', async () => {
  const src = read('netlify/functions/_shared/speakingUsage.mjs');
  assert.match(src, /const PRO_MONTHLY_LIMIT\s*=\s*30;/);
  assert.match(src, /const TRIAL_TOTAL_LIMIT\s*=\s*2;/);
  assert.match(src, /if \(opts\?\.courseTaskKey != null\) return checkCourseUsage/);
  assert.match(src, /if \(opts\?\.courseTaskKey != null\) return incrementCourseUsage/);
  // Without SUPABASE_SERVICE_ROLE_KEY the shared client is null: the course path must
  // answer (fail closed), not throw.
  const { checkUsage, incrementUsage } = await import('../netlify/functions/_shared/speakingUsage.mjs');
  const r = await checkUsage(USER, { courseTaskKey: 'b22-u01-s' });
  assert.equal(r.tier, 'course');
  assert.equal(r.allowed, false);
  assert.equal(r.courseTaskKey, 'b22-u01-s');
  assert.equal((await incrementUsage(USER, { courseTaskKey: 'not-a-key' })).recorded, false);
});

test('score-readaloud scores v2 lines only for learners who may open the level', () => {
  const src = read('netlify/functions/score-readaloud.mjs');
  assert.match(src, /import \{ courseAccess, v2LevelOfLektionId \} from '\.\/_shared\/entitlement\.mjs'/);
  assert.match(src, /const v2Level = v2LevelOfLektionId\(lektionId\);/);
  assert.match(src, /await courseAccess\(supabase, user_id, v2Level\)/);
  assert.match(src, /statusCode: lookupFailed \? 500 : 403/);
  assert.ok(src.indexOf('courseAccess(supabase') < src.indexOf('transcribeAudio({'), 'the entitlement check must run before the STT call');
  assert.ok(src.indexOf('courseAccess(supabase') > src.indexOf('getAuthenticatedUserId(event)'), 'identity first, from the JWT');
});

test('the client gate: hasCourseAccess added, hasLevelAccess untouched', () => {
  const src = read('src/contexts/SubscriptionContext.jsx');
  const body = src.match(/const hasCourseAccess = \(level\) => \{([\s\S]*?)\n {2}\};/);
  assert.ok(body, 'hasCourseAccess(level) missing from SubscriptionContext');
  assert.match(body[1], /if \(isLevelFree\(l\)\) return true;/);
  assert.match(body[1], /levelsForProduct\(p\.product_key\)\.includes\(l\)/);
  assert.match(body[1], /courseV2Config\.V2_TRIAL_PRO_OPENS_PAID === true && \(isInFreeTrial\(\) \|\| hasActiveSubscription\(\)\)/);
  assert.ok(!/\bhasAccess\b/.test(body[1]), 'the v2 gate must not read the legacy hasAccess');
  assert.match(src, /import \* as courseV2Config from '\.\.\/config\/courseV2\.js';/);
  assert.match(src, /\n {4}hasCourseAccess,\n/, 'hasCourseAccess must be in the context value');
  // The legacy rule, verbatim.
  assert.ok(src.includes(`  const hasLevelAccess = (level) => {
    if (isLevelFree(level)) return true;
    if (hasAccess) return true;
    const l = (level || '').toLowerCase();
    return purchases.some((p) => levelsForProduct(p.product_key).includes(l));
  };`), 'hasLevelAccess changed — it keeps governing the legacy courses');
});

test('the route guard asks hasCourseAccess on exactly the v2 routes', () => {
  const src = read('src/components/LevelSubscriptionGuard.jsx');
  assert.match(src, /courseV2 \? hasCourseAccess\(level\) : hasLevelAccess\(level\)/);
  const m = src.match(/const COURSE_V2_PATH_RE = (\/.*\/);/);
  assert.ok(m, 'COURSE_V2_PATH_RE not found');
  const re = new Function(`return ${m[1]};`)();
  for (const p of ['/course/a2.1/v2', '/course/a2.1/v2/', '/course/b1.2/u/7', '/course/b1.2/u/12/', '/course/a1.2/p/2']) {
    assert.ok(re.test(p), `${p} is a v2 route`);
  }
  for (const p of ['/course/a2.1', '/course/a1.1/l/3', '/course/a1.1/cp/1', '/course/a2.1/intro', '/course/a2.1/u', '/level/a2.1', '/course/a2.1/u/7/x']) {
    assert.ok(!re.test(p), `${p} is not a v2 route`);
  }
  assert.match(src, /courseV2Config\.COURSE_V2_LIVE/, '/course/:level follows COURSE_V2_LIVE');
});

// ---------------------------------------------------------------------------
// 6. The migration
// ---------------------------------------------------------------------------

test('the migration is idempotent, RLS-on, and the ledger is service-role-write only', () => {
  const sql = read('migrations/2026-10-01-course-v2.sql');
  const code = sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  for (const m of code.matchAll(/CREATE TABLE (?!IF NOT EXISTS)/g)) assert.fail(`non-idempotent CREATE TABLE at ${m.index}`);
  for (const m of code.matchAll(/CREATE INDEX (?!IF NOT EXISTS)/g)) assert.fail(`non-idempotent CREATE INDEX at ${m.index}`);
  const policies = [...code.matchAll(/CREATE POLICY (\S+) ON public\.(\w+)\s+FOR (\w+)/g)].map((m) => ({ name: m[1], table: m[2], cmd: m[3] }));
  for (const p of policies) {
    assert.ok(code.includes(`DROP POLICY IF EXISTS ${p.name} ON public.${p.table};`), `${p.name} is created without a DROP … IF EXISTS first`);
  }
  for (const table of ['course_ai_usage', 'exam_practice_results', 'learner_goals']) {
    assert.ok(code.includes(`CREATE TABLE IF NOT EXISTS public.${table} (`), `${table} missing`);
    assert.ok(code.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`), `${table} without RLS`);
  }
  const ledger = policies.filter((p) => p.table === 'course_ai_usage');
  assert.deepEqual(ledger.map((p) => p.cmd), ['SELECT'], 'course_ai_usage: own-row read only — a client that can write or delete resets its own allowance');
  const epr = policies.filter((p) => p.table === 'exam_practice_results').map((p) => p.cmd).sort();
  assert.deepEqual(epr, ['DELETE', 'INSERT', 'SELECT'], 'exam_practice_results is append-only (no UPDATE)');
  assert.match(code, /WITH CHECK \(auth\.uid\(\) = user_id AND ai_range IS NULL AND model_id IS NULL AND rubric_profile IS NULL\)/,
    'a client must not be able to insert an AI-graded result');
  assert.equal(policies.filter((p) => p.table === 'learner_goals').length, 4);
});

test('the ledger columns and CHECKs match what entitlement.mjs writes', () => {
  const sql = read('migrations/2026-10-01-course-v2.sql');
  const table = sql.match(/CREATE TABLE IF NOT EXISTS public\.course_ai_usage \(([\s\S]*?)\n\);/);
  assert.ok(table);
  for (const col of ['user_id uuid NOT NULL', 'level text NOT NULL', 'bank_key text NOT NULL', 'slot_key text NOT NULL', 'kind text NOT NULL', 'created_at timestamptz NOT NULL DEFAULT now()']) {
    assert.ok(table[1].includes(col), `course_ai_usage.${col.split(' ')[0]} missing`);
  }
  assert.ok(table[1].includes(`bank_key ~ '${BANK_KEY_RE.source}'`), 'the SQL bank_key CHECK drifted from BANK_KEY_RE');
  assert.ok(table[1].includes(`kind IN (${COURSE_AI_KINDS.map((k) => `'${k}'`).join(', ')})`), 'kind CHECK drifted from COURSE_AI_KINDS');
  assert.match(sql, /review_cards_kind_check\s+CHECK \(kind IN \('word', 'pattern', 'sentence', 'teil', 'repair'\)\)/);
  assert.match(sql, /lesson_progress_status_check\s+CHECK \(status IN \('started', 'complete', 'gold', 'tested_out'\)\)/);
});
