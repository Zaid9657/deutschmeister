// Guard suite for the four A2.2 topics added in Course Factory Wave 5 PR A
// (konjunktiv-ii-polite, verbs-with-prepositions-intro, indirect-questions-intro, infinitive-with-zu-intro).
// Mirrors tests/a2-1-course.test.mjs (Wave 4 PR A / #82).
//
// What it pins, and why:
//
//   1. The four slugs exist at sub_level A2.2, topic_order 9-12, in the decided
//      order — konjunktiv-ii-polite (the gentlest step: the chunk was already allowed at A2.1),
//      verbs-with-prepositions-intro (builds on reflexive-verbs), indirect-questions-intro
//      (builds on subordinate-word-order), infinitive-with-zu-intro (see docs/course-factory-tracker.md
//      Decisions log, 2026-09-06 Wave 5 entry).
//   2. Every one of the four has >=26 exercises, >=16 of them typed (rendered as a
//      text input by ExercisePlayer.jsx, which ignores `options` for anything but
//      multiple_choice), and every typed exercise has options === null.
//   3. Every multiple_choice exercise has exactly 4 options containing
//      correct_answer verbatim.
//   4. A2.2 now has exactly 12 topics, 1..12, no gaps or duplicates.
//   5. The new migration's guarded INSERT count for topics/rules/examples/
//      exercises matches the cache rows belonging to these four topics — so the
//      migration and the cache the Astro build reads from cannot silently drift
//      apart (e.g. a topic edited in the cache after the migration was generated).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache = JSON.parse(readFileSync(join(ROOT, 'grammar-content-cache.json'), 'utf8'));

const NEW_SLUGS = ['konjunktiv-ii-polite', 'verbs-with-prepositions-intro', 'indirect-questions-intro', 'infinitive-with-zu-intro'];
const EXPECTED_ORDER = {
  'konjunktiv-ii-polite': 9,
  'verbs-with-prepositions-intro': 10,
  'indirect-questions-intro': 11,
  'infinitive-with-zu-intro': 12,
};

test('the four new A2.2 topics exist at the expected topic_order, in the decided order', () => {
  for (const slug of NEW_SLUGS) {
    const topic = cache.topics.find((t) => t.slug === slug && t.sub_level === 'A2.2');
    assert.ok(topic, `topic "${slug}" not found at sub_level A2.2 in the cache`);
    assert.equal(topic.topic_order, EXPECTED_ORDER[slug], `topic "${slug}" has the wrong topic_order`);
  }
});

test('A2.2 now has exactly 12 topics, 1..12 with no gaps or duplicates', () => {
  const orders = cache.topics
    .filter((t) => t.sub_level === 'A2.2')
    .map((t) => t.topic_order)
    .sort((a, b) => a - b);
  assert.deepEqual(orders, Array.from({ length: 12 }, (_, i) => i + 1));
});

test('each new topic has >=26 exercises, >=16 typed, and every typed exercise has options: null', () => {
  for (const slug of NEW_SLUGS) {
    const topic = cache.topics.find((t) => t.slug === slug && t.sub_level === 'A2.2');
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
    const topic = cache.topics.find((t) => t.slug === slug && t.sub_level === 'A2.2');
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
    const topic = cache.topics.find((t) => t.slug === slug && t.sub_level === 'A2.2');
    const examples = cache.examples.filter((e) => e.topic_id === topic.id);
    assert.ok(
      examples.length >= 8 && examples.length <= 10,
      `${slug}: expected 8-10 examples, found ${examples.length}`,
    );
  }
});

test('each new topic\'s Astro page title stays within 70 characters', () => {
  for (const slug of NEW_SLUGS) {
    const topic = cache.topics.find((t) => t.slug === slug && t.sub_level === 'A2.2');
    const title = `German ${topic.title_en} — A2.2 Grammar | DeutschMeister`;
    assert.ok(title.length <= 70, `${slug}: page title is ${title.length} chars: "${title}"`);
  }
});

test('the migration keeps the topic_order CHECK at 1..12', () => {
  const sql = readFileSync(join(ROOT, 'migrations', '2026-09-06-a2-2-new-topics.sql'), 'utf8');
  const match = sql.match(/CHECK\s*\(\s*topic_order\s*>=\s*1\s*AND\s*topic_order\s*<=\s*(\d+)\s*\)/i);
  assert.ok(match, 'migration file does not contain the expected topic_order CHECK');
  assert.equal(Number(match[1]), 12, `migration's topic_order CHECK is 1..${match[1]}, expected 1..12`);
});

test("the migration's guarded INSERT counts match the cache rows for the four new topics", () => {
  const sql = readFileSync(join(ROOT, 'migrations', '2026-09-06-a2-2-new-topics.sql'), 'utf8');
  const countInserts = (table) => (sql.match(new RegExp(`INSERT INTO public\\.${table} `, 'g')) || []).length;

  const topics = cache.topics.filter((t) => NEW_SLUGS.includes(t.slug) && t.sub_level === 'A2.2');
  assert.equal(topics.length, 4, 'expected exactly 4 new A2.2 topics in the cache');
  const topicIds = new Set(topics.map((t) => t.id));

  const expected = {
    grammar_topics: topics.length,
    grammar_rules: cache.rules.filter((r) => topicIds.has(r.topic_id)).length,
    grammar_examples: cache.examples.filter((e) => topicIds.has(e.topic_id)).length,
    grammar_exercises: cache.exercises.filter((e) => topicIds.has(e.topic_id)).length,
  };

  for (const [table, count] of Object.entries(expected)) {
    assert.equal(
      countInserts(table),
      count,
      `migration has ${countInserts(table)} INSERT INTO ${table} statements, cache has ${count} rows for the four new topics`,
    );
  }
});
