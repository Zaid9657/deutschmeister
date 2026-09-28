// Guard suite for the level-test signup door (docs/SCORECARD.md §3 #5c,
// src/lib/placement.js, 2026-09-28).
//
// The finding this closes: the homepage's primary button is "Find your level —
// free", and the test ends on "Sign up free — save my results". Nothing was
// saved — the result lived in React state, the link was /signup?level=B1.2 and
// SignupPage never read `level` — and the door carried no tag, so its signups
// were untraceable. The rules, not a list of links:
//
//   1. The result a signed-out tester SEES is kept on the browser, and the
//      first profile load after sign-in writes it — only into an account that
//      holds no placement yet, and only once.
//   2. The door is an attributed full-load link that public/attribution.js
//      (the one classifier, run as-is) files as level-test / onsite / level,
//      without ever overwriting a first touch.
//   3. The copy on that card derives its figures from marketing.js.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

import {
  PLACEMENT_KEY, PLACEMENT_MAX_AGE_DAYS, PLACEMENT_REF,
  normalizeSublevel, placementRecord, claimableLevel, settlePlacement, placementSignupHref,
  rememberPlacement, pendingPlacement, readStoredPlacement, forgetPlacement,
} from '../src/lib/placement.js';
import { placedSublevel } from '../src/lib/firstRun.js';
import { LEVEL_ORDER } from '../src/config/levels.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const NOW = Date.parse('2026-09-28T09:00:00Z');
const DAY = 86_400_000;
const rec = (level, ageDays = 0) => ({ level, at: new Date(NOW - ageDays * DAY).toISOString() });

/** Land on `href` with public/attribution.js as-is; returns the stored record. */
function land(href, { stored = null, referrer = 'https://deutsch-meister.de/level-test/' } = {}) {
  const url = new URL(href, 'https://deutsch-meister.de');
  const store = new Map();
  if (stored) store.set('dm_attribution', JSON.stringify(stored));
  const window = {
    localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) },
    location: { search: url.search, pathname: url.pathname },
  };
  const ctx = { window, document: { referrer }, URL, URLSearchParams, Date, JSON };
  vm.createContext(ctx);
  vm.runInContext(read('public/attribution.js'), ctx);
  return JSON.parse(store.get('dm_attribution') || 'null');
}

// ---------------------------------------------------------------------------
// 1. What counts as a placement, and when a stored one may be claimed
// ---------------------------------------------------------------------------

test('"placed" means the same here as in the first-run decision', () => {
  const inputs = [...LEVEL_ORDER, ...LEVEL_ORDER.map((l) => l.toLowerCase()), ' b1.2 ', 'a1', 'A1', 'b1', '', null, undefined, 'C1.1', 'a1.1.1'];
  for (const v of inputs) {
    assert.equal(normalizeSublevel(v) !== null, placedSublevel(v) !== null, `disagree on ${JSON.stringify(v)}`);
    if (normalizeSublevel(v)) assert.equal(normalizeSublevel(v).toLowerCase(), placedSublevel(v));
  }
  assert.equal(normalizeSublevel('b1.2'), 'B1.2', 'stored in the DB spelling (UPPERCASE)');
});

test('a record is claimable only while it is well-formed and recent', () => {
  assert.deepEqual(placementRecord('b2.1', NOW), { level: 'B2.1', at: new Date(NOW).toISOString() });
  assert.equal(placementRecord('a1', NOW), null, "the column default 'a1' is a band, not a result");
  assert.equal(claimableLevel(rec('B1.2', 0), NOW), 'B1.2');
  assert.equal(claimableLevel(rec('B1.2', PLACEMENT_MAX_AGE_DAYS - 1), NOW), 'B1.2');
  assert.equal(claimableLevel(rec('B1.2', PLACEMENT_MAX_AGE_DAYS + 1), NOW), null, 'expired');
  assert.equal(claimableLevel(rec('B1.2', -2), NOW), null, 'dated in the future');
  assert.equal(claimableLevel({ level: 'B1.2' }, NOW), null, 'no date');
  assert.equal(claimableLevel({ level: 'C2.1', at: new Date(NOW).toISOString() }, NOW), null, 'off the ladder');
  for (const junk of [null, undefined, 'B1.2', 42, []]) assert.equal(claimableLevel(junk, NOW), null);
});

test('settling never overwrites an existing placement and clears what it cannot claim', () => {
  assert.deepEqual(settlePlacement({ stored: null, currentLevel: 'a1', now: NOW }), { claim: null, forget: false }, 'nothing stored: no-op');
  assert.deepEqual(settlePlacement({ stored: rec('B1.2'), currentLevel: 'a1', now: NOW }), { claim: 'B1.2', forget: false }, 'fresh account');
  assert.deepEqual(settlePlacement({ stored: rec('B1.2'), currentLevel: null, now: NOW }), { claim: 'B1.2', forget: false }, 'no level at all');
  assert.deepEqual(settlePlacement({ stored: rec('B1.2'), currentLevel: 'A2.1', now: NOW }), { claim: null, forget: true }, 'server truth wins');
  assert.deepEqual(settlePlacement({ stored: rec('B1.2'), currentLevel: 'b1.2', now: NOW }), { claim: null, forget: true });
  assert.deepEqual(settlePlacement({ stored: rec('B1.2', 40), currentLevel: 'a1', now: NOW }), { claim: null, forget: true }, 'expired');
  assert.deepEqual(settlePlacement({ stored: { level: 'nope' }, currentLevel: 'a1', now: NOW }), { claim: null, forget: true }, 'malformed');
});

test('the browser store round-trips and never throws without storage', () => {
  const had = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const prev = globalThis.window;
  try {
    delete globalThis.window;
    assert.doesNotThrow(() => rememberPlacement('B1.2', NOW), 'no window: a no-op, not a throw');
    assert.equal(pendingPlacement(NOW), null);

    const store = new Map();
    globalThis.window = { localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    } };
    assert.equal(rememberPlacement('xx', NOW), false, 'an off-ladder value is not stored');
    assert.equal(store.size, 0);
    assert.equal(rememberPlacement('b1.2', NOW), true);
    assert.deepEqual(readStoredPlacement(), rec('B1.2'));
    assert.equal(JSON.parse(store.get(PLACEMENT_KEY)).level, 'B1.2');
    assert.equal(pendingPlacement(NOW), 'B1.2');
    forgetPlacement();
    assert.equal(pendingPlacement(NOW), null);

    globalThis.window = { get localStorage() { throw new Error('SecurityError'); } };
    assert.doesNotThrow(() => rememberPlacement('B1.2', NOW), 'blocked storage: a no-op, not a throw');
    assert.doesNotThrow(() => forgetPlacement());
    assert.equal(pendingPlacement(NOW), null);
  } finally {
    if (had) globalThis.window = prev; else delete globalThis.window;
  }
});

// ---------------------------------------------------------------------------
// 2. The door is attributed
// ---------------------------------------------------------------------------

test('the door is /signup (no trailing slash) and is filed as level-test / onsite / level', () => {
  const href = placementSignupHref('B1.2');
  const u = new URL(href, 'https://deutsch-meister.de');
  assert.equal(u.pathname, '/signup', 'rewrite-served SPA route: case 3, no slash');
  assert.equal(u.searchParams.get('ref'), PLACEMENT_REF);
  assert.equal(PLACEMENT_REF, 'level-test');

  const direct = land(href);
  assert.equal(direct.first.source, 'level-test', 'an untracked arrival converts on this page');
  assert.equal(direct.first.medium, 'onsite', 'a page, not a channel (not the bare-ref "social" default)');
  assert.equal(direct.first.content, 'b1.2');
  assert.equal(direct.last.source, 'level-test');

  const google = { source: 'google', medium: 'organic', landing: '/', at: '2026-09-28T08:00:00.000Z' };
  const fromSearch = land(href, { stored: { first: google, last: google } });
  assert.equal(fromSearch.first.source, 'google', 'first touch is never overwritten');
  assert.equal(fromSearch.last.source, 'level-test');

  assert.equal(new URL(placementSignupHref('nonsense'), 'https://x.test').searchParams.get('utm_content'), null);
});

// ---------------------------------------------------------------------------
// 3. The wiring: results screen, signup page, profile load
// ---------------------------------------------------------------------------

test('the results screen remembers a signed-out result and links the attributed door', () => {
  const src = read('src/components/LevelTest/LevelTestResults.jsx');
  assert.match(src, /if \(!user\) rememberPlacement\(finalSublevel\);/, 'signed-out only, and the level this screen shows');
  assert.match(src, /href=\{placementSignupHref\(finalSublevel\)\}/, 'a full-load link: a router <Link> would drop ?ref=');
  assert.doesNotMatch(src, /to=\{`\/signup/, 'no bare router door to signup');
  assert.doesNotMatch(src, /\/signup\?level=/, 'SignupPage never read ?level=');
  assert.match(src, /\{TRIAL_DAYS\} days/);
  assert.match(src, /\{TRIAL_SPEAKING_SESSIONS\} AI speaking sessions/);
  assert.doesNotMatch(src, /\b\d+ free AI speaking/, 'figures come from marketing.js, never retyped');
});

test('the signup page names the level it will save, and the profile load saves it before publishing', () => {
  const signup = read('src/pages/SignupPage.jsx');
  assert.match(signup, /useState\(\(\) => pendingPlacement\(\)\)/);
  assert.match(signup, /saved to your\s+account the first time you sign in on this browser/);

  const ctx = read('src/contexts/SubscriptionContext.jsx');
  const settle = ctx.indexOf('currentProfile = await settlePendingPlacement(user.id, currentProfile);');
  const publish = ctx.indexOf('setProfile(currentProfile);');
  assert.ok(settle > 0 && publish > settle, 'settled before the profile is published, so first renders read the placed level');

  const svc = read('src/services/placementService.js');
  const write = svc.indexOf(".update({ current_level: claim");
  const check = svc.indexOf('if (error) {', write);
  const clear = svc.lastIndexOf('forgetPlacement();');
  assert.ok(write > 0 && check > write && clear > check, 'the store is cleared only after the write succeeded');
  assert.ok(!svc.slice(write, check).includes('forgetPlacement'), 'never cleared before the write result is read');
  assert.match(svc, /if \(error\) \{[\s\S]*?return profile;/, 'a failed write keeps the local result for the next load');
});
