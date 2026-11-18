import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { RESULT } from '../src/lib/lesson/check.js';
import { canDoShown, checkTurns, modelAnswer, spokenShown, typedResult } from '../src/lib/lesson/finalCheck.js';

const withCheck = CURRICULUM_A11.lektionen.filter((l) => l.guided?.check);
const l1 = CURRICULUM_A11.lektionen[0];

test('every final check covers each can-do and names a part to repeat for it', () => {
  assert.ok(withCheck.includes(l1));
  for (const l of withCheck) {
    const { turns, repeat } = l.guided.check;
    l.canDo.forEach((_, i) => {
      assert.ok(turns.some((t) => t.canDo === i), `${l.id} can-do ${i + 1} has no turn`);
      assert.ok(repeat[i]?.en && repeat[i]?.de, `${l.id} can-do ${i + 1} has no part to repeat`);
    });
    assert.ok(turns.every((t) => t.taskEn && t.taskDe && (t.spell || t.accepted?.length)), l.id);
  }
});

test('a retake spells a different name, with its letters in words as well as sound', () => {
  const [a, b] = [0, 1].map((r) => checkTurns(l1.guided.check, r).find((t) => t.spell));
  assert.notEqual(a.accepted[0], b.accepted[0]);
  assert.equal(a.spoken, 'V-O-G-E-L.');
  assert.equal(a.letterNames, 'Vau – O – Ge – E – El');
});

test('typed answers: letters decide the spelling, an own name needs an opening, a case slip is a typo', () => {
  const turns = checkTurns(l1.guided.check, 0);
  const [greet, name, spell, answer, ask] = turns;
  assert.equal(typedResult(spell, 'vogel'), RESULT.CORRECT);
  assert.equal(typedResult(spell, 'V-O-G-E-L'), RESULT.CORRECT);
  assert.equal(typedResult(spell, 'Fogel'), RESULT.WRONG);
  assert.equal(typedResult(name, 'Ich heisse Zaid'), RESULT.CORRECT);
  assert.equal(typedResult(name, 'Mein Name ist Lea.'), RESULT.CORRECT);
  assert.equal(typedResult(name, 'Ich bin'), RESULT.WRONG);
  assert.equal(typedResult(greet, 'guten tag'), RESULT.TYPO);
  assert.equal(typedResult(answer, 'Mir geht es gut, danke'), RESULT.CORRECT);
  assert.equal(typedResult(ask, 'Wie geht es dir?'), RESULT.WRONG);
  assert.equal(modelAnswer(name), 'Ich heiße …');
});

test('only a measured, recognised spoken try counts; "I said it" never does', () => {
  assert.equal(spokenShown({ pct: 1, attempts: 1 }), true);
  assert.equal(spokenShown({ pct: 0.5, attempts: 1 }), false);
  assert.equal(spokenShown({ pct: 1, attempts: 1, selfConfirmed: true }), false);
  assert.equal(spokenShown({ pct: null, attempts: 0, usedMic: false, selfConfirmed: true }), false);
});

test('a can-do is shown only when every one of its turns was shown', () => {
  const turns = checkTurns(l1.guided.check, 0);
  const all = turns.map(() => 'shown');
  assert.deepEqual(canDoShown(turns, all, 4), [true, true, true, true]);
  const farewellMissed = [...all.slice(0, -1), 'missed'];
  assert.deepEqual(canDoShown(turns, farewellMissed, 4), [false, true, true, true]);
});
