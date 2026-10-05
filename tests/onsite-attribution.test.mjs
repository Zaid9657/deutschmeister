// Guard suite for the attributed signup doors on the grammar lessons and the
// guides (astro-site/src/lib/onsiteLinks.js, 2026-09-27).
//
// The finding this closes: since attribution began (2026-09-20) 20 of 35
// signups arrived with no source, and not one could be traced to a grammar
// page or a Leitfaden — every signup link there was the bare /signup, and
// public/attribution.js records only what a page LOAD carries. The rule, not a
// list of links:
//
//   1. The helper spells every door per the three trailing-slash cases, and
//      public/attribution.js — the one classifier, run as-is — files the tag
//      as surface / onsite / slug without ever overwriting a first touch.
//   2. No page under /grammar/ or /leitfaden/, and no island they render,
//      links to a bare signup, level-test or pricing door. A new door there
//      has to go through onsiteHref() or this fails.
//   3. Figures on the touched doors are derived (TRIAL_DAYS), never retyped.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import vm from 'node:vm';

import { onsiteHref, surfaceForPath, DOORS, ONSITE_MEDIUM, ONSITE_SOURCES } from '../astro-site/src/lib/onsiteLinks.js';
import { FREE_LEVEL_LABEL } from '../astro-site/src/data/marketing.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/** Land on `href` with public/attribution.js as-is; returns the stored record. */
function land(href, { stored = null, referrer = 'https://deutsch-meister.de/grammar/a1.2/modal-verbs/' } = {}) {
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

test('every door follows its trailing-slash case', () => {
  // SPA rewrite routes: no slash. Prerendered SPA route and Astro page: slash.
  assert.equal(DOORS.signup, '/signup');
  assert.equal(DOORS.freeCourse, `/course/${FREE_LEVEL_LABEL.toLowerCase()}`);
  assert.equal(DOORS.levelTest, '/level-test/');
  assert.equal(DOORS.pricing, '/pricing/');
  for (const door of Object.keys(DOORS)) {
    const u = new URL(onsiteHref(door, 'grammar', 'x'), 'https://deutsch-meister.de');
    assert.equal(u.pathname, DOORS[door], `${door} path changed by the query`);
  }
  assert.throws(() => onsiteHref('dashboard', 'grammar', 'x'), /unknown door/);
  assert.throws(() => onsiteHref('signup', 'instagram', 'x'), /unknown source/, 'channels are tagged links, not on-site doors');
});

test('the classifier files a door as surface / onsite / slug and keeps an earlier first touch', () => {
  for (const source of ONSITE_SOURCES) {
    for (const door of Object.keys(DOORS)) {
      const href = onsiteHref(door, source, 'modal-verbs');
      const fresh = land(href);
      assert.equal(fresh.first.source, source, href);
      assert.equal(fresh.first.medium, ONSITE_MEDIUM, `${href}: a bare ?ref= would default to "social"`);
      assert.equal(fresh.first.content, 'modal-verbs', `${href}: the page that converted must be kept`);
      assert.equal(fresh.first.referrer, null, 'our own host is never a referrer');
      const googler = land(href, { stored: { first: { source: 'google', medium: 'organic', landing: '/grammar/a1.2/modal-verbs/' }, last: { source: 'google', medium: 'organic' } } });
      assert.equal(googler.first.source, 'google', 'first touch is never overwritten');
      assert.equal(googler.first.landing, '/grammar/a1.2/modal-verbs/');
      assert.equal(googler.last.source, source);
      assert.equal(googler.last.content, 'modal-verbs');
    }
  }
});

test('the surface is read from the page path, and only grammar and guides have one', () => {
  assert.equal(surfaceForPath('/grammar/'), 'grammar');
  assert.equal(surfaceForPath('/grammar/b1.1/konjunktiv-ii/'), 'grammar');
  assert.equal(surfaceForPath('/leitfaden/telc-b1/'), 'leitfaden');
  for (const p of ['/', '/pricing/', '/courses/a1-1/', '/grammarly/', '/vergleich/babbel/', '/404', '']) {
    assert.equal(surfaceForPath(p), null, p);
  }
});

// ── the rule: no unattributed door on a grammar or guide surface ────────────

function astroFiles(dir) {
  const out = [];
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) out.push(...astroFiles(rel));
    else if (/\.(astro|jsx)$/.test(name)) out.push(rel);
  }
  return out;
}

const SURFACE_PAGES = [
  ...astroFiles('astro-site/src/pages/grammar'),
  ...astroFiles('astro-site/src/pages/leitfaden'),
];
// A door written by hand: the bare route (absolute or root-relative), not
// followed by a query.
const BARE_DOOR = /href=["{`']*(?:https:\/\/deutsch-meister\.de)?\/(signup|level-test\/|pricing\/|course\/a1\.1)["'`}]/g;
// The exercise island renders /pricing/ only to SIGNED-IN visitors (buy the
// level, go Pro), whose acquisition was recorded at signup — so there the rule
// covers the doors a signed-out visitor sees. Its '/signup' prop default is a
// fallback value, not an href.
const BARE_SIGNUP = /href=["{`']*(?:https:\/\/deutsch-meister\.de)?\/(signup|course\/a1\.1)["'`}]/g;

test('no grammar or guide page links to a bare signup, level-test, pricing or free-course door', () => {
  assert.ok(SURFACE_PAGES.length >= 4, `surface scan found only ${SURFACE_PAGES.length} files`);
  const failures = [];
  for (const file of SURFACE_PAGES) {
    for (const m of read(file).matchAll(BARE_DOOR)) failures.push(`${relative(ROOT, join(ROOT, file))}: ${m[0]}`);
  }
  for (const m of read('astro-site/src/components/ExercisePlayer.jsx').matchAll(BARE_SIGNUP)) failures.push(`ExercisePlayer.jsx: ${m[0]}`);
  assert.deepEqual(failures, [], `unattributed doors — build them with onsiteHref():\n  ${failures.join('\n  ')}`);
});

test('the grammar lesson threads one attributed door through the page and its island', () => {
  const page = read('astro-site/src/pages/grammar/[level]/[slug].astro');
  assert.match(page, /const signupHref = onsiteHref\('signup', 'grammar', slug\);/);
  assert.match(page, /onsiteHref\('freeCourse', 'grammar', slug\)/);
  assert.match(page, /signupHref=\{signupHref\}\s*\n\s*client:visible/, 'the ExercisePlayer island must get the door');
  assert.match(page, /\{TRIAL_DAYS\} days of Pro included/);
  assert.doesNotMatch(page, /\b7 days\b/, 'retyped trial length');

  const island = read('astro-site/src/components/ExercisePlayer.jsx');
  assert.match(island, /function LockedExercises\(\{[^}]*signupHref[^}]*\}\)/);
  assert.match(island, /<LockedExercises [^>]*signupHref=\{signupHref\}/);
  assert.match(island, /<ExerciseRun [^>]*signupHref=\{signupHref\}/);
  // The signed-out finish line: honest (the run is recorded only with a session) and attributed.
  assert.match(island, /\{!hasStoredSession\(\) && signupHref && \(/);
  assert.match(island, /This score is not saved without an account\./);
  assert.ok(!island.includes('deutsch-meister.de/signup'), 'hard-coded signup in the island');
});

test('guides offer the free account next to the level test, every door attributed', () => {
  const page = read('astro-site/src/pages/leitfaden/[slug].astro');
  for (const door of ['levelTest', 'signup', 'pricing']) {
    assert.match(page, new RegExp(`${door}: onsiteHref\\('${door}', 'leitfaden', guide\\.slug\\)`), door);
    assert.match(page, new RegExp(`href=\\{doors\\.${door}\\}`), `${door} not rendered`);
  }
  assert.match(page, /Kostenloses Konto erstellen/);
  assert.match(page, /\{TRIAL_DAYS\} Tage Pro inklusive/);
});

test('the grammar hub and the nav carry the surface', () => {
  const hub = read('astro-site/src/pages/grammar/index.astro');
  assert.match(hub, /onsiteHref\('signup', 'grammar', 'index'\)/);
  assert.match(hub, /includes \{TRIAL_DAYS\} days of Pro/);

  const layout = read('astro-site/src/layouts/Layout.astro');
  assert.match(layout, /const navSignupHref = surface \? onsiteHref\('signup', surface, 'nav'\) : '\/signup';/);
  // An Arabic page (docs/arabic/README.md) sends the same three buttons to the
  // Arabic sign-up; every other page keeps the surface-tagged href.
  assert.match(layout, /const signupHref = lang === 'ar' \? '\/signup\?lang=ar' : navSignupHref;/);
  assert.equal((layout.match(/href=\{signupHref\}/g) || []).length, 3, 'desktop, mobile and menu trial buttons');
  assert.doesNotMatch(layout, /href="\/signup"/, 'a nav signup button bypasses the surface tag');
});
