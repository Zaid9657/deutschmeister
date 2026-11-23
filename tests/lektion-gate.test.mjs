// The Lektion gate (owner decision 2026-11-18): A1.1 stays a free LEVEL, but its
// guided course is free only up to Lektion 1; the rest needs a subscription or
// a purchase. It ships switched off (LEKTION_GATE_FROM = null) and must change
// nothing until the "A1.1 is free" claims change with it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import * as client from '../src/config/freeTier.js';
import * as server from '../netlify/functions/_shared/supportCatalog.mjs';
import { courseAccessReason, fullCourseReason } from '../src/lib/levelEntitlement.js';
import { canOpenStep } from '../netlify/functions/course-reminder.mjs';
import { buildFacts, gatedCourses, SYSTEM_PROMPT } from '../netlify/functions/_shared/supportAgentLib.mjs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const GATE = '2026-11-20T00:00:00.000Z';
const now = Date.parse('2026-12-01T00:00:00.000Z');
const fresh = { created_at: '2026-11-25T00:00:00.000Z' };
const old = { created_at: '2026-10-01T00:00:00.000Z' };
const account = (o = {}) => ({ profile: { ...fresh, ...o.profile }, subscription: o.subscription || null, purchases: o.purchases || [] });
const liveSub = { status: 'active', subscription_end: '2027-01-01T00:00:00.000Z', subscription_start: '2026-11-26T00:00:00.000Z', plan_type: 'monthly' };
const liveTrial = { trial_started_at: '2026-11-25T00:00:00.000Z', trial_ends_at: '2026-12-02T00:00:00.000Z', is_subscribed: false };
const examPack = { product_key: 'a1_exam_pack', status: 'active' };

test('the server copy of the gate equals the client one', () => {
  assert.deepEqual({ ...server.FREE_LEKTIONEN }, { ...client.FREE_LEKTIONEN });
  assert.equal(server.LEKTION_GATE_FROM, client.LEKTION_GATE_FROM);
  if (client.LEKTION_GATE_FROM !== null) assert.ok(Number.isFinite(Date.parse(client.LEKTION_GATE_FROM)), 'the gate start must be a date');
  for (const level of Object.keys(client.FREE_LEKTIONEN)) assert.ok(client.isLevelFree(level), `${level}: only a free level can have free Lektionen`);
});

test('switched off, the gate changes nothing', () => {
  assert.equal(client.beyondFreeLektionen('/course/a1.1/l/2', null), false);
  assert.equal(client.freeLektionen('a1.1', null), 0);
  assert.equal(fullCourseReason(account(), 'a1.1', now, null), 'free');
  assert.equal(canOpenStep('a1.1', { kind: 'lektion', nr: 5 }, {}, now, null), true);
});

test('live, only the steps past Lektion 1 of the gated course are gated', () => {
  for (const [path, gated] of [
    ['/course/a1.1', false], ['/course/a1.1/l/1', false], ['/course/a1.1/review', false],
    ['/course/a1.1/l/2', true], ['/course/A1.1/l/12', true], ['/course/a1.1/checkpoint/1', true],
    ['/course/a1.2/l/2', false], ['/level/a1.1', false], ['/reading/a1.1/3', false], [undefined, false],
  ]) assert.equal(client.beyondFreeLektionen(path, GATE), gated, String(path));
});

test('live, the whole course opens for older accounts and for anyone who pays', () => {
  const full = (o) => fullCourseReason(account(o), 'a1.1', now, GATE);
  assert.equal(full(), null, 'a new free account gets Lektion 1 only');
  assert.equal(full({ profile: old }), 'free', 'an account from before the gate keeps A1.1');
  assert.equal(full({ subscription: liveSub }), 'pro', 'a subscription started after the course cutoff opens it too');
  assert.equal(full({ subscription: { ...liveSub, subscription_end: '2026-11-30T00:00:00.000Z' } }), null, 'a lapsed subscription does not');
  assert.equal(full({ purchases: [examPack] }), 'owned', 'any purchase opens it');
  assert.equal(full({ purchases: [{ ...examPack, status: 'refunded' }] }), null);
  assert.equal(full({ purchases: [{ product_key: 'pro_days', status: 'active', access_until: '2026-11-28T00:00:00.000Z' }] }), null, 'an expired grant window is not a purchase');
  assert.equal(full({ profile: liveTrial }), null, 'the trial opens Lektion 1 only (owner decision 2026-11-18)');
  assert.equal(courseAccessReason(account({ profile: liveTrial }), 'a1.2', now), 'trial', 'the trial still opens the other levels');
  // The level itself, and every other level, are untouched.
  assert.equal(courseAccessReason(account(), 'a1.1', now), 'free');
  assert.equal(fullCourseReason(account(), 'a1.2', now, GATE), null);
  const subscriber = account({ subscription: liveSub });
  assert.equal(fullCourseReason(subscriber, 'a1.2', now, GATE), courseAccessReason(subscriber, 'a1.2', now));
});

test('a reminder never names a step that opens the pay screen', () => {
  const lektion2 = { kind: 'lektion', nr: 2 };
  const can = (acc, step = lektion2) => canOpenStep('a1.1', step, acc, now, GATE);
  assert.equal(can({ profile: fresh }, { kind: 'lektion', nr: 1 }), true);
  assert.equal(can({ profile: fresh }), false);
  assert.equal(can({ profile: fresh }, { kind: 'checkpoint', nr: 1 }), false);
  assert.equal(can({ profile: fresh }, { kind: 'finaltest' }), false);
  assert.equal(can({ profile: old }), true);
  assert.equal(can({ profile: { ...fresh, ...liveTrial } }), false, 'a trial does not open Lektion 2');
  assert.equal(can({ profile: fresh, subscription: liveSub }), true);
  assert.equal(can({ profile: fresh, purchases: [examPack] }), true);
  assert.equal(can(undefined), false, 'no access rows read means no reminder');
});

test('the support agent is told who opens the rest of the gated course', () => {
  const at = new Date(now);
  const open = (o = {}) => gatedCourses({ ...account(o), now: at, gateFrom: GATE });
  assert.deepEqual(open(), [{ level: 'a1.1', free_lektionen: 1, whole_course_open: false }], 'a new free account: Lektion 1 only');
  assert.equal(open({ profile: old })[0].whole_course_open, true);
  assert.equal(open({ profile: liveTrial })[0].whole_course_open, false, 'the trial does not open it');
  assert.equal(open({ subscription: liveSub })[0].whole_course_open, true);
  assert.equal(open({ subscription: { ...liveSub, subscription_end: '2026-11-30T00:00:00.000Z' } })[0].whole_course_open, false);
  assert.equal(open({ purchases: [examPack] })[0].whole_course_open, true);
  assert.equal(open({ purchases: [{ ...examPack, status: 'refunded' }] })[0].whole_course_open, false);
  assert.equal(open({ purchases: [{ product_key: 'pro_days', status: 'active', access_until: '2026-11-28T00:00:00.000Z' }] })[0].whole_course_open, false);
  assert.deepEqual(gatedCourses({ ...account(), now: at, gateFrom: null }), [], 'switched off, there is no gated course');
  // The same answer the app gives, for every account above.
  for (const o of [{}, { profile: old }, { profile: liveTrial }, { subscription: liveSub }, { purchases: [examPack] }]) {
    assert.equal(open(o)[0].whole_course_open, Boolean(fullCourseReason(account(o), 'a1.1', now, GATE)), JSON.stringify(o));
  }

  const facts = buildFacts({ ticket: { reference: 'DM-X', category: 'other', created_at: '2026-12-01T00:00:00Z' }, profile: { ...fresh }, now: at });
  assert.deepEqual(facts.customer.levels_open_now, ['a1.1'], 'the level itself stays open');
  assert.deepEqual(facts.customer.gated_courses, [{ level: 'a1.1', free_lektionen: 1, whole_course_open: false }]);
  const [gate] = facts.library.course_gate;
  assert.equal(gate.level, 'a1.1');
  assert.equal(gate.free_lektionen, client.FREE_LEKTIONEN['a1.1']);
  assert.equal(gate.trial_opens_rest, false);
  assert.equal(gate.accounts_created_before_keep_whole_course, client.LEKTION_GATE_FROM.slice(0, 10));
  assert.match(SYSTEM_PROMPT, /never say that whole course is free/);
  assert.match(SYSTEM_PROMPT, /FACTS\.customer\.gated_courses\[\]\.whole_course_open/);
  assert.match(read('netlify/functions/support-agent.mjs'), /from\('profiles'\)\.select\('id, created_at, /, 'the agent reads the account date the gate turns on');
});

test('the lock on a gated step promises neither an unlock nor a trial', () => {
  const lock = read('src/components/LockedContentOverlay.jsx');
  assert.match(lock, /gateFree\s*\? \(isGerman \? 'Weiter mit einem Abo' : 'Continue with a subscription'\)/);
  assert.match(lock, /gateFree\s*\? \(isGerman\s*\? 'Das Konto ist kostenlos · keine Kreditkarte nötig'\s*: 'The account is free · no credit card needed'\)/);
});

// The course home's pace line said "Nothing here locks" next to a course that locks from Lektion 2.
test('no course-home copy says the course has no lock', () => {
  for (const file of ['src/components/course/CourseWelcome.jsx', 'src/pages/CurriculumHomePage.jsx', 'src/data/curricula/a11.meta.js']) {
    assert.doesNotMatch(read(file), /nothing (here )?(is )?lock|never locks|nichts (ist )?gesperrt/i, file);
  }
});

test('the guards, the course home and the pay page read the gate', () => {
  const guard = read('src/components/LevelSubscriptionGuard.jsx');
  assert.match(guard, /if \(isLevelFree\(level\) && !gated\)/);
  assert.match(guard, /gated \? !hasFullCourse\(level\) :/);
  assert.match(read('src/components/ExamSubscriptionGuard.jsx'), /hasFullCourse\(resolved\.gateLevel\)/);
  assert.match(read('src/contexts/SubscriptionContext.jsx'), /const hasFullCourse = \(level\) => Boolean\(fullCourseReason\(\{ profile, subscription, purchases \}, level\)\)/);
  for (const page of ['src/pages/CurriculumHomePage.jsx', 'src/pages/SubscriptionPage.jsx']) assert.match(read(page), /data-lektion-gate/, page);
  assert.match(read('netlify/functions/course-reminder.mjs'), /if \(!canOpenStep\(r\.level, step, access\.get\(r\.user_id\), now\)\) continue;/);
});
