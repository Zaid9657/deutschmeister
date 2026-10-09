// Guard suite for the offer at the free-speaking limit (docs/SCORECARD.md
// work order #7b).
//
// Measured 2026-09-28: 12 learners used AI speaking in 30 days, none paying,
// and 11 of them are past the free allowance. At that point the setup screen
// disabled Start and said "top-ups are coming soon", and a locked mission sent
// the learner to the generic /pricing/. This suite pins what replaced that:
//
//   1. the pure decision (src/lib/speakingOffer.js): the one buyable course for
//      the learner's level, with its included Pro months, else Pro. It never
//      offers a course whose checkout id is unset, a coming-soon level, the
//      free level, or a level the learner already owns;
//   2. the cap is read from the server's own usage reasons, and an unknown
//      usage state is never treated as a cap;
//   3. both buttons use the existing ?buy= resume path, which SubscriptionPage
//      and buyIntent actually honour. Writing this check found that buyIntent
//      had refused every sub-level key since the 2026-09-08 re-cut, which broke
//      the signed-out Buy → signup → checkout resume for every course on sale;
//   4. the speaking page renders the offer at every limit state and no longer
//      links the generic /pricing/.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  parseLevel, offerLevel, isFreeSpeakingCapped, speakingLimitMoment, speakingLimitOffer,
  checkoutHref, PRO_OFFER,
} from '../src/lib/speakingOffer.js';
import {
  ALL_LEVELS, SELLABLE_LEVELS, COMING_SOON_LEVELS, LEVEL_COURSES, LEGACY_LEVEL_COURSES, COURSES, PLANS,
  SUBLEVEL_PRICES_EUR, COURSE_PRO_MONTHS, productKeyForLevel,
} from '../src/data/pricing.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const allConfigured = (key) => `checkout-${key}`;
const noneConfigured = () => '';

// ---------------------------------------------------------------------------
// 1. Which level
// ---------------------------------------------------------------------------

test('parseLevel reads sub-levels as precise and bands as the band start', () => {
  assert.deepEqual(parseLevel('A2.1'), { level: 'a2.1', precise: true });
  assert.deepEqual(parseLevel(' b1.2 '), { level: 'b1.2', precise: true });
  // 'a1' is the signup default on 1,632 of 1,686 profiles: a band, not a placement.
  assert.deepEqual(parseLevel('a1'), { level: 'a1.1', precise: false });
  assert.deepEqual(parseLevel('B2'), { level: 'b2.1', precise: false });
  for (const junk of [null, undefined, '', 'C1', 'a3.1', 'a1.3', 'placement', 42]) {
    assert.equal(parseLevel(junk), null, `${junk} is not a level`);
  }
});

test('a precise profile level wins; the band default yields to the level being practised', () => {
  assert.equal(offerLevel({ profileLevel: 'A2.1', practiceLevel: 'A1.1' }), 'a2.1');
  assert.equal(offerLevel({ profileLevel: 'a1', practiceLevel: 'A2.2' }), 'a2.2');
  assert.equal(offerLevel({ profileLevel: 'a1' }), 'a1.1');
  assert.equal(offerLevel({ practiceLevel: 'A1.2' }), 'a1.2');
  assert.equal(offerLevel({}), null);
});

// ---------------------------------------------------------------------------
// 2. Which offer
// ---------------------------------------------------------------------------

test('every sellable level with a checkout id gets its own course, with the included Pro months', () => {
  assert.ok(SELLABLE_LEVELS.length > 0, 'nothing is sellable: the suite would pass vacuously');
  for (const level of SELLABLE_LEVELS) {
    const offer = speakingLimitOffer({ profileLevel: level.toUpperCase(), checkoutIdFor: allConfigured });
    assert.equal(offer.kind, 'course', level);
    assert.equal(offer.reason, 'buyable');
    assert.equal(offer.level, level);
    assert.equal(offer.course, LEVEL_COURSES[productKeyForLevel(level)], 'the catalogue object, not a copy');
    assert.equal(offer.course.price, SUBLEVEL_PRICES_EUR[level], 'price comes from pricing.js');
    assert.equal(offer.course.proMonths, COURSE_PRO_MONTHS, 'the included Pro months come from pricing.js');
    assert.equal(offer.courseHref, `/subscription?buy=${productKeyForLevel(level)}`);
    assert.equal(offer.pro, PRO_OFFER, 'Pro is always the alternative');
  }
});

test('never a dead checkout: an unset checkout id falls back to Pro', () => {
  for (const level of SELLABLE_LEVELS) {
    for (const checkoutIdFor of [noneConfigured, undefined, null, 'not-a-function']) {
      const offer = speakingLimitOffer({ profileLevel: level, checkoutIdFor });
      assert.equal(offer.kind, 'pro', `${level} with ${String(checkoutIdFor)}`);
      assert.equal(offer.reason, 'no_checkout');
      assert.equal(offer.courseHref, null);
    }
  }
});

test('coming-soon levels, the free level and owned levels fall back to Pro', () => {
  assert.ok(COMING_SOON_LEVELS.length > 0);
  for (const level of COMING_SOON_LEVELS) {
    const offer = speakingLimitOffer({ profileLevel: level, checkoutIdFor: allConfigured });
    assert.equal(offer.kind, 'pro', level);
    assert.equal(offer.reason, 'coming_soon');
    assert.equal(offer.courseHref, null, 'a coming-soon course never gets a checkout link');
  }
  const free = speakingLimitOffer({ profileLevel: 'A1.1', checkoutIdFor: allConfigured });
  assert.deepEqual([free.kind, free.reason, free.course], ['pro', 'free_level', null]);

  const owned = speakingLimitOffer({ profileLevel: 'A2.1', checkoutIdFor: allConfigured, ownedLevels: ['a2.1'] });
  assert.deepEqual([owned.kind, owned.reason], ['pro', 'owned']);
  // A retired band purchase (course_a2) owns both halves; the caller expands it.
  const band = speakingLimitOffer({ profileLevel: 'A2.2', checkoutIdFor: allConfigured, ownedLevels: ['a2.1', 'a2.2'] });
  assert.equal(band.reason, 'owned');
  // Owning a different level does not hide this one.
  const other = speakingLimitOffer({ profileLevel: 'A2.2', checkoutIdFor: allConfigured, ownedLevels: ['a1.2'] });
  assert.equal(other.kind, 'course');

  const none = speakingLimitOffer({ checkoutIdFor: allConfigured });
  assert.deepEqual([none.kind, none.reason], ['pro', 'no_level']);
});

test('every level of the ladder resolves to exactly one of the two offers', () => {
  for (const level of ALL_LEVELS) {
    const offer = speakingLimitOffer({ profileLevel: level, checkoutIdFor: allConfigured });
    assert.ok(['course', 'pro'].includes(offer.kind), level);
    assert.equal(offer.kind === 'course', SELLABLE_LEVELS.includes(level), `${level}: course iff sellable`);
  }
});

test('the checkout id is asked for by product key only', () => {
  const asked = [];
  speakingLimitOffer({ profileLevel: 'A1.2', checkoutIdFor: (key) => { asked.push(key); return 'x'; } });
  assert.deepEqual(asked, ['course_a1_2']);
  assert.ok(asked.every((k) => k in LEVEL_COURSES));
});

// ---------------------------------------------------------------------------
// 3. When the cap applies, and the server agrees on why
// ---------------------------------------------------------------------------

test('the cap is an explicit allowed:false for a non-subscriber, never an unknown state', () => {
  assert.equal(isFreeSpeakingCapped({ usage: { allowed: false, reason: 'trial_limit_reached' } }), true);
  assert.equal(isFreeSpeakingCapped({ usage: { allowed: false, reason: 'subscription_required' } }), true);
  assert.equal(isFreeSpeakingCapped({ usage: { allowed: true, used: 1, limit: 2 } }), false);
  assert.equal(isFreeSpeakingCapped({ usage: null }), false, 'a failed usage check is not a cap');
  assert.equal(isFreeSpeakingCapped({ usage: {} }), false);
  assert.equal(isFreeSpeakingCapped({}), false);
  assert.equal(isFreeSpeakingCapped({ subscriber: true, usage: { allowed: false } }), false, 'subscribers are Pro already');
});

test('the headline follows the server reason', () => {
  assert.equal(speakingLimitMoment({ usage: { allowed: false, reason: 'trial_limit_reached' } }), 'sessions_used');
  assert.equal(speakingLimitMoment({ usage: { allowed: false, reason: 'subscription_required' } }), 'trial_over');
  assert.equal(speakingLimitMoment({ usage: { allowed: true }, missionLocked: true }), 'mission_locked');
  const server = read('netlify/functions/_shared/speakingUsage.mjs');
  for (const reason of ['trial_limit_reached', 'subscription_required']) {
    assert.ok(server.includes(`reason: '${reason}'`), `speakingUsage.mjs no longer returns ${reason}`);
  }
});

// ---------------------------------------------------------------------------
// 4. The buttons use the existing checkout path
// ---------------------------------------------------------------------------

test('both hrefs are ?buy= keys that buyIntent and SubscriptionPage honour', () => {
  const src = read('src/lib/buyIntent.js');
  const valid = new RegExp(src.match(/const VALID = \/(.+)\/;/)[1]);
  for (const level of SELLABLE_LEVELS) {
    const key = productKeyForLevel(level);
    assert.equal(checkoutHref(key), `/subscription?buy=${key}`);
    assert.ok(valid.test(key), `buyIntent rejects ${key}`);
  }
  assert.equal(PRO_OFFER.href, '/subscription?buy=monthly');
  assert.ok(valid.test(PRO_OFFER.key));
  // The signed-out resume (pricing.astro / CourseCheckout.astro store the key,
  // postAuthPath reads it back through this pattern) must accept every product
  // key there is. It refused every sub-level key from 2026-09-08 to 2026-09-28.
  const everyKey = [...Object.keys(PLANS), ...Object.keys(COURSES), ...Object.keys(LEVEL_COURSES), ...Object.keys(LEGACY_LEVEL_COURSES)];
  for (const key of everyKey) assert.ok(valid.test(key), `buyIntent drops the ${key} intent after signup`);
  for (const junk of ['', 'course_', 'course_a1_', 'course_a1_2_3', 'pro', 'monthly?x=1', 'course_A1_2']) {
    assert.ok(!valid.test(junk), `buyIntent accepts ${JSON.stringify(junk)}`);
  }
  const sub = read('src/pages/SubscriptionPage.jsx');
  assert.ok(sub.includes("searchParams.get('buy')"), 'SubscriptionPage no longer resumes ?buy=');
  assert.ok(sub.includes('LEMONSQUEEZY_CONFIG.levelCourses[key]'), 'SubscriptionPage no longer resolves level-course keys');
  assert.ok(/if \(target\?\.variantId && !hasProduct\(key\)\) startPurchase/.test(sub), 'the resume must still refuse an unset checkout id');
});

// ---------------------------------------------------------------------------
// 5. The speaking page shows the offer at every limit state
// ---------------------------------------------------------------------------

test('the speaking page renders the offer at the cap and on a locked mission, not /pricing/', () => {
  const page = read('src/pages/SpeakingPage.jsx');
  assert.ok(page.includes('speakingLimitOffer({'), 'the page must ask the pure function');
  assert.ok(page.includes("checkoutIdFor: (key) => LEMONSQUEEZY_CONFIG.levelCourses[key]?.variantId || ''"),
    'the checkout id must come from the same config the checkout opens');
  assert.ok(page.includes('levelsForProduct(p.product_key)'), 'owned levels must include retired band purchases');
  assert.ok(/showLimitOffer = !subscriber && !subLoading && !metaLoading && \(missionLocked \|\| \(capped && !canAfford\)\)/.test(page),
    'the offer must cover both the cap and the locked mission');
  assert.ok(page.includes('<SpeakingLimitOffer offer={limitOffer} moment={limitMoment} />'));
  assert.ok(!page.includes('href="/pricing/"'), 'the generic /pricing/ link is back on the speaking page');
  assert.ok(!page.includes('Unlock with Pro'), 'the old locked-mission button is back');
  // The 402 path re-reads the allowance so the offer replaces the dead end.
  const funds = page.slice(page.indexOf('if (res.status === 402)'), page.indexOf('if (!res.ok)'));
  assert.ok(funds.includes('loadMeta()'));

  const card = read('src/components/speaking/SpeakingLimitOffer.jsx');
  assert.ok(card.includes("from '../ui/Button.jsx'") && card.includes("from '../ui/Card.jsx'"), 'ui primitives only');
  assert.ok(card.includes('eur(course.price)') && card.includes('eur(PLANS.monthly.price)'), 'prices derive from pricing.js');
  assert.ok(card.includes('course.proMonths'), 'the included Pro months are shown');
  assert.ok(card.includes('to={offer.courseHref}') && card.includes('to={offer.pro.href}'));
  assert.ok(!/bg-(?:red|green|blue|amber|rose|indigo|violet|purple)-\d/.test(card), 'tokens only');
});
