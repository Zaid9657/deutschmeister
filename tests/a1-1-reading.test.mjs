// Guard suite for the A1.1 reading rewrite (Course Factory Wave 2, PR C):
// migrations/2026-09-05-a1-1-reading.sql.
//
// What each pin defends:
//
//   1. THE SCHEMA CHANGE — reading_lessons has no `checks` column live; the
//      migration must add it before anything writes to it.
//   2. IDEMPOTENCY — every rewrite UPDATE is guarded `AND checks IS NULL`, so
//      re-running the migration after it has landed is a no-op rather than a
//      duplicate write.
//   3. CONTENT SHAPE — all 8 rewrites carry exactly 4 Richtig/Falsch checks,
//      split 2/2 (a check set that is all "richtig" or all "falsch" would let
//      a learner pass by pattern rather than by reading), every check's type
//      is rf|choice with an answer in the allowed set, and every rewrite's
//      word_count stays at or under 120 (A1.1 short-text ceiling).
//   4. THE TWO NEW LESSONS — inserted guarded by (level, title_de), landing
//      at level 'a1.1' (lowercase — reading_lessons' check constraint, unlike
//      every other content table).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(join(ROOT, 'migrations', '2026-09-05-a1-1-reading.sql'), 'utf8');
// Strip full-line SQL comments before matching statements — the file's own
// header/rollback notes quote statement fragments ("UPDATE ... SET checks =
// NULL WHERE id IN (...)") that would otherwise confuse a naive regex scan.
const sqlNoComments = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n');

// Statement bodies (the reading content itself) can contain a literal ';'
// (e.g. an explanation reading "Anzeige b ist in Berlin; Anzeige a ist in
// Potsdam."), so splitting on the terminating ';' is unsafe. Instead, find
// every statement's START keyword and slice up to the NEXT statement's start
// (or COMMIT for the last one) — the generator always begins a fresh
// statement at the start of a line.
function statementsStartingWith(pattern, text) {
  const allStarts = [...text.matchAll(/^(?:UPDATE public\.reading_lessons SET|INSERT INTO public\.reading_lessons)/gm)]
    .map((m) => m.index);
  const commitAt = text.indexOf('\nCOMMIT;');
  const boundaries = [...allStarts, commitAt === -1 ? text.length : commitAt];
  const mine = [...text.matchAll(pattern)].map((m) => m.index);
  return mine.map((start) => {
    const next = boundaries.find((b) => b > start);
    return text.slice(start, next);
  });
}

test('the migration adds reading_lessons.checks before writing to it', () => {
  assert.match(sqlNoComments, /ALTER TABLE public\.reading_lessons ADD COLUMN IF NOT EXISTS checks jsonb;/);
  const alterIndex = sqlNoComments.indexOf('ADD COLUMN IF NOT EXISTS checks');
  const firstWrite = Math.min(
    ...['UPDATE public.reading_lessons', 'INSERT INTO public.reading_lessons']
      .map((s) => sqlNoComments.indexOf(s))
      .filter((i) => i !== -1),
  );
  assert.ok(alterIndex < firstWrite, 'ALTER must run before the first UPDATE/INSERT');
});

test('all 8 rewrites are guarded UPDATEs keyed by id, idempotent on checks IS NULL', () => {
  const updates = statementsStartingWith(/^UPDATE public\.reading_lessons SET/gm, sqlNoComments);
  assert.equal(updates.length, 8, `expected 8 rewrite UPDATEs, found ${updates.length}`);
  for (const stmt of updates) {
    assert.match(stmt, /WHERE id = '[0-9a-f-]{36}'/, 'UPDATE must key on a specific row id');
    assert.match(stmt, /AND checks IS NULL/, 'UPDATE must be guarded by checks IS NULL — a re-run must no-op');
    assert.match(stmt, /checks = '.*'::jsonb/, 'UPDATE must set checks');
  }
});

test('the 2 new exam-format lessons are guarded INSERTs at level a1.1', () => {
  const inserts = statementsStartingWith(/^INSERT INTO public\.reading_lessons/gm, sqlNoComments);
  assert.equal(inserts.length, 2, `expected 2 new-lesson INSERTs, found ${inserts.length}`);
  for (const stmt of inserts) {
    assert.match(stmt, /SELECT\s*\n\s*'a1\.1',/, 'insert must land at level a1.1 (lowercase)');
    assert.match(stmt, /WHERE NOT EXISTS \(\s*SELECT 1 FROM public\.reading_lessons WHERE level = 'a1\.1' AND title_de = '.*'\s*\);/);
  }
});

// ---------------------------------------------------------------------------
// Content shape — parse the JSON literals back out of the SQL to check them.
// The generator always emits jsonb columns in the order key_vocabulary,
// questions, checks (both for the UPDATE's SET list and the INSERT's SELECT
// list) — so the 3rd '...'::jsonb literal in a statement is always `checks`,
// regardless of which statement shape it is.
// ---------------------------------------------------------------------------

function jsonbLiterals(sqlText) {
  const out = [];
  const re = /'((?:[^']|'')*)'::jsonb/g;
  let m;
  while ((m = re.exec(sqlText))) {
    out.push(JSON.parse(m[1].replace(/''/g, "'")));
  }
  return out;
}

test('every rewrite carries exactly 4 checks, split 2 richtig / 2 falsch, word_count <= 120', () => {
  const updates = statementsStartingWith(/^UPDATE public\.reading_lessons SET/gm, sqlNoComments);
  for (const stmt of updates) {
    const checks = jsonbLiterals(stmt)[2];
    assert.ok(checks, 'rewrite is missing a checks literal');
    assert.equal(checks.length, 4, `expected 4 checks per rewrite, found ${checks.length}`);

    const richtig = checks.filter((c) => c.answer === 'richtig').length;
    const falsch = checks.filter((c) => c.answer === 'falsch').length;
    assert.equal(richtig, 2, 'expected exactly 2 "richtig" checks per rewrite');
    assert.equal(falsch, 2, 'expected exactly 2 "falsch" checks per rewrite');

    for (const c of checks) {
      assert.ok(['rf', 'choice'].includes(c.type), `check has unexpected type ${c.type}`);
      assert.ok(['richtig', 'falsch'].includes(c.answer), `rf/choice answer ${c.answer} not in the allowed set`);
    }

    const wordCountMatch = stmt.match(/word_count = (\d+)/);
    assert.ok(wordCountMatch, 'rewrite is missing word_count');
    assert.ok(Number(wordCountMatch[1]) <= 120, `word_count ${wordCountMatch[1]} exceeds the 120-word A1.1 ceiling`);
  }
});

test('the 2 new lessons carry 5 checks each, type rf|choice, answers in the allowed set', () => {
  const inserts = statementsStartingWith(/^INSERT INTO public\.reading_lessons/gm, sqlNoComments);
  for (const stmt of inserts) {
    const checks = jsonbLiterals(stmt)[2];
    assert.ok(checks, 'new lesson is missing a checks literal');
    assert.equal(checks.length, 5, `expected 5 checks, found ${checks.length}`);
    for (const c of checks) {
      assert.ok(['rf', 'choice'].includes(c.type), `check has unexpected type ${c.type}`);
      if (c.type === 'rf') {
        assert.ok(['richtig', 'falsch'].includes(c.answer), `rf answer ${c.answer} not in the allowed set`);
      } else {
        assert.ok(Array.isArray(c.options) && c.options.includes(c.answer), 'choice answer must be one of its options');
      }
    }
  }
});
