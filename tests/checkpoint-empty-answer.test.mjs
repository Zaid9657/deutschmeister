// An empty typed checkpoint answer is not an answer (2026-10-25 cross-check, LSN-08). During a
// graded checkpoint, Enter, a phone keyboard's Go key or Check before typing a dictation or a
// Bausteine answer locked the item as a graded WRONG answer — answer revealed, no retry — and cost a
// point toward the 60 % overall and per-section pass rules. The lesson's PracticeItem never allowed
// it (`canSubmit`); the checkpoint's own item renderer now follows the same rule. The guard is run
// here as the page's own code, against real checkpoint items and the real feedback rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { buildCheckpoint } from '../src/lib/checkpoint/buildCheckpoint.js';
import { checkpointFeedback } from '../src/lib/checkpoint/feedback.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const PAGE = read('src/pages/lesson/CheckpointPage.jsx');
const pool = JSON.parse(read('src/data/lessonPools/a11.json'));
const items = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: CURRICULUM_A11.checkpoints[0], pool });

/** The page's `submit`, bound to one item, with the feedback it sets recorded. */
function submitFor(item, feedback = null) {
  const body = PAGE.match(/const submit = \(answer\) => \{[\s\S]*?\n {2}\};/);
  assert.ok(body, 'CheckpointPage defines submit(answer)');
  const set = [];
  const context = vm.createContext({ item, feedback, graded: true, checkpointFeedback, setFeedback: (f) => set.push(f) });
  vm.runInContext(`${body[0]}\nthis.submit = submit;`, context);
  return { submit: context.submit, set };
}

test('an empty or blank typed answer is never checked, so it is never locked as wrong', () => {
  const typed = items.filter((i) => i.mode === 'typed');
  assert.ok(typed.some((i) => i.kind === 'dictation') && typed.some((i) => i.section === 'bausteine'), 'dictations and Bausteine are typed');
  for (const item of typed) {
    assert.equal(checkpointFeedback(item, '', { graded: true }).correct === true, false, `${item.id}: an empty answer would grade wrong`);
    for (const empty of ['', '   ', '\t', undefined, null]) {
      const { submit, set } = submitFor(item);
      submit(empty);
      assert.deepEqual(set, [], `${item.id}: ${JSON.stringify(empty)} must not be submitted`);
    }
    const { submit, set } = submitFor(item);
    submit(item.answer);
    assert.equal(set.length, 1, `${item.id}: a real answer is checked`);
    if (item.section === 'hoeren') {
      // Graded Hören feedback is deferred until the section is complete (live-fixes batch 2; tests/
      // live-course-batch2.test.mjs), so the answer is recorded now and its verdict released later.
      assert.deepEqual(set[0], { answer: item.answer }, `${item.id}: Hören feedback waits for the section`);
      assert.equal(checkpointFeedback(item, item.answer, { graded: true, complete: true }).correct, true, `${item.id}: released as correct`);
    } else {
      assert.equal(set[0].correct, true);
    }
  }
});

test('choices and an already checked item behave as before', () => {
  const choice = items.find((i) => i.mode === 'options');
  const { submit, set } = submitFor(choice);
  submit(choice.options[0]);
  assert.equal(set.length, 1, 'tapping an option is an answer');
  const typed = items.find((i) => i.mode === 'typed');
  const locked = submitFor(typed, { answer: 'x', correct: false });
  locked.submit(typed.answer);
  assert.deepEqual(locked.set, [], 'a checked item is never re-checked');
});

test('the Check button is disabled while the field is empty, like the lesson item', () => {
  assert.match(PAGE, /const canSubmit = String\(value \|\| ''\)\.trim\(\)\.length > 0;/);
  assert.match(PAGE, /\{!feedback && <Button type="submit" disabled=\{!canSubmit\} className="sm:w-auto">\{t\('action\.check', lang\)\}<\/Button>\}/);
  assert.match(read('src/components/lesson/PracticeItem.jsx'), /const canSubmit = String\(answer \|\| ''\)\.trim\(\)\.length > 0;/, 'the rule the lesson already keeps');
});
