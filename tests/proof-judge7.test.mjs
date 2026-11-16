import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM_A11 as c } from '../src/data/curricula/a11.js';
import { proofTasks, judgeProof, proofHint, proofModel } from '../src/lib/lesson/proof.js';
import { expandProofPart } from '../src/lib/lesson/proofFrames.js';
const make = (nr, parts, extra = {}) => proofTasks({ ...c.lektionen[nr - 1], proof: { tasks: [{ type: 'production', parts: parts.map((forms) => ({ label: { de: 'der Teil', en: 'the part' }, forms })), ...extra }] } })[0];
const cases = [
  [make(4, [['Was ist das?'], ['Was kostet sie?']]), 'Entschuldigung! Was ist das? Was kostet sie? Danke.', true],
  [make(4, [['Was ist das?'], ['Was kostet sie?']]), 'Entschuldigung! Was ist das? Danke.', false],
  [make(4, [['Was ist das?']]), 'Guten Tag! Was ist das?', false],
  [make(4, [['Was ist das?']], { firstContact: true }), 'Guten Tag! Was ist das?', true],
  [make(7, [['Ich lese gern.']]), 'Ich lese gern. Und du?', true],
  [make(7, [['Ich lese gern.']]), 'Und du?', false],
  [make(5, [['Wo ist das Wörterbuch?']]), 'Tim, wo ist das Wörterbuch?', true],
  [make(5, [['Wo ist das Wörterbuch?']]), 'Wo ist das Wörterbuch, Tim?', true],
  [make(5, [['Wo ist das Wörterbuch?']]), 'Tom, wo ist das Wörterbuch?', false],
  [make(2, [['Ich komme aus Marokko.'], ['Ich bin Studentin.']], { order: 'any' }), 'Ich bin Studentin. Ich komme aus Marokko.', true],
  [make(2, [['Ich komme aus Marokko.'], ['Ich bin Studentin.']]), 'Ich bin Studentin. Ich komme aus Marokko.', false],
  [make(2, [['Ich komme aus Marokko.'], ['Ich bin Studentin.']], { order: 'any' }), 'Ich bin Studentin. Ich bin Studentin.', false],
];
test('brief 7 judge pass/fail table', () => {
  for (const [task, value, expected] of cases) assert.equal(judgeProof(task, value).result !== 'wrong', expected, value);
});
test('multi-sentence alternatives fulfil one complete goal, not a subset or duplicate', () => {
  const task = make(3, [['Ich spreche Arabisch und Deutsch.', 'Ich spreche Arabisch. Ich spreche Deutsch.']]);
  task.parts[0].maxSentences = 2;
  for (const [value, right] of [['Ich spreche Arabisch und Deutsch.', true], ['Ich spreche Arabisch. Ich spreche Deutsch.', true], ['Ich spreche Arabisch.', false], ['Ich spreche Deutsch. Ich spreche Deutsch.', false]]) assert.equal(judgeProof(task, value).result !== 'wrong', right, value);
});
test('finite frames expand named sets and stay in the ordinary checker', () => {
  const part = expandProofPart({ frames: [{ pattern: 'Der Stift ist {colour}.', slots: { colour: 'colours' } }] }, { colours: ['rot', 'blau'] });
  assert.deepEqual(part.forms, ['Der Stift ist rot.', 'Der Stift ist blau.']);
  const task = make(5, [part.forms]);
  for (const [value, right] of [['Der Stift ist rot.', true], ['Der Stift ist blau.', true], ['Das Stift ist rot.', false], ['Der Stift ist gelb.', false]]) assert.equal(judgeProof(task, value).result !== 'wrong', right);
});
test('own-name ss follows shared spelling, and hints distinguish register from other misses', () => {
  const task = proofTasks(c.lektionen[0])[1];
  assert.notEqual(judgeProof(task, 'Ich heisse Sam Miller.').result, 'wrong');
  const formal = make(2, [['Was sind Sie von Beruf?']], { register: 'formal' });
  for (const [value, mismatch] of [['Was bist du von Beruf?', true], ['Wie ist Ihr Beruf?', false]]) {
    const result = judgeProof(formal, value);
    assert.equal(result.registerMiss, mismatch);
    assert.equal(proofHint(formal, result.part, result.registerMiss).en.includes('Say it formally'), mismatch);
  }
  assert.doesNotMatch(proofModel({ notice: { bodyDe: '**Wichtig**', bodyEn: '**Important**' } }, { kind: 'notice' }).de, /\*/);
});
