// The placement test's listening step (src/components/LevelTest/LevelTestListening.jsx).
//
//   1. Every question it presents can be answered (C-073/C-086/X-070). Since
//      Course Factory Wave 2 each A1/A2 exercise carries 23 questions, three of
//      them dictation rows with options NULL. The card renders only options and
//      enables "Next Exercise" when every presented question has an answer, so
//      a dictation row kept it disabled for good: the first exercise is always
//      A1.1, and every tester had to skip listening. The rows below are parsed
//      from the migrations that put them in the database.
//   2. A failed load shows Retry and Skip (X-078). The loading screen was
//      checked before the error, and a failed load leaves stage 'loading', so
//      the spinner turned forever and a reload threw away the written answers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  placementListeningQuestions, isChoiceQuestion, PLACEMENT_LISTENING_MAX,
} from '../src/components/LevelTest/drawQuestions.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const COMPONENT = 'src/components/LevelTest/LevelTestListening.jsx';

const MIGRATIONS = [
  'migrations/2026-09-05-a1-1-listening.sql',
  'migrations/2026-09-05-a1-2-listening.sql',
  'migrations/2026-09-06-a2-1-listening.sql',
  'migrations/2026-09-06-a2-2-listening.sql',
];
const COLUMNS = ['exercise_id', 'dialogue_number', 'question_number', 'question_type', 'question_text', 'options', 'correct_answer', 'acceptable_answers', 'explanation'];

/** The SELECT value list of one generated INSERT → a listening_questions row. */
function parseValues(text) {
  const values = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/[\s,]/.test(ch)) { i += 1; continue; }
    if (ch === "'") {
      let out = '';
      i += 1;
      for (;;) {
        if (text[i] === "'" && text[i + 1] === "'") { out += "'"; i += 2; continue; }
        if (text[i] === "'") { i += 1; break; }
        out += text[i];
        i += 1;
      }
      if (text.startsWith('::jsonb', i)) { values.push(JSON.parse(out)); i += '::jsonb'.length; } else values.push(out);
      continue;
    }
    const m = text.slice(i).match(/^(NULL|-?\d+)/);
    assert.ok(m, `unparsed SQL at: ${text.slice(i, i + 40)}`);
    values.push(m[1] === 'NULL' ? null : Number(m[1]));
    i += m[1].length;
  }
  return Object.fromEntries(COLUMNS.map((c, k) => [c, values[k]]));
}

function migrationRows(file) {
  const sql = read(file).split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  return [...sql.matchAll(/INSERT INTO public\.listening_questions\n[^\n]*\nSELECT\n([\s\S]*?)\nWHERE NOT EXISTS/g)]
    .map((m, n) => ({ id: `${file}#${n}`, ...parseValues(m[1]) }));
}

const ROWS = MIGRATIONS.flatMap(migrationRows);
const byExercise = ROWS.reduce((map, row) => map.set(row.exercise_id, [...(map.get(row.exercise_id) || []), row]), new Map());

/** Questions 1–10 of an exercise as they were before Wave 2: choice questions (their rows predate these files). */
const originals = (exerciseId) => Array.from({ length: 10 }, (_, k) => ({
  id: `${exerciseId}#q${k + 1}`, exercise_id: exerciseId, question_number: k + 1, question_type: 'multiple_choice',
  options: ['a) eins', 'b) zwei', 'c) drei'], correct_answer: 'a',
}));

test('the migrations are parsed: 4 × 78 rows, with the option-less dictation rows that trapped the step', () => {
  assert.equal(ROWS.length, 4 * 78);
  assert.equal(byExercise.size, 24, '6 exercises per level');
  const dictation = ROWS.filter((r) => r.question_type === 'dictation');
  assert.ok(dictation.length >= 4 * 18, `${dictation.length} dictation rows`);
  assert.ok(dictation.every((r) => r.options === null), 'dictation rows carry no options');
  assert.ok(ROWS.filter((r) => r.question_type !== 'dictation').every((r) => Array.isArray(r.options) && r.options.length > 0));
});

test('every question the placement listening presents has options to pick, at most ten per exercise', () => {
  for (const [exerciseId, added] of byExercise) {
    const live = [...originals(exerciseId), ...added].reverse(); // any order the database returns
    const presented = placementListeningQuestions(live);
    assert.ok(presented.length > 0 && presented.length <= PLACEMENT_LISTENING_MAX, `${exerciseId}: ${presented.length}`);
    for (const q of presented) {
      assert.ok(Array.isArray(q.options) && q.options.length > 0, `${q.id} has no options to pick`);
      assert.notEqual(q.question_type, 'dictation');
    }
    assert.deepEqual(presented.map((q) => q.question_number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 'the first ten, in order');
  }
  // Every added row on its own: a choice row could be presented, a dictation row never.
  for (const row of ROWS) assert.equal(isChoiceQuestion(row), row.question_type !== 'dictation', row.id);
  // An option-less row inside the first ten is still never presented.
  const trap = [...originals('x').slice(0, 4), { id: 'x#dict', question_number: 5, question_type: 'dictation', options: null }, ...originals('x').slice(5)];
  assert.ok(placementListeningQuestions(trap).every(isChoiceQuestion));
  assert.equal(placementListeningQuestions(trap).length, 9);
});

test('the step renders and scores the selected questions, and waits only for those', () => {
  const src = read(COMPONENT);
  assert.match(src, /import \{ placementListeningQuestions \} from '\.\/drawQuestions\.js';/);
  assert.match(src, /questions: placementListeningQuestions\(questionsData \|\| \[\]\)/, 'selected before setExercises');
  assert.match(src, /return currentQuestions\.every\(q => answers\[q\.id\] !== undefined\);/);
  assert.match(src, /setCurrentQuestions\(validExercises\[0\]\.questions\)/);
  assert.match(src, /exercises\.forEach\(\(\{ level, questions \}\) => \{/, 'scoring reads the same list');
});

// ── 2. a failed load ────────────────────────────────────────────────────────

/** Run the component's own loadExercises against a failing database; returns the state it leaves. */
async function failedLoad(failure) {
  const src = read(COMPONENT);
  const body = src.match(/ {2}const loadExercises = async \(\) => \{([\s\S]*?)\n {2}\};/)[1];
  const state = { stage: 'intro', error: 'old error' };
  const query = (result) => {
    const chain = { select: () => chain, eq: () => chain, order: () => chain, limit: () => Promise.resolve(result), then: (f, r) => Promise.resolve(result).then(f, r) };
    return chain;
  };
  const supabase = { from: () => query(failure) };
  const run = new Function('setStage', 'setError', 'testLevels', 'supabase', 'placementListeningQuestions', 'setExercises', 'setCurrentQuestions', 'console',
    `return (async () => {${body}\n})();`);
  await run((s) => { state.stage = s; }, (e) => { state.error = e; }, ['A1.1', 'A2.1', 'B1.1', 'B2.1'], supabase,
    placementListeningQuestions, () => { state.exercises = true; }, () => {}, { error: () => {} });
  return state;
}

/** Which screen the component returns for a state: its top-level `if (…)` guards, in source order. */
function screenFor(state) {
  const src = read(COMPONENT);
  const start = src.indexOf('  const currentLevel = exercises[currentExerciseIndex]?.level;');
  const end = src.indexOf('  // Testing screen');
  const region = src.slice(start, end);
  const guards = [...region.matchAll(/^ {2}if \((.+)\) \{$/gm)].map((m, k, all) => ({
    condition: m[1],
    block: region.slice(m.index, all[k + 1]?.index ?? region.length),
  }));
  assert.ok(guards.length >= 3, 'the intro, loading and error guards');
  return guards.find((g) => new Function('stage', 'error', `return (${g.condition});`)(state.stage, state.error))?.block ?? 'testing';
}

test('a failed load shows Try Again and Skip Listening, not an endless spinner', async () => {
  for (const failure of [
    { data: null, error: { message: 'network' } }, // the read fails → catch
    { data: [], error: null }, // no exercises at all
  ]) {
    const state = await failedLoad(failure);
    assert.equal(state.stage, 'loading', 'a failed load leaves the stage where it was');
    assert.ok(state.error, 'and sets the error');
    const screen = screenFor(state);
    assert.match(screen, /Try Again/, JSON.stringify(failure));
    assert.match(screen, /Skip Listening/);
    assert.doesNotMatch(screen, /Loading Exercises/);
  }
  // A load that has not failed still shows the spinner, and the intro still opens the step.
  assert.match(screenFor({ stage: 'loading', error: null }), /Loading Exercises/);
  assert.match(screenFor({ stage: 'intro', error: null }), /Start Listening Test/);
});
