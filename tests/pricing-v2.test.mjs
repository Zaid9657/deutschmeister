import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import * as pricing from '../src/data/pricing.js';
import {
  ALL_LEVELS, regularPrice, launchPrice, currentPrice, isLaunchActive,
  launchDiscountPercent, launchDiscountCode, coursePriceLine, courseOffer,
  LAUNCH_ENDS_AT, OFFER_PRODUCTS, LEVEL_COURSES, isProductOnSale, courseForProduct,
} from '../src/data/pricing.js';
import { courseAccessReason, fullCourseReason } from '../src/lib/levelEntitlement.js';

const end = Date.parse(LAUNCH_ENDS_AT);
const cutoff = '2026-12-01T12:00:00Z';
const gate = '2026-11-22T11:30:00Z';
const now = Date.parse('2026-12-02T12:00:00Z');
const purchase = (key, created_at = cutoff) => ({ product_key: key, created_at, status: 'active', access_until: '2027-03-01T12:00:00Z' });
const account = (purchases = [], extra = {}) => ({ profile: { created_at: cutoff }, purchases, ...extra });
const full = (acc, level = 'a1.1') => fullCourseReason(acc, level, now, gate, cutoff);

test('every course has its approved regular and launch price, percentage and own level', () => {
  const regular = [100, 100, 110, 120, 130, 140, 150, 160];
  const launch = [20, 50, 55, 60, 65, 70, 75, 80];
  ALL_LEVELS.forEach((level, index) => {
    assert.equal(regularPrice(level), regular[index]);
    assert.equal(launchPrice(level), launch[index]);
    assert.equal(launchDiscountPercent(level), index === 0 ? 80 : 50);
    assert.equal(currentPrice(level, end - 1000), launch[index]);
    assert.equal(currentPrice(level, end + 1000), regular[index]);
    const product = Object.values(LEVEL_COURSES).find((p) => p.levels.includes(level));
    assert.deepEqual(product.levels, [level]);
    assert.equal(product.proDays, 90);
    assert.equal(isProductOnSale(product.key), index < 2);
  });
  assert.equal(OFFER_PRODUCTS.a1_exam_pack.price, 59);
  assert.equal(launchDiscountCode('a1_exam_pack', end - 1000), null);
});

test('Berlin deadline is inclusive; price, codes, labels and schema switch together', () => {
  for (const at of [end - 1000, end, end + 999]) {
    assert.equal(isLaunchActive(at), true);
    assert.equal(launchDiscountCode('a1.1', at), 'LAUNCH80');
    assert.equal(launchDiscountCode('a1.2', at), 'LAUNCH50');
    assert.equal(courseOffer('a1.1', at).price, '20.00');
    assert.equal(courseOffer('a1.1', at).priceCurrency, 'EUR');
    assert.equal(courseOffer('a1.1', at).priceValidUntil, '2027-01-31');
    assert.match(coursePriceLine('a1.1', at), /launch price until 31 January 2027.*from 1 February 2027.*80%/);
    assert.match(coursePriceLine('a1.1', at, 'de'), /Einführungspreis bis 31. Januar 2027.*ab 1. Februar 2027.*80 %/);
  }
  for (const at of [end + 1000, end + 1001]) {
    assert.equal(isLaunchActive(at), false);
    for (const level of ALL_LEVELS) {
      assert.equal(launchDiscountCode(level, at), null);
      assert.equal(currentPrice(level, at), regularPrice(level));
      for (const language of ['en', 'de', 'fr']) assert.doesNotMatch(coursePriceLine(level, at, language), /launch price|Einführungspreis/i);
    }
    assert.equal(courseOffer('a1.1', at).price, '100.00');
    assert.equal('priceValidUntil' in courseOffer('a1.1', at), false);
  }
});

test('new purchases open exactly their own course, while historical A1.1 access remains', () => {
  assert.equal(full(account([purchase('course_a1_1')])), 'owned');
  assert.equal(full(account([purchase('course_a1_2')])), null);
  assert.equal(full(account([purchase('course_a1_2')]), 'a1.2'), 'owned');
  assert.equal(courseAccessReason(account([purchase('course_a1_2')]), 'b2.2', now, cutoff), null, 'the included AI window is not blanket course access');
  assert.equal(full(account([purchase('a1_exam_pack')])), null);
  const old = new Date(Date.parse(cutoff) - 1).toISOString();
  assert.equal(full(account([purchase('course_a1_2', old)])), 'owned');
  assert.equal(full(account([{ ...purchase('a1_exam_pack', old), access_until: old }])), 'owned');
  for (const created_at of [null, '', 'invalid', cutoff]) assert.equal(full(account([purchase('a1_exam_pack', created_at)])), null);
  assert.equal(full(account([], { profile: { created_at: '2026-11-01T00:00:00Z' } })), 'free');
  assert.equal(full(account([{ ...purchase('course_a1_1'), status: 'refunded' }])), null);
});

test('trial AI access never opens a paid course; existing recurring plans retain their policy', () => {
  const trial = account([], { profile: { created_at: cutoff, trial_started_at: cutoff, trial_ends_at: '2026-12-08', is_subscribed: false } });
  assert.equal(full(trial), null);
  assert.equal(courseAccessReason(trial, 'a1.2', now, cutoff), null);
  const recurring = (start) => account([], { subscription: { plan_type: 'monthly', status: 'active', subscription_start: start, subscription_end: '2027-02-01' } });
  assert.equal(full(recurring('2026-11-09')), 'pro');
  assert.equal(full(recurring('2026-11-09'), 'a1.2'), 'pro');
  assert.equal(full(recurring('2026-11-25')), 'pro');
  assert.equal(full(recurring('2026-11-25'), 'a1.2'), null);
  for (const key of ['a1_complete', 'all_access', 'course_a1', 'course_alle']) {
    assert.ok(courseForProduct(key));
    assert.equal(isProductOnSale(key), false);
  }
  for (const key of ['monthly', 'yearly', 'telc_b1_komplett']) assert.equal(isProductOnSale(key), false);
});

test('static prices use a durable no-JS fallback and date-aware enhancement, without former-price claims', () => {
  const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const display = read('astro-site/src/components/CoursePrice.astro');
  assert.match(display, /regularPrice\(level\)/);
  assert.match(display, /data-price-fallback/);
  assert.match(display, /<template data-build-price>/);
  const runtime = read('astro-site/src/lib/coursePriceDisplay.js');
  assert.match(runtime, /coursePriceLine\(node.dataset.coursePriceDisplay, Date.now\(\)/);
  assert.match(runtime, /courseOffer\(node.dataset.courseSchema, Date.now\(\)\)/);
  assert.match(runtime, /setTimeout/);
  for (const file of ['astro-site/src/pages/pricing.astro', 'astro-site/src/components/concept/Ladder.astro', 'astro-site/src/pages/courses/[level].astro', 'src/components/LockedContentOverlay.jsx']) {
    assert.doesNotMatch(read(file).replace(/Lektion 1 of A1\.1 is free/g, ''), /<s[ >]|<del[ >]|\bstatt\s+\d|\bwas\s+[€$]|A1\.1 (?:is |completely )?free/i, file);
  }
});

// Found live on 2026-11-28: the sign-up side panel, the About page and the trial-return card still
// called A1.1 "the free first course". Only Lektion 1 is free. The rule covers every screen, not
// the three lines: no rendered text may call a course free.
test('no screen calls a course free: only Lektion 1 of A1.1 is', () => {
  const FREE_COURSE = /free (?:first |A1\.1 |German )?course|whole course without|course (?:is|stays|remains) free|kostenlose[nr]? (?:ersten? )?Kurs|A1\.1 (?:is |stays |remains |completely |komplett )?(?:free|kostenlos)|free A1\.1/i;
  const strip = (source) => source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/ .*$/gm, '')
    .replace(/Lektion 1 of (?:the )?(?:A1\.1|\$\{[^}]+\})(?: course)? is free/gi, '');
  const found = [];
  for (const root of ['src/components', 'src/pages', 'astro-site/src/components', 'astro-site/src/pages', 'astro-site/src/layouts']) {
    for (const entry of readdirSync(new URL(`../${root}/`, import.meta.url), { recursive: true })) {
      const file = String(entry).replaceAll('\\', '/');
      if (!/\.(?:jsx|astro)$/.test(file)) continue;
      const text = strip(readFileSync(new URL(`../${root}/${file}`, import.meta.url), 'utf8'));
      const hit = text.match(FREE_COURSE);
      if (hit) found.push(`${root}/${file}: "${hit[0]}"`);
    }
  }
  assert.deepEqual(found, []);
});

test('checkout uses launch codes only in their window, preserves identity and refuses retired products', () => {
  const source = readFileSync(new URL('../src/config/lemonsqueezy.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace('export const', 'const').replaceAll('import.meta.env', 'env');
  const config = vm.runInNewContext(`${source}\nLEMONSQUEEZY_CONFIG;`, {
    ...pricing, env: {}, URLSearchParams, Date,
  });
  for (const [key, code] of [['course_a1_1', 'LAUNCH80'], ['course_a1_2', 'LAUNCH50']]) {
    const before = new URL(config.getCheckoutUrl('checkout-uuid', 'buyer@example.com', 'buyer-id', null, key, end));
    assert.equal(before.searchParams.get('checkout[discount_code]'), code);
    assert.equal(before.searchParams.get('checkout[custom][user_id]'), 'buyer-id');
    assert.equal(before.searchParams.get('checkout[custom][coupon]'), null, 'provider launch code is not an app-ledger coupon');
    const after = new URL(config.getCheckoutUrl('checkout-uuid', '', 'buyer-id', { code }, key, end + 1000));
    assert.equal(after.searchParams.has('checkout[discount_code]'), false);
  }
  assert.equal(config.getCheckoutUrl('', '', '', null, 'course_a1_1', end), null);
  for (const key of ['monthly', 'yearly', 'a1_complete', 'all_access', 'course_a2_1']) {
    assert.equal(config.getCheckoutUrl('stale-checkout', '', '', null, key, end), null, key);
  }
});

test('a static page left open across midnight updates both displayed price and executable course schema', () => {
  let clock = end - 1000;
  const price = { dataset: { coursePriceDisplay: 'a1.1', priceLanguage: 'de' }, textContent: 'durable fallback' };
  const schema = { dataset: { courseSchema: 'a1.1' }, textContent: JSON.stringify({ '@type': 'Course', name: 'German A1.1 Course' }) };
  const timers = [];
  const source = readFileSync(new URL('../astro-site/src/lib/coursePriceDisplay.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace('export function', 'function');
  vm.runInNewContext(`${source}\nenhanceCoursePrices();`, {
    ...pricing, Date: { now: () => clock, parse: Date.parse }, JSON,
    document: { querySelectorAll: (selector) => selector === '[data-course-price-display]' ? [price] : [schema], addEventListener() {} },
    window: { addEventListener() {} }, setTimeout: (callback) => timers.push(callback),
  });
  assert.match(price.textContent, /Einführungspreis/);
  assert.equal(JSON.parse(schema.textContent).offers.price, '20.00');
  clock = end + 1000;
  timers.shift()();
  assert.doesNotMatch(price.textContent, /Einführungspreis/);
  assert.equal(JSON.parse(schema.textContent).offers.price, '100.00');
  assert.equal(JSON.parse(schema.textContent).offers.priceValidUntil, undefined);
});

test('SPA price state schedules the exact deadline rather than waiting for a periodic refresh', () => {
  let clock = end - 1000;
  let displayedTime;
  const timers = [];
  const source = readFileSync(new URL('../src/components/CoursePrice.jsx', import.meta.url), 'utf8')
    .split('export default')[0].replace(/^import .*;\r?\n/gm, '').replace('export function', 'function');
  vm.runInNewContext(`${source}\nusePriceNow();`, {
    LAUNCH_ENDS_AT, Date: { now: () => clock, parse: Date.parse },
    useState: () => [clock, (value) => { displayedTime = value; }],
    useEffect: (effect) => effect(),
    window: { addEventListener() {}, removeEventListener() {} },
    document: { addEventListener() {}, removeEventListener() {} },
    setTimeout: (callback, delay) => timers.push({ callback, delay }), clearTimeout() {},
  });
  assert.equal(timers[0].delay, 2000);
  clock = end + 1000;
  timers.shift().callback();
  assert.equal(displayedTime, clock);
  assert.equal(currentPrice('a1.1', displayedTime), regularPrice('a1.1'));
  assert.equal(timers.length, 0);
});
