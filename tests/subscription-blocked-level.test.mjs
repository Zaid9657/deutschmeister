// Guard: /subscription leads with the level the learner was just refused, and
// "Owned · open" opens the guided course (ACC-13, ACC-14, cross-check 2026-10-25).
//
// ACC-13: LevelSubscriptionGuard and SubscriptionGuard redirect to
// /subscription with the blocked location in state.from, but the page never
// read it: a learner who tapped A1.2 got a coupon selector first, then a
// generic grid of every level. Now the page parses the level from state.from
// (one pure function), and when that level's course is on sale and not owned,
// its card comes first with a one-line lead naming the level (price from
// pricing.js, Buy through startPurchase). The coupon field moved behind a
// "Have a code?" toggle below the offers. No entitlement changes.
//
// ACC-14: "Owned · open" sent course buyers to the /level/<level> topic hub;
// the success page and the dashboard strip send them to /course/<level>.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import { blockedLevelFrom, ownsCheckoutProduct } from '../src/lib/checkoutAccess.js';
import { LEVEL_COURSES, productKeyForLevel } from '../src/data/pricing.js';
import { courseHomeFor } from '../src/lib/courseEntry.js';

const page = readFileSync(new URL('../src/pages/SubscriptionPage.jsx', import.meta.url), 'utf8');

test('the blocked level is read from the guarded routes a guard redirects from', () => {
  for (const [pathname, level] of [
    ['/course/a1.2', 'a1.2'],
    ['/course/a1.2/checkpoint/1', 'a1.2'],
    ['/course/a2.1/l/3', 'a2.1'],
    ['/level/b1.1', 'b1.1'],
    ['/reading/a2.2/12', 'a2.2'],
    ['/listening/b2.2/4', 'b2.2'],
    ['/course/A1.2', 'a1.2'],
  ]) assert.equal(blockedLevelFrom(pathname), level, pathname);
  for (const pathname of [undefined, null, '', '/dashboard', '/modelltest', '/course/a1.2x', '/course/c1.1', '/grammar/a1.2/', '/subscription']) {
    assert.equal(blockedLevelFrom(pathname), null, String(pathname));
  }
});

/** The page's lead-course selection, as shipped, over a fake catalogue. */
const leadFor = ({ pathname, purchases = [], levelCourses = LEVEL_COURSES, variants = {} }) => {
  const start = page.indexOf('  const blockedLevel = ');
  const end = page.indexOf(': visibleLevelCourses;', start);
  assert.ok(start >= 0 && end > start, 'the lead-course selection moved');
  const catalogue = Object.fromEntries(Object.entries(levelCourses).map(([key, c]) => [key, { ...c, variantId: variants[key] ?? '' }]));
  const visibleLevelCourses = Object.values(catalogue).filter((c) => c.variantId || c.comingSoon);
  return vm.runInNewContext(`${page.slice(start, end)}: visibleLevelCourses;\n({ leadCourse, orderedLevelCourses });`, {
    location: { state: pathname ? { from: { pathname } } : null },
    blockedLevelFrom, productKeyForLevel, ownsCheckoutProduct, purchases, visibleLevelCourses,
    LEMONSQUEEZY_CONFIG: { levelCourses: catalogue },
  });
};

const ON_SALE = { course_a1_2: 'v-a12', course_a2_1: 'v-a21', course_a2_2: 'v-a22' };

test('the refused level\'s course leads when it is on sale and not owned', () => {
  const { leadCourse, orderedLevelCourses } = leadFor({ pathname: '/course/a2.1/l/2', variants: ON_SALE });
  assert.equal(leadCourse.key, 'course_a2_1');
  assert.equal(orderedLevelCourses[0].key, 'course_a2_1', 'its card comes first');
  assert.equal(orderedLevelCourses.filter((c) => c.key === 'course_a2_1').length, 1, 'and only once');
  assert.equal(orderedLevelCourses.length, leadFor({ variants: ON_SALE }).orderedLevelCourses.length);
});

test('no lead for an owned level, a coming-soon level, a level without a checkout, or no blocked level', () => {
  assert.equal(leadFor({ pathname: '/course/a2.1', variants: ON_SALE, purchases: [{ product_key: 'course_a2', status: 'active' }] }).leadCourse, null, 'a retired band owns it');
  assert.equal(leadFor({ pathname: '/course/a2.1', variants: ON_SALE, purchases: [{ product_key: 'course_a2_1', status: 'active' }] }).leadCourse, null);
  assert.equal(leadFor({ pathname: '/level/b1.1', variants: ON_SALE }).leadCourse, null, 'coming soon: nothing to buy');
  assert.equal(leadFor({ pathname: '/course/a2.2', variants: { course_a1_2: 'v-a12' } }).leadCourse, null, 'no checkout id');
  assert.equal(leadFor({ pathname: '/dashboard', variants: ON_SALE }).leadCourse, null);
  assert.equal(leadFor({ variants: ON_SALE }).leadCourse, null);
  assert.deepEqual(leadFor({ variants: ON_SALE }).orderedLevelCourses.map((c) => c.key), ['course_a1_2', 'course_a2_1', 'course_a2_2', 'course_b1_1', 'course_b1_2', 'course_b2_1', 'course_b2_2']);
});

test('the lead names the level, derives its price, and buys through startPurchase', () => {
  const lead = page.slice(page.indexOf('{leadCourse && ('), page.indexOf('{orderedLevelCourses.map('));
  assert.ok(lead.length > 0);
  assert.match(lead, /\$\{leadCourse\.code\}/);
  assert.match(lead, /€\$\{num\(leadCourse\.price\)\}/, 'the price comes from pricing.js');
  assert.match(lead, /Sie wollten gerade/);
  assert.doesNotMatch(lead, /€\d/, 'no retyped price');
  assert.match(page, /const location = useLocation\(\);/);
  assert.match(page, /blockedLevelFrom\(location\.state\?\.from\?\.pathname\)/);
  assert.match(page, /onClick=\{\(\) => startPurchase\(c\.key, c\.variantId, c\.price\)\}/, 'the card\'s Buy is startPurchase');
});

test('the coupon field sits behind a "Have a code?" disclosure, below the offers', () => {
  const coupon = page.indexOf('<CouponField');
  assert.equal(page.indexOf('<CouponField', coupon + 1), -1, 'one coupon field');
  assert.ok(coupon > page.indexOf('onClick={() => handleSubscribe(plan.id)}'), 'below the Pro plans');
  assert.ok(coupon > page.indexOf('{orderedLevelCourses.map('), 'below the level courses');
  assert.ok(coupon > page.indexOf('onClick={handleBuyCourse}'), 'below the telc course');
  const details = page.lastIndexOf('<details', coupon);
  assert.ok(details > 0 && page.indexOf('</details>', details) > coupon, 'the field is inside a <details> disclosure');
  assert.doesNotMatch(page.slice(details, coupon), /<details[^>]*\bopen\b/, 'closed until the learner opens it');
  assert.match(page.slice(details, coupon), /<summary[^>]*>\s*\{isGerman \? 'Haben Sie einen Gutscheincode\?' : 'Have a code\?'\}\s*<\/summary>/);
});

test('ACC-14: "Owned · open" opens the guided course where there is one', () => {
  const start = page.indexOf('export const ownedLevelHref = ');
  const end = page.indexOf('\n};\n', start);
  assert.ok(start >= 0 && end > start);
  const ownedLevelHref = vm.runInNewContext(`${page.slice(start, end).replace('export const', 'const')}\n};\nownedLevelHref;`, { courseHomeFor });
  const owns = () => true;
  assert.equal(ownedLevelHref('a1.2', owns), '/course/a1.2');
  assert.equal(ownedLevelHref('a2.2', owns), '/course/a2.2');
  assert.equal(ownedLevelHref('b1.1', owns), '/level/b1.1', 'no guided course yet: the level page');
  assert.match(page, /<Button to=\{ownedLevelHref\(firstLevel, hasLevelAccess\)\}/);
  assert.doesNotMatch(page, /to=\{`\/level\/\$\{firstLevel\}`\}/);
});
