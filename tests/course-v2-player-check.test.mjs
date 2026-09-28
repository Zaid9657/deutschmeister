// src/lib/course-v2/checkItem.js — the v2 answer rules the A1.1 unit reviews asked of the item
// checker (2026-09-28). Every rule closes a finding CLASS: the fixtures pin the review's own
// examples, and the rails at the end run the rule over every registered course's items, so a new
// unit cannot reopen the class with an item the fixtures do not name.
//
//   1. error_correction — the quoted wrong sentence itself is WRONG, and a slip in the corrected
//      token is WRONG (a1.1-u03 r2/r3 F01, u10 r3 F03);
//   2. paradigm twins — kommt/kommst, schlaft/schläft … are WRONG on spine/lexicon topics, a
//      genuine letter slip stays a TYPO (a1.1-u03, u08, u09, u10, u12 r3);
//   3. the word next to a gap — „88 Euro" for „___ Euro" is a TYPO with reason 'number-only',
//      „nach Berlin" for „nach ___" 'word-only'; a clock time keeps its value with a leading zero
//      (a1.1-u10 r3 F06, u12 r3 F04, u11 r3 F08);
//   4. form_fill — an entry is its value plus the field's frame (a1.1-u02 r2/r3, u05 r2/r3,
//      u09 r2/r3), case is free on a form, a street key's words are required.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkItem, quotedSentence, v2CheckOptions, RESULT, isChoiceItem } from '../src/lib/course-v2/checkItem.js';
import { gradeAnswer } from '../src/components/course-v2/grade.js';
import { isAufgabeSubmitted } from '../src/lib/course-v2/completion.js';
import { proofParts, proofShown } from '../src/lib/course-v2/proofs.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const res = (item, input) => checkItem(item, input).result;

// ── 1. error_correction ───────────────────────────────────────────────────────
const c07 = { id: 'a1.1-u03-c07', type: 'error_correction', topic: 'g.possessiv-mein-dein', promptDe: 'Korrigieren Sie die Endung: „Ist das dein Mutter?“', answer: 'Ist das deine Mutter?', accepted: ['Ist das deine Mutter?'], errorTags: ['gender-article'] };
const p10 = { id: 'a1.1-u03-ls2-p10', type: 'error_correction', topic: 'g.vokalwechsel', promptDe: 'Korrigieren Sie das Verb: „Er sprecht gut Deutsch.“', answer: 'Er spricht gut Deutsch.', accepted: ['Er spricht gut Deutsch.'] };

test('error_correction: the item\'s own quoted sentence is WRONG, never a typo (ItemView prefills it)', () => {
  assert.equal(quotedSentence(p10.promptDe), 'Er sprecht gut Deutsch.');
  assert.equal(res(p10, 'Er sprecht gut Deutsch.'), RESULT.WRONG);
  assert.equal(res(p10, 'er sprecht gut deutsch'), RESULT.WRONG, 'after normalisation');
  assert.equal(res(c07, 'Ist das dein Mutter?'), RESULT.WRONG);
  assert.equal(res(c07, 'Ist das deine Mutter?'), RESULT.CORRECT);
});

test('error_correction: a slip in the corrected token is the error the item is about', () => {
  assert.equal(res(c07, 'Ist das meine Mutter?'), RESULT.WRONG, 'a1.1-u03 c07');
  assert.equal(res(p10, 'Er sprichst gut Deutsch.'), RESULT.WRONG, 'a1.1-u03 ls2-p10');
  assert.equal(res(p10, 'Er spricht gut Deutch.'), RESULT.TYPO, 'a slip elsewhere keeps its retry');
  assert.equal(res(c07, 'Ist das deine mutter?'), RESULT.TYPO, 'a case slip keeps its retry');
  const tagged = checkItem(c07, 'Ist das meine Mutter?');
  assert.equal(tagged.errorTag, 'gender-article', 'the item\'s own SCHEMA tag feeds the repair card');
});

test('error_correction: the sentence to correct is the quotation after the colon, never a word the prompt names (a1.1-u08 r1 F01)', () => {
  assert.equal(quotedSentence('Korrigieren Sie die Position von „nicht“: „Ich schwimme gern nicht.“'), 'Ich schwimme gern nicht.');
  assert.equal(quotedSentence('Korrigieren Sie („Sie“, nicht „du“): „Frau Schulz, ist das deine Tochter?“'), 'Frau Schulz, ist das deine Tochter?');
  assert.equal(quotedSentence('Korrigieren Sie: „Um 8:30 Uhr kommt er.“'), 'Um 8:30 Uhr kommt er.', 'a colon inside the quote is not the prompt\'s colon');
  assert.equal(quotedSentence('„Du kommt aus Polen?“ Korrigieren Sie „kommt“.'), 'Du kommt aus Polen?', 'no colon: the longest quotation');
  assert.equal(quotedSentence('Ohne Zitat.'), null);
  const src = readFileSync(join(ROOT, 'src/components/course-v2/ItemView.jsx'), 'utf8');
  assert.match(src, /correctionQuoteOf\(item\.promptDe\)/, 'ItemView prefills the same sentence the checker compares with');
  assert.match(src, /String\(answer\)\.trim\(\) === typoAnswer\.current/, 'the same answer sent again after a typo retry is not a fix (a1.1-u08 r3 F03)');
});

// ── 2. paradigm twins ─────────────────────────────────────────────────────────
const gap = (topic, answer, extra = {}) => ({ id: `x-${answer}`, type: 'fill_blank', topic, promptDe: '___', answer, accepted: [answer], ...extra });

test('paradigm twins on spine topics are WRONG; genuine slips and the umlaut spelling are not', () => {
  const cases = [
    ['g.praesens', 'kommst', { kommt: RESULT.WRONG, komst: RESULT.TYPO }],
    ['g.vokalwechsel', 'schläft', { schläfst: RESULT.WRONG, schlaft: RESULT.WRONG, schlaeft: RESULT.CORRECT }],
    ['g.vokalwechsel', 'sprichst', { sprechst: RESULT.WRONG }],
    ['g.vokalwechsel', 'liest', { lest: RESULT.WRONG }],
    ['g.koennen', 'kannst', { kanst: RESULT.TYPO, kannt: RESULT.WRONG }],
    ['g.vokalwechsel', 'nimmst', { nimmt: RESULT.WRONG, nimst: RESULT.TYPO }],
    ['g.vokalwechsel', 'fängt', { fangt: RESULT.WRONG, fängst: RESULT.WRONG, faengt: RESULT.CORRECT }],
    ['g.wollen', 'wollen', { willen: RESULT.WRONG }],
    ['g.wollen', 'willst', { wollst: RESULT.WRONG, wilst: RESULT.TYPO }],
    ['g.possessiv-mein-dein', 'meine', { deine: RESULT.WRONG, seine: RESULT.WRONG, meine: RESULT.CORRECT }],
    ['g.akkusativ', 'meinen', { deinen: RESULT.WRONG, meine: RESULT.WRONG }],
  ];
  for (const [topic, key, answers] of cases) {
    for (const [typed, want] of Object.entries(answers)) assert.equal(res(gap(topic, key), typed), want, `${typed} for ${key}`);
  }
  assert.equal(res(gap('hoeren', 'schläft'), 'schlaft'), RESULT.TYPO, 'a comprehension gap keeps the live typo rule');
  assert.equal(v2CheckOptions(gap('g.praesens', 'x')).paradigm, true);
  assert.equal(v2CheckOptions({ type: 'dictation', topic: 'g.praesens', answer: 'x' }).paradigm, false, 'never on a dictation');
});

test('Duden doublets and the polite capital reach every v2 item', () => {
  assert.equal(res(gap('g.nicht-position-gern', 'gern'), 'gerne'), RESULT.CORRECT, 'a1.1-u08 c05');
  const polite = { id: 'a1.1-u03-ls3-p10', type: 'error_correction', topic: 'g.possessiv-mein-dein', promptDe: 'Korrigieren Sie („Sie“, nicht „du“): „Frau Schulz, ist das deine Tochter?“', answer: 'Frau Schulz, ist das Ihre Tochter?', accepted: ['Frau Schulz, ist das Ihre Tochter?'], caseSensitive: true, errorTags: ['register'] };
  const typo = checkItem(polite, 'Frau Schulz, ist das Ihre tochter?');
  assert.equal(typo.result, RESULT.TYPO);
  assert.equal(typo.reason, 'case');
  assert.equal(res(polite, 'Frau Schulz, ist das ihre Tochter?'), RESULT.WRONG);
});

test('a spelling slip in the spaces is a TYPO („Wieviel" for „Wie viel", a1.1-u12 r3)', () => {
  const wieviel = { id: 'a1.1-u12-ls3-p02', type: 'fill_blank', topic: 'redemittel', promptDe: '___ kostet der Kurs?', answer: 'Wie viel', accepted: ['Wie viel', 'Was'] };
  assert.equal(res(wieviel, 'Wieviel'), RESULT.TYPO);
  assert.equal(res(wieviel, 'wieviel'), RESULT.TYPO);
  assert.equal(res(wieviel, 'Wie viel'), RESULT.CORRECT);
});

test('a name written letter by letter is the name, whether or not the item lists a spelled form (a1.1-u02 r3 F02)', () => {
  const q01 = { id: 'a1.1-u02-q01', type: 'fill_blank', topic: 'hoeren', promptDe: 'Der Familienname von Arta ist ___.', answer: 'Berisha', accepted: ['Berisha'], exact: 'name' };
  for (const typed of ['B-E-R-I-S-H-A', 'B-E-R-I-S-H-A.', 'B E R I S H A', 'b, e, r, i, s, h, a', 'Berisha']) assert.equal(res(q01, typed), RESULT.CORRECT, typed);
  for (const typed of ['B-E-R-I-S-A', 'Berischa', 'Berisa', 'Ber isha']) assert.equal(res(q01, typed), RESULT.WRONG, typed);
});

// ── 3. the word next to the gap, and clock times ──────────────────────────────
test('the value written with the word next to the gap is a TYPO with a hint, never WRONG', () => {
  const euro = { id: 'a1.1-u10-ls2-i03', type: 'fill_blank', topic: 'hoeren', promptDe: 'Die zwei Fahrkarten kosten zusammen ___ Euro.', answer: '88', accepted: ['88', 'achtundachtzig'], exact: 'number' };
  for (const typed of ['88 Euro', '88 €', '88€', 'achtundachtzig Euro']) {
    const out = checkItem(euro, typed);
    assert.equal(out.result, RESULT.TYPO, typed);
    assert.equal(out.reason, 'number-only', typed);
  }
  assert.equal(res(euro, '89 Euro'), RESULT.WRONG, 'a wrong value stays wrong');
  assert.equal(res(euro, '88 Dollar'), RESULT.WRONG, 'only the printed neighbour may be dropped');
  const words = { id: 'a1.1-u12-ls2-i05', type: 'fill_blank', topic: 'hoeren', promptDe: 'Priya übt jeden Tag ___ Wörter.', answer: 'zehn', accepted: ['zehn', '10'], exact: 'number' };
  assert.equal(checkItem(words, '10 Wörter').reason, 'number-only');
  const berlin = { id: 'a1.1-u12-ls1-i03', type: 'fill_blank', topic: 'hoeren', promptDe: 'Bilal ist von Lahore nach ___ geflogen.', answer: 'Berlin', accepted: ['Berlin'] };
  const w = checkItem(berlin, 'nach Berlin');
  assert.equal(w.result, RESULT.TYPO);
  assert.equal(w.reason, 'word-only');
  assert.equal(res(berlin, 'nach Hamburg'), RESULT.WRONG);
  assert.equal(gradeAnswer(euro, '88 Euro').reason, 'number-only', 'the screen gets the reason for its retry notice');
});

test('a clock time keeps its value with a leading zero; a phone number keeps every zero', () => {
  const time = { id: 't', type: 'fill_blank', topic: 'hoeren', promptDe: 'Der Zug fährt um ___ Uhr ab.', answer: '9.10', accepted: ['9.10', '9:10'], exact: 'number' };
  for (const typed of ['09.10', '09:10', '9.10']) assert.equal(res(time, typed), RESULT.CORRECT, typed);
  assert.equal(res(time, '9.01'), RESULT.WRONG);
  const phone = { id: 'p', type: 'fill_blank', topic: 'hoeren', promptDe: 'Nummer: ___', answer: '0341 90 12 33', accepted: ['0341 90 12 33'], exact: 'number' };
  assert.equal(res(phone, '341 90 12 33'), RESULT.WRONG);
});

// ── 3b. prices (level reviews 2026-09-28) ─────────────────────────────────────
test('a price is its value however it is written: zero cents, the dash, the currency (level reviews 2026-09-28)', () => {
  const laptop = { id: 'x-ls1-p01', type: 'fill_blank', topic: 'hoeren', promptDe: 'Wie viel kostet der Laptop? ___', answer: '890', accepted: ['890'], exact: 'number' };
  for (const typed of ['890', '890,00', '890.00', '890,-', '890,–', '890,– €', '890 €', '890€', '890 EUR', '890 Euro', '€ 890', '890,00 €']) {
    assert.equal(res(laptop, typed), RESULT.CORRECT, typed);
  }
  for (const typed of ['890,50', '8900', '89000', '980', '890 Dollar']) assert.equal(res(laptop, typed), RESULT.WRONG, typed);
  const tickets = { id: 'x-ls1-p02', type: 'fill_blank', topic: 'hoeren', promptDe: 'Die Karten kosten zusammen ___ Euro.', answer: '88', accepted: ['88'], exact: 'number' };
  for (const typed of ['88', '88,00', '88.00', '88,-']) assert.equal(res(tickets, typed), RESULT.CORRECT, typed);
  for (const typed of ['88 Euro', '88,00 Euro', '88,– €', '88 €']) {
    const out = checkItem(tickets, typed);
    assert.equal(out.result, RESULT.TYPO, `${typed}: the currency printed next to the gap stays the number-only retry`);
    assert.equal(out.reason, 'number-only', typed);
  }
  assert.equal(res(tickets, '88,50'), RESULT.WRONG, 'cents that are not zero are another price');
  const cents = { id: 'x-ls1-p03', type: 'fill_blank', topic: 'hoeren', promptDe: 'Das Brot kostet ___', answer: '1,99', accepted: ['1,99'], exact: 'number' };
  for (const typed of ['1,99', '1.99', '1,99 €', '1.99 Euro']) assert.equal(res(cents, typed), RESULT.CORRECT, typed);
  for (const typed of ['1,90', '1,98', '2']) assert.equal(res(cents, typed), RESULT.WRONG, typed);
  const zero = { id: 'x-ls1-p04', type: 'fill_blank', topic: 'hoeren', promptDe: 'Die Miete ist ___ Euro.', answer: '320,00', accepted: ['320,00'], exact: 'number' };
  for (const typed of ['320,00', '320', '320.00', '320,-']) assert.equal(res(zero, typed), RESULT.CORRECT, typed);
  const worded = { id: 'x-ls1-p05', type: 'fill_blank', topic: 'hoeren', promptDe: 'Der Preis: ___', answer: '2,50 Euro', accepted: ['2,50 Euro'], exact: 'number' };
  for (const typed of ['2,50 €', '€ 2,50', '2.50 EUR', '2,50']) assert.equal(res(worded, typed), RESULT.CORRECT, typed);
  const dict = { id: 'x-ls1-g01', type: 'dictation', topic: 'hoeren', promptDe: 'Hören Sie und schreiben Sie den Satz.', answer: 'Das kostet 890 Euro.', accepted: ['Das kostet 890 Euro.'], exact: 'number' };
  for (const typed of ['Das kostet 890 Euro.', 'Das kostet 890,00 Euro.', 'Das kostet 890,- Euro.', 'Das kostet 890 €.']) assert.equal(res(dict, typed), RESULT.CORRECT, typed);
  assert.notEqual(res(dict, 'Das kostet 890.'), RESULT.CORRECT, 'a dictation still needs its word „Euro"');
  assert.notEqual(res({ ...dict, answer: 'Ich habe 3 Kinder.', accepted: ['Ich habe 3 Kinder.'] }, 'Ich habe 3 € Kinder.'), RESULT.CORRECT, 'nor may it add a currency');
  assert.equal(res(dict, 'Das kostet 980 Euro.'), RESULT.WRONG);
  const time = { id: 't2', type: 'fill_blank', topic: 'hoeren', promptDe: 'Der Kurs beginnt um ___ Uhr.', answer: '8.30', accepted: ['8.30', '8:30'], exact: 'number' };
  assert.equal(res(time, '8.00'), RESULT.WRONG, 'a time is not a price: „8.00" is not „8.30"');
});

// ── 4a. form_fill: digits and number words ────────────────────────────────────
test('form_fill: a number written as digits equals its number word, in the entry and its frame (level review s1 #4)', () => {
  const sit = 'Tarek Nasser kommt aus Syrien, aus Damaskus. Er ist 35 Jahre alt, verheiratet und hat zwei Kinder. In Damaskus ist er Lehrer.';
  const f4 = { id: 'a11-p1-w1-sd1-f4', type: 'form_fill', topic: 'schreiben', labelDe: 'Familienstand', answer: 'verheiratet', accepted: ['verheiratet', 'verheiratet, zwei Kinder'], situationDe: sit, otherAnswers: ['Nasser', 'Syrien', '35', 'Lehrer'] };
  for (const typed of ['verheiratet, 2 Kinder', 'verheiratet, zwei Kinder', 'Verheiratet, 2 Kinder', 'verheiratet']) assert.equal(res(f4, typed), RESULT.CORRECT, typed);
  for (const typed of ['verheiratet, 3 Kinder', 'verheiratet, drei Kinder', 'ledig, 2 Kinder', '2 Kinder']) assert.equal(res(f4, typed), RESULT.WRONG, typed);
  // the other way round: the field's own form in digits takes the number word
  const digits = { ...f4, accepted: ['verheiratet', 'verheiratet, 2 Kinder'], situationDe: 'Er ist verheiratet und hat 2 Kinder.' };
  assert.equal(res(digits, 'verheiratet, zwei Kinder'), RESULT.CORRECT);
  assert.equal(res(digits, 'verheiratet, drei Kinder'), RESULT.WRONG);
  const five = { ...f4, accepted: ['verheiratet'], situationDe: 'Er ist verheiratet und hat fünf Kinder.' };
  for (const typed of ['verheiratet, fünf Kinder', 'verheiratet, 5 Kinder']) assert.equal(res(five, typed), RESULT.CORRECT, `${typed}: an umlaut number word licenses its digits`);
  assert.equal(res(five, 'verheiratet, 6 Kinder'), RESULT.WRONG);
  const big = { id: 'y', type: 'form_fill', topic: 'schreiben', labelDe: 'Schüler', answer: 'vierundzwanzig', accepted: ['vierundzwanzig'], situationDe: 'Sie hat vierundzwanzig Schüler.' };
  assert.equal(res(big, '24'), RESULT.CORRECT, '„24" = „vierundzwanzig"');
  assert.equal(res(big, '25'), RESULT.WRONG);
  // the Leitpunkt pre-check reads the same fold (an advisory hint, never the score)
  assert.match(readFileSync(join(ROOT, 'src/components/course-v2/WritingTaskView.jsx'), 'utf8'), /const fold = \(s\) => foldNumberWords\(/);
});

// ── 4. form_fill ──────────────────────────────────────────────────────────────
const U02 = 'Emre Yıldız ist 30 und lernt im Kurs A1. Er lernt online, nicht in Leipzig. Er wohnt in İzmir. İzmir ist in der Türkei. Die Muttersprache von Emre ist Türkisch.';
const U05 = 'Arjun ist 31 Jahre alt und mit Priya verheiratet. Die beiden wohnen noch in einer WG, Berliner Straße 21, aber die WG ist zu klein. Jetzt möchten sie die Wohnung in der Kölner Straße 18 in Leipzig.';
const field = (labelDe, answer, accepted, situationDe, exact) => ({ id: `f-${answer}`, type: 'form_fill', topic: 'schreiben', labelDe, answer, accepted, situationDe, ...(exact ? { exact } : {}) });

test('form_fill: a negated alternative of the label is information, an un-negated one is a wrong entry (a1.1-u02 f5)', () => {
  const f5 = field('Kurs: in Leipzig oder online?', 'online', ['online'], U02);
  for (const typed of ['online', 'Online', 'Onlinekurs', 'Online-Kurs', 'Online-Kurs, nicht in Leipzig', 'nicht in Leipzig, online', 'Kurs online']) {
    assert.equal(res(f5, typed), RESULT.CORRECT, typed);
  }
  for (const typed of ['in Leipzig', 'in Leipzig online', 'online Leipzig', 'nicht online, in Leipzig']) assert.equal(res(f5, typed), RESULT.WRONG, typed);
});

test('form_fill: words of the situation sentence that states the same fact may stand beside the value (a1.1-u01/u02 f1)', () => {
  const f1 = field('Wohnort', 'İzmir', ['İzmir', 'Izmir'], U02);
  for (const typed of ['Izmir in der Türkei', 'in Izmir, Türkei', 'İzmir / Türkei', 'Izmir (Türkei)']) assert.equal(res(f1, typed), RESULT.CORRECT, typed);
  for (const typed of ['Leipzig', 'Türkei', 'Izmir, Leipzig']) assert.equal(res(f1, typed), RESULT.WRONG, typed);
  assert.equal(res(f1, 'Ismir'), RESULT.TYPO, 'a spelling slip in a place keeps its retry');
});

test('form_fill: a letter slip in a word of the situation beside the value is a TYPO, as the slip alone is (a1.1-u02 f1/f2)', () => {
  const f1 = field('Wohnort', 'İzmir', ['İzmir', 'Izmir'], U02);
  const f2 = field('Land', 'Türkei', ['Türkei'], U02);
  assert.equal(res(f2, 'Turkei'), RESULT.TYPO, 'the slip alone in the Land field');
  for (const typed of ['Izmir, Turkei', 'Izmir in der Turkei', 'İzmir / Türke']) assert.equal(res(f1, typed), RESULT.TYPO, typed);
  assert.equal(checkItem(f1, 'Izmir, Turkei').errorTag, null, 'a TYPO carries no error tag');
  for (const typed of ['Izmir, Türkei', 'Izmir Tuerkei']) assert.equal(res(f1, typed), RESULT.CORRECT, typed);
  // never a licence for other information, or for the label's other alternative misspelt
  for (const typed of ['Izmir, Leipzig', 'Izmir, Leipzg', 'Izmir, Türkisch']) assert.equal(res(f1, typed), RESULT.WRONG, typed);
  const f5 = field('Kurs: in Leipzig oder online?', 'online', ['online'], U02);
  assert.equal(res(f5, 'in Leipzg online'), RESULT.WRONG, 'a slip of the other alternative is still that alternative');
});

test('form_fill: „nur" is a frame word — „nur online" needs no accepted entry (a1.1-u02 f5)', () => {
  const f5 = field('Kurs: in Leipzig oder online?', 'online', ['online'], U02);
  for (const typed of ['nur online', 'Nur online.', 'online, nur online']) assert.equal(res(f5, typed), RESULT.CORRECT, typed);
  assert.equal(res(f5, 'nur in Leipzig'), RESULT.WRONG);
});

test('form_fill: numbers with their frame words, a street with its postcode and city (a1.1-u05)', () => {
  const alter = field('Alter', '31', ['31'], U05, 'number');
  for (const typed of ['31', '31 Jahre', '31 Jahre alt', 'einunddreißig']) assert.equal(res(alter, typed), RESULT.CORRECT, typed);
  assert.equal(res(alter, '13 Jahre alt'), RESULT.WRONG);
  const leute = field('Wie viele Leute wohnen dann in der Wohnung?', '2', ['2', 'zwei'], U05, 'number');
  for (const typed of ['2', 'Zwei', '2 Personen', 'für 2 Personen', '2 Person', 'zwei Leute']) assert.equal(res(leute, typed), RESULT.CORRECT, typed);
  assert.equal(res(leute, '3 Personen'), RESULT.WRONG);
  const adresse = field('Adresse jetzt (Straße, Hausnummer)', 'Berliner Straße 21', ['Berliner Straße 21', 'Berliner Str. 21'], U05, 'number');
  for (const typed of ['Berliner Straße 21', 'Berliner Straße Nr. 21', 'Berliner Straße 21, Leipzig', 'Berliner Straße 21, 04105 Leipzig']) {
    assert.equal(res(adresse, typed), RESULT.CORRECT, typed);
  }
  assert.equal(res(adresse, 'Berliner Strase 21'), RESULT.TYPO);
  for (const typed of ['Berliner Straße 12', 'Kölner Straße 21', '21']) assert.equal(res(adresse, typed), RESULT.WRONG, typed);
  const stand = field('Familienstand', 'verheiratet', ['verheiratet'], U05);
  for (const typed of ['verheiratet', 'Verheiratet', 'verheiratet mit Priya']) assert.equal(res(stand, typed), RESULT.CORRECT, typed);
  assert.equal(res(stand, 'ledig'), RESULT.WRONG);
});

test('form_fill: the time of day, the other fields\' values and the Anrede may stand beside a value (a1.1-u09 r2/r3 F03)', () => {
  const SIT = 'Olena Kovalenko hat am Freitag Geburtstag. Am Abend isst sie mit Freunden im Restaurant Kochi. Sie essen um halb acht.';
  const keys = { f1: 'Olena Kovalenko', f3: 'Freitag', f4: '19.30 Uhr', f5: '6' };
  const mk = (id, labelDe, accepted, exact) => ({ ...field(labelDe, accepted[0], accepted, SIT, exact), id, otherAnswers: Object.entries(keys).filter(([k]) => k !== id).map(([, v]) => v) });
  const zeit = mk('f4', 'Uhrzeit', ['19.30 Uhr', '7.30 Uhr', 'halb acht'], 'number');
  for (const typed of ['um 19.30 Uhr am Freitag', '19:30', 'um 7.30 abends', 'abends um halb acht', 'halb acht am Abend']) assert.equal(res(zeit, typed), RESULT.CORRECT, typed);
  for (const typed of ['20.30', 'halb neun']) assert.equal(res(zeit, typed), RESULT.WRONG, typed);
  const tag = mk('f3', 'Tag', ['Freitag', 'am Freitag', 'Fr.']);
  for (const typed of ['Freitagabend', 'am Freitag Abend', 'Freitag abends', 'am Freitag um 19.30 Uhr']) assert.equal(res(tag, typed), RESULT.CORRECT, typed);
  assert.equal(res(tag, 'Samstag'), RESULT.WRONG);
  const name = mk('f1', 'Name', ['Olena Kovalenko', 'Kovalenko, Olena'], 'name');
  assert.equal(res(name, 'Frau Olena Kovalenko'), RESULT.CORRECT);
  assert.equal(res(name, 'Frau Kovalenko'), RESULT.WRONG);
  const tisch = mk('f5', 'Tisch für wie viele Leute?', ['6', 'sechs'], 'number');
  for (const typed of ['Tisch für 6', 'für sechs Leute', 'Tisch für 6 Personen']) assert.equal(res(tisch, typed), RESULT.CORRECT, typed);
  const termin = field('Termin: vormittags oder nachmittags?', 'nachmittags', ['nachmittags', 'am Nachmittag'], '');
  assert.equal(res(termin, 'nachmittags, nicht vormittags'), RESULT.CORRECT);
  assert.equal(res(termin, 'vormittags'), RESULT.WRONG, 'a time of day the label offers as the other alternative is the wrong entry');
});

test('form_fill: a name keeps its letters exact; case is free on a form', () => {
  const ort = field('Geburtsort', 'Lahore', ['Lahore'], 'Er ist am 14. März 1999 in Lahore geboren.', 'name');
  for (const typed of ['Lahore', 'lahore', 'in Lahore']) assert.equal(res(ort, typed), RESULT.CORRECT, typed);
  assert.equal(res(ort, 'Lahor'), RESULT.WRONG, 'a letter slip is another name');
  assert.equal(checkItem(ort, 'lahore').reason, undefined, 'no case notice on a form entry');
});

// ── rails over every registered course ───────────────────────────────────────
function registeredItems() {
  const out = [];
  const base = join(ROOT, 'content/course-v2');
  for (const level of readdirSync(base).filter((d) => /^[ab][12]\.[12]$/.test(d))) {
    const dir = join(base, level, 'units');
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => /^u\d{2}\.json$/.test(x))) {
      let doc;
      try { doc = JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { continue; }
      const walk = (o, ctx) => {
        if (Array.isArray(o)) { o.forEach((x) => walk(x, ctx)); return; }
        if (!o || typeof o !== 'object') return;
        if (typeof o.id === 'string' && typeof o.type === 'string' && typeof o.answer === 'string') out.push({ kind: 'item', item: o });
        if (o.form && Array.isArray(o.form.fields)) {
          for (const fl of o.form.fields) {
            out.push({ kind: 'form', item: { id: `${o.bankKey}-${fl.id}`, type: 'form_fill', topic: 'schreiben', answer: fl.answer, accepted: fl.accepted?.length ? fl.accepted : [fl.answer], exact: fl.exact, labelDe: fl.labelDe, situationDe: o.situationDe } });
          }
        }
        for (const v of Object.values(o)) walk(v, ctx);
      };
      walk(doc);
    }
  }
  return out;
}
const ALL = registeredItems();
const typedItems = ALL.filter((x) => x.kind === 'item' && !isChoiceItem(x.item) && x.item.type !== 'dictation');
const prep = (s) => String(s || '').toLowerCase().replace(/[.,!?;:„“"]/g, '').replace(/\s+/g, ' ').trim();

test('rail (all courses): every error correction\'s own quoted sentence grades WRONG', () => {
  const ec = typedItems.filter((x) => x.item.type === 'error_correction' && quotedSentence(x.item.promptDe));
  for (const { item } of ec) {
    const quote = quotedSentence(item.promptDe);
    if ((item.accepted || [item.answer]).some((a) => prep(a) === prep(quote))) continue;
    assert.equal(res(item, quote), RESULT.WRONG, `${item.id}: „${quote}“`);
  }
});

test('rail (all courses): the person-ending twin of a one-word key on a spine/lexicon topic grades WRONG', () => {
  for (const { item } of typedItems) {
    if (!/^(g|lx)\./.test(String(item.topic || '')) || item.exact) continue;
    const key = String(item.answer).trim();
    if (!/^\p{L}{4,}$/u.test(key)) continue;
    let twin = null;
    if (/[^s]t$/.test(key)) twin = `${key.slice(0, -1)}st`;
    else if (/st$/.test(key) && key.length > 4) twin = `${key.slice(0, -2)}t`;
    if (!twin || (item.accepted || []).some((a) => prep(a) === prep(twin))) continue;
    assert.equal(res(item, twin), RESULT.WRONG, `${item.id}: „${twin}“ for „${key}“`);
  }
});

test('rail (all courses): every number gap takes its value with the unit word printed after the gap as a TYPO', () => {
  for (const { item } of typedItems) {
    if (item.type !== 'fill_blank' || item.exact !== 'number') continue;
    const m = /_{2,}\s*(\p{L}+)/u.exec(String(item.promptDe || ''));
    if (!m) continue;
    const typed = `${item.answer} ${m[1]}`;
    if ((item.accepted || []).some((a) => prep(a) === prep(typed))) continue;
    const out = checkItem(item, typed);
    assert.equal(out.result, RESULT.TYPO, `${item.id}: „${typed}“`);
    assert.equal(out.reason, 'number-only', item.id);
  }
});

test('rail (all courses): a whole-euro key takes its zero cents and dash, a key with cents its dot', () => {
  let n = 0;
  for (const { item } of typedItems) {
    if (item.exact !== 'number') continue;
    const key = String(item.answer).trim();
    if (/^\d+$/.test(key)) {
      for (const typed of [`${key},00`, `${key}.00`, `${key},-`]) assert.equal(res(item, typed), RESULT.CORRECT, `${item.id}: „${typed}“ for „${key}“`);
      n += 1;
    } else if (/^\d+,\d{2}$/.test(key)) {
      assert.equal(res(item, key.replace(',', '.')), RESULT.CORRECT, `${item.id}: „${key.replace(',', '.')}“ for „${key}“`);
      n += 1;
    }
  }
  assert.ok(n > 0, 'the rail reads at least one number key');
});

test('rail (all courses): a clock-time key keeps its value with a leading zero', () => {
  for (const { item } of typedItems) {
    if (item.exact !== 'number' || !/^\d[.:]\d{2}$/.test(String(item.answer).trim())) continue;
    assert.equal(res(item, `0${item.answer.trim()}`), RESULT.CORRECT, item.id);
  }
});

test('rail (all courses): every form field takes its key in any case, and its key with a frame word', () => {
  const forms = ALL.filter((x) => x.kind === 'form');
  for (const { item } of forms) {
    for (const typed of [item.answer, item.answer.toLowerCase(), item.answer.charAt(0).toUpperCase() + item.answer.slice(1)]) {
      assert.equal(res(item, typed), RESULT.CORRECT, `${item.id}: „${typed}“`);
    }
    if (item.exact === 'number' && /^\d+$/.test(item.answer) && /Leute|Personen|wie viele/i.test(item.labelDe)) {
      assert.equal(res(item, `für ${item.answer} Personen`), RESULT.CORRECT, `${item.id}: „für ${item.answer} Personen“`);
    }
  }
});

// ── a multi-Teil round is a speaking Aufgabe (completion.js) ─────────────────
test('a multi-Teil speaking round is recognised as a speaking Aufgabe, card Teile included (SCHEMA §8 `{ parts }`)', () => {
  const round = { bankKey: 'a11-u01-s', parts: [{ template: 'sd1.sp1', mode: 'monologue' }, { template: 'sd1.sp2', mode: 'cards-ask' }], aiRole: { name: 'x' } };
  assert.equal(isAufgabeSubmitted(round, { speechSeconds: 25 }), true, 'enough speech');
  assert.equal(isAufgabeSubmitted(round, { speechSeconds: 5, turns: 2 }), true, 'a card Teil counts its turns');
  assert.equal(isAufgabeSubmitted(round, { speechSeconds: 5, turns: 1 }), false);
  const mono = { ...round, parts: [{ mode: 'monologue' }, { mode: 'monologue' }] };
  assert.equal(isAufgabeSubmitted(mono, { speechSeconds: 5, turns: 3 }), false, 'no card Teil: turns alone do not count');
});

test('rail (all courses): the determiner swap of a one-word possessive key on a spine topic grades WRONG (ITM-13)', () => {
  const swap = { m: 'd', d: 'm', s: 'm' };
  for (const { item } of typedItems) {
    if (!/^(g|lx)\./.test(String(item.topic || '')) || item.exact) continue;
    const key = String(item.answer).trim();
    const m = /^([mds])ein(e|en|em|er|es)?$/i.exec(key);
    if (!m) continue;
    const twin = `${swap[m[1].toLowerCase()]}${key.slice(1)}`;
    if ((item.accepted || []).some((a) => prep(a) === prep(twin))) continue;
    assert.equal(res(item, twin), RESULT.WRONG, `${item.id}: „${twin}“ for „${key}“`);
  }
});

// ── „Das kann ich": an entry may name an item AND an Aufgabe (SCHEMA §8, 2026-09-28) ─────────
test('Check.proofs: every named proof is listed and the can-do is shown only when each one is', () => {
  const proof = { canDo: 'cd.a1.buchstabieren', item: 'a1.1-u02-q01', aufgabe: 'sprechen' };
  assert.deepEqual(proofParts(proof, {}).map((p) => [p.kind, p.ok]), [['item', false], ['aufgabe', false]], 'the item first, then the Aufgabe — neither ignored');
  assert.equal(proofShown(proof, { items: { 'a1.1-u02-q01': true } }), false, 'the item alone does not tick it (CheckView used to stop here)');
  assert.equal(proofShown(proof, { aufgaben: { sprechen: true } }), false, 'nor the Aufgabe alone');
  assert.equal(proofShown(proof, { items: { 'a1.1-u02-q01': true }, aufgaben: { sprechen: true } }), true);
  assert.equal(proofShown(proof, { items: { 'a1.1-u02-q01': false }, aufgaben: { sprechen: true } }), false, 'a proof item answered wrong');
  assert.equal(proofShown({ canDo: 'cd.a1.formular-person', microOutput: 'a1.1-u02-ls2-mo' }, { microOutputs: { 'a1.1-u02-ls2-mo': true } }), true);
  assert.equal(proofShown({ canDo: 'cd.a1.x' }, { aufgaben: { sprechen: true } }), false, 'an entry that names no proof is never shown');
  assert.equal(proofShown({ canDo: 'cd.a1.x', aufgabe: 'schreiben' }, { aufgaben: null }), false, 'no evidence yet');
});

test('Check.proofs: CheckView reads the one rule and renders a line per named proof', () => {
  const src = readFileSync(join(ROOT, 'src/components/course-v2/CheckView.jsx'), 'utf8');
  assert.match(src, /proofParts\(proof, \{ items: proofResults, aufgaben, microOutputs \}\)/);
  assert.match(src, /st\.labels\.map\(/, 'one status line per named proof');
  assert.ok(!/if \(proof\.item\) \{/.test(src), 'no item-first early return');
});
