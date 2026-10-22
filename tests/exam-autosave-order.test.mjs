import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createExamAutosave } from '../src/pages/Modelltest/examAutosave.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));

function controlledService() {
  const requests = [];
  const supabase = { from: () => ({ update: values => ({ eq: (_column, id) => new Promise((resolve, reject) => {
    requests.push({ id, values, resolve, reject });
  }) }) }) };
  const source = read('src/services/examService.js')
    .replace(/^import .*;\n/m, '')
    .replaceAll('export async function ', 'async function ');
  const service = new Function('supabase', `${source}\nreturn { saveAnswers, advanceSectionDeadline, completeAttempt };`)(supabase);
  return { service, requests };
}

test('exam transitions, completion and unmount cancel a pending autosave', () => {
  const writes = [];
  const timers = new Map();
  let timerId = 0;
  const autosave = createExamAutosave((...args) => writes.push(args), {
    setTimer: callback => { timers.set(++timerId, callback); return timerId; },
    clearTimer: id => timers.delete(id),
  });
  for (const _action of ['transition', 'completion', 'unmount']) {
    autosave.schedule('attempt', { _meta: { sectionIndex: 0 } });
    autosave.cancel();
    for (const callback of timers.values()) callback();
    assert.equal(writes.length, 0);
    assert.equal(timers.size, 0);
  }

  const run = read('src/pages/Modelltest/ModelltestRun.jsx');
  assert.match(run, /return \(\) => autosave\.cancel\(\);/);
  const finish = run.slice(run.indexOf('  const finish ='), run.indexOf('  const nextSection ='));
  const transition = run.slice(run.indexOf('  const nextSection ='), run.indexOf('  // Time up'));
  assert.match(finish, /autosaveRef\.current\.cancel\(\);/);
  assert.match(transition, /autosaveRef\.current\.cancel\(\);/);
  assert.ok(finish.indexOf('autosaveRef.current.cancel();') < finish.indexOf('await loadMissingListeningKeys('));
  assert.ok(transition.indexOf('autosaveRef.current.cancel();') < transition.indexOf('await advanceSectionDeadline('));
});

test('an already-running exam autosave finishes before a newer section or completion write', async () => {
  const { service, requests } = controlledService();
  const writes = [service.saveAnswers('attempt', { _meta: { sectionIndex: 0 }, old: 'answer' })];
  await settle();
  assert.equal(requests.length, 1);
  writes.push(service.saveAnswers('attempt', { _meta: { sectionIndex: 1 }, next: 'answer' }));
  writes.push(service.advanceSectionDeadline('attempt', 15));
  writes.push(service.completeAttempt('attempt', { answers: { _meta: { sectionIndex: 2 }, final: 'answer' }, score: 4, maxScore: 5, sectionScores: {} }));
  await settle();
  assert.equal(requests.length, 1, 'newer writes wait for the old in-flight request');

  const saved = {};
  for (let index = 0; index < 4; index++) {
    assert.equal(requests.length, index + 1);
    Object.assign(saved, requests[index].values);
    requests[index].resolve({ error: null });
    await settle();
  }
  await Promise.all(writes);
  assert.equal(saved.status, 'completed');
  assert.deepEqual(saved.answers, { _meta: { sectionIndex: 2 }, final: 'answer' });
  assert.ok(saved.section_deadline);
});

test('exam write serialization is per attempt and continues after a rejected request', async () => {
  const { service, requests } = controlledService();
  const first = service.saveAnswers('first', { answer: 'a' });
  const rejected = assert.rejects(first, /network failure/);
  const other = service.saveAnswers('other', { answer: 'b' });
  const next = service.saveAnswers('first', { answer: 'c' });
  await settle();
  assert.deepEqual(requests.map(request => request.id), ['first', 'other']);
  requests[0].reject(new Error('network failure'));
  requests[1].resolve({ error: null });
  await settle();
  assert.equal(requests[2].id, 'first');
  requests[2].resolve({ error: null });
  await rejected;
  assert.deepEqual(await Promise.all([other, next]), [true, true]);
});

test('an exam section transition saves its answers marker and deadline in one ordered update', async () => {
  const { service, requests } = controlledService();
  const answers = { answer: 'a', _meta: { sectionIndex: 1 } };
  const transition = service.advanceSectionDeadline('attempt', 15, answers);
  await settle();
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].values.answers, answers);
  assert.ok(requests[0].values.section_deadline);
  requests[0].resolve({ error: null });
  assert.equal(await transition, requests[0].values.section_deadline);

  const run = read('src/pages/Modelltest/ModelltestRun.jsx');
  const next = run.slice(run.indexOf('  const nextSection ='), run.indexOf('  // Time up'));
  assert.match(next, /advanceSectionDeadline\(attempt\.id, mock\.sections\[nextIdx\]\.minutes, nextAnswers\)/);
  assert.ok(next.indexOf('if (!newDeadline)') < next.indexOf('setSectionIndex(nextIdx)'));
  assert.doesNotMatch(next, /await saveAnswers\(/);
});

test('a rejected exam autosave is handled and the next save can still run', async () => {
  const failures = [];
  const previousError = console.error;
  let timer;
  let calls = 0;
  const autosave = createExamAutosave(async () => {
    calls++;
    if (calls === 1) throw new Error('network failure');
  }, { setTimer: callback => { timer = callback; return 1; }, clearTimer: () => {} });
  try {
    console.error = (...args) => failures.push(args);
    autosave.schedule('attempt', { answer: 'a' });
    timer();
    await settle();
    assert.deepEqual(failures, [['[ModelltestRun] autosave:', 'network failure']]);
    autosave.schedule('attempt', { answer: 'b' });
    timer();
    await settle();
    assert.equal(calls, 2);
    assert.equal(failures.length, 1);
  } finally {
    console.error = previousError;
  }
});
