// Guard: on the static offer pages only ownership swaps Buy for Open
// (ACC-17), and one entitlement read serves every door (ACC-18), cross-check
// 2026-10-25.
//
// ACC-17: astro-site/src/lib/levelAccess.js answered "open" for a live trial or
// Pro, and CourseCheckout's door script replaced every Buy on /pricing/,
// /courses/*, the homepage line and the ticket with "Continue course" for
// them. During the 7-day trial (intent at its highest) and for every Pro
// subscriber, and for course buyers inside their included Pro window (whose
// is_subscribed is true), the lifetime course could not be bought from any
// static page. The SPA's rule says the opposite: "A live trial or Pro period
// is not ownership of a course" (src/lib/checkoutAccess.js ownsCheckoutProduct).
// Now levelOpen() answers `owned` and `reason` beside the unchanged `open`; a
// door swaps only when owned, and a trial/Pro door keeps Buy and gains a small
// "Continue course" link (appended, the button untouched).
//
// ACC-18: every distinct level on a page re-read the user, the profile and the
// purchases (7-8 levels on the homepage, /courses/ and /pricing/). Now one
// snapshot is loaded per page view and every door is mapped from it;
// getLevelAccess(level) stays as a wrapper with the same shape for
// components/ExercisePlayer.jsx.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buyButton, door, FakeElement, fakeSupabase, loadLevelAccess, runCourseCheckout } from './helpers/courseCheckoutHarness.mjs';

const lib = loadLevelAccess({});
const NOW = Date.parse('2026-10-25T12:00:00Z');
const TRIAL = { is_subscribed: false, trial_ends_at: '2999-01-01T00:00:00Z' };
const PRO = { is_subscribed: true, trial_ends_at: '2026-01-01T00:00:00Z' };
const ENDED = { is_subscribed: false, trial_ends_at: '2026-10-01T00:00:00Z' };
const snap = (profile, purchases = []) => ({ signedIn: true, verified: true, profile, purchases });

test('levelOpen: a trial or Pro opens a level without owning it; a bought course owns it', () => {
  assert.deepEqual({ ...lib.levelOpen(snap(TRIAL), 'a1.2', NOW) }, { signedIn: true, open: true, owned: false, reason: 'trial' });
  assert.deepEqual({ ...lib.levelOpen(snap(PRO), 'a2.1', NOW) }, { signedIn: true, open: true, owned: false, reason: 'pro' });
  assert.deepEqual({ ...lib.levelOpen(snap(ENDED, [{ product_key: 'course_a1_2' }]), 'a1.2', NOW) }, { signedIn: true, open: true, owned: true, reason: 'owned' });
  assert.deepEqual({ ...lib.levelOpen(snap(PRO, [{ product_key: 'course_a1_2' }]), 'a1.2', NOW) }, { signedIn: true, open: true, owned: true, reason: 'owned' }, 'ownership wins over Pro');
  assert.deepEqual({ ...lib.levelOpen(snap(ENDED), 'a1.2', NOW) }, { signedIn: true, open: false, owned: false, reason: null });
  assert.deepEqual({ ...lib.levelOpen({ signedIn: false }, 'a1.2', NOW) }, { signedIn: false, open: false, owned: false, reason: null });
});

test('levelOpen: a retired band (course_a1) owns both of its sub-levels, and only those', () => {
  const legacy = snap(ENDED, [{ product_key: 'course_a1' }]);
  for (const level of ['a1.1', 'a1.2']) assert.equal(lib.levelOpen(legacy, level, NOW).owned, true, level);
  assert.equal(lib.levelOpen(legacy, 'a2.1', NOW).owned, false);
  assert.equal(lib.levelOpen(snap(ENDED, [{ product_key: 'course_a1', status: 'refunded' }]), 'a1.2', NOW).owned, false, 'a refunded row owns nothing');
});

test('`open` keeps its old answer for the exercise player: owned, Pro or a live trial', () => {
  for (const [profile, purchases, open] of [
    [TRIAL, [], true], [PRO, [], true], [ENDED, [], false], [ENDED, [{ product_key: 'course_a2' }], true], [null, [], false],
  ]) assert.equal(lib.levelOpen(snap(profile, purchases), 'a2.1', NOW).open, open, JSON.stringify({ profile, purchases }));
});

/** A homepage-like page: two Buy doors, one ride-along bar door, one coming-soon door, on paper and night grounds. */
const page = () => {
  const lineA12 = door('a1.2', [buyButton('course_a1_2')]);
  const pricingA21 = door('a2.1', [buyButton('course_a2_1')]);
  const barA12 = door('a1.2', [buyButton('course_a1_2')]);
  const soonB11 = door('b1.1', [new FakeElement('a', { href: '/pricing/#pro' })]);
  const body = new FakeElement('body', {}, [
    new FakeElement('section', { 'data-ground': 'nacht' }, [lineA12]),
    new FakeElement('section', {}, [pricingA21, soonB11]),
    new FakeElement('aside', { 'data-fahrschein-bar': '' }, [barA12]),
  ]);
  return { body, lineA12, pricingA21, barA12, soonB11 };
};

const continueLink = (d) => d.children.find((c) => typeof c === 'object' && c.getAttribute('data-course-continue') !== null);
const buyIn = (d) => d.querySelector('[data-course-variant]');

for (const [name, profile] of [['trial', TRIAL], ['Pro', PRO]]) {
  test(`a ${name} learner without a purchase keeps every Buy button, with a way in beside it`, async () => {
    const { body, lineA12, pricingA21, barA12, soonB11 } = page();
    const run = runCourseCheckout({ body, snapshot: snap(profile) });
    await run.settle();
    for (const d of [lineA12, pricingA21, barA12]) {
      assert.ok(buyIn(d), `${d.getAttribute('data-course-door')}: Buy is still there`);
      assert.equal(buyIn(d).disabled, false);
      assert.equal(d.innerHTML, null, 'the door was not rewritten');
    }
    assert.equal(continueLink(lineA12).textContent, 'Continue course A1.2 →');
    assert.equal(continueLink(lineA12).href, 'https://deutsch-meister.de/course/a1.2');
    assert.equal(continueLink(lineA12).className, 'dm-link-nacht', 'the night ground gets its link style');
    assert.equal(continueLink(pricingA21).className, 'dm-link');
    assert.equal(continueLink(barA12), undefined, 'the ride-along bar keeps one key');
    // A door with nothing to buy simply opens for a level they may use.
    assert.match(soonB11.innerHTML || '', /Open B1\.1/);
  });
}

test('an owner gets Open instead of Buy; the levels they do not own keep Buy', async () => {
  const { body, lineA12, pricingA21, barA12 } = page();
  const run = runCourseCheckout({ body, snapshot: snap(ENDED, [{ product_key: 'course_a1_2' }]) });
  await run.settle();
  for (const d of [lineA12, barA12]) {
    assert.match(d.innerHTML, /^<a href="https:\/\/deutsch-meister\.de\/course\/a1\.2" class="dm-key">Continue course A1\.2 →<\/a>$/);
  }
  assert.ok(buyIn(pricingA21), 'A2.1 is not owned: Buy stays');
  assert.equal(continueLink(pricingA21), undefined, 'and no access to it, so no continue link');
});

test('a retired course_a1 owner gets Open for A1.1 and A1.2', async () => {
  const a11 = door('a1.1', [new FakeElement('a', { href: '/course/a1.1' })]);
  const a12 = door('a1.2', [buyButton('course_a1_2')]);
  const run = runCourseCheckout({ body: new FakeElement('body', {}, [a11, a12]), snapshot: snap(ENDED, [{ product_key: 'course_a1' }]) });
  await run.settle();
  assert.match(a11.innerHTML, /Continue course A1\.1/);
  assert.match(a12.innerHTML, /Continue course A1\.2/);
});

test('ACC-18: one snapshot serves every door on the page', async () => {
  const { body } = page();
  const run = runCourseCheckout({ body, snapshot: snap(TRIAL) });
  await run.settle();
  assert.equal(run.snapshotCalls, 1, 'one lookup per page view, not one per level');
  // A Buy click reads ownership once more, for the account signed in at that
  // moment (tests/course-door-rule.test.mjs: another tab may have switched it).
  await buyIn(body.children[1].children[0]).click();
  assert.equal(run.snapshotCalls, 2);
});

test('ACC-18: the snapshot is one auth read, one profile read and one purchases read; a failed read is not "nothing bought"', async () => {
  const ok = fakeSupabase({ profile: TRIAL, purchases: [{ product_key: 'course_a1_2' }] });
  const snapshot = await loadLevelAccess(ok.client).loadEntitlementSnapshot();
  assert.deepEqual([...ok.reads], ['auth', 'profiles', 'purchases']);
  assert.equal(snapshot.signedIn, true);
  assert.equal(snapshot.userId, 'learner', 'a snapshot names the account it answers for');
  assert.equal(snapshot.verified, true);
  assert.equal(snapshot.purchases.length, 1);
  const failed = fakeSupabase({ purchasesError: { message: 'Failed to fetch' } });
  assert.equal((await loadLevelAccess(failed.client).loadEntitlementSnapshot()).verified, false);
  const signedOut = fakeSupabase({ user: null });
  const out = await loadLevelAccess(signedOut.client).loadEntitlementSnapshot();
  assert.equal(out.signedIn, false);
  assert.equal(out.userId, null);
  assert.deepEqual([...signedOut.reads], ['auth'], 'no table read without a user');
});

test('getLevelAccess keeps its shape for the exercise player', async () => {
  const trial = await loadLevelAccess(fakeSupabase({ profile: { ...TRIAL, trial_ends_at: '2999-01-01T00:00:00Z' } }).client).getLevelAccess('a2.1');
  assert.equal(trial.signedIn, true);
  assert.equal(trial.open, true);
  assert.equal(trial.owned, false);
  const out = await loadLevelAccess(fakeSupabase({ user: null }).client).getLevelAccess('a2.1');
  assert.equal(out.signedIn, false);
  assert.equal(out.open, false);
  const player = readFileSync(new URL('../astro-site/src/components/ExercisePlayer.jsx', import.meta.url), 'utf8');
  assert.match(player, /m\.getLevelAccess\(level\)/);
  assert.match(player, /setAccess\(r\.open \? 'open' : 'locked'\)/);
});
