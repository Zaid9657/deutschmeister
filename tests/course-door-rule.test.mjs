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

// Cross-check follow-up: Buy waits for the lookup, and the auth, profile and
// purchases reads had no timeout, so one stalled request kept every Buy on the
// page disabled, and with it the guarded fallback. The lookup is bounded: after
// a few seconds the answer is "unknown", Buy comes back, and its click takes
// the app's /subscription?buy= resume, which re-checks ownership.
test('a stalled lookup cannot hold Buy: after a few seconds it returns and a click takes the guarded resume', async () => {
  const stalled = new Promise(() => {}); // the lookup never answers
  const buy = buyButton('course_a1_2');
  const body = new FakeElement('body', {}, [door('a1.2', [buy])]);
  const page = runCourseCheckout({ body, snapshot: OWNER_A12, gate: stalled });
  assert.equal(buy.disabled, true, 'Buy waits while the lookup runs');
  const delays = page.pendingTimers();
  assert.equal(delays.length, 1, 'the lookup is bounded by a timer');
  assert.ok(delays[0] >= 2000 && delays[0] <= 6000, `the bound is a few seconds, not ${delays[0]} ms`);
  page.runTimers(); // the bound passes
  await page.flush();
  assert.equal(buy.disabled, false, 'Buy is back after the bound');
  assert.equal(buy.getAttribute('aria-busy'), null);
  assert.equal(body.children[0].innerHTML, null, 'an unknown answer swaps no door');
  const clicked = buy.click(); // the click reads ownership again, bounded the same way
  await page.flush();
  assert.equal(page.pendingTimers().length, 1, 'the click\'s read is bounded too');
  page.runTimers();
  await clicked;
  assert.equal(page.opened.length, 0, 'an unknown answer opens no checkout');
  assert.equal(page.location.href, 'https://deutsch-meister.de/subscription?buy=course_a1_2');
});

test('a lookup that answers in time clears its timer', async () => {
  const buy = buyButton('course_a2_1');
  const page = runCourseCheckout({ body: new FakeElement('body', {}, [buy]), snapshot: OWNER_A12 });
  await page.settle();
  assert.deepEqual(page.pendingTimers(), [], 'no timer left running');
  assert.equal(buy.disabled, false);
});

// Integration review (2026-10-25): the click reused the page's first snapshot.
// Open an offer page as A (who owns nothing), sign in as B (who owns A1.2) in
// another tab, press Buy: the checkout opened with B's identity and A's
// ownership, a second purchase of B's own course. A snapshot belongs to one
// account; the click reads ownership again for the account signed in now and
// checks that account again after the read.
const SNAPSHOTS = {
  A: { signedIn: true, verified: true, userId: 'A', profile: null, purchases: [] },
  B: { signedIn: true, verified: true, userId: 'B', profile: null, purchases: [{ product_key: 'course_a1_2' }] },
};

test('A opens the page, B signs in elsewhere, Buy: ownership is B\'s, so no second checkout', async () => {
  const buy = buyButton('course_a1_2');
  const page = runCourseCheckout({ body: new FakeElement('body', {}, [buy]), user: 'A', snapshot: (id) => SNAPSHOTS[id] });
  await page.settle();
  assert.equal(page.snapshotCalls, 1, 'the page read A once');
  page.signIn('B'); // another tab signs in as B, who owns A1.2
  await buy.click();
  assert.equal(page.opened.length, 0, 'no checkout for a course B owns');
  assert.equal(page.location.href, 'https://deutsch-meister.de/course/a1.2', 'B continues in the course');
  assert.equal(page.snapshotCalls, 2, 'ownership was read again, for B');
});

test('B signs in elsewhere and does not own the course: the checkout opens for B, from B\'s own snapshot', async () => {
  const buy = buyButton('course_a2_1');
  const page = runCourseCheckout({ body: new FakeElement('body', {}, [buy]), user: 'A', snapshot: (id) => SNAPSHOTS[id] });
  await page.settle();
  page.signIn('B');
  await buy.click();
  assert.equal(page.opened.length, 1);
  assert.match(page.opened[0], /checkout%5Bcustom%5D%5Buser_id%5D=B\b/, 'the checkout carries the account that was checked');
});

test('a snapshot that answers for another account than the one signed in never opens a checkout', async () => {
  // The page's client still holds A's session while the stored session says B.
  const buy = buyButton('course_a1_2');
  const page = runCourseCheckout({ body: new FakeElement('body', {}, [buy]), user: 'A', snapshot: () => SNAPSHOTS.A });
  await page.settle();
  page.signIn('B');
  await buy.click();
  assert.equal(page.opened.length, 0);
  assert.equal(page.location.href, 'https://deutsch-meister.de/subscription?buy=course_a1_2', 'the app resolves who is signed in');
});

test('an account switch while the click waits for its read sends it to the guarded resume', async () => {
  let release;
  const gate = new Promise((done) => { release = done; });
  const buy = buyButton('course_a2_1');
  const page = runCourseCheckout({ body: new FakeElement('body', {}, [buy]), user: 'A', snapshot: (id) => SNAPSHOTS[id], gate });
  buy.disabled = false; // a click that races the page's first read
  const clicked = buy.click();
  page.signIn('B'); // during the read
  release();
  await clicked;
  assert.equal(page.opened.length, 0, 'A\'s answer is not used for B');
  assert.equal(page.location.href, 'https://deutsch-meister.de/subscription?buy=course_a2_1');
});

test('the doors show only the snapshot of the account still signed in', async () => {
  let release;
  const gate = new Promise((done) => { release = done; });
  const a12 = door('a1.2', [buyButton('course_a1_2')]);
  const page = runCourseCheckout({ body: new FakeElement('body', {}, [a12]), user: 'B', snapshot: (id) => SNAPSHOTS[id], gate });
  await page.flush(); // the read starts for B
  page.signIn('A'); // B (an owner) signed out and A signed in before B's answer came back
  release();
  await page.settle();
  assert.equal(a12.innerHTML, null, 'B\'s ownership is not shown to A');
  assert.ok(a12.querySelector('[data-course-variant]'), 'A keeps Buy');
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
