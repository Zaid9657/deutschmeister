// Guard suite for the v3 "Die Linie" design layer (src/data/design-tokens.js,
// the section at the end; docs/redesign-2026-10/art-direction.md).
//
//   1. The new palette is legible where the rules allow it to be used, and the
//      rule that keeps it honest — signal yellow is never text on a light
//      ground — is checked against the actual sources.
//   2. The line's yellow can never be mistaken for a case colour (rule 1).
//   3. The motion contract from the art direction holds in the Linie
//      stylesheet and components: strong curves, no `transition: all`, no
//      ease-in on UI, hover motion only behind a fine pointer, a reduced-motion
//      gate, and no scale(0) entrances.

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

test('the Linie palette is legible where the rules use it', () => {
  assert.ok(contrast(linie.ink, linie.DEFAULT) >= 7, 'ink on a linie key (AAA)');
  assert.ok(contrast(linie.DEFAULT, nacht.DEFAULT) >= 7, 'the line and linie text on nacht');
  assert.ok(contrast(linie.DEFAULT, nacht.raised) >= 7, 'linie on a nacht card');
  assert.ok(contrast(nacht.text, nacht.DEFAULT) >= 15, 'body text on nacht');
  assert.ok(contrast(nacht.muted, nacht.raised) >= 7, 'secondary text on a nacht card');
  assert.ok(contrast(linie.ink, linie.wash) >= 12, 'ink on the linie wash');
  // The reason for the amended rule 2: yellow on paper is not text.
  assert.ok(contrast(linie.DEFAULT, color.paper) < 2, 'signal yellow on paper is ~1.4:1 — never text there');
});

test('signal yellow is never mistaken for a case colour (rule 1)', () => {
  for (const [name, k] of Object.entries(kasus)) {
    const d = Math.abs(hue(linie.DEFAULT) - hue(k.line));
    assert.ok(Math.min(d, 360 - d) >= 25, `linie vs ${name}: ${Math.min(d, 360 - d).toFixed(0)}° apart`);
  }
});

test('linie text appears only on dark grounds (nacht or ink)', () => {
  const files = [...walk('astro-site/src'), ...walk('src')].filter((f) => /\.(astro|jsx|js|mjs)$/.test(f));
  const offenders = files.filter((f) => {
    const src = read(f);
    return /\btext-linie(?![-\w])/.test(src) && !/\bbg-(nacht|ink)\b/.test(src);
  });
  assert.deepEqual(offenders, [], 'a file that writes text in signal yellow must set it on a nacht or ink ground');
  assert.ok(contrast(linie.DEFAULT, color.ink) >= 7, 'linie on ink');
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
  assert.match(layout, /<html lang=\{lang\} data-sign=\{signOn \? undefined : 'off'\}>/);
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
