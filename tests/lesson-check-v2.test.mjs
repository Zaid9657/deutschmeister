// src/lib/lesson/check.js — the additions the course-v2 A1.1 unit reviews asked of the
// checker (2026-09-28). check.js decides every answer of the LIVE A1.1 course too, so:
//
//   1. the three new rules are OPT-IN options (doublets, paradigm, politeCase): checkOptionsFor()
//      never sets them, and without them every answer grades exactly as before — pinned here;
//   2. the one global change is a bug fix in the spelled-out fold that only ever turns a WRONG
//      into a CORRECT for the same letter sequence (a closing full stop, commas between letters).
//
// Each rule closes a finding class with a rule and fixtures, never with accepted[] lists
// (CLAUDE.md). Fixtures: a1.1-u02 r3 (spelled name), u03 r2/r3 F01/F05, u08/u09/u10/u12 r3.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAnswer, checkOptionsFor, normalizeSpelling, foldDoublets, paradigmTwin, RESULT,
} from '../src/lib/lesson/check.js';

const V2 = { doublets: true, paradigm: true, politeCase: true };
const r = (input, expected, opts = {}) => checkAnswer(input, Array.isArray(expected) ? expected : [expected], opts).result;

// ── the spelled-out fold (global bug fix) ─────────────────────────────────────
test('a spelled name keeps its letters when the learner closes with a full stop or separates with commas (a1.1-u02 r3)', () => {
  assert.equal(normalizeSpelling('B-E-R-I-S-H-A.'), 'BERISHA');
  assert.equal(normalizeSpelling('B, E, R, I, S, H, A'), 'BERISHA');
  assert.equal(normalizeSpelling('H - A - L - L - O'), 'HALLO', 'unchanged');
  for (const typed of ['B-E-R-I-S-H-A.', 'B, E, R, I, S, H, A', 'B E R I S H A', 'Berisha.', 'BERISHA']) {
    assert.equal(r(typed, ['Berisha', 'B E R I S H A']), RESULT.CORRECT, typed);
  }
  assert.notEqual(r('B-E-R-I-S-A.', ['Berisha', 'B E R I S H A']), RESULT.CORRECT, 'a missing letter is still missing');
});

// ── opt-in rules are off for the live course ──────────────────────────────────
test('checkOptionsFor never turns the v2 rules on: the live course grades exactly as before', () => {
  const opts = checkOptionsFor({ topic: 'g.vokalwechsel', type: 'fill_blank', caseSensitive: true, answer: 'x' });
  assert.equal(opts.doublets, undefined);
  assert.equal(opts.paradigm, undefined);
  assert.equal(opts.politeCase, undefined);
  // the live results these rules change in v2 stay what they were
  assert.equal(r('kommt', 'kommst'), RESULT.TYPO);
  assert.equal(r('schlaft', 'schläft'), RESULT.TYPO);
  assert.equal(r('gerne', 'gern'), RESULT.WRONG);
  assert.equal(r('Frau Schulz, ist das Ihre tochter?', 'Frau Schulz, ist das Ihre Tochter?', { caseSensitive: true }), RESULT.WRONG);
});

// ── doublets ───────────────────────────────────────────────────────────────────
test('doublets: a Duden twin is the same word (gern/gerne, okay/OK/O. K., tschüss/tschüs, allein/alleine)', () => {
  assert.equal(foldDoublets('ja gerne'), 'ja gern');
  assert.equal(foldDoublets('o k dann gehen wir'), 'ok dann gehen wir');
  assert.equal(r('gerne', 'gern', V2), RESULT.CORRECT, 'a1.1-u08 c05');
  assert.equal(r('Ich schwimme gern.', 'Ich schwimme gerne.', V2), RESULT.CORRECT);
  assert.equal(r('OK, dann gehen wir zusammen ins Konzert!', 'Okay, dann gehen wir zusammen ins Konzert!', V2), RESULT.CORRECT);
  assert.equal(r('O. K., dann gehen wir!', 'Okay, dann gehen wir!', V2), RESULT.CORRECT);
  assert.equal(r('Tschüs!', 'Tschüss!', V2), RESULT.CORRECT);
  assert.equal(r('Ich wohne alleine.', 'Ich wohne allein.', V2), RESULT.CORRECT);
  assert.equal(r('OK, dann gehen wir!', 'Okay, dann gehen wir!', { ...V2, dictation: true }), RESULT.TYPO, 'a dictation: the audio decides, TYPO is enough');
  assert.equal(r('gern', 'gut', V2), RESULT.WRONG, 'no other word folds');
});

// ── paradigm twins ─────────────────────────────────────────────────────────────
test('paradigm: a person-ending swap is a grammar error, never a typo', () => {
  assert.equal(r('kommt', 'kommst', V2), RESULT.WRONG, 'a1.1-u01 c02');
  assert.equal(r('schläfst', 'schläft', V2), RESULT.WRONG, 'a1.1-u03 c03');
  assert.equal(r('findet', 'findest', V2), RESULT.WRONG, 'a1.1-u08 ls2-p03');
  assert.equal(r('findst', 'findest', V2), RESULT.WRONG, 'the missing e-epenthesis');
  assert.equal(r('nimmt', 'nimmst', V2), RESULT.WRONG, 'a1.1-u09');
  assert.equal(r('mögst', 'mögt', V2), RESULT.WRONG, 'a1.1-u09 ls1-p03');
  assert.equal(r('willt', 'will', V2), RESULT.WRONG, 'a1.1-u12 ls2-p04');
  assert.equal(r('Du kannt gut schwimmen.', 'Du kannst gut schwimmen.', V2), RESULT.WRONG, 'a1.1-u08 ls1-r04, inside a sentence');
  assert.equal(r('Woher kommt du?', 'Woher kommst du?', V2), RESULT.WRONG);
  assert.equal(r('Wann fängst der Kurs an?', 'Wann fängt der Kurs an?', V2), RESULT.WRONG, 'a1.1-u12 ls3-p10');
});

test('paradigm: a stem-vowel twin of a du/er/ihr form and a modal stem twin are grammar errors', () => {
  assert.equal(r('schlaft', 'schläft', V2), RESULT.WRONG, 'a1.1-u03 c03');
  assert.equal(r('sprechst', 'sprichst', V2), RESULT.WRONG, 'a1.1-u03 ls2-p01');
  assert.equal(r('lest', 'liest', V2), RESULT.WRONG, 'a1.1-u03 ls2-p02');
  assert.equal(r('Er sprecht gut Deutsch.', 'Er spricht gut Deutsch.', V2), RESULT.WRONG, 'a1.1-u03 ls2-p10');
  assert.equal(r('fahrt', 'fährt', V2), RESULT.WRONG, 'a1.1-u10 c03');
  assert.equal(r('fahrst', 'fährst', V2), RESULT.WRONG, 'a1.1-u10 ls2-p01');
  assert.equal(r('trefft', 'trifft', V2), RESULT.WRONG, 'a1.1-u08 ls3-p03');
  assert.equal(r('fangt', 'fängt', V2), RESULT.WRONG, 'a1.1-u12 ls3-p04');
  assert.equal(r('willen', 'wollen', V2), RESULT.WRONG, 'a1.1-u12 ls2-p03');
  assert.equal(r('wollst', 'willst', V2), RESULT.WRONG, 'a1.1-u12 ls2-p02');
});

test('paradigm: a genuine letter slip keeps its typo retry, and the umlaut spelling stays correct', () => {
  for (const [typed, key] of [['kanst', 'kannst'], ['nimst', 'nimmst'], ['nimt', 'nimmt'], ['wilst', 'willst'], ['konnen', 'können'], ['mögn', 'mögen'], ['schleft', 'schläft']]) {
    assert.equal(r(typed, key, V2), RESULT.TYPO, `${typed} for ${key}`);
  }
  for (const [typed, key] of [['schlaeft', 'schläft'], ['faengt', 'fängt'], ['faehrt', 'fährt']]) {
    assert.equal(r(typed, key, V2), RESULT.CORRECT, `${typed} for ${key}`);
  }
  assert.equal(r('Ich wohne in Leipzg.', 'Ich wohne in Leipzig.', V2), RESULT.TYPO, 'a slip in a name is no ending');
  assert.equal(r('Berliner Strase', 'Berliner Straße', V2), RESULT.TYPO);
  assert.equal(paradigmTwin('kommt', 'kommst'), true);
  assert.equal(paradigmTwin('leipzg', 'leipzig'), false);
});

test('paradigm: a determiner swap of the same slot is a grammar error (ITM-13; a1.1-u03 ls1-p01, u06 ls3-p04)', () => {
  for (const [typed, key] of [['deine', 'meine'], ['meine', 'deine'], ['seine', 'deine'], ['deinen', 'meinen'], ['meinen', 'deinen'], ['keine', 'meine'], ['unsere', 'meine']]) {
    assert.equal(r(typed, key, V2), RESULT.WRONG, `${typed} for ${key}`);
    assert.equal(paradigmTwin(typed, key), true, `${typed}/${key}`);
  }
  assert.equal(r('Ist das deine Mutter?', 'Ist das meine Mutter?', V2), RESULT.WRONG, 'inside a sentence too');
  assert.equal(r('deine', 'meine'), RESULT.TYPO, 'the live course (no opt-in) is unchanged');
  assert.equal(paradigmTwin('meinung', 'meinen'), false, 'only determiner forms');
});

// ── polite case ────────────────────────────────────────────────────────────────
test('politeCase: on a caseSensitive item only Sie/Ihnen/Ihr- decide by case (a1.1-u03 r2/r3 F05)', () => {
  const key = 'Frau Schulz, ist das Ihre Tochter?';
  const opts = { ...V2, caseSensitive: true };
  const typo = checkAnswer('Frau Schulz, ist das Ihre tochter?', [key], opts);
  assert.equal(typo.result, RESULT.TYPO);
  assert.equal(typo.reason, 'case');
  assert.equal(r('Frau Schulz, ist das ihre Tochter?', key, opts), RESULT.WRONG, 'the polite capital is the task');
  assert.equal(r('Wie geht es ihnen?', 'Wie geht es Ihnen?', opts), RESULT.WRONG);
  assert.equal(r('ihr', 'Ihr', opts), RESULT.WRONG);
  assert.equal(r(key, key, opts), RESULT.CORRECT);
});
