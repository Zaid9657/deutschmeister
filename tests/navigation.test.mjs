// Guard suite for THE navigation registry (src/data/navigation.js).
//
// The three-place route rule and the trailing-slash classes (CLAUDE.md) were
// enforced by hand in three different navs until the renovation; this suite
// makes the registry the checked source of truth:
//
//   1. Every 'spa' href resolves to a real <Route> in src/App.jsx, and its
//      base path is rewritten to /app.html in netlify.toml (or it 404s in
//      production — the three-place rule).
//   2. Every 'static' href points into an Astro-served prefix and ends in '/'.
//   3. Prerendered SPA routes carry the trailing slash; plain SPA rewrites
//      don't (the three trailing-slash cases, in data instead of folklore).
//   4. Both renderers actually import the registry — a nav rebuilt from
//      hardcoded links would pass every other check while drifting.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { NAV_GROUPS, FOOTER_GROUPS, LEGAL_LINKS, ALL_NAV_ITEMS } from '../src/data/navigation.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appSrc = readFileSync(join(root, 'src/App.jsx'), 'utf8');
const netlifyToml = readFileSync(join(root, 'netlify.toml'), 'utf8');
const navbarSrc = readFileSync(join(root, 'src/components/Navbar.jsx'), 'utf8');
const footerSrc = readFileSync(join(root, 'src/components/Footer.jsx'), 'utf8');
const layoutSrc = readFileSync(join(root, 'astro-site/src/layouts/Layout.astro'), 'utf8');
const prerenderSrc = readFileSync(join(root, 'scripts/prerender-spa-routes.mjs'), 'utf8');

// Routes the SPA serves, from App.jsx
const spaRoutes = [...appSrc.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);

// Paths netlify.toml rewrites to the app shell
const appShellRewrites = new Set(
  [...netlifyToml.matchAll(/from = "([^"]+)"\s*\n\s*to = "\/app\.html"/g)].map((m) => m[1])
);

// The prerendered SPA routes (trailing-slash class 2), from the script itself
const prerendered = new Set(
  [...prerenderSrc.matchAll(/^\s*path:\s*'([^']+)'/gm)].map((m) => m[1])
);

// Prefixes served by the Astro build (trailing-slash class 1)
const ASTRO_PREFIXES = ['/grammar', '/pricing', '/leitfaden', '/vergleich', '/privacy', '/impressum'];

const spaItems = ALL_NAV_ITEMS.filter((i) => i.kind === 'spa');
const staticItems = ALL_NAV_ITEMS.filter((i) => i.kind === 'static');

test('registry items are well-formed', () => {
  for (const item of ALL_NAV_ITEMS) {
    assert.match(item.href, /^\//, `href must be root-relative: ${item.href}`);
    assert.ok(['spa', 'static'].includes(item.kind), `bad kind on ${item.href}`);
    assert.ok(item.labelEn && item.labelDe, `labels missing on ${item.href}`);
  }
  for (const item of NAV_GROUPS.flatMap((g) => g.items)) {
    assert.ok(['any', 'authed', 'anon'].includes(item.auth), `bad auth on ${item.href}`);
  }
});

test("every 'spa' href has a real route in App.jsx", () => {
  for (const item of spaItems) {
    const base = item.href.replace(/\/$/, '');
    assert.ok(
      spaRoutes.includes(base),
      `${item.href} has no <Route path="${base}"> in App.jsx`
    );
  }
});

test("every 'spa' href is in the netlify.toml app-shell allow-list (three-place rule)", () => {
  for (const item of spaItems) {
    const base = item.href.replace(/\/$/, '');
    const slashed = `${base}/`;
    assert.ok(
      appShellRewrites.has(base) || appShellRewrites.has(slashed) || prerendered.has(base),
      `${item.href} is neither rewritten to /app.html nor prerendered — hard 404 in production`
    );
  }
});

test('trailing slashes follow the three classes', () => {
  for (const item of staticItems) {
    assert.ok(item.href.endsWith('/'), `Astro-served ${item.href} must end in '/'`);
  }
  for (const item of spaItems) {
    const base = item.href.replace(/\/$/, '');
    if (prerendered.has(base)) {
      assert.ok(item.href.endsWith('/'), `prerendered ${item.href} must end in '/'`);
    } else {
      assert.ok(!item.href.endsWith('/'), `plain SPA route ${item.href} must NOT end in '/'`);
    }
  }
});

test("every 'static' href points into an Astro-served prefix", () => {
  for (const item of staticItems) {
    assert.ok(
      ASTRO_PREFIXES.some((p) => item.href === `${p}/` || item.href.startsWith(`${p}/`)),
      `${item.href} is marked 'static' but no Astro prefix serves it`
    );
  }
});

test('both renderers and the footer import the registry', () => {
  assert.match(navbarSrc, /from '\.\.\/data\/navigation'/, 'Navbar.jsx must render from the registry');
  assert.match(footerSrc, /from '\.\.\/data\/navigation'/, 'Footer.jsx must render from the registry');
  assert.match(layoutSrc, /from '\.\.\/data\/navigation\.js'/, 'Layout.astro must render from the registry');
});

test('the footer reaches the guides, FAQ and legal pages (the old orphans)', () => {
  const hrefs = [...FOOTER_GROUPS.flatMap((g) => g.items), ...LEGAL_LINKS].map((i) => i.href);
  for (const required of ['/leitfaden/', '/leitfaden/telc-b1/', '/vergleich/', '/faq/', '/ueber-uns/', '/privacy/', '/impressum/', '/vocabulary']) {
    assert.ok(hrefs.includes(required), `footer lost ${required}`);
  }
});

test('vocabulary is in the main nav (1,935 words were orphaned without it)', () => {
  const learnItems = NAV_GROUPS.find((g) => g.key === 'learn').items;
  assert.ok(learnItems.some((i) => i.href === '/vocabulary'), 'vocabulary missing from the learn group');
});

test('the SPA carries no grammar or vergleich routes (Astro owns those URLs)', () => {
  assert.ok(!spaRoutes.some((r) => r.startsWith('/grammar')), 'a /grammar route crept back into App.jsx');
  assert.ok(!spaRoutes.some((r) => r.startsWith('/vergleich')), 'a /vergleich route crept back into App.jsx');
});
