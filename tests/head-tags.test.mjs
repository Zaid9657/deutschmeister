// Guards the data-rh contract between index.html and src/components/SEO.jsx.
//
// react-helmet-async only reconciles head tags carrying its own data-rh marker.
// A static tag without it is invisible to Helmet, so Helmet appends its own copy
// beside it and the hydrated page ships two. Measured live on 2026-08-25: /faq/
// served two <meta name="description">, two keywords and four duplicated
// twitter:* tags. Stamping the shell's twins fixed it.
//
// The failure mode this test exists for is the SECOND one: stamping a tag SEO.jsx
// does NOT re-render makes Helmet DELETE it on mount. That is how the shell would
// silently lose its noindex on every route that never passes the prop. So the rule
// is an exact set match in both directions, and the exclusions are asserted, not
// assumed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const shell = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const seo = readFileSync(new URL('../src/components/SEO.jsx', import.meta.url), 'utf8');

/** Tag keys SEO.jsx re-renders through Helmet on mount. */
const rendered = new Set([
  ...[...seo.matchAll(/<meta\s+name="([^"]+)"/g)].map((m) => m[1]),
  ...[...seo.matchAll(/<meta\s+property="([^"]+)"/g)].map((m) => m[1]),
]);

/** Static head tag keys in index.html, split by whether they carry the marker. */
const staticTags = new Map();
for (const m of shell.matchAll(/<meta\s+(name|property)="([^"]+)"([^>]*)>/g)) {
  staticTags.set(m[2], m[3].includes('data-rh="true"'));
}

// Conditional in SEO.jsx: most routes never pass noindex, so a stamped robots tag
// would be an unmatched meta[data-rh] and Helmet would remove the shell's noindex.
const NEVER_STAMP = new Set(['robots']);

test('SEO.jsx actually re-renders the tags we think it does', () => {
  for (const key of ['description', 'og:title', 'twitter:card', 'og:locale']) {
    assert.ok(rendered.has(key), `SEO.jsx no longer renders ${key} — revisit the stamped set`);
  }
});

test('every static twin of a Helmet-rendered tag is stamped', () => {
  for (const [key, stamped] of staticTags) {
    if (!rendered.has(key) || NEVER_STAMP.has(key)) continue;
    assert.ok(stamped, `index.html <meta ${key}> lacks data-rh="true" — Helmet will append a duplicate on mount`);
  }
});

test('nothing Helmet does not re-render is stamped', () => {
  for (const [key, stamped] of staticTags) {
    if (!stamped) continue;
    assert.ok(rendered.has(key), `index.html <meta ${key}> is stamped but SEO.jsx never renders it — Helmet will DELETE it on mount`);
    assert.ok(!NEVER_STAMP.has(key), `index.html <meta ${key}> must never be stamped: Helmet would strip it on routes that omit the prop`);
  }
});

test('the shell keeps an unstamped robots noindex', () => {
  assert.match(shell, /<meta name="robots" content="noindex">/,
    'the shell must ship noindex unstamped — it is what keeps ~27 rewrite URLs out of the index');
});

test('og:image dimensions and alt stay unstamped', () => {
  for (const key of ['og:image:width', 'og:image:height', 'og:image:alt']) {
    assert.equal(staticTags.get(key), false, `${key} must stay unstamped — SEO.jsx never emits it, so Helmet would delete it`);
  }
});

test('canonical is stamped, and ld+json is not', () => {
  assert.match(shell, /<link rel="canonical" href="[^"]*" data-rh="true">/,
    'the shell canonical needs the marker: SEO.jsx renders a canonical on every route');
  const ld = [...shell.matchAll(/<script type="application\/ld\+json"([^>]*)>/g)];
  assert.ok(ld.length > 0, 'expected site-wide JSON-LD in the shell');
  for (const m of ld) {
    assert.ok(!m[1].includes('data-rh'),
      'shell JSON-LD must stay unstamped — SEO.jsx does not re-render WebSite/Organization, so Helmet would delete them');
  }
});

// The og:locale pair is the one stamped tag whose value is route-dependent. While
// Helmet only appended, a hardcoded en_US was harmless — the prerendered de_DE sat
// in front of it. Reconciliation made it authoritative, so /faq/ and /ueber-uns/
// hydrated to <html lang="de"> beside og:locale=en_US. SEO.jsx must derive it.
test('SEO.jsx derives og:locale from lang rather than hardcoding it', () => {
  assert.doesNotMatch(seo, /<meta property="og:locale" content="en_US"/,
    'og:locale is hardcoded again — German routes will hydrate to the wrong locale');
  assert.doesNotMatch(seo, /<meta property="og:locale:alternate" content="de_DE"/,
    'og:locale:alternate is hardcoded again');
  assert.match(seo, /const ogLocale = lang === 'de' \? 'de_DE' : 'en_US';/,
    'og:locale must follow the same rule as scripts/prerender-spa-routes.mjs');
});
