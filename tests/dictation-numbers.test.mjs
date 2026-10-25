// A heard number may be written in digits, and a price with the € sign (2026-10-25 review, C-063).
//
// The lesson dictation folds number words to digits on both sides (src/lib/lesson/check.js
// normalizeDictation), so „15 Euro" was right for „fünfzehn Euro" — but the fold stopped at
// `hundert`, and there was no currency fold. A1.2 L2 dictates „Die Miete ist vierhundertachtzig
// Euro." right after its notice teaches „480 ist vierhundertachtzig", and the learner who wrote 480
// got a Hören error, a requeue and a lost first-pass point; „Der Tisch kostet 15 €." failed in the
// free A1.1 too. The rule: every live dictation line of both courses also accepts its all-digits
// rendering and its € rendering, while a wrong number stays wrong. The renderer below is the test's
// own, written independently of the checker's.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAnswer, checkOptionsFor, numberWordsToDigits, RESULT } from '../src/lib/lesson/check.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';

const SMALL = {
  null: 0, eins: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11,
  zwölf: 12, dreizehn: 13, vierzehn: 14, fünfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19,
  zwanzig: 20, dreißig: 30, vierzig: 40, fünfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90,
};
const UNIT = { ein: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9 };
const TEN = { zwanzig: 20, dreißig: 30, vierzig: 40, fünfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90 };

/** The value of one German number word up to 999, or null — „ein" alone is the article. */
function valueOf(word) {
  if (word in SMALL) return SMALL[word];
  const h = word.match(/^(ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)?hundert(?:und)?(.*)$/);
  if (h) {
    const rest = h[2] ? valueOf(h[2]) : 0;
    return rest === null ? null : (h[1] ? UNIT[h[1]] : 1) * 100 + rest;
  }
  const c = word.match(/^(ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)und(zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig)$/);
  return c ? UNIT[c[1]] + TEN[c[2]] : null;
}
const digits = (line) => line.replace(/\p{L}+/gu, (w) => {
  const v = valueOf(w.toLowerCase());
  return v === null ? w : String(v);
});

const dictationLines = (curriculum) => curriculum.lektionen.flatMap((l) =>
  (l.hoeren?.kind === 'dictation' ? l.hoeren.lines : []).map((i) => ({ where: `${curriculum.level} L${l.nr}`, de: l.dialog?.lines?.[i]?.de })).filter((x) => x.de));
const dictation = (de) => ({ kind: 'dictation', type: 'dictation', stage: 'dictation', topic: 'hoeren', answer: de, accepted: [de] });
const grade = (de, typed) => checkAnswer(typed, [de], checkOptionsFor(dictation(de))).result;

test('the hundreds are folded like every other number word', () => {
  assert.equal(numberWordsToDigits('vierhundertachtzig'), '480');
  assert.equal(numberWordsToDigits('zweihundertfünfzig Euro'), '250 Euro');
  assert.equal(numberWordsToDigits('Hundert'), '100');
  assert.equal(numberWordsToDigits('einhundertzwanzig'), '120');
  assert.equal(numberWordsToDigits('hundertundeins'), '101');
  assert.equal(numberWordsToDigits('dreihundertdreiunddreißig'), '333');
  assert.equal(numberWordsToDigits('zweihundertfuenfzig'), '250', 'the keyboard spelling');
  assert.equal(numberWordsToDigits('Ich habe ein Jahrhundert.'), 'Ich habe ein Jahrhundert.', 'inside a word, and the article, stay');
});

test('A1.2 L2 accepts the 480 its own notice teaches, and a price may carry the € sign', () => {
  const rent = 'Die Miete ist vierhundertachtzig Euro. Der Keller kostet zwanzig Euro.';
  assert.ok(dictationLines(CURRICULUM_A12).some((l) => l.de === rent), 'the line is still dictated in A1.2 L2');
  assert.equal(grade(rent, 'Die Miete ist 480 Euro. Der Keller kostet 20 Euro.'), RESULT.CORRECT);
  assert.equal(grade(rent, 'Die Miete ist 480 €. Der Keller kostet 20 €.'), RESULT.CORRECT);
  assert.equal(grade(rent, 'Die Miete ist 480 EUR. Der Keller kostet 20 EUR.'), RESULT.CORRECT);
  assert.equal(grade(rent, 'Die Miete ist 408 Euro. Der Keller kostet 20 Euro.'), RESULT.WRONG, 'a wrong number is a wrong answer');
  assert.equal(grade(rent, 'Die Miete ist 48 Euro. Der Keller kostet 20 Euro.'), RESULT.WRONG);
  const table = 'Der Tisch kostet fünfzehn Euro.';
  assert.equal(grade(table, 'Der Tisch kostet 15 €.'), RESULT.CORRECT);
  assert.equal(grade(table, 'Der Tisch kostet 15€'), RESULT.CORRECT);
  assert.equal(grade(table, 'Der Tisch kostet 16 €.'), RESULT.WRONG);
});

test('every live dictation line of A1.1 and A1.2 accepts its digit and € renderings, and no other number', () => {
  let numeric = 0;
  for (const { where, de } of [...dictationLines(CURRICULUM_A11), ...dictationLines(CURRICULUM_A12)]) {
    assert.equal(grade(de, de), RESULT.CORRECT, `${where}: the line itself`);
    const inDigits = digits(de);
    if (inDigits === de) continue;
    numeric += 1;
    assert.equal(grade(de, inDigits), RESULT.CORRECT, `${where}: „${inDigits}" for „${de}"`);
    const withSign = inDigits.replace(/(\d) Euro\b/g, '$1 €');
    assert.equal(grade(de, withSign), RESULT.CORRECT, `${where}: „${withSign}" for „${de}"`);
    const wrong = inDigits.replace(/\d+/, (n) => String(Number(n) + 1));
    assert.equal(grade(de, wrong), RESULT.WRONG, `${where}: „${wrong}" for „${de}" — another number`);
  }
  assert.ok(numeric >= 5, `the courses dictate numbers (${numeric} lines)`);
});
