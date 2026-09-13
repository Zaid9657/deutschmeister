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
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';
import { CURRICULA, ALL_CURRICULA, curriculumFor, anyCurriculumFor } from '../src/data/curricula/index.js';
import { writingTaskByKey, courseWritingTasks } from '../src/data/writingTasks.js';
import {
  validateCurriculum, GRAMMAR_SLUGS, EXAM_TEILE, PRIMARY_ORDER, SITUATION_KEYWORDS,
  wortfeldCoverage, itemLexis, loadExtraItems, canDoRehearsal, missionlessLektionen,
  MAX_UNCOVERED_WORTFELD, MAX_UNTAUGHT_ITEM_TOKENS, MAX_UNREHEARSED_CANDOS,
  MAX_MISSIONLESS_LEKTIONEN, LEVELS, levelSpec,
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
    // One range per Textsorte (DaF review #2 §B): the bank and evaluate-writing.mjs moved with it.
    assert.deepEqual([w.minWords, w.maxWords], w.kind === 'formular' ? [5, 40] : [25, 45], `Lektion ${l.nr}: word range`);
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

test('rule 10: a taught word is also a used word, under a ratchet that only falls', () => {
  // RULE 5 asks „is every word in the dialogue taught?“. RULE 10 is its mirror and the systemic ask
  // of DaF review #3: „is every taught word ever heard?“ — ≈50 of 262 Wortfeld entries occurred in
  // no dialogue line, notice, pretest, Schreiben task or hand-written item of their own Lektion, so
  // whole Handlungsfelder (L2 Personalien, L9 Café food) rested on a list.
  assert.ok(MAX_UNCOVERED_WORTFELD <= 19, 'the ratchet may only ever be lowered');
  const uncovered = wortfeldCoverage(CURRICULUM_A11);
  assert.ok(
    uncovered.length <= MAX_UNCOVERED_WORTFELD,
    `${uncovered.length} uncovered Wortfeld entries > ratchet ${MAX_UNCOVERED_WORTFELD}:\n  - ${uncovered.map((u) => `L${u.nr} ${u.de}`).join('\n  - ')}`,
  );
  // The Lektionen whose Wortfeld was repaired carry their own vocabulary now: L2/L7/L8/L9 in
  // round 4, L3 (Geschwister, Sohn, Tochter, Mann, Baby) and L6 (Kollege, Ingenieur, Verkäufer)
  // in round 5 — the two Handlungsfelder DaF review #4 named, Familie and Arbeit und Beruf.
  for (const nr of [2, 3, 6, 7, 8, 9]) {
    const left = uncovered.filter((u) => u.nr === nr).map((u) => u.de);
    assert.ok(left.length <= 1, `Lektion ${nr} still has unused Wortfeld words: ${left.join(', ')}`);
  }
});

test('rule 11: hand-written practice items use only words taught by their Lektion', () => {
  // The review's last paragraph: „die handgeschriebenen Reparaturen unterliegen keiner Prüfung“.
  // Same machinery as RULE 5 (formsOf, FUNCTION_WORDS, DIALOG_NAMES), run over a11.extra.json.
  assert.ok(MAX_UNTAUGHT_ITEM_TOKENS <= 9, 'the ratchet may only ever be lowered');
  const offenders = itemLexis(CURRICULUM_A11);
  assert.ok(
    offenders.length <= MAX_UNTAUGHT_ITEM_TOKENS,
    `${offenders.length} untaught tokens > ratchet ${MAX_UNTAUGHT_ITEM_TOKENS}:\n  - ${offenders.map((o) => `${o.id}: ${o.token}`).join('\n  - ')}`,
  );
  assert.ok(loadExtraItems().length > 0, 'the hand-written pool must actually be read');
});

test('rule 12: every can-do line is rehearsed in its own Lektion, under a ratchet that only falls', () => {
  // The can-do grid is rendered on the public course page, so an unrehearsed line is a promise to
  // someone who has not paid yet (DaF review #4, MAJOR 6). The two named there are closed:
  assert.ok(MAX_UNREHEARSED_CANDOS <= 6, 'the ratchet may only ever be lowered');
  const offenders = canDoRehearsal(CURRICULUM_A11);
  assert.ok(
    offenders.length <= MAX_UNREHEARSED_CANDOS,
    `${offenders.length} unrehearsed can-dos > ratchet ${MAX_UNREHEARSED_CANDOS}:\n  - ${offenders.map((o) => `L${o.nr} ${o.line}`).join('\n  - ')}`,
  );
  const lines = offenders.map((o) => o.line);
  assert.ok(!lines.includes('Ich kann mit zwei festen Ausdrücken sagen, was ich gestern gemacht habe.'), 'L11 Perfekt chunk');
  assert.ok(!L[1].canDo.includes('Ich kann ein einfaches Formular mit meinen Daten ausfüllen.'), 'the L2 Formular can-do lives in L1/L3, not here');
  assert.equal(L[10].pretest.model, 'Ich habe gearbeitet.');
});

test('rule 13: a speaking task without a mission is a prompt the speaking page never receives', () => {
  // SpeakingStage.jsx appends `&mission=` only when missionOrder is set; without it the learner
  // lands on the generic /speaking page with some other mission of the level. The UI agent is
  // making the prompt itself travel in saveCourseContext — then this ratchet goes to 0.
  assert.ok(MAX_MISSIONLESS_LEKTIONEN <= 4, 'the ratchet may only ever be lowered');
  const missionless = missionlessLektionen(CURRICULUM_A11);
  assert.ok(
    missionless.length <= MAX_MISSIONLESS_LEKTIONEN,
    `Lektionen without a speaking mission: ${missionless.join(', ')}`,
  );
  assert.deepEqual(missionless, [7, 10, 11, 12]);
});

// REGISTER (DaF review #4, MAJOR 2). One decision, enforced: the tasks and the chrome address the
// learner with Sie, the Notice cards speak impersonally („Beim Buchstabieren sagt man …“), and only
// the dialogue duzt — there Ana, Tim and Lena talk to each other. The one thing a Notice may still
// contain is a du-FORM as grammar content: a conjugation cell („du **bist**“, „du spiel**st**“) or
// a quoted chunk („**Hast du Zeit?**“). Both are marked in the data by the bold that makes them a
// form rather than an address, so the check strips exactly that and nothing else.
const strippedForRegister = (s) => String(s)
  .replace(/\bdu\s+\S*\*\*[^*]+\*\*/g, ' ')   // „du **bist**“, „du spiel**st**“ — a table cell
  .replace(/\*\*[^*]+\*\*/g, ' ');              // „**Hast du Zeit?**“ — a quoted chunk
const DUZEN = /\b(du|dir|dich|dein\w*|Schreib|Lerne|Tippe|Antworte|Frag|kannst)\b/;

test('register: notices, pretests, writing and speaking tasks siezen — only the dialogue duzt', () => {
  for (const l of L) {
    const fields = {
      'notice.bodyDe': l.notice.bodyDe,
      'pretest.promptDe': l.pretest.promptDe,
      'schreiben.taskDe': l.schreiben.taskDe,
      'sprechen.open.promptDe': l.sprechen.open.promptDe,
    };
    for (const [name, value] of Object.entries(fields)) {
      const m = DUZEN.exec(strippedForRegister(value));
      assert.equal(m, null, `Lektion ${l.nr} ${name} duzt ("${m && m[0]}"): ${value}`);
    }
  }
  // The whitelist is narrow on purpose: the bold marks a form, an unbolded „du hast“ is an address
  // and must not pass.
  assert.match(strippedForRegister('Mit haben sagst du Hunger.'), /\bdu\b/);
  assert.doesNotMatch(strippedForRegister('ich **bin**, du **bist**, er **ist**'), DUZEN);
  assert.doesNotMatch(strippedForRegister('**Hast du Zeit?** ist eine feste Wendung.'), DUZEN);
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

  // RULE 10: one more Wortfeld word that no input of its Lektion uses pushes the count over the
  // ratchet — which is the whole point of pinning the ratchet at the measured number.
  const c10 = clone();
  c10.lektionen[0].wortfeld.push({
    de: 'die Giraffe', word: 'Giraffe', article: 'die', plural: 'Giraffen', en: 'giraffe',
    wordId: '00000000-0000-0000-0000-000000000000',
  });
  assert.ok(validateCurriculum(c10).length > 0, 'not caught: a Wortfeld word no input of its Lektion uses');

  // RULE 11: a hand-written item that reaches for a word the course has not taught yet.
  const c11 = clone();
  const untaughtItem = {
    id: 'extra-a11-l01-99',
    questionDe: 'Der Elefant wohnt im Zoo. Ergänzen Sie: Der Elefant ___ groß.',
    answer: 'Elefant',
    accepted: ['Elefant'],
  };
  assert.ok(
    validateCurriculum(c11, [...loadExtraItems(), untaughtItem]).length > 0,
    'not caught: a hand-written item built from untaught words',
  );

  // RULE 12: can-do lines whose content words no exercise slot of their Lektion rehearses.
  // Enough of them to clear the ratchet's remaining slack whatever the current measurement is —
  // the pool files the measurement reads are edited by other agents, and a bite test that only
  // fires while the count happens to sit exactly on the ratchet is not a bite test.
  const c12 = clone();
  let toAdd = Math.max(1, MAX_UNREHEARSED_CANDOS - canDoRehearsal(CURRICULUM_A11).length + 1);
  for (const lektion of c12.lektionen) {
    if (toAdd <= 0) break;
    if (lektion.canDo.length >= 5) continue;               // RULE 2 caps a Lektion at five can-dos
    lektion.canDo.push('Ich kann einen Elefanten im Zoo beschreiben.');
    toAdd -= 1;
  }
  assert.equal(toAdd, 0, 'the fixture could not carry enough unrehearsed can-do lines');
  assert.ok(validateCurriculum(c12).length > 0, 'not caught: can-do lines nothing in their Lektion rehearses');

  // RULE 13: a fifth Lektion whose speaking prompt never reaches the speaking page.
  const c13 = clone();
  c13.lektionen[0].sprechen.open.missionOrder = null;
  assert.ok(validateCurriculum(c13).length > 0, 'not caught: a fifth speaking task without a mission');
});


// ───────────────────────────────────────────────────────────────────────────────────────────────
// EVERY REGISTERED LEVEL
//
// The block above pins A1.1 rule by rule, because A1.1 is the template and each of its numbers
// was argued for in a DaF review. From A1.2 on, the validator is driven by the per-level registry
// (`LEVELS` in scripts/validate-curriculum.mjs), so the loop below pins the SAME structural rules
// for every registered level, reading each level's tables from its own registry row. A level that
// is added to the registry is therefore tested the moment it is added — and an A1.1 number that
// silently changed would still fail its own test above.
// ───────────────────────────────────────────────────────────────────────────────────────────────

const LEVEL_KEYS = Object.keys(LEVELS);
const cloneOf = (c) => JSON.parse(JSON.stringify(c));

test('the registry, the curriculum index and the modules agree on which levels exist', () => {
  assert.deepEqual(LEVEL_KEYS.sort(), Object.keys(ALL_CURRICULA).sort());
  // Only A1.1 is LIVE: promoting a level into CURRICULA switches the paid course page to
  // the lesson engine, so it must wait for its pool, cards, items and a DaF sign-off.
  assert.deepEqual(Object.keys(CURRICULA), ['a1.1']);
  for (const key of LEVEL_KEYS) {
    assert.equal(LEVELS[key].curriculum, anyCurriculumFor(key), `${key}: registry and index disagree`);
    assert.equal(LEVELS[key].curriculum.level, key);
    assert.equal(LEVELS[key].curriculum.code, LEVELS[key].code);
  }
  // The two levels this suite knows by name, so a silent removal is caught too.
  assert.equal(curriculumFor('a1.1'), CURRICULUM_A11);
  assert.equal(curriculumFor('a1.2'), null, 'A1.2 is a draft — not live');
  assert.equal(anyCurriculumFor('a1.2'), CURRICULUM_A12);
});

for (const key of LEVEL_KEYS) {
  const spec = LEVELS[key];
  const C = spec.curriculum;
  const LL = C.lektionen;

  test(`${spec.code}: passes scripts/validate-curriculum.mjs`, () => {
    const errors = validateCurriculum(C);
    assert.deepEqual(errors, [], `\n  - ${errors.join('\n  - ')}`);
  });

  test(`${spec.code}: 12 Lektionen, contract ids, unique kebab-case slugs, 15 minutes each`, () => {
    assert.equal(LL.length, 12);
    LL.forEach((l, i) => {
      assert.equal(l.nr, i + 1);
      assert.equal(l.id, `${spec.level}-l${String(i + 1).padStart(2, '0')}`);
      assert.match(l.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
      assert.equal(l.minutes, 15);
    });
    assert.equal(new Set(LL.map((l) => l.slug)).size, 12);
    assert.deepEqual(C.checkpoints.map((c) => c.afterLektion), [3, 6, 9, 12]);
    const engine = LL.length * 15 + C.checkpoints.length * 12 + LL.length * 10;
    assert.equal(C.hoursTotal, Math.round(engine / 60 + LL.length * 4));
    assert.ok(C.hoursTotal >= 50 && C.hoursTotal <= 60);
  });

  test(`${spec.code}: the 12 situations of the standard, in order, with can-dos and exam Teile`, () => {
    assert.equal(spec.situationKeywords.length, 12);
    LL.forEach((l, i) => {
      for (const kw of spec.situationKeywords[i]) assert.ok(l.situation.includes(kw), `L${l.nr}: "${kw}"`);
      assert.ok(l.handlungsfeld.length > 0);
      assert.ok(l.canDo.length >= 3 && l.canDo.length <= 5);
      for (const c of l.canDo) assert.match(c, /^Ich kann .+\.$/);
      for (const t of l.examTeile) assert.ok(EXAM_TEILE.includes(t), t);
    });
    const seen = new Set(LL.flatMap((l) => l.examTeile));
    assert.deepEqual([...EXAM_TEILE].filter((t) => !seen.has(t)), [], 'every one of the 11 SD1 Teile is rehearsed');
  });

  test(`${spec.code}: every grammar slug of the level is primary exactly once, in the taught order`, () => {
    assert.deepEqual(LL.map((l) => l.primarySlug), spec.primaryOrder);
    assert.deepEqual([...spec.primaryOrder].sort(), [...spec.grammarSlugs].sort());
    for (const l of LL) {
      assert.ok(l.grammarSlugs.length >= 1 && l.grammarSlugs.length <= 3);
      assert.ok(l.grammarSlugs.includes(l.primarySlug));
      for (const g of l.grammarSlugs) assert.ok(spec.grammarSlugs.includes(g), g);
      for (const t of l.practiceRule.topics) assert.ok(l.grammarSlugs.includes(t), t);
      assert.ok(l.practiceRule.typedMin >= 3);
    }
  });

  test(`${spec.code}: Wortfeld size, articles, plurals, no word twice, wordId coverage`, () => {
    const seen = new Map();
    let withId = 0;
    let total = 0;
    for (const l of LL) {
      assert.ok(l.wortfeld.length >= 15 && l.wortfeld.length <= 25, `L${l.nr}: ${l.wortfeld.length}`);
      const added = l.wortfeld.filter((w) => !w.wordId).length;
      assert.ok(added <= 5, `L${l.nr}: ${added} words outside the words table`);
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
    assert.ok(seen.size >= spec.minUnionWords, `union is ${seen.size}, expected >= ${spec.minUnionWords}`);
    assert.ok(withId / total >= 0.7, `${withId}/${total} with wordId`);
  });

  test(`${spec.code}: dialogues are 6–10 short lines between two named speakers`, () => {
    for (const l of LL) {
      assert.ok(l.dialog.title && l.dialog.setting);
      assert.ok(l.dialog.lines.length >= 6 && l.dialog.lines.length <= 10, `L${l.nr}`);
      assert.equal(new Set(l.dialog.lines.map((x) => x.speaker)).size, 2);
      for (const line of l.dialog.lines) {
        assert.ok(line.de && line.en);
        assert.ok(wordCount(line.de) <= 12, `L${l.nr}: "${line.de}"`);
      }
    }
  });

  test(`${spec.code}: the Notice card is one point, <= 60 words, with two verbatim dialogue lines`, () => {
    for (const l of LL) {
      assert.equal(l.notice.ruleSlug, l.primarySlug);
      assert.ok(wordCount(l.notice.bodyDe) <= 60, `L${l.nr}: ${wordCount(l.notice.bodyDe)} words`);
      assert.doesNotMatch(l.notice.bodyDe, /[<>#]|\]\(/);
      assert.equal(l.notice.examples.length, 2);
      const lines = l.dialog.lines.map((x) => x.de);
      for (const ex of l.notice.examples) assert.ok(lines.includes(ex), ex);
    }
  });

  test(`${spec.code}: pretest, Phonetik, Hören, Sprechen, Schreiben and the links`, () => {
    const missions = new Set();
    const listenings = new Set();
    const readings = new Set();
    for (const l of LL) {
      assert.ok(l.pretest.promptDe && l.pretest.promptEn && l.pretest.model && l.pretest.accepted.length);
      assert.equal(l.phonetik.items.length, 3);
      assert.equal(l.hoeren.kind, 'dictation');
      assert.equal(l.hoeren.lines.length, 2);
      assert.equal(l.sprechen.readAloud.length, 2);
      for (const i of [...l.hoeren.lines, ...l.sprechen.readAloud]) {
        assert.ok(Number.isInteger(i) && i >= 0 && i < l.dialog.lines.length, `L${l.nr}: index ${i}`);
      }
      const open = l.sprechen.open;
      assert.ok(open.teil.startsWith('Sprechen') && l.examTeile.includes(open.teil));
      assert.equal(open.hintWords.length, 3);
      if (open.missionOrder !== null) {
        assert.ok(open.missionOrder >= 1 && open.missionOrder <= spec.missionCount);
        assert.ok(!missions.has(open.missionOrder), `mission ${open.missionOrder} linked twice`);
        missions.add(open.missionOrder);
      }
      const w = l.schreiben;
      assert.equal(w.kind, l.nr % 2 === 1 ? 'formular' : 'mitteilung');
      assert.equal(w.taskKey, `${spec.taskKeyPrefix}-l${String(l.nr).padStart(2, '0')}`);
      assert.deepEqual([w.minWords, w.maxWords], w.kind === 'formular' ? [5, 40] : [25, 45], `L${l.nr}: word range`);
      assert.ok(wordCount(w.sample) <= 30, `L${l.nr}: sample`);
      if (w.kind === 'formular') {
        assert.ok(w.fields.length >= 3 && w.fields.length <= 5);
        assert.equal(w.leitpunkte, undefined);
      } else {
        assert.equal(w.leitpunkte.length, 3);
        assert.equal(w.fields, undefined);
        assert.match(w.sample, /^(Hallo|Guten|Liebe|Lieber|Sehr)/);
        assert.match(w.sample, /(Grüße|Gruß|Tschüss|Bis bald|Bis morgen|Bis später)[^.]*$/);
      }
      for (const [value, set, max] of [
        [l.links.listeningExercise, listenings, spec.listeningCount],
        [l.links.readingOrder, readings, spec.readingCount],
      ]) {
        if (value === null) continue;
        assert.ok(Number.isInteger(value) && value >= 1 && value <= max, `L${l.nr}: link ${value} out of range`);
        assert.ok(!set.has(value), `L${l.nr}: link ${value} used twice`);
        set.add(value);
      }
    }
  });

  test(`${spec.code}: every Lektion's schreiben task resolves to its own bank entry`, () => {
    const bank = courseWritingTasks(spec.level);
    assert.equal(bank.length, 12, `the ${spec.code} course bank holds twelve tasks`);
    assert.deepEqual(bank.map((t) => t.taskKey), LL.map((l) => l.schreiben.taskKey));
    for (const l of LL) {
      const task = writingTaskByKey(C.examKey, l.schreiben.taskKey);
      assert.ok(task, `L${l.nr}: ${l.schreiben.taskKey} resolves to nothing`);
      assert.equal(task.course, spec.level);
      assert.equal(task.task, l.schreiben.taskDe, `L${l.nr}: bank prompt differs from taskDe`);
      assert.equal(task.title, `Lektion ${l.nr}: ${l.title}`, `L${l.nr}: bank title drifted from the Lektion title`);
      assert.equal(task.minWords, l.schreiben.minWords);
      assert.equal(task.maxWords, l.schreiben.maxWords);
      const points = l.schreiben.kind === 'formular' ? l.schreiben.fields : l.schreiben.leitpunkte;
      assert.deepEqual(task.leitpunkte, points, `L${l.nr}: bank Leitpunkte differ from the Lektion`);
      if (l.schreiben.kind === 'formular') assert.equal(task.register, 'formular');
      else assert.ok(['informell', 'formell'].includes(task.register), task.register);
    }
  });

  test(`${spec.code}: German copy, no outcome promise and no exam fee anywhere in the module`, () => {
    const text = LL.flatMap((l) => [
      l.title, l.situation, l.handlungsfeld, ...l.canDo, l.notice.bodyDe, l.dialog.setting,
      ...l.dialog.lines.map((x) => x.de), l.schreiben.taskDe, l.schreiben.sample,
    ]).join('\n');
    assert.doesNotMatch(text, /\b(the|your|please|thank)\b/i);
    assert.doesNotMatch(text, /garantie|garantiert|Erfolgsgarantie|100\s?%/i);
    assert.doesNotMatch(text, /Prüfungsgebühr|Anmeldegebühr/i);
  });

  test(`${spec.code}: notices, pretests, writing and speaking tasks siezen — only the dialogue duzt`, () => {
    for (const l of LL) {
      const fields = {
        'notice.bodyDe': l.notice.bodyDe,
        'pretest.promptDe': l.pretest.promptDe,
        'schreiben.taskDe': l.schreiben.taskDe,
        'sprechen.open.promptDe': l.sprechen.open.promptDe,
      };
      for (const [name, value] of Object.entries(fields)) {
        const m = DUZEN.exec(strippedForRegister(value));
        assert.equal(m, null, `Lektion ${l.nr} ${name} duzt ("${m && m[0]}"): ${value}`);
      }
    }
  });

  test(`${spec.code}: the four ratchets hold at the numbers measured for this level`, () => {
    const r = spec.ratchets;
    assert.ok(wortfeldCoverage(C).length <= r.uncoveredWortfeld, 'RULE 10');
    assert.ok(itemLexis(C).length <= r.untaughtItemTokens, 'RULE 11');
    assert.ok(canDoRehearsal(C).length <= r.unrehearsedCanDos, 'RULE 12');
    assert.ok(missionlessLektionen(C).length <= r.missionlessLektionen, 'RULE 13');
  });

  test(`${spec.code}: the validator bites for this level`, () => {
    const mutations = {
      'a word used in two Lektionen': (c) => { c.lektionen[4].wortfeld[0] = c.lektionen[3].wortfeld[0]; },
      'an English word in a dialogue': (c) => { c.lektionen[0].dialog.lines[0].de = 'Hello and welcome!'; },
      'an untaught content word': (c) => { c.lektionen[0].dialog.lines[0].de = 'Guten Tag, der Elefant!'; },
      'a 13-word line': (c) => { c.lektionen[0].dialog.lines[0].de = 'eins zwei drei vier fünf sechs sieben acht neun zehn elf zwölf dreizehn'; },
      'a Notice example that is not in the dialogue': (c) => { c.lektionen[0].notice.examples[0] = 'Hallo.'; },
      'a Notice card over 60 words': (c) => { c.lektionen[0].notice.bodyDe = Array(61).fill('Wort').join(' '); },
      'a taskKey that points at another Lektion': (c) => { c.lektionen[0].schreiben.taskKey = `${spec.taskKeyPrefix}-l03`; },
      'a practice topic outside grammarSlugs': (c) => { c.lektionen[0].practiceRule.topics = ['no-such-slug']; },
      'a can-do that is not in ich-Form': (c) => { c.lektionen[0].canDo[0] = 'Du kannst dich vorstellen.'; },
      'a dictation index past the end of the dialogue': (c) => { c.lektionen[0].hoeren.lines = [0, 99]; },
      'hoursTotal that no longer follows from the minutes': (c) => { c.hoursTotal = 40; },
      'a Schreiben task that breaks the alternation': (c) => { c.lektionen[0].schreiben.kind = 'mitteilung'; },
      'the primary slug order scrambled': (c) => {
        const [a, b] = [c.lektionen[0].primarySlug, c.lektionen[1].primarySlug];
        c.lektionen[0].primarySlug = b;
        c.lektionen[1].primarySlug = a;
      },
      'a Wortfeld word no input of its Lektion uses': (c) => {
        c.lektionen[0].wortfeld.push({
          de: 'die Giraffe', word: 'Giraffe', article: 'die', plural: 'Giraffen', en: 'giraffe',
          wordId: '00000000-0000-0000-0000-000000000000',
        });
      },
    };
    for (const [name, mutate] of Object.entries(mutations)) {
      const c = cloneOf(C);
      mutate(c);
      assert.ok(validateCurriculum(c).length > 0, `${spec.code}: not caught: ${name}`);
    }
  });
}

test('A1.2 is a second half-level, not a repeat: no Wortfeld entry is taught twice', () => {
  // The cumulative rule the validator seeds RULE 5 and RULE 11 with: A1.2 dialogues may USE every
  // A1.1 word, but A1.2's own Wortfeld must add new lexis — otherwise the running word counter on
  // the public syllabus page („+201 → 463/650") counts the same word twice.
  const a11 = new Set(CURRICULUM_A11.lektionen.flatMap((l) => l.wortfeld.map((w) => w.word)));
  const repeats = CURRICULUM_A12.lektionen
    .flatMap((l) => l.wortfeld.filter((w) => a11.has(w.word)).map((w) => `L${l.nr} ${w.de}`));
  assert.deepEqual(repeats, [], `A1.2 repeats A1.1 vocabulary: ${repeats.join(', ')}`);
});

test('A1.2 ratchets are the measured numbers, and RULE 10–12 are already at zero', () => {
  // Measured on the module at hand-over, not chosen: the A1.1 debt came from a pool that predated
  // the curriculum; A1.2 was authored against the rules, so three of the four start closed and may
  // never be raised. RULE 13 is 3 because A1.2 carries twelve speaking missions and three
  // Lektionen (Hotel/Reklamation, Kleidung, Wetter) have no mission that fits their situation.
  const r = levelSpec('a1.2').ratchets;
  assert.equal(r.uncoveredWortfeld, 0);
  assert.equal(r.untaughtItemTokens, 0);
  assert.equal(r.unrehearsedCanDos, 0);
  assert.ok(r.missionlessLektionen <= 3, 'the ratchet may only ever be lowered');
  assert.deepEqual(missionlessLektionen(CURRICULUM_A12), [4, 10, 11]);
});
