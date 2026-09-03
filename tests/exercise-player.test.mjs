// Guard suite for the grammar ExercisePlayer — the only interactive surface in
// the product with paying customers behind it.
//
// The bug this exists to prevent, found 2026-09-03 and present since the file's
// first commit (2026-04-16):
//
//   FillBlank and MultipleChoice each hold local state (`submitted`/`value` and
//   `selected`). The parent rendered them from a bare conditional with NO `key`.
//   React reconciles by position and type, so when one question was followed by
//   another of the SAME type it reused the instance and FillBlank stayed
//   `submitted` into the next question: the input was disabled, still held the
//   previous answer, was marked wrong against a prompt the learner had never
//   seen, and rendered no Check button — while the parent had reset `answered`,
//   so there was no Next button either. The lesson dead-ended with no control on
//   screen, verified in a browser at question 2 of 8 on /grammar/a1.2/question-words/.
//
// It was invisible for five months because nothing renders this file in CI and
// a source read looks entirely reasonable. These are cheap source-level pins,
// in the same spirit as the brand ratchets: they cannot prove the component
// works, only that the two things that made it fail silently are still in place.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'astro-site/src/components/ExercisePlayer.jsx'), 'utf8');

test('both question inputs are keyed, so each question remounts with fresh state', () => {
  // Without these keys the player dead-ends on two same-type questions in a row.
  for (const component of ['MultipleChoice', 'FillBlank']) {
    const rendered = new RegExp(`<${component}\\s+key=\\{`);
    assert.match(
      src,
      rendered,
      `<${component}> is rendered without a key — a same-type question run will reuse the instance and strand the learner`,
    );
  }
});

test('the components that need the key still hold local state', () => {
  // If a future refactor lifts this state into the parent the key stops being
  // load-bearing — but until then, removing it re-introduces the dead end. This
  // pin fails loudly if the premise changes, so the key rule gets re-read
  // rather than silently kept or silently dropped.
  assert.match(src, /function FillBlank[\s\S]{0,400}useState/, 'FillBlank no longer holds local state — re-check the key rule above');
  assert.match(src, /function MultipleChoice[\s\S]{0,400}useState/, 'MultipleChoice no longer holds local state — re-check the key rule above');
});

test('the results screen always offers a way out of the topic', () => {
  // Every branch of the done state must render an action. The screen used to
  // offer only "Practice again", which asks the 89% who just completed a topic
  // to repeat themselves instead of moving on.
  assert.match(src, /Practice again/, 'the retry action is gone');
  assert.match(src, /nextHref/, 'the results screen no longer offers the next topic');
});
