// Guard suite for Course Factory Wave 7 PR A2 (typed production exercises
// added to the eight pre-existing B1.1 grammar topics, a depth patch for the
// five thin ones, and the small legacy pass on their rule text). Mirrors
// tests/a2-2-typed-production.test.mjs (Wave 5 PR A2 / #94) and carries the
// class-level ban sweep from tests/a2-2-legacy-recut.test.mjs (Wave 6 PR A / #100).
//
// What it pins, and why:
//
//   1. Every B1.1 topic (all 12: the eight extended here and the four Wave 7
//      PR A created) has >=10 exercises that are BOTH non-multiple_choice AND
//      options: null -- the exact shape ExercisePlayer.jsx renders as a text
//      input. Before this PR the eight older topics had zero (and B1.1 was the
//      first paid level to be sold with none).
//   2. The eight extended topics keep a unique, contiguous per-topic exercise
//      order_index 1..n across stages 4 and 5 (EXTEND mode continues each
//      topic's own counter). The four PR-A topics number per stage and are
//      exempt from contiguity.
//   3. The five thin topics (genitive-prepositions, relative-clauses-dat-gen,
//      konjunktiv-ii-ware-hatte, infinitive-with-zu, um-zu-ohne-zu) now carry
//      >=8 rules incl. one common_mistakes rule and >=12 examples.
//   4. The migration file has the expected shape (pinned INSERT counts, 0 topic
//      INSERTs, no topic_order CHECK-widening block; guarded rule UPDATEs only).
//   5. No banned B1.1 form (docs/course-factory/wave7/level-b1.1.md, the B1/B2
//      border) in any German field of any B1.1 grammar row in the cache -- the
//      reusable guard that keeps the level honest after this wave.
//   6. The companion re-cut migration (2026-09-07-b1-1-legacy-recut.sql: two
//      legacy MC exercises whose question_de/question_en were swapped and whose
//      German named the key) is UPDATE-only, guarded on the old value, and every
//      NEW value is what the cache carries -- the same contract as
//      tests/a2-2-legacy-recut.test.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { bannedIn, germanStrings } from './helpers/b1Bans.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache = JSON.parse(readFileSync(join(ROOT, 'grammar-content-cache.json'), 'utf8'));
const MIGRATION = join(ROOT, 'migrations', '2026-09-07-b1-1-typed-production.sql');
const RECUT = join(ROOT, 'migrations', '2026-09-07-b1-1-legacy-recut.sql');

const EXTENDED_8 = [
  'genitive-case', 'genitive-prepositions', 'relative-clauses-nom-acc', 'relative-clauses-dat-gen',
  'konjunktiv-ii-wurde', 'konjunktiv-ii-ware-hatte', 'infinitive-with-zu', 'um-zu-ohne-zu',
];
const DEPTH_PATCHED = ['genitive-prepositions', 'relative-clauses-dat-gen', 'konjunktiv-ii-ware-hatte', 'infinitive-with-zu', 'um-zu-ohne-zu'];

// Filled in from the generated migration (see the PR body).
const MIGRATION_SHAPE = { exercises: 80, rules: 15, examples: 20, ruleUpdates: 6 };

const b11Topics = cache.topics.filter((t) => t.sub_level === 'B1.1');
const exercisesOf = (topic) => cache.exercises.filter((e) => e.topic_id === topic.id);
const isTyped = (e) => e.exercise_type !== 'multiple_choice' && e.options === null;

test('B1.1 has exactly 12 topics in the cache', () => {
  assert.equal(b11Topics.length, 12);
});

test('every B1.1 topic has >=10 typed (non-multiple_choice, options: null) exercises', () => {
  for (const topic of b11Topics) {
    const typed = exercisesOf(topic).filter(isTyped);
    assert.ok(typed.length >= 10, `${topic.slug}: expected >=10 typed exercises, found ${typed.length}`);
  }
});

test('the eight extended topics keep a unique, contiguous per-topic exercise order_index 1..n', () => {
  for (const slug of EXTENDED_8) {
    const topic = b11Topics.find((t) => t.slug === slug);
    assert.ok(topic, `topic "${slug}" missing at B1.1`);
    const orders = exercisesOf(topic).map((e) => e.order_index).sort((a, b) => a - b);
    assert.deepEqual(orders, Array.from({ length: orders.length }, (_, i) => i + 1), `${slug}: order_index not contiguous 1..n`);
    for (const e of exercisesOf(topic).filter(isTyped)) {
      assert.ok(Array.isArray(e.acceptable_answers) && e.acceptable_answers.includes(e.correct_answer),
        `${slug} oi${e.order_index}: acceptable_answers must contain correct_answer`);
    }
  }
});

test('the five depth-patched topics carry >=8 rules incl. common_mistakes and >=12 examples', () => {
  for (const slug of DEPTH_PATCHED) {
    const topic = b11Topics.find((t) => t.slug === slug);
    const rules = cache.rules.filter((r) => r.topic_id === topic.id);
    const examples = cache.examples.filter((e) => e.topic_id === topic.id);
    assert.ok(rules.length >= 8, `${slug}: expected >=8 rules, found ${rules.length}`);
    assert.ok(rules.some((r) => r.rule_type === 'common_mistakes'), `${slug}: no common_mistakes rule`);
    assert.ok(examples.length >= 12, `${slug}: expected >=12 examples, found ${examples.length}`);
  }
});

test('the migration has the pinned INSERT/UPDATE counts, 0 topic INSERTs, and never widens the CHECK', () => {
  const sql = readFileSync(MIGRATION, 'utf8');
  const count = (table) => (sql.match(new RegExp(`INSERT INTO public\\.${table} `, 'g')) || []).length;
  assert.equal(count('grammar_exercises'), MIGRATION_SHAPE.exercises);
  assert.equal(count('grammar_rules'), MIGRATION_SHAPE.rules);
  assert.equal(count('grammar_examples'), MIGRATION_SHAPE.examples);
  assert.equal(count('grammar_topics'), 0);
  assert.equal((sql.match(/UPDATE public\.grammar_rules\b/g) || []).length, MIGRATION_SHAPE.ruleUpdates);
  assert.doesNotMatch(sql, /grammar_topics_topic_order_check/);
  assert.doesNotMatch(sql, /\bDELETE\b/);
});

// Meta strings the heuristics misread — allow-listed by (slug, table, order_index, path).
const ALLOW = new Set([]);

test('no banned B1.1 form in any German field of any B1.1 grammar row (rules, examples, exercises)', () => {
  const b11 = new Map(b11Topics.map((t) => [t.id, t.slug]));
  assert.equal(b11.size, 12);
  const offenders = [];
  const scan = (table, rows, fields) => {
    for (const r of rows) {
      const slug = b11.get(r.topic_id);
      if (!slug) continue;
      for (const f of fields) {
        for (const { path, s } of germanStrings(r[f], f)) {
          if (ALLOW.has(`${slug}|${table}|${r.order_index}|${path}`)) continue;
          for (const h of bannedIn(s)) offenders.push(`${slug} ${table} oi${r.order_index} ${path} [${h.ban}] "${h.match}"`);
        }
      }
    }
  };
  scan('rules', cache.rules, ['content', 'common_mistakes', 'title_de', 'memory_trick_de', 'formal_note_de', 'key_insight_de']);
  scan('examples', cache.examples, ['sentence_de', 'explanation_de', 'grammar_highlight', 'word_breakdown']);
  scan('exercises', cache.exercises, ['question_de', 'options', 'correct_answer', 'acceptable_answers', 'explanation_de', 'hint', 'why_correct_de', 'related_rule_title']);
  assert.deepEqual(offenders, [], `banned B1.1 forms in the cache:\n${offenders.join('\n')}`);
});

// --- the re-cut half (exercise fields the EXTEND generator cannot edit) ---
const TABLES = { grammar_rules: 'rules', grammar_examples: 'examples', grammar_exercises: 'exercises' };
const unq = (s) => s.replace(/''/g, "'");
const UPDATE_RE = /UPDATE public\.(grammar_rules|grammar_examples|grammar_exercises)\nSET (\w+) = ('((?:[^']|'')*)'(::jsonb)?|NULL)\nWHERE id = '([0-9a-f-]{36})'::uuid\n {2}AND (\w+) (?:= '(?:[^']|'')*'(?:::jsonb)?|IS NULL);/g;
const recutSql = readFileSync(RECUT, 'utf8');
const recutUpdates = [...recutSql.matchAll(UPDATE_RE)].map((m) => ({
  table: m[1], field: m[2], raw: m[3], value: m[4], jsonb: !!m[5], id: m[6], guardField: m[7],
}));
const RECUT_IDS = ['d2e403ec-a185-4fc1-a728-d7ddb877fd30', '86a85535-d844-4c99-b322-fe99c337ea7e'];

test('the re-cut migration is UPDATE-only, guarded on the old value, and touches only the two swapped-field exercises', () => {
  assert.ok(!/\bINSERT\b/.test(recutSql) && !/\bDELETE\b/.test(recutSql), 'a re-cut may only edit in place');
  const total = (recutSql.match(/^UPDATE public\./gm) || []).length;
  assert.equal(total, recutUpdates.length, 'every UPDATE must match the guarded shape');
  assert.equal(recutUpdates.length, 6);
  for (const u of recutUpdates) {
    assert.equal(u.guardField, u.field, `${u.id}: guard must be on the patched field`);
    assert.equal(u.table, 'grammar_exercises');
    assert.ok(RECUT_IDS.includes(u.id), `${u.id}: not one of the two swapped-field exercises`);
  }
});

test('every re-cut UPDATE mirrors the cache, and the two exercises now ask in German without naming the key', () => {
  for (const u of recutUpdates) {
    const row = cache[TABLES[u.table]].find((r) => r.id === u.id);
    assert.ok(row, `${u.table} ${u.id} not in the cache`);
    const expected = u.raw === 'NULL' ? null : u.jsonb ? JSON.parse(unq(u.value)) : unq(u.value);
    assert.deepEqual(row[u.field], expected, `${u.table} ${u.id}.${u.field}: cache value differs from the migration's NEW value`);
  }
  for (const id of RECUT_IDS) {
    const row = cache.exercises.find((r) => r.id === id);
    assert.ok(row && row.options.length === 4 && row.options.includes(row.correct_answer), `${id}: MC keeps 4 options incl. the key`);
    assert.doesNotMatch(row.question_de, /\b(which|whose|means)\b/i, `${id}: question_de still holds English`);
    assert.ok(!row.question_de.includes(`"${row.correct_answer}"`), `${id}: question_de names its own key`);
    assert.doesNotMatch(row.explanation_de, /\b(\w+) = \1\b/u, `${id}: explanation_de is a tautology`);
  }
});
