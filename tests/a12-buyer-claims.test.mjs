// What a paying A1.2 learner is told matches what they get (Codex review, 2026-10-14, after the
// first paid course_a1_2 order). Until the rebuilt A1.2 ships, buyers get the legacy 28-day plan:
// a grammar exercise saves its result when finished (a half-done run restarts on reload), a plan
// day is several short activities, exercises are typed AND multiple choice, and the final test
// scores listening and reading only. Each claim below was measured false against that product.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const SURFACES = [
  'src/data/offers.js',
  'astro-site/src/data/offers.js',
  'astro-site/src/pages/courses/[level].astro',
  'astro-site/src/components/linie/Progression.astro',
  'src/pages/SubscriptionSuccessPage.jsx',
];

test('no surface promises more saving than the exercises do', () => {
  for (const p of SURFACES) {
    const src = read(p);
    assert.doesNotMatch(src, /Every answer is saved/i, p);
    assert.doesNotMatch(src, /saved after every answer/i, p);
  }
});

test('no surface miscounts the plan day or the exercise format', () => {
  for (const p of SURFACES) {
    const src = read(p);
    assert.doesNotMatch(src, /One task a day/i, p);
    assert.doesNotMatch(src, /not multiple choice/i, p);
    assert.doesNotMatch(src, /so you know you are done/i, p);
  }
});

test('the final-test result sends a learner to practice at the test\'s own level, never a fixed B1.1', () => {
  const src = read('src/pages/Modelltest/ModelltestResult.jsx');
  assert.doesNotMatch(src, /\/(reading|listening|grammar)\/b1\.1/, 'no hard-coded level in the hints');
  assert.match(src, /sectionHints\(resolved\.gateLevel/, 'hints are built from the test\'s level');
});

test('the legacy certificate states participation, never a level the ticked activities cannot prove', () => {
  const src = read('src/pages/CourseCertificatePage.jsx');
  assert.doesNotMatch(src, /\{testFormat\} level/);
  assert.doesNotMatch(src, /has completed every lesson/);
  assert.match(src, /not an official exam result and not a CEFR certificate/);
});
