// The founder's promise (2026-11-09) renders only in its sanctioned wording, with its reason. The rule
// that no page pledges repayment is guarded by tests/refund-claims.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { PROMISE_LINE, PROMISE_REASON } from '../src/data/marketing.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const walk = (dir) => readdirSync(new URL(`../${dir}`, import.meta.url)).flatMap((name) => {
  const rel = `${dir}/${name}`;
  return statSync(new URL(`../${rel}`, import.meta.url)).isDirectory() ? walk(rel) : [rel];
});

test('the promise is the founder\'s wording and carries its reason', () => {
  assert.equal(PROMISE_LINE, 'The best online German courses. 10 times more efficient.');
  assert.match(PROMISE_REASON, /every minute is yours/);
});

test('home, pricing and the offer pages render the promise from marketing.js, never a typed copy', () => {
  assert.match(read('astro-site/src/pages/index.astro'), /\{PROMISE_LINE\}<\/strong> \{PROMISE_REASON\}/);
  for (const page of ['astro-site/src/pages/pricing.astro', 'astro-site/src/components/concept/OfferPage.astro']) {
    assert.match(read(page), /<PromiseBand \/>/, page);
  }
  const band = read('astro-site/src/components/concept/PromiseBand.astro');
  assert.match(band, /\{PROMISE_LINE\}/);
  assert.match(band, /\{PROMISE_REASON\}/);
  for (const file of walk('astro-site/src').filter((f) => /\.(astro|jsx?)$/.test(f) && !f.endsWith('data/marketing.js'))) {
    assert.doesNotMatch(read(file), /10 times more efficient|10x (faster|better)/i, `${file} retypes the promise`);
  }
});
