// Guard suite for the v3 "Die Linie" design layer (src/data/design-tokens.js,
// the section at the end; docs/redesign-2026-10/art-direction.md), in its v4
// colours: TÜRKIS (owner pick 2026-10-04, over night + signal yellow).
//
//   1. The türkis palette is legible where the rules use it (AA contrast for
//      text, 3:1 for the line on its tint), checked against the token values.
//   2. One action colour: the line IS the siegel türkis, and never lands on a
//      case hue (rule 1).
//   3. The motion contract from the art direction holds in the Linie
//      stylesheet and components: strong curves, no `transition: all`, no
//      ease-in on UI, hover motion only behind a fine pointer, a reduced-motion
//      gate, and no scale(0) entrances.
//   4. The app chrome speaks the same design as the Astro chrome.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { linie, nacht, kasus, color, motionLinie } from '../src/data/design-tokens.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const walk = (dir, out = []) => {
  if (!existsSync(join(ROOT, dir))) return out;
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
};

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const hue = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};

test('the Türkis palette is legible where the rules use it (v4, owner pick 2026-10-04)', () => {
  assert.ok(contrast(linie.ink, linie.DEFAULT) >= 4.5, 'white text on a türkis key (AA)');
  assert.ok(contrast(linie.DEFAULT, nacht.raised) >= 4.5, 'türkis text on a white card (AA)');
  assert.ok(contrast(linie.DEFAULT, color.paper) >= 4.5, 'türkis text on paper (AA)');
  assert.ok(contrast(linie.DEFAULT, nacht.DEFAULT) >= 3, 'the line and large türkis text on the tint');
  assert.ok(contrast(nacht.text, nacht.DEFAULT) >= 12, 'body text on the tint');
  assert.ok(contrast(nacht.muted, nacht.DEFAULT) >= 4.5, 'secondary text on the tint (AA)');
  assert.ok(contrast(nacht.muted, nacht.raised) >= 7, 'secondary text on a white card');
  assert.ok(contrast(nacht.text, linie.wash) >= 12, 'ink on the türkis wash');
  assert.ok(contrast(color.white, color.siegel) >= 4.5, 'white text on a siegel button (AA)');
});

test('one action colour: the line is the siegel family, and never a case colour (rules 1 and 2)', () => {
  assert.equal(linie.DEFAULT, color.siegel, 'linie and siegel must be the same türkis');
  // Türkis sits close to the Dativ green, as siegel teal always has; the guard is
  // that it never lands ON a case hue, and that a case colour always carries its label.
  for (const [name, k] of Object.entries(kasus)) {
    const d = Math.abs(hue(linie.DEFAULT) - hue(k.line));
    assert.ok(Math.min(d, 360 - d) >= 10, `linie vs ${name}: ${Math.min(d, 360 - d).toFixed(0)}° apart`);
    assert.ok(k.abbr, `${name} has its label`);
  }
});

test('motion tokens are the strong curves, and nothing eases in', () => {
  assert.equal(motionLinie.ease.out, 'cubic-bezier(0.23, 1, 0.32, 1)');
  assert.equal(motionLinie.ease.inOut, 'cubic-bezier(0.77, 0, 0.175, 1)');
  for (const ms of Object.values(motionLinie.duration)) assert.match(ms, /^\d+ms$/);
  assert.ok(parseInt(motionLinie.duration.feedback, 10) <= 160 && parseInt(motionLinie.duration.control, 10) < 300);
});

test('the Linie stylesheet and components keep the motion contract', () => {
  const files = [
    ...walk('astro-site/src/components/linie'),
    ...walk('astro-site/src/styles').filter((f) => /linie/.test(f)),
  ].filter((f) => /\.(astro|css|js)$/.test(f));
  assert.ok(files.length > 0, 'the Linie components exist');
  const css = files.map(read).join('\n');
  assert.doesNotMatch(css, /transition:\s*all|transition-all\b/, 'name the properties, never `all`');
  assert.doesNotMatch(css, /\bease-in\b(?!-out)|cubic-bezier\(0\.4,\s*0,\s*1,\s*1\)/, 'no ease-in on UI');
  assert.doesNotMatch(css, /scale\(0\)/, 'nothing appears from scale(0)');
  assert.match(css, /prefers-reduced-motion/, 'a reduced-motion gate');
  // Hover MOTION lives behind a fine pointer; colour-only hovers may stay plain.
  for (const m of css.matchAll(/([^{}]*:hover[^{}]*)\{([^}]*)\}/g)) {
    if (/transform|translate|scale|rotate/.test(m[2])) {
      const before = css.slice(0, m.index);
      const open = before.lastIndexOf('@media (hover: hover) and (pointer: fine)');
      const close = before.lastIndexOf('/* end hover */');
      assert.ok(open > close, `hover motion outside the fine-pointer gate: ${m[1].trim().slice(0, 60)}`);
    }
  }
});

test('only the pages that preload the sign face use it; library pages never fetch Archivo', () => {
  // Measured 2026-10-04: the nav's sign labels made every grammar and guide page
  // fetch the 55 KB face at top priority (+~450 ms lab FCP). Layout.astro marks
  // a page data-sign="off" unless it preloads the face, and linie.css then sets
  // every sign role (and the key) in the body face.
  const layout = readFileSync(join(ROOT, 'astro-site/src/layouts/Layout.astro'), 'utf8');
  assert.match(layout, /const signOn = signFontPreloads\.every\(\(href\) => preloads\.includes\(href\)\);/);
  // (`dir` is the Arabic edition's: rtl on an Arabic page, absent elsewhere.)
  assert.match(layout, /<html lang=\{lang\} dir=\{isArabic \? 'rtl' : undefined\} data-sign=\{signOn \? undefined : 'off'\}>/);
  const css = readFileSync(join(ROOT, 'astro-site/src/styles/linie.css'), 'utf8');
  assert.match(css, /html\[data-sign='off'\] :is\(\.sign-display, \.sign-head, \.sign-label, \.sign-code, \.dm-key\) \{\s*font-family: theme\('fontFamily\.body'\);/);
  // Every page whose own markup uses a sign role preloads the face.
  const pagesDir = join(ROOT, 'astro-site/src/pages');
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
  for (const file of walk(pagesDir).filter((f) => f.endsWith('.astro'))) {
    const src = readFileSync(file, 'utf8');
    const usesSign = /\bsign-(display|head|label|code)\b|from '\.\.\/(\.\.\/)?components\/linie\//.test(src);
    if (usesSign) assert.match(src, /signFontPreloads/, `${file.replace(ROOT, '')} uses the sign face, so it must preload it`);
  }
});

// ── The SPA chrome (2026-10-04): Navbar, Footer and BottomNav speak Die Linie ──
// Before this, the app's bar and footer kept the paper/teal look while every
// Astro page had moved to the line, so crossing from /courses/ into /dashboard
// changed the whole frame. These pins keep the two chromes one design.
const chromeSrc = {
  navbar: read('src/components/Navbar.jsx'),
  footer: read('src/components/Footer.jsx'),
  bottomNav: read('src/components/BottomNav.jsx'),
};

test('the SPA bar promotes the same two doors as the Astro bar', () => {
  const layout = read('astro-site/src/layouts/Layout.astro');
  const promotedIn = (src) => src.match(/const PROMOTED = (\[[^\]]*\]);/)?.[1];
  assert.ok(promotedIn(layout), 'Layout.astro declares PROMOTED');
  assert.equal(promotedIn(chromeSrc.navbar), promotedIn(layout), 'Navbar.jsx and Layout.astro promote different items');
  assert.match(chromeSrc.navbar, /groundFor\(pathname\) === 'nacht'/, 'the bar must follow the route ground');
});

test('the SPA footer and phone menu draw the stations; footer and tab bar stand on night', () => {
  assert.match(chromeSrc.footer, /className=\{`bg-nacht /, 'footer ground');
  assert.match(chromeSrc.footer, /STATIONS\.map/, 'footer stations');
  assert.match(chromeSrc.footer, /rounded-pill bg-linie/, 'the line under the stations');
  assert.match(chromeSrc.navbar, /bg-nacht px-4[\s\S]*?STATIONS\.map/, 'the phone menu opens on the stations, on night');
  assert.match(chromeSrc.navbar, /user \? 'pb-\[calc\(5\.5rem\+env\(safe-area-inset-bottom\)\)\]'/, 'signed in, the sheet must scroll clear of BottomNav');
  assert.match(chromeSrc.bottomNav, /bg-nacht\/95/, 'tab bar ground');
  assert.match(chromeSrc.bottomNav, /active \? 'text-siegel-deep'/, 'the current tab is the lit stop (AA label)');
  assert.match(chromeSrc.bottomNav, /bg-linie" aria-hidden="true"/, 'and carries the türkis bar');
});

test('the app chrome never sets the sign face (the app does not load Archivo)', () => {
  for (const [name, src] of Object.entries(chromeSrc)) {
    assert.doesNotMatch(src, /\bfont-sign\b|\bsign-(display|head|label|code)\b/, `${name} uses the sign face`);
  }
});

test('focus stays visible on night grounds in the app', () => {
  const css = read('src/index.css');
  assert.match(css, /\[data-ground='nacht'\] \*:focus-visible \{\s*@apply ring-linie ring-offset-nacht;/);
  for (const [name, src] of Object.entries(chromeSrc)) {
    if (/bg-nacht/.test(src)) assert.match(src, /data-ground="nacht"|data-ground=\{night/, `${name} draws night without marking the ground`);
  }
});

test('groundFor: night only where the first screen is night', async () => {
  const { groundFor } = await import('../src/lib/chrome.js');
  assert.equal(groundFor('/subscription/success'), 'nacht');
  assert.equal(groundFor('/subscription/success/'), 'nacht');
  for (const p of ['/', '/dashboard', '/subscription', '/course/a1.1', '', undefined]) assert.equal(groundFor(p), 'paper', String(p));
  assert.match(read('src/pages/SubscriptionSuccessPage.jsx'), /min-h-screen bg-nacht/, 'the night route must open on a night screen');
});

test('a Button is made a pill by its shape, never by an appended class', () => {
  // rounded-clay and rounded-pill are both single-property utilities; the one
  // emitted later in the CSS wins whatever the className order. Pill is emitted
  // after clay today, so an appended class works only by luck of ordering.
  assert.match(read('src/components/ui/Button.jsx'), /BASE\.replace\('rounded-clay', SHAPES\[shape\]/);
  const offenders = walk('src').filter((f) => f.endsWith('.jsx'))
    .filter((f) => /<Button\b[^>]*className="[^"]*\brounded-pill\b/.test(read(f)));
  assert.deepEqual(offenders, []);
});

test('türkis text is for large type only; small labels on the tint use siegel-deep (AA)', () => {
  // linie on the tint is 4.2:1: enough for large text (3:1), not for small text
  // (4.5:1). Small = the eyebrow/data sizes and text-xs/sm.
  assert.ok(contrast(color.siegelDeep, nacht.DEFAULT) >= 4.5, 'siegel-deep on the tint');
  const SMALL = /\b(text-xs|text-sm|text-\[0\.[0-9]+rem\]|font-data)\b/;
  const offenders = [];
  for (const f of [...walk('astro-site/src'), ...walk('src')].filter((x) => /\.(astro|jsx)$/.test(x))) {
    for (const m of read(f).matchAll(/class(?:Name)?=["{`]([^"`]*)/g)) {
      const cls = m[1];
      if (/\btext-linie(?![-\w])/.test(cls) && SMALL.test(cls) && !/\bbg-(white|nacht-raised)\b/.test(cls)) offenders.push(`${f}: ${cls.slice(0, 80)}`);
    }
  }
  assert.deepEqual(offenders, []);
});

// ── The line board: the hero's HyperFrames loop (owner, 2026-10-04) ──
test('the homepage carries the line board, poster-first and motion-safe', async () => {
  const home = read('astro-site/src/pages/index.astro');
  assert.match(home, /<LineBoard \/>/, 'the hero shows the line board');
  const board = read('astro-site/src/components/linie/LineBoard.astro');
  for (const f of ['hero-line.mp4', 'hero-line.webm', 'hero-line-poster.webp', 'hero-line-mobile.mp4', 'hero-line-mobile.webm', 'hero-line-mobile-poster.webp']) {
    assert.ok(existsSync(join(ROOT, 'public/motion', f)), `public/motion/${f} is missing — run videos/encode-web.sh`);
    assert.match(board, new RegExp(f.replace('.', '\\.')), `LineBoard references ${f}`);
  }
  assert.match(board, /preload="none"/, 'no video bytes before it is on screen');
  assert.match(board, /prefers-reduced-motion: reduce/, 'reduced motion keeps the poster');
  assert.match(board, /data-src=/, 'the src is attached only when visible');
  const { STATIONS } = await import('../src/data/offers.js');
  const sentences = board.match(/const LINE_SENTENCES = \[([\s\S]*?)\];/)[1].match(/'[^']+'/g);
  assert.equal(sentences.length, STATIONS.length, 'one sentence per station');
  // The two compositions speak the same sentences as the page's screen-reader list.
  for (const p of ['videos/hero-line/shot-plan.json', 'videos/hero-line-mobile/shot-plan.json']) {
    const plan = read(p);
    for (const s of sentences) assert.ok(plan.includes(s.slice(1, -1)), `${p} lacks ${s}`);
  }
});

// ── Station artwork: Higgsfield scenes, placed only as a full set (2026-10-04) ──
test('station art ships whole or not at all, from clean files', async () => {
  const { STATION_ART, ART_COMPLETE, artFor } = await import('../astro-site/src/data/stationArt.js');
  const { ALL_LEVELS } = await import('../src/data/pricing.js');
  for (const [level, art] of Object.entries(STATION_ART)) {
    assert.ok(ALL_LEVELS.includes(level), `${level} is not a station`);
    const p = join('public/art/stations', art.file);
    assert.ok(existsSync(join(ROOT, p)), `${p} is missing`);
    const svg = read(p);
    assert.match(svg, /^<svg [^>]*viewBox="0 0 2048 1509"/, `${p} keeps the shared 4:3 viewBox`);
    // Generated files arrive with a C2PA manifest; scripts or external refs never belong in an <img> asset.
    assert.doesNotMatch(svg, /<metadata|c2pa|<script|href=|preserveAspectRatio="none"/i, `${p} is not cleaned`);
    assert.ok(svg.length < 40_000, `${p} is not minified (${svg.length} bytes)`);
  }
  assert.equal(ART_COMPLETE, ALL_LEVELS.every((l) => STATION_ART[l]));
  for (const level of ALL_LEVELS) {
    if (ART_COMPLETE) assert.match(artFor(level).src, /^\/art\/stations\/[a-z0-9-]+\.svg$/);
    else assert.equal(artFor(level), null, 'no scene renders until all eight exist');
  }
  // Every course surface places it, so finishing the set needs no template edit.
  for (const p of ['astro-site/src/pages/courses/index.astro', 'astro-site/src/pages/courses/[level].astro', 'astro-site/src/components/linie/LineSection.astro']) {
    assert.match(read(p), /<StationArt level=/, `${p} places the station art`);
  }
});
