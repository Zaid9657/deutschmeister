// Guards the web-performance fixes of docs/SCORECARD.md work order #9
// (measured 2026-09-27, Lighthouse 13 mobile). Each block closes a finding
// class, not a single instance:
//
// 1. lucide-react must tree-shake. Named in an object-form manualChunk it was a
//    chunk ENTRY, which keeps every export: 757 KB vendor-ui, ~625 KB of it
//    unused icons, modulepreloaded on every SPA page. A namespace import
//    (`import * as Icons`) indexed at runtime defeats tree-shaking the same way.
// 2. Fonts are self-hosted, preloaded and metric-matched. The Google Fonts pair
//    was ~98 KB of a ~144 KB static page from two extra origins, and its late
//    swap from an unmatched fallback shifted the hero (CLS 0.11–0.18).
// 3. Hero text is visible in the first frame. Chrome does not count text painted
//    at opacity 0 as contentful, so a fade-in entrance on the page's largest
//    text holds LCP back until something repaints it.
// 4. The SPA's <main> keeps its height across a redirect. ProtectedRoute's
//    <Navigate> commits an empty main for a frame; the footer jumped into view
//    and back — CLS 2.0 on /dashboard → /login.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import viteConfig from '../vite.config.js';
import { fontFaces, fontFacesItalic, fontPreloads, tailwindFontFamily } from '../src/data/design-tokens.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const root = new URL('..', import.meta.url).pathname;

function sourceFiles(dir, out = []) {
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const rel = join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(rel, out);
    else if (/\.(jsx?|mjs)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

// ── 1. lucide-react tree-shakes ─────────────────────────────────────────────

test('vendor chunks are assigned by path, and lucide-react is not one of them', () => {
  const { manualChunks } = viteConfig.build.rollupOptions.output;
  assert.equal(typeof manualChunks, 'function', 'object-form manualChunks keeps every export of each named package');
  assert.equal(manualChunks('/x/node_modules/lucide-react/dist/esm/icons/pen-tool.js'), undefined);
  assert.equal(manualChunks('/x/node_modules/lucide-react/dist/esm/lucide-react.js'), undefined);
  // The useful splits stay: long-lived vendor code caches apart from app code.
  assert.equal(manualChunks('/x/node_modules/react-dom/cjs/react-dom.production.min.js'), 'vendor-react');
  assert.equal(manualChunks('/x/node_modules/@supabase/supabase-js/dist/module/index.js'), 'vendor-supabase');
  assert.equal(manualChunks('/x/src/App.jsx'), undefined);
});

test('no source file imports lucide-react as a namespace', () => {
  const offenders = sourceFiles('src').filter((file) =>
    /import\s+\*\s+as\s+\w+\s+from\s+['"]lucide-react['"]/.test(read(file)),
  );
  assert.deepEqual(offenders, [], 'import icons by name — a namespace import ships all ~1,300 icons');
});

// ── 2. Fonts: self-hosted, preloaded, metric-matched ────────────────────────

const faceRules = [...fontFaces, ...fontFacesItalic].map((rule) => rule['@font-face']);
const faceFiles = faceRules
  .map((face) => /url\('([^']+)'\)/.exec(face.src)?.[1])
  .filter(Boolean);

test('every @font-face file exists in public/fonts, and nothing there is unreferenced', () => {
  const onDisk = readdirSync(join(root, 'public/fonts')).map((f) => `/fonts/${f}`).sort();
  assert.deepEqual([...new Set(faceFiles)].sort(), onDisk);
});

test('every named face in the display and body stacks is declared', () => {
  const declared = new Set(faceRules.map((face) => face.fontFamily.replace(/'/g, '')));
  for (const role of ['display', 'body']) {
    const stack = tailwindFontFamily[role];
    for (const family of stack.filter((f) => /^(Fraunces|Nunito Sans)/.test(f))) {
      assert.ok(declared.has(family), `${role} stack names "${family}" but no @font-face declares it`);
    }
    // The metric-matched fallback must come straight after the brand face.
    assert.match(stack[1], / Fallback$/, `${role}: the fallback face must follow the brand face`);
  }
  for (const face of faceRules.filter((f) => /Fallback/.test(f.fontFamily))) {
    assert.match(face.src, /^local\(/, `${face.fontFamily} must only name local fonts`);
    assert.match(face.sizeAdjust, /%$/, `${face.fontFamily} needs a size-adjust`);
    assert.ok(face.ascentOverride && face.descentOverride, `${face.fontFamily} needs ascent/descent overrides`);
  }
});

test('both heads preload exactly the token fontPreloads, and nothing points at Google Fonts', () => {
  assert.ok(fontPreloads.length > 0 && fontPreloads.every((href) => faceFiles.includes(href)));
  const shell = read('index.html');
  const preloaded = [...shell.matchAll(/<link rel="preload" href="([^"]+)" as="font" type="font\/woff2" crossorigin>/g)].map((m) => m[1]);
  assert.deepEqual(preloaded.sort(), [...fontPreloads].sort());

  const layout = read('astro-site/src/layouts/Layout.astro');
  assert.match(layout, /import \{ fontPreloads \} from '\.\.\/data\/design-tokens\.js'/);
  assert.match(layout, /fontPreloads\.map\(\(href\) => \(\s*<link rel="preload" href=\{href\} as="font" type="font\/woff2" crossorigin \/>/);

  for (const file of ['index.html', 'astro-site/src/layouts/Layout.astro', 'netlify.toml']) {
    assert.doesNotMatch(read(file), /fonts\.(googleapis|gstatic)\.com/, `${file} still references Google Fonts`);
  }
  assert.match(read('netlify.toml'), /for = "\/fonts\/\*"\s+\[headers\.values\]\s+Cache-Control = "public, max-age=31536000, immutable"/);
});

test('both tailwind configs emit the faces into their base layer', () => {
  assert.match(read('tailwind.config.js'), /addBase\(\[\.\.\.fontFaces, \.\.\.fontFacesItalic\]\)/);
  assert.match(read('astro-site/tailwind.config.mjs'), /addBase\(fontFaces\)/);
});

// ── 3. Hero text is visible in the first frame ──────────────────────────────

test('the hero entrance moves but never fades or blurs (both stylesheets)', () => {
  for (const file of ['src/index.css', 'astro-site/src/styles/showtime.css']) {
    const keyframes = /@keyframes dmRise\s*\{([\s\S]*?\})\s*\}/.exec(read(file));
    assert.ok(keyframes, `${file}: @keyframes dmRise not found`);
    assert.doesNotMatch(keyframes[1], /opacity|filter/, `${file}: dmRise must animate transform only`);
  }
});

test('the SPA page heading is never scroll-revealed', () => {
  const heading = read('src/components/ui/SectionHeading.jsx');
  assert.match(heading, /const Part = size === 'page' \? Shown : Reveal;/);
  assert.doesNotMatch(heading, /<Reveal\b/, 'render through Part so the page role stays visible');
});

// ── 4. The SPA main keeps its height across a redirect ─────────────────────

test('<main> reserves a viewport of height so a redirect frame cannot pull the footer up', () => {
  assert.match(read('src/App.jsx'), /<main id="main" className="min-h-screen">/);
});
