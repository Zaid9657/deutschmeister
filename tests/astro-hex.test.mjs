// The design tokens are the only place a colour is written (CLAUDE.md, "Design
// tokens"). The SPA has been held to that by tests/brand.test.mjs; the static
// site was not, and by 2026-10 its layout, homepage and stylesheet carried
// sixteen-plus hex literals that a token change could never reach (the nav
// seal, theme-color, the focus outline, the course return bar, the aurora).
// v4 ("Die Linie") moved every one of them onto the tokens; this keeps it so.
//
// Rule: no colour literal (#rgb / #rrggbb) in astro-site/src outside
// data/design-tokens.js. HTML entities (&#8594;) are not colours. Data files
// that quote a review reference like "#115" are not styling either — they are
// listed by name, so a new exception is a decision, not a drift.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'astro-site/src');
const ALLOWED = new Set([
  'astro-site/src/data/design-tokens.js', // the one place colours are written
  'astro-site/src/data/curricula/a11.js', // quotes review finding "#115" in prose, not a colour
]);
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(astro|css|js|jsx|mjs)$/.test(name)) out.push(p);
  }
  return out;
};
const HEX = /(?<![&\w])#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

test('no colour literal in the static site outside the design tokens', () => {
  const offenders = [];
  for (const file of walk(SRC)) {
    const rel = relative(ROOT, file);
    if (ALLOWED.has(rel)) continue;
    for (const m of readFileSync(file, 'utf8').matchAll(HEX)) offenders.push(`${rel}: ${m[0]}`);
  }
  assert.deepEqual(offenders, [], 'use a token class or theme() — design-tokens.js is the one place a hex is written');
});
