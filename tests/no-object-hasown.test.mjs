// Guard: no browser code calls Object.hasOwn (ACC-09, cross-check 2026-10-25).
//
// The SPA's Vite build targets Safari 14 (Vite 5's default: es2020, edge88,
// firefox78, chrome87, safari14), which has no Object.hasOwn, and esbuild does
// not polyfill it (src/lib/planStatus.js already said so). Two checkout
// helpers called it anyway: /subscription/success runs checkoutProductKey()
// in its first render, so on Safari < 15.4 the payment confirmation fell into
// the error boundary, and the /subscription poll threw the same way. The
// checkpoint feedback grouping had the third call.
//
// The rule: a ratchet at zero over src/ and astro-site/src (comments ignored),
// plus the helpers run with Object.hasOwn removed, as on Safari 14.
// netlify/functions run on Node and are out of scope.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { checkoutEntitlementConfirmed, checkoutProductKey, isRecurringProduct } from '../src/lib/checkoutAccess.js';
import { sectionComplete } from '../src/lib/checkpoint/feedback.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Block and line comments out, so a comment that names the method cannot trip the scan. */
const code = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:\\])\/\/.*$/gm, '$1');

const browserFiles = () => {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (/\.(jsx?|mjs|astro)$/.test(entry.name)) out.push(rel);
    }
  };
  ['src', 'astro-site/src'].forEach(walk);
  return out;
};

test('no browser source calls Object.hasOwn (ratchet at 0)', () => {
  const files = browserFiles();
  assert.ok(files.length > 100, `only ${files.length} browser files were scanned`);
  const offenders = files.filter((file) => /\bObject\.hasOwn\s*\(/.test(code(readFileSync(join(ROOT, file), 'utf8'))));
  assert.deepEqual(offenders, [], `Object.hasOwn breaks Safari < 15.4; use Object.prototype.hasOwnProperty.call:\n  ${offenders.join('\n  ')}`);
});

test('the scan recognises the call it bans (not vacuous)', () => {
  assert.match(code('const a = Object.hasOwn(PLANS, key);'), /\bObject\.hasOwn\s*\(/);
  assert.doesNotMatch(code('// not Object.hasOwn(x): Safari 14'), /\bObject\.hasOwn\s*\(/);
});

test('the checkout and checkpoint helpers work on a browser without Object.hasOwn (Safari 14)', () => {
  const saved = Object.hasOwn;
  delete Object.hasOwn;
  try {
    assert.equal(isRecurringProduct('monthly'), true);
    assert.equal(isRecurringProduct('course_a1_2'), false);
    assert.equal(isRecurringProduct('toString'), false, 'an inherited name is not a product');
    assert.equal(checkoutProductKey('course_a1_2'), 'course_a1_2');
    assert.equal(checkoutProductKey('course_a1'), 'course_a1', 'a retired band key still resolves');
    assert.equal(checkoutProductKey('not-a-product'), null);
    assert.equal(checkoutProductKey(undefined), null);
    assert.equal(checkoutEntitlementConfirmed('course_a1_2', { isSubscribed: false, purchases: [{ product_key: 'course_a1_2', status: 'active' }] }), true);
    const items = [{ id: 'a', section: 'lesen' }, { id: 'b', section: 'lesen' }];
    assert.equal(sectionComplete(items, { a: 'x' }, 'lesen'), false);
    assert.equal(sectionComplete(items, { a: 'x', b: 'y' }, 'lesen'), true);
  } finally {
    Object.hasOwn = saved;
  }
});
