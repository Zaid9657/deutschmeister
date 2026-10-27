// The dashboard's Review card brings back grammar a learner has already learned
// (C-197). It linked cur.nextTopic — the next NEW topic, the same link as the
// hero for B1+ learners — so nothing on the dashboard ever revisited a finished
// topic. reviewTopic (src/services/currentPosition.js) picks the finished topic
// most worth revisiting: the lowest best score, then the oldest completion,
// from the placement floor up. It relies on the progress keys landing on the
// right topics (tests/topic-order.test.mjs) and on a weaker re-run never
// erasing a completion (tests/grammar-attempt-merge.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { reviewTopic, deriveCurrent } from '../src/services/currentPosition.js';
import { getTopicsForLevel } from '../src/data/grammarTopics.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const A11 = getTopicsForLevel('a1.1');
const A12 = getTopicsForLevel('a1.2');
const B11 = getTopicsForLevel('b1.1');

/** useProgress() shape from [level, topic, { score, completedAt, completed }] entries. */
function progressOf(entries) {
  const p = {};
  for (const [level, topic, entry] of entries) {
    p[level] ??= { grammarTopics: {} };
    p[level].grammarTopics[topic.id] = { completed: true, progress: 100, ...entry };
  }
  return p;
}

test('nothing finished → no review topic (the card keeps the current topic)', () => {
  assert.equal(reviewTopic({}, null), null);
  assert.equal(reviewTopic(progressOf([['a1.1', A11[0], { completed: false, score: 40 }]]), null), null, 'started is not finished');
});

test('the lowest best score among finished topics, then the oldest completion', () => {
  const progress = progressOf([
    ['a1.1', A11[0], { score: 95, completedAt: '2026-09-01T10:00:00Z' }],
    ['a1.1', A11[1], { score: 72, completedAt: '2026-09-10T10:00:00Z' }],
    ['a1.1', A11[2], { score: 72, completedAt: '2026-09-03T10:00:00Z' }],
    ['a1.2', A12[0], { score: 88, completedAt: '2026-08-01T10:00:00Z' }],
  ]);
  const r = reviewTopic(progress, null);
  assert.equal(r.level, 'a1.1');
  assert.equal(r.topic.slug, A11[2].slug, 'tie on 72: the older completion');
  assert.equal(r.score, 72);
  assert.equal(r.completedAt, '2026-09-03T10:00:00Z');

  const undated = progressOf([
    ['a1.1', A11[0], { score: 80, completedAt: '2026-09-01T10:00:00Z' }],
    ['a1.1', A11[3], { score: 80, completedAt: null }],
  ]);
  assert.equal(reviewTopic(undated, null).topic.slug, A11[3].slug, 'a completion with no date counts as the oldest');
});

test('the placement floor holds: topics placed out of are not offered for review', () => {
  const progress = progressOf([
    ['a1.1', A11[0], { score: 70, completedAt: '2026-09-01T10:00:00Z' }],
    ['b1.1', B11[0], { score: 90, completedAt: '2026-09-02T10:00:00Z' }],
  ]);
  assert.equal(reviewTopic(progress, 'B1.1').topic.slug, B11[0].slug, 'DB spelling (B1.1) normalised');
  assert.equal(reviewTopic(progress, null).topic.slug, A11[0].slug);
  assert.equal(reviewTopic(progressOf([['a1.1', A11[0], { score: 70 }]]), 'B1.1'), null);
});

test('the review topic is a finished topic, never the next new one the hero shows', () => {
  const progress = progressOf(A11.slice(0, 3).map((t, i) => ['a1.1', t, { score: 75 + i, completedAt: `2026-09-0${i + 1}T10:00:00Z` }]));
  const cur = deriveCurrent(progress, null);
  const r = reviewTopic(progress, null);
  assert.notEqual(r.topic.id, cur.nextTopic.id);
  assert.equal(r.topic.id, A11[0].id);
});

test('the dashboard Review card opens the review topic, falling back to the current topic', () => {
  const dash = read('src/pages/DashboardPage.jsx');
  assert.match(dash, /import \{ deriveCurrent, isTopicCompleted, topicPercent, reviewTopic \} from '\.\.\/services\/currentPosition';/);
  assert.match(dash, /reviewTopic\(progress, profile\?\.current_level\)/);
  assert.match(dash, /to: `\/grammar\/\$\{review\.level\}\/\$\{review\.topic\.slug\}\/`, fullLoad: true/, 'grammar is Astro-served: a full load with a slash');
  assert.match(dash, /: \{ title: 'Review', en: 'Revisit your current grammar topic'/, 'the fallback');
});
