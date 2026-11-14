import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A11 as c } from '../src/data/curricula/a11.js';
import { proofTasks, proofTaskFor, judgeProof, answerProof } from '../src/lib/lesson/proof.js';
import { proofFindings } from '../scripts/validate-curriculum.mjs';
import { referenceKinds } from '../src/lib/lesson/taughtSet.js';
import { FULL_HOUR } from '../src/data/curricula/a11.sets.js';
const cases = JSON.parse(readFileSync(new URL('./helpers/proofWriterCases7.json', import.meta.url)));
const names = { full: 'Sam Miller', first: 'Sam', surname: 'Miller' };
const lessons = new Map(c.lektionen.slice(1).map((l) => {
  const draft = JSON.parse(readFileSync(new URL(`../docs/course-factory/a11-guided/content/l${String(l.nr).padStart(2, '0')}.json`, import.meta.url)));
  return [l.nr, { ...l, proof: draft.proof }];
}));
test('eleven writers’ concrete answers stay fair in judge and saved-run reducer', () => {
  assert.ok(cases.length > 600);
  for (const row of cases) {
    const tasks = proofTasks(lessons.get(row.nr));
    const task = proofTaskFor(tasks[row.goal]);
    assert.equal(judgeProof(task, row.value, names).result !== 'wrong', row.expected, `L${row.nr}.${row.goal}: ${row.value}`);
    const goals = tasks.slice(0, row.goal).map((t) => ({ tries: 1, passed: true, firstTry: true, ...(t.type === 'listening' ? { evidence: 'heard-listening' } : {}) }));
    const state = answerProof(tasks, { goals }, { kind: 'typed', value: row.value, listened: true }, names);
    assert.equal(state.goals[row.goal].passed, row.expected, `reducer L${row.nr}.${row.goal}: ${row.value}`);
  }
});
test('passing drafts equal merged proofs, for every Lektion from 2 to 12', () => {
  for (const l of c.lektionen.slice(1)) assert.deepEqual(l.proof, lessons.get(l.nr).proof);
});
test('new proof production has no model-only microphone route', () => {
  for (const l of lessons.values()) for (const [i, task] of proofTasks(l).entries()) {
    const tasks = proofTasks(l), goals = tasks.slice(0, i).map((t) => ({ tries: 1, passed: true, firstTry: true, ...(t.type === 'listening' ? { evidence: 'heard-listening' } : {}) }));
    const before = { goals, phase: 'ask' };
    assert.equal(task.micOff, true);
    assert.deepEqual(answerProof(tasks, before, { kind: 'mic', result: { pct: 1, usedMic: true } }, names), before);
  }
});
test('frame expansion cannot smuggle untaught words, missing slot sets or malformed multi-sentence limits', () => {
  for (const mutate of [
    (t) => { t.sets.taughtValues1.push('Quantencomputer'); },
    (t) => { delete t.sets.taughtValues1; },
    (t) => { t.parts[0].maxSentences = 0; },
    (t) => { t.parts[0].frames[0].slots.value = 'missing'; },
  ]) {
    const cc = structuredClone(c); mutate(cc.lektionen[4].proof.tasks[0]);
    assert.ok(proofFindings(cc).length, String(mutate));
  }
});
test('clock reference follows delivery, not the Uhr noun', () => {
  assert.equal(referenceKinds({ promptDe: 'Was kostet die Uhr?' }, [FULL_HOUR], c.lektionen[3].id).includes('clock'), false);
  assert.equal(referenceKinds({ promptDe: 'Um wie viel Uhr?' }, [FULL_HOUR], c.lektionen[5].id).includes('clock'), true);
});
