import test from 'node:test';
import assert from 'node:assert/strict';
import * as v from '../scripts/validate-curriculum.mjs';
import { PRIMARY_ORDER_A21, NEVER_FORMS_A21 } from '../src/data/curricula/a21-language.js';
import { priorLevelSpecs } from '../src/data/curricula/inheritance.js';
import { constructionHits, deferredConstructionHits, introducedAt } from '../src/data/curricula/constructions.js';
import { examFormat, writingFormat } from '../src/data/curricula/examFormats.js';
import { knownUpTo, lexisSpec, formsOf as browserForms } from '../src/lib/checkpoint/lexis.js';
import { buildCheckpoint, checkpointWritingTask, chapterWritingTask } from '../src/lib/checkpoint/buildCheckpoint.js';
import { buildLexicon } from '../src/lib/lesson/gloss.js';
import { curriculumFor, anyCurriculumFor } from '../src/data/curricula/index.js';
import { CURRICULUM_A21 } from '../src/data/curricula/a21.js';
import { a21RatchetMeasurements } from './helpers/a21-measurements.mjs';

function withA21(run) {
  const spec = v.levelSpec('a2.1');
  const original = spec.curriculum;
  const c = {
    level: 'a2.1', code: 'A2.1', examKey: 'goethe_a2', checkpoints: [],
    lektionen: PRIMARY_ORDER_A21.map((primarySlug, i) => ({
      nr: i + 1, id: `a2.1-l${String(i + 1).padStart(2, '0')}`, primarySlug,
      wortfeld: i === 3 ? ['frisch', 'alt', 'neu', 'schön', 'dunkel', 'teuer'].map((word) => ({ de: word, word })) : [],
      dialog: { lines: [] }, notice: { bodyDe: '', examples: [] },
    })),
  };
  spec.curriculum = c;
  try { return run(c, spec); } finally { spec.curriculum = original; }
}

test('G2: A2.1 validator, checkpoint, adjective, Wechsel and gloss readers inherit the whole chain', () => withA21((c, spec) => {
  assert.equal(lexisSpec('a2.1').inheritGloss, undefined, 'new levels inherit glosses without opting in');
  const validator = v.levelLexicon('a2.1');
  const browser = knownUpTo(c, 0);
  const gloss = new Set(buildLexicon('a2.1', 1, () => c).map((x) => x.entry.word));
  for (const level of ['a1.1', 'a1.2']) {
    for (const l of v.levelSpec(level).curriculum.lektionen) for (const word of l.wortfeld) {
      for (const form of v.formsOf(word, spec.irregularForms, 'a2.1')) {
        assert.ok(validator.has(form), `${level} validator: ${word.de} / ${form}`);
        assert.ok(browser.has(form), `${level} checkpoint: ${word.de} / ${form}`);
      }
      assert.ok(gloss.has(word.word), `${level} gloss: ${word.de}`);
    }
    for (const [phrase] of v.wechselInventory(level)) assert.equal(v.wechselInventory('a2.1').get(phrase), 0, phrase);
    for (const adjective of v.adjectiveLexicon(level)) assert.ok(v.adjectiveLexicon('a2.1').has(adjective), adjective);
  }
  assert.ok(!browser.has('frischen'), 'current-level future lexis is not inherited');
  assert.ok(!gloss.has('frisch'), 'future gloss is not exposed');
}));

test('G2: arbitrary-depth chains preserve order and reject cycles and missing links', () => {
  const rows = { one: { level: 'one' }, two: { level: 'two', seedFrom: 'one' }, three: { level: 'three', seedFrom: 'two' } };
  assert.deepEqual(priorLevelSpecs({ level: 'four', seedFrom: 'three' }, (key) => rows[key]).map((s) => s.level), ['three', 'two', 'one']);
  rows.one.seedFrom = 'three';
  assert.throws(() => priorLevelSpecs(rows.three, (key) => rows[key]), /cycle/);
  assert.throws(() => priorLevelSpecs({ seedFrom: 'missing' }, (key) => rows[key]), /Missing vocabulary ancestor/);
});

test('G2: the existing A1 gloss lists remain exactly their same-level lists', () => {
  for (const level of ['a1.1', 'a1.2']) for (let nr = 1; nr <= 12; nr += 1) {
    const expected = new Map();
    for (const l of curriculumFor(level).lektionen.slice(0, nr)) for (const w of l.wortfeld) {
      const key = (w.word || w.de).trim().toLowerCase();
      if (!expected.has(key)) expected.set(key, w);
    }
    const rows = [...expected].map(([key, entry]) => ({ tokens: key.split(/\s+/), entry })).sort((a, b) => b.tokens.length - a.tokens.length);
    assert.equal(JSON.stringify(buildLexicon(level, nr)), JSON.stringify(rows));
  }
});

test('G3: examKey selects 11 A1 or 13 A2 Teile and the correct Textsorten', () => {
  assert.deepEqual(examFormat('goethe_a1').teile, v.EXAM_TEILE);
  assert.equal(v.EXAM_TEILE.length, 11);
  assert.deepEqual(examFormat('goethe_a2').teile, [
    ...[1, 2, 3, 4].map((n) => `Hören Teil ${n}`), ...[1, 2, 3, 4].map((n) => `Lesen Teil ${n}`),
    'Schreiben Teil 1', 'Schreiben Teil 2', 'Sprechen Teil 1', 'Sprechen Teil 2', 'Sprechen Teil 3',
  ]);
  assert.deepEqual(examFormat('goethe_a2').parts.filter((p) => p.teil.startsWith('Lesen')).map((p) => p.format), ['mc3', 'mc3', 'mc3', 'match']);
  for (const [examKey, level] of [['goethe_a1', 'a1.1'], ['goethe_a1', 'a1.2'], ['goethe_a2', 'a2.1']]) {
    for (const nr of [1, 2]) {
      const teil = `Schreiben Teil ${nr}`;
      const form = writingFormat(examKey, teil);
      const c = { level, examKey, lektionen: [{ nr, examTeile: [teil], schreiben: { ...form, taskKey: 'fixture' } }] };
      assert.deepEqual(v.examTeileBacked(c), []);
      c.lektionen[0].schreiben.kind = form.kind === 'formular' ? 'mitteilung' : 'formular';
      assert.equal(v.examTeileBacked(c).length, 1);
      if (examKey === 'goethe_a1') assert.equal(v.examTeileBacked(c)[0].why, `schreiben.kind is "${c.lektionen[0].schreiben.kind}", Teil ${nr} is a ${form.label}`);
    }
  }
  assert.throws(() => examFormat('not-an-exam'), /Unknown course examKey/);
  const speaking = { lektionen: [{ nr: 1, examTeile: ['Sprechen Teil 1'], sprechen: { open: { promptDe: 'Fragen Sie nach der Uhrzeit.' } } }] };
  assert.equal(v.examTeileBacked({ ...speaking, level: 'a1.1', examKey: 'goethe_a1' }).length, 1);
  assert.deepEqual(v.examTeileBacked({ ...speaking, level: 'a2.1', examKey: 'goethe_a2' }), []);
});

test('G3: checkpoint lookup follows examKey and A2 cannot fall back to A1 Lesen', () => {
  const a1 = v.levelSpec('a1.1').curriculum;
  const cp = a1.checkpoints[0];
  const chapter = a1.lektionen.slice(0, 3);
  assert.ok(checkpointWritingTask(cp, chapter));
  assert.equal(checkpointWritingTask(cp, chapter, 'goethe_a2'), null);
  assert.ok(chapterWritingTask(chapter, 'a1.1'));
  assert.equal(chapterWritingTask(chapter, 'a1.1', 'goethe_a2'), null);
  assert.equal(checkpointWritingTask({ writingTaskKey: 'sms-einladung-absagen' }, chapter, 'goethe_a2').bank.examKey, 'goethe_a2');
  assert.equal(chapterWritingTask([{ schreiben: { taskKey: 'email-kursanmeldung' } }], 'a2.1', 'goethe_a2').bank.examKey, 'goethe_a2');
  assert.throws(() => buildCheckpoint({ curriculum: { ...a1, examKey: 'goethe_a2' }, checkpoint: cp, pool: [] }), /authored exam Lesen surfaces are required/);
});

test('G4: article and possessive adjective endings open at L4, dative endings at L11', () => withA21((c) => {
  const horizon = v.constructionHorizonIndex('a2.1');
  for (const text of ['Der weiße Käse ist frisch.', 'Ich kaufe einen frischen Salat.', 'Mein neuer Bus ist da.', 'Eure schöne Wohnung ist da.', 'Kein alter Bus ist da.']) {
    assert.equal(horizon({ answer: text }), 4, text);
    assert.ok(deferredConstructionHits(c, 3, text).length, text);
    assert.deepEqual(deferredConstructionHits(c, 4, text), [], text);
  }
  for (const text of ['Ich fahre mit dem alten Bus.', 'Ich fahre mit meiner neuen Tasche.', 'Ich helfe den alten Männern.', 'Ich fahre ab dem dritten Mai.']) {
    assert.equal(horizon({ answer: text }), 11, text);
    assert.ok(deferredConstructionHits(c, 10, text).length, text);
    assert.deepEqual(deferredConstructionHits(c, 11, text), [], text);
  }
  assert.equal(horizon({ answer: 'Ich kaufe frische Milch.' }), null);
  assert.equal(horizon({ answer: 'Die Milch ist frisch.' }), 0);
  assert.equal(introducedAt(c, 'adjective-declension'), 4);
  [c.lektionen[3].primarySlug, c.lektionen[4].primarySlug] = [c.lektionen[4].primarySlug, c.lektionen[3].primarySlug];
  assert.equal(v.constructionHorizonIndex('a2.1')({ answer: 'Der alte Bus ist da.' }), 5, 'horizon follows the teaching slug');
}));

test('G4: adjective gating reaches line horizons and model-production checks, A1 stays never', () => withA21((c) => {
  const text = 'Der alte Bus ist da.';
  c.lektionen[0].dialog.lines = [{ de: text }];
  c.lektionen[0].pretest = { model: text };
  assert.equal(v.lineHorizons('a2.1')['a2.1-l01#0'], 4);
  assert.ok(v.constructionsBeforeTaught(c, []).some((hit) => hit.nr === 1 && hit.taught === 4));
  for (const level of ['a1.1', 'a1.2']) {
    assert.ok(constructionHits(text, level).some((hit) => hit.never));
    assert.ok(deferredConstructionHits(v.levelSpec(level).curriculum, 12, text).length);
  }
}));

test('G5: engine limits, personas and exact ratchets register a draft curriculum only', () => {
  const spec = v.levelSpec('A2.1');
  assert.equal(spec.code, 'A2.1');
  assert.equal(spec.curriculum, CURRICULUM_A21);
  assert.equal(curriculumFor('a2.1'), null);
  assert.equal(anyCurriculumFor('a2.1'), CURRICULUM_A21);
  assert.deepEqual([spec.maxDialogueWords, spec.maxNoticeWords, spec.maxWortfeldEntries], [14, 70, 30]);
  assert.equal(spec.personaSource, 'a2.1');
  // A2.1 inherits every A1.2 persona unchanged and adds the plan's new cast (Frau Schulz, Frau Yilmaz,
  // Herr Wagner); RULE 14 guards contradictions between them (supervisor authorization, step 3).
  const personas = v.PERSONA_TABLES[spec.personaSource];
  for (const [name, row] of Object.entries(v.PERSONAS_A12)) assert.deepEqual(personas[name], row, `${name} is inherited unchanged`);
  assert.deepEqual(spec.ratchets, a21RatchetMeasurements(), 'every ratchet equals its measurement');
  // Step 3 authored the pool: the build carries every hand-authored item with its answer, and every item has
  // a German cue, an answer and an English explanation.
  const pool = v.loadPoolItems('a2.1');
  const extra = v.loadExtraItems('a2.1');
  assert.ok(pool.length > 0 && extra.length > 0, 'the A2.1 pool is built');
  assert.ok(pool.every((item) => item.questionDe && item.answer && item.explanationEn), 'every pool item is complete');
  assert.ok(extra.every((item) => pool.some((built) => built.id === item.id && built.answer === item.answer)), 'the build carries every authored item');
});

test('G5: validation accepts the D5 boundaries and rejects one word or entry above each', () => withA21((c) => {
  const lesson = structuredClone(v.levelSpec('a1.2').curriculum.lektionen[0]);
  c.lektionen = [lesson];
  lesson.wortfeld = Array.from({ length: 30 }, () => ({ de: 'gut', word: 'gut', en: 'good' }));
  lesson.dialog.lines = [{ speaker: 'Tim', de: Array(14).fill('gut').join(' '), en: 'fixture' }];
  lesson.notice.bodyDe = Array(70).fill('gut').join(' ');
  const limits = (errors) => errors.filter((s) => /Wortfeld entries, expected|words, max|notice.bodyDe is/.test(s));
  assert.deepEqual(limits(v.validateCurriculum(c, [], [])), []);
  lesson.wortfeld.push({ de: 'alt', word: 'alt', en: 'old' });
  lesson.dialog.lines[0].de += ' gut';
  lesson.notice.bodyDe += ' gut';
  assert.deepEqual(limits(v.validateCurriculum(c, [], [])), [
    'Lektion 1: 31 Wortfeld entries, expected 15–30',
    'Lektion 1 line 0: 15 words, max 14',
    'Lektion 1: notice.bodyDe is 71 words, expected 1–70',
  ]);
}));

test('G6: validator and browser generate A2.1 strong, separable, ge-less, modal and adjective forms', () => {
  const spec = v.levelSpec('a2.1');
  const examples = [
    ['fallen', 'gefallen'], ['aufstehen', 'aufgestanden'], ['treffen', 'getroffen'], ['essen', 'gegessen'],
    ['einschlafen', 'eingeschlafen'], ['zurückkommen', 'zurückgekommen'], ['weggehen', 'weggegangen'],
    ['losfahren', 'losgefahren'], ['herkommen', 'hergekommen'], ['hinfahren', 'hingefahren'],
    ['einpacken', 'eingepackt'], ['anrufen', 'angerufen'], ['aufräumen', 'aufgeräumt'],
    ['besuchen', 'besucht'], ['erzählen', 'erzählt'], ['telefonieren', 'telefoniert'], ['verstehen', 'verstanden'],
    ['spazieren gehen', 'gegangen'], ['können', 'konnte', 'konntest', 'konnten', 'könnte', 'könnten'],
    ['müssen', 'musste', 'mussten'], ['dürfen', 'durfte'], ['wollen', 'wollte'], ['mögen', 'mochte'], ['sollen', 'sollte', 'sollten'],
    ['frisch', 'frische', 'frischer', 'frisches', 'frischen'], ['teuer', 'teure', 'teuren'], ['dunkel', 'dunkle', 'dunklen'], ['hoch', 'hohe', 'hohen'],
  ];
  for (const [word, ...expected] of examples) {
    const entry = { word, de: word };
    const forms = v.formsOf(entry, spec.irregularForms, spec.level);
    assert.deepEqual([...forms], [...browserForms(entry, lexisSpec('a2.1').irregularForms, 'a2.1')], word);
    for (const form of expected) assert.ok(forms.has(form), `${word} → ${form}`);
  }
  for (const [word, banned] of [['gehen', 'ging'], ['kommen', 'kam'], ['sagen', 'sagte'], ['haben', 'hätte'], ['sein', 'wäre'], ['gut', 'besten']]) {
    assert.ok(!v.formsOf({ word, de: word }, spec.irregularForms, spec.level).has(banned), `${word}: ${banned}`);
  }
});

test('G6: bounded forms wait for their teaching lesson', () => withA21(() => {
  const horizon = v.constructionHorizonIndex('a2.1');
  for (const [text, lesson] of [
    ['Wir haben eingepackt.', 2], ['Ich konnte nicht kommen.', 6], ['Es tut mir leid, dass ich krank war.', 6],
    ['Du solltest bleiben.', 7], ['Wir könnten gehen.', 7], ['Er ist aufgestanden.', 8],
    ['Ich bleibe, weil ich krank bin.', 8], ['Ich gebe es ihm.', 9], ['Ich komme, wenn ich Zeit habe.', 12],
  ]) assert.equal(horizon({ answer: text }), lesson, text);
}));

test('G6: every never-taught family has positive and negative probes', () => withA21(() => {
  const horizon = v.constructionHorizonIndex('a2.1');
  const probes = [
    ['Ich freue mich.', 'Ich habe Zeit.'],
    ['Der Bus ist schneller als das Auto.', 'Der Bus ist teurer als das Auto.'],
    ['Das ist der schnellste Bus.', 'Das ist der alte Bus.'],
    ['Ich hätte Zeit.', 'Ich würde gern kommen.'],
    ['Weil ich krank bin, bleibe ich.', 'Ich bleibe, weil ich krank bin.'],
    ['Ich bleibe, weil ich arbeiten muss.', 'Ich bleibe, weil ich krank bin.'],
    ['Ich frage, ob er kommt.', 'Er kommt.'],
    ['Ich warte darauf.', 'Ich warte hier.'],
    ['Ich versuche zu kommen.', 'Ich bin zu Hause.'],
    ['Ich werde kommen.', 'Sie wird 80.'],
    ['Das Haus wird gebaut.', 'Ich habe gebaut.'],
    ['Der Mann, der hier wohnt, kommt.', 'Der Mann wohnt hier.'],
    ['Das Auto des Mannes.', 'Das Auto von Tim.'],
    ['Ich sagte nichts.', 'Ich habe nichts gesagt.'],
  ];
  assert.equal(probes.length, NEVER_FORMS_A21.length);
  for (const [i, [positive, negative]] of probes.entries()) {
    const re = NEVER_FORMS_A21[i];
    assert.ok(new RegExp(re.source, re.flags).test(positive), positive);
    assert.equal(horizon({ answer: positive }), null, positive);
    assert.notEqual(horizon({ answer: negative }), null, negative);
  }
  for (const text of ['Ich weiß, dass er angerufen hat.', 'Ich bleibe, weil es wehtut.', 'Ich weiß, dass er bezahlt hat.', 'Ich bleibe, weil ich müde bin.']) {
    assert.equal(horizon({ answer: text }) === null, !text.includes('müde bin'), text);
  }
  assert.notEqual(horizon({ answer: 'Es ist zu spät.' }), null);
}));
