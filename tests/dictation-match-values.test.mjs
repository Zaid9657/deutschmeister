// The listening dictation grader compares VALUES (2026-10-25 review, C-172 / C-173 / C-175).
//
// src/utils/dictationMatch.js used to delete every separator and compare the digits that were
// left: „2,50 €" matched the listed 250 and „1.000.000 €" the listed „10.000,00" — prices 10 to
// 100 times off got a green tick, and QuestionCard hides the correction on a green tick — while
// „20:00" (→ 2000) failed the listed 20, „Um 10 Uhr" (→ um10) failed 10, and „3,98 EUR", „15 qm",
// „10 °C", „15 Min." and „Rathaus." failed rows whose lists carry the same answer in other words.
// A clock and a telephone number are no values, though (batch B4 review): read as a value, „19 Uhr 3"
// (19:03) passed the 19:30 row and the two-digit groups of „0176 543.21.08" became decimal places, so
// the row decides the reading — a clock, a digit sequence or a value.
// The rows are read from the four listening migrations with the statement parser of
// tests/a1-1-listening.test.mjs (copied: importing a test file would run its tests).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dictationMatches, canonical, clock, digitSequence } from '../src/utils/dictationMatch.js';

const FILES = ['2026-09-05-a1-1-listening.sql', '2026-09-05-a1-2-listening.sql', '2026-09-06-a2-1-listening.sql', '2026-09-06-a2-2-listening.sql'];

// Question text and explanations can contain a literal ';' (German sentences do), so statements are
// cut at the NEXT statement's start line, never at the first ';' found.
function statementsStartingWith(pattern, text) {
  const allStarts = [
    ...text.matchAll(/^(?:UPDATE public\.listening_questions SET|INSERT INTO public\.listening_questions$)/gm),
  ].map((m) => m.index);
  const commitAt = text.indexOf('\nCOMMIT;');
  const boundaries = [...allStarts, commitAt === -1 ? text.length : commitAt];
  return [...text.matchAll(pattern)].map((m) => text.slice(m.index, boundaries.find((b) => b > m.index)));
}

const unquote = (s) => s.replace(/''/g, "'");
const ROWS = FILES.flatMap((file) => {
  const sql = readFileSync(new URL(`../migrations/${file}`, import.meta.url), 'utf8')
    .split('\n').filter((line) => !line.trim().startsWith('--')).join('\n');
  return statementsStartingWith(/^INSERT INTO public\.listening_questions$/gm, sql).flatMap((stmt) => {
    const m = stmt.match(/SELECT\s*\n\s*'[0-9a-f-]{36}',\s*\d+,\s*(\d+),\s*'dictation',\s*\n\s*'(?:[^']|'')*',\s*NULL,\s*'((?:[^']|'')*)',\s*\n\s*'((?:[^']|'')*)'::jsonb,/);
    return m ? [{ where: `${file.slice(11, 15)} q${m[1]}`, correct: unquote(m[2]), acceptable: JSON.parse(unquote(m[3])) }] : [];
  });
});
const isTimeRow = (row) => [row.correct, ...row.acceptable].some((a) => /:|(?<!\p{L})uhr(?!\p{L})/iu.test(a));
const matches = (typed, row) => dictationMatches(typed, row.correct, row.acceptable);
const rowOf = (where, correct, has) => {
  const row = ROWS.find((r) => r.where === where && r.correct === correct && (!has || r.acceptable.includes(has)));
  assert.ok(row, `${where} ${correct}`);
  return row;
};

test('the four migrations hold the 72 live dictation rows, and every listed answer matches its own row', () => {
  assert.equal(ROWS.length, 72);
  let answers = 0;
  for (const row of ROWS) {
    for (const a of row.acceptable) {
      answers += 1;
      assert.ok(matches(a, row), `${row.where}: its own „${a}"`);
    }
  }
  assert.equal(answers, 377);
});

test('a comma moved, dropped or inserted is another value on every row that is not a time', () => {
  let probed = 0;
  for (const row of ROWS.filter((r) => !isTimeRow(r) && /^\d[\d\s]*(?:,\d{1,2})?$/.test(r.correct))) {
    const variants = [];
    const decimal = row.correct.match(/^(\d+),(\d{1,2})$/);
    if (decimal) {
      const [, whole, frac] = decimal;
      variants.push(`${whole}${frac}`); // the mark dropped: 3,98 → 398
      if (whole.length > 1) variants.push(`${whole.slice(0, -1)},${whole.slice(-1)}${frac}`); // moved left
      if (frac.length > 1) variants.push(`${whole}${frac[0]},${frac.slice(1)}`); // moved right
    } else if (row.correct.replace(/\s/g, '').length >= 2) {
      const n = row.correct;
      variants.push(`${n.slice(0, -1)},${n.slice(-1)}`); // 250 → 25,0
      if (n.replace(/\s/g, '').length >= 3) variants.push(`${n.slice(0, -2)},${n.slice(-2)}`); // 250 → 2,50
    }
    for (const v of variants) {
      probed += 1;
      assert.equal(matches(v, row), false, `${row.where}: „${v}" is not „${row.correct}"`);
      assert.equal(matches(`${v} €`, row), false, `${row.where}: „${v} €" is not „${row.correct}"`);
    }
  }
  assert.ok(probed >= 40, `the rule reads the rows it was written for (${probed})`);
});

test('every time row accepts hh:mm and „hh:mm Uhr", with or without „um"', () => {
  const times = ROWS.filter(isTimeRow);
  assert.equal(times.length, 13);
  for (const row of times) {
    const m = row.correct.match(/^(\d{1,2})(?::(\d{2}))?(?:\s*Uhr)?$/);
    assert.ok(m, `${row.where}: „${row.correct}" reads as a time`);
    const [, h, mm = '00'] = m;
    for (const typed of [`${h}:${mm}`, `${h}:${mm} Uhr`, `${h.padStart(2, '0')}:${mm}`, `${h}.${mm} Uhr`, `um ${h}:${mm} Uhr`,
      `Um ${h} Uhr${mm === '00' ? '' : ` ${mm}`}`, `${h}${mm}`, `${h} ${mm}`]) {
      assert.ok(matches(typed, row), `${row.where}: „${typed}" for „${row.correct}"`);
    }
    assert.equal(matches(`${Number(h) + 1}:${mm}`, row), false, `${row.where}: another hour is another time`);
    // The minutes are digits of their own, never a fraction whose zeros may go.
    const otherMinute = String((Number(mm) + 1) % 60).padStart(2, '0');
    assert.equal(matches(`${h}:${otherMinute}`, row), false, `${row.where}: another minute is another time`);
    assert.equal(matches(`${h} Uhr ${Number(otherMinute)}`, row), false, `${row.where}: „${h} Uhr ${Number(otherMinute)}"`);
    if (mm !== '00' && mm.endsWith('0')) {
      assert.equal(matches(`${h} Uhr ${mm[0]}`, row), false, `${row.where}: „${h} Uhr ${mm[0]}" is ${h}:0${mm[0]}, not ${h}:${mm}`);
    }
  }
});

test('a clock is read as a clock: „19 Uhr 3" is 19:03, never the 19:30 of the Elternabend (batch B4 review)', () => {
  const elternabend = rowOf('a2-1 q21', '19:30');
  assert.equal(matches('19 Uhr 3', elternabend), false, 'the value reading trimmed 19:30 to 19:3');
  assert.equal(matches('19:3', elternabend), false);
  for (const typed of ['19:30', '19 Uhr 30', '19.30 Uhr', '1930', 'um 19:30 Uhr', '19 30']) assert.ok(matches(typed, elternabend), typed);
  // …and where 19:03 IS the answer, „19 Uhr 3" says it.
  const threePast = { correct: '19:03', acceptable: ['19:03', '19.03', '19:03 Uhr', 'neunzehn Uhr drei'] };
  assert.ok(matches('19 Uhr 3', threePast));
  assert.equal(matches('19:30', threePast), false);
});

test('a telephone number is read digit by digit: any grouping of its digits is the same number (batch B4 review)', () => {
  const phone = rowOf('a1-1 q21', '0176 5432108');
  for (const typed of ['0176 543.21.08', '0176 543 21 08', '0176.5432108', '0176-543-21-08', '0176/5432108']) assert.ok(matches(typed, phone), typed);
  for (const typed of ['0176 543.21.09', '176 5432108', '0176 543 21 0']) assert.equal(matches(typed, phone), false, typed);
  const order = rowOf('a1-2 q21', '78345');
  assert.ok(matches('7.8.3.4.5', order), 'an order number read digit by digit');
  assert.equal(matches('7.8.3.4', order), false);
});

test('the measured probes: magnitudes rejected, ordinary spellings of the right value accepted', () => {
  const rejected = [
    ['2,50 €', rowOf('a1-2 q22', '250')],
    ['1,20 €', rowOf('a1-2 q23', '120')],
    ['398 €', rowOf('a1-1 q21', '3,98')],
    ['549 €', rowOf('a2-1 q22', '5,49')],
    ['5.000 Euro', rowOf('a2-2 q21', '50')],
    ['100,00 €', rowOf('a2-2 q23', '10.000')],
    ['1.000.000 €', rowOf('a2-2 q23', '10.000')],
    ['400 €', rowOf('a1-1 q21', '4')],
    ['3,98', rowOf('a2-1 q21', '39,8')],
    ['1,5 m²', rowOf('a1-2 q21', '15', '15 m²')],
    ['B1', rowOf('a2-1 q23', 'A1')], // letters still count
    ['1 Tag', rowOf('a1-1 q23', '1')],
    ['3 mal pro Tag', rowOf('a2-1 q22', 'dreimal')], // a missing list entry, not a matcher rule
  ];
  for (const [typed, row] of rejected) assert.equal(matches(typed, row), false, `${row.where}: „${typed}" for „${row.correct}"`);
  const accepted = [
    ['20:00', rowOf('a1-2 q22', '20')],
    ['20:00 Uhr', rowOf('a1-2 q22', '20')],
    ['10:00', rowOf('a1-2 q21', '10', '10 Uhr')],
    ['18.00 Uhr', rowOf('a1-2 q23', '18')],
    ['250,00 €', rowOf('a1-2 q22', '250')],
    ['120,00 €', rowOf('a1-2 q23', '120')],
    ['10,00 €', rowOf('a1-1 q22', '10')],
    ['39,80', rowOf('a2-1 q21', '39,8')],
    ['Um 10 Uhr', rowOf('a1-2 q21', '10', '10 Uhr')],
    ['um 5:53', rowOf('a2-1 q21', '5:53')],
    ['um 18:00 Uhr', rowOf('a2-1 q23', '18:00')],
    ['3,98 EUR', rowOf('a1-1 q21', '3,98')],
    ['15 Min.', rowOf('a1-1 q23', '15')],
    ['15 qm', rowOf('a1-2 q21', '15', '15 m²')],
    ['15 m2', rowOf('a1-2 q21', '15', '15 m²')],
    ['10°', rowOf('a1-2 q21', '10', '10 Grad')],
    ['10 °C', rowOf('a1-2 q21', '10', '10 Grad')],
    ['200 m', rowOf('a1-2 q21', '200')],
    ['8 km', rowOf('a2-2 q22', '8', '8 Kilometer')],
    ['50 l', rowOf('a2-2 q23', '50')],
    ['10.000 €', rowOf('a2-2 q23', '10.000')],
    ['1930', rowOf('a2-1 q21', '19:30')], // a time written without its colon
    // C-175: a closing full stop is no part of the answer.
    ['Rathaus.', rowOf('a2-2 q23', 'Rathaus')],
    ['Spätburgunder.', rowOf('a2-1 q23', 'Spätburgunder')],
    ['zehn Uhr.', rowOf('a1-2 q21', '10', '10 Uhr')],
  ];
  for (const [typed, row] of accepted) assert.ok(matches(typed, row), `${row.where}: „${typed}" for „${row.correct}"`);
});

test('the three readings: a value, a clock, a digit sequence', () => {
  // canonical: a value, never a digit string
  assert.equal(canonical('2,50 €'), canonical('2.50'));
  assert.notEqual(canonical('2,50'), canonical('250'));
  assert.equal(canonical('2 Euro 50'), canonical('2,50 €'));
  assert.equal(canonical('10.000'), canonical('10000'));
  assert.equal(canonical('4,00 €'), canonical('4'));
  assert.equal(canonical('05,49'), canonical('5,49'));
  // clock: the minutes are digits of their own
  assert.equal(clock('19:30'), '19:30');
  assert.equal(clock('19 Uhr 30'), '19:30');
  assert.equal(clock('19.30 Uhr'), '19:30');
  assert.equal(clock('um 19:30 Uhr.'), '19:30');
  assert.equal(clock('1930'), '19:30');
  assert.equal(clock('19 Uhr 3'), '19:03');
  assert.equal(clock('20'), '20:00');
  assert.equal(clock('05:53'), '5:53');
  assert.equal(clock('19.3'), null, 'one digit after the mark is no minute');
  assert.equal(clock('25:00'), null);
  // digitSequence: the grouping goes, every digit stays
  assert.equal(digitSequence('0176 543.21.08'), digitSequence('0176-5432108'));
  assert.notEqual(digitSequence('0176 5432108'), digitSequence('176 5432108'), 'a leading zero of a phone number stays');
});
