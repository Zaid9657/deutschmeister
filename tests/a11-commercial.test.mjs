// DeutschStart A1.1 commercial contract — plan:
// docs/superpowers/plans/2026-09-15-deutschstart-a11-course-readiness.md Task 1.
//
// A1.1 becomes a €39 one-time guided-course product (course_a1_1) while the
// public A1.1 library (grammar, vocabulary, reading, listening) stays free:
// FREE_LEVELS is untouched and only the guided course carries the paywall.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEVEL_COURSES } from '../src/data/pricing.js';
import { FREE_LEVELS } from '../src/config/freeTier.js';

test('A1.1 is a €39 guided-course product while its public library stays free', () => {
  assert.deepEqual(LEVEL_COURSES.course_a1_1, {
    key: 'course_a1_1',
    code: 'A1.1',
    name: 'DeutschStart A1.1',
    nameDe: 'DeutschStart A1.1',
    price: 39,
    proDays: 90,
    proMonths: 3,
    levels: ['a1.1'],
    previewLessons: 3,
    comingSoon: false,
  });
  assert.ok(FREE_LEVELS.includes('a1.1'));
});

test('client and webhook expose the A1.1 Lemon Squeezy variant names', () => {
  const client = readFileSync(new URL('../src/config/lemonsqueezy.js', import.meta.url), 'utf8');
  const webhook = readFileSync(new URL('../netlify/functions/lemonsqueezy-webhook.mjs', import.meta.url), 'utf8');
  assert.match(client, /VITE_LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID/);
  assert.match(webhook, /LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID/);
});
