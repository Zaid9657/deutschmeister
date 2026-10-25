import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULA } from '../src/data/curricula/index.js';
import { A11_META } from '../src/data/curricula/a11.meta.js';
import { derivedItems, ATTEMPT_CYCLE } from '../src/lib/lesson/buildLesson.js';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';
import { wordOrderAnswers } from '../src/lib/lesson/wordOrder.js';
import { missingOpeningCue, missingDeterminerCue, determinerRepair, namedRepairAccepts, taskConstraintsEn } from '../src/data/lessonPools/quality.js';
import cards from '../scripts/rule-card-overrides.mjs';
import { abschlusstestA11 } from '../src/data/courseTests/abschlusstestA11.js';
import { abschlusstestA12 } from '../src/data/courseTests/abschlusstestA12.js';
import { ITEM_FORMULAS } from '../src/lib/checkpoint/lexis.js';

const pools = ['a11', 'a12'].map((level) => JSON.parse(readFileSync(new URL(`../src/data/lessonPools/${level}.json`, import.meta.url), 'utf8')).items);
const servable = pools.flat().filter((item) => item.minLektion != null);
const grade = (item, answer) => checkAnswer(answer, item.accepted || [item.answer], checkOptionsFor(item)).result;
const opening = /\(Beginnen Sie mit „([^“]+)“(?:;[^)]*)?\)/;
const checkOpenings = (items) => {
  for (const item of items.filter((it) => it.type === 'sentence_building')) {
    if (/\b(?:Imperativ|Bitte)\b/i.test(item.questionDe)) {
      assert.ok(item.accepted.some((answer) => answer.startsWith(item.answer.split(' ')[0])), item.id);
      if (/\bbitte\b/i.test(item.answer)) assert.ok(item.accepted.some((answer) => /^Bitte /i.test(answer)), item.id);
      continue;
    }
    const cue = opening.exec(item.questionDe);
    assert.ok(cue, `${item.id}: every statement or question names its opening`);
    assert.ok(item.answer.startsWith(`${cue[1]} `), `${item.id}: the key follows the cue`);
    assert.equal(missingOpeningCue(item), null, item.id);
  }
};

test('Batch 1: every servable sentence-building item constrains or accepts its openings; cue-removal mutations fail', () => {
  checkOpenings(servable);
  for (const [id, cue] of [['extra-a11-l11-08', 'Ich'], ['extra-a11-l12-14', 'Wir'], ['extra-a11-l09-05', 'Ich']]) {
    const item = servable.find((it) => it.id === id);
    assert.equal(opening.exec(item.questionDe)?.[1], cue);
    const mutant = { ...item, questionDe: item.questionDe.replace(opening, '') };
    assert.throws(() => checkOpenings([mutant]), /every statement or question names its opening/);
    assert.equal(missingOpeningCue(mutant), cue);
    assert.equal(grade(item, item.answer), RESULT.CORRECT);
  }
  assert.equal(missingOpeningCue({ type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [um acht Uhr / wir / anfangen]', answer: 'Um acht Uhr fangen wir an.' }), 'Um acht Uhr');
  const imperative = servable.find((item) => item.answer === 'Mach die Tür auf!');
  assert.equal(grade(imperative, 'Mache die Tür auf!'), RESULT.CORRECT);
});

test('Batch 1: named determiner repairs bind both levels, including definite-article suffixes', () => {
  for (const item of servable.filter(determinerRepair)) {
    assert.equal(missingDeterminerCue(item), null, item.id);
    assert.match(item.questionDe, /Korrigieren Sie (?:den Artikel|den Possessivartikel|die Endung)|\((?:Artikel|Possessivartikel|Endung)\)/);
    for (const answer of [item.answer, ...(item.accepted || [])]) assert.equal(namedRepairAccepts(item, answer), true, `${item.id}: ${answer}`);
  }
  const item = servable.find((it) => it.id === 'extra-a11-l05-23');
  assert.equal(namedRepairAccepts(item, 'Die Schlüssel sind gelb.'), false);
  assert.equal(grade(item, 'Die Schlüssel sind gelb.'), RESULT.WRONG);
  assert.equal(grade(item, 'Der Schlüssel ist gelb.'), RESULT.CORRECT);
  assert.ok(missingDeterminerCue({ ...item, questionDe: 'Korrigieren Sie: „Die Schlüssel ist gelb.“ (mit bestimmtem Artikel)' }));
  for (const probe of servable.filter((it) => /^Korrigieren Sie/.test(it.questionDe))) {
    assert.match(probe.questionDe, /^Korrigieren Sie (?:den|die|das)\b|\((?:Artikel|Verb(?: auf Position 2(?: oder Wort denn)?)?|Endung|Possessivartikel|Wort \p{L}+|Infinitiv am Satzende)\)/u, probe.id);
    for (const answer of [probe.answer, ...(probe.accepted || [])]) assert.ok(namedRepairAccepts(probe, answer), `${probe.id}: ${answer}`);
  }
  const greeting = servable.find((it) => it.id === 'extra-a11-l01-08');
  assert.equal(namedRepairAccepts(greeting, 'Gute Nacht, Frau Kaya!'), false);
  assert.equal(namedRepairAccepts(greeting, 'Guten Tag, Frau Kaya!'), true);
  const formula = new RegExp(ITEM_FORMULAS.join('|'), 'g');
  assert.equal('Korrigieren Sie das Wort um: „Der Termin ist um Montag.“'.replace(formula, '').trim(), 'um: „Der Termin ist um Montag.“');
  assert.equal('Das Wort ist neu.'.replace(formula, ''), 'Das Wort ist neu.');
  const order = servable.find((probe) => probe.id === 'extra-a12-l01-04');
  assert.match(order.questionDe, /\(Verb auf Position 2\)/);
  assert.equal(namedRepairAccepts(order, 'Zuerst fahren Sie bis zur Kirche.'), false);
  assert.equal(namedRepairAccepts(order, 'Zuerst gehen Sie bis zur Kirche.'), true);
});

test('Batch 1: a choice between pronouns with the same agreement names an antecedent', () => {
  const ambiguous = (items) => items.filter((it) => {
    const options = it.options || [];
    return /___/.test(it.questionDe) && [ /^(?:er|sie|es)$/i, /^(?:wir|sie)$/i ].some((family) => options.filter((o) => family.test(o)).length > 1)
      && !/[.!?].*___/.test(it.questionDe);
  });
  assert.deepEqual(ambiguous(servable), []);
  const mother = servable.find((it) => it.id === 'dd1c3d60-8ae7-4c94-8990-19633dcba36f');
  assert.match(mother.questionDe, /^Meine Mutter ist hier\./);
  assert.equal(grade(mother, 'Sie'), RESULT.CORRECT);
  assert.equal(grade(mother, 'Es'), RESULT.WRONG);
  assert.equal(ambiguous([{ ...mother, questionDe: '___ ist meine Mutter.' }]).length, 1);
});

test('Batch 1: shared tile generation refuses uncovered grammar and accepts every supported order', () => {
  for (const text of ['Nein. Hier ist keine Lampe und kein Spiegel.', 'Ich kaufe den Stuhl und die Lampe.', 'Ich habe gestern mit Ana schön gefeiert.']) {
    const lektion = { id: 'synthetic', dialog: { lines: [{ de: text }] } };
    assert.deepEqual(wordOrderAnswers(text), [], text);
    assert.equal(derivedItems(lektion).some((it) => it.type === 'word_order'), false, text);
  }
  let count = 0;
  for (const curriculum of Object.values(CURRICULA)) for (const lektion of curriculum.lektionen) {
    for (let attempt = 1; attempt <= ATTEMPT_CYCLE; attempt += 1) {
      for (const item of derivedItems(lektion, attempt).filter((it) => it.type === 'word_order')) {
        count += 1;
        assert.ok(wordOrderAnswers(item.answer).length, item.answer);
        for (const answer of wordOrderAnswers(item.answer)) assert.equal(grade(item, answer), RESULT.CORRECT, answer);
        assert.equal(grade(item, `${item.answer} extra`), RESULT.WRONG);
      }
      const drawn = derivedItems(lektion, attempt);
      assert.equal(new Set(drawn.map((it) => it.id)).size, drawn.length);
      const matches = drawn.filter((it) => it.type === 'match');
      const words = matches.flatMap((it) => it.pairs.map((pair) => pair.de));
      assert.equal(new Set(words).size, words.length, 'a replacement matching item uses different taught words');
    }
  }
  assert.ok(count > 0, 'the generator still serves supported tile tasks');
  for (const [text, alternatives] of [
    ['Ich bin Studentin.', ['Studentin bin ich.']],
    ['Kaufst du morgen ein?', ['Du kaufst morgen ein?', 'Morgen kaufst du ein?', 'Kaufst morgen du ein?']],
    ['Deine Party ist bestimmt schön!', ['Bestimmt ist deine Party schön!', 'Bestimmt schön ist deine Party!', 'Schön ist deine Party bestimmt!']],
  ]) {
    const item = derivedItems({ id: 'probe', dialog: { lines: [{ de: text }] } }).find((it) => it.type === 'word_order');
    assert.ok(item, text);
    for (const alternative of alternatives) assert.equal(grade(item, alternative), RESULT.CORRECT, alternative);
    assert.equal(grade(item, 'Ich Studentin bin.'), RESULT.WRONG);
  }
});

test('Batch 1: every binding opening and its extra restrictions survive the English hint', () => {
  const assertHints = (items) => {
    for (const item of items) {
      for (const constraint of taskConstraintsEn(item)) assert.ok(item.questionEn.includes(constraint), `${item.id}: ${constraint}`);
      const cue = opening.exec(item.questionDe);
      if (cue) assert.ok(item.questionEn.includes(`Begin with “${cue[1]}”.`), item.id);
    }
  };
  assertHints(servable);
  const corner = servable.find((it) => it.id === 'extra-a12-l01-02');
  assert.ok(corner.questionEn.includes('Begin with “Dann”.'));
  assert.throws(() => assertHints([{ ...corner, questionEn: 'Build the sentence about the corner.' }]), /Begin with/);
  assert.deepEqual(taskConstraintsEn({ questionDe: 'Bilden Sie den Satz (Beginnen Sie mit „Ich“; „nicht“ steht vor „ohne“; nach „denn“ mit „mein Kopf“): [...] (Präsens)', type: 'sentence_building' }), [
    'Begin with “Ich”.', 'Put “nicht” before “ohne”.', 'After “denn”, begin with “mein Kopf”.', 'Use the present tense.',
  ]);
});

test('Batch 1: bilingual grammar cards qualify endings, confirmation questions and imperative pronouns', () => {
  assert.match(cards['present-tense-regular'].content, /du tanzt/);
  assert.match(cards['present-tense-regular'].content, /English:[\s\S]*s.*z.*tanzt/);
  const question = cards['yes-no-questions'];
  assert.ok(!question.commonMistakes.some((m) => m.wrong === 'Sie kommen aus Österreich?'));
  assert.match(question.content, /Bestätigungsfrage/);
  assert.match(question.content, /English:[\s\S]*confirmation[\s\S]*writing/);
  assert.match(cards.imperative.content, /meist|normalerweise/);
  assert.match(cards.imperative.content, /betont bleibt es stehen/);
  assert.match(cards.imperative.content, /English:[\s\S]*emphasis/);
});

test('Batch 1: room count, cancellation model and residence translation match their tasks', () => {
  const a12 = CURRICULA['a1.2'];
  const rooms = a12.lektionen[1].dialog.lines.find((l) => /Zwei Zimmer:/.test(l.de));
  assert.ok(rooms);
  assert.match(rooms.de, /Wohnzimmer und Schlafzimmer/);
  assert.match(rooms.en, /Two rooms: living room and bedroom/);
  assert.match(a12.lektionen[5].schreiben.sample, /Ich komme heute nicht\./);
  assert.ok(A11_META.lektionIntro['a1.1-l02'].canDoEn.some((line) => /where I live/.test(line)));
});

test('Batch 1: final-test intros name the scored skills, self-check and omissions; instructions address Sie', () => {
  for (const exam of [abschlusstestA11, abschlusstestA12]) {
    assert.match(exam.intro, /Hören und Lesen/);
    assert.match(exam.intro, /Selbstcheck/);
    assert.match(exam.intro, /Sprechen.*nicht enthalten/);
    assert.doesNotMatch(exam.intro, /Aufbau der (?:echten )?Prüfung|halbe Länge/);
    assert.match(exam.intro, /keine offizielle Prüfung/);
    const directed = [exam.intro, ...exam.sections.flatMap((s) => [s.instructions, ...s.parts.flatMap((p) => [p.task || '', ...(p.criteria || [])])])].join(' ');
    assert.doesNotMatch(directed, /\b(?:du|dein\w*|dich|dir|Lies|Schreib|Nenne|nutze)\b/i);
  }
  assert.match(abschlusstestA11.intro, /Formular/);
  assert.match(abschlusstestA12.intro, /Mitteilung/);
  assert.match(abschlusstestA12.intro, /Formular.*nicht enthalten/);
});
