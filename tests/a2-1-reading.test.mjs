// Guard suite for the A2.1 reading rewrite (Course Factory Wave 4, PR C):
// migrations/2026-09-06-a2-1-reading.sql.
//
// What each pin defends:
//
//   1. THE SCHEMA CHANGE — the migration re-adds reading_lessons.checks
//      idempotently before anything writes to it (a no-op live, the column
//      exists since the A1.1 migration; the re-emit keeps the file
//      self-sufficient on a fresh database).
//   2. IDEMPOTENCY — every rewrite UPDATE is guarded `AND checks IS NULL`, so
//      re-running the migration after it has landed is a no-op rather than a
//      duplicate write.
//   3. CONTENT SHAPE — all 8 rewrites carry exactly 6 checks (5 Richtig/Falsch
//      + 1 exam-style a/b/c choice), the rf set is never all-one-answer (2 or
//      3 falsch, both splits present across the eight so a learner cannot pass
//      by pattern), the choice key uses all three slots a/b/c across the
//      rewrites, and every rewrite's word_count stays at or under 150 (the
//      A2.1 ceiling set in the Wave 4 decisions log — A2 texts run longer
//      than A1's 120; the live texts this replaces ran 226–327 words).
//   4. THE TWO NEW LESSONS — inserted guarded by (level, title_de), landing
//      at level 'a2.1' (lowercase — reading_lessons' check constraint, unlike
//      every other content table): order_index 9 (Goethe A2 Lesen Teil 1, a
//      newspaper text) and order_index 10 (Lesen Teil 3, an e-mail) each
//      carry 5 exam-style a/b/c choice checks and no Richtig/Falsch — Goethe
//      A2 Lesen Teil 1 is a/b/c, not richtig/falsch, so the checks match the
//      exam and the UI heading must not say "Richtig oder falsch?".
//   5. THE HEADING — ReadingChecks.jsx renders "Wähle a, b oder c" for an
//      all-choice lesson and keeps "Richtig oder falsch?" for the mixed ones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(join(ROOT, 'migrations', '2026-09-06-a2-1-reading.sql'), 'utf8');
const sqlNoComments = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n');

// Statement bodies can contain a literal ';' (German prose does), so
// statements are cut at the NEXT statement's start line, never at ';'.
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

test('the 2 new exam-format lessons are guarded INSERTs at level a2.1', () => {
  const inserts = statementsStartingWith(/^INSERT INTO public\.reading_lessons/gm, sqlNoComments);
  assert.equal(inserts.length, 2, `expected 2 new-lesson INSERTs, found ${inserts.length}`);
  for (const stmt of inserts) {
    assert.match(stmt, /SELECT\s*\n\s*'a2\.1',/, 'insert must land at level a2.1 (lowercase)');
    assert.match(stmt, /WHERE NOT EXISTS \(\s*SELECT 1 FROM public\.reading_lessons WHERE level = 'a2\.1' AND title_de = '.*'\s*\);/);
  }
});

// The generator always emits jsonb columns in the order key_vocabulary,
// questions, checks — so the 3rd '...'::jsonb literal is always `checks`.
function jsonbLiterals(sqlText) {
  const out = [];
  const re = /'((?:[^']|'')*)'::jsonb/g;
  let m;
  while ((m = re.exec(sqlText))) {
    out.push(JSON.parse(m[1].replace(/''/g, "'")));
  }
  return out;
}

test('every rewrite carries 5 rf + 1 a/b/c choice, rf never all-one-answer, word_count <= 150', () => {
  const updates = statementsStartingWith(/^UPDATE public\.reading_lessons SET/gm, sqlNoComments);
  const choicePositions = [];
  const falschCounts = [];

  for (const stmt of updates) {
    const checks = jsonbLiterals(stmt)[2];
    assert.ok(checks, 'rewrite is missing a checks literal');
    assert.equal(checks.length, 6, `expected 6 checks per rewrite, found ${checks.length}`);

    const rf = checks.filter((c) => c.type === 'rf');
    const choice = checks.filter((c) => c.type === 'choice');
    assert.equal(rf.length, 5, `expected 5 rf checks per rewrite, found ${rf.length}`);
    assert.equal(choice.length, 1, `expected 1 choice check per rewrite, found ${choice.length}`);

    const falsch = rf.filter((c) => c.answer === 'falsch').length;
    const richtig = rf.filter((c) => c.answer === 'richtig').length;
    assert.equal(richtig + falsch, 5, 'every rf answer must be richtig or falsch');
    assert.ok(falsch === 2 || falsch === 3, `expected 2 or 3 "falsch" rf checks per rewrite, found ${falsch}`);
    falschCounts.push(falsch);

    const c = choice[0];
    assert.deepEqual(c.options, ['a', 'b', 'c'], 'the choice check must offer exactly a/b/c (Goethe A2 format)');
    assert.ok(c.options.includes(c.answer), 'choice answer must be one of its options');
    choicePositions.push(c.options.indexOf(c.answer));

    for (const check of checks) {
      assert.ok(['rf', 'choice'].includes(check.type), `check has unexpected type ${check.type}`);
    }

    const wordCountMatch = stmt.match(/word_count = (\d+)/);
    assert.ok(wordCountMatch, 'rewrite is missing word_count');
    assert.ok(Number(wordCountMatch[1]) <= 150, `word_count ${wordCountMatch[1]} exceeds the 150-word A2.1 ceiling`);
  }

  assert.equal(choicePositions.length, 8);
  for (const slot of [0, 1, 2]) {
    assert.ok(choicePositions.includes(slot), `choice keys must use slot ${['a', 'b', 'c'][slot]} at least once across the 8 rewrites`);
  }
  assert.ok(falschCounts.includes(2) && falschCounts.includes(3), 'both 2-falsch and 3-falsch splits must appear across the rewrites');
});

test('the exam-format lessons carry order_index 9 and 10, 5 a/b/c choice checks each, keys spread over a/b/c', () => {
  const inserts = statementsStartingWith(/^INSERT INTO public\.reading_lessons/gm, sqlNoComments);
  assert.equal(inserts.length, 2);

  const byOrderIndex = new Map();
  for (const stmt of inserts) {
    const orderMatch = stmt.match(/,\s*(\d+)\s*\nWHERE NOT EXISTS/);
    assert.ok(orderMatch, 'insert is missing its order_index');
    byOrderIndex.set(Number(orderMatch[1]), stmt);
  }
  assert.deepEqual([...byOrderIndex.keys()].sort((a, b) => a - b), [9, 10]);

  for (const [orderIndex, stmt] of byOrderIndex) {
    const checks = jsonbLiterals(stmt)[2];
    assert.equal(checks.length, 5, `order_index ${orderIndex} should carry 5 checks`);
    assert.ok(checks.every((c) => c.type === 'choice'), `order_index ${orderIndex} checks should all be choice`);
    const keys = new Set();
    for (const c of checks) {
      assert.deepEqual(c.options, ['a', 'b', 'c'], 'exam-format choice must offer exactly a/b/c');
      assert.ok(c.options.includes(c.answer), 'choice answer must be one of its options');
      keys.add(c.answer);
    }
    assert.deepEqual([...keys].sort(), ['a', 'b', 'c'], `order_index ${orderIndex} must use all three keys`);
    const wordCountMatch = stmt.match(/,\s*(\d+),\s*\d+,\s*\d+\s*\nWHERE NOT EXISTS/);
    assert.ok(wordCountMatch, 'insert is missing word_count');
    assert.ok(Number(wordCountMatch[1]) <= 150, `word_count ${wordCountMatch[1]} exceeds the 150-word A2.1 ceiling`);
  }
});

test('ReadingChecks heads an all-choice lesson "Wähle a, b oder c" and keeps "Richtig oder falsch?" for mixed ones', () => {
  const jsx = readFileSync(join(ROOT, 'src', 'components', 'ReadingChecks.jsx'), 'utf8');
  assert.match(jsx, /checks\.every\(\(c\) => c\.type === 'choice'\)/, 'heading must branch on every check being a choice');
  assert.ok(jsx.includes("'Wähle a, b oder c'"), 'German all-choice heading missing');
  assert.ok(jsx.includes("'Choose a, b or c'"), 'English all-choice heading missing');
  assert.ok(jsx.includes("'Richtig oder falsch?'"), 'German rf heading must survive');
  assert.ok(jsx.includes("'True or false?'"), 'English rf heading must survive');
});

test('the a2 seed JSON mirrors the migration: 3 rewritten A2.1 lessons carry checks, 2 exam-format lessons appended', () => {
  const seed = JSON.parse(readFileSync(join(ROOT, 'content', 'reading', 'a2-lessons.json'), 'utf8'));
  const a21 = seed.filter((l) => String(l.level).toLowerCase() === 'a2.1');
  assert.equal(a21.length, 5, 'the a2 seed holds 3 rewritten + 2 exam-format A2.1 lessons');
  for (const l of a21) {
    assert.ok(Array.isArray(l.checks) && l.checks.length >= 5, `${l.title_de} is missing checks`);
    assert.ok(l.word_count <= 150, `${l.title_de} exceeds 150 words in the seed`);
  }
  assert.deepEqual(a21.map((l) => l.order_index), [6, 7, 8, 9, 10]);
});
