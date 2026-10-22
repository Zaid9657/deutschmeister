import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeAnswer, answerMatches } from '../src/utils/answerMatch.js';
import {
  checkAnswer, checkOptionsFor, numberWordsToDigits, normalizeSpelling, spellingApplies, RESULT,
} from '../src/lib/lesson/check.js';
import { isItemCorrect } from '../src/lib/checkpoint/buildCheckpoint.js';
import { gradeTypedReview } from '../src/lib/checkpoint/reviewGrading.js';

const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url), 'utf8')).items;
const grade = (item, given) => checkAnswer(given, item.accepted || [item.answer], checkOptionsFor(item)).result;

test('changed grammatical endings never earn typo credit, including endings with the same last letter', () => {
  const item = pool.find((i) => i.answer === 'spielt' && i.questionDe.includes('Lena'));
  assert.ok(item);
  assert.equal(grade(item, 'spielst'), RESULT.WRONG);
  for (const [expected, given, subject] of [
    ['braucht', 'brauchst', 'Lena'], ['kostet', 'kostest', 'Das'], ['arbeitet', 'arbeitest', 'Lena'],
    ['steht', 'stehst', 'Lena'], ['spielen', 'spieln', 'Wir'], ['lernen', 'lernten', 'Wir'],
    ['lerne', 'lernte', 'Ich'],
  ]) {
    assert.equal(checkAnswer(given, [expected]).result, RESULT.WRONG, `${given} for ${expected}`);
    const sentence = { answer: `${subject} ${expected} heute.`, type: 'sentence_building' };
    assert.equal(grade(sentence, `${subject} ${given} heute.`), RESULT.WRONG, `sentence: ${given} for ${expected}`);
    assert.equal(gradeTypedReview('pattern:present-tense-regular', [expected], given).ok, false);
  }
  for (const [expected, given] of [['Wasser', 'Wasserr'], ['kommt', 'komt'], ['meine', 'mene']]) {
    assert.equal(checkAnswer(given, [expected]).result, RESULT.TYPO, `${given} remains a spelling slip`);
  }
  assert.equal(checkAnswer('Du bistt hier.', ['Du bist hier.']).result, RESULT.TYPO);
});

test('selectable answers require an accepted option and never receive typo credit', () => {
  const spelling = pool.find((i) => i.answer === 'Danke' && i.options?.includes('Dane'));
  assert.ok(spelling);
  assert.equal(grade(spelling, 'Dane'), RESULT.WRONG);
  assert.equal(grade(spelling, 'Danke'), RESULT.CORRECT);
  const options = ['Danke', 'Dane', 'danke'];
  for (const shape of [
    { type: 'multiple_choice' }, { type: 'fill_blank', options },
    { type: 'listen_select', options }, { kind: 'choice', mode: 'options', options },
  ]) {
    const item = { ...shape, answer: 'Danke', accepted: ['Danke'] };
    assert.equal(grade(item, 'Dane'), RESULT.WRONG);
    assert.equal(grade(item, 'danke'), RESULT.WRONG, 'case-only distractors are also wrong');
    assert.equal(isItemCorrect(item, 'Dane'), false, 'checkpoint uses the same rule');
  }
  assert.equal(grade({ type: 'fill_blank', answer: 'Danke' }, 'Dane'), RESULT.TYPO, 'typed spelling still gets its allowance');
  const umlaut = { type: 'multiple_choice', answer: 'Grüße', accepted: ['Grüße'] };
  assert.equal(grade(umlaut, 'Grüße'.normalize('NFD')), RESULT.CORRECT, 'canonical normalization still applies to choices');
  assert.equal(grade(umlaut, 'Gruesse'), RESULT.CORRECT, 'documented ASCII spellings still apply to choices');
});

test('NFC normalization precedes answer, spelling, number and case comparisons', () => {
  const spelling = pool.find((i) => i.id === 'extra-a11-l01-05');
  const sentence = pool.find((i) => i.id === 'extra-a11-l10-21');
  assert.ok(spelling && sentence);
  for (const item of [spelling, sentence]) {
    assert.equal(grade(item, item.answer.normalize('NFD')), RESULT.CORRECT, item.id);
    assert.equal(isItemCorrect({ ...item, accepted: [item.answer] }, item.answer.normalize('NFD')), true);
    assert.equal(gradeTypedReview(item.topic, [item.answer], item.answer.normalize('NFD')).result, RESULT.CORRECT);
    assert.equal(checkAnswer(item.answer, [item.answer.normalize('NFD')]).result, RESULT.CORRECT);
  }
  assert.equal(normalizeAnswer('GRÜẞE'.normalize('NFD')), 'gruesse');
  assert.equal(answerMatches('grün'.normalize('NFD'), ['grün']), true);
  assert.equal(answerMatches('grün', ['grün'.normalize('NFD')]), true);
  assert.equal(normalizeSpelling('T-S-C-H-Ü-S-S'.normalize('NFD')), 'TSCHÜSS');
  assert.equal(spellingApplies(['T-S-C-H-Ü-S-S'.normalize('NFD')]), true);
  assert.equal(checkAnswer('T S C H Ü S S'.normalize('NFD'), ['T-S-C-H-Ü-S-S']).result, RESULT.CORRECT);
  assert.equal(numberWordsToDigits('fünfundzwanzig'.normalize('NFD')), '25');
  assert.equal(checkAnswer('fünfundzwanzig'.normalize('NFD'), ['25'], { dictation: true }).result, RESULT.CORRECT);
  assert.equal(checkAnswer('Grüße'.normalize('NFD'), ['Grüße'], { caseSensitive: true }).result, RESULT.CORRECT);
  assert.equal(checkAnswer('grüße'.normalize('NFD'), ['Grüße'], { caseSensitive: true }).result, RESULT.WRONG);
  assert.equal(checkAnswer('ihr', ['Ihr'], { caseSensitive: true }).result, RESULT.WRONG);
  assert.equal(checkAnswer('sie', ['Sie'], { caseSensitive: true }).result, RESULT.WRONG);
});
