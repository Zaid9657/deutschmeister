// Guard suite for the brand surfaces that cannot import the design tokens.
//
// Two jobs:
//
//   1. KEEP THE SYNCED COPY HONEST. netlify/functions/_shared/brand.mjs repeats
//      the token hex values as literals, because the functions bundle cannot
//      reliably reach src/ and public/consent.js is served to the browser
//      verbatim. A synced copy with nothing checking it is just a second
//      opinion waiting to diverge, so every value is compared here.
//
//   2. KEEP THE RETIRED BRAND RETIRED. The amber-to-rose "D" identity was
//      replaced in the chrome during the August remediation, but survived in
//      every email template, the dunning mail, the owner test send, the
//      unsubscribe page and the cookie banner — surfaces nobody looks at until
//      a customer receives one. The ban below is what stops it coming back.
//
// SCOPE NOTE, and it matters: the ban covers marketing and transactional
// surfaces ONLY. `#f43f5e` also appears in src/utils/listeningHelpers.js as the
// B2.1 *level* colour, part of the eight-palette CEFR system, where it means
// something entirely different. A repo-wide sweep for these hexes produces
// false positives; this list is deliberate, not lazy.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { color } from '../src/data/design-tokens.js';
import { BRAND } from '../netlify/functions/_shared/brand.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

test('the email brand copy matches the design tokens', () => {
  assert.equal(BRAND.siegel, color.siegel);
  assert.equal(BRAND.siegelLift, color.siegelLift);
  assert.equal(BRAND.siegelWash, color.siegelWash);
  assert.equal(BRAND.gold, color.gold);
  assert.equal(BRAND.ink, color.ink);
  assert.equal(BRAND.graphite, color.graphite);
  assert.equal(BRAND.rule, color.rule);
  assert.equal(BRAND.paper, color.paper);
});

/** Surfaces a customer or visitor sees, which must all carry the current brand. */
const BRANDED_SURFACES = [
  'netlify/functions/send-welcome-email.mjs',
  'netlify/functions/trial-lifecycle.mjs',
  'netlify/functions/daily-sentence.mjs',
  'netlify/functions/lemonsqueezy-webhook.mjs',
  'netlify/functions/send-daily-test.mjs',
  'netlify/functions/unsubscribe.mjs',
  'public/consent.js',
];

test('no customer-facing surface still ships the retired amber-rose brand', () => {
  // The retired identity's own values. `#f43f5e` is listed here only because
  // these files have no legitimate use for it — see the scope note above.
  const retired = ['#f59e0b', '#f43f5e', '#7c3aed', '#4f46e5'];
  const failures = [];
  let seen = 0;
  for (const file of BRANDED_SURFACES) {
    const body = read(file);
    seen += 1;
    for (const hex of retired) {
      if (body.toLowerCase().includes(hex)) failures.push(`${file} still uses ${hex}`);
    }
  }
  assert.equal(seen, BRANDED_SURFACES.length, 'the surface list did not fully load');
  assert.deepEqual(failures, [], `retired brand still shipping:\n  ${failures.join('\n  ')}`);
});

test('no email template ships a gradient background', () => {
  // Several clients drop CSS gradients. A gradient that fails to paint leaves
  // white text on a white cell, which is how a CTA becomes invisible in Outlook.
  const failures = [];
  for (const file of BRANDED_SURFACES) {
    if (read(file).includes('linear-gradient')) failures.push(file);
  }
  assert.deepEqual(failures, [], `gradients in email/banner surfaces:\n  ${failures.join('\n  ')}`);
});
