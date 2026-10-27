// A listening part whose questions failed to load (X-075).
//
// supabase-js resolves a network or HTTP failure as { data: null, error } — it
// does not throw. useExerciseDetails ignored the error of its question and
// dialogue reads and published `data || []`, so the exercise came back valid,
// with no questions, loading false and error null. In a timed mock exam
// MockListeningPart then showed playable audio with nothing to answer, and if
// the connection recovered before the end, the final scoring fetched the keys
// again and counted every unseen item as wrong.
//
// The rule: a failed question or dialogue read is a failed load (the hook
// reports an error and publishes no exercise), both reads are bounded like
// fetchExerciseQuestions, and the runner shows a retry — never an empty part.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const hookSource = read('src/hooks/useListening.js');
const runSource = read('src/pages/Modelltest/ModelltestRun.jsx');

const settle = () => new Promise((resolve) => setImmediate(resolve));

/** A supabase stand-in: every chain resolves to what `answer(table)` returns. */
function fakeSupabase(answer) {
  return {
    from(table) {
      const chain = {
        select: () => chain,
        ilike: () => chain,
        eq: () => chain,
        order: () => chain,
        single: () => chain,
        then: (resolve, reject) => Promise.resolve().then(() => answer(table)).then(resolve, reject),
      };
      return chain;
    },
  };
}

/** Runs the real useExerciseDetails once (its effect included) and returns the published state. */
async function loadExercise(answer) {
  const start = hookSource.indexOf('export function useExerciseDetails');
  const end = hookSource.indexOf('export function useSaveProgress');
  const states = [];
  let cursor = 0;
  let effect = null;
  const timeouts = [];
  const context = {
    supabase: fakeSupabase(answer),
    withTimeout: (promise) => { timeouts.push(promise); return promise; },
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], (value) => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useCallback: (fn) => fn,
    useEffect: (fn) => { effect = fn; },
    parseInt,
  };
  const hook = runInNewContext(`(() => { ${hookSource.slice(start, end).replace('export function', 'function')} return useExerciseDetails; })()`, context);
  const render = () => { cursor = 0; return hook('a1.1', '1'); };
  render();
  effect();
  await settle();
  await settle();
  return { result: render(), timeouts };
}

const exerciseRow = { id: 'ex-1', level: 'A1.1', exercise_number: 1, title: 'Übung 1' };
const questionRows = [{ id: 'q1', question_number: 1, options: ['a) Ja', 'b) Nein'], correct_answer: 'a' }];

test('a failed question read is a failed load, not an exercise with no questions', async () => {
  const { result } = await loadExercise((table) => {
    if (table === 'listening_exercises') return { data: exerciseRow, error: null };
    if (table === 'listening_questions') return { data: null, error: { message: 'TypeError: Failed to fetch' } };
    return { data: [], error: null };
  });
  assert.equal(result.loading, false);
  assert.match(String(result.error), /Failed to fetch/);
  assert.equal(result.exercise, null, 'no playable exercise is published');
  assert.equal(result.questions.length, 0);
  assert.equal(typeof result.retry, 'function', 'the hook offers its retry');
});

test('a failed dialogue read fails the load the same way', async () => {
  const { result } = await loadExercise((table) => {
    if (table === 'listening_exercises') return { data: exerciseRow, error: null };
    if (table === 'listening_dialogues') return { data: null, error: { message: 'upstream request timeout' } };
    return { data: questionRows, error: null };
  });
  assert.match(String(result.error), /timeout/);
  assert.equal(result.exercise, null);
});

test('a healthy load publishes the exercise and its questions, with every read bounded', async () => {
  const { result, timeouts } = await loadExercise((table) => {
    if (table === 'listening_exercises') return { data: exerciseRow, error: null };
    if (table === 'listening_questions') return { data: questionRows, error: null };
    return { data: [], error: null };
  });
  assert.equal(result.error, null);
  assert.deepEqual(result.exercise, exerciseRow);
  assert.deepEqual(result.questions, questionRows);
  assert.equal(timeouts.length, 3, 'the exercise, dialogue and question reads all go through withTimeout');
});

test('the mock runner shows a retry for a failed or empty listening part, never audio without questions', () => {
  const part = runSource.slice(runSource.indexOf('function MockListeningPart'), runSource.indexOf('const ModelltestRun = () =>'));
  assert.match(part, /const \{ exercise, questions: allQuestions, loading, error, retry \} = useExerciseDetails\(/);
  const failure = part.match(/if \(error \|\| !exercise \|\| questions\.length === 0\) \{[\s\S]*?\n {2}\}\n/);
  assert.ok(failure, 'an error, a missing exercise and an empty question list are all a load failure');
  assert.match(failure[0], /<Button[^>]*onClick=\{retry\}[^>]*>\s*Erneut laden\s*<\/Button>/);
  assert.ok(part.indexOf('if (error || !exercise || questions.length === 0)') < part.indexOf('<audio ref={audioRef}'), 'checked before the audio is rendered');
});
