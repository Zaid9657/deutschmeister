import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { auditTenses, missingTenseSelector, tenseRequirement, PERFECT_FORMS } from '../scripts/a12-tense-check.mjs';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';
import { knownUpTo } from '../src/lib/checkpoint/lexis.js';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';

const read = (file) => JSON.parse(readFileSync(new URL(`../src/data/lessonPools/${file}`, import.meta.url), 'utf8'));
const pool = read('a12.json');

// Teacher-authored contrasts, NOT generated from the scanner's conjugations.
const MATRIX = [
  ['Ich', 'bin', 'war', 'habe', 'hatte'],
  ['Du', 'bist', 'warst', 'hast', 'hattest'],
  ['Er', 'ist', 'war', 'hat', 'hatte'],
  ['Wir', 'sind', 'waren', 'haben', 'hatten'],
  ['Ihr', 'seid', 'wart', 'habt', 'hattet'],
  ['Sie', 'sind', 'waren', 'haben', 'hatten'],
  ['Meine Cousine', 'ist', 'war', 'hat', 'hatte'],
];

test('M15-2 independent sein/haben matrix: seven subjects, both tense directions, gaps and sentences', () => {
  let cases = 0;
  for (const [subject, seinNow, seinPast, habenNow, habenPast] of MATRIX) {
    for (const [lemma, now, past, complement] of [['sein', seinNow, seinPast, 'müde'], ['haben', habenNow, habenPast, 'Zeit']]) {
      for (const [key, alternate, tense] of [[now, past, 'Präsens'], [past, now, 'Präteritum']]) {
        for (const type of ['fill_blank', 'sentence_building']) {
          const answer = type === 'fill_blank' ? key : `${subject} ${key} ${complement}.`;
          const alternative = type === 'fill_blank' ? alternate : `${subject} ${alternate} ${complement}.`;
          const questionDe = type === 'fill_blank' ? `${subject} ___ ${complement}. (${lemma})`
            : `Bilden Sie den Satz: [${subject} / ${lemma} / ${complement}]`;
          const item = { id: 'unseen-example', type, questionDe, answer, accepted: [answer] };
          assert.ok(missingTenseSelector(item, 7), `${questionDe}: unstated tense must fail`);
          assert.deepEqual(tenseRequirement(item, 7).alternatives, [alternative]);
          assert.equal(missingTenseSelector(item, 6), null, 'no competing tense before L7');
          assert.equal(missingTenseSelector({ ...item, questionDe: `${questionDe} (${tense})` }, 7), null);
          assert.equal(missingTenseSelector({ ...item, accepted: [answer, alternative] }, 7), null, 'accepting the fitting contrast also closes the task');
          assert.equal(checkAnswer(alternative, item.accepted, checkOptionsFor(item)).result, RESULT.WRONG);
          assert.equal(checkAnswer(alternative, [answer, alternative], checkOptionsFor(item)).result, RESULT.CORRECT);
          assert.ok(missingTenseSelector({ ...item, questionEn: `Use ${tense}`, explanationDe: `Im ${tense}.` }, 7), 'English and feedback cannot select the tense');
          assert.ok(missingTenseSelector({ ...item, questionDe: `${questionDe} (nicht im ${tense})` }, 7), 'a negated selector cannot pass');
          cases += 1;
        }
      }
    }
  }
  assert.equal(cases, 56);
});

test('M15-2 includes other taught present/perfect verbs and distinguishes fixed tense scaffolds', () => {
  for (const [lemma, answer, past] of [['kaufen', 'Wir kaufen Brot.', 'Wir haben Brot gekauft.'], ['fahren', 'Er fährt nach Hause.', 'Er ist nach Hause gefahren.'], ['wohnen', 'Ich wohne in Berlin.', 'Ich habe in Berlin gewohnt.']]) {
    const item = { type: 'sentence_building', questionDe: `Bilden Sie den Satz: [wir / ${lemma} / Brot]`, answer, accepted: [answer] };
    assert.equal(missingTenseSelector(item, 11), null);
    assert.ok(missingTenseSelector(item, 12));
    assert.equal(missingTenseSelector({ ...item, questionDe: `${item.questionDe} (Präsens)` }, 12), null);
    assert.deepEqual(tenseRequirement(item, 12).alternatives, [past]);
    assert.equal(missingTenseSelector({ ...item, accepted: [answer, past] }, 12), null);
    assert.equal(missingTenseSelector({ ...item, answer: past, accepted: [answer, past] }, 12), null);
  }
  assert.equal(missingTenseSelector({ type: 'fill_blank', questionDe: 'Ich habe Brot ___. (kaufen)', answer: 'gekauft' }, 12), null);
  assert.equal(missingTenseSelector({ type: 'fill_blank', questionDe: 'Er ___ nach Hause gegangen.', answer: 'ist' }, 12), null);
  assert.equal(missingTenseSelector({ type: 'error_correction', questionDe: 'Korrigieren Sie den Artikel: „Das ist meine Bruder.“', answer: 'Das ist mein Bruder.' }, 12), null);
  assert.equal(missingTenseSelector({ type: 'fill_blank', questionDe: '___ bitte pünktlich! (sein, ihr)', answer: 'Seid' }, 12), null);
});

test('M15-2 scans every servable pool item, both practice draws and checkpoint rounds 0–3', () => {
  const audit = auditTenses(pool);
  assert.equal(audit.servable, 282, 'no item removed from service to hide the ambiguity');
  assert.equal(audit.served, 481, 'selectors change task-shape diversity in the two practice draws; all 16 papers remain covered');
  assert.deepEqual(audit.findings, []);
  console.log(`M15-2 audit: ${audit.servable} servable pool items; ${audit.served} served items; ${audit.findings.length} missing tense selectors`);
});

test('M15-2 all selected tenses survive the build with English twins; removing any selector is caught', () => {
  assert.ok(knownUpTo(CURRICULUM_A12, 7).has('präteritum'), 'the L7 notice introduces the selector before any past-tense item');
  const extras = read('a12.extra.json').items;
  const corrections = read('a12.corrections.json').items;
  const english = read('a12.explanationsEn.json');
  let mutations = 0;
  for (const item of pool.items.filter((it) => it.minLektion != null)) {
    const requirement = tenseRequirement(item, 12);
    if (!requirement) continue;
    const { tense } = requirement;
    const source = extras.find((it) => it.id === item.id) || corrections[item.id];
    assert.ok(source?.questionDe.includes(`(${tense})`), `${item.id}: selector must live in its source`);
    assert.ok(item.questionEn.includes(tense), `${item.id}: matching English task`);
    assert.ok(item.explanationDe.includes(tense), `${item.id}: matching German explanation`);
    assert.ok(item.explanationEn.includes(tense), `${item.id}: matching English explanation`);
    assert.equal(item.explanationEn, source.explanationEn || english[item.id]);
    const stripped = { ...item, questionDe: item.questionDe.replace(new RegExp(`\\s*\\(${tense}\\)`, 'g'), '') };
    assert.ok(missingTenseSelector(stripped, 12), `${item.id}: selector-removal mutation escaped`);
    mutations += 1;
  }
  assert.ok(mutations >= 36);
  console.log(`M15-2 selector-removal mutations: ${mutations}/${mutations} caught`);
});

test('M15-2 the tense inventory covers every currently servable perfect verb', () => {
  for (const item of pool.items.filter((it) => it.minLektion != null && it.topic === 'perfekt-intro')) {
    const cue = item.questionDe.match(/\(([a-zäöüß]+)(?:,|\))/)?.[1];
    if (cue && !['sein', 'haben'].includes(cue)) assert.ok(PERFECT_FORMS[cue], `${cue}: extend the taught tense inventory`);
  }
});
