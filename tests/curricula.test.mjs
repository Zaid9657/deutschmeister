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
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';
import { CURRICULA, ALL_CURRICULA, curriculumFor, anyCurriculumFor } from '../src/data/curricula/index.js';
import { writingTaskByKey, courseWritingTasks } from '../src/data/writingTasks.js';
import {
  validateCurriculum, GRAMMAR_SLUGS, EXAM_TEILE, PRIMARY_ORDER, SITUATION_KEYWORDS,
  wortfeldCoverage, itemLexis, drawnLexis, drawnAssignment, loadExtraItems, loadPoolItems,
  canDoRehearsal, missionlessLektionen,
  personaConsistency, PERSONAS_A11, PERSONAS_A12, PERSONA_TABLES,
  noticeFormCoverage, producedBeforeTaught, constructionsBeforeTaught, examTeileBacked,
  MAX_UNCOVERED_WORTFELD, MAX_UNTAUGHT_ITEM_TOKENS, MAX_UNTAUGHT_DRAWN_TOKENS,
  MAX_MISSIONLESS_LEKTIONEN, MAX_UNEXEMPLIFIED_NOTICE_FORMS, MAX_UNTAUGHT_IN_PRODUCTION,
  MAX_DEFERRED_CONSTRUCTIONS,
  MAX_UNBACKED_EXAM_TEILE, LEVELS, levelSpec, levelLexicon, untaughtTokens,
  modelTextsPassOwnChecklist, sharedProductionLines, modelTextsMatchDialogue, formularSampleValues,
  MAX_MODEL_CHECKLIST_BREAKS, MAX_SHARED_PRODUCTION_LINES,
  modelTextLexis, MAX_UNTAUGHT_IN_MODEL_TEXTS, LICENSED_LETTER_CHUNKS,
  writingTasksAreAnswerable, MAX_UNANSWERABLE_LEITPUNKTE,
  formSpeakInModelTexts, MAX_FORM_SPEAK_SENTENCES,
  wortfeldInputCoverage, MAX_WORTFELD_WITHOUT_INPUT,
} from '../scripts/validate-curriculum.mjs';
import { constructionHits, CONSTRUCTION_PATTERNS, SEPARABLE_PREFIXES } from '../src/data/curricula/constructions.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ───────────────────────────────────────────────────────────────────────────────────────────────
// SELF-SIZING RATCHET MUTATIONS
//
// A bite test for a ratcheted rule must not depend on the measurement happening to sit exactly on
// the ratchet. The pool files and the curriculum are edited between rounds — round 6 lowered the
// real counts under their ceilings and both „the validator bites“ tests went green on a mutation
// that no longer bit, which is the failure mode a bite test exists to prevent. So every mutation
// below asks the measurement first and mutates `ratchet − measured + 1` times, which crosses the
// ratchet wherever the measurement currently stands; and the assertion names the rule, so an error
// from some other rule cannot make a dead bite test look alive.
// ───────────────────────────────────────────────────────────────────────────────────────────────
const overshoot = (measured, ratchet) => Math.max(1, ratchet - measured + 1);
const failsWith = (errors, rule) => errors.some((e) => e.startsWith(`RULE ${rule}:`));

/** n Wortfeld entries no input of their Lektion can possibly use (RULE 10). */
function addUnusedWortfeld(c, n) {
  let added = 0;
  for (const l of c.lektionen) {
    // RULE 4 caps a Lektion at 25 entries; overflowing it would fail the validator for the wrong
    // reason and hide whether RULE 10 bit at all.
    while (added < n && l.wortfeld.length < 25) {
      added += 1;
      l.wortfeld.push({
        de: `die Giraffe ${added}`, word: `Giraffe ${added}`, article: 'die',
        plural: `Giraffen ${added}`, en: 'giraffe',
        wordId: `00000000-0000-0000-0000-0000000000${String(added).padStart(2, '0')}`,
      });
    }
  }
  return added;
}

/** n hand-written items built from a word the course never teaches (RULE 11). */
const untaughtItems = (n, prefix) => Array.from({ length: n }, (_, i) => ({
  id: `extra-${prefix}-l01-9${i}`,
  questionDe: 'Der Elefant wohnt im Zoo. Ergänzen Sie: Der Elefant ___ groß.',
  answer: 'Elefant',
  accepted: ['Elefant'],
}));

/**
 * n items the learner is actually SERVED, each carrying a word the course never teaches (RULE 11b).
 *
 * The plant goes into `accepted`, which RULE 11b scans and the draw does not read at all —
 * `relevanceScore`, `itemLemmas` and `answerKey` in `buildLesson.js` all run on questionDe + answer
 * — so a planted item stays exactly where it was drawn. That is an assumption, not a guarantee, so
 * the fixture re-asks `drawnAssignment` afterwards and returns how many of the planted items are
 * still served: a plant that fell out of the draw then fails the bite test by name instead of
 * quietly making a dead bite test look alive.
 */
function plantInDrawnItems(c, extraItems, poolItems, n) {
  // The same universe `drawnLexis` builds: the BUILT item wins over its hand-written source, so the
  // plant has to go into the object the validator will actually read.
  const byId = new Map();
  for (const it of [...extraItems, ...poolItems]) byId.set(it.id, it);
  const items = [...byId.values()];
  const planted = [];
  for (const id of drawnAssignment(c, items).keys()) {
    if (planted.length >= n) break;
    // „Zebra“ is in no Wortfeld, no dialogue and no Notice card of either level.
    byId.get(id).accepted = [...(byId.get(id).accepted || []), 'Zebra'];
    planted.push(id);
  }
  const after = drawnAssignment(c, items);
  return planted.filter((id) => after.has(id)).length;
}

/** n can-do lines whose content words no exercise slot of their Lektion rehearses (RULE 12). */
function addUnrehearsedCanDos(c, n) {
  let added = 0;
  for (const l of c.lektionen) {
    if (added >= n) break;
    if (l.canDo.length >= 5) continue;                  // RULE 2 caps a Lektion at five can-dos
    l.canDo.push('Ich kann einen Elefanten im Zoo beschreiben.');
    added += 1;
  }
  return added;
}

/** n more Lektionen whose speaking prompt never reaches the speaking page (RULE 13). */
function dropMissions(c, n) {
  let dropped = 0;
  for (const l of c.lektionen) {
    if (dropped >= n) break;
    if (l.sprechen?.open?.missionOrder === null || l.sprechen?.open?.missionOrder === undefined) continue;
    l.sprechen.open.missionOrder = null;
    dropped += 1;
  }
  return dropped;
}

/** n more bolded Notice forms no input of their Lektion shows (RULE 6b). */
function addUnexemplifiedNoticeForms(c, n) {
  let added = 0;
  while (added < n) {
    for (const l of c.lektionen) {
      if (added >= n) break;
      // „Giraffe“ is in no Wortfeld, no dialogue and no writing sample of either course, and the
      // bold stands on its own so it is read as a FORM rather than as an ending.
      l.notice.bodyDe += ' **Giraffe**';
      added += 1;
    }
  }
  return added;
}

/**
 * A form the level teaches in a LATE Lektion, lifted verbatim out of that Lektion's own dialogue —
 * so the mutation below plants a real Vorgriff rather than a string the rule was written around.
 */
function lateFormSample(c, spec) {
  for (let i = c.lektionen.length - 1; i >= 1; i -= 1) {
    const l = c.lektionen[i];
    const re = (spec.offLimitsForms || {})[l.primarySlug];
    if (!re) continue;
    for (const line of l.dialog.lines) {
      const hit = (line.de.match(new RegExp(re.source, re.flags)) || [])[0];
      if (hit) return String(hit).trim();
    }
  }
  return null;
}

/** n occurrences of a late form in the FIRST Lektion's dictation line (RULE 15). */
function addProducedVorgriffe(c, spec, n) {
  const sample = lateFormSample(c, spec);
  if (!sample) return 0;
  const l = c.lektionen[0];
  const idx = l.hoeren.lines[0];
  l.dialog.lines[idx].de += ` ${Array.from({ length: n }, () => sample).join(' ')}`;
  return n;
}

/**
 * n more examTeile claims for which their own Lektion has no surface (RULE 16).
 *
 * Only the Lesen family can be stripped, and that is a property of the schema, not a shortcut:
 * every Lektion is hard-gated to exactly two `hoeren.lines`, a `sprechen.readAloud` and a
 * `schreiben.taskKey`, so a Hören, Sprechen or Schreiben claim always has a surface — pulling
 * `links.listeningExercise` (what this mutation used to do) no longer removes one, which is
 * exactly the measurement artefact DaF review #7, MAJOR 3 is about. A reading surface is the link
 * alone, so nulling `links.readingOrder` on a Lektion that claims a Lesen Teil removes it for real.
 * Six Lektionen per level are in that state, far above any overshoot the ratchets can ask for.
 */
function unbackExamTeile(c, n) {
  let done = 0;
  for (const l of c.lektionen) {
    if (done >= n) break;
    if (l.examTeile.some((t) => t.startsWith('Lesen')) && l.links.readingOrder !== null && l.links.readingOrder !== undefined) {
      l.links.readingOrder = null;
      done += 1;
    }
  }
  return done;
}

/** Pool topics A1.1 may draw without them being grammar slugs — no rule card, never primary. */
const PRACTICE_ONLY_A11 = levelSpec('a1.1').practiceOnlyTopics || [];

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
    // A practice topic is either one of the twelve grammar slugs of the Lektion or a declared
    // practice-only topic of the level — a pool topic with no rule card that is never primary
    // („numbers“, the L2 Zahlwort items). Anything else is a typo or a mislabelled item.
    for (const t of l.practiceRule.topics) {
      assert.ok(l.grammarSlugs.includes(t) || PRACTICE_ONLY_A11.includes(t), t);
    }
    assert.ok(l.practiceRule.typedMin >= 3);
  }
  // „Practice-only“ has to mean what it says, or it becomes a back door into RULE 3: a topic on
  // that list may not be a grammar slug, may never be primary, and has to be drawn by someone.
  for (const t of PRACTICE_ONLY_A11) {
    assert.ok(!GRAMMAR_SLUGS.includes(t), `${t} is a grammar slug and needs no exemption`);
    assert.ok(!PRIMARY_ORDER.includes(t), `${t} is a primarySlug`);
    assert.ok(L.some((l) => l.practiceRule.topics.includes(t)), `${t} is drawn by no Lektion`);
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
    // The sample's LENGTH is RULE 17's business and RULE 17 reads the window off the bank (see
    // „rule 17: every Beispieltext passes the form checklist“ below). The `<= 30` that used to
    // stand here was a third number beside the bank's two, and it contradicted them: 25–45 is
    // the window the learner is graded against (DaF review #12, MAJOR 1).
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
  assert.ok(MAX_UNCOVERED_WORTFELD <= 18, 'the ratchet may only ever be lowered');
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

test('rule 11: the practice items the learner is served use only words taught by their Lektion', () => {
  // The review's last paragraph: „die handgeschriebenen Reparaturen unterliegen keiner Prüfung“.
  // Same machinery as RULE 5 (formsOf, FUNCTION_WORDS, DIALOG_NAMES) — and since DaF review #5
  // (MAJOR 5) run over the BUILT pool as well as a11.extra.json, with generated items assigned to
  // the earliest Lektion whose practiceRule lists their topic. That is what took the number from 9
  // (124 of 351 items) to 187 (all of them).
  assert.ok(MAX_UNTAUGHT_ITEM_TOKENS <= 187, 'the ratchet may only ever be lowered');
  const offenders = itemLexis(CURRICULUM_A11);
  assert.ok(
    offenders.length <= MAX_UNTAUGHT_ITEM_TOKENS,
    `${offenders.length} untaught tokens > ratchet ${MAX_UNTAUGHT_ITEM_TOKENS}:\n  - ${offenders.map((o) => `${o.id}: ${o.token}`).join('\n  - ')}`,
  );
  assert.ok(loadExtraItems().length > 0, 'the hand-written pool must actually be read');
  assert.ok(loadPoolItems().length > loadExtraItems().length, 'the BUILT pool must actually be read');
  // The generated half is in scope now: every item of the built pool that carries a topic one of
  // the twelve Lektionen practises is judged, not only the ones with an extra-a11-lNN- id.
  const topics = new Set(L.flatMap((l) => l.practiceRule.topics));
  const generated = loadPoolItems().filter((it) => !/^extra-/.test(it.id) && topics.has(it.topic));
  // 227 before the build-time untaught-lexis gate (REVIEW #6 MAJOR 4), 149 after it: 78 legacy bank
  // items were built on words A1.1 teaches nowhere and no longer ship. The bound is a shape check —
  // „the generated half is still in scope“ — so it follows the artefact down rather than pinning a
  // number the gate is supposed to move.
  assert.ok(generated.length > 120, `${generated.length} generated items reach a Lektion`);
});

test('rule 11b: the items the learner is SERVED use only words taught by the Lektion that serves them', () => {
  // DaF review #6, MAJOR 5: RULE 11 measures every item of the pool at the EARLIEST Lektion whose
  // practiceRule names its topic — neither where the item is drawn nor anything a repair round can
  // move — so its number mixes tokens a learner reads with tokens in items no draw ever reaches,
  // and repairing all of the former barely moves it. RULE 11b runs the same token machinery over
  // the real draw: planPractice() attempts 1 and 2, plus the pool items buildCheckpoint() pulls
  // into a checkpoint, met at that checkpoint's chapter Lektion.
  //
  // ROUND 10 TURNED IT INTO A HARD RULE. The ratchet was 4 and commit 217c958 (fresh draw per
  // attempt) took the measurement to 13 overnight — proof that a number repaired item by item is
  // re-rolled by every change to the draw. The pool now stamps each item with `minLektion` (the
  // first Lektion by which all of its words are taught) and `pickPracticeItems` refuses to draw
  // above it, so this is 0 BY CONSTRUCTION. A non-zero reading means the stamp and the filter have
  // come apart — rebuild the pool — not that a repair round is owed.
  assert.equal(MAX_UNTAUGHT_DRAWN_TOKENS, 0, 'RULE 11b is a hard rule at A1.1 — no ratchet');
  const offenders = drawnLexis(CURRICULUM_A11);
  assert.deepEqual(
    offenders.map((o) => `L${o.nr} ${o.id}: ${o.token}`), [],
    `${offenders.length} untaught tokens in served items (hard rule, no ratchet)`,
  );
  // Every offender names the Lektion the learner meets it in, so the list is a work order.
  for (const o of offenders) assert.ok(o.nr >= 1 && o.nr <= 12 && o.id && o.token, JSON.stringify(o));
  // The rule exists because it measures FEWER items than RULE 11 and different ones: a drawn item
  // is judged where it is served, so RULE 11's two measurement artefacts (an item charged to L1 and
  // only ever drawn in L2) cannot appear here.
  assert.ok(offenders.length < itemLexis(CURRICULUM_A11).length, 'RULE 11b must be the narrower cut');
  const drawn = drawnAssignment(CURRICULUM_A11, [...loadExtraItems(), ...loadPoolItems()]);
  assert.ok(drawn.size > 80, `${drawn.size} items are actually served`);
  assert.ok(drawn.size < loadPoolItems().length, 'the draw must be a subset of the pool');
  // A practice-only topic is assigned like any other — through practiceRule.topics — so the L2
  // Zahlwort items are judged against L2's vocabulary and not against L1's.
  const numberItems = loadPoolItems().filter((it) => PRACTICE_ONLY_A11.includes(it.topic));
  assert.ok(numberItems.length > 0, 'the practice-only topics must actually be in the pool');
  for (const it of numberItems) {
    if (drawn.has(it.id)) assert.ok(drawn.get(it.id) >= 2, `${it.id} is served before Lektion 2`);
  }
});

test('rule 12: every can-do line is rehearsed in its own Lektion — hard rule, no ratchet', () => {
  // The can-do grid is rendered on the public course page, so an unrehearsed line is a promise to
  // someone who has not paid yet (DaF review #4, MAJOR 6). The two named there are closed, and DaF
  // review #8 (MAJOR 4) removed the ratchet entirely once the measurement reached 0: a can-do line
  // may never again go unrehearsed silently.
  const offenders = canDoRehearsal(CURRICULUM_A11);
  assert.equal(
    offenders.length, 0,
    `${offenders.length} unrehearsed can-dos (hard rule, no ratchet):\n  - ${offenders.map((o) => `L${o.nr} ${o.line}`).join('\n  - ')}`,
  );
  const lines = offenders.map((o) => o.line);
  assert.ok(!lines.includes('Ich kann mit zwei festen Ausdrücken sagen, was ich gestern gemacht habe.'), 'L11 Perfekt chunk');
  // DaF review #7, MAJOR 4: the last can-do of the course — L12's farewell and good wish — sat in
  // dialogue line 9, outside both production surfaces, and the learner met it once, silently.
  assert.ok(!lines.includes('Ich kann mich verabschieden und gute Wünsche aussprechen.'), 'L12 gute Wünsche');
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

test('A1.1: every ratchet equals its measurement — a ratchet with slack is not a rule', () => {
  // DaF review #8, MAJOR 4: RULE 10 (18 vs. 14 measured), RULE 11b (5 vs. 4) and RULE 12 (2 vs. 0)
  // had drifted above what `node scripts/validate-curriculum.mjs a1.1` prints, and their doc
  // comments quoted numbers the script no longer produces — so two Kann-Beschreibungen could go
  // unrehearsed again with nothing in CI saying so, which is exactly what had started happening to
  // L12's farewell can-do between rounds 7 and 8. This makes that drift machine-checked instead of
  // something a reviewer has to notice by re-running the script and subtracting: for every ratchet
  // the validator holds, measured must equal the ratchet exactly. RULE 12 is exempt because DaF
  // review #8's fix turned it into a hard rule with no ratchet at all (see the test above and
  // validate-curriculum.mjs) — there is no constant left here that could drift. RULE 11b left this
  // walk in round 10 for the same reason: the `minLektion` filter in the draw makes it 0 by
  // construction, so it is pinned at 0 in its own test above rather than tracked as a ratchet.
  const checks = [
    ['10', wortfeldCoverage(CURRICULUM_A11).length, MAX_UNCOVERED_WORTFELD],
    ['11', itemLexis(CURRICULUM_A11).length, MAX_UNTAUGHT_ITEM_TOKENS],
    ['13', missionlessLektionen(CURRICULUM_A11).length, MAX_MISSIONLESS_LEKTIONEN],
    ['6b', noticeFormCoverage(CURRICULUM_A11).length, MAX_UNEXEMPLIFIED_NOTICE_FORMS],
    ['15', producedBeforeTaught(CURRICULUM_A11).length, MAX_UNTAUGHT_IN_PRODUCTION],
    ['15b', constructionsBeforeTaught(CURRICULUM_A11).length, MAX_DEFERRED_CONSTRUCTIONS],
    ['16', examTeileBacked(CURRICULUM_A11).length, MAX_UNBACKED_EXAM_TEILE],
    ['17', modelTextsPassOwnChecklist(CURRICULUM_A11).length, MAX_MODEL_CHECKLIST_BREAKS],
    ['18', sharedProductionLines(CURRICULUM_A11).length, MAX_SHARED_PRODUCTION_LINES],
    // RULE 23 joins the walk in round 16: it is the only ratchet of this round and the number is a
    // work order (58 of 264 A1.1 Wortfeld entries reach no input surface of their Lektion).
    ['23', wortfeldInputCoverage(CURRICULUM_A11).length, MAX_WORTFELD_WITHOUT_INPUT],
  ];
  for (const [rule, measured, ratchet] of checks) {
    assert.equal(
      measured, ratchet,
      `RULE ${rule} measures ${measured}, ratchet is ${ratchet} — lower it in the same commit`,
    );
  }
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
    'a practice topic that is neither a grammar slug nor practice-only': (c) => { c.lektionen[1].practiceRule.topics = [...c.lektionen[1].practiceRule.topics, 'no-such-topic']; },
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

  // The four ratcheted rules, each mutated by as much as the ratchet's current slack plus one, and
  // each asserted BY NAME — see the self-sizing note at the top of this file.
  const c10 = clone();
  const need10 = overshoot(wortfeldCoverage(CURRICULUM_A11).length, MAX_UNCOVERED_WORTFELD);
  assert.equal(addUnusedWortfeld(c10, need10), need10, 'the fixture could not carry enough unused Wortfeld words');
  assert.ok(failsWith(validateCurriculum(c10), 10), 'not caught: Wortfeld words no input of their Lektion uses');

  // RULE 11: hand-written items that reach for a word the course has not taught yet.
  const c11 = clone();
  const need11 = overshoot(itemLexis(CURRICULUM_A11).length, MAX_UNTAUGHT_ITEM_TOKENS);
  const extra11 = [...loadExtraItems(), ...untaughtItems(need11, 'a11')];
  assert.ok(failsWith(validateCurriculum(c11, extra11), 11), 'not caught: items built from untaught words');

  // RULE 11b: items the learner is SERVED that reach for a word the course has not taught yet.
  const c11b = clone();
  const [extra11b, pool11b] = [loadExtraItems(), loadPoolItems()];
  const need11b = overshoot(drawnLexis(CURRICULUM_A11).length, MAX_UNTAUGHT_DRAWN_TOKENS);
  assert.equal(plantInDrawnItems(c11b, extra11b, pool11b, need11b), need11b, 'the planted items are no longer drawn');
  assert.ok(failsWith(validateCurriculum(c11b, extra11b, pool11b), '11b'), 'not caught: served items built from untaught words');

  // RULE 12: can-do lines whose content words no exercise slot of their Lektion rehearses. Hard
  // rule, no ratchet — the overshoot is against 0, same shape as RULE 14 below.
  const c12 = clone();
  const need12 = overshoot(canDoRehearsal(CURRICULUM_A11).length, 0);
  assert.equal(addUnrehearsedCanDos(c12, need12), need12, 'the fixture could not carry enough unrehearsed can-do lines');
  assert.ok(failsWith(validateCurriculum(c12), 12), 'not caught: can-do lines nothing in their Lektion rehearses');

  // RULE 13: more Lektionen whose speaking prompt never reaches the speaking page.
  const c13 = clone();
  const need13 = overshoot(missionlessLektionen(CURRICULUM_A11).length, MAX_MISSIONLESS_LEKTIONEN);
  assert.equal(dropMissions(c13, need13), need13, 'the fixture could not drop enough missions');
  assert.ok(failsWith(validateCurriculum(c13), 13), 'not caught: speaking tasks without a mission');

  // RULE 6b: a Notice card that bolds a form its own Lektion never shows.
  const c6b = clone();
  const need6b = overshoot(noticeFormCoverage(CURRICULUM_A11).length, MAX_UNEXEMPLIFIED_NOTICE_FORMS);
  assert.equal(addUnexemplifiedNoticeForms(c6b, need6b), need6b, 'the fixture could not carry enough bolded forms');
  assert.ok(failsWith(validateCurriculum(c6b), '6b'), 'not caught: a Notice form no input of its Lektion shows');

  // RULE 15: a form of a LATE Lektion typed into the dictation line of Lektion 1.
  const c15 = clone();
  const need15 = overshoot(producedBeforeTaught(CURRICULUM_A11).length, MAX_UNTAUGHT_IN_PRODUCTION);
  assert.equal(addProducedVorgriffe(c15, levelSpec('a1.1'), need15), need15, 'no late form to plant');
  assert.ok(failsWith(validateCurriculum(c15), 15), 'not caught: a Vorgriff in a line the learner produces');

  // RULE 15b: a deferred CONSTRUCTION (not a deferred word) in a line the learner dictates.
  const c15b = clone();
  const l15b = c15b.lektionen[2];
  l15b.dialog.lines[l15b.hoeren.lines[0]].de = 'Er ist zwanzig. Meine Schwester ist noch jung.';
  assert.ok(failsWith(validateCurriculum(c15b), '15b'), 'not caught: a deferred construction in a dictation line');

  // RULE 16: a „Lesen“ claim whose Lektion has no reading surface.
  const c16 = clone();
  const need16 = overshoot(examTeileBacked(CURRICULUM_A11).length, MAX_UNBACKED_EXAM_TEILE);
  assert.equal(unbackExamTeile(c16, need16), need16, 'the fixture could not unback enough exam Teile');
  assert.ok(failsWith(validateCurriculum(c16), 16), 'not caught: an examTeile claim nothing backs');

  // RULE 14: the line DaF review #5 found — „Mein Mann“ from a woman the Formular of the same
  // Lektion lists as ledig. No ratchet, so one is enough.
  const c14 = clone();
  c14.lektionen[2].dialog.lines[9] = {
    speaker: 'Ana', de: 'Ja, ein Baby. Mein Mann und ich kommen aus Marokko.', en: 'Yes, a baby.',
  };
  assert.ok(failsWith(validateCurriculum(c14), 14), 'not caught: a dialogue line that contradicts the persona table');
});

test('rule 14: the recurring characters keep their Familienstand, Herkunft, Beruf and Sprachen', () => {
  // DaF review #5, MAJOR 12: the RULE 10 coverage ratchet was satisfied by pushing „der Mann“ into
  // an L3 dialogue line — „Mein Mann und ich kommen aus Marokko“ — while the Formular of that very
  // Lektion and the Mitteilung of L2 both say ledig. A learner reads the line aloud and fills in the
  // form in the same sitting.
  assert.deepEqual(personaConsistency(CURRICULUM_A11), []);
  assert.equal(PERSONAS_A11.Ana.familienstand, 'ledig');
  assert.equal(PERSONAS_A11.Ana.herkunft, 'Marokko');
  assert.deepEqual(PERSONAS_A11.Ana.beruf, ['Studentin']);
  // The three texts the table is read off, so a change to any of them fails here rather than
  // quietly making the table wrong.
  assert.match(L[2].schreiben.sample, /Familienstand: ledig/);
  assert.match(L[1].schreiben.sample, /Ich bin ledig\./);
  assert.match(L[1].dialog.lines.map((x) => x.de).join(' '), /Ich bin Studentin\./);
  assert.ok(
    !L[2].dialog.lines.some((x) => x.speaker === 'Ana' && /\bMein Mann\b/.test(x.de)),
    'the round-5 line is gone: Ana has no husband',
  );
  // Each fact bites on its own.
  for (const line of [
    'Ja, ein Baby. Mein Mann und ich kommen aus Marokko.',
    'Ich bin verheiratet.',
    'Ich komme aus Polen.',
    'Ich bin Kellnerin.',
  ]) {
    const c = clone();
    c.lektionen[2].dialog.lines[9] = { speaker: 'Ana', de: line, en: 'x' };
    assert.ok(personaConsistency(c).length > 0, `not caught: ${line}`);
  }
  // And a fact about somebody else in the same sentence is not read as Ana's: „Ana sitzt im Café.
  // Paul ist Kellner.“ must stay silent, or the rule would report the setting of L9 forever.
  assert.deepEqual(personaConsistency(CURRICULUM_A11).filter((o) => o.nr === 9), []);
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

test('every registered level ships a persona table — RULE 14 is never silent for a whole level', () => {
  // DaF review #1 for A1.2, BLOCKER 1: the A1.2 registry row carried `personaSource: null` („nobody
  // has written their fact table yet“), and the waiver cost exactly what RULE 14 exists to prevent —
  // Ana, whom A1.1 files as ledig in an AI-graded Formular, got a husband in an A1.2 DICTATION line.
  // A level without a fact table must not ship, so the absence is a test failure, not a silence.
  for (const key of LEVEL_KEYS) {
    const spec = LEVELS[key];
    assert.ok(spec.personaSource, `${spec.code}: personaSource is null — RULE 14 would be silent for the whole level`);
    const table = PERSONA_TABLES[spec.personaSource];
    assert.ok(table && Object.keys(table).length, `${spec.code}: personaSource "${spec.personaSource}" resolves to no table`);
    // And every character who speaks in the level is in it: a new name with no row is a character
    // the course can say anything about.
    const speakers = new Set(spec.curriculum.lektionen.flatMap((l) => l.dialog.lines.map((x) => x.speaker)));
    const missing = [...speakers].filter((sp) => !(sp in table));
    assert.deepEqual(missing, [], `${spec.code}: dialogue speakers with no persona row: ${missing.join(', ')}`);
  }
});

test('A1.2 inherits A1.1 facts and adds its own — Ana stays ledig, aus Marokko, Studentin', () => {
  // The table is a spread of PERSONAS_A11 on purpose: A1.2's DIALOG_NAMES is A1.1's list extended,
  // so an A1.2 line must not be able to overturn a fact A1.1 already grades against.
  assert.equal(PERSONAS_A12.Ana.familienstand, 'ledig');
  assert.equal(PERSONAS_A12.Ana.herkunft, 'Marokko');
  assert.deepEqual(PERSONAS_A12.Ana.beruf, ['Studentin']);
  assert.deepEqual(PERSONAS_A12.Ana.sprachen, ['Arabisch', 'Deutsch']);
  // The facts A1.2 states itself, read off the Formulare of L1/L3 and the Steckbrief of L7.
  assert.equal(PERSONAS_A12.Ana.stadt, 'Bremen');
  assert.equal(PERSONAS_A12.Lena.stadt, 'Köln');
  assert.equal(PERSONAS_A12.Lena.alter, 24);
  assert.deepEqual(PERSONAS_A12['Frau Berger'].beruf, ['Ärztin']);
  assert.equal(levelSpec('a1.2').personaSource, 'a1.2');
  // Each new fact bites on its own, in the Lektion whose Formular states it.
  for (const [nr, text] of [[1, 'Ana Chakiri wohnt in Berlin am Platz 4.'], [7, 'Lena Berg ist 30 Jahre alt und kommt aus Hamburg.']]) {
    const c = cloneOf(CURRICULUM_A12);
    c.lektionen[nr - 1].schreiben.taskDe = text;
    assert.ok(personaConsistency(c).length > 0, `not caught: ${text}`);
  }
});

test('rule 6b: a Notice card teaches only forms its own Lektion shows, under a ratchet that only falls', () => {
  // DaF review #1 for A1.2, BLOCKER 2. RULE 6 pins the two examples to verbatim dialogue lines; it
  // never asked whether the FORM the card bolds occurs anywhere the learner reads or hears.
  assert.ok(noticeFormCoverage(CURRICULUM_A11).length <= MAX_UNEXEMPLIFIED_NOTICE_FORMS);
  // An ending is not a form: „-te“, „ge- …-t“ and a bold inside a word („teu**rer**“) are outside
  // the rule, or every declension table would be an offender.
  const c = cloneOf(CURRICULUM_A11);
  c.lektionen[0].notice.bodyDe = 'Die Endung ist **-te**, und teu**rer** ist unregelmäßig.';
  assert.deepEqual(noticeFormCoverage(c).filter((o) => o.nr === 1), []);
  c.lektionen[0].notice.bodyDe = 'Das Wort **Giraffe** ist neu.';
  assert.deepEqual(noticeFormCoverage(c).filter((o) => o.nr === 1), [{ nr: 1, form: 'Giraffe' }]);
});

test('rule 15: dictation and read-aloud lines use no form the course teaches later', () => {
  // DaF review #1 for A1.2, BLOCKER 3: „Diktat und Nachsprechen sind die beiden Schritte, in denen
  // der Lernende die Zeile produziert“ — and that is where the Vorgriffe sat.
  assert.ok(producedBeforeTaught(CURRICULUM_A11).length <= MAX_UNTAUGHT_IN_PRODUCTION);
  // The rule reads the grammar order, not a list of lines: a form belonging to a slug whose own
  // Lektion comes later is reported wherever it is planted.
  const c = cloneOf(CURRICULUM_A12);
  const l = c.lektionen[0];
  l.dialog.lines[l.hoeren.lines[0]].de = 'Wir haben den Kuchen gekauft.';
  const found = producedBeforeTaught(c).filter((o) => o.nr === 1).map((o) => o.kind);
  assert.ok(found.includes('accusative-intro'), 'den (taught in L3) not reported in an L1 dictation line');
  assert.ok(found.includes('perfekt-intro'), 'gekauft (taught in L12) not reported in an L1 dictation line');
  // …but the fixed chunks the level's own L1 notice licences by name are not Vorgriffe.
  const licensed = cloneOf(CURRICULUM_A12);
  const l1 = licensed.lektionen[0];
  l1.dialog.lines[l1.hoeren.lines[0]].de = 'Zuerst gehen Sie zur Kirche.';
  assert.deepEqual(
    producedBeforeTaught(licensed).filter((o) => o.nr === 1 && o.kind === 'dative-prepositions-intro'),
    [], 'the three Wendungen A1.2 L1 names must stay licensed',
  );
});

/**
 * THE EIGHT PLACES DaF review #11 (MAJOR 3) measured, as a fixture.
 *
 * Every one is a line the learner DICTATES or READS ALOUD that carries a construction his own
 * course defers — the same three patterns the rule cards are guarded against. The fix moved the
 * WINDOWS onto dialogue lines without the construction; the dialogue lines themselves are
 * untouched, because they are what the owner records and CONTRACT §2 lets a learner MEET a form.
 * So the sentences below no longer sit in any window — and the checker must still report every one
 * of them when they are planted back in, or the rule has been narrowed to the lines of the day.
 */
const DEFERRED_CONSTRUCTION_PRODUCTION_PROBES = [
  { nr: 3, text: 'Er ist zwanzig. Meine Schwester ist noch jung.', kind: 'possessive-articles' },
  { nr: 3, text: 'Ja. Das sind meine Eltern und meine Geschwister: ein Bruder, eine Schwester.', kind: 'indefinite-articles' },
  { nr: 3, text: 'Ja. Das sind meine Eltern und meine Geschwister: ein Bruder, eine Schwester.', kind: 'possessive-articles' },
  { nr: 3, text: 'Spricht dein Bruder auch Englisch?', kind: 'possessive-articles' },
  { nr: 3, text: 'Mein Bruder ist zwanzig.', kind: 'possessive-articles' },
  { nr: 7, text: 'Mein Hobby ist Sport. Ich spiele am Wochenende Fußball.', kind: 'possessive-articles' },
  { nr: 8, text: 'Ich stehe um sechs Uhr auf.', kind: 'separable-verbs-intro' },
  { nr: 4, text: 'Hallo Lena! Ich kaufe einen Stuhl. Kommst du mit? Tschüss, Tim', kind: 'separable-verbs-intro' },
];

test('rule 15b: a construction the course defers is in no line the learner produces', () => {
  // DaF review #11, MAJOR 3. Round 11 deleted „Meine Schwester ist noch jung.“ from the A1.1 L3
  // RULE CARD because the possessive article is Lektion 12, and left the same sentence standing as
  // L3's DICTATION line, where checkAnswer grades it letter by letter. One definition of
  // „deferred construction“, therefore, in src/data/curricula/constructions.js, read by the card
  // guard (tests/rule-card-overrides.test.mjs) and by this rule.
  // Round 14 extended the rule to the CHECKPOINTS and made the Satzklammer pattern structural, and
  // the A1.1 number went 0 → 1: `a1.1-cp1-hoeren-3` dictates „Bitte füllen Sie das Formular aus.“
  // after Lektion 3. The measured reason is in MAX_DEFERRED_CONSTRUCTIONS' comment and it is the
  // L3 line shortage the owner already holds RULE 18 open for. Every level is measured against its
  // OWN row, never against zero, so a paused level's draft cannot be hidden behind A1.1's number.
  for (const [level, C] of Object.entries(ALL_CURRICULA)) {
    const ratchet = levelSpec(level).ratchets.deferredConstructions;
    const offenders = constructionsBeforeTaught(C, loadPoolItems(level));
    assert.ok(
      offenders.length <= ratchet,
      `${level}: ${offenders.length} production texts carry a construction the course has not taught `
        + `(ratchet ${ratchet}) — ${offenders.map((o) => `L${o.nr} ${o.where} [${o.kind}] „${o.hit}“`).join(', ')}`,
    );
  }
  assert.equal(MAX_DEFERRED_CONSTRUCTIONS, 0, 'RULE 15b at A1.1 closed at 0 — it may never go up');
  // Closed in round 14: L3 line 3 lost its possessive and the dictation picker prefers
  // construction-free, unreportable lines — nothing remains to name.
  assert.deepEqual(
    constructionsBeforeTaught(CURRICULUM_A11, loadPoolItems('a1.1'))
      .map((o) => `${o.where} [${o.kind}] „${o.hit}“`),
    [],
  );
});

test('rule 15b: the Satzklammer is read off the SHAPE, never off a list of verb stems', () => {
  // DaF review #13, MAJOR 3. The guard used to fire only when the sentence carried one of fourteen
  // hand-written stems, so „Bitte kaufen Sie das Brot ein.“ was caught and the identical shape with
  // `füllen` — a read-aloud line of L2 and the dictation of Checkpoint 1 — was not. The fixture the
  // review asked for, by name:
  const FUELLEN = 'Bitte füllen Sie das Formular aus.';
  assert.deepEqual(
    constructionHits(FUELLEN).map((h) => h.slug), ['separable-verbs-intro'],
    'the sentence the review measured must be reported as a Satzklammer',
  );
  // …and the class, not the instance: any verb at all, including ones no A1 course teaches.
  for (const verb of ['kaufen', 'füllen', 'prüfen', 'schicken', 'notieren', 'buchstabieren']) {
    const de = `Bitte ${verb} Sie das Formular aus.`;
    assert.deepEqual(constructionHits(de).map((h) => h.slug), ['separable-verbs-intro'], de);
  }
  // Every prefix of the closed class, in a V2 sentence.
  for (const prefix of SEPARABLE_PREFIXES) {
    const de = `Ich mache das Fenster ${prefix}.`;
    assert.ok(constructionHits(de).some((h) => h.slug === 'separable-verbs-intro'), de);
  }
  // The counter-probes, both directions. A preposition that ends no clamp, a predicative adjective,
  // and a sentence whose only finite verb is the copula: `sein` is never the front half of a clamp.
  for (const de of [
    'Der Teppich ist auf der Terrasse.',
    'Die Tür ist zu.',
    'Ich komme aus Marokko.',
    'Der Termin ist am Dienstag um acht Uhr.',
    'Das Heft ist grün.',
  ]) {
    assert.deepEqual(constructionHits(de).map((h) => h.slug), [], de);
  }
});

test('rule 15b: Adjektivdeklination is deferred in EVERY Lektion, because A1.1 teaches it in none', () => {
  // DaF review #13, MAJOR 2. The L8 dialogue line was protected from „Ich habe einen guten Wecker“
  // („a fifth Vorgriff the course never names“) and the Beispieltext of the same Lektion carried
  // the same construction three times, because no rule read a model text.
  const pattern = CONSTRUCTION_PATTERNS.find((p) => p.slug === 'adjective-declension');
  assert.ok(pattern, 'the pattern must exist');
  assert.equal(pattern.never, true, 'A1.1 introduces it in no Lektion, so it is deferred everywhere');
  for (const de of ['Ein neuer Termin ist frei.', 'Das ist der neue Tag.', 'Ich habe einen guten Wecker.', 'Mai ist ein schöner Monat!']) {
    assert.ok(constructionHits(de).some((h) => h.slug === 'adjective-declension'), de);
  }
  // Not an adjective: a possessive, a quantifier, an adverb between article and noun.
  for (const de of ['Ana, ist das deine Familie?', 'Das sind alle Kollegen.', 'Das ist nicht Ana.']) {
    assert.ok(!constructionHits(de).some((h) => h.slug === 'adjective-declension'), de);
  }
  // …and it bites where it was found: planted back into a model text, RULE 15b reports it.
  const c = cloneOf(CURRICULUM_A11);
  c.lektionen[7].schreiben.sample = 'Hallo Lena! Ein neuer Termin: Geht es am Dienstag um halb neun? Viele Grüße, Ana';
  assert.ok(
    constructionsBeforeTaught(c).some((o) => o.nr === 8 && o.kind === 'adjective-declension'),
    'the round-13 L8 Beispieltext must be caught',
  );
  assert.ok(failsWith(validateCurriculum(c), '15b'), 'validateCurriculum did not report RULE 15b');
});

test('rule 20: a Beispieltext uses only words its own Lektion has taught', () => {
  // DaF review #13, MAJOR 2: five of the six Mitteilungen the round before had rewritten carried
  // words the course never teaches — `marokkanisch` (L2), `uns` (L4), `neuer`/`neue` (L8), `erst`
  // (L10), `meinen` (L12), the last one a form the BUILD throws pool items out for. `minLektion`
  // asks this of all 374 pool items and nobody asked it of the two texts the course holds up as
  // models.
  assert.equal(MAX_UNTAUGHT_IN_MODEL_TEXTS, 0, 'RULE 20 is a hard 0 at A1.1 and may not be ratcheted up');
  assert.deepEqual(
    modelTextLexis(CURRICULUM_A11, levelSpec('a1.1')).map((o) => `L${o.nr} ${o.where} „${o.token}“`),
    [],
    'a model text uses a word its Lektion has not taught',
  );
  // It BITES: every one of the five, as it stood in `main` @ 6aabf4e, with the word the review
  // measured. Planted back one at a time, RULE 20 must name it.
  const ROUND_13_SAMPLES = {
    // Round 15: the probe token is `Mai`, not `marokkanisch`. `marokkanisch` is TAUGHT now — L2's
    // Wortfeld carries it, because the graded task of that Lektion asks for the Staatsangehörigkeit
    // (RULE 21, DaF review #14, BLOCKER 1) — so RULE 20 rightly stops reporting it. The same
    // round-13 text still breaks the rule on `Mai` and `komme`, which L2 does not teach either.
    2: ['Sehr geehrte Damen und Herren, ich bin Ana Chakiri. Der Nachname ist Chakiri. Das Geburtsdatum ist der 3. Mai 1998. Ich komme aus Marokko. Das Land ist Marokko und die Staatsangehörigkeit ist marokkanisch. Der Familienstand: Ich bin ledig. Viele Grüße, Ana', 'Mai'],
    4: ['Hallo Lena! Heute ist der Flohmarkt. Wir kaufen den Stuhl und die Lampe. Der Stuhl kostet zwölf Euro und die Lampe kostet acht Euro. Das ist nicht teuer. Wann treffen wir uns? Um vier Uhr? Tschüss, Tim', 'uns'],
    10: ['Liebe Kollegin, der Zug hat leider Verspätung. Die Kollegen kommen um neun Uhr, ich komme erst um zehn Uhr. Bitte machen Sie die Arbeit bis zehn Uhr ohne mich. Vielen Dank und viele Grüße, Ana', 'erst'],
    12: ['Hallo Lena! Am Freitag feiern wir meinen Geburtstag. Der Tag ist der 15. Mai und die Party ist um acht Uhr. Die Gäste bringen Kuchen und Musik mit. Bringst du bitte den Salat mit? Bis bald, Ana', 'meinen'],
  };
  for (const [nr, [sample, token]] of Object.entries(ROUND_13_SAMPLES)) {
    const c = cloneOf(CURRICULUM_A11);
    c.lektionen[Number(nr) - 1].schreiben.sample = sample;
    const found = modelTextLexis(c, levelSpec('a1.1')).filter((o) => o.nr === Number(nr)).map((o) => o.token);
    assert.ok(found.includes(token), `L${nr}: RULE 20 missed „${token}“ — found ${JSON.stringify(found)}`);
    assert.ok(failsWith(validateCurriculum(c), 20), `L${nr}: validateCurriculum did not report RULE 20`);
  }
  // The pretest models are measured too, not only the Schreiben samples.
  const cp = cloneOf(CURRICULUM_A11);
  cp.lektionen[0].pretest.model = 'Ich bin Krankenpflegerin von Beruf.';
  assert.ok(
    modelTextLexis(cp, levelSpec('a1.1')).some((o) => o.nr === 1 && o.where === 'pretest.model'),
    'a pretest model built on an untaught word went through RULE 20',
  );
});

test('rule 21: every Leitpunkt the course grades is answerable from the lexis of its own Lektion', () => {
  // DaF review #14, BLOCKER 1. The counter-direction to RULE 20, and the round that shipped RULE 20
  // is the round that needed it: the graded L2 task asks for „Ihr Land und Ihre
  // Staatsangehörigkeit“ and A1.1 taught no nationality form in any of its twelve Lektionen, so
  // round 14 struck `marokkanisch` out of the Beispieltext (RULE 20, rightly) and the model then
  // answered two of its three Leitpunkte. Every version of that text broke one rule or the other:
  // a Wortfeld problem wearing a text problem's clothes. L4 the same one floor down — „Wann Sie
  // sich treffen“ with a verb the level never teaches and no time expression to answer „wann“.
  assert.equal(MAX_UNANSWERABLE_LEITPUNKTE, 0, 'RULE 21 is a hard 0 at A1.1 and may not be ratcheted up');
  assert.deepEqual(
    writingTasksAreAnswerable(CURRICULUM_A11, levelSpec('a1.1')).map((o) => `L${o.nr} ${o.why} „${o.leitpunkt}“`),
    [],
    'a graded Leitpunkt asks for lexis its Lektion has not taught',
  );
  // IT BITES, at both places the review measured, planted back exactly as `main` @ 69a009b had them.
  const back = cloneOf(CURRICULUM_A11);
  back.lektionen[1].schreiben.sample = 'Sehr geehrte Damen und Herren, ich heiße Ana Chakiri. Das Geburtsdatum ist der 3.5.1998. Ich bin aus Marokko. Ich bin ledig. Ich bin Studentin in Bremen. Viele Grüße, Ana Chakiri';
  const l2 = writingTasksAreAnswerable(back, levelSpec('a1.1'));
  assert.ok(l2.some((o) => o.nr === 2 && o.why === 'unanswerable' && /Staatsangehörigkeit/.test(o.leitpunkt)), JSON.stringify(l2));
  assert.ok(failsWith(validateCurriculum(back), 21), 'validateCurriculum did not report RULE 21');

  // And it bites the TASK side, not only the text side: „Wann Sie sich treffen“ is reported for the
  // verb the level never teaches, whatever the Beispieltext says.
  const l4 = cloneOf(CURRICULUM_A11);
  l4.lektionen[3].schreiben.leitpunkte = ['Was Sie kaufen', 'Was es kostet', 'Wann Sie sich treffen'];
  const bank = writingTaskByKey('goethe_a1', 'a11-l04');
  const kept = bank.leitpunkte;
  bank.leitpunkte = ['Was Sie kaufen', 'Was es kostet', 'Wann Sie sich treffen'];
  try {
    const found = writingTasksAreAnswerable(l4, levelSpec('a1.1'));
    assert.ok(
      found.some((o) => o.nr === 4 && o.why === 'untaught-head' && o.token === 'treffen'),
      `RULE 21 missed „sich treffen“ — ${JSON.stringify(found)}`,
    );
  } finally {
    bank.leitpunkte = kept;
  }

  // The word it needed is TAUGHT now, and taught where the Handlungsfeld puts it: L2, „Ämter und
  // Behörden“, next to the Staatsangehörigkeit noun that was already there.
  const l2wf = CURRICULUM_A11.lektionen[1].wortfeld.map((w) => w.de);
  assert.ok(l2wf.includes('marokkanisch') && l2wf.includes('die Staatsangehörigkeit'), JSON.stringify(l2wf));
});

test('rule 22: a Mitteilung Beispieltext contains no form being read out', () => {
  // DaF review #15, MAJOR 1. Round 15 wrote five „<Artikel> <Leitpunkt-Nomen> ist <Wert>“
  // sentences into three of the six A1.1 Mitteilungen — L2 two, L6 two, L12 one — because RULE 21
  // measured answerability with a checker that accepts the named field, so writing to the checker
  // was the cheapest way to a green checklist. In *Start Deutsch 1* Schreiben Teil 2 that costs
  // points under „Kommunikative Gestaltung“, and the model text is what the learner imitates.
  assert.equal(MAX_FORM_SPEAK_SENTENCES, 0, 'RULE 22 is a hard 0 at A1.1 and may not be ratcheted up');
  assert.deepEqual(formSpeakInModelTexts(CURRICULUM_A11, levelSpec('a1.1')), []);
  // IT BITES, on all five sentences the review counted, planted back as `main` @ 413c2ed had them.
  const ROUND_15_SAMPLES = {
    2: ['Sehr geehrte Damen und Herren, ich heiße Ana Chakiri. Das Geburtsdatum ist der 3.5.1998. Ich bin aus Marokko. Die Staatsangehörigkeit ist marokkanisch. Ich bin ledig. Ich bin Studentin in Bremen. Viele Grüße, Ana Chakiri', 2],
    6: ['Guten Tag, Frau Berg! Ich brauche einen Computer. Wir brauchen auch ein Handy. Die Telefonnummer ist null vier zwei drei drei acht eins. Die Nummer ist für das Handy. Ich bin um neun Uhr im Büro. Viele Grüße, Ana', 2],
    12: ['Hallo Lena! Am Freitag feiern wir Geburtstag. Der Tag ist der 15. Mai und die Party ist um acht Uhr. Die Gäste bringen Kuchen und Musik mit. Bringst du bitte den Salat mit? Bis bald, Ana', 1],
  };
  for (const [nr, [sample, count]] of Object.entries(ROUND_15_SAMPLES)) {
    const c = cloneOf(CURRICULUM_A11);
    c.lektionen[Number(nr) - 1].schreiben.sample = sample;
    const found = formSpeakInModelTexts(c, levelSpec('a1.1')).filter((o) => o.nr === Number(nr));
    assert.equal(found.length, count, `L${nr}: ${JSON.stringify(found)}`);
    assert.ok(failsWith(validateCurriculum(c), 22), `L${nr}: validateCurriculum did not report RULE 22`);
  }
  // The noun list comes from the TASK BANK and not from a string literal — the round-15 guard was
  // three typed strings that matched none of the five sentences above.
  const src = readFileSync(join(ROOT, 'scripts/validate-curriculum.mjs'), 'utf8');
  assert.doesNotMatch(src, /Der Familienstand:\|Das Land ist/, 'RULE 22 must not be a string list');
});

test('rule 23: a Wortfeld entry reaches an input surface of its own Lektion, not only an exercise', () => {
  // DaF review #15, MAJOR 4: `marokkanisch` — the word the GRADED task of its Lektion asks for —
  // stood in the vocabulary list and in the model answer and nowhere else in the whole course.
  // RULE 10 was green because RULE 10 counts the exercises too, and a word a learner only meets
  // inside the exercise he is graded on has been shown, not taught.
  const uncovered = wortfeldInputCoverage(CURRICULUM_A11, levelSpec('a1.1'));
  assert.equal(uncovered.length, MAX_WORTFELD_WITHOUT_INPUT,
    `RULE 23 measures ${uncovered.length} and the ratchet says ${MAX_WORTFELD_WITHOUT_INPUT} — re-measure, never relax`);
  // The entry the rule was written for is closed: L2's notice names the Staatsangehörigkeit and the
  // model text says „Ich bin marokkanisch.“
  assert.ok(!uncovered.some((o) => o.de === 'marokkanisch'), JSON.stringify(uncovered.filter((o) => o.nr === 2)));
  assert.ok(!uncovered.some((o) => o.de === 'geboren'));
  // IT BITES: take the word off both surfaces and it is reported again.
  const c = cloneOf(CURRICULUM_A11);
  const l2 = c.lektionen[1];
  l2.notice.bodyDe = l2.notice.bodyDe.replace(' Auch die Staatsangehörigkeit steht ohne Artikel: Ich bin marokkanisch.', '');
  l2.schreiben.sample = l2.schreiben.sample.replace(' Ich bin marokkanisch.', '');
  const after = wortfeldInputCoverage(c, levelSpec('a1.1'));
  assert.ok(after.some((o) => o.nr === 2 && o.de === 'marokkanisch'), JSON.stringify(after.filter((o) => o.nr === 2)));
  assert.ok(failsWith(validateCurriculum(c), 23), 'validateCurriculum did not report RULE 23');
  // An ITEM is not an input surface — that is the whole difference to RULE 10, which counts both.
  assert.ok(wortfeldCoverage(CURRICULUM_A11).length < uncovered.length,
    'RULE 23 must be stricter than RULE 10, or it measures the same thing twice');
});

test("rule 20's licensed chunks are letter formulas — a closed list, and nothing content-bearing", () => {
  // The ONE thing a Mitteilung needs that no Wortfeld carries. They are stripped as CHUNKS, not as
  // words, so `marokkanisch` cannot ride in on „Viele Grüße“ (DaF review #13, MAJOR 2, fix 1).
  assert.ok(LICENSED_LETTER_CHUNKS.length <= 12, 'the list is tiny on purpose');
  const FORMULA = /^(?:Sehr geehrte[r]?(?: Damen und Herren| Herr| Frau)?|Mit freundlichen Grüßen|Viele Grüße|Liebe Grüße|Vielen Dank|Bis bald|Liebe|Lieber)$/;
  for (const chunk of LICENSED_LETTER_CHUNKS) {
    assert.match(chunk, FORMULA, `„${chunk}“ is not a salutation or a closing`);
  }
  // And the licence is a chunk: the words of a formula are NOT free on their own.
  const c = cloneOf(CURRICULUM_A11);
  c.lektionen[1].schreiben.sample = 'Sehr geehrte Damen und Herren, ich heiße Ana Chakiri. Ich bin ledig. Die Herren sind hier. Ich bin aus Marokko. Das Geburtsdatum ist der 3.5.1998. Viele Grüße, Ana';
  assert.ok(
    modelTextLexis(c, levelSpec('a1.1')).some((o) => o.nr === 2 && /Herren/i.test(o.token)),
    'a formula word used OUTSIDE its formula must still be measured',
  );
});

test('rule 15b: every place DaF review #11 measured is still caught when planted back', () => {
  // The test as a CLASS, not as a list of ids: each probe goes into a real production surface of
  // its own Lektion and must be reported with the pattern the review named.
  const missed = [];
  for (const { nr, text, kind } of DEFERRED_CONSTRUCTION_PRODUCTION_PROBES) {
    const c = cloneOf(CURRICULUM_A11);
    const l = c.lektionen[nr - 1];
    l.dialog.lines[l.hoeren.lines[0]].de = text;
    const found = constructionsBeforeTaught(c).filter((o) => o.nr === nr).map((o) => o.kind);
    if (!found.includes(kind)) missed.push(`L${nr} [${kind}] „${text}“`);
  }
  assert.deepEqual(missed, [], `probes that go through RULE 15b:\n  ${missed.join('\n  ')}`);

  // …and the MODEL texts are production too: the pretest model and the Schreiben sample are what
  // the course holds up as „so sagt/schreibt man das“. `pretest.accepted` is deliberately not —
  // that is what the course TOLERATES from the learner, and a learner may hit a form early
  // (CONTRACT §2).
  const cm = cloneOf(CURRICULUM_A11);
  cm.lektionen[2].pretest.model = 'Mein Bruder ist zwanzig.';
  cm.lektionen[3].schreiben.sample = 'Hallo Lena! Kommst du mit? Tschüss, Tim';
  cm.lektionen[4].pretest.accepted = ['Mein Buch ist hier.'];
  const where = constructionsBeforeTaught(cm).map((o) => o.where);
  assert.ok(where.includes('pretest.model'), 'a pretest model with a deferred construction went through');
  assert.ok(where.includes('schreiben.sample'), 'a Schreiben sample with a deferred construction went through');
  assert.deepEqual(constructionsBeforeTaught(cm).filter((o) => o.nr === 5), [], 'pretest.accepted must stay out of RULE 15b');
});

// ───────────────────────────────────────────────────────────────────────────────────────────────
// THE MODEL TEXTS — RULE 17, RULE 18, RULE 19 (DaF review #12, MAJOR 1-3)
// ───────────────────────────────────────────────────────────────────────────────────────────────

test('rule 17: every Beispieltext passes the form checklist its own screen shows beside it', () => {
  // The finding, measured: `GradedWriting.jsx` prints the checklist and, a paragraph below it, the
  // Beispieltext — and all six A1.1 Mitteilungen failed their own length row (24, 15, 17, 17, 14,
  // 15 words against a floor of 25). A learner who copies the model gets the red cross he has just
  // clicked away. This runs the SAME function the screen runs (`scoreWriting`) against the SAME
  // window the server enforces (the task bank), over every level and both Textsorten.
  assert.equal(MAX_MODEL_CHECKLIST_BREAKS, 0, 'RULE 17 is a hard 0 at A1.1 and may not be ratcheted up');
  assert.deepEqual(
    modelTextsPassOwnChecklist(CURRICULUM_A11).map((o) => `L${o.nr} ${o.key} „${o.label}“ (${o.count} Wörter)`),
    [],
    'a Beispieltext fails the checklist the learner sees next to it',
  );
  // Both branches run. A Formular is graded on „is every field filled“, and all six do it.
  const formularLektionen = L.filter((l) => l.schreiben.kind === 'formular').map((l) => l.nr);
  assert.deepEqual(formularLektionen, [1, 3, 5, 7, 9, 11]);
  for (const l of formularLektionen) {
    const bank = writingTaskByKey(CURRICULUM_A11.examKey, `a11-l${String(l).padStart(2, '0')}`);
    const values = formularSampleValues(L[l - 1].schreiben.sample, bank.leitpunkte);
    assert.deepEqual(
      (bank.leitpunkte || []).filter((f) => !String(values[f] || '').trim()), [],
      `L${l}: the Formular sample leaves a field empty`,
    );
  }
  // The window is DERIVED: it comes from the bank, so a bank that moves moves the rule with it.
  for (const l of L) {
    const bank = writingTaskByKey(CURRICULUM_A11.examKey, l.schreiben.taskKey);
    assert.equal(bank.minWords, l.schreiben.minWords);
    assert.equal(bank.maxWords, l.schreiben.maxWords);
  }
});

test('rule 17 bites: the round-12 Beispieltexte are caught when planted back', () => {
  // Every one of the six as it stood in `main` @ cbcac8e, with the count the review measured.
  const ROUND_12_SAMPLES = {
    2: 'Sehr geehrte Damen und Herren, ich heiße Ana Chakiri, Geburtsdatum 3. Mai 1998. Ich komme aus Marokko. Ich bin ledig. Viele Grüße, Ana Chakiri',
    4: 'Hallo Lena! Ich kaufe einen Stuhl. Er kostet zwölf Euro. Kommst du auch? Tschüss, Tim',
    6: 'Guten Tag, Frau Berg! Ich brauche einen Computer. Die Nummer ist null vier zwei. Viele Grüße, Ana',
    8: 'Hallo Lena! Ich komme am Montag zu spät. Der Termin am Dienstag um acht? Viele Grüße, Ana',
    10: 'Hallo Lena! Der Zug hat Verspätung. Ich komme um zehn Uhr. Viele Grüße, Ana',
    12: 'Hallo Lena! Ich feiere am Freitag meinen Geburtstag. Komm um acht Uhr! Bis bald, Ana',
  };
  for (const [nr, sample] of Object.entries(ROUND_12_SAMPLES)) {
    const c = cloneOf(CURRICULUM_A11);
    c.lektionen[Number(nr) - 1].schreiben.sample = sample;
    const keys = modelTextsPassOwnChecklist(c).filter((o) => o.nr === Number(nr)).map((o) => o.key);
    assert.ok(keys.includes('length'), `L${nr}: the round-12 sample is under the floor and RULE 17 missed it`);
    assert.ok(failsWith(validateCurriculum(c), '17'), `L${nr}: validateCurriculum did not report RULE 17`);
  }
  // …and the Formular branch bites too: an unfilled field is a failed check.
  const cf = cloneOf(CURRICULUM_A11);
  cf.lektionen[0].schreiben.sample = 'Familienname: Chakiri / Vorname: Ana / Land: Marokko / Sprache: Arabisch / Unterschrift:';
  assert.ok(
    modelTextsPassOwnChecklist(cf).some((o) => o.nr === 1 && o.key === 'Unterschrift'),
    'an empty Formular field went through RULE 17',
  );
});

test('rule 18: dictation and read-aloud never work on the same sentence', () => {
  // Nine of twelve A1.1 Lektionen separate the two windows without being asked; the three that did
  // not were made by the RULE-15b window moves of round 12. L6 and L8 are separated in round 13.
  // L3 is the ratchet's 1 and the reason is structural, not a tolerance: RULE 15b leaves exactly
  // three construction-free lines in that dialogue (2, 5, 7) and two disjoint windows need four.
  // The owner decides the one-word dialogue change that closes it — see MAX_SHARED_PRODUCTION_LINES.
  const shared = sharedProductionLines(CURRICULUM_A11);
  assert.deepEqual(
    shared.map((o) => `L${o.nr}`), [],
    'a Lektion dictates and reads aloud the same line — move a window, do not raise the ratchet',
  );
  assert.equal(shared.length, MAX_SHARED_PRODUCTION_LINES);
  assert.deepEqual(sharedProductionLines(CURRICULUM_A12), [], 'A1.2 keeps the windows apart; it must stay that way');
  // Compared as TEXT, not as index: two indices can carry the same sentence.
  const c = cloneOf(CURRICULUM_A11);
  c.lektionen[0].dialog.lines[c.lektionen[0].sprechen.readAloud[0]].de =
    c.lektionen[0].dialog.lines[c.lektionen[0].hoeren.lines[0]].de;
  assert.ok(sharedProductionLines(c).some((o) => o.nr === 1), 'the same TEXT under two indices went through RULE 18');
  // And the two windows round 12 collided are caught when put back.
  for (const [nr, back] of [[6, [2, 6]], [8, [3, 6]]]) {
    const cc = cloneOf(CURRICULUM_A11);
    cc.lektionen[nr - 1].sprechen.readAloud = back;
    assert.ok(
      sharedProductionLines(cc).some((o) => o.nr === nr),
      `L${nr}: the round-12 window is back and RULE 18 missed it`,
    );
    assert.ok(failsWith(validateCurriculum(cc), '18'), `L${nr}: validateCurriculum did not report RULE 18`);
  }
});

test('rule 19: a model text states nothing its own dialogue states otherwise', () => {
  for (const [level, C] of Object.entries(ALL_CURRICULA)) {
    assert.deepEqual(
      modelTextsMatchDialogue(C).map((o) => `L${o.nr} ${o.where}: ${o.subject} → „${o.value}“ (${o.why})`), [],
      `${level}: a Modelltext contradicts the dialogue of its own Lektion`,
    );
  }
});

test('rule 19 bites: the round-12 L3 model and a wrong price are caught, a new fact is not', () => {
  // THE FINDING. Round 12 replaced „Mein Bruder ist zwanzig.“ (possessive → L12) with „Das ist die
  // Schwester. Sie ist zwanzig.“ — and gave the number to the wrong person: in the dialogue of that
  // very Lektion the BROTHER is twenty and the sister is „noch jung“.
  const c = cloneOf(CURRICULUM_A11);
  c.lektionen[2].pretest.model = 'Das ist die Schwester. Sie ist zwanzig.';
  const hits = modelTextsMatchDialogue(c).filter((o) => o.nr === 3);
  assert.ok(
    hits.some((o) => o.subject === 'schwester' && o.value.toLowerCase() === 'zwanzig'),
    'the round-12 L3 model went through RULE 19',
  );
  assert.ok(failsWith(validateCurriculum(c), '19'), 'validateCurriculum did not report RULE 19');

  // The same rule over a Schreiben sample and over a price: the L4 dialogue prices the Lampe at
  // eight Euro, so a Beispieltext that prices it at four contradicts the text the learner just read.
  const cp = cloneOf(CURRICULUM_A11);
  cp.lektionen[3].schreiben.sample =
    'Hallo Lena! Heute ist der Flohmarkt. Wir kaufen den Stuhl und die Lampe. Der Stuhl kostet zwölf Euro und die Lampe kostet vier Euro. Das ist nicht teuer. Wann treffen wir uns? Um vier Uhr? Tschüss, Tim';
  assert.ok(
    modelTextsMatchDialogue(cp).some((o) => o.nr === 4 && o.subject === 'lampe'),
    'a price that contradicts the dialogue went through RULE 19',
  );

  // THE COUNTER-PROBE, which keeps the rule honest: a model may ADD a fact the dialogue never
  // states („Er ist Student.“ — the L3 dialogue says nothing about the brother's Beruf), and it may
  // repeat one („Der Bruder ist zwanzig.“). Neither may be reported.
  const cn = cloneOf(CURRICULUM_A11);
  cn.lektionen[2].pretest.model = 'Der Bruder ist zwanzig. Er ist Student.';
  assert.deepEqual(modelTextsMatchDialogue(cn).filter((o) => o.nr === 3), []);
});

test('a pretest model answers its own prompt: it starts with a prefix its own accepted list names', () => {
  // DaF review #12, MAJOR 2, „Drittens“. The model is printed under „Modellantwort“ and played back
  // („Anhören“), so it is the sentence the learner repeats; `accepted` is what the course tells him
  // a good answer starts with. When the two drift apart — round 12's „Das ist die Schwester.“ under
  // an accepted list of `Mein/Meine/Das ist/Er ist/Sie ist` — the screen teaches one thing and
  // grades another.
  for (const [level, C] of Object.entries(ALL_CURRICULA)) {
    for (const l of C.lektionen) {
      const p = l.pretest || {};
      const model = String(p.model || '');
      assert.ok(
        (p.accepted || []).some((a) => model.toLowerCase().startsWith(String(a).toLowerCase())),
        `${level} L${l.nr}: the model „${model}“ starts with none of its accepted prefixes ${JSON.stringify(p.accepted)}`,
      );
    }
  }
});

test('rule 16: every examTeile claim is backed by the Lektion that makes it', () => {
  // DaF review #1 for A1.2, BLOCKER 4: examTeile is the sixth column of the public 12x6 grid, i.e.
  // a sales claim (src/data/marketing.js: measure before you claim).
  assert.ok(MAX_UNBACKED_EXAM_TEILE <= 1, 'the ratchet may only ever be lowered');
  const unbacked = examTeileBacked(CURRICULUM_A11);
  assert.ok(
    unbacked.length <= MAX_UNBACKED_EXAM_TEILE,
    `${unbacked.length} unbacked examTeile > ratchet ${MAX_UNBACKED_EXAM_TEILE}:\n  - ${unbacked.map((o) => `L${o.nr} ${o.teil} (${o.why})`).join('\n  - ')}`,
  );
  // Round 8 closed the last one (L2 dropped „Lesen Teil 1“, which it never rehearsed).
  assert.deepEqual(unbacked.map((o) => [o.nr, o.teil]), []);
  const c = cloneOf(CURRICULUM_A12);
  // A Sprechen-Teil-1 label on a prompt that is no self-introduction and no Teil-1 mission.
  c.lektionen[3].examTeile = ['Sprechen Teil 1'];
  c.lektionen[3].sprechen.open.teil = 'Sprechen Teil 1';
  c.lektionen[3].sprechen.open.promptDe = 'Reklamieren Sie höflich an der Rezeption.';
  c.lektionen[3].sprechen.open.missionOrder = null;
  assert.ok(examTeileBacked(c).some((o) => o.nr === 4 && o.teil === 'Sprechen Teil 1'));
  // mission_order 9 („Sprechen Teil 1: Sich komplett vorstellen“, read from speaking_missions on
  // 2026-09-13) backs the claim on its own.
  c.lektionen[3].sprechen.open.missionOrder = 9;
  assert.deepEqual(examTeileBacked(c).filter((o) => o.nr === 4 && o.teil === 'Sprechen Teil 1'), []);
  // A Schreiben Teil that names the other Textsorte.
  const w = cloneOf(CURRICULUM_A11);
  w.lektionen[0].examTeile = ['Schreiben Teil 2'];
  assert.ok(examTeileBacked(w).some((o) => o.nr === 1 && o.teil === 'Schreiben Teil 2'));
});

test('rule 16: the question is whether the Lektion has a SURFACE for the Teil, not whether it links one', () => {
  // DaF review #7, MAJOR 3: asking only for `links.listeningExercise` reported L5 and L11, two
  // Lektionen that carry their own listening surface — the dictation over two dialogue lines, the
  // very surface the Checkpoints build their Hören part from. Two artefacts and one real finding,
  // reported equally loudly, make the ratchet look like a leftover.
  const c = cloneOf(CURRICULUM_A11);
  for (const l of c.lektionen) {
    if (l.examTeile.some((t) => t.startsWith('Hören'))) {
      assert.ok(l.hoeren?.lines?.length, `L${l.nr} claims a Hören Teil with no dictation lines`);
      l.links.listeningExercise = null;
    }
  }
  assert.deepEqual(
    examTeileBacked(c).filter((o) => o.teil.startsWith('Hören')), [],
    'the dictation is a listening surface; an unlinked external exercise is not a missing one',
  );
  // …and a Teil whose surface is really gone is still reported, per family.
  const gone = cloneOf(CURRICULUM_A11);
  const lesen = gone.lektionen.find((l) => l.examTeile.some((t) => t.startsWith('Lesen')));
  lesen.links.readingOrder = null;
  assert.ok(examTeileBacked(gone).some((o) => o.nr === lesen.nr && o.teil.startsWith('Lesen')));
  const stumm = cloneOf(CURRICULUM_A11);
  const sprechen = stumm.lektionen.find((l) => l.examTeile.some((t) => t.startsWith('Sprechen')));
  sprechen.sprechen.open = null;
  sprechen.sprechen.readAloud = [];
  assert.ok(examTeileBacked(stumm).some((o) => o.nr === sprechen.nr && o.teil.startsWith('Sprechen')));
});

test('rule 12: a can-do is rehearsed at a PRODUCTION surface, not by a silently read dialogue line', () => {
  // DaF review #7, MAJOR 4: the dialogue is read through `hoeren.lines` and `sprechen.readAloud`
  // only — a line the learner meets once in the dialogue and never again is not a rehearsal.
  const c = cloneOf(CURRICULUM_A11);
  const l = c.lektionen[0];
  const outside = l.dialog.lines.findIndex(
    (_, i) => !l.hoeren.lines.includes(i) && !l.sprechen.readAloud.includes(i),
  );
  assert.ok(outside >= 0, 'L1 has no dialogue line outside both production surfaces');
  l.canDo.push('Ich kann einen Elefanten beschreiben.');
  l.dialog.lines[outside].de = 'Der Elefant ist da.';
  assert.ok(
    canDoRehearsal(c).some((o) => o.nr === 1 && /Elefanten/.test(o.line)),
    'a can-do whose only occurrence is a silently read dialogue line must still be reported',
  );
  // The same line, moved onto the read-aloud surface, counts: there the learner speaks it.
  l.sprechen.readAloud = [...l.sprechen.readAloud, outside];
  assert.deepEqual(canDoRehearsal(c).filter((o) => o.nr === 1 && /Elefanten/.test(o.line)), []);
});

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
      const practiceOnly = spec.practiceOnlyTopics || [];
      for (const t of l.practiceRule.topics) {
        assert.ok(l.grammarSlugs.includes(t) || practiceOnly.includes(t), t);
      }
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
      // The sample's LENGTH is RULE 17's business and RULE 17 reads the window off the bank (see
      // „rule 17: every Beispieltext passes the form checklist“ below). The `<= 30` that used to
      // stand here was a third number beside the bank's two, and it contradicted them: 25–45 is
      // the window the learner is graded against (DaF review #12, MAJOR 1).
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
    assert.ok(drawnLexis(C).length <= r.untaughtDrawnTokens, 'RULE 11b');
    assert.equal(canDoRehearsal(C).length, 0, 'RULE 12 (hard rule, no ratchet)');
    assert.ok(missionlessLektionen(C).length <= r.missionlessLektionen, 'RULE 13');
    assert.ok(noticeFormCoverage(C).length <= r.unexemplifiedNoticeForms, 'RULE 6b');
    assert.ok(producedBeforeTaught(C).length <= r.untaughtInProduction, 'RULE 15');
    assert.ok(constructionsBeforeTaught(C).length <= r.deferredConstructions, 'RULE 15b');
    assert.ok(examTeileBacked(C).length <= r.unbackedExamTeile, 'RULE 16');
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
      'a practice topic that is neither a grammar slug nor practice-only': (c) => { c.lektionen[0].practiceRule.topics = [...c.lektionen[0].practiceRule.topics, 'no-such-topic']; },
      'a can-do that is not in ich-Form': (c) => { c.lektionen[0].canDo[0] = 'Du kannst dich vorstellen.'; },
      'a dictation index past the end of the dialogue': (c) => { c.lektionen[0].hoeren.lines = [0, 99]; },
      'hoursTotal that no longer follows from the minutes': (c) => { c.hoursTotal = 40; },
      'a Schreiben task that breaks the alternation': (c) => { c.lektionen[0].schreiben.kind = 'mitteilung'; },
      'the primary slug order scrambled': (c) => {
        const [a, b] = [c.lektionen[0].primarySlug, c.lektionen[1].primarySlug];
        c.lektionen[0].primarySlug = b;
        c.lektionen[1].primarySlug = a;
      },
    };
    for (const [name, mutate] of Object.entries(mutations)) {
      const c = cloneOf(C);
      mutate(c);
      assert.ok(validateCurriculum(c).length > 0, `${spec.code}: not caught: ${name}`);
    }

    // The ratcheted rules, mutated by the ratchet's own slack plus one and asserted by name. A
    // level whose measurement sits well under its ratchet (A1.1's RULE 10 did, after round 6) needs
    // more than one mutation before the rule fires at all — see the note at the top of this file.
    const r = spec.ratchets;

    const c10 = cloneOf(C);
    const need10 = overshoot(wortfeldCoverage(C).length, r.uncoveredWortfeld);
    assert.equal(addUnusedWortfeld(c10, need10), need10, `${spec.code}: not enough room for unused Wortfeld words`);
    assert.ok(failsWith(validateCurriculum(c10), 10), `${spec.code}: not caught: Wortfeld words no input of their Lektion uses`);

    const c11 = cloneOf(C);
    const need11 = overshoot(itemLexis(C).length, r.untaughtItemTokens);
    const extra11 = [...loadExtraItems(spec.level), ...untaughtItems(need11, spec.taskKeyPrefix)];
    assert.ok(failsWith(validateCurriculum(c11, extra11), 11), `${spec.code}: not caught: items built from untaught words`);

    const c11b = cloneOf(C);
    const [extra11b, pool11b] = [loadExtraItems(spec.level), loadPoolItems(spec.level)];
    const need11b = overshoot(drawnLexis(C).length, r.untaughtDrawnTokens);
    assert.equal(plantInDrawnItems(c11b, extra11b, pool11b, need11b), need11b, `${spec.code}: the planted items are no longer drawn`);
    assert.ok(failsWith(validateCurriculum(c11b, extra11b, pool11b), '11b'), `${spec.code}: not caught: served items built from untaught words`);

    const c12 = cloneOf(C);
    const need12 = overshoot(canDoRehearsal(C).length, 0);
    assert.equal(addUnrehearsedCanDos(c12, need12), need12, `${spec.code}: not enough room for unrehearsed can-dos`);
    assert.ok(failsWith(validateCurriculum(c12), 12), `${spec.code}: not caught: can-do lines nothing rehearses`);

    const c13 = cloneOf(C);
    const need13 = overshoot(missionlessLektionen(C).length, r.missionlessLektionen);
    assert.equal(dropMissions(c13, need13), need13, `${spec.code}: not enough missions to drop`);
    assert.ok(failsWith(validateCurriculum(c13), 13), `${spec.code}: not caught: speaking tasks without a mission`);

    const c6b = cloneOf(C);
    const need6b = overshoot(noticeFormCoverage(C).length, r.unexemplifiedNoticeForms);
    assert.equal(addUnexemplifiedNoticeForms(c6b, need6b), need6b, `${spec.code}: not enough room for bolded forms`);
    assert.ok(failsWith(validateCurriculum(c6b), '6b'), `${spec.code}: not caught: a Notice form no input shows`);

    const c15 = cloneOf(C);
    const need15 = overshoot(producedBeforeTaught(C).length, r.untaughtInProduction);
    assert.equal(addProducedVorgriffe(c15, spec, need15), need15, `${spec.code}: no late form to plant`);
    assert.ok(failsWith(validateCurriculum(c15), 15), `${spec.code}: not caught: a Vorgriff in a produced line`);

    const c16 = cloneOf(C);
    const need16 = overshoot(examTeileBacked(C).length, r.unbackedExamTeile);
    assert.equal(unbackExamTeile(c16, need16), need16, `${spec.code}: not enough backed exam Teile to unback`);
    assert.ok(failsWith(validateCurriculum(c16), 16), `${spec.code}: not caught: an examTeile claim nothing backs`);

    // RULE 14 only exists for a level that has a persona table; where there is none the rule is
    // silent by design, and saying so here keeps the silence deliberate rather than accidental.
    const table = PERSONA_TABLES[spec.personaSource] || {};
    const married = Object.entries(table).find(([, p]) => p.familienstand && p.familienstand !== 'verheiratet');
    if (!married) {
      assert.deepEqual(personaConsistency(C), [], `${spec.code}: no persona table, so RULE 14 must be silent`);
    } else {
      const [who] = married;
      const c14 = cloneOf(C);
      const target = c14.lektionen.flatMap((l) => (l.dialog?.lines || []).map((line) => [l, line]))
        .find(([, line]) => line.speaker === who);
      assert.ok(target, `${spec.code}: ${who} speaks in no dialogue`);
      target[1].de = 'Ich bin verheiratet.';
      assert.ok(failsWith(validateCurriculum(c14), 14), `${spec.code}: not caught: a line that contradicts the persona table`);
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
  // never be raised. RULE 13 WAS 3 on the assumption that a mission has to match the SITUATION;
  // DaF review #1 (MAJOR, mission mapping) measured the `target_structures` instead and found a
  // fitting mission for L4 (negation → mission 6), L10 (für/ohne/um → mission 8) and L12
  // (Wortkarten Essen & Trinken → mission 10). Only L11 is left: no A1.2 mission is about weather.
  const r = levelSpec('a1.2').ratchets;
  assert.equal(r.uncoveredWortfeld, 0);
  // RULE 12 is a hard rule with no ratchet at any level (see validate-curriculum.mjs) — measured
  // directly against 0 rather than against a per-level constant.
  assert.equal(canDoRehearsal(CURRICULUM_A12).length, 0, 'RULE 12 (hard rule, no ratchet)');
  assert.ok(r.missionlessLektionen <= 3, 'the ratchet may only ever be lowered');
  assert.deepEqual(missionlessLektionen(CURRICULUM_A12), [11]);
  // RULE 11 stood at 0 while `src/data/lessonPools/a12.json` did not exist, i.e. while it measured
  // nothing. With the built pool on disk (354 items) it measures the LEGACY generated bank: every
  // offending pair sits in a generated item, none in the hand-written `a12.extra.json`. So the
  // ratchet is the measurement, and the hand-written half is pinned separately at zero — that is
  // the half this course wrote and the half a repair round can move.
  assert.ok(itemLexis(CURRICULUM_A12).length <= r.untaughtItemTokens, 'RULE 11 measurement is under its ratchet');
  assert.ok(r.untaughtItemTokens <= 156, 'RULE 11: the ratchet may only ever be lowered');
  const handWritten = new Set(loadExtraItems('a1.2').map((it) => it.id));
  // PAUSED; RE-MEASURED 2026-09-13 (round 11, DaF review #10 MAJOR 3). The item lexicon no longer
  // seeds all FUNCTION_WORDS at Lektion 1 — a function word is taught from the Lektion that first
  // SAYS it (`functionWordsUsedIn` in the validator) — and four hand-written A1.2 items use a
  // function word of A1.2's own list that no A1.2 dialogue or notice ever says. The material may
  // not be touched: A1.2 is paused by owner decision and this is a work order for whoever resumes
  // it, in the same shape as the two ratchets in LEVELS['a1.2'].
  const A12_PAUSED_HAND_WRITTEN = [
    'extra-a12-l01-03:Danach', 'extra-a12-l01-09:Neben', 'extra-a12-l04-09:gibt', 'extra-a12-l04-03:Gibt',
    'extra-a12-l06-05:nichts', 'extra-a12-l09-04:kann', 'extra-a12-l09-08:kann',
  ];
  assert.deepEqual(
    itemLexis(CURRICULUM_A12).filter((o) => handWritten.has(o.id)).map((o) => `${o.id}:${o.token}`)
      .filter((pair) => !A12_PAUSED_HAND_WRITTEN.includes(pair)),
    [],
    'the hand-written A1.2 items must stay free of untaught tokens',
  );
  // RULE 11b: the same tokens measured where the learner MEETS them — 156 over the whole pool
  // becomes 18 over the items the draw actually serves, and those 18 are the repairable list.
  assert.ok(drawnLexis(CURRICULUM_A12).length <= r.untaughtDrawnTokens, 'RULE 11b measurement is under its ratchet');
  assert.ok(r.untaughtDrawnTokens <= 18, 'RULE 11b: the ratchet may only ever be lowered');
  assert.deepEqual(
    drawnLexis(CURRICULUM_A12).filter((o) => handWritten.has(o.id)).map((o) => `${o.id}:${o.token}`)
      .filter((pair) => !A12_PAUSED_HAND_WRITTEN.includes(pair)),
    [],
    'the hand-written A1.2 items must stay free of untaught tokens in the draw too',
  );
});

test('A1.2 ratchets for RULE 6b, 15 and 16 are the measured numbers', () => {
  // Measured on the module at hand-over (2026-09-13): 31 / 1 / 3. The assertions read the
  // measurement and pin the ceiling, so a repair round that LOWERS a number passes and a round that
  // raises one fails — the same shape as the other four ratchets.
  const r = levelSpec('a1.2').ratchets;
  assert.ok(noticeFormCoverage(CURRICULUM_A12).length <= r.unexemplifiedNoticeForms, 'RULE 6b');
  assert.ok(producedBeforeTaught(CURRICULUM_A12).length <= r.untaughtInProduction, 'RULE 15');
  assert.ok(examTeileBacked(CURRICULUM_A12).length <= r.unbackedExamTeile, 'RULE 16');
  assert.ok(r.unexemplifiedNoticeForms <= 31, 'RULE 6b: the ratchet may only ever be lowered');
  assert.ok(r.untaughtInProduction <= 1, 'RULE 15: the ratchet may only ever be lowered');
  assert.ok(r.unbackedExamTeile <= 3, 'RULE 16: the ratchet may only ever be lowered');
});

// ───────────────────────────────────────────────────────────────────────────────────────────────
// THE LEVEL LEXICON (REVIEW #6 MAJOR 4)
//
// `levelLexicon()` + `untaughtTokens()` are the predicate `scripts/build-lesson-pool.mjs` drops
// legacy bank items with, so they need their own bite test: a build step that deletes content is
// only as trustworthy as the question it asks, and „does the course teach this word ANYWHERE?“ has
// to stay a different question from RULE 11's „has it taught it YET?“.
// ───────────────────────────────────────────────────────────────────────────────────────────────

test('levelLexicon knows the whole level, not one Lektion — and nothing the course never teaches', () => {
  const lex = levelLexicon('a1.1');
  // A word taught in the LAST Lektion is in it (RULE 11 would reject it in L1; this must not).
  const last = CURRICULUM_A11.lektionen[CURRICULUM_A11.lektionen.length - 1];
  const lateWord = last.wortfeld.find((w) => /^(der|die|das) /.test(w.de));
  assert.ok(lateWord, 'the last Lektion has no article noun to test with');
  assert.ok(lex.has(lateWord.de.split(' ')[1].toLowerCase()), `${lateWord.de} is taught in L${last.nr} but missing from the lexicon`);
  // The function words and the cast are in it, because an item may use both freely.
  assert.ok(lex.has('ist') && lex.has('nicht'), 'FUNCTION_WORDS are part of the lexicon');
  for (const n of LEVELS['a1.1'].dialogNames) assert.ok(lex.has(String(n).toLowerCase()), `${n} is a DIALOG_NAME`);
  // And the words the five DaF rounds kept finding are NOT — that is the whole point.
  for (const w of ['honig', 'könig', 'instrument', 'freiheit', 'zeitung', 'tom', 'anna']) {
    assert.ok(!lex.has(w), `"${w}" is in the A1.1 lexicon — the untaught-lexis gate would stop dropping it`);
  }
  // A1.2 inherits A1.1 (seedFrom) and is therefore strictly larger.
  const lex12 = levelLexicon('a1.2');
  for (const w of lex) assert.ok(lex12.has(w), `A1.2 lost the A1.1 word "${w}"`);
  assert.ok(lex12.size > lex.size, 'A1.2 teaches nothing of its own?');
  // An unknown level is an empty set, never a throw: the build asks per level.
  assert.equal(levelLexicon('b2.2').size, 0);
});

test('untaughtTokens reads the item the way lexisScan does — cue and formula are not lexis', () => {
  const spec = levelSpec('a1.1');
  const lex = levelLexicon('a1.1');
  const item = (over) => ({ id: 't', topic: 'nouns-gender', questionDe: '', answer: '', accepted: [], ...over });

  // THE BITE. The item the fifth review quotes, with the article cue the build appends.
  assert.deepEqual(
    untaughtTokens(item({ questionDe: 'Schreiben Sie den Satz: [Honig / ist / gut] (mit bestimmtem Artikel)', answer: 'Der Honig ist gut.' }), lex, spec),
    ['Honig'],
    'the Sie-Aufgabenformel and the bracketed cue are not lexis — only Honig is',
  );
  // The A1.2 formula that used to count as lexis, on the level that uses it.
  const spec12 = levelSpec('a1.2');
  assert.deepEqual(
    untaughtTokens(item({ questionDe: 'Schreiben Sie die Zahl in Worten: 340 = ___', answer: 'dreihundertvierzig' }), levelLexicon('a1.2'), spec12),
    ['dreihundertvierzig'],
    'Schreiben/Zahl/Worten are the formula talking, not the item',
  );
  // A cast name is never untaught — and it is in the LEXICON itself (seedVocabulary folds in
  // DIALOG_NAMES), so it is silent with or without a spec. `spec.nameSet` is what keeps a name
  // silent against a per-Lektion snapshot, which is the call RULE 11 makes.
  const name = LEVELS['a1.1'].dialogNames[0];
  assert.deepEqual(untaughtTokens(item({ questionDe: `${name} ist hier.`, answer: 'ist' }), lex, spec), []);
  assert.deepEqual(untaughtTokens(item({ questionDe: `${name} ist hier.`, answer: 'ist' }), lex), []);
  assert.deepEqual(untaughtTokens(item({ questionDe: `${name} ist hier.`, answer: 'ist' }), new Set(['ist', 'hier'])), [name]);
  // …but a name the A1.1 dialogues never use is exactly what the gate must catch.
  assert.deepEqual(untaughtTokens(item({ questionDe: 'Tom, ___ bist mein Freund.', answer: 'du' }), lex, spec), ['Tom']);
  // `accepted` is scanned too — a second answer key may not smuggle a word in.
  assert.deepEqual(untaughtTokens(item({ questionDe: 'Das ist gut.', answer: 'gut', accepted: ['gut', 'Zeitung'] }), lex, spec), ['Zeitung']);
  // One entry per DISTINCT token, in the original case, whatever the repetition.
  assert.deepEqual(untaughtTokens(item({ questionDe: 'Zeitung Zeitung zeitung', answer: 'Zeitung' }), lex, spec), ['Zeitung']);
  // A taught word is silent, and so is an empty item.
  assert.deepEqual(untaughtTokens(item({ questionDe: 'Das ist nicht gut.', answer: 'ist' }), lex, spec), []);
  assert.deepEqual(untaughtTokens(item({}), lex, spec), []);
});

test('the untaught-lexis gate is non-circular: the lexicon does not read the pool', () => {
  // The gate would be worthless if a pool item could teach itself its own word.
  // `levelLexicon` is a pure function of the curriculum, so planting an item is
  // invisible to it — the assertion is that the set is byte-identical before and
  // after the pool on disk grows a word nothing teaches.
  const before = levelLexicon('a1.1');
  const planted = [...loadPoolItems('a1.1'), { id: 'p1', topic: 'nouns-gender', questionDe: 'Der Honig ist gut.', answer: 'Der' }];
  assert.equal(planted.length, loadPoolItems('a1.1').length + 1);
  const after = levelLexicon('a1.1');
  assert.equal(after.size, before.size);
  assert.ok(!after.has('honig'));
});

