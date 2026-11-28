// The store charges tax-inclusive prices (owner switch, 2026-11-11), so every surface that
// shows a price to pay must say so, with the one wording from pricing.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRICE_TAX_NOTE, PRICE_TAX_NOTE_DE } from '../src/data/pricing.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the tax note states that prices include VAT, in both languages', () => {
  assert.equal(PRICE_TAX_NOTE, 'Prices include VAT.');
  assert.equal(PRICE_TAX_NOTE_DE, 'Alle Preise inkl. MwSt.');
});

test('every public price component renders the tax note from pricing.js', () => {
  const surfaces = [
    'astro-site/src/components/concept/Ladder.astro',
    'astro-site/src/components/concept/OfferPage.astro',
    'astro-site/src/pages/courses/index.astro',
    'astro-site/src/pages/courses/[level].astro',
  ];
  for (const path of surfaces) {
    assert.match(read(path), /\{PRICE_TAX_NOTE\}/, `${path} must render PRICE_TAX_NOTE`);
  }
});

test('the app subscription page renders the tax note in the reader\'s language', () => {
  assert.match(read('src/pages/SubscriptionPage.jsx'), /isGerman \? PRICE_TAX_NOTE_DE : PRICE_TAX_NOTE/);
});

test('no price surface retypes the note or claims tax is added on top', () => {
  for (const path of ['astro-site/src/pages/pricing.astro', 'astro-site/src/components/concept/OfferPage.astro', 'src/pages/SubscriptionPage.jsx']) {
    const source = read(path);
    assert.doesNotMatch(source, /plus VAT|zzgl\. MwSt|excl\. VAT/i, `${path} must not say tax is added`);
    assert.doesNotMatch(source, /['"`>]Prices include VAT/, `${path} must not retype the note`);
  }
});

test('pricing and offer wrappers delegate their VAT note to Ladder exactly once', () => {
  const page = read('astro-site/src/pages/pricing.astro');
  const offers = read('astro-site/src/components/concept/Offers.astro');
  const ladder = read('astro-site/src/components/concept/Ladder.astro');
  assert.equal((page.match(/<Ladder\b/g) || []).length, 1);
  assert.equal((offers.match(/<Ladder\b/g) || []).length, 1);
  assert.doesNotMatch(page + offers, /\{PRICE_TAX_NOTE\}/, 'wrappers do not duplicate the child note');
  assert.equal((ladder.match(/\{PRICE_TAX_NOTE\}/g) || []).length, 1);
});

test('completion and placement current-price surfaces render the shared VAT note', () => {
  assert.match(read('src/pages/CourseCompletePage.jsx'), /de \? PRICE_TAX_NOTE_DE : PRICE_TAX_NOTE/);
  assert.match(read('src/components/LevelTest/LevelTestResults.jsx'), /\{PRICE_TAX_NOTE\}/);
});
