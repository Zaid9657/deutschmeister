// Guard suite for the situational curricula (docs/course-factory/a11-rebuild/CONTRACT.md).
//
// The curriculum module is the single source the lesson player, the checkpoint builder and the
// public syllabus page read, so an error here is an error on a page a buyer sees before paying —
// and, worse, in the teaching sequence itself. Three kinds of assertion:
//
//   1. THE VALIDATOR RUNS CLEAN — `scripts/validate-curriculum.mjs` re-derives every structural
//      rule of the contract from the data; this test fails with its messages.
//   2. THE RULES ARE PINNED HERE TOO, independently of the validator, so a rule that is quietly
//      loosened in the script still fails the suite.
//   3. THE VALIDATOR BITES — mutations of a known-good curriculum must be caught, otherwise a
//      green run means nothing.
import test from 'node:test';
import assert from 'node:assert/strict';

import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { writingTaskByKey } from '../src/data/writingTasks.js';
import {
  validateCurriculum, GRAMMAR_SLUGS, EXAM_TEILE, PRIMARY_ORDER, SITUATION_KEYWORDS,
} from '../scripts/validate-curriculum.mjs';

const L = CURRICULUM_A11.lektionen;
const clone = () => JSON.parse(JSON.stringify(CURRICULUM_A11));
const wordCount = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

test('A1.1 passes scripts/validate-curriculum.mjs', () => {
  const errors = validateCurriculum(CURRICULUM_A11);
  assert.deepEqual(errors, [], `\n  - ${errors.join('\n  - ')}`);
});

test('rule 1: 12 Lektionen with contract ids and unique kebab-case slugs', () => {
  assert.equal(L.length, 12);
  L.forEach((l, i) => {
    assert.equal(l.nr, i + 1);
    assert.equal(l.id, `a1.1-l${String(i + 1).padStart(2, '0')}`);
    assert.match(l.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.equal(l.minutes, 15);
  });
  assert.equal(new Set(L.map((l) => l.slug)).size, 12);
});

test('rule 2: the 12 situations in order, can-dos in ich-Form, exam Teile from the closed list', () => {
  L.forEach((l, i) => {
    for (const kw of SITUATION_KEYWORDS[i]) assert.ok(l.situation.includes(kw), `Lektion ${l.nr}: "${kw}"`);
    assert.ok(l.handlungsfeld.length > 0);
    assert.ok(l.canDo.length >= 3 && l.canDo.length <= 5);
    for (const c of l.canDo) assert.match(c, /^Ich kann .+\.$/);
    assert.ok(l.examTeile.length >= 1 && l.examTeile.length <= 3);
    for (const t of l.examTeile) assert.ok(EXAM_TEILE.includes(t), t);
  });
  const seen = new Set(L.flatMap((l) => l.examTeile));
  assert.deepEqual([...EXAM_TEILE].filter((t) => !seen.has(t)), [], 'every one of the 11 Teile is rehearsed');
});

test('rule 3: every grammar slug is primary exactly once, in the taught order', () => {
  assert.deepEqual(L.map((l) => l.primarySlug), PRIMARY_ORDER);
  assert.deepEqual([...PRIMARY_ORDER].sort(), [...GRAMMAR_SLUGS].sort());
  for (const l of L) {
    assert.ok(l.grammarSlugs.length >= 1 && l.grammarSlugs.length <= 3);
    assert.ok(l.grammarSlugs.includes(l.primarySlug));
    for (const s of l.grammarSlugs) assert.ok(GRAMMAR_SLUGS.includes(s), s);
    for (const t of l.practiceRule.topics) assert.ok(l.grammarSlugs.includes(t), t);
    assert.ok(l.practiceRule.typedMin >= 3);
  }
  // the three article lessons and sein/pronouns come before haben and the present tense
  const at = (slug) => PRIMARY_ORDER.indexOf(slug);
  for (const early of ['alphabet-pronunciation', 'verb-sein', 'personal-pronouns', 'nouns-gender', 'definite-articles', 'indefinite-articles']) {
    assert.ok(at(early) < at('verb-haben') && at(early) < at('present-tense-regular'), early);
  }
  for (const late of ['possessive-articles', 'separable-verbs-intro', 'yes-no-questions', 'time-and-dates']) {
    assert.ok(at(late) >= 6, `${late} belongs in the second half`);
  }
});

test('rule 4: Wortfeld size, articles and plurals, no word twice, ≥ 200 words, ≥ 70 % with wordId', () => {
  const seen = new Map();
  let withId = 0;
  let total = 0;
  for (const l of L) {
    assert.ok(l.wortfeld.length >= 15 && l.wortfeld.length <= 25, `Lektion ${l.nr}: ${l.wortfeld.length}`);
    const added = l.wortfeld.filter((w) => !w.wordId).length;
    assert.ok(added <= 5, `Lektion ${l.nr}: ${added} words outside the words table`);
    assert.ok((l.wortfeld.length - added) / l.wortfeld.length >= 0.7, `Lektion ${l.nr} wordId coverage`);
    for (const w of l.wortfeld) {
      total += 1;
      if (w.wordId) withId += 1;
      assert.ok(w.de && w.word && w.en);
      if (/^(der|die|das) /.test(w.de)) assert.ok(w.article, w.de);
      if (w.article) {
        assert.ok(['der', 'die', 'das'].includes(w.article));
        assert.ok(w.plural, `${w.de} needs a plural ('—' when there is none)`);
        assert.equal(w.de, `${w.article} ${w.word}`);
      }
      assert.ok(!seen.has(w.de), `"${w.de}" is in Lektion ${seen.get(w.de)} and ${l.nr}`);
      seen.set(w.de, l.nr);
    }
  }
  assert.ok(seen.size >= 200, `union is ${seen.size} words`);
  assert.ok(withId / total >= 0.7, `${withId}/${total} with wordId`);
});

test('rule 5: dialogues are 6–10 short lines between two named speakers', () => {
  for (const l of L) {
    assert.ok(l.dialog.title && l.dialog.setting);
    assert.ok(l.dialog.lines.length >= 6 && l.dialog.lines.length <= 10, `Lektion ${l.nr}`);
    assert.equal(new Set(l.dialog.lines.map((x) => x.speaker)).size, 2);
    for (const line of l.dialog.lines) {
      assert.ok(line.de && line.en);
      assert.ok(wordCount(line.de) <= 12, `Lektion ${l.nr}: "${line.de}"`);
    }
  }
});

test('rule 6: the Notice card is one point, ≤ 60 words, with two verbatim dialogue lines', () => {
  for (const l of L) {
    assert.equal(l.notice.ruleSlug, l.primarySlug);
    assert.ok(wordCount(l.notice.bodyDe) <= 60, `Lektion ${l.nr}: ${wordCount(l.notice.bodyDe)} words`);
    assert.doesNotMatch(l.notice.bodyDe, /[<>#]|\]\(/);
    assert.equal(l.notice.examples.length, 2);
    const lines = l.dialog.lines.map((x) => x.de);
    for (const ex of l.notice.examples) assert.ok(lines.includes(ex), ex);
  }
});

test('rule 7: pretest, Phonetik, Hören, Sprechen, Schreiben and the links', () => {
  const missions = new Set();
  const listenings = new Set();
  const readings = new Set();
  for (const l of L) {
    assert.ok(l.pretest.promptDe && l.pretest.promptEn && l.pretest.model && l.pretest.accepted.length);
    assert.equal(l.phonetik.items.length, 3);
    assert.equal(l.hoeren.kind, 'dictation');
    assert.equal(l.hoeren.lines.length, 2);
    assert.equal(l.sprechen.readAloud.length, 2);
    for (const i of [...l.hoeren.lines, ...l.sprechen.readAloud]) {
      assert.ok(Number.isInteger(i) && i >= 0 && i < l.dialog.lines.length, `Lektion ${l.nr}: index ${i}`);
    }
    const open = l.sprechen.open;
    assert.ok(open.teil.startsWith('Sprechen') && l.examTeile.includes(open.teil));
    assert.equal(open.hintWords.length, 3);
    if (open.missionOrder !== null) {
      assert.ok(open.missionOrder >= 1 && open.missionOrder <= 8);
      assert.ok(!missions.has(open.missionOrder), `mission ${open.missionOrder} linked twice`);
      missions.add(open.missionOrder);
    }
    const w = l.schreiben;
    assert.equal(w.kind, l.nr % 2 === 1 ? 'formular' : 'mitteilung');
    // The task the AI grader will mark. tests/writing-course.test.mjs pins the
    // bank side; here we only pin that the key exists and resolves.
    assert.equal(w.taskKey, `a11-l${String(l.nr).padStart(2, '0')}`);
    assert.ok(writingTaskByKey('goethe_a1', w.taskKey), `Lektion ${l.nr}: taskKey resolves to no bank task`);
    assert.equal(w.maxWords, 30);
    assert.ok(wordCount(w.sample) <= 30, `Lektion ${l.nr}: sample`);
    if (w.kind === 'formular') {
      assert.ok(w.fields.length >= 3 && w.fields.length <= 5);
      assert.equal(w.leitpunkte, undefined);
    } else {
      assert.equal(w.leitpunkte.length, 3);
      assert.equal(w.fields, undefined);
      assert.match(w.sample, /^(Hallo|Guten|Liebe|Lieber|Sehr)/);
      assert.match(w.sample, /(Grüße|Gruß|Tschüss|Bis bald|Bis morgen|Bis später)[^.]*$/);
    }
    if (l.links.listeningExercise !== null) {
      assert.ok(!listenings.has(l.links.listeningExercise));
      listenings.add(l.links.listeningExercise);
    }
    if (l.links.readingOrder !== null) {
      assert.ok(!readings.has(l.links.readingOrder));
      readings.add(l.links.readingOrder);
    }
  }
  assert.equal(missions.size, 8, 'all eight published A1.1 speaking missions are used');
});

test('rule 8: 15 minutes per Lektion, four checkpoints, hoursTotal derived and inside 50–60 h', () => {
  const engine = L.length * 15 + CURRICULUM_A11.checkpoints.length * 12 + L.length * 10;
  assert.equal(CURRICULUM_A11.hoursTotal, Math.round(engine / 60 + L.length * 4));
  assert.ok(CURRICULUM_A11.hoursTotal >= 50 && CURRICULUM_A11.hoursTotal <= 60);
  assert.deepEqual(CURRICULUM_A11.checkpoints.map((c) => c.afterLektion), [3, 6, 9, 12]);
  assert.equal(CURRICULUM_A11.testSlug, 'abschlusstest-a1-1');
  for (const k of ['canDo', 'wortliste', 'themen']) assert.ok(CURRICULUM_A11.provenance[k]);
});

test('rule 9: German copy, no outcome promise and no exam fee anywhere in the module', () => {
  const text = L.flatMap((l) => [
    l.title, l.situation, l.handlungsfeld, ...l.canDo, l.notice.bodyDe, l.dialog.setting,
    ...l.dialog.lines.map((x) => x.de), l.schreiben.taskDe, l.schreiben.sample,
  ]).join('\n');
  assert.doesNotMatch(text, /\b(the|your|please|thank)\b/i);
  assert.doesNotMatch(text, /garantie|garantiert|Erfolgsgarantie|100\s?%/i);
  assert.doesNotMatch(text, /Prüfungsgebühr|Anmeldegebühr/i);
});

test('the validator bites: each mutation of a good curriculum is caught', () => {
  const mutations = {
    'a word used in two Lektionen': (c) => { c.lektionen[4].wortfeld[0] = c.lektionen[3].wortfeld[0]; },
    'an English word in a dialogue': (c) => { c.lektionen[0].dialog.lines[0].de = 'Hello and welcome!'; },
    'an untaught content word': (c) => { c.lektionen[0].dialog.lines[0].de = 'Guten Tag, der Elefant!'; },
    'a 13-word line': (c) => { c.lektionen[0].dialog.lines[0].de = 'eins zwei drei vier fünf sechs sieben acht neun zehn elf zwölf dreizehn'; },
    'the primary structure missing': (c) => c.lektionen[1].dialog.lines.forEach((x) => { x.de = x.de.replace(/\b(bin|bist|ist|sind|seid)\b/gi, 'x'); }),
    'a Notice example that is not in the dialogue': (c) => { c.lektionen[0].notice.examples[0] = 'Hallo.'; },
    'a Notice card over 60 words': (c) => { c.lektionen[0].notice.bodyDe = Array(61).fill('Wort').join(' '); },
    'a speaking mission linked twice': (c) => { c.lektionen[6].sprechen.open.missionOrder = 1; },
    'a reading lesson linked twice': (c) => { c.lektionen[6].links.readingOrder = 1; },
    'a sixth word outside the words table': (c) => c.lektionen[0].wortfeld.forEach((w) => { w.wordId = null; }),
    'a Schreiben task that breaks the alternation': (c) => { c.lektionen[0].schreiben.kind = 'mitteilung'; },
    'a Schreiben taskKey that resolves to nothing': (c) => { c.lektionen[0].schreiben.taskKey = 'a11-l99'; },
    'a Schreiben taskKey pointing at another Lektion\'s task': (c) => { c.lektionen[0].schreiben.taskKey = 'a11-l03'; },
    'a practice topic outside grammarSlugs': (c) => { c.lektionen[0].practiceRule.topics = ['verb-haben']; },
    'a can-do that is not in ich-Form': (c) => { c.lektionen[0].canDo[0] = 'Du kannst dich vorstellen.'; },
    'a dictation index past the end of the dialogue': (c) => { c.lektionen[0].hoeren.lines = [0, 99]; },
    'hoursTotal that no longer follows from the minutes': (c) => { c.hoursTotal = 40; },
    'an exam Teil that is no longer rehearsed': (c) => { c.lektionen[11].examTeile = ['Lesen Teil 3']; },
  };
  for (const [name, mutate] of Object.entries(mutations)) {
    const c = clone();
    mutate(c);
    assert.ok(validateCurriculum(c).length > 0, `not caught: ${name}`);
  }
});
