// Guard suite for the four A1.1 topics added in Course Factory Wave 2 PR A
// (possessive-articles, separable-verbs-intro, yes-no-questions, time-and-dates).
//
// What it pins, and why:
//
//   1. The four slugs exist at sub_level A1.1, topic_order 9-12 (topic-order.test.mjs
//      already pins the SPA/cache slug+order agreement generally; this pins the
//      specific new topics so a future edit cannot quietly drop or reorder one).
//   2. Every one of the four has >=26 exercises, >=16 of them typed (rendered as a
//      text input by ExercisePlayer.jsx, which ignores `options` for anything but
//      multiple_choice), and every typed exercise has options === null — the
//      contract scripts/grammar-topics-from-json.mjs enforces at generation time,
//      re-checked here against the artifact that actually ships.
//   3. Every multiple_choice exercise has exactly 4 options containing
//      correct_answer verbatim (ExercisePlayer renders the 4 options and compares
//      against correct_answer by reference equality of trimmed strings).
//   4. The migration file's topic_order CHECK is textually 1..12 — so DB (once
//      applied), cache and code cannot drift silently: if a future edit widens the
//      cache/code to a 13th A1.1 topic without touching the CHECK, this fails loudly
//      instead of shipping content nothing can ever legally read past position 12.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache = JSON.parse(readFileSync(join(ROOT, 'grammar-content-cache.json'), 'utf8'));

const NEW_SLUGS = ['possessive-articles', 'separable-verbs-intro', 'yes-no-questions', 'time-and-dates'];
const EXPECTED_ORDER = { 'possessive-articles': 9, 'separable-verbs-intro': 10, 'yes-no-questions': 11, 'time-and-dates': 12 };

test('the four new A1.1 topics exist at the expected topic_order', () => {
  for (const slug of NEW_SLUGS) {
    const topic = cache.topics.find((t) => t.slug === slug && t.sub_level === 'A1.1');
    assert.ok(topic, `topic "${slug}" not found at sub_level A1.1 in the cache`);
    assert.equal(topic.topic_order, EXPECTED_ORDER[slug], `topic "${slug}" has the wrong topic_order`);
  }
});

test('A1.1 now has exactly 12 topics, 1..12 with no gaps or duplicates', () => {
  const orders = cache.topics
    .filter((t) => t.sub_level === 'A1.1')
    .map((t) => t.topic_order)
    .sort((a, b) => a - b);
  assert.deepEqual(orders, Array.from({ length: 12 }, (_, i) => i + 1));
});

test('each new topic has >=26 exercises, >=16 typed, and every typed exercise has options: null', () => {
  for (const slug of NEW_SLUGS) {
    const topic = cache.topics.find((t) => t.slug === slug && t.sub_level === 'A1.1');
    const exercises = cache.exercises.filter((e) => e.topic_id === topic.id);
    assert.ok(exercises.length >= 26, `${slug}: expected >=26 exercises, found ${exercises.length}`);

    const typed = exercises.filter((e) => e.exercise_type !== 'multiple_choice');
    assert.ok(typed.length >= 16, `${slug}: expected >=16 typed exercises, found ${typed.length}`);

    for (const e of typed) {
      assert.equal(
        e.options,
        null,
        `${slug}: typed exercise (stage ${e.stage}, order ${e.order_index}, type ${e.exercise_type}) must have options: null`,
      );
    }
  }
});

test('each new topic\'s multiple_choice exercises have exactly 4 options containing correct_answer verbatim', () => {
  for (const slug of NEW_SLUGS) {
    const topic = cache.topics.find((t) => t.slug === slug && t.sub_level === 'A1.1');
    const mc = cache.exercises.filter((e) => e.topic_id === topic.id && e.exercise_type === 'multiple_choice');
    assert.ok(mc.length > 0, `${slug}: expected at least one multiple_choice exercise`);
    for (const e of mc) {
      assert.equal(
        Array.isArray(e.options) && e.options.length,
        4,
        `${slug}: multiple_choice (stage ${e.stage}, order ${e.order_index}) must have exactly 4 options`,
      );
      assert.ok(
        e.options.includes(e.correct_answer),
        `${slug}: multiple_choice (stage ${e.stage}, order ${e.order_index}) correct_answer "${e.correct_answer}" is not verbatim among its options`,
      );
    }
  }
});

test('each new topic has 8-10 examples', () => {
  for (const slug of NEW_SLUGS) {
    const topic = cache.topics.find((t) => t.slug === slug && t.sub_level === 'A1.1');
    const examples = cache.examples.filter((e) => e.topic_id === topic.id);
    assert.ok(
      examples.length >= 8 && examples.length <= 10,
      `${slug}: expected 8-10 examples, found ${examples.length}`,
    );
  }
});

test('the migration widens the topic_order CHECK to 1..12', () => {
  const sql = readFileSync(join(ROOT, 'migrations', '2026-09-05-a1-1-new-topics.sql'), 'utf8');
  const match = sql.match(/CHECK\s*\(\s*topic_order\s*>=\s*1\s*AND\s*topic_order\s*<=\s*(\d+)\s*\)/i);
  assert.ok(match, 'migration file does not contain the expected topic_order CHECK');
  assert.equal(Number(match[1]), 12, `migration widens topic_order CHECK to ${match[1]}, expected 12`);
});
