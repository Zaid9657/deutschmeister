import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkpointFeedback, sectionComplete } from '../src/lib/checkpoint/feedback.js';
import { buildCheckpoint, paperSeed, scoreCheckpoint } from '../src/lib/checkpoint/buildCheckpoint.js';
import { anyCurriculumFor } from '../src/data/curricula/index.js';

test('graded Lesen releases correctness, key and explanations only after the entire dependency group', () => {
  const items = ['left', 'right'].map((id, n) => ({
    id, section: 'lesen', mode: 'options', options: ['A', 'B'],
    answer: n ? 'B' : 'A', accepted: [n ? 'B' : 'A'],
    explanationDe: `Begründung ${n}`, explanationEn: `Reason ${n}`,
  }));
  const answers = {};
  assert.equal(sectionComplete([], answers, 'lesen'), false);
  for (const item of items) {
    // A wrong response, including the last item's receipt, gives no signal.
    const answer = item.options.find((option) => option !== item.answer);
    assert.deepEqual(checkpointFeedback(item, answer, { graded: true }), { answer });
    answers[item.id] = answer;
    const complete = sectionComplete(items, answers, 'lesen');
    for (const previous of items.filter((it) => Object.hasOwn(answers, it.id))) {
      const feedback = checkpointFeedback(previous, answers[previous.id], { graded: true, complete });
      if (!complete) assert.deepEqual(feedback, { answer: answers[previous.id] });
      else {
        assert.equal(feedback.correct, false);
        assert.equal(feedback.key, previous.answer);
        assert.equal(feedback.explanationDe, previous.explanationDe);
        assert.equal(feedback.explanationEn, previous.explanationEn);
      }
    }
  }
  assert.equal(checkpointFeedback(items[0], 'A', { graded: true, complete: true }).correct, true);
  assert.equal(checkpointFeedback(items[0], 'B').correct, false, 'ungraded practice remains immediate');
  assert.equal(checkpointFeedback({ ...items[0], section: 'bausteine' }, 'A', { graded: true }).correct, true);
});

// Only the answer surface and previously RELEASED feedback reach the strategy.
// No text, IDs, keys or pair metadata enter its decision.
function sequentialScore(items, release) {
  const seen = new Map();
  const answers = {};
  for (const item of items) {
    const group = /^Wer\b/.test(item.promptDe) ? 'who' : 'other';
    const alphabetical = item.options[0].localeCompare(item.options[1], 'de') < 0 ? 0 : 1;
    const first = item.options[0].length === item.options[1].length ? alphabetical : 1 - alphabetical;
    const position = seen.has(group) ? 1 - seen.get(group) : first;
    answers[item.id] = item.options[position];
    // Until feedback is released, the static strategy flips its earlier guess.
    const feedback = release(item, answers[item.id], sectionComplete(items, answers, 'lesen'));
    seen.set(group, feedback.key === undefined ? position : item.options.indexOf(feedback.key));
  }
  return scoreCheckpoint(items, answers).sections.lesen.correct;
}

test('16 A1.2 papers: deferred sequential strategy equals static 42/64; premature-feedback mutation reaches 53/64', () => {
  const curriculum = anyCurriculumFor('a1.2');
  const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a12.json', import.meta.url), 'utf8'));
  const totals = { static: 0, deferred: 0, premature: 0 };
  let papers = 0;
  for (const checkpoint of curriculum.checkpoints) for (let round = 0; round < 4; round += 1) {
    const items = buildCheckpoint({ curriculum, checkpoint, pool, seed: paperSeed(checkpoint, round) }).filter((it) => it.section === 'lesen');
    const fixed = sequentialScore(items, () => ({}));
    const deferred = sequentialScore(items, (item, answer, complete) => checkpointFeedback(item, answer, { graded: true, complete }));
    assert.equal(deferred, fixed, `${checkpoint.id}/${round}: feedback improved the score`);
    totals.static += fixed;
    totals.deferred += deferred;
    totals.premature += sequentialScore(items, (item, answer) => checkpointFeedback(item, answer, { graded: true, complete: true }));
    papers += 1;
  }
  assert.equal(papers, 16);
  assert.deepEqual(totals, { static: 42, deferred: 42, premature: 53 });
  assert.throws(() => assert.equal(totals.premature, totals.static), 'early-feedback mutation must violate the gate');
  console.log('M15-1 audit: 16 papers; static 42/64; deferred 42/64; premature mutation 53/64 (caught)');
});

test('both levels preserve answers and scores through deferred Lesen feedback on all 16 papers', () => {
  for (const level of ['a1.1', 'a1.2']) {
    const curriculum = anyCurriculumFor(level);
    const pool = JSON.parse(readFileSync(new URL(`../src/data/lessonPools/${level.replace('.', '')}.json`, import.meta.url), 'utf8'));
    for (const checkpoint of curriculum.checkpoints) for (let round = 0; round < 4; round += 1) {
      const items = buildCheckpoint({ curriculum, checkpoint, pool, seed: paperSeed(checkpoint, round) });
      const answers = Object.fromEntries(items.map((item, n) => [item.id, n % 2 ? item.answer : 'wrong']));
      const before = structuredClone(answers);
      const score = scoreCheckpoint(items, answers);
      for (const item of items.filter((it) => it.section === 'lesen')) {
        const receipt = checkpointFeedback(item, answers[item.id], { graded: true });
        assert.deepEqual(receipt, { answer: answers[item.id] });
        const review = checkpointFeedback(item, receipt.answer, { graded: true, complete: sectionComplete(items, answers, 'lesen') });
        assert.equal(review.key, item.answer);
      }
      assert.deepEqual(answers, before);
      assert.deepEqual(scoreCheckpoint(items, answers), score);
    }
  }
});
