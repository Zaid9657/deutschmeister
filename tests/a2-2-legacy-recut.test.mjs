// Guard suite for the A2.2 legacy re-cut (Course Factory Wave 6, PR A):
// migrations/2026-09-07-a2-2-legacy-recut.sql + the matching edit of
// grammar-content-cache.json.
//
// What it defends:
//   1. SHAPE — the migration is UPDATE-only (no INSERT/DELETE). tests/
//      a2-2-typed-production.test.mjs pins per-topic counts and the contiguous
//      exercise order_index, so a re-cut may only ever edit in place.
//   2. MIRROR — every guarded UPDATE's NEW value is what the cache carries for
//      that id/field (the cache is what CI's Astro build and every test read;
//      the live row is what the Netlify build reads — both halves must agree).
//   3. THE CLASS — no German field of ANY A2.2 grammar row in the cache carries a
//      banned A2.2 form (tests/helpers/a2Bans.mjs). Before this PR three live
//      topics taught obwohl/während/bevor/nachdem/bis/seit/als, Präteritum full
//      verbs, a Plusquamperfekt and Genitiv inside a paid A2.2 course — one
//      exercise's answer key WAS the banned form. This sweep is what keeps that
//      from coming back through any later migration. Two meta strings are
//      allow-listed by (slug, path): a rule line that NAMES um…zu/ohne…zu as
//      "erst in B1", and a word-order explanation the relative-clause heuristic
//      misreads.
//   4. WORDS — the words UPDATEs change `level` only, from a2.2, to b1.1/b1.2/b2.1.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { bannedIn, germanStrings } from './helpers/a2Bans.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(join(root, 'migrations', '2026-09-07-a2-2-legacy-recut.sql'), 'utf8');
const cache = JSON.parse(readFileSync(join(root, 'grammar-content-cache.json'), 'utf8'));
const TABLES = { grammar_rules: 'rules', grammar_examples: 'examples', grammar_exercises: 'exercises' };

const unq = (s) => s.replace(/''/g, "'");
// UPDATE public.<table>\nSET <field> = <lit>\nWHERE id = '<uuid>'::uuid\n  AND <guard>;
const UPDATE_RE = /UPDATE public\.(grammar_rules|grammar_examples|grammar_exercises)\nSET (\w+) = ('((?:[^']|'')*)'(::jsonb)?|NULL)\nWHERE id = '([0-9a-f-]{36})'::uuid\n {2}AND (\w+) (?:= '(?:[^']|'')*'(?:::jsonb)?|IS NULL);/g;
const WORDS_RE = /UPDATE public\.words\nSET level = '([a-z0-9.]+)'\nWHERE id = '([0-9a-f-]{36})'::uuid AND level = '([a-z0-9.]+)' AND german = '((?:[^']|'')*)';/g;

const grammarUpdates = [...sql.matchAll(UPDATE_RE)].map((m) => ({
  table: m[1], field: m[2], raw: m[3], value: m[4], jsonb: !!m[5], id: m[6], guardField: m[7],
}));
const wordUpdates = [...sql.matchAll(WORDS_RE)].map((m) => ({ newLevel: m[1], id: m[2], oldLevel: m[3], german: unq(m[4]) }));

test('the re-cut migration is UPDATE-only and every statement is guarded on the old value', () => {
  assert.ok(!/\bINSERT\b/.test(sql) && !/\bDELETE\b/.test(sql), 'a re-cut may only edit in place');
  const total = (sql.match(/^UPDATE public\./gm) || []).length;
  assert.equal(total, grammarUpdates.length + wordUpdates.length, 'every UPDATE must match the guarded shape');
  assert.ok(grammarUpdates.length >= 20, `expected the three topics' re-cut to touch ≥20 rows, got ${grammarUpdates.length}`);
  for (const u of grammarUpdates) assert.equal(u.guardField, u.field, `${u.id}: guard must be on the patched field`);
});

test('every grammar UPDATE mirrors the cache: same id, same field, NEW value present in the cache', () => {
  for (const u of grammarUpdates) {
    const row = cache[TABLES[u.table]].find((r) => r.id === u.id);
    assert.ok(row, `${u.table} ${u.id} not in the cache`);
    const expected = u.raw === 'NULL' ? null : u.jsonb ? JSON.parse(unq(u.value)) : unq(u.value);
    assert.deepEqual(row[u.field], expected, `${u.table} ${u.id}.${u.field}: cache value differs from the migration's NEW value`);
  }
});

test('per-topic row counts of the three re-cut topics are unchanged (25/25/18 exercises; 15/15/12 examples; 11/9/9 rules)', () => {
  const bySlug = Object.fromEntries(cache.topics.map((t) => [t.slug, t.id]));
  const count = (arr, slug) => arr.filter((r) => r.topic_id === bySlug[slug]).length;
  assert.deepEqual(
    ['subordinating-conjunctions', 'subordinate-word-order', 'superlative'].map((s) => [count(cache.rules, s), count(cache.examples, s), count(cache.exercises, s)]),
    [[11, 15, 25], [9, 15, 25], [9, 12, 18]]
  );
  for (const u of grammarUpdates.filter((x) => x.table === 'grammar_examples')) {
    const row = cache.examples.find((r) => r.id === u.id);
    if (row.grammar_highlight) {
      assert.ok(row.sentence_de.includes(row.grammar_highlight), `${u.id}: grammar_highlight "${row.grammar_highlight}" must be a substring of sentence_de`);
    }
  }
  for (const u of grammarUpdates.filter((x) => x.table === 'grammar_exercises')) {
    const row = cache.exercises.find((r) => r.id === u.id);
    if (Array.isArray(row.options)) {
      assert.equal(row.options.length, 4, `${u.id}: MC keeps 4 options`);
      assert.ok(row.options.includes(row.correct_answer), `${u.id}: correct_answer must stay among the options`);
    } else {
      assert.equal(row.options, null, `${u.id}: a typed exercise stays typed`);
    }
  }
});

// Meta strings the heuristics misread — allow-listed by (slug, table, order_index, path).
const ALLOW = new Set([
  'infinitive-with-zu-intro|rules|99|content.points[8]', // names um…zu / ohne…zu as "erst in B1"
  'future-tense|exercises|15|explanation_de', // ", das Dativpronomen dir folgt direkt," — not a relative clause
  'superlative|rules|0|content.hook_de', // "Der größte, der schnellste, der beste!" — a list, not a relative clause
]);

test('no banned A2.2 form in any German field of any A2.2 grammar row (rules, examples, exercises)', () => {
  const a22 = new Map(cache.topics.filter((t) => t.sub_level === 'A2.2').map((t) => [t.id, t.slug]));
  assert.equal(a22.size, 12);
  const offenders = [];
  const scan = (table, rows, fields) => {
    for (const r of rows) {
      const slug = a22.get(r.topic_id);
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
  assert.deepEqual(offenders, [], `banned A2.2 forms in the cache:\n${offenders.join('\n')}`);
});

test('the words UPDATEs move rows out of a2.2 only, to b1.1/b1.2/b2.1, and touch nothing else', () => {
  assert.ok(wordUpdates.length >= 20, `expected ≥20 re-levelled rows, got ${wordUpdates.length}`);
  for (const w of wordUpdates) {
    assert.equal(w.oldLevel, 'a2.2', `${w.german}: only a2.2 rows move`);
    assert.ok(['b1.1', 'b1.2', 'b2.1'].includes(w.newLevel), `${w.german}: ${w.newLevel} is not an allowed target`);
  }
  assert.ok(!/UPDATE public\.words\nSET (?!level = )/.test(sql), 'words UPDATEs may change level only');
  const ids = wordUpdates.map((w) => w.id);
  assert.equal(new Set(ids).size, ids.length, 'a word row is re-levelled at most once');
});
