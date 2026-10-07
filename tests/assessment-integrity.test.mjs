// The assessments measure what they claim (2026-10-07, Codex all-aspects review — each defect
// below was verified against the code before this suite was written, and each test fails on the
// code that had the defect).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreListeningAnswers } from '../src/services/examScoring.js';

const MOCK = {
  sections: [
    { key: 'hoeren', parts: [{ key: 'h1', type: 'listening', level: 'A1', exerciseNumber: 1 }] },
    { key: 'lesen', parts: [{ key: 'l1', type: 'mc-group', items: [{ id: 'q1', answer: 'a' }] }] },
  ],
};

test('final test: a listening part whose keys are not loaded is INCOMPLETE, never a silent zero-point section', () => {
  // Resuming after the Hören section never mounts it, so no keys were registered. The old
  // scorer returned { score: 0, max: 0 } and listening silently left the denominator.
  const none = scoreListeningAnswers(MOCK, {}, {});
  assert.equal(none.complete, false);
  assert.deepEqual(none.missing, ['h1']);
  const keys = { h1: [{ id: 'a', correct: 'x' }, { id: 'b', correct: 'y' }] };
  const scored = scoreListeningAnswers(MOCK, keys, { 'listening:h1:a': 'x', 'listening:h1:b': 'z' });
  assert.deepEqual(scored, { complete: true, missing: [], score: 1, max: 2 });
});

test('final test: the runner loads missing listening keys and refuses to submit without them', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/pages/Modelltest/ModelltestRun.jsx', import.meta.url), 'utf8');
  assert.match(src, /await loadMissingListeningKeys\(snapshot\)/);
  assert.match(src, /if \(!listening\.complete\) \{\s*setFinishing\(false\);/, 'no submission while listening keys are missing');
  assert.doesNotMatch(src, /Object\.entries\(listeningKeysRef\.current\)/, 'the on-screen-only scorer is gone');
});

test('checkpoint: self-confirming a line keeps its measured mic result — a failed Sprechen section cannot disappear', async () => {
  const { selfConfirmedResult } = await import('../src/lib/lesson/readaloud.js');
  const { isMicResult } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const measured = { pct: 0.2 };
  const after = selfConfirmedResult(measured, 3);
  assert.equal(after.pct, 0.2, 'the measurement stands');
  assert.equal(after.usedMic, true);
  assert.equal(after.selfConfirmed, true);
  assert.ok(isMicResult(after), 'so the checkpoint still scores the section');
  const never = selfConfirmedResult(null, 0);
  assert.deepEqual([never.pct, never.usedMic], [null, false], 'only a line that was never measured is "no mic"');
  const { readFileSync } = await import('node:fs');
  const line = readFileSync(new URL('../src/components/lesson/ReadAloudLine.jsx', import.meta.url), 'utf8');
  assert.match(line, /onResultRef\.current\?\.\(selfConfirmedResult\(result, attempts\)\)/, 'the component reports through the rule');
});

test('checkpoint: answering the same option everywhere never passes a section (always-„Richtig" scored 50 % on reading)', async () => {
  const { buildCheckpoint, scoreCheckpoint } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const { readFileSync } = await import('node:fs');
  const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url), 'utf8'));
  for (const checkpoint of CURRICULUM_A11.checkpoints) {
    const items = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint, pool });
    const lesen = items.filter((i) => i.section === 'lesen');
    // Everything else answered perfectly, reading answered „Richtig" throughout.
    const answers = Object.fromEntries(items.map((i) => [i.id, i.section === 'lesen' ? 'Richtig' : i.answer]));
    const r = scoreCheckpoint(items, answers);
    assert.ok(r.sections.lesen.correct <= r.sections.lesen.guessCeiling, `${checkpoint.id}: the constant answer reaches the ceiling`);
    assert.equal(r.passed, false, `${checkpoint.id}: a constant answer on reading must not pass the checkpoint`);
    // …while genuinely reading passes.
    const honest = scoreCheckpoint(items, Object.fromEntries(items.map((i) => [i.id, i.answer])));
    assert.equal(honest.sections.lesen.pct, 100);
    assert.ok(lesen.length >= 4);
  }
});

test('dictation: a spelled line ending in a full stop accepts the joined word; spoken numbers accept digits', async () => {
  const { checkAnswer, checkOptionsFor, RESULT } = await import('../src/lib/lesson/check.js');
  const dict = (answer) => ({ id: 'd', kind: 'dictation', type: 'dictation', answer, accepted: [answer] });
  const check = (item, input) => checkAnswer(input, item.accepted, checkOptionsFor(item)).result;
  const spelled = dict('C-H-A-K-I-R-I.');
  for (const input of ['Chakiri', 'CHAKIRI', 'C-H-A-K-I-R-I', 'C H A K I R I']) assert.equal(check(spelled, input), RESULT.CORRECT, input);
  assert.notEqual(check(spelled, 'Chakira'), RESULT.CORRECT);
  const phone = dict('Null vier zwei – drei drei acht eins.');
  for (const input of ['042 3381', '0423381', '042-3381', 'null vier zwei drei drei acht eins']) assert.equal(check(phone, input), RESULT.CORRECT, input);
  assert.equal(check(phone, '042 3382'), RESULT.WRONG, 'a wrong digit is still wrong');
  const age = dict('Er ist zwanzig.');
  assert.equal(check(age, 'Er ist 20.'), RESULT.CORRECT);
  assert.equal(check(age, 'Er ist 21.'), RESULT.WRONG);
  assert.equal(check(dict('Ich brauche ein Handy.'), 'Ich brauche ein Handy.'), RESULT.CORRECT, 'the article ein is not a number');
});

test('dictation numbers: a different number is never "just a typo", and umlaut-free spellings still count (Codex review of the fix)', async () => {
  const { checkAnswer, checkOptionsFor, RESULT } = await import('../src/lib/lesson/check.js');
  const dict = (answer) => ({ id: 'd', kind: 'dictation', type: 'dictation', answer, accepted: [answer] });
  const check = (item, input) => checkAnswer(input, item.accepted, checkOptionsFor(item)).result;
  assert.equal(check(dict('Er ist zwanzig.'), 'Er ist neunzig.'), RESULT.WRONG, '90 for 20 is a wrong number, not a typo');
  assert.equal(check(dict('Null vier zwei – drei drei acht eins.'), '042 3391'), RESULT.WRONG, 'one wrong digit in a phone number');
  assert.equal(check(dict('Der Tisch kostet fünfzehn Euro.'), 'Der Tisch kostet fuenfzehn Euro.'), RESULT.CORRECT);
  assert.equal(check(dict('Der Tisch kostet fünfzehn Euro.'), 'Der Tisch kostet 15 Euro.'), RESULT.CORRECT);
  assert.equal(check(dict('Es ist zwölf Uhr.'), 'Es ist zwoelf Uhr.'), RESULT.CORRECT);
  assert.equal(check(dict('Wir sind dreißig.'), 'Wir sind dreissig.'), RESULT.CORRECT);
  assert.equal(check(dict('Ich wohne in der Hauptstraße.'), 'Ich wohne in der Hauptstrase.'), RESULT.TYPO, 'ordinary typo forgiveness is unchanged');
});

test('dictation prices keep their decimal: „2,0 Euro" is not „zwanzig Euro" (Codex adversarial review of the fix)', async () => {
  const { checkAnswer, checkOptionsFor, RESULT } = await import('../src/lib/lesson/check.js');
  const item = { id: 'p', kind: 'dictation', type: 'dictation', answer: 'Das macht zusammen zwanzig Euro.', accepted: ['Das macht zusammen zwanzig Euro.'] };
  const check = (input) => checkAnswer(input, item.accepted, checkOptionsFor(item)).result;
  assert.equal(check('Das macht zusammen 20 Euro.'), RESULT.CORRECT);
  assert.equal(check('Das macht zusammen 2,0 Euro.'), RESULT.WRONG);
  assert.equal(check('Das macht zusammen fuenfundzwanzig Euro.'), RESULT.WRONG, 'a different compound number');
  const compound = { ...item, answer: 'Das macht fünfundzwanzig Euro.', accepted: ['Das macht fünfundzwanzig Euro.'] };
  assert.equal(checkAnswer('Das macht fuenfundzwanzig Euro.', compound.accepted, checkOptionsFor(compound)).result, RESULT.CORRECT);
  assert.equal(checkAnswer('Das macht 25 Euro.', compound.accepted, checkOptionsFor(compound)).result, RESULT.CORRECT);
});

test('final test: submission freezes one answer snapshot, and loading the listening keys is bounded', async () => {
  const { readFileSync } = await import('node:fs');
  const run = readFileSync(new URL('../src/pages/Modelltest/ModelltestRun.jsx', import.meta.url), 'utf8');
  assert.match(run, /const setAnswer = \(key, value\) => \{\s*if \(frozenRef\.current\) return;/, 'no edits after submit / expiry');
  assert.match(run, /if \(!frozenRef\.current\) frozenRef\.current = answers;\s*const snapshot = frozenRef\.current;/, 'every retry scores the same snapshot');
  assert.match(run, /scoreObjectiveSections\(mock, snapshot\)/);
  assert.match(run, /answers: \{ \.\.\.snapshot, _meta/);
  assert.doesNotMatch(run, /const answers = frozenRef/, 'no shadowed state inside finish');
  const hook = readFileSync(new URL('../src/hooks/useListening.js', import.meta.url), 'utf8');
  const loader = hook.slice(hook.indexOf('export async function fetchExerciseQuestions'), hook.indexOf('export function useExerciseDetails'));
  assert.equal((loader.match(/withTimeout\(/g) || []).length, 2, 'both requests are bounded');
});
