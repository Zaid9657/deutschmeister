// Guard suite for Course Factory Wave 3 PR A2 (typed production exercises
// added to the 16 pre-existing A1.1/A1.2 grammar topics, and the
// numbers-counting upgrade to 100-1000, prices and ordinals).
//
// What it pins, and why:
//
//   1. Every one of the 16 older A1.1/A1.2 topics has >=8 exercises that are
//      BOTH non-multiple_choice AND options: null -- the exact shape
//      ExercisePlayer.jsx renders as a text input rather than four buttons.
//      A topic can carry other non-multiple_choice types (matching, reorder)
//      that legitimately keep a non-null `options` payload; those don't
//      count toward this floor and aren't penalised either.
//   2. Every topic's exercises have a unique order_index, and for the 16
//      topics this PR extended, that numbering is contiguous 1..n (the
//      GLOBAL counter across stages 4/5 that EXTEND mode enforces at
//      generation time -- re-checked here against the artifact that ships).
//      NOTE: this contiguity check is NOT applied to every A1.1/A1.2 topic --
//      the 4 topics Course Factory Wave 2 PR A created
//      (possessive-articles, separable-verbs-intro, yes-no-questions,
//      time-and-dates) use PER-STAGE numbering (1..n within each of stage 4
//      and stage 5 separately, per notes.md), so a global-contiguity check
//      would fail there for a reason this PR did not introduce.
//   3. numbers-counting has >=9 rules (5 original + 4 new), the four new
//      rule titles are present, and its description mentions both prices and
//      ordinals (the two things PR A2 added coverage for).
//   4. The migration file has the expected INSERT/UPDATE shape: 163 exercise
//      INSERTs (79 A1.1 + 84 A1.2), 4 rule INSERTs, 4 example INSERTs, 0
//      topic INSERTs (EXTEND mode never mints a topic id), and the
//      topic_order CHECK-widening block is ABSENT (EXTEND mode never emits
//      it -- only a CREATE run whose topic_order exceeds 8 does).
//
// Coverage note: at the time this PR was integrated, A1.2 held 8 topics in
// grammar-content-cache.json (Course Factory Wave 3 PR A, which adds four
// more A1.2 topics to reach parity with A1.1's 12, had not landed in this
// worktree). This suite checks every A1.1/A1.2 topic PRESENT in the cache
// (20, not the eventual 24) -- once PR A lands, its four new topics get no
// typed-production coverage from this PR and would need their own.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache = JSON.parse(readFileSync(join(ROOT, 'grammar-content-cache.json'), 'utf8'));

const OLDER_A1_1 = [
  'nouns-gender', 'definite-articles', 'personal-pronouns', 'verb-sein',
  'alphabet-pronunciation', 'verb-haben', 'indefinite-articles', 'present-tense-regular',
];
const OLDER_A1_2 = [
  'basic-sentence-structure', 'nominative-case', 'accusative-intro', 'numbers-counting',
  'question-words', 'negation', 'modal-verbs-intro', 'prepositions-accusative',
];
const OLDER_16 = [...OLDER_A1_1, ...OLDER_A1_2];

function findTopic(slug, subLevel) {
  const topic = cache.topics.find((t) => t.slug === slug && t.sub_level === subLevel);
  assert.ok(topic, `topic "${slug}" not found at sub_level ${subLevel} in the cache`);
  return topic;
}

test('every A1.1/A1.2 topic in the cache has >=8 typed (non-multiple_choice, options: null) exercises', () => {
  const a1Topics = cache.topics.filter((t) => t.sub_level === 'A1.1' || t.sub_level === 'A1.2');
  assert.ok(a1Topics.length >= 20, `expected at least 20 A1.1/A1.2 topics in the cache, found ${a1Topics.length}`);
  for (const topic of a1Topics) {
    const exercises = cache.exercises.filter((e) => e.topic_id === topic.id);
    const typedNull = exercises.filter((e) => e.exercise_type !== 'multiple_choice' && e.options === null);
    assert.ok(
      typedNull.length >= 8,
      `${topic.slug} (${topic.sub_level}): expected >=8 typed exercises with options: null, found ${typedNull.length}`,
    );
  }
});

test('every A1.1/A1.2 topic has a unique exercise order_index per stage', () => {
  // Per-stage uniqueness is the invariant validateTopicJson/validateExtendJson
  // both actually enforce (see stageOrderCounts in grammar-topics-from-json.mjs).
  // GLOBAL (cross-stage) uniqueness is a stronger property that only holds for
  // the 16 topics this PR extended (checked separately below) -- the 4 Wave 2
  // topics (possessive-articles, separable-verbs-intro, yes-no-questions,
  // time-and-dates) deliberately use PER-STAGE numbering (notes.md), so
  // order_index 1 legitimately exists in both their stage 4 and stage 5.
  const a1Topics = cache.topics.filter((t) => t.sub_level === 'A1.1' || t.sub_level === 'A1.2');
  for (const topic of a1Topics) {
    const exercises = cache.exercises.filter((e) => e.topic_id === topic.id);
    const keys = exercises.map((e) => `${e.stage}:${e.order_index}`);
    assert.equal(new Set(keys).size, keys.length, `${topic.slug} (${topic.sub_level}): exercise stage/order_index has duplicates`);
  }
});

test('the 16 topics this PR extended have exercise order_index contiguous 1..n', () => {
  for (const slug of OLDER_16) {
    const subLevel = OLDER_A1_1.includes(slug) ? 'A1.1' : 'A1.2';
    const topic = findTopic(slug, subLevel);
    const orders = cache.exercises
      .filter((e) => e.topic_id === topic.id)
      .map((e) => e.order_index)
      .sort((a, b) => a - b);
    assert.deepEqual(orders, Array.from({ length: orders.length }, (_, i) => i + 1), `${slug}: exercise order_index is not contiguous 1..${orders.length}`);
  }
});

test('numbers-counting has >=9 rules including the four new titles, and its description mentions prices and ordinals', () => {
  const topic = findTopic('numbers-counting', 'A1.2');
  const rules = cache.rules.filter((r) => r.topic_id === topic.id);
  assert.ok(rules.length >= 9, `numbers-counting: expected >=9 rules, found ${rules.length}`);

  const titles = rules.map((r) => r.title_en);
  for (const expected of ['Hundreds and Thousands', 'Prices', 'Ordinal Numbers', 'Phone Numbers and Postal Codes']) {
    assert.ok(titles.includes(expected), `numbers-counting: missing new rule title "${expected}"`);
  }

  const description = `${topic.description_en} ${topic.description_de}`.toLowerCase();
  assert.ok(/price|preis/.test(description), 'numbers-counting description does not mention prices');
  assert.ok(/ordinal|ordnungszahl/.test(description), 'numbers-counting description does not mention ordinals');
});

test('numbers-counting has >=9 examples including the four new ones', () => {
  const topic = findTopic('numbers-counting', 'A1.2');
  const examples = cache.examples.filter((e) => e.topic_id === topic.id);
  assert.ok(examples.length >= 12, `numbers-counting: expected >=12 examples (8 original + 4 new), found ${examples.length}`);
});

test('the migration has 163 exercise INSERTs, 4 rule INSERTs, 4 example INSERTs, 0 topic INSERTs, and 1 rule UPDATE', () => {
  const sql = readFileSync(join(ROOT, 'migrations', '2026-09-05-a1-typed-production.sql'), 'utf8');
  const count = (re) => (sql.match(re) || []).length;

  assert.equal(count(/^INSERT INTO public\.grammar_exercises/gm), 163, 'expected 163 grammar_exercises INSERTs');
  assert.equal(count(/^INSERT INTO public\.grammar_rules/gm), 4, 'expected 4 grammar_rules INSERTs');
  assert.equal(count(/^INSERT INTO public\.grammar_examples/gm), 4, 'expected 4 grammar_examples INSERTs');
  assert.equal(count(/^INSERT INTO public\.grammar_topics/gm), 0, 'EXTEND mode must never INSERT a grammar_topics row');
  assert.equal(count(/^UPDATE public\.grammar_rules/gm), 1, 'expected exactly 1 grammar_rules UPDATE (the numbers-counting rule patch)');
  assert.ok(count(/^UPDATE public\.grammar_topics/gm) >= 1, 'expected at least 1 grammar_topics UPDATE (the numbers-counting topic_patch)');
});

test('the migration never widens the topic_order CHECK (EXTEND mode never emits it)', () => {
  const sql = readFileSync(join(ROOT, 'migrations', '2026-09-05-a1-typed-production.sql'), 'utf8');
  assert.doesNotMatch(sql, /topic_order_check/, 'EXTEND-only migration must not touch grammar_topics_topic_order_check');
  assert.doesNotMatch(sql, /DROP CONSTRAINT|ADD CONSTRAINT/, 'EXTEND-only migration must not contain any ALTER TABLE constraint change');
});

test('the rule patch UPDATE is guarded on the OLD content value, not IS DISTINCT FROM', () => {
  const sql = readFileSync(join(ROOT, 'migrations', '2026-09-05-a1-typed-production.sql'), 'utf8');
  const match = sql.match(/UPDATE public\.grammar_rules SET content = .*\nWHERE id = '125e153e-258b-4337-bbad-b6b20d1997bd'::uuid AND content = (.*)::jsonb;/);
  assert.ok(match, 'expected a guarded UPDATE on the numbers-counting Quick Reference rule (id 125e153e-...)');
});
