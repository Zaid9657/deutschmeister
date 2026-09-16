// Guard suite for the A1.1 course linked-practice migration
// (docs/superpowers/plans/2026-09-15-deutschstart-a11-course-readiness.md, Task 3 Step 4):
// migrations/2026-09-16-a1-1-course-linked-practice.sql.
//
// What each pin defends:
//
//   1. VOLUME AND ADDRESSING — exactly 2 new reading_lessons at order_index 11
//      and 12 with the LOWERCASE level 'a1.1' (the reading_lessons check
//      constraint, unlike every other content table), and exactly 6 new
//      listening_exercises at the UPPERCASE level 'A1.1', exercise_number
//      7–12, each with the deterministic storage audio_url the player derives
//      (audio/listening/A1.1/exercise<N>.mp3) and status 'pending' (no
//      recorded audio exists until the owner's Azure run in
//      docs/owner-prompts.md).
//   2. IDEMPOTENCY — reading inserts guarded by (level, title_de), exercise
//      inserts by (level, exercise_number); dialogue and question inserts
//      SELECT ... FROM listening_exercises (so a missing parent inserts
//      NOTHING instead of an orphan row with a NULL exercise_id) and are
//      guarded by (exercise_id, dialogue_number) / (exercise_id,
//      question_number).
//   3. QUESTION SHAPE — 8 questions per new exercise (48 total), numbers 1–8
//      unique per exercise, types only multiple_choice/richtig_falsch in the
//      option conventions ExercisePlayer/QuestionCard rely on ("a) …" with a
//      letter answer / exactly ["Richtig","Falsch"]), and every question's
//      dialogue_number pointing at a dialogue the same migration inserts.
//   4. THE LINKS ARE HONEST BOTH WAYS — every a11.js Lektion now carries
//      integer links.listeningExercise and links.readingOrder, no number is
//      linked twice, and every referenced number resolves: to a LIVE row
//      (listening 1–6 / reading 1–10, queried 2026-09-13) or to a row THIS
//      migration inserts (listening 7–12 / reading 11–12). L2's restored
//      „Lesen Teil 1“ claim must point at the migration's Teil-1 email text.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(join(ROOT, 'migrations', '2026-09-16-a1-1-course-linked-practice.sql'), 'utf8');
const sqlNoComments = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n');

// What the live tables carried when the counts were last read against the DB
// (2026-09-13, see the L2 comment history in src/data/curricula/a11.js).
const LIVE_LISTENING = [1, 2, 3, 4, 5, 6];
const LIVE_READING = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Statement bodies contain literal ';' and multi-line German text, so — as in
// tests/a1-1-reading.test.mjs — statements are cut at the NEXT statement's
// start line, never at the first ';' found.
const STARTS_RE = /^INSERT INTO public\.(reading_lessons|listening_exercises|listening_dialogues|listening_questions)\b/gm;
function statements() {
  const starts = [...sqlNoComments.matchAll(STARTS_RE)].map((m) => ({ index: m.index, table: m[1] }));
  const commitAt = sqlNoComments.indexOf('\nCOMMIT;');
  const boundaries = [...starts.map((s) => s.index), commitAt === -1 ? sqlNoComments.length : commitAt];
  return starts.map((s) => ({
    table: s.table,
    text: sqlNoComments.slice(s.index, boundaries.find((b) => b > s.index) ?? sqlNoComments.length),
  }));
}
const byTable = (t) => statements().filter((s) => s.table === t).map((s) => s.text);

function jsonbLiterals(stmtText) {
  const out = [];
  const re = /'((?:[^']|'')*)'::jsonb/g;
  let m;
  while ((m = re.exec(stmtText))) out.push(JSON.parse(m[1].replace(/''/g, "'")));
  return out;
}

// The migration's own inserted addresses, parsed once and reused by the
// resolution test at the bottom.
function insertedReadingOrders() {
  return byTable('reading_lessons').map((stmt) => {
    const m = stmt.match(/(\d+), (\d+), (\d+), (\d+)\s*\r?\nWHERE NOT EXISTS/);
    assert.ok(m, 'reading insert is missing its trailing word_count/difficulty/time/order_index row');
    return { wordCount: Number(m[1]), orderIndex: Number(m[4]), stmt };
  });
}
function insertedExerciseNumbers() {
  return byTable('listening_exercises').map((stmt) => {
    const m = stmt.match(/SELECT\s*\r?\n\s*'A1\.1', (\d+), '((?:[^']|'')*)', '((?:[^']|'')*)', '([a-z_]+)',\s*\r?\n\s*'([^']+)'/);
    assert.ok(m, `exercise insert not at level 'A1.1' or malformed:\n${stmt.slice(0, 200)}`);
    return { number: Number(m[1]), title: m[2].replace(/''/g, "'"), type: m[4], audioUrl: m[5], stmt };
  });
}

test('one transaction: BEGIN before the first insert, COMMIT after the last', () => {
  assert.match(sqlNoComments, /^BEGIN;$/m);
  assert.match(sqlNoComments, /^COMMIT;$/m);
  const first = sqlNoComments.search(STARTS_RE);
  assert.ok(sqlNoComments.indexOf('BEGIN;') < first, 'BEGIN must precede the first INSERT');
  assert.ok(sqlNoComments.indexOf('\nCOMMIT;') > first, 'COMMIT must follow the inserts');
});

test('2 reading lessons at lowercase a1.1, order_index 11 and 12, guarded by (level, title_de)', () => {
  const readings = insertedReadingOrders();
  assert.equal(readings.length, 2, `expected 2 reading INSERTs, found ${readings.length}`);
  assert.deepEqual(readings.map((r) => r.orderIndex).sort((a, b) => a - b), [11, 12]);
  for (const { stmt } of readings) {
    assert.match(stmt, /SELECT\s*\r?\n\s*'a1\.1',/, 'insert must land at level a1.1 (lowercase — the check constraint)');
    assert.doesNotMatch(stmt, /'A1\.1'/, 'an uppercase level would violate reading_lessons_level_check');
    assert.match(stmt, /WHERE NOT EXISTS \(\s*\r?\n\s*SELECT 1 FROM public\.reading_lessons WHERE level = 'a1\.1' AND title_de = '(?:[^']|'')+'\s*\r?\n\);/);
  }
});

test('reading 11 is the SD1 Lesen-Teil-1 email (5 rf checks); reading 12 matches L6 with 4 checks split 2/2', () => {
  const readings = insertedReadingOrders();
  const r11 = readings.find((r) => r.orderIndex === 11);
  const r12 = readings.find((r) => r.orderIndex === 12);

  // The Teil-1 gap is the whole reason this row exists (old L2 comment: the
  // ten live texts held no E-Mail/Brief format).
  assert.match(r11.stmt, /Teil 1/, 'reading 11 must present itself as the Lesen-Teil-1 exam format');
  assert.match(r11.stmt, /E-Mail/, 'reading 11 must be the email format SD1 Lesen Teil 1 tests');
  const checks11 = jsonbLiterals(r11.stmt)[2];
  assert.equal(checks11.length, 5, 'exam-format lesson carries 5 checks like orders 9 and 10');
  for (const c of checks11) {
    assert.equal(c.type, 'rf', 'SD1 Lesen Teil 1 is richtig/falsch');
    assert.ok(['richtig', 'falsch'].includes(c.answer), `answer ${c.answer} not in the allowed set`);
  }

  assert.match(r12.stmt, /Büro/, 'reading 12 must match L6 (Der erste Tag im Büro)');
  const checks12 = jsonbLiterals(r12.stmt)[2];
  assert.equal(checks12.length, 4, 'everyday lesson carries 4 checks like the 8 rewrites');
  assert.equal(checks12.filter((c) => c.answer === 'richtig').length, 2);
  assert.equal(checks12.filter((c) => c.answer === 'falsch').length, 2);

  for (const r of readings) {
    assert.ok(r.wordCount >= 60 && r.wordCount <= 90, `word_count ${r.wordCount} outside the tasked 60–90 window`);
  }
});

test('6 listening exercises at uppercase A1.1, numbers 7–12, deterministic audio path, status pending', () => {
  const exercises = insertedExerciseNumbers();
  assert.equal(exercises.length, 6, `expected 6 exercise INSERTs, found ${exercises.length}`);
  assert.deepEqual(exercises.map((e) => e.number).sort((a, b) => a - b), [7, 8, 9, 10, 11, 12]);
  const allowedTypes = ['short_dialogues', 'announcements', 'phone_messages', 'long_dialogue', 'interview', 'discussion', 'lecture', 'mini_exam', 'full_exam'];
  for (const e of exercises) {
    assert.ok(allowedTypes.includes(e.type), `exercise_type ${e.type} would violate the CHECK constraint`);
    // The player derives this path itself (src/utils/listeningHelpers.js
    // getAudioUrl) — the column must agree with it, uppercase folder included.
    assert.equal(
      e.audioUrl,
      `https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/audio/listening/A1.1/exercise${e.number}.mp3`,
    );
    assert.match(e.stmt, /'pending'/, 'no recorded audio exists yet — status must be pending until the Azure run');
    assert.match(
      e.stmt,
      new RegExp(`WHERE NOT EXISTS \\(\\s*\\r?\\n\\s*SELECT 1 FROM public\\.listening_exercises WHERE level = 'A1\\.1' AND exercise_number = ${e.number}\\s*\\r?\\n\\);`),
    );
  }
  // The L11 link claims the Hören-Teil-3 family (Ansagen am Telefon).
  assert.equal(exercises.find((e) => e.number === 11).type, 'phone_messages');
});

test('dialogues: keyed to their exercise via FROM listening_exercises, guarded, transcripts non-empty {speaker, text}[]', () => {
  const dialogues = byTable('listening_dialogues');
  assert.ok(dialogues.length >= 12, `expected at least 2 dialogues per exercise, found ${dialogues.length} in total`);
  const perExercise = {};
  for (const stmt of dialogues) {
    const sel = stmt.match(/SELECT le\.id, (\d+), '(?:[^']|'')+',/);
    const from = stmt.match(/FROM public\.listening_exercises le\s*\r?\n\s*WHERE le\.level = 'A1\.1' AND le\.exercise_number = (\d+)/);
    assert.ok(sel && from, `dialogue insert must SELECT ... FROM listening_exercises (no NULL-parent orphans):\n${stmt.slice(0, 200)}`);
    const dialogueNumber = Number(sel[1]);
    const exerciseNumber = Number(from[1]);
    assert.match(stmt, /AND NOT EXISTS \(SELECT 1 FROM public\.listening_dialogues d WHERE d\.exercise_id = le\.id AND d\.dialogue_number = \d+\)/);
    const transcript = jsonbLiterals(stmt)[0];
    assert.ok(Array.isArray(transcript) && transcript.length > 0, 'transcript must be a non-empty jsonb array');
    for (const turn of transcript) {
      assert.ok(['male', 'female'].includes(turn.speaker), `speaker ${turn.speaker} not in the live convention (male/female)`);
      assert.ok(typeof turn.text === 'string' && turn.text.length > 0, 'every transcript turn carries text');
    }
    (perExercise[exerciseNumber] ||= new Set());
    assert.ok(!perExercise[exerciseNumber].has(dialogueNumber), `dialogue ${dialogueNumber} inserted twice for exercise ${exerciseNumber}`);
    perExercise[exerciseNumber].add(dialogueNumber);
  }
  assert.deepEqual(Object.keys(perExercise).map(Number).sort((a, b) => a - b), [7, 8, 9, 10, 11, 12]);
});

test('48 questions — 8 per exercise, numbers 1–8, MC/RF option conventions, dialogue_number resolves', () => {
  const questions = byTable('listening_questions');
  assert.equal(questions.length, 48, `expected 48 question INSERTs, found ${questions.length}`);

  // Rebuild the dialogue map so a question can never target a dialogue the
  // migration does not insert.
  const dialogueNumbers = {};
  for (const stmt of byTable('listening_dialogues')) {
    const n = Number(stmt.match(/le\.exercise_number = (\d+)/)[1]);
    (dialogueNumbers[n] ||= new Set()).add(Number(stmt.match(/SELECT le\.id, (\d+),/)[1]));
  }

  const perExercise = {};
  for (const stmt of questions) {
    const sel = stmt.match(/SELECT le\.id, (\d+), (\d+), '([a-z_]+)',/);
    const from = stmt.match(/FROM public\.listening_exercises le\s*\r?\n\s*WHERE le\.level = 'A1\.1' AND le\.exercise_number = (\d+)/);
    assert.ok(sel && from, `question insert must SELECT ... FROM listening_exercises:\n${stmt.slice(0, 200)}`);
    const [dialogueNumber, questionNumber, questionType] = [Number(sel[1]), Number(sel[2]), sel[3]];
    const exerciseNumber = Number(from[1]);

    assert.ok(dialogueNumbers[exerciseNumber]?.has(dialogueNumber), `exercise ${exerciseNumber} question ${questionNumber} targets dialogue ${dialogueNumber}, which this migration does not insert`);
    assert.match(stmt, new RegExp(`AND NOT EXISTS \\(SELECT 1 FROM public\\.listening_questions q WHERE q\\.exercise_id = le\\.id AND q\\.question_number = ${questionNumber}\\)`));

    assert.ok(['multiple_choice', 'richtig_falsch'].includes(questionType), `unexpected question_type ${questionType}`);
    const answer = stmt.match(/'::jsonb, '([^']+)',\s*\r?\n\s*NULL,/);
    assert.ok(answer, 'MC/RF rows carry jsonb options, a correct_answer and acceptable_answers NULL');
    if (questionType === 'richtig_falsch') {
      assert.match(stmt, /'\["Richtig","Falsch"\]'::jsonb/, 'richtig_falsch options must be exactly ["Richtig","Falsch"]');
      assert.ok(['Richtig', 'Falsch'].includes(answer[1]), `rf correct_answer ${answer[1]} not in the option set`);
    } else {
      assert.match(stmt, /'\["a\) /, 'multiple_choice options must start with "a) "');
      assert.ok(['a', 'b', 'c'].includes(answer[1]), `mc correct_answer ${answer[1]} must be an option key`);
    }

    (perExercise[exerciseNumber] ||= new Set());
    assert.ok(!perExercise[exerciseNumber].has(questionNumber), `question ${questionNumber} inserted twice for exercise ${exerciseNumber}`);
    perExercise[exerciseNumber].add(questionNumber);
  }
  for (const n of [7, 8, 9, 10, 11, 12]) {
    assert.deepEqual([...(perExercise[n] || [])].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8], `exercise ${n} must carry questions 1–8`);
  }
});

test('every a11.js Lektion links both ways and every referenced number resolves (live row or this migration)', () => {
  const listeningAvailable = new Set([...LIVE_LISTENING, ...insertedExerciseNumbers().map((e) => e.number)]);
  const readingAvailable = new Set([...LIVE_READING, ...insertedReadingOrders().map((r) => r.orderIndex)]);
  assert.deepEqual([...listeningAvailable].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.deepEqual([...readingAvailable].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

  const listenings = new Set();
  const readings = new Set();
  for (const l of CURRICULUM_A11.lektionen) {
    assert.ok(Number.isInteger(l.links?.listeningExercise), `${l.id} lacks a linked listening exercise`);
    assert.ok(Number.isInteger(l.links?.readingOrder), `${l.id} lacks a linked reading lesson`);
    assert.ok(listeningAvailable.has(l.links.listeningExercise), `${l.id} links listening ${l.links.listeningExercise}, which neither the live DB nor the migration provides`);
    assert.ok(readingAvailable.has(l.links.readingOrder), `${l.id} links reading ${l.links.readingOrder}, which neither the live DB nor the migration provides`);
    assert.ok(!listenings.has(l.links.listeningExercise), `listening ${l.links.listeningExercise} linked twice`);
    assert.ok(!readings.has(l.links.readingOrder), `reading ${l.links.readingOrder} linked twice`);
    listenings.add(l.links.listeningExercise);
    readings.add(l.links.readingOrder);
  }

  // 12 Lektionen over 12 exercises and 12 texts: with uniqueness this is a
  // bijection — nothing spare, nothing missing.
  assert.equal(listenings.size, 12);
  assert.equal(readings.size, 12);

  // L2's restored „Lesen Teil 1“ claim points at the Teil-1 email this
  // migration creates (RULE 16: the claim needs exactly this surface).
  const l2 = CURRICULUM_A11.lektionen.find((l) => l.nr === 2);
  assert.ok(l2.examTeile.includes('Lesen Teil 1'), 'L2 must claim Lesen Teil 1 again — the gap this migration exists to close');
  assert.equal(l2.links.readingOrder, 11, 'L2 must link the Teil-1 email at order_index 11');
});
