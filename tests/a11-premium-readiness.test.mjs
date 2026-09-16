// Premium-readiness gate for DeutschStart A1.1 — plan:
// docs/superpowers/plans/2026-09-15-deutschstart-a11-course-readiness.md Task 3.
//
// Two truths a €39 course must hold before it is marketed as premium:
//   1. every planned course clip has CURRENT recorded audio (no
//      "Computerstimme" behind a paid curtain), and
//   2. every lesson links one listening and one reading practice.
//
// HONESTY MODEL. The audio manifest can only be filled by the owner's Azure
// run (docs/owner-prompts.md) — an external checkpoint no CI run can satisfy.
// So the audio assertions run in two modes:
//   * `npm test` — while the manifest is still the empty stub the audio test
//     SKIPS with a loud reason (the gap stays visible in every test run, and
//     the moment the manifest is populated the assertions arm themselves and
//     catch stale clips);
//   * `npm run verify:a11-release` (A11_RELEASE_GATE=1) — the release gate,
//     where a missing or stale clip is a hard FAIL. Release evidence must
//     quote THIS mode, never plain `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import manifest from '../src/data/curricula/a11.audio.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { planRenders, sha1 } from '../scripts/generate-course-audio.mjs';

const RELEASE_GATE = process.env.A11_RELEASE_GATE === '1';
const manifestEmpty = !manifest.generatedAt && Object.keys(manifest.lektionen || {}).length === 0;
const audioSkip = !RELEASE_GATE && manifestEmpty
  ? 'RELEASE GATE NOT MET: a11.audio.js is the empty stub — recorded audio pending the owner Azure run (docs/owner-prompts.md). Run `npm run verify:a11-release` to enforce.'
  : false;

test('every planned A1.1 course clip has a current recorded-audio entry', { skip: audioSkip }, () => {
  const planned = planRenders(CURRICULUM_A11).filter((entry) => entry.lektionId);
  assert.ok(planned.length > 0, 'planRenders returned nothing — generator broken');
  for (const entry of planned) {
    const actual = manifest.lektionen?.[entry.lektionId]?.[entry.key];
    assert.ok(actual?.url, `${entry.lektionId}/${entry.key} has no recorded audio`);
    assert.equal(actual.sha1, sha1(entry.text), `${entry.lektionId}/${entry.key} audio is stale`);
  }
});

test('every A1.1 lesson links listening and reading practice', () => {
  for (const lesson of CURRICULUM_A11.lektionen) {
    assert.ok(Number.isInteger(lesson.links?.listeningExercise), `${lesson.id} lacks linked listening`);
    assert.ok(Number.isInteger(lesson.links?.readingOrder), `${lesson.id} lacks linked reading`);
  }
});

test('the AI writing feedback addresses the learner as Sie (review #23 minor 46)', async () => {
  // The one text the course speaks directly to the learner without a fixed
  // register was the KI feedback. The prompt now pins Sie; this pins the pin,
  // the way tests/claims.test.mjs pins the limits.
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../netlify/functions/evaluate-writing.mjs', import.meta.url), 'utf8');
  assert.match(
    src,
    /Sprechen Sie den Schüler im Feedback, in "strengths" und "improvements" mit Sie an/,
    'buildWritingPrompt no longer pins the Sie register of the feedback',
  );
});
