// offer_viewed means "at least half on screen" (src/data/events.js), and it is
// the denominator every offer conversion rate is judged by. The static site's
// observer (astro-site/src/lib/track.js) counted any entry with isIntersecting
// — and the first entry after observe(), like every hidden-to-visible change,
// arrives that way at ANY ratio — then stopped observing: a one-pixel sliver of
// a pricing card was a full impression (2026-10-25). An element taller than two
// viewports (the station line) can never show half of itself, so for it half
// the viewport counts; the thresholds re-check it as it scrolls.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TRACK = pathToFileURL(fileURLToPath(new URL('../astro-site/src/lib/track.js', import.meta.url))).href;

/** track.js against a consenting fake window with a controllable IntersectionObserver. */
async function loadTrack() {
  const store = new Map([['dm_cookie_consent', 'accepted']]);
  const calls = [];
  const observers = [];
  class FakeObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.observed = new Set();
      observers.push(this);
    }
    observe(el) { this.observed.add(el); }
    unobserve(el) { this.observed.delete(el); }
  }
  globalThis.window = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      key: (i) => [...store.keys()][i] ?? null,
      get length() { return store.size; },
    },
    location: { pathname: '/pricing/' },
    gtag: (...args) => calls.push(args),
    IntersectionObserver: FakeObserver,
  };
  globalThis.IntersectionObserver = FakeObserver;
  const mod = await import(`${TRACK}?v=${Math.random()}`);
  return { ...mod, calls, observers };
}

const element = (attrs) => ({
  attrs: { ...attrs },
  getAttribute(name) { return this.attrs[name] ?? null; },
  setAttribute(name, value) { this.attrs[name] = value; },
  addEventListener() {},
});

const entry = (target, ratio, visiblePx, viewportPx = 800) => ({
  target,
  isIntersecting: ratio > 0,
  intersectionRatio: ratio,
  intersectionRect: { height: visiblePx },
  rootBounds: { height: viewportPx },
});

test('halfOnScreen: half the element, or half the viewport for a very tall one', async () => {
  const { halfOnScreen } = await loadTrack();
  assert.equal(halfOnScreen(entry({}, 0.01, 4)), false, 'a sliver is not a view');
  assert.equal(halfOnScreen(entry({}, 0.49, 300)), false, 'just under half of a normal card');
  assert.equal(halfOnScreen(entry({}, 0.5, 300)), true, 'half of a normal card');
  assert.equal(halfOnScreen(entry({}, 0.3, 450)), true, 'a section 1,500 px tall with half the viewport on screen');
  assert.equal(halfOnScreen(entry({}, 0.1, 300)), false, 'a tall section with less than half the viewport on screen');
  assert.equal(halfOnScreen({ isIntersecting: false, intersectionRatio: 0.9 }), false);
  assert.equal(halfOnScreen(null), false);
});

test('autoTrack records an offer only once it is half on screen, and keeps watching until then', async () => {
  const { autoTrack, calls, observers, VIEW_THRESHOLDS } = await loadTrack();
  const card = element({ 'data-track-view': 'pricing_own' });
  const line = element({ 'data-track-view': 'line' });
  const views = [card, line];
  autoTrack({ querySelectorAll: (sel) => (sel.startsWith('[data-track-view]') ? views : []) });

  assert.equal(observers.length, 1);
  const io = observers[0];
  assert.deepEqual(io.options.threshold, VIEW_THRESHOLDS);
  assert.ok(VIEW_THRESHOLDS.includes(0.5) && VIEW_THRESHOLDS.some((t) => t > 0 && t < 0.5), 'thresholds below one half re-check tall elements');
  // Every element up to sixteen viewports tall crosses a threshold between V/(2H) and V/H.
  for (let viewports = 1; viewports <= 16; viewports += 1) {
    assert.ok(VIEW_THRESHOLDS.some((t) => t > 0 && t >= 1 / (2 * viewports) && t <= 1 / viewports), `no threshold judges an element ${viewports} viewports tall`);
  }

  const viewed = () => calls.filter(([, name]) => name === 'offer_viewed').map(([, , p]) => p.surface);

  io.callback([entry(card, 0.01, 4)]);
  assert.deepEqual(viewed(), [], 'a sliver of the card was recorded as a view');
  assert.ok(io.observed.has(card), 'the card stops being watched before it was ever half on screen');

  io.callback([entry(card, 0.6, 360)]);
  assert.deepEqual(viewed(), ['pricing_own']);
  assert.ok(!io.observed.has(card), 'a recorded card is no longer watched');

  io.callback([entry(line, 1 / 8, 300, 800)]);
  assert.deepEqual(viewed(), ['pricing_own'], 'the line at 300 of 800 px is under half the viewport');
  io.callback([entry(line, 1 / 4, 600, 800)]);
  assert.deepEqual(viewed(), ['pricing_own', 'line'], 'the line with 600 of 800 px on screen is a view');
});
