// Free answer variants (2026-10-25 Codex re-evaluation, A1.1 BLOCKER „zu dem“ and A1.2 MAJOR „gerne“;
// re-landed 2026-11-19). Closed as a rule in src/lib/lesson/check.js and checked over every servable
// item of both pools, never as a list of ids.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkAnswer, checkOptionsFor, isDictationTask, RESULT } from '../src/lib/lesson/check.js';
import { middleFieldOrders } from '../src/data/lessonPools/quality.js';

const servable = ['a11', 'a12'].flatMap((level) => JSON.parse(readFileSync(new URL(`../src/data/lessonPools/${level}.json`, import.meta.url), 'utf8')).items)
  .filter((item) => item.minLektion != null);
const grade = (item, answer) => checkAnswer(answer, item.accepted?.length ? item.accepted : [item.answer], checkOptionsFor(item)).result;
const typed = (item) => !item.options;
const FULL = { zum: 'zu dem', zur: 'zu der', beim: 'bei dem', vom: 'von dem' };
const CONTRACTION = /(?<!\p{L})(zum|zur|beim|vom)(?!\p{L})/u;
const expand = (text) => text.replace(new RegExp(CONTRACTION, 'gu'), (word) => FULL[word]);
const formTask = (item) => /Kurzform|volle Form|Korrigieren/.test(item.questionDe);

test('outside a short-form task or a correction, „zu dem“ / „zu der“ / „bei dem“ / „von dem“ is the same answer', () => {
  const free = servable.filter((item) => typed(item) && CONTRACTION.test(item.answer) && !formTask(item));
  const fixed = servable.filter((item) => typed(item) && CONTRACTION.test(item.answer) && formTask(item));
  assert.ok(free.length > 0 && fixed.length > 0, `both kinds exist: ${free.length} free, ${fixed.length} fixed`);
  for (const item of free) assert.equal(grade(item, expand(item.answer)), RESULT.CORRECT, `${item.id}: ${expand(item.answer)}`);
  // The task names the short form or a single repair: the full form is not that answer.
  for (const item of fixed) assert.equal(grade(item, expand(item.answer)), RESULT.WRONG, `${item.id}: ${expand(item.answer)}`);
  // A changed preposition is still a different answer, and a dictation is what was heard.
  const bus = servable.find((item) => item.id === 'extra-a11-l10-12');
  assert.equal(grade(bus, 'Kommt der Bus zu dem Bahnhof?'), RESULT.CORRECT);
  assert.equal(grade(bus, 'Kommt der Bus bei dem Bahnhof?'), RESULT.WRONG);
  const heard = { type: 'dictation', topic: 'hoeren', answer: 'Ich gehe zum Bahnhof.', accepted: ['Ich gehe zum Bahnhof.'] };
  assert.ok(isDictationTask(heard));
  assert.equal(grade(heard, 'Ich gehe zu dem Bahnhof.'), RESULT.WRONG);
});

test('„gerne“ and „gern“ are the same answer wherever gern is the key, and nowhere else', () => {
  const items = servable.filter((item) => typed(item) && /(?<!\p{L})gern(?!\p{L})/u.test(item.answer) && !isDictationTask(item));
  assert.ok(items.length > 0, `${items.length} gern items`);
  for (const item of items) {
    const gerne = item.answer.replace(/(?<!\p{L})gern(?!\p{L})/u, 'gerne');
    assert.equal(grade(item, gerne), RESULT.CORRECT, `${item.id}: ${gerne}`);
  }
  const books = servable.find((item) => item.id === 'a68c2007-8c6d-5e15-906c-7cb300ed9fee');
  assert.equal(grade(books, 'Du liest gerne Bücher.'), RESULT.CORRECT);
  assert.equal(grade(books, 'Du liest Bücher gerne.'), RESULT.CORRECT);
  assert.equal(grade(books, 'Du lesen gerne Bücher.'), RESULT.WRONG);
  // „gerner“ is not a variant of anything.
  assert.equal(checkAnswer('Ich gehe gerner ins Kino.', ['Ich gehe gern ins Kino.'], {}).result, RESULT.WRONG);
});

test('a cued sentence takes every licensed middle-field order of its phrases, and only those', () => {
  const build = servable.filter((item) => item.type === 'sentence_building');
  let checked = 0;
  for (const item of build) {
    for (const order of middleFieldOrders(item)) { checked += 1; assert.equal(grade(item, order), RESULT.CORRECT, `${item.id}: ${order}`); }
  }
  assert.ok(checked > 0, 'the rule reaches the pools');
  // The re-evaluation's two examples, and the orders the rule must refuse.
  const cook = servable.find((item) => item.id === '20fdea30-db58-5380-b2e5-c2a3eff7f6c7');
  assert.equal(grade(cook, 'Heute kocht das Essen meine Mutter.'), RESULT.CORRECT);
  const probe = (questionDe, answer) => middleFieldOrders({ type: 'sentence_building', questionDe, answer });
  assert.deepEqual(probe('Schreiben Sie den Satz (Beginnen Sie mit „Er“): [er / abholen / dich / um 8 Uhr]', 'Er holt dich um 8 Uhr ab.'), [], 'a weak pronoun stays first');
  assert.deepEqual(probe('Bilden Sie den Satz (Beginnen Sie mit „Hat“): [haben / der Zug / Verspätung]', 'Hat der Zug Verspätung?'), [], 'a light-verb noun stays last');
  assert.deepEqual(probe('Bilden Sie den Satz (Beginnen Sie mit „Der Lehrer“): [der Lehrer / sein / heute / krank]', 'Der Lehrer ist heute krank.'), [], 'a predicate stays last');
  assert.deepEqual(probe('Bilden Sie den Satz (Beginnen Sie mit „Hat“): [haben / der Zug / nach Österreich / Verspätung]', 'Hat der Zug nach Österreich Verspätung?'), [], 'an attributive nach-phrase stays with its noun');
  assert.deepEqual(probe('Bilden Sie den Satz (Beginnen Sie mit „Ich“): [ich / kommen / heute / nicht / ins Büro]', 'Ich komme heute nicht ins Büro.'), [], 'negation is out of the rule');
  assert.deepEqual(probe('Bilden Sie den Satz: [wir / wollen / am Sonntag / Fußball / spielen]', 'Wir wollen am Sonntag Fußball spielen.'), [], 'without a named opening the Vorfeld is open, so the fronting rule decides');
  assert.deepEqual(probe('Bilden Sie den Satz (Beginnen Sie mit „Wir“): [wir / wollen / am Sonntag / Fußball / spielen]', 'Wir wollen am Sonntag Fußball spielen.'), ['Wir wollen Fußball am Sonntag spielen.']);
  // Mutation: the built key without the gained orders rejects them again.
  const bare = { ...cook, accepted: [cook.answer] };
  assert.equal(grade(bare, 'Heute kocht das Essen meine Mutter.'), RESULT.WRONG);
});

test('a typed gap names its word, never only a word class', () => {
  const vague = servable.filter((item) => !item.options && /___/.test(item.questionDe) && /\((?:Adjektiv|Nomen|Adverb|Verb|Wort)\)/.test(item.questionDe));
  assert.deepEqual(vague.map((item) => item.id), []);
  assert.match(servable.find((item) => item.id === 'extra-a11-l12-17').questionDe, /\(schön\)/);
});

test('digits and number words are one answer in a sentence, never in a number or time task', () => {
  const chair = servable.find((item) => item.id === 'extra-a11-l04-08');
  assert.ok(chair && / zwölf Euro/.test(chair.answer), chair?.answer);
  assert.equal(grade(chair, chair.answer.replace('zwölf', '12')), RESULT.CORRECT);
  assert.equal(grade(chair, chair.answer.replace('zwölf', '13')), RESULT.WRONG);
  const numberTasks = servable.filter((item) => !item.options && /number|zahl|count/i.test(item.topic || '') && /^(?:eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)$/.test(item.answer));
  assert.ok(numberTasks.length > 0);
  for (const item of numberTasks) assert.equal(checkAnswer(String({ eins: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10 }[item.answer]), item.accepted, checkOptionsFor(item)).result, RESULT.WRONG, item.id);
  assert.equal(checkAnswer('Wie geht’s Ihnen?', ['Wie geht es Ihnen?'], {}).result, RESULT.CORRECT);
});