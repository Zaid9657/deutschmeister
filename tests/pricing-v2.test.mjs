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
import { levelLockSignupHref } from '../src/lib/lockDoor.js';
import { curriculumFor } from '../src/data/curricula/index.js';
import { stationFor } from '../src/data/offers.js';

const end = Date.parse(LAUNCH_ENDS_AT);
const cutoff = '2026-12-01T12:00:00Z';
const gate = '2026-11-22T11:30:00Z';
const now = Date.parse('2026-12-02T12:00:00Z');
const purchase = (key, created_at = cutoff) => ({ product_key: key, created_at, status: 'active', access_until: '2027-03-01T12:00:00Z' });
const account = (purchases = [], extra = {}) => ({ profile: { created_at: cutoff }, purchases, ...extra });
const full = (acc, level = 'a1.1') => fullCourseReason(acc, level, now, gate, cutoff);

const readScreen = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const screenSources = () => {
  const files = ['src/data/offers.js', 'astro-site/src/data/offers.js'];
  for (const root of ['src/components', 'src/pages', 'astro-site/src/components', 'astro-site/src/pages']) {
    for (const entry of readdirSync(new URL(`../${root}/`, import.meta.url), { recursive: true })) {
      const file = String(entry).replaceAll('\\', '/');
      if (/\.(?:jsx|js|astro)$/.test(file)) files.push(`${root}/${file}`);
    }
  }
  return files;
};
const withoutComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');

// Match the claim, not file names or line numbers. Management/cancellation copy does not
// promise access, so needs no exemption. Only an explicitly EXISTING subscriber's access
// sentence is exempt; a generic "your subscription opens ..." remains a regression.
const obsoleteAccessClaim = (source) => {
  const text = withoutComments(source)
    .replace(/\b(?:Existing subscribers|Existing subscriptions|Bestehende Abonnements)\b[^.!?\n]*[.!?]/gi, '')
    .replace(/\s+/g, ' ');
  const plan = '(?:subscription|Abonnement|Abo|AI Practice|Pro)';
  const course = '(?:course|Kurs|Lektion(?:en)?|lessons?|levels?|Stufen?|jede verlinkte Übung)';
  const lessons = '(?:course|Kurs|Lektion(?:en)?|lessons?)';
  const clause = '[^.;!?"\'`<>]{0,120}';
  const claimText = text.replace(/\b([AB][12])\.([12])\b/gi, '$1$2');
  return claimText.match(new RegExp([
    `\\b${lessons}\\b${clause}\\b(?:needs?|requires?|brauchen|benötigen)\\b${clause}\\b${plan}\\b`,
    `\\b${course}\\b${clause}\\b(?:open|opens|opened|unlocked|available|zugänglich|offen)\\b${clause}\\b(?:with|by|through|mit|durch) (?:a |an |ein )?${plan}\\b`,
    `\\b${plan}\\b${clause}(?:\\bopens?|\\bunlocks?|öffnet|\\bschaltet)\\b${clause}\\b${course}\\b`,
    '\\b(?:subscribe|abonnieren|Abo (?:ansehen|abschließen)|See the subscription|Upgrade for full access)\\b',
    '\\bAI Practice-Zugang[^;!?"\'`<>]{0,120}\\bdeckt jede verlinkte Übung ab',
    '\\b(?:every|all) levels? (?:is|are) open\\b',
  ].join('|'), 'i'));
};

test('no screen sells subscriptions or claims they open a course', () => {
  const found = screenSources().flatMap((file) => {
    const hit = obsoleteAccessClaim(readScreen(file));
    return hit ? [`${file}: ${hit[0]}`] : [];
  });
  assert.deepEqual(found, []);
});

test('course access copy guard rejects both languages and preserves explicit subscriber management', () => {
  for (const text of [
    'From Lektion 2 on you need a subscription.', 'Ab Lektion 2 brauchen Sie ein Abo.',
    'The later Lektionen open with AI Practice.', 'Pro unlocks every level.',
    'AI Practice opens the full A1.1 course.', 'Ein Abo öffnet den Kurs.',
    'AI speaking, writing feedback and every level are open until tomorrow.',
    'Dein AI Practice-Zugang bzw. dein A2-Kurs deckt jede verlinkte Übung ab;',
    'See the subscription', 'Abo ansehen', 'Subscribe to open the course', 'Subscribe',
  ]) assert.ok(obsoleteAccessClaim(text), text);
  for (const text of [
    'Existing subscribers keep their current course access.',
    'Manage or cancel your subscription', 'Your last subscription payment failed.',
    'One payment. No subscription.', 'Each course includes 90 days of AI tools.',
  ]) assert.equal(obsoleteAccessClaim(text), null, text);
});

test('signup pending purchase uses the current course price and launch label through the deadline', () => {
  const source = readScreen('src/pages/SignupPage.jsx');
  const helper = source.match(/const pendingPurchase = [\s\S]*?\n};/)[0];
  for (const key of ['course_a1_1', 'course_a1_2', 'a1_exam_pack']) {
    const pending = vm.runInNewContext(`${helper}\npendingPurchase;`, { ...pricing, peekBuyIntent: () => key, Date });
    for (const at of [end - 1000, end, end + 999, end + 1000]) {
      const result = pending(at);
      const level = LEVEL_COURSES[key]?.levels[0];
      assert.equal(result.price, level ? currentPrice(level, at) : OFFER_PRODUCTS[key].price, `${key} at ${at}`);
      assert.equal(result.priceLine, level ? coursePriceLine(level, at) : pricing.eur(OFFER_PRODUCTS[key].price));
      assert.equal(result.once, true);
    }
  }
  assert.match(source, /Then your checkout for[\s\S]*?\{purchase\.priceLine\}/);
  assert.match(source, /pendingPurchase\(priceNow\)/, 'an open signup page follows the same deadline clock as CoursePrice');
});

test('the course-home purchase button preserves this course for guests and signed-in learners', () => {
  const source = readScreen('src/pages/CurriculumHomePage.jsx');
  const props = source.match(/\{\.\.\.(\(user \? [\s\S]*?\))\}/)[1];
  for (const level of ['a1.1', 'a1.2']) {
    const course = LEVEL_COURSES[pricing.productKeyForLevel(level)];
    for (const user of [null, { id: 'buyer' }]) {
      const stored = {};
      const nextLesson = `/course/${level}/l/2`;
      const button = vm.runInNewContext(props, {
        user, course, level, nextLesson, levelLockSignupHref,
        setBuyIntent: (key) => { stored.dm_buy_intent = key; },
        setReturnPath: (path) => { stored.returnPath = path; },
      });
      if (user) {
        assert.equal(button.to, `/subscription?buy=${course.key}`);
        assert.equal(button.state.from.pathname, nextLesson);
      } else {
        assert.equal(button.href, levelLockSignupHref(level));
        button.onClick();
        assert.equal(stored.dm_buy_intent, course.key);
        assert.equal(stored.returnPath, nextLesson);
      }
    }
  }
  assert.match(source, /<CoursePrice level=\{level\} language=\{lang\}/);
  assert.match(source, /\{buyable && \(/, 'the button is available to guests whenever the course is on sale');
});

test('purchase features describe the selected course; recurring subscribers retain their reference grid', () => {
  const source = readScreen('src/pages/SubscriptionPage.jsx');
  const expression = source.match(/\{\((recurringBilling \? \[[\s\S]*?)\)\.map\(\(item, i\)/)[1];
  const selection = source.match(/const selectedCourse = [\s\S]*?;/)[0];
  for (const key of ['course_a1_1', 'course_a1_2']) {
    const levelCourses = Object.values(LEVEL_COURSES);
    const selectedCourse = vm.runInNewContext(`${selection}\nselectedCourse;`, {
      leadCourse: null, levelCourses, pendingProduct: null, searchParams: new URLSearchParams({ buy: key }),
    });
    assert.equal(selectedCourse.key, key);
    for (const isGerman of [false, true]) {
      const selectedCurriculum = curriculumFor(selectedCourse.levels[0]);
      const features = (recurringBilling) => vm.runInNewContext(expression, {
        recurringBilling, isGerman, selectedCourse, selectedCurriculum, LEVEL_COUNT: 8, READING_LESSON_COUNT: 66,
      });
      const text = JSON.stringify(features(false));
      assert.ok(text.includes(selectedCourse.code));
      assert.ok(text.includes(`${selectedCurriculum.lektionen.length} Lektionen`));
      assert.match(text, /[Cc]heckpoints/);
      assert.match(text, isGerman ? /Abschlusstest und Zertifikat/ : /Final test and certificate/);
      assert.ok(text.includes(String(selectedCourse.proDays)));
      assert.doesNotMatch(text, /8 Levels|8 Stufen|B2\.2/);
      assert.match(JSON.stringify(features(true)), /B2\.2/);
    }
  }
});

test('shared station price getters refresh rather than retaining a regular-price snapshot', () => {
  for (const level of ALL_LEVELS) {
    const station = stationFor(level);
    for (const [property, expected] of [['price', currentPrice], ['priceLabel', coursePriceLine]]) {
      const getter = Object.getOwnPropertyDescriptor(station, property).get;
      assert.equal(typeof getter, 'function');
      for (const at of [end, end + 1000]) {
        // Run the actual getter with a fixed helper clock: no mutation of global Date.
        const evaluated = vm.runInNewContext(`({ ${getter.toString()} }).${property}`, {
          course: LEVEL_COURSES[pricing.productKeyForLevel(level)], level,
          currentPrice: (l) => currentPrice(l, at), coursePriceLine: (l) => coursePriceLine(l, at),
        });
        assert.equal(evaluated, expected(level, at));
      }
    }
  }
});

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
  const FREE_COURSE = /free (?:first |A1\.1 |German |\$\{[^}]+\} )?course|whole course without|course (?:is|stays|remains) free|kostenlose[nr]? (?:ersten? )?Kurs|A1\.1 (?:is |stays |remains |completely |komplett )?(?:free|kostenlos)|free A1\.1/i;
  const strip = (source) => source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/ .*$/gm, '')
    .replace(/Lektion 1 of (?:the )?(?:A1\.1|\$\{[^}]+\})(?: course)? (?:is|stays|remains) free/gi, '');
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
