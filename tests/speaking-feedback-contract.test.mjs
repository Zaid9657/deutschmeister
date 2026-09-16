// Guided feedback contract — plan:
// docs/superpowers/plans/2026-09-15-speaking-guided-city-map.md Task 2.
//
// The three signals stay separate (task / language / pronunciation) and the
// normalizer is the only door: unknown properties are dropped, out-of-range
// scores throw, and pronunciation without provider evidence throws — a
// transcript-derived "pronunciation score" can never reach the UI.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGuidedFeedback, FeedbackContractError } from '../src/features/speaking/feedbackModel.js';

const valid = () => ({
  transcript: 'Ich möchte einen Kaffee, bitte.',
  reply: { text: 'Sehr gern. Möchten Sie Milch?', audioBase64: 'UklGRiQAAABXQVZF' },
  task: { passed: true, completedCriteria: ['ordered_item'], nextGoal: null },
  language: { bestVersion: 'Ich möchte einen Kaffee, bitte.', tip: 'Sehr gut.' },
  pronunciation: {
    provider: 'azure-speech',
    accuracy: 84, fluency: 78, completeness: 100,
    words: [{ word: 'Kaffee', accuracy: 72, phonemes: [{ phoneme: 'a', accuracy: 68 }] }],
  },
});

test('a valid payload normalizes with all three signals intact', () => {
  const fb = normalizeGuidedFeedback(valid());
  assert.equal(fb.task.passed, true);
  assert.deepEqual(fb.task.completedCriteria, ['ordered_item']);
  assert.equal(fb.language.bestVersion, 'Ich möchte einen Kaffee, bitte.');
  assert.equal(fb.pronunciation.accuracy, 84);
  assert.equal(fb.pronunciation.words[0].phonemes[0].accuracy, 68);
});

test('missing task fields are rejected', () => {
  const bad = valid();
  delete bad.task.passed;
  assert.throws(() => normalizeGuidedFeedback(bad), FeedbackContractError);
  const bad2 = valid();
  delete bad2.task;
  assert.throws(() => normalizeGuidedFeedback(bad2), FeedbackContractError);
});

test('out-of-range scores are rejected, never clamped into fake truth', () => {
  for (const patch of [
    (p) => { p.pronunciation.accuracy = 140; },
    (p) => { p.pronunciation.fluency = -3; },
    (p) => { p.pronunciation.words[0].accuracy = 'hoch'; },
  ]) {
    const bad = valid();
    patch(bad);
    assert.throws(() => normalizeGuidedFeedback(bad), FeedbackContractError);
  }
});

test('pronunciation without provider evidence throws — no transcript-derived scores', () => {
  const bad = valid();
  delete bad.pronunciation.provider;
  assert.throws(() => normalizeGuidedFeedback(bad), FeedbackContractError);
  const wrong = valid();
  wrong.pronunciation.provider = 'gpt-transcript-estimate';
  assert.throws(() => normalizeGuidedFeedback(wrong), FeedbackContractError);
});

test('pronunciation may be honestly unavailable', () => {
  const p = valid();
  p.pronunciation = null;
  const fb = normalizeGuidedFeedback(p);
  assert.equal(fb.pronunciation, null);
});

test('oversized transcripts are rejected', () => {
  const bad = valid();
  bad.transcript = 'a'.repeat(5001);
  assert.throws(() => normalizeGuidedFeedback(bad), FeedbackContractError);
});

test('unknown properties are stripped so nothing renderable can be smuggled in', () => {
  const sneaky = valid();
  sneaky.injected = '<img src=x onerror=alert(1)>';
  sneaky.task.extra = '<script>';
  const fb = normalizeGuidedFeedback(sneaky);
  assert.ok(!('injected' in fb));
  assert.ok(!('extra' in fb.task));
});
