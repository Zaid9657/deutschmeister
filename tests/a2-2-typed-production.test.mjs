// Guard suite for Course Factory Wave 5 PR A2 (typed production exercises
// added to the eight pre-existing A2.2 grammar topics, plus a depth patch
// for the six thin ones). Mirrors tests/a2-1-typed-production.test.mjs
// (Wave 4 PR A2 / #83).
//
// What it pins, and why:
//
//   1. Every A2.2 topic (all 12: the eight extended here and the four Wave 5
//      PR A created) has >=10 exercises that are BOTH non-multiple_choice AND
//      options: null -- the exact shape ExercisePlayer.jsx renders as a text
//      input. Before this PR the eight older topics had zero.
//   2. The eight extended topics keep a unique, contiguous global exercise
//      order_index 1..n across stages 4 and 5 (EXTEND mode continues the
//      global counter; re-checked here against the artifact that ships). The
//      four PR-A topics number per stage and are exempt from contiguity.
//   3. The six thin topics (reflexive-verbs, simple-past-sein-haben,
//      coordinating-conjunctions, comparative, superlative, future-tense) now
//      carry >=8 rules and >=12 examples, incl. one common_mistakes rule.
//   4. The migration file has the expected shape: 80 exercise INSERTs, 18 rule
//      INSERTs, 24 example INSERTs, 0 topic INSERTs, and no topic_order
//      CHECK-widening block (EXTEND mode never emits one).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache = JSON.parse(readFileSync(join(ROOT, 'grammar-content-cache.json'), 'utf8'));
const MIGRATION = join(ROOT, 'migrations', '2026-09-06-a2-2-typed-production.sql');

const EXTENDED_8 = [
  'reflexive-verbs', 'simple-past-sein-haben', 'coordinating-conjunctions', 'subordinating-conjunctions',
  'subordinate-word-order', 'comparative', 'superlative', 'future-tense',
];
const DEPTH_PATCHED = ['reflexive-verbs', 'simple-past-sein-haben', 'coordinating-conjunctions', 'comparative', 'superlative', 'future-tense'];

const a22Topics = cache.topics.filter((t) => t.sub_level === 'A2.2');
const exercisesOf = (topic) => cache.exercises.filter((e) => e.topic_id === topic.id);
const isTyped = (e) => e.exercise_type !== 'multiple_choice' && e.options === null;

test('A2.2 has exactly 12 topics in the cache', () => {
  assert.equal(a22Topics.length, 12);
});

test('every A2.2 topic has >=10 typed (non-multiple_choice, options: null) exercises', () => {
  for (const topic of a22Topics) {
    const typed = exercisesOf(topic).filter(isTyped);
    assert.ok(typed.length >= 10, `${topic.slug}: expected >=10 typed exercises, found ${typed.length}`);
  }
});

test('the eight extended topics keep a unique, contiguous global exercise order_index 1..n', () => {
  for (const slug of EXTENDED_8) {
    const topic = a22Topics.find((t) => t.slug === slug);
    assert.ok(topic, `topic "${slug}" missing at A2.2`);
    const orders = exercisesOf(topic).map((e) => e.order_index).sort((a, b) => a - b);
    assert.deepEqual(orders, Array.from({ length: orders.length }, (_, i) => i + 1), `${slug}: order_index not contiguous 1..n`);
  }
});

test('the six depth-patched topics carry >=8 rules incl. common_mistakes and >=12 examples', () => {
  for (const slug of DEPTH_PATCHED) {
    const topic = a22Topics.find((t) => t.slug === slug);
    const rules = cache.rules.filter((r) => r.topic_id === topic.id);
    const examples = cache.examples.filter((e) => e.topic_id === topic.id);
    assert.ok(rules.length >= 8, `${slug}: expected >=8 rules, found ${rules.length}`);
    assert.ok(rules.some((r) => r.rule_type === 'common_mistakes'), `${slug}: no common_mistakes rule`);
    assert.ok(examples.length >= 12, `${slug}: expected >=12 examples, found ${examples.length}`);
  }
});

test('the migration has 80 exercise, 18 rule, 24 example and 0 topic INSERTs, and never widens the CHECK', () => {
  const sql = readFileSync(MIGRATION, 'utf8');
  const count = (table) => (sql.match(new RegExp(`INSERT INTO public\\.${table} `, 'g')) || []).length;
  assert.equal(count('grammar_exercises'), 80);
  assert.equal(count('grammar_rules'), 18);
  assert.equal(count('grammar_examples'), 24);
  assert.equal(count('grammar_topics'), 0);
  assert.doesNotMatch(sql, /grammar_topics_topic_order_check/);
});
