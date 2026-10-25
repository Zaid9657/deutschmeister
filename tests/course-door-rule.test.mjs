// Guard: a signed-in owner can never buy the same lifetime course again from a
// static page (ACC-16, cross-check 2026-10-25).
//
// Two holes, one class:
//   1. The homepage's "Where do you get on?" chooser rendered its Buy button
//      without the data-course-door wrapper every other level-course Buy has,
//      so CourseCheckout's owner swap never reached it: an A1.2 owner kept a
//      working "Buy A1.2" (the live #fit section had three Buy buttons, 0 doors).
//   2. CourseCheckout's open() checked only for a session, and the doors swap
//      only after an async lookup, so any Buy clicked before it landed opened
//      Lemon Squeezy. The webhook dedupes by order id only, so the owner paid twice.
//
// The rules: every level-course Buy in astro-site sits inside an open
// data-course-door element; for a signed-in visitor, Buy waits (disabled,
// aria-busy) until the lookup lands; and the click checks ownership again (the
// SPA's ownsCheckoutProduct rule: the exact product, a retired band or the
// bundle) and sends an owner to the course. An unanswerable lookup goes to the
// app's /subscription?buy= resume, which checks before any checkout.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { buyButton, door, FakeElement, runCourseCheckout } from './helpers/courseCheckoutHarness.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// The one data-course-variant surface that sells a product with no level: the
// telc course page. The click-time ownership check covers it instead.
const NO_LEVEL_SURFACES = new Set(['astro-site/src/pages/telc-b1-komplettvorbereitung.astro']);

const astroFiles = () => {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (entry.name.endsWith('.astro')) out.push(rel);
    }
  };
  walk('astro-site/src');
  return out;
};

/** The template of an .astro file (after its frontmatter), comments out. */
const template = (src) => {
  const body = src.startsWith('---') ? src.slice(src.indexOf('---', 3) + 3) : src;
  return body.replace(/<!--[\s\S]*?-->/g, ' ').replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');
};

/** Is the element at `index` inside a still-open <div|span data-course-door> ? */
export function insideDoor(src, index) {
  let last = null;
  for (const m of src.slice(0, index).matchAll(/<(div|span)\b[^>]*?\bdata-course-door=/g)) last = m;
  if (!last) return false;
  let depth = 1;
  const between = src.slice(last.index + 1, index);
  for (const m of between.matchAll(new RegExp(`<(/?)${last[1]}\\b[^>]*?(/?)>`, 'g'))) {
    if (m[1]) depth--;
    else if (!m[2]) depth++;
    if (depth === 0) return false;
  }
  return true;
}

test('the door detector sees open and closed doors (not vacuous)', () => {
  assert.equal(insideDoor('<span data-course-door={l}><button data-course-variant={v}>', 50), true);
  const closed = '<div data-course-door={l}><a>x</a></div><button data-course-variant={v}>';
  assert.equal(insideDoor(closed, closed.indexOf('<button')), false);
  const nested = '<div data-course-door={l}><div class="x"></div><button data-course-variant={v}>';
  assert.equal(insideDoor(nested, nested.indexOf('<button')), true);
  const bare = '<div class="y"><button data-course-variant={v}>';
  assert.equal(insideDoor(bare, bare.indexOf('<button')), false);
});

test('every level-course Buy on a static page sits inside a data-course-door', () => {
  const checked = [];
  const offenders = [];
  for (const file of astroFiles()) {
    if (NO_LEVEL_SURFACES.has(file)) continue;
    const src = template(read(file));
    for (const m of src.matchAll(/data-course-variant=/g)) {
      checked.push(file);
      if (!insideDoor(src, m.index)) offenders.push(`${file}:${src.slice(0, m.index).split('\n').length}`);
    }
  }
  for (const surface of ['LineSection.astro', 'FitChooser.astro', 'Ticket.astro', 'courses/[level].astro', 'courses/index.astro', 'pricing.astro']) {
    assert.ok(checked.some((f) => f.endsWith(surface)), `no Buy found on ${surface}: the scan is not reading it`);
  }
  assert.deepEqual(offenders, [], `level-course Buy buttons without an owner door:\n  ${offenders.join('\n  ')}`);
});

const OWNER_A12 = { signedIn: true, verified: true, profile: { is_subscribed: false, trial_ends_at: null }, purchases: [{ product_key: 'course_a1_2' }] };
const NOBODY = { signedIn: true, verified: true, profile: { is_subscribed: false, trial_ends_at: null }, purchases: [] };

test('a click before the lookup lands cannot open a checkout: Buy waits, aria-busy', async () => {
  let release;
  const gate = new Promise((done) => { release = done; });
  const buy = buyButton('course_a1_2');
  const body = new FakeElement('body', {}, [door('a1.2', [buy])]);
  const page = runCourseCheckout({ body, snapshot: OWNER_A12, gate });
  assert.equal(buy.disabled, true, 'Buy is disabled while the lookup runs');
  assert.equal(buy.getAttribute('aria-busy'), 'true');
  release();
  await page.settle();
  assert.equal(page.opened.length, 0);
  assert.match(body.children[0].innerHTML, /Continue course A1\.2/, 'the owner door swapped once the lookup landed');
});

test('an owner who clicks Buy goes to the course, never to a second checkout', async () => {
  for (const [purchase, product, home] of [
    ['course_a1_2', 'course_a1_2', 'https://deutsch-meister.de/course/a1.2'],
    ['course_a1', 'course_a1_2', 'https://deutsch-meister.de/course/a1.2'],
    ['course_alle', 'course_a2_1', 'https://deutsch-meister.de/course/a2.1'],
    ['telc_b1_komplett', 'telc_b1_komplett', 'https://deutsch-meister.de/telc-b1-kurs'],
  ]) {
    const buy = buyButton(product);
    const body = new FakeElement('body', {}, [buy]); // no door: the click itself must hold
    const page = runCourseCheckout({ body, snapshot: { ...NOBODY, purchases: [{ product_key: purchase }] } });
    await page.settle();
    await buy.click();
    assert.equal(page.opened.length, 0, `${purchase} owns ${product}`);
    assert.equal(page.location.href, home, `${purchase} continues in the course`);
  }
});

test('a visitor who does not own the course still gets the checkout', async () => {
  const buy = buyButton('course_a2_1');
  const body = new FakeElement('body', {}, [buy]);
  const page = runCourseCheckout({ body, snapshot: { ...NOBODY, purchases: [{ product_key: 'course_a1_2' }] } });
  await page.settle();
  assert.equal(buy.disabled, false, 'Buy is enabled once the lookup has landed');
  assert.equal(buy.getAttribute('aria-busy'), null);
  await buy.click();
  assert.equal(page.opened.length, 1);
  assert.match(page.opened[0], /\/checkout\/buy\/v-course_a2_1\?/);
  assert.match(page.stored.get('session:dm_checkout_pending'), /course_a2_1/);
});

test('an unanswerable lookup sends the click to the app\'s resume, which checks ownership first', async () => {
  for (const snapshot of [null, new Error('network'), { ...NOBODY, verified: false }, { ...NOBODY, signedIn: false }]) {
    const buy = buyButton('course_a1_2');
    const body = new FakeElement('body', {}, [buy]);
    const page = runCourseCheckout({ body, snapshot });
    await page.settle();
    assert.equal(buy.disabled, false, 'a failed lookup never leaves Buy dead');
    await buy.click();
    assert.equal(page.opened.length, 0, String(snapshot && (snapshot.message || JSON.stringify(snapshot))));
    assert.equal(page.location.href, 'https://deutsch-meister.de/subscription?buy=course_a1_2');
  }
  // That resume applies ownsCheckoutProduct before opening anything (tests/checkout-access.test.mjs).
  assert.match(read('src/pages/SubscriptionPage.jsx'), /if \(target\?\.comingSoon \|\| ownsCheckoutProduct\(key, purchases\)\) return;/);
});

test('a signed-out visitor still takes the signup detour with the intent stored', async () => {
  const buy = buyButton('course_a1_2');
  const body = new FakeElement('body', {}, [door('a1.2', [buy])]);
  const page = runCourseCheckout({ body, signedIn: false, snapshot: OWNER_A12 });
  assert.equal(buy.disabled, false, 'no lookup for a signed-out visitor');
  await buy.click();
  assert.equal(page.location.href, 'https://deutsch-meister.de/signup');
  assert.equal(page.stored.get('dm_buy_intent'), 'course_a1_2');
  assert.equal(page.opened.length, 0);
});
