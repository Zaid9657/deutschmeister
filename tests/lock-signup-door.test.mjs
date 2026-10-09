// A signup that starts at a paywall can be counted.
//
// The signed-out level lock (LockedContentOverlay) is the SPA's one signed-out
// paywall with a signup button, and until 2026-10-08 that button was a router
// <Link> to a bare /signup. public/attribution.js records a tag only on a page
// load, so a lock signup was filed under whatever had brought the visitor, or
// as untracked. The lock's own signups could not be counted, and three lock
// changes in a week (#175, #179, #197) were guarded on all signups a day.
//
// The rule walks the SPA source, so a paywall written tomorrow is covered:
//   1. The lock's door (src/lib/lockDoor.js) is /signup with ref=level-lock,
//      utm_medium=onsite and the locked level, per CLAUDE.md case 3.
//   2. public/attribution.js, run as-is, files it as level-lock / onsite and
//      never overwrites an earlier first touch.
//   3. A paywall (any component that calls trackPaywallShown) reaches /signup
//      only through a door helper, as a plain href. A '/signup' literal or a
//      router `to=` signup door in a paywall fails; a helper this suite does
//      not know fails too: add it to DOOR_HELPERS rather than loosening this.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

import { LEVEL_LOCK_REF, levelLockSignupHref } from '../src/lib/lockDoor.js';
import { ALL_LEVELS } from '../src/data/pricing.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const ORIGIN = 'https://deutsch-meister.de';

/** Land on `href` with public/attribution.js as-is; returns the stored record. */
function land(href, { stored = null, referrer = `${ORIGIN}/level/b1.1` } = {}) {
  const url = new URL(href, ORIGIN);
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

// Door helpers a paywall may use for /signup, with the tag each must carry.
const DOOR_HELPERS = {
  levelLockSignupHref: { fn: levelLockSignupHref, ref: LEVEL_LOCK_REF },
};

const jsxFiles = () => {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (entry.name.endsWith('.jsx')) out.push(rel);
    }
  };
  walk('src');
  return out;
};

/** Source minus comments: a comment that quotes a link is not a link. */
const code = (src) =>
  src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');

// <Link|NavLink|Button|a …to= or href=…>. Attribute values may hold one level
// of braces ({{ from: location }}, {`…${x}…`}).
const ELEMENT = /<(Link|NavLink|Button|a)\b((?:[^>{]|\{(?:[^{}]|\{[^{}]*\})*\})*?)>/g;
const DESTINATION = /\b(to|href)=(?:"([^"]*)"|\{`([^`]*)`\}|\{([^}]*)\})/;
const SIGNUP_LITERAL = /(['"`])\/signup\b/;

/** A paywall is a component that reports paywall_shown. */
const paywalls = () => jsxFiles().filter((f) => /\btrackPaywallShown\s*\(/.test(code(read(f))));

/** Every link in `src` whose destination names a signup door. */
function signupDoors(src) {
  const doors = [];
  for (const m of src.matchAll(ELEMENT)) {
    const d = m[2].match(DESTINATION);
    if (!d) continue;
    const [, attr, plain, tpl, expr] = d;
    const value = plain ?? tpl ?? expr.trim();
    if (!/signup/i.test(value)) continue;
    doors.push({ element: m[1], attr, value, literal: expr === undefined });
  }
  return doors;
}

test('the lock door is /signup tagged ref=level-lock, onsite, with the locked level', () => {
  for (const level of ALL_LEVELS) {
    for (const input of [level, level.toUpperCase(), ` ${level} `]) {
      const u = new URL(levelLockSignupHref(input), ORIGIN);
      assert.equal(u.pathname, '/signup', 'a rewrite-served SPA route has no trailing slash (CLAUDE.md case 3)');
      assert.equal(u.searchParams.get('ref'), LEVEL_LOCK_REF);
      assert.equal(u.searchParams.get('utm_medium'), 'onsite', 'a bare ?ref= is filed as "social"');
      assert.equal(u.searchParams.get('utm_content'), level, `${JSON.stringify(input)}: the locked level, lowercase`);
      assert.deepEqual([...u.searchParams.keys()].sort(), ['ref', 'utm_content', 'utm_medium']);
    }
  }
  // An unknown level is left out of the tag, never passed through.
  for (const junk of [undefined, null, '', 'a1', 'c1.1', 'b1.1/../x', '<b1.1>']) {
    const u = new URL(levelLockSignupHref(junk), ORIGIN);
    assert.equal(u.searchParams.get('utm_content'), null, JSON.stringify(junk));
    assert.equal(u.searchParams.get('ref'), LEVEL_LOCK_REF);
  }
  assert.equal(LEVEL_LOCK_REF, 'level-lock');
});

test('attribution.js files a lock signup as level-lock / onsite and keeps an earlier first touch', () => {
  const href = levelLockSignupHref('b1.1');
  const fresh = land(href);
  assert.equal(fresh.first.source, LEVEL_LOCK_REF);
  assert.equal(fresh.first.medium, 'onsite');
  assert.equal(fresh.first.content, 'b1.1');
  assert.equal(fresh.first.landing, '/signup');
  assert.equal(fresh.first.referrer, null, 'our own host is never a referrer');
  assert.equal(fresh.last.source, LEVEL_LOCK_REF);

  const googler = land(href, {
    stored: { first: { source: 'google', medium: 'organic', landing: '/grammar/b1.1/' }, last: { source: 'google', medium: 'organic' } },
  });
  assert.equal(googler.first.source, 'google', 'first touch is never overwritten');
  assert.equal(googler.first.landing, '/grammar/b1.1/');
  assert.equal(googler.last.source, LEVEL_LOCK_REF);
  assert.equal(googler.last.medium, 'onsite');

  // The router link the lock used to have: no page load, so nothing to record.
  assert.equal(land('/signup'), null, 'a bare /signup records nothing');
});

test('the pattern finds the door it was written for and leaves other links alone', () => {
  const old = signupDoors('<Button to="/signup" shimmer size="lg" className="w-full">');
  assert.deepEqual(old, [{ element: 'Button', attr: 'to', value: '/signup', literal: true }]);
  const now = signupDoors('<Button href={levelLockSignupHref(level)} shimmer size="lg" className="w-full">');
  assert.deepEqual(now, [{ element: 'Button', attr: 'href', value: 'levelLockSignupHref(level)', literal: false }]);
  assert.deepEqual(signupDoors('<Button to="/login" state={{ from: location }} variant="secondary">'), []);
  assert.deepEqual(signupDoors('<Link to={FREE_COURSE_HREF} className="x">'), []);
  assert.equal(signupDoors(code('{/* <Button to="/signup"> */}')).length, 0, 'a comment is not a door');
});

test('every paywall reaches /signup only through a tagged door helper, as a plain href', () => {
  const failures = [];
  for (const file of paywalls()) {
    const src = code(read(file));
    for (const line of src.split('\n')) {
      if (SIGNUP_LITERAL.test(line)) failures.push(`${file}: a '/signup' literal (use a door helper): ${line.trim().slice(0, 100)}`);
    }
    for (const door of signupDoors(src)) {
      const helper = door.literal ? null : door.value.match(/^([A-Za-z_$][\w$]*)\s*\(/)?.[1];
      const shown = door.literal ? `"${door.value}"` : `{${door.value}}`;
      if (door.attr !== 'href') failures.push(`${file}: <${door.element} ${door.attr}=${shown}> is a router link, which drops the tag`);
      if (!helper || !DOOR_HELPERS[helper]) failures.push(`${file}: ${door.value} is not a known door helper (DOOR_HELPERS)`);
    }
  }
  assert.deepEqual(failures, [], failures.join('\n'));
  for (const [name, { fn, ref }] of Object.entries(DOOR_HELPERS)) {
    const u = new URL(fn('a2.1'), ORIGIN);
    assert.equal(u.pathname, '/signup', name);
    assert.equal(u.searchParams.get('ref'), ref, name);
    assert.equal(u.searchParams.get('utm_medium'), 'onsite', name);
  }
});

test('the walk is not vacuous: the lock is a paywall with exactly one signup door, the tagged one', () => {
  const found = paywalls();
  assert.ok(found.includes('src/components/LockedContentOverlay.jsx'), `paywalls found: ${found.join(', ')}`);
  assert.ok(found.length >= 5, `expected the lock, the speaking offer and the three route guards, found ${found.length}`);
  assert.match(read('src/components/LevelSubscriptionGuard.jsx'), /if \(!user\) \{\s*return <LockedContentOverlay level=\{level\} \/>;/);
  const lock = code(read('src/components/LockedContentOverlay.jsx'));
  assert.match(lock, /import\s*\{\s*levelLockSignupHref\s*\}\s*from\s*'\.\.\/lib\/lockDoor\.js'/);
  const doors = signupDoors(lock);
  assert.deepEqual(doors, [{ element: 'Button', attr: 'href', value: 'levelLockSignupHref(level)', literal: false }]);
});
