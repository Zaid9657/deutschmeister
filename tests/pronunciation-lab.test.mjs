// The Pronunciation Lab — plan Task 5 (speaking-guided-city-map).
//
// The rule under test: drills come FROM PROVIDER EVIDENCE ONLY. selectDrills
// picks at most the three lowest-scoring words, keeps the reference phrase
// they were measured in, and returns [] for missing evidence — it never
// fabricates a weakness. Plus source pins for the honest UI: the synthetic
// voice is labelled „Computerstimme", accent variation is called normal, and
// no claim is made about mouth positions the system cannot observe.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { selectDrills, accuracyForWord } from '../src/features/speaking/pronunciationDrills.js';

const PHRASE = 'Ich möchte einen Kaffee, bitte.';
const evidence = {
  provider: 'azure-speech',
  accuracy: 84, fluency: 78, completeness: 100,
  words: [
    { word: 'Ich', accuracy: 95, phonemes: [] },
    { word: 'möchte', accuracy: 61, phonemes: [{ phoneme: 'ø', accuracy: 44 }, { phoneme: 'm', accuracy: 90 }] },
    { word: 'einen', accuracy: 88, phonemes: [] },
    { word: 'Kaffee', accuracy: 72, phonemes: [{ phoneme: 'a', accuracy: 68 }] },
    { word: 'bitte', accuracy: 79, phonemes: [] },
  ],
};

test('selectDrills picks at most three items, lowest-scoring words first', () => {
  const drills = selectDrills(evidence, PHRASE);
  assert.equal(drills.length, 3);
  assert.deepEqual(drills.map((d) => d.word), ['möchte', 'Kaffee', 'bitte']);
  assert.deepEqual(drills.map((d) => d.accuracy), [61, 72, 79]);
});

test('every drill keeps the original reference phrase it was measured in', () => {
  const drills = selectDrills(evidence, PHRASE);
  assert.ok(drills.every((d) => d.phrase === PHRASE));
});

test('the weakest phoneme rides along when the provider measured one', () => {
  const drills = selectDrills(evidence, PHRASE);
  assert.equal(drills[0].weakestPhoneme.phoneme, 'ø');
  assert.equal(drills[0].weakestPhoneme.accuracy, 44);
  assert.equal(drills[2].weakestPhoneme, null, 'no phoneme evidence → no phoneme claim');
});

test('missing acoustic evidence yields NO drills — never a fabricated one', () => {
  assert.deepEqual(selectDrills(null, PHRASE), []);
  assert.deepEqual(selectDrills(undefined, PHRASE), []);
  assert.deepEqual(selectDrills({}, PHRASE), []);
  assert.deepEqual(selectDrills({ provider: 'azure-speech', accuracy: 80, words: [] }, PHRASE), []);
  assert.deepEqual(selectDrills('84', PHRASE), []);
  assert.deepEqual(selectDrills([{ word: 'x', accuracy: 1 }], PHRASE), [], 'an array is not evidence');
});

test('words without a finite score are not drillable evidence', () => {
  const drills = selectDrills({ words: [{ word: 'Kaffee' }, { word: '', accuracy: 10 }, { word: 'bitte', accuracy: NaN }] }, PHRASE);
  assert.deepEqual(drills, []);
});

test('fewer than three weak words means fewer drills, not padding', () => {
  const drills = selectDrills({ words: [{ word: 'Kaffee', accuracy: 72 }] }, PHRASE);
  assert.equal(drills.length, 1);
});

test('accuracyForWord reads only measured words and never guesses', () => {
  assert.equal(accuracyForWord(evidence, 'Kaffee'), 72);
  assert.equal(accuracyForWord(evidence, 'kaffee'), 72, 'case-insensitive match');
  assert.equal(accuracyForWord(evidence, 'Tee'), null);
  assert.equal(accuracyForWord(null, 'Kaffee'), null);
});

// ---------------------------------------------------------------------------
// Source pins on the Lab UI
// ---------------------------------------------------------------------------

const lab = readFileSync(new URL('../src/features/speaking/PronunciationLab.jsx', import.meta.url), 'utf8');
// Comments may explain a banned claim; only rendered code counts.
const renderedLab = lab
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .split('\n').filter((line) => !/^\s*\/\//.test(line)).join('\n');

test('the synthetic voice is honestly labelled Computerstimme', () => {
  assert.match(lab, /Computerstimme/);
  assert.match(lab, /SpeechSynthesisUtterance/);
});

test('one attempt plus one retry per step, finishing in phrase context', () => {
  assert.match(lab, /attemptsUsed < 2/);
  assert.match(lab, /\{ kind: 'phrase' \}/, 'the final step is the whole phrase');
  assert.match(lab, /The whole phrase, in context/);
});

test('accent variation is normal; no mouth-shape claims the system cannot observe', () => {
  assert.match(lab, /Accents vary/);
  assert.doesNotMatch(renderedLab, /mouth|lips|tongue|Zunge|Lippe|Mund/i, 'no articulatory claims without articulatory evidence');
});

test('no evidence renders the honest empty state, and shown change is provider-backed', () => {
  assert.match(lab, /nothing honest to\s+drill/);
  assert.match(lab, /nicht verfügbar/);
  assert.match(lab, /referenceText,/, 'the check runs as a structured turn with referenceText');
  assert.match(lab, /accuracyForWord\(result, step\.drill\.word\)/, 'the change is read from the fresh provider result');
});
