import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { OFFER_PRODUCTS, ALL_LEVELS, SELLABLE_EXAM_PROGRAMMES, LEGACY_LEVEL_COURSES, levelsForProduct, courseForProduct, examsForProduct, ownsExamProgramme, ownsProduct, hasExamPracticeAccess } from '../src/data/pricing.js';
import { checkoutProductKey, ownsCheckoutProduct, checkoutEntitlementConfirmed } from '../src/lib/checkoutAccess.js';
import { courseAccessReason } from '../src/lib/levelEntitlement.js';
import { productInfo } from '../netlify/functions/_shared/pricing.mjs';
import { PROGRAM } from '../src/data/programs/startDeutsch1.js';
import { goetheA1Mock } from '../src/data/mockExams/goetheA1.js';
import { examCounts, examDays } from '../astro-site/src/data/examPack.js';
import { buyButton, door, FakeElement, runCourseCheckout, loadLevelAccess } from './helpers/courseCheckoutHarness.mjs';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const active = (product_key) => ({ product_key, status: 'active', access_until: '2026-01-01T00:00:00Z' });
const now = Date.parse('2027-01-01T00:00:00Z');
const snapshot = (purchases) => ({ signedIn: true, verified: true, userId: 'learner', purchases, profile: {}, subscription: null });

test('the three approved prices/windows resolve throughout checkout and server course ownership', () => {
  for (const [key, price, days, months, levels] of [
    ['a1_exam_pack', 59, 60, 2, []], ['a1_complete', 89, 180, 6, ['a1.2']], ['all_access', 199, 365, 12, ALL_LEVELS],
  ]) {
    const p = OFFER_PRODUCTS[key];
    assert.equal(p.price, price); assert.equal(p.proDays, days); assert.equal(p.proMonths, months);
    assert.equal(courseForProduct(key), p); assert.deepEqual(levelsForProduct(key), levels);
    assert.deepEqual(productInfo(key).levels, levels);
    assert.equal(checkoutProductKey(key), key);
    assert.equal(checkoutEntitlementConfirmed(key, { purchases: [active(key)] }), true);
    assert.equal(checkoutEntitlementConfirmed(key, { purchases: [{ ...active(key), status: 'refunded' }] }), false);
  }
});

test('exam rights survive AI expiry, include no extra paid level or course final test, and refunds close them', () => {
  for (const key of Object.keys(OFFER_PRODUCTS)) {
    const purchases = [active(key)];
    assert.equal(ownsExamProgramme(purchases, 'start-deutsch-1'), true);
    assert.equal(ownsExamProgramme(purchases, 'telc-b1'), false, 'the pilot is off sale');
    assert.equal(ownsExamProgramme(purchases, 'abschlusstest-a1-2'), false, 'a final course test is not an exam pack');
    assert.equal(ownsExamProgramme([{ ...active(key), status: 'refunded' }], 'start-deutsch-1'), false);
    for (const level of ALL_LEVELS.filter((l) => l !== 'a1.1')) {
      assert.equal(courseAccessReason(snapshot(purchases), level, now), OFFER_PRODUCTS[key].levels.includes(level) ? 'owned' : null, `${key}: ${level} after AI expiry`);
    }
  }
  assert.equal(hasExamPracticeAccess([active('a1_exam_pack')], 'A1.2'), true);
  assert.equal(hasExamPracticeAccess([active('a1_exam_pack')], 'a2.1'), false);
  const guard = read('src/components/LevelSubscriptionGuard.jsx');
  assert.match(guard, /reading\|listening/);
  assert.match(read('src/App.jsx'), /path="\/start-deutsch-1-kurs"[\s\S]*?<LevelSubscriptionGuard level="a1.2" programme="start-deutsch-1">/);
  assert.doesNotMatch(read('src/App.jsx').split('path="/a1-2-phase"')[1].split('</Route>')[0].split('</LevelSubscriptionGuard>')[0], /programme=/);
  const source = read('src/components/ExamSubscriptionGuard.jsx');
  const expression = source.match(/const canOpen = ([^;]+);/)[1];
  for (const examSlug of ['start-deutsch-1', 'abschlusstest-a1-2', 'telc-b1', 'no-such-exam']) {
    const result = vm.runInNewContext(expression, { examAccess: false, ownsExamProgramme, purchases: [active('a1_exam_pack')], examSlug });
    assert.equal(result, examSlug === 'start-deutsch-1');
  }
});

test('Pass automatically follows released level and on-sale exam registries; legacy buyers keep their rights', () => {
  ALL_LEVELS.push('future-level'); SELLABLE_EXAM_PROGRAMMES.push('future-exam');
  try {
    assert.ok(levelsForProduct('all_access').includes('future-level'));
    assert.ok(examsForProduct('all_access').includes('future-exam'));
    assert.equal(ownsExamProgramme([active('all_access')], 'future-exam'), true);
    assert.equal(ownsExamProgramme([active('a1_complete')], 'future-exam'), false);
  } finally { ALL_LEVELS.pop(); SELLABLE_EXAM_PROGRAMMES.pop(); }
  for (const [key, product] of Object.entries(LEGACY_LEVEL_COURSES)) {
    assert.deepEqual(levelsForProduct(key), product.levels);
    assert.equal(ownsExamProgramme([active(key)], 'start-deutsch-1'), false);
  }
});

test('bundle ownership requires the exam pack too, and a legacy all-level purchase never implies the Pass', () => {
  assert.equal(ownsProduct('a1_complete', [active('course_a1_2')]), false);
  assert.equal(ownsProduct('all_access', [active('course_alle')]), false);
  assert.equal(ownsProduct('a1_complete', [active('course_a1_2'), active('a1_exam_pack')]), true);
  assert.equal(ownsProduct('a1_exam_pack', [active('a1_complete')]), true);
  for (const key of ['a1_exam_pack', 'a1_complete', 'course_a1_2']) assert.equal(ownsCheckoutProduct(key, [active('all_access')]), true);
  const lib = loadLevelAccess();
  for (const p of Object.values(OFFER_PRODUCTS)) {
    assert.equal(lib.ownedProductHome(snapshot([active(p.key)]), p.key), `https://deutsch-meister.de${p.home}`);
    assert.equal(lib.ownedProductHome(snapshot([active('course_alle')]), p.key), null);
  }
});

test('static product doors protect owners before load and at click time, and signed-out buyers retain intent', async () => {
  for (const p of Object.values(OFFER_PRODUCTS)) {
    const buy = buyButton(p.key);
    const wrapper = door(p.key, [buy], { 'data-course-product': p.key });
    const body = new FakeElement('body', {}, [wrapper]);
    const page = runCourseCheckout({ body, snapshot: snapshot([active(p.key)]) });
    assert.equal(buy.disabled, true);
    await page.settle();
    assert.equal(wrapper.children[0].href, `https://deutsch-meister.de${p.home}`);
    await buy.click();
    assert.equal(page.opened.length, 0);
    assert.equal(page.location.href, `https://deutsch-meister.de${p.home}`);
    const guestBuy = buyButton(p.key);
    const guest = runCourseCheckout({ body: new FakeElement('body', {}, [guestBuy]), signedIn: false });
    await guest.settle(); await guestBuy.click();
    assert.equal(guest.stored.get('dm_buy_intent'), p.key);
    assert.equal(guest.location.href, 'https://deutsch-meister.de/signup');
  }
});

test('new offer checkout ids fail closed; public routes enter the manifest and sitemap filter', () => {
  const astro = read('astro-site/src/lib/courseVariants.js'); const spa = read('src/config/lemonsqueezy.js');
  for (const p of Object.values(OFFER_PRODUCTS)) {
    const envKey = p.key.toUpperCase();
    assert.ok(astro.includes(`import.meta.env.PUBLIC_LEMONSQUEEZY_${envKey}_VARIANT_ID || ''`));
    assert.ok(spa.includes(`import.meta.env.VITE_LEMONSQUEEZY_${envKey}_VARIANT_ID || ''`));
    assert.ok(existsSync(new URL(`../astro-site/src/pages/courses/${p.slug}.astro`, import.meta.url)));
    assert.ok(read('scripts/check-built-html.mjs').includes(`courses/${p.slug}/index.html`));
    assert.ok(read('src/pages/SubscriptionPage.jsx').includes('LEMONSQUEEZY_CONFIG.offerProducts[key]'));
  }
  const doorSource = read('astro-site/src/components/concept/ProductDoor.astro');
  assert.match(doorSource, /product.variantId \? <button/); assert.match(doorSource, /Not on sale yet/);
  assert.match(read('astro-site/astro.config.mjs'), /page.includes\('\/courses\/'\)/);
});

test('published counts derive from scheduled programme items and all offer copy labels future releases and short tests', () => {
  const days = PROGRAM.weeks.flatMap((w) => w.days); const items = days.flatMap((d) => d.items);
  assert.equal(examDays.length, days.length);
  for (const [type, count] of Object.entries(examCounts)) assert.equal(count, items.filter((i) => i.type === type).length);
  const page = read('astro-site/src/components/concept/OfferPage.astro');
  assert.match(page, /as released/); assert.match(page, /Coming next, included when released/);
  assert.match(page, /A1 practice test \(short version\)/);
  assert.doesNotMatch(page, /full exam|most popular|\d+ (learners|customers)|guarantee/i);
  assert.match(page, /examCounts\.lesson/); assert.match(page, /examCounts\.speaking/);
  assert.match(read('astro-site/src/pages/pricing.astro'), /let cycle = 'yearly'/);
  const offers = read('astro-site/src/components/concept/Offers.astro');
  assert.ok(offers.indexOf('PLANS.yearly.price') < offers.indexOf('PLANS.monthly.price'));
  assert.match(read('src/pages/SubscriptionSuccessPage.jsx'), /courseBought\?\.proMonths \|\| COURSE_PRO_MONTHS/);
});

test('A1 mock writing instructions and prompts address the learner as Sie', () => {
  const writing = goetheA1Mock.sections.find((s) => s.key === 'schreiben');
  for (const text of [writing.instructions, ...writing.parts.map((p) => p.task)]) {
    assert.match(text, /Sie/); assert.doesNotMatch(text, /\b(du|deine[nmrs]?|dich|trag|schreib|füll|nutze|Sag)\b/i);
  }
});
