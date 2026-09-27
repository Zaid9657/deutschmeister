// Guard: the shipped dependency trees stay patched, and the Astro advisories that
// only an Astro major can fix stay unreachable until the owner takes that major.
//
// On 2026-09-27, `npm audit --omit=dev` in astro-site measured 10 high and 1 critical.
// `npm audit fix` (no --force) moved 34 packages inside their declared ranges:
// astro 5.18.1 → 5.18.2, vite 6.4.1 → 6.4.3 and 7.3.1 → 7.3.6, postcss, devalue,
// js-yaml, nanoid, smol-toml, svgo, ws, browserslist and others. That left 1 high and
// 1 critical, and both need Astro 5 → 7. The built site stayed byte-identical (146
// files), and the build still passes with sharp deleted from node_modules.
//
// Three rules:
//
// 1. FLOORS. Every production copy of a package patched that day, in either lockfile,
//    is at or above the first fixed version for its major. If a stale lockfile comes
//    back through a merge, a revert or a hand edit, this test fails. New advisories
//    are the weekly `npm audit` measurement's job (docs/SCORECARD.md §2), not this
//    file's.
//
// 2. NO HOLLOW ENTRIES. The old astro-site lock carried `"node_modules/@types/ms": {}`,
//    an entry with no version. `npm ci` tolerated it. `npm install`, which the session
//    hook and the Netlify build both run, deletes it, and `npm ci` rejects the result
//    ("Missing: @types/ms@2.1.0 from lock file"). That is the churn behind the "never
//    commit astro-site/package-lock.json" rule. A lock with a hollow entry cannot
//    round-trip between the two commands.
//
// 3. UNREACHABLE UNTIL UPGRADED. While the locked astro is below 7.2.8, the site
//    must not use the features its open advisories need:
//    - output 'static' with no adapter. The SSR-only advisories need a running Astro
//      server: GHSA-2pvr-wf23-7pc7 (Host-header SSRF), GHSA-8hv8-536x-4wqp (slot-name
//      XSS), GHSA-4g3v-8h47-v7g6 (View Transition XSS), GHSA-376h-93r7-7g6f (base-path
//      bypass) and GHSA-xr5h-phrj-8vxv (server islands).
//    - no astro:assets and no Markdown. The critical GHSA-26w7-cxv4-gfx2 (RCE through
//      AVIF optimisation) and sharp's libvips/libheif advisories (GHSA-f88m-g3jw-g9cj,
//      GHSA-rgj7-g3m4-5g8c) only run when Astro optimises an image.
//    - no define:vars (GHSA-j687-52p2-xcff), no transition:* directives
//      (GHSA-7pw4-f3q4-r2p2), no server:defer.
//    - spread attributes only from ALLOWED_SPREADS, whose keys are constants
//      (GHSA-jrpj-wcv7-9fh9 and GHSA-f48w-9m4c-m7f5 escape attribute NAMES badly).
//    esbuild GHSA-g7r4-m6w7-qqqr needs the dev server on Windows, so no guard for it.
//    Once astro >= 7.2.8 is locked, rule 3 skips itself. Delete it in that PR.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const ASTRO = path.join(ROOT, 'astro-site');
const LOCKS = ['package-lock.json', 'astro-site/package-lock.json'];

const readLock = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));
const nameOf = (key) => key.slice(key.lastIndexOf('node_modules/') + 'node_modules/'.length);

function parseVersion(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v || '');
  assert.ok(m, `unparseable version "${v}"`);
  return m.slice(1, 4).map(Number);
}
function lt(a, b) {
  const [x, y] = [parseVersion(a), parseVersion(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i];
  return false;
}

// First fixed version per major, from the 2026-09-27 audit (advisory ranges quoted).
const FLOORS = {
  vite: { 6: '6.4.3', 7: '7.3.5' }, // <=6.4.2 || 7.0.0-7.3.4: GHSA-fx2h-pf6j-xcff, -p9ff-h696-f583, -v2wj-q39q-566r, -v6wh-96g9-6wx3, -4w7w-66w2-5vf9
  postcss: { 8: '8.5.23' }, // <=8.5.22: GHSA-6g55-p6wh-862q, -r28c-9q8g-f849, -fxqj-rqcc-2cmp, -qx2v-qp2m-jg93
  devalue: { 5: '5.9.1' }, // <5.9.1: GHSA-77vg-94rm-hx3p, -9rgm-9g3h-6x36
  'js-yaml': { 4: '4.3.2' }, // 4.0.0-4.3.1: GHSA-2883-xcg3-v3hh, -5p4m-2wfm-xmqj, -52cp-r559-cp3m, -h67p-54hq-rp68
  nanoid: { 3: '3.3.18' }, // <=3.3.17: GHSA-2v37-7h3g-55p8, -28wg-ghj8-5hjv, -xwg4-73v4-xw9w
  'smol-toml': { 1: '1.7.1' }, // <=1.7.0: GHSA-7w5x-hrqm-74c2
  svgo: { 4: '4.1.0' }, // 4.0.0-4.0.x: GHSA-w27v-7q3p-w38r, -2p49-hgcm-8545, -4vpr-x523-8j87
  ws: { 8: '8.21.0' }, // 8.0.0-8.20.x: GHSA-96hv-2xvq-fx4p, -58qx-3vcg-4xpx
  browserslist: { 4: '4.28.7' }, // <=4.28.6: GHSA-c83g-rgw3-j3cx, -73wf-gq98-2v4g
  'baseline-browser-mapping': { 2: '2.11.0' }, // 2.0.0-2.10.x: GHSA-w5vr-8v7q-w6rv
  '@babel/core': { 7: '7.29.1' }, // <=7.29.0: GHSA-4x5r-pxfx-6jf8
  'postcss-selector-parser': { 6: '6.1.3' }, // 6.1.0-6.1.2: GHSA-w9m9-85wc-3x92
};

// Spread-attribute expressions allowed in .astro templates, with why each is safe.
const ALLOWED_SPREADS = new Map([
  ['authAttrs(item)', 'Layout.astro: keys are the literals data-auth-only, style, data-anon-only'],
]);

test('floors: no production copy of a patched package is below its fix (both lockfiles)', () => {
  let checked = 0;
  const below = [];
  for (const rel of LOCKS) {
    for (const [key, entry] of Object.entries(readLock(rel).packages)) {
      if (!key || entry.dev || entry.link) continue; // the metric is `npm audit --omit=dev`
      const floors = FLOORS[nameOf(key)];
      if (!floors) continue;
      const floor = floors[parseVersion(entry.version)[0]];
      if (!floor) continue; // a major outside the advisory ranges
      checked++;
      if (lt(entry.version, floor)) below.push(`${rel} ${key}@${entry.version} < ${floor}`);
    }
  }
  assert.deepEqual(below, [], `vulnerable versions are back. Run \`npm audit fix\` (no --force) in that tree:\n${below.join('\n')}`);
  // Not vacuous: astro-site alone has 16 floored copies today.
  assert.ok(checked >= 12, `only ${checked} floored copies found; is the lockfile parser broken?`);
});

test('no hollow lockfile entries: every package entry has a version (npm ci and npm install must agree)', () => {
  const hollow = [];
  for (const rel of LOCKS) {
    for (const [key, entry] of Object.entries(readLock(rel).packages)) {
      if (!key || entry.link) continue;
      if (!entry.version) hollow.push(`${rel}: "${key}": ${JSON.stringify(entry)}`);
    }
  }
  assert.deepEqual(hollow, [], `lockfile entries without a version. Regenerate with \`npm install\`, then check \`npm ci\` passes:\n${hollow.join('\n')}`);
});

const astroLock = readLock('astro-site/package-lock.json').packages;
const lockedAstro = astroLock['node_modules/astro']?.version;
const astroStillVulnerable = lt(lockedAstro, '7.2.8');

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const SRC_FILES = walk(path.join(ASTRO, 'src'));
const rel = (p) => path.relative(ROOT, p);
const templates = SRC_FILES.filter((f) => f.endsWith('.astro'));
const code = SRC_FILES.filter((f) => /\.(astro|m?js|jsx|ts|tsx)$/.test(f));

test('the locked astro is the one this file reasons about', () => {
  assert.ok(lockedAstro, 'astro missing from astro-site/package-lock.json');
});

test(
  `astro ${lockedAstro} < 7.2.8: the site stays a static build with no adapter (SSR-only advisories)`,
  { skip: !astroStillVulnerable && 'astro >= 7.2.8 is locked: delete this guard' },
  () => {
    const config = readFileSync(path.join(ASTRO, 'astro.config.mjs'), 'utf8');
    assert.match(config, /output:\s*['"]static['"]/, "astro.config.mjs must keep output: 'static'");
    assert.doesNotMatch(config, /\badapter\s*:/, 'an adapter runs Astro as a server: take Astro >= 7.2.8 first');
    assert.doesNotMatch(config, /@astrojs\/(netlify|node|vercel|cloudflare)/, 'SSR adapter imported: take Astro >= 7.2.8 first');
  },
);

test(
  `astro ${lockedAstro} < 7.2.8: no image optimisation, so sharp and the AVIF RCE never run`,
  { skip: !astroStillVulnerable && 'astro >= 7.2.8 is locked: delete this guard' },
  () => {
    const hits = [];
    for (const f of code) {
      const src = readFileSync(f, 'utf8');
      if (/astro:assets|\bgetImage\s*\(|<(Image|Picture)\b/.test(src)) hits.push(rel(f));
    }
    const markdown = SRC_FILES.filter((f) => /\.(md|mdx|markdoc)$/.test(f)).map(rel);
    assert.deepEqual(hits, [], `astro:assets in use: GHSA-26w7-cxv4-gfx2 (critical) becomes reachable. Take Astro >= 7.2.8 first:\n${hits.join('\n')}`);
    assert.deepEqual(markdown, [], `Markdown images go through astro:assets. Take Astro >= 7.2.8 first:\n${markdown.join('\n')}`);
    const config = readFileSync(path.join(ASTRO, 'astro.config.mjs'), 'utf8');
    assert.doesNotMatch(config, /\bimage\s*:/, 'image service configured: take Astro >= 7.2.8 first');
  },
);

test(
  `astro ${lockedAstro} < 7.2.8: no define:vars, transition:*, server:defer, and only allowlisted spreads`,
  { skip: !astroStillVulnerable && 'astro >= 7.2.8 is locked: delete this guard' },
  () => {
    const hits = [];
    const seen = new Set();
    for (const f of templates) {
      const src = readFileSync(f, 'utf8');
      // CSS `transition: opacity …` inside <style> is fine; the directive is transition:name|animate|persist.
      for (const re of [/\bdefine:vars\b/g, /\btransition:(name|animate|persist)\b/g, /\bserver:defer\b/g]) {
        for (const m of src.matchAll(re)) hits.push(`${rel(f)}: ${m[0]}`);
      }
      // Attribute spreads live in the markup: drop the frontmatter and <script>/<style> bodies,
      // where `{ ...obj, key }` is an ordinary object literal. An attribute spread is a lone
      // `{...expr}`, so a brace group holding a comma is an object literal, not a spread.
      // Self-closing tags (`<script type="application/ld+json" set:html={…} />`) go first,
      // or the paired pattern would run from one to the next </script> and hide the markup.
      const markup = src
        .replace(/^---\n[\s\S]*?\n---\n/, '')
        .replace(/<(script|style)\b[^>]*\/>/g, '')
        .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '');
      for (const m of markup.matchAll(/\{\s*\.\.\.\s*([^{},]+?)\s*\}/g)) {
        if (ALLOWED_SPREADS.has(m[1])) seen.add(m[1]);
        else hits.push(`${rel(f)}: spread {...${m[1]}} (not in ALLOWED_SPREADS)`);
      }
    }
    // The stripping above must not hide the markup: every allowlisted spread is still found.
    for (const expr of ALLOWED_SPREADS.keys()) {
      assert.ok(seen.has(expr), `{...${expr}} not found in any template: drop it from ALLOWED_SPREADS, or the markup scan is hiding templates`);
    }
    assert.deepEqual(hits, [], `a feature an open astro advisory needs. Take Astro >= 7.2.8, or add the spread to ALLOWED_SPREADS with why its keys are constant:\n${hits.join('\n')}`);
  },
);
