// Guard suite for the A1.2 reading rewrite (Course Factory Wave 3, PR C):
// migrations/2026-09-05-a1-2-reading.sql.
//
// What each pin defends:
//
//   1. THE SCHEMA CHANGE — reading_lessons has no `checks` column live (unless
//      the A1.1 migration already added it); the migration must (re-)add it,
//      idempotently, before anything writes to it.
//   2. IDEMPOTENCY — every rewrite UPDATE is guarded `AND checks IS NULL`, so
//      re-running the migration after it has landed is a no-op rather than a
//      duplicate write.
//   3. CONTENT SHAPE — all 8 rewrites carry exactly 6 checks (5 Richtig/Falsch
//      + 1 exam-style choice), the rf set is split 3 richtig / 2 falsch (an
//      all-one-answer set would let a learner pass by pattern rather than by
//      reading), the choice check's correct option alternates position across
//      the 8 rewrites (so guessing "always option 1" doesn't pass either),
//      and every rewrite's word_count stays at or under 120 (A1.2 short-text
//      ceiling).
//   4. THE TWO NEW LESSONS — inserted guarded by (level, title_de), landing
//      at level 'a1.2' (lowercase — reading_lessons' check constraint, unlike
//      every other content table): order_index 9 carries 6 rf checks split
//      3/3, order_index 10 carries 5 exam-style choice checks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(join(ROOT, 'migrations', '2026-09-05-a1-2-reading.sql'), 'utf8');
// Strip full-line SQL comments before matching statements — the file's own
// header/rollback notes quote statement fragments that would otherwise
// confuse a naive regex scan.
const sqlNoComments = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n');

// Statement bodies can contain a literal ';' (German prose does), so
// splitting on the terminating ';' is unsafe. Instead, find every
// statement's START keyword and slice up to the NEXT statement's start (or
// COMMIT for the last one) — the generator always begins a fresh statement
// at the start of a line.
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

test('the 2 new exam-format lessons are guarded INSERTs at level a1.2', () => {
  const inserts = statementsStartingWith(/^INSERT INTO public\.reading_lessons/gm, sqlNoComments);
  assert.equal(inserts.length, 2, `expected 2 new-lesson INSERTs, found ${inserts.length}`);
  for (const stmt of inserts) {
    assert.match(stmt, /SELECT\s*\n\s*'a1\.2',/, 'insert must land at level a1.2 (lowercase)');
    assert.match(stmt, /WHERE NOT EXISTS \(\s*SELECT 1 FROM public\.reading_lessons WHERE level = 'a1\.2' AND title_de = '.*'\s*\);/);
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

test('every rewrite carries 5 rf + 1 choice checks, rf split 3 richtig / 2 falsch, word_count <= 120', () => {
  const updates = statementsStartingWith(/^UPDATE public\.reading_lessons SET/gm, sqlNoComments);
  const choicePositions = [];

  for (const stmt of updates) {
    const checks = jsonbLiterals(stmt)[2];
    assert.ok(checks, 'rewrite is missing a checks literal');
    assert.equal(checks.length, 6, `expected 6 checks per rewrite, found ${checks.length}`);

    const rf = checks.filter((c) => c.type === 'rf');
    const choice = checks.filter((c) => c.type === 'choice');
    assert.equal(rf.length, 5, `expected 5 rf checks per rewrite, found ${rf.length}`);
    assert.equal(choice.length, 1, `expected 1 choice check per rewrite, found ${choice.length}`);

    const richtig = rf.filter((c) => c.answer === 'richtig').length;
    const falsch = rf.filter((c) => c.answer === 'falsch').length;
    assert.equal(richtig, 3, 'expected exactly 3 "richtig" rf checks per rewrite');
    assert.equal(falsch, 2, 'expected exactly 2 "falsch" rf checks per rewrite');

    const c = choice[0];
    assert.ok(Array.isArray(c.options) && c.options.includes(c.answer), 'choice answer must be one of its options');
    choicePositions.push(c.options.indexOf(c.answer));

    for (const check of checks) {
      assert.ok(['rf', 'choice'].includes(check.type), `check has unexpected type ${check.type}`);
    }

    const wordCountMatch = stmt.match(/word_count = (\d+)/);
    assert.ok(wordCountMatch, 'rewrite is missing word_count');
    assert.ok(Number(wordCountMatch[1]) <= 120, `word_count ${wordCountMatch[1]} exceeds the 120-word A1.2 ceiling`);
  }

  // The choice check's correct option must not sit in the same slot every
  // time (a fixed slot lets a learner pass by pattern, never by reading).
  assert.ok(choicePositions.includes(0) && choicePositions.includes(1), 'choice keys must alternate position across the 8 rewrites');
  assert.equal(choicePositions.length, 8);
});

test('the exam-format lessons carry order_index 9 (6 rf, 3/3) and order_index 10 (5 choice)', () => {
  const inserts = statementsStartingWith(/^INSERT INTO public\.reading_lessons/gm, sqlNoComments);
  assert.equal(inserts.length, 2);

  const byOrderIndex = new Map();
  for (const stmt of inserts) {
    const orderMatch = stmt.match(/,\s*(\d+)\s*\nWHERE NOT EXISTS/);
    assert.ok(orderMatch, 'insert is missing its order_index');
    byOrderIndex.set(Number(orderMatch[1]), stmt);
  }
  assert.deepEqual([...byOrderIndex.keys()].sort((a, b) => a - b), [9, 10]);

  const lesson9 = jsonbLiterals(byOrderIndex.get(9))[2];
  assert.equal(lesson9.length, 6, 'order_index 9 should carry 6 checks');
  assert.ok(lesson9.every((c) => c.type === 'rf'), 'order_index 9 checks should all be rf');
  const richtig9 = lesson9.filter((c) => c.answer === 'richtig').length;
  const falsch9 = lesson9.filter((c) => c.answer === 'falsch').length;
  assert.equal(richtig9, 3, 'order_index 9 should split 3 richtig');
  assert.equal(falsch9, 3, 'order_index 9 should split 3 falsch');

  const lesson10 = jsonbLiterals(byOrderIndex.get(10))[2];
  assert.equal(lesson10.length, 5, 'order_index 10 should carry 5 checks');
  assert.ok(lesson10.every((c) => c.type === 'choice'), 'order_index 10 checks should all be choice');
  for (const c of lesson10) {
    assert.ok(Array.isArray(c.options) && c.options.includes(c.answer), 'choice answer must be one of its options');
  }
});
