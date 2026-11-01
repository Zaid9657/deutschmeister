import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writingTasksForExam } from '../src/data/writingTasks.js';
import { writingTasksForExam as serverTasks } from '../netlify/functions/_shared/writingTasks.mjs';
import { buildWritingPrompt } from '../netlify/functions/evaluate-writing.mjs';
import { TELC_WRITING_EXAMPLE as example } from '../src/data/telcWritingExample.js';

test('every telc B1 writing task has four distinct Leitpunkte, in Sie form', () => {
  const tasks = writingTasksForExam('telc_b1');
  assert.ok(tasks.length > 0);
  for (const task of tasks) {
    assert.equal(task.leitpunkte.length, 4, task.taskKey);
    assert.equal(new Set(task.leitpunkte).size, 4, task.taskKey);
    assert.doesNotMatch([task.task, ...task.leitpunkte].join(' '), /\b(du|dein\w*|dir|dich)\b/i);
    for (const point of task.leitpunkte) assert.match(point, /\bSie\b/);
  }
});

test('the grader receives the same four points and requests four coverage verdicts', () => {
  const tasks = writingTasksForExam('telc_b1');
  assert.deepEqual(serverTasks('telc_b1'), tasks);
  for (const task of tasks) {
    const prompt = buildWritingPrompt(task, 'Ein eigener Brief.');
    task.leitpunkte.forEach((point, i) => assert.ok(prompt.includes(`${i + 1}. ${point}`)));
    assert.match(prompt, /"leitpunkt_check": \[<true\|false>, <true\|false>, <true\|false>, <true\|false>\]/);
  }
});

test('delivery points separate the order from the problem; every model answers the task length', () => {
  assert.match(example.task.leitpunkte[0], /was Sie wann bestellt/);
  assert.match(example.task.leitpunkte[1], /Problem mit der Lieferung/);
  assert.match(example.task.leitpunkte[3], /Frist/);
  for (const lines of [example.draft, example.revision]) {
    const words = lines.join(' ').trim().split(/\s+/).length;
    assert.ok(words >= example.task.minWords && words <= example.task.maxWords, `${words} words`);
  }
  assert.equal(example.label, 'Demonstrationsbeispiel, kein Kundentext');
  assert.match(example.provenance, /redaktionell/);
  assert.match(example.provenance, /Keine aufgezeichnete KI-Bewertung/);
  assert.equal(example.feedback.leitpunkt_check.length, example.task.leitpunkte.length);
  assert.deepEqual(example.feedback.leitpunkt_check, [true, true, true, false]);
  for (const correction of example.feedback.corrections) {
    assert.ok(example.draft.join(' ').includes(correction.original));
    assert.ok(example.revision.join(' ').includes(correction.corrected));
    assert.ok(!example.revision.join(' ').includes(correction.original));
  }
  assert.doesNotMatch(example.draft.join(' '), /bis Freitag/);
  assert.match(example.revision.join(' '), /bis Freitag/);
  assert.ok(!('total_score' in example.feedback), 'no invented evaluated score');
});
