// The A1.1 final test (src/data/courseTests/abschlusstestA11.js), as both browser walks and scores of
// 2026-11-25 left it: it asked for words no Lektion teaches, seven of its eight reading items were solved
// by finding the same digits, days or words, an empty test was handed in without a word, and the 28-day
// plan opened its recording twice.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { abschlusstestA11 as mock } from '../src/data/courseTests/abschlusstestA11.js';
import { selectListeningQuestions } from '../src/data/courseTests/listeningQuestions.js';
import { levelSpec, taughtUpTo, untaughtTokens } from '../scripts/validate-curriculum.mjs';
import { openAnswers, sectionPassMarks, sectionGuessCeiling, scoreListeningAnswers, scoreObjectiveSections } from '../src/services/examScoring.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import * as plan from '../src/data/programs/a11Phase.js';
import { tokens } from './helpers/lesenGate.mjs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const bank = JSON.parse(read('tests/fixtures/a11-final-listening.json')).questions;
const hoeren = mock.sections.find((s) => s.key === 'hoeren');
const lesen = mock.sections.find((s) => s.key === 'lesen');
const part = hoeren.parts[0];
// Names of places and trains, and the two answers of the format, are no vocabulary to teach; „welchem" is a form of „welche".
const NAMES = new Set(['München', 'Hamburg', 'Frankfurt', 'Stuttgart', 'ICE', 'Richtig', 'Falsch', 'welchem']);

test('the final test listens for taught words only, and takes every such question of its recording it can', () => {
  const spec = levelSpec('a1.1');
  const known = taughtUpTo(spec.curriculum, spec).get(12);
  const untaught = (q) => untaughtTokens({ questionDe: q.question_text, answer: (q.options || []).map((o) => o.replace(/^[a-c]\) /, '')).join(' ') }, known, spec).filter((w) => !NAMES.has(w));
  const asked = selectListeningQuestions(bank, part);
  assert.deepEqual(asked.map((q) => q.question_number), part.questionNumbers, 'the list is the order on the page');
  for (const q of asked) assert.deepEqual(untaught(q), [], q.question_text);
  // The only taught question left out asks twice about one announcement („ICE auf Gleis 7", question 5 beside 15).
  const left = bank.filter((q) => q.options && !untaught(q).length && !part.questionNumbers.includes(q.question_number));
  assert.deepEqual(left.map((q) => q.question_number), [5]);
  // The learner answers while listening: the questions follow the recording, dialogue by dialogue.
  const order = asked.map((q) => q.dialogue);
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  // No one answer given throughout takes more than half.
  const keys = asked.map((q) => q.correct_answer);
  for (const k of new Set(keys)) assert.ok(keys.filter((x) => x === k).length <= keys.length / 2, k);
  assert.match(hoeren.instructions, /acht Fragen/);
  assert.equal(asked.length, 8);
  const answers = Object.fromEntries(asked.map((q) => [`listening:${part.key}:${q.question_number}`, q.correct_answer]));
  assert.deepEqual(scoreListeningAnswers(mock, { [part.key]: asked.map((q) => ({ id: q.question_number, correct: q.correct_answer })) }, answers), { complete: true, missing: [], score: 8, max: 8 });
});

test('a list of question numbers keeps its order, ignores numbers the recording lacks, and leaves other parts as they were', () => {
  assert.deepEqual(selectListeningQuestions(bank, { questionNumbers: [3, 99, 1] }).map((q) => q.question_number), [3, 1]);
  assert.deepEqual(selectListeningQuestions(bank, { questionMax: 2 }).map((q) => q.question_number), [1, 2]);
  assert.equal(selectListeningQuestions(bank, {}).length, 23);
});

test('neither a Lektion nor the 28-day plan opens the recording of the final test', () => {
  for (const l of CURRICULUM_A11.lektionen) assert.notEqual(l.links?.listeningExercise, part.exerciseNumber, `Lektion ${l.nr}`);
  const hrefs = JSON.stringify(plan).match(/\/listening\/a1\.1\/\d+/g) || [];
  assert.ok(hrefs.length >= 12, 'the plan is read');
  assert.ok(!hrefs.includes(`/listening/a1.1/${part.exerciseNumber}`));
});

test('no reading item is answered by finding its digits, its day or its words in the text', () => {
  const items = lesen.parts.flatMap((p) => p.items.map((i) => ({ ...i, text: p.text || i.prompt.split('—')[0], statement: p.text ? i.prompt : i.prompt.split('—')[1] })));
  const statements = items.filter((i) => i.options[0].key === 'r');
  assert.equal(statements.length, 6);
  const share = (i) => { const text = new Set(tokens(i.text)); const st = tokens(i.statement); return st.filter((t) => text.has(t)).length / st.length; };
  const rules = {
    'all words in text → richtig': (i) => share(i) === 1,
    'most words in text → richtig': (i) => share(i) >= 0.6,
    'a number → falsch': (i) => !/\d|\beins\b/.test(i.statement),
    'constant richtig': () => true,
  };
  for (const [name, fn] of Object.entries(rules)) {
    const right = statements.filter((i) => fn(i) === (i.answer === 'r')).length;
    assert.ok(right <= 4 && right >= 2, `${name}: ${right} of 6`);
  }
  // The ad with the situation's own number is not the one that fits.
  const [a, b] = lesen.parts.filter((p) => /Situation/.test(p.label));
  assert.match(a.text.split('\n')[1], /17/);
  assert.equal(a.items[0].answer, 'b');
  assert.match(b.text.split('\n')[2], /zusammen 45 Euro/);
  assert.equal(b.items[0].answer, 'a');
  // „Bitte an Gleis fünf umsteigen" was Lektion 10's own line.
  const scenes = CURRICULUM_A11.lektionen.flatMap((l) => l.dialog.lines.flatMap((x) => x.de.split(/(?<=[.!?])\s+/)));
  for (const i of items) for (const s of scenes) if (tokens(s).length >= 3) assert.ok(!i.text.includes(s.replace(/[.!?]$/, '')), `${i.id}: ${s}`);
});

test('the reading mark stays one point above a constant answer', () => {
  assert.equal(sectionGuessCeiling(lesen), 4);
  assert.deepEqual(sectionPassMarks(mock).map((m) => [m.key, m.need, m.max]), [['lesen', 5, 8]]);
  assert.match(mock.intro, /mindestens 5 von 8 Punkten im Lesen/);
  const all = Object.fromEntries(lesen.parts.flatMap((p) => p.items.map((i) => [i.id, i.answer])));
  assert.equal(scoreObjectiveSections(mock, all).score, 8);
});

test('an unanswered task is named before a section is handed in; the timer never asks', () => {
  const keys = { [part.key]: [{ id: 'x', correct: 'a' }, { id: 'y', correct: 'b' }] };
  assert.equal(openAnswers(hoeren, {}, keys), 2);
  assert.equal(openAnswers(hoeren, { [`listening:${part.key}:x`]: 'a' }, keys), 1);
  assert.equal(openAnswers(lesen, {}), 8);
  assert.equal(openAnswers(lesen, Object.fromEntries(lesen.parts.flatMap((p) => p.items.map((i) => [i.id, 'r'])))), 0);
  const schreiben = mock.sections.find((s) => s.key === 'schreiben');
  assert.equal(openAnswers(schreiben, { 'writing:schreiben-1': '  ' }), 1);
  assert.equal(openAnswers(schreiben, { 'writing:schreiben-1': 'Familienname: Demir' }), 0);
  assert.equal(openAnswers(undefined), 0);
  const page = read('src/pages/Modelltest/ModelltestRun.jsx');
  assert.match(page, /onClick=\{handIn\}/, 'the button asks');
  assert.match(page, /if \(remaining === 0 && !loading && !finishing\) nextSection\(\);/, 'the timer does not');
});

test('the final test says its tasks in English too, below the German, when the course is read in English', () => {
  for (const s of mock.sections) assert.ok(s.instructionsEn, s.key);
  assert.ok(mock.sections.find((s) => s.key === 'schreiben').parts[0].taskEn);
  const page = read('src/pages/Modelltest/ModelltestRun.jsx');
  assert.match(page, /const english = bilingual && lessonLang !== 'de';/);
  const copy = page.slice(page.indexOf('const COPY = {'), page.indexOf('const FIELD ='));
  const keys = (lang) => [...copy.slice(copy.indexOf(`  ${lang}: {`)).split('\n  },')[0].matchAll(/^ {4}(\w+):/gm)].map((m) => m[1]);
  assert.deepEqual(keys('de'), keys('en'));
  assert.doesNotMatch(copy, /\b(du|dein\w*|dir|dich)\b/i);
});
