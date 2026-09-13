// Answer checking: the two comparison rules that REVIEW #4 called BLOCKERs.
//
// BLOCKER 1 — a spelled-out word ("H-A-L-L-O") made the task writer's choice of
// separator part of the exam: HALLO and H A L L O came back wrong, tagged
// Wortschatz, in the free first Lektion.
// BLOCKER 3 — the course teaches "Ihr, immer groß", and the engine could not see
// case at all: 'ihr' against ['Ihr'] was correct, under an explanation saying the
// opposite. Standard §3 binds the rest: capitalisation is a typo-class error with
// ONE retry, while an article or an ending is never a typo.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAnswer, tagError, isCaseTask, normalizeSpelling, spellingApplies,
  RESULT, ERROR_TAGS,
} from '../src/lib/lesson/check.js';

// --- BLOCKER 1: spelled-out words ------------------------------------------

test('a spelled-out word is one answer however the learner separates it', () => {
  const spelled = ['H-A-L-L-O'];
  for (const typed of ['H-A-L-L-O', 'HALLO', 'Hallo', 'H A L L O', 'h-a-l-l-o', 'hallo', 'H–A–L–L–O']) {
    assert.equal(
      checkAnswer(typed, spelled).result, RESULT.CORRECT,
      `${typed} should be accepted for H-A-L-L-O`,
    );
  }
});

test('spelling mode forgives the separator, not the letters', () => {
  assert.notEqual(checkAnswer('HALO', ['H-A-L-L-O']).result, RESULT.CORRECT);
  assert.notEqual(checkAnswer('H-A-L-O', ['H-A-L-L-O']).result, RESULT.CORRECT);
  assert.equal(checkAnswer('TSCHÜSS', ['T-S-C-H-Ü-S-S']).result, RESULT.CORRECT);
  assert.equal(checkAnswer('tschuess', ['T-S-C-H-Ü-S-S']).result, RESULT.CORRECT);
});

test('spelling is detected from the expected answer, and can be forced', () => {
  assert.equal(spellingApplies(['H-A-L-L-O']), true);
  assert.equal(spellingApplies(['Ich bin Lehrer.']), false);
  assert.equal(spellingApplies(['Viertel vor']), false);
  assert.equal(normalizeSpelling('H - A - L - L - O'), 'HALLO');
  assert.equal(checkAnswer('H A L L O', ['HALLO'], { spelling: true }).result, RESULT.CORRECT);
});

// --- BLOCKER 3: capitalisation ---------------------------------------------

test('on a case task a case-only miss is wrong and tagged Rechtschreibung', () => {
  const res = checkAnswer('ihr', ['Ihr'], { caseSensitive: true });
  assert.equal(res.result, RESULT.WRONG);
  assert.equal(res.expected, 'Ihr');
  assert.equal(res.reason, 'case');
  const tag = tagError({ topic: 'possessive-articles', type: 'fill_blank' }, 'ihr', 'Ihr');
  assert.equal(tag, 'Rechtschreibung');
  assert.ok(ERROR_TAGS.includes('Rechtschreibung'));
  assert.equal(checkAnswer('Ihr', ['Ihr'], { caseSensitive: true }).result, RESULT.CORRECT);
});

test('elsewhere a case-only miss costs one retry, not the item (standard §3)', () => {
  const short = checkAnswer('ihr', ['Ihr']);
  assert.equal(short.result, RESULT.TYPO, 'the short-function-word guard must not swallow case');
  assert.equal(short.expected, 'Ihr');
  assert.equal(short.reason, 'case');

  const sentence = checkAnswer('ich bin lehrer.', ['Ich bin Lehrer.']);
  assert.equal(sentence.result, RESULT.TYPO);
  assert.equal(sentence.expected, 'Ich bin Lehrer.');
  assert.equal(sentence.reason, 'case');

  assert.equal(checkAnswer('die schere ist hier.', ['Die Schere ist hier.']).result, RESULT.TYPO);
  assert.equal(checkAnswer('Ich bin Lehrer.', ['Ich bin Lehrer.']).result, RESULT.CORRECT);
});

test('a lower-case form that is explicitly accepted stays correct', () => {
  assert.equal(checkAnswer('ihr', ['Ihr', 'ihr'], { caseSensitive: true }).result, RESULT.CORRECT);
});

test('isCaseTask flags the polite possessive and an explicit flag', () => {
  assert.equal(isCaseTask({ caseSensitive: true, topic: 'anything' }), true);
  assert.equal(isCaseTask({ topic: 'possessive-articles', answer: 'Ihr' }), true);
  assert.equal(isCaseTask({ topic: 'possessive-articles', answer: 'Ihre' }), true);
  assert.equal(isCaseTask({ topic: 'possessive-articles', answer: 'Ihren' }), true);
  assert.equal(isCaseTask({ topic: 'possessive-articles', answer: 'mein', accepted: ['mein'] }), false);
  assert.equal(isCaseTask({ topic: 'definite-articles', answer: 'Die' }), false);
  assert.equal(isCaseTask(null), false);
});

// --- everything that was already true ---------------------------------------

test('existing behaviours are unchanged', () => {
  assert.equal(checkAnswer('Ich bin müde.', ['Ich bin müde.']).result, RESULT.CORRECT);
  // an article is never a typo, and an umlaut respelling is never an error
  assert.equal(checkAnswer('das', ['ein'], { strict: true }).result, RESULT.WRONG);
  assert.equal(checkAnswer('Dere', ['Der'], { strict: true }).result, RESULT.WRONG);
  assert.equal(checkAnswer('waere', ['wäre']).result, RESULT.CORRECT, 'ae/ä are the same answer');
  assert.equal(
    checkAnswer('Meine Karte ist schoen', ['Meine Karte ist schön'], { strict: true }).result,
    RESULT.CORRECT,
  );
  assert.equal(checkAnswer('Das ist mene Party.', ['Das ist meine Party.'], { strict: true }).result, RESULT.TYPO);
  assert.equal(checkAnswer('', ['bin']).result, RESULT.WRONG);
});

test('dictation is unchanged', () => {
  const same = (a, b) => checkAnswer(a, [b], { dictation: true }).result;
  assert.equal(same('0176 234567', '0176-2345 67'), RESULT.CORRECT);
  assert.equal(same('Meine Nummer ist 0176-23 45 67.', 'Meine Nummer ist 0176 234567.'), RESULT.CORRECT);
  assert.equal(same('Null eins sieben sechs - drei', 'Null eins sieben sechs – drei'), RESULT.CORRECT);
  assert.equal(same('Er sagt "Hallo".', 'Er sagt „Hallo“.'), RESULT.CORRECT);
  assert.equal(same('0176 234568', '0176 234567'), RESULT.WRONG);
  assert.equal(tagError({ kind: 'dictation' }, 'x', 'y'), 'Hören');
});
