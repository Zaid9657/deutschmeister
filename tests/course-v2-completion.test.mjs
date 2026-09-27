// Course v2 — the ONE completion function (src/lib/course-v2/completion.js, SCHEMA §5,
// BLUEPRINT §3.5, PRG-01/02) and the Prüfungsstand / Teil-Karte helpers
// (src/lib/course-v2/board, BLUEPRINT §5.3, §5.6).
//
// What each block defends:
//   1. THE RULES COME FROM course.json — the function reads the completion block and
//      refuses one it cannot honour, so a schema change fails loudly.
//   2. A REAL ATTEMPT — writing ≥ 50 % of the lower word bound and never the prompt pasted
//      back; speaking ≥ 20 s or ≥ 2 turns in a card mode. No score is read anywhere.
//   3. THE UNIT — Lernschritte finished or tested out AND both Aufgaben submitted; a lane
//      variant of an Aufgabe counts for its slot; completion is never taken away.
//   4. THE COURSE — 12 units, P1–P3, the closing block's first form of the LEARNER'S lane
//      (SCHEMA §5 CLOSING: the Halbtest in .1, Modelltest A in .2); never the Diagnose, never
//      Modelltest B/C; works on the authored course.json AND the compiled manifest.
//   5. THE BOARD — numbers only from full-length Prüfungsmodus attempts, the §5.6
//      weighting, no banned word in any label.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  DEFAULT_COMPLETION,
  DEFAULT_COMPLETION_DOT2,
  CLOSING_DOT1,
  CLOSING_DOT2,
  defaultCompletion,
  closingFormFor,
  LERNSCHRITT_KINDS,
  completionRules,
  normalizeLearnerState,
  slotOfBankKey,
  isLernschrittFinished,
  testOutPassed,
  countWords,
  promptEchoShare,
  isAufgabeSubmitted,
  unitCompletion,
  closingFirstForms,
  courseCompletion,
} from '../src/lib/course-v2/completion.js';
import {
  BOARD_RULES,
  BANNED_BOARD_PATTERNS,
  ALLOWED_BOARD_WORDS,
  isQualifying,
  attemptWeight,
  teilValue,
  teilStatus,
  teilLabelDe,
  teilKarte,
  fullLengthChecklist,
} from '../src/lib/course-v2/board/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

// ── a course and two units in the SCHEMA shapes ──────────────────────────────────────
const nr = (i) => String(i).padStart(2, '0');
const COURSE_A21 = {
  level: 'a2.1',
  kind: 'dot1',
  units: Array.from({ length: 12 }, (_, i) => `a2.1-u${nr(i + 1)}`),
  lanes: { primary: 'ga2', secondary: ['ta2'], later: [], live: ['ga2'] },
  plateaus: ['a2.1-p1', 'a2.1-p2', 'a2.1-p3'],
  closing: { halbtest: { ga2: 'a2.1-ht-ga2', ta2: 'a2.1-ht-ta2' }, wiederholungsplan: false },
  completion: DEFAULT_COMPLETION,
};
const COURSE_B12 = {
  level: 'b1.2',
  kind: 'dot2',
  units: Array.from({ length: 12 }, (_, i) => `b1.2-u${nr(i + 1)}`),
  lanes: { primary: 'tb1', secondary: ['dtz'], later: [], live: ['tb1'] },
  plateaus: ['b1.2-p1', 'b1.2-p2', 'b1.2-p3'],
  closing: {
    diagnose: { tb1: 'b1.2-dx-tb1', dtz: 'b1.2-dx-dtz' },
    modelltests: { tb1: ['b1.2-ma-tb1', 'b1.2-mb-tb1', 'b1.2-mc-tb1'], dtz: ['b1.2-ma-dtz', 'b1.2-mb-dtz'] },
    wiederholungsplan: true,
  },
  completion: DEFAULT_COMPLETION_DOT2,
};

const WRITING = {
  bankKey: 'a21-u07-w', title: 'Einen Termin absagen',
  situationDe: 'Sie haben morgen um 14 Uhr eine Besprechung mit Frau Kowalski von der Firma Hansen Bau. Sie können nicht kommen.',
  taskDe: 'Schreiben Sie Frau Kowalski eine E-Mail zu allen drei Punkten (30 bis 40 Wörter).',
  leitpunkte: [
    { id: 'lp1', de: 'Sagen Sie ab und entschuldigen Sie sich.', cues: [] },
    { id: 'lp2', de: 'Nennen Sie einen Grund.', cues: [] },
    { id: 'lp3', de: 'Schlagen Sie einen neuen Termin vor.', cues: [] },
  ],
  wordBand: [30, 40], minSubmitWords: 15,
};
const SPEAKING = { bankKey: 'a21-u07-s', mode: 'cards-ask', instructionsDe: 'Fragen und antworten Sie.' };
const UNIT_A = {
  id: 'a2.1-u07',
  steps: [
    { id: 'a2.1-u07-ls1', kind: 'situation' },
    { id: 'a2.1-u07-ls2', kind: 'situation' },
    { id: 'a2.1-u07-ls3', kind: 'situation' },
    { id: 'a2.1-u07-ls4', kind: 'pruefung' },
    { id: 'a2.1-u07-ls5', kind: 'sprechen', task: SPEAKING },
    { id: 'a2.1-u07-ls6', kind: 'schreiben', task: WRITING },
    { id: 'a2.1-u07-ls7', kind: 'check' },
  ],
};
const UNIT_B = {
  id: 'b1.2-u03',
  steps: [
    { id: 'b1.2-u03-ls1', kind: 'text' },
    { id: 'b1.2-u03-ls2', kind: 'text' },
    { id: 'b1.2-u03-ls3', kind: 'sprache' },
    { id: 'b1.2-u03-ls4', kind: 'pruefung' },
    { id: 'b1.2-u03-ls5', kind: 'sprechen', task: { bankKey: 'b12-u03-s', mode: 'plan-together' } },
    { id: 'b1.2-u03-ls6', kind: 'schreiben', task: { bankKey: 'b12-u03-w', wordBand: [80, 100], wordBandLearning: [60, 80] } },
    { id: 'b1.2-u03-ls7', kind: 'ueberarbeiten', of: 'b12-u03-w' },
    { id: 'b1.2-u03-ls8', kind: 'check' },
  ],
};
const DETERMINISTIC_A = UNIT_A.steps.filter((s) => LERNSCHRITT_KINDS.includes(s.kind)).map((s) => s.id);
const REAL_TEXT = 'Liebe Frau Kowalski, leider kann ich morgen nicht zu unserer Besprechung kommen. Ich muss zum Arzt.';

// ---------------------------------------------------------------------------
// 1. Rules
// ---------------------------------------------------------------------------

test('the rules are read from course.json, with the SCHEMA defaults only for gaps', () => {
  const rules = completionRules({ completion: { unit: { testOutThreshold: 0.75 } } });
  assert.equal(rules.unit.testOutThreshold, 0.75);
  assert.deepEqual([...rules.unit.completeWhen], ['lernschritte-finished-or-tested-out', 'aufgaben-submitted']);
  assert.equal(rules.aufgabe.submittedWhen.speakingMinSeconds, 20);
  assert.deepEqual(completionRules({}).course.required.map((r) => r.count), [12, 3, 1]);
  const custom = completionRules({ completion: { course: { required: [{ kind: 'unit', status: 'complete', count: 2 }], neverRequired: [] } } });
  const two = courseCompletion({ ...COURSE_A21, completion: { course: custom.course } }, { progress: { 'a2.1-u01': 'complete', 'a2.1-u02': 'gold' } });
  assert.equal(two.complete, true, 'the count comes from the data, not from this module');
});

test('a completion block this module cannot honour fails loudly', () => {
  assert.throws(() => completionRules({ completion: { unit: { completeWhen: ['score-above-60'] } } }), /unknown unit condition/);
  assert.throws(() => completionRules({ completion: { course: { required: [{ kind: 'fokus', status: 'complete', count: 1 }] } } }), /unknown required kind/);
  assert.throws(() => completionRules({ completion: { course: { required: [{ kind: 'unit', status: 'passed', count: 12 }] } } }), /unknown required status/);
  assert.throws(
    () => completionRules({ completion: { course: { required: [{ kind: 'unit', status: 'complete', count: 12 }], neverRequired: ['unit'] } } }),
    /both required and never required/,
  );
  assert.throws(() => completionRules({ completion: { lernschritt: { finishedWhen: 'all-items-correct' } } }), /finishedWhen/);
  // the SCHEMA §5 CLOSING entry: only 'learner' or a lane id, only Modelltest forms a–c, never a neverRequired form
  const closing = (entry, never) => ({ completion: { course: { required: [entry], ...(never ? { neverRequired: never } : {}) } } });
  assert.throws(() => completionRules(closing({ kind: 'halbtest', lane: 'somebody', status: 'submitted' })), /unknown required lane/);
  assert.throws(() => completionRules(closing({ kind: 'halbtest', status: 'submitted' })), /unknown required lane/);
  assert.throws(() => completionRules(closing({ kind: 'modelltest', form: 'd', lane: 'learner', status: 'submitted' })), /unknown Modelltest form/);
  assert.throws(() => completionRules(closing({ kind: 'modelltest', form: 'b', lane: 'learner', status: 'submitted' })), /'modelltest:b' is both required and never required/);
  assert.throws(() => completionRules(closing({ kind: 'halbtest', form: 'a', lane: 'learner', status: 'submitted' })), /takes no form/);
  assert.throws(() => completionRules(closing({ kind: 'diagnose', lane: 'learner', status: 'submitted' })), /unknown required kind/);
  assert.throws(() => completionRules(closing({ kind: 'closing', status: 'submitted', count: 1 })), /unknown required kind/, 'the pre-revision form is gone');
});

test('the SCHEMA §5 defaults: CLOSING by course kind, the Diagnose never required, form tasks by their fields', () => {
  assert.deepEqual(DEFAULT_COMPLETION.course.required[2], CLOSING_DOT1);
  assert.deepEqual(DEFAULT_COMPLETION_DOT2.course.required[2], CLOSING_DOT2);
  assert.deepEqual(CLOSING_DOT1, { kind: 'halbtest', lane: 'learner', status: 'submitted' });
  assert.deepEqual(CLOSING_DOT2, { kind: 'modelltest', form: 'a', lane: 'learner', status: 'submitted' });
  assert.equal(defaultCompletion('dot2'), DEFAULT_COMPLETION_DOT2);
  assert.equal(defaultCompletion('dot1'), DEFAULT_COMPLETION);
  for (const d of [DEFAULT_COMPLETION, DEFAULT_COMPLETION_DOT2]) {
    assert.ok(d.course.neverRequired.includes('diagnose'));
    assert.equal(d.aufgabe.submittedWhen.formAllFieldsNonEmpty, true);
  }
  // a course.json without a course block takes the default of its kind
  assert.equal(completionRules({ kind: 'dot2' }).course.required[2].kind, 'modelltest');
  assert.equal(completionRules({ kind: 'dot1' }).course.required[2].kind, 'halbtest');
  const form = { bankKey: 'a11-u05-w', form: { fields: [{ id: 'f1', labelDe: 'Name', answer: 'Kaya' }, { id: 'f2', labelDe: 'PLZ', answer: '04109' }] } };
  assert.equal(isAufgabeSubmitted(form, { fields: { f1: 'Kaya', f2: '04109' } }), true);
  assert.equal(isAufgabeSubmitted(form, { values: { f1: 'Keya', f2: '0000' } }), true, 'wrong but non-empty fields are a real attempt');
  assert.equal(isAufgabeSubmitted(form, { fields: { f1: 'Kaya', f2: '  ' } }), false, 'every field must be filled');
  assert.equal(isAufgabeSubmitted(form, { fields: { f1: 'Kaya' } }, { aufgabe: { submittedWhen: { formAllFieldsNonEmpty: false } } }), true);
  assert.equal(isAufgabeSubmitted(form, { words: 40 }), false, 'a form is never judged by words');
});

test('no score is ever required — the SCHEMA block says so and the module reads none', () => {
  assert.ok(DEFAULT_COMPLETION.course.neverRequired.includes('score'));
  const code = read('src/lib/course-v2/completion.js').split('\n').filter((l) => !/^\s*(\/\/|\*)/.test(l)).join('\n');
  assert.ok(!/\.(score|total_score|accuracy|pct)\b/.test(code), 'completion must not read a score field');
});

// ---------------------------------------------------------------------------
// 2. A real attempt
// ---------------------------------------------------------------------------

test('a Lernschritt is finished when every served item was answered, right or wrong', () => {
  assert.equal(isLernschrittFinished(['a', 'b', 'c'], ['c', 'a', 'b', 'x']), true);
  assert.equal(isLernschrittFinished(['a', 'b', 'c'], ['a', 'b']), false);
  assert.equal(isLernschrittFinished([], ['a']), false, 'nothing served is not finished');
});

test('test-out passes at the threshold, not below', () => {
  assert.equal(testOutPassed({ correct: 12, total: 15 }), true); // 0.8
  assert.equal(testOutPassed({ correct: 11, total: 15 }), false);
  assert.equal(testOutPassed({ correct: 0, total: 0 }), false);
  assert.equal(testOutPassed({ correct: 9, total: 12 }, 0.75), true);
});

test('writing counts from 50 % of the lower word bound, never as the prompt pasted back', () => {
  assert.equal(countWords('  Liebe Frau Kowalski , leider  –  nicht. '), 5);
  assert.equal(isAufgabeSubmitted(WRITING, { text: REAL_TEXT }), true, `${countWords(REAL_TEXT)} words ≥ 15`);
  assert.equal(isAufgabeSubmitted(WRITING, { text: 'Liebe Frau Kowalski, ich kann nicht kommen. Viele Grüße' }), false, '9 words < 15');
  assert.equal(isAufgabeSubmitted(WRITING, { text: '' }), false);
  assert.equal(isAufgabeSubmitted(WRITING, { words: 15 }), true);
  assert.equal(isAufgabeSubmitted(WRITING, { words: 14 }), false);
  const pasted = `${WRITING.situationDe} ${WRITING.leitpunkte.map((l) => l.de).join(' ')}`;
  assert.ok(countWords(pasted) >= 15);
  assert.ok(promptEchoShare(pasted, [WRITING.situationDe, ...WRITING.leitpunkte.map((l) => l.de)]) >= 0.8);
  assert.equal(isAufgabeSubmitted(WRITING, { text: pasted }), false, 'the prompt pasted back is not an attempt');
  assert.equal(isAufgabeSubmitted(WRITING, { text: REAL_TEXT, pastedPrompt: true }), false);
  assert.ok(promptEchoShare(REAL_TEXT, [WRITING.situationDe]) < 0.8, 'reusing prompt words is fine');
  // The band the learner was given: .1 B courses write to wordBandLearning.
  const b = UNIT_B.steps[5].task;
  assert.equal(isAufgabeSubmitted(b, { words: 30 }), true, '50 % of the learning band 60');
  assert.equal(isAufgabeSubmitted(b, { words: 29 }), false);
});

test('speaking counts from 20 s of speech, or 2 turns in a card mode only', () => {
  assert.equal(isAufgabeSubmitted(SPEAKING, { speechSeconds: 20 }), true);
  assert.equal(isAufgabeSubmitted(SPEAKING, { speechSeconds: 19, turns: 1 }), false);
  assert.equal(isAufgabeSubmitted(SPEAKING, { speechSeconds: 5, turns: 2 }), true, 'cards-ask: two turns');
  const monologue = { bankKey: 'b22-u02-s', mode: 'monologue' };
  assert.equal(isAufgabeSubmitted(monologue, { speechSeconds: 5, turns: 4 }), false, 'turns count only in a card mode');
  assert.equal(isAufgabeSubmitted(monologue, { speechSeconds: 45 }), true);
  // Micro-outputs share the rule (the player asks before grading).
  assert.equal(isAufgabeSubmitted({ mode: 'written', words: [8, 30] }, { text: 'Entschuldigung, ich komme heute zu spät.' }), true);
  assert.equal(isAufgabeSubmitted({ mode: 'spoken', seconds: [30, 40] }, { speechSeconds: 12, turns: 3 }), false);
  assert.equal(isAufgabeSubmitted(null, { words: 99 }), false);
});

test('a score on the attempt changes nothing', () => {
  assert.equal(isAufgabeSubmitted(WRITING, { words: 20, score: 0, total_score: 0 }), true);
  assert.equal(isAufgabeSubmitted(WRITING, { words: 3, score: 20 }), false);
});

// ---------------------------------------------------------------------------
// 3. The unit
// ---------------------------------------------------------------------------

test('a unit is complete only with every Lernschritt finished AND both Aufgaben submitted', () => {
  const none = unitCompletion(UNIT_A, {}, DEFAULT_COMPLETION);
  assert.equal(none.complete, false);
  assert.equal(none.status, null);
  assert.deepEqual(none.lernschritte, { done: 0, total: 5, missing: DETERMINISTIC_A });
  assert.deepEqual(none.aufgaben, { done: 0, total: 2, missing: ['a21-u07-s', 'a21-u07-w'] });

  const lsOnly = unitCompletion(UNIT_A, { finishedSteps: DETERMINISTIC_A });
  assert.equal(lsOnly.lernschritteFinished, true);
  assert.equal(lsOnly.complete, false, 'Lernschritte alone do not complete a unit');
  assert.equal(lsOnly.status, 'started');

  const full = unitCompletion(UNIT_A, { finishedSteps: DETERMINISTIC_A, submitted: ['a21-u07-s', 'a21-u07-w'] });
  assert.equal(full.complete, true);
  assert.equal(full.status, 'complete');
});

test('the attempts are judged here when the caller hands in raw evidence', () => {
  const state = {
    finishedSteps: DETERMINISTIC_A,
    attempts: { 'a21-u07-s': [{ speechSeconds: 8, turns: 1 }], 'a21-u07-w': [{ text: 'Hallo.' }] },
  };
  assert.equal(unitCompletion(UNIT_A, state).aufgabenSubmitted, false);
  state.attempts['a21-u07-s'].push({ speechSeconds: 24 });
  state.attempts['a21-u07-w'].push({ text: REAL_TEXT });
  assert.equal(unitCompletion(UNIT_A, state).complete, true);
});

test('„Ich kann das schon" credits the deterministic Lernschritte, the Aufgaben stay open', () => {
  const tested = unitCompletion(UNIT_A, { progress: { 'a2.1-u07': 'tested_out' } });
  assert.equal(tested.testedOut, true);
  assert.equal(tested.lernschritteFinished, true);
  assert.equal(tested.complete, false);
  assert.equal(tested.status, 'tested_out');
  const done = unitCompletion(UNIT_A, { progress: { 'a2.1-u07': 'tested_out' }, submitted: ['a21-u07-s', 'a21-u07-w'] });
  assert.equal(done.complete, true);
});

test('a lane variant of an Aufgabe counts for its slot', () => {
  assert.equal(slotOfBankKey('a21-u07-w-ta2'), 'a21-u07-w');
  assert.equal(slotOfBankKey('a22-ma-w1-ga2'), 'a22-ma-w1');
  const st = { finishedSteps: DETERMINISTIC_A, submitted: ['a21-u07-s-ta2', 'a21-u07-w-ta2'] };
  assert.equal(unitCompletion(UNIT_A, st).complete, true);
});

test('B units: Überarbeiten never decides completion; unknown step kinds are held to the strict rule', () => {
  const ls = UNIT_B.steps.filter((s) => LERNSCHRITT_KINDS.includes(s.kind)).map((s) => s.id);
  const r = unitCompletion(UNIT_B, { finishedSteps: ls, submitted: ['b12-u03-s', 'b12-u03-w'] });
  assert.equal(r.complete, true);
  assert.deepEqual(r.optional, [{ id: 'b1.2-u03-ls7', kind: 'ueberarbeiten', done: false }]);
  const odd = { id: 'b1.2-u04', steps: [...UNIT_B.steps, { id: 'b1.2-u04-ls9', kind: 'future-kind' }] };
  assert.equal(unitCompletion(odd, { finishedSteps: ls, submitted: ['b12-u03-s', 'b12-u03-w'] }).complete, false);
});

test('completion is never taken away, and gold stays gold', () => {
  assert.equal(unitCompletion(UNIT_A, { progress: { 'a2.1-u07': 'complete' } }).complete, true);
  const gold = unitCompletion(UNIT_A, { progress: [{ lektion_id: 'a2.1-u07', status: 'gold' }] });
  assert.equal(gold.complete, true);
  assert.equal(gold.status, 'gold');
});

test('learner state normalises from rows, objects, Maps and Sets alike', () => {
  const a = normalizeLearnerState({ progress: [{ lektion_id: 'x', status: 'complete' }], submitted: new Set(['a21-u07-w-ta2']) });
  const b = normalizeLearnerState({ progress: new Map([['x', 'complete']]), submitted: ['a21-u07-w'] });
  assert.equal(a.progress.get('x'), b.progress.get('x'));
  assert.deepEqual([...a.submittedSlots], [...b.submittedSlots]);
  assert.deepEqual([...normalizeLearnerState(undefined).progress], []);
});

// ---------------------------------------------------------------------------
// 4. The course
// ---------------------------------------------------------------------------

const allDone = (course, extra = {}) => ({
  ...Object.fromEntries(course.units.map((u) => [u, 'complete'])),
  ...Object.fromEntries(course.plateaus.map((p) => [p, 'complete'])),
  ...extra,
});

test('a .1 course: 12 units + P1–P3 + the Halbtest of the learner\'s lane', () => {
  assert.deepEqual(closingFirstForms(COURSE_A21), ['a2.1-ht-ga2', 'a2.1-ht-ta2']);
  const noClosing = courseCompletion(COURSE_A21, { progress: allDone(COURSE_A21) });
  assert.equal(noClosing.complete, false);
  assert.deepEqual(noClosing.parts.map((p) => [p.kind, p.done, p.count]), [['unit', 12, 12], ['plateau', 3, 3], ['halbtest', 0, 1]]);
  assert.equal(noClosing.parts[2].lane, 'ga2', 'no learner_goals lane: the course\'s primary lane');
  assert.deepEqual(noClosing.parts[2].missing, ['a2.1-ht-ga2']);
  assert.equal(noClosing.done, 15);
  assert.equal(noClosing.total, 16);
  const ga2 = courseCompletion(COURSE_A21, { progress: allDone(COURSE_A21, { 'a2.1-ht-ga2': 'complete' }) });
  assert.equal(ga2.complete, true);
  assert.equal(ga2.share, 1);
  // the learner's lane decides: a ta2 learner needs the ta2 Halbtest, a ga2 learner the ga2 one
  const ta2Done = allDone(COURSE_A21, { 'a2.1-ht-ta2': 'complete' });
  assert.equal(courseCompletion(COURSE_A21, { progress: ta2Done, lane: 'ta2' }).complete, true);
  assert.equal(courseCompletion(COURSE_A21, { progress: ta2Done, lane: 'ga2' }).complete, false, 'another lane\'s Halbtest does not count');
  assert.equal(courseCompletion(COURSE_A21, { progress: ta2Done }).complete, false);
  // a learner lane the course has no Halbtest for falls back to the primary lane
  assert.equal(closingFormFor(COURSE_A21, CLOSING_DOT1, 'dtz'), 'a2.1-ht-ga2');
  assert.equal(closingFormFor(COURSE_A21, CLOSING_DOT1, 'ta2'), 'a2.1-ht-ta2');
});

test('a tested-out or started unit is not a complete unit', () => {
  const progress = allDone(COURSE_A21, { 'a2.1-ht-ga2': 'gold', 'a2.1-u05': 'tested_out', 'a2.1-u06': 'started' });
  const r = courseCompletion(COURSE_A21, { progress });
  assert.equal(r.complete, false);
  assert.deepEqual(r.parts[0].missing, ['a2.1-u05', 'a2.1-u06']);
});

test('a .2 course closes with Modelltest A of the learner\'s lane — never the Diagnose, never B or C alone', () => {
  assert.deepEqual(closingFirstForms(COURSE_B12), ['b1.2-ma-tb1', 'b1.2-ma-dtz']);
  for (const [extra, complete] of [
    [{ 'b1.2-dx-tb1': 'complete' }, false],
    [{ 'b1.2-mb-tb1': 'complete', 'b1.2-mc-tb1': 'complete' }, false],
    [{ 'b1.2-ma-dtz': 'complete' }, false],
    [{ 'b1.2-ma-tb1': 'complete' }, true],
  ]) {
    assert.equal(courseCompletion(COURSE_B12, { progress: allDone(COURSE_B12, extra) }).complete, complete, JSON.stringify(extra));
  }
  const dtz = { ...allDone(COURSE_B12), 'b1.2-dx-dtz': 'complete', 'b1.2-mb-dtz': 'complete' };
  assert.equal(courseCompletion(COURSE_B12, { progress: dtz, lane: 'dtz' }).complete, false, 'a DTZ learner\'s Diagnose and form B do not close the course');
  const r = courseCompletion(COURSE_B12, { progress: { ...dtz, 'b1.2-ma-dtz': 'gold' }, lane: 'dtz' });
  assert.equal(r.complete, true);
  assert.deepEqual([r.parts[2].kind, r.parts[2].form, r.parts[2].lane, r.parts[2].doneIds], ['modelltest', 'a', 'dtz', ['b1.2-ma-dtz']]);
});

test('every authored course.json carries the SCHEMA §5 CLOSING of its kind and is readable', () => {
  for (const level of ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2']) {
    const p = `content/course-v2/${level}/course.json`;
    if (!existsSync(join(ROOT, p))) continue;
    const course = readJson(p);
    const rules = completionRules(course);
    assert.deepEqual(rules, completionRules({ kind: course.kind, completion: defaultCompletion(course.kind) }), `${level}: the SCHEMA block of kind ${course.kind}`);
    const empty = courseCompletion(course, {});
    assert.equal(empty.complete, false);
    assert.equal(empty.total, 16, level);
    const closing = empty.parts[2];
    assert.equal(closing.lane, course.lanes.primary, `${level}: the primary lane by default`);
    assert.equal(closing.missing.length, 1, `${level}: the closing form exists in course.closing`);
    const done = courseCompletion(course, { progress: allDone(course, { [closing.missing[0]]: 'complete' }) });
    assert.equal(done.complete, true, level);
    for (const dx of Object.values(course.closing.diagnose || {})) {
      assert.equal(courseCompletion(course, { progress: allDone(course, { [dx]: 'complete' }) }).complete, false, `${level}: a submitted Diagnose never completes the course`);
    }
  }
});

// SCHEMA §5 revision (2026-09-27): the closing entry is { kind: 'halbtest' | 'modelltest', lane: 'learner' }.
test('the SCHEMA fixture (authored course.json + unit) and its compiled forms agree', () => {
  const coursePath = 'content/course-v2/fixtures/registries/a2.1/course.json';
  const unitPath = 'content/course-v2/fixtures/a2.1-u07.json';
  if (!existsSync(join(ROOT, coursePath)) || !existsSync(join(ROOT, unitPath))) {
    console.warn('SKIP: the SCHEMA §15 fixture is not in content/course-v2/fixtures yet.');
    return;
  }
  const course = readJson(coursePath);
  const unit = readJson(unitPath);
  assert.deepEqual(completionRules(course), completionRules({ completion: DEFAULT_COMPLETION }), 'the fixture carries the SCHEMA §5 block');
  const empty = courseCompletion(course, {});
  assert.equal(empty.total, 16);
  assert.equal(empty.complete, false);
  const ls = unit.steps.filter((s) => LERNSCHRITT_KINDS.includes(s.kind)).map((s) => s.id);
  const aufgaben = unit.steps.filter((s) => s.task).map((s) => s.task.bankKey);
  assert.deepEqual(aufgaben, ['a21-u07-s', 'a21-u07-w']);
  assert.equal(unitCompletion(unit, { finishedSteps: ls, submitted: aufgaben }, course.completion).complete, true);
  const schreiben = unit.steps.find((s) => s.kind === 'schreiben').task;
  assert.equal(isAufgabeSubmitted(schreiben, { text: schreiben.modelText }), true, 'the model text is a real attempt');
  // A compiled manifest lists units as objects ({ unit: 'a2.1-u01', … }); same answer.
  const manifest = { ...course, units: course.units.map((id, i) => ({ unit: id, nr: i + 1 })) };
  const progress = allDone(course, { 'a2.1-ht-ga2': 'complete' });
  assert.equal(courseCompletion(manifest, { progress }).complete, true);
  assert.deepEqual(courseCompletion(manifest, { progress }), courseCompletion(course, { progress }));
});

test('every compiled level manifest is readable by the completion function', () => {
  const dir = join(ROOT, 'src/data/course-v2');
  if (!existsSync(dir)) {
    console.warn('SKIP: no compiled course-v2 levels in src/data/course-v2 yet.');
    return;
  }
  for (const level of ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2']) {
    for (const name of ['course.json', 'manifest.json']) {
      const p = join(dir, level, name);
      if (!existsSync(p)) continue;
      const course = JSON.parse(readFileSync(p, 'utf8'));
      const r = courseCompletion(course, {});
      assert.equal(r.complete, false, `${level}: an empty learner cannot be complete`);
      assert.ok(r.total > 0, `${level}: nothing is required`);
    }
  }
});

// ---------------------------------------------------------------------------
// 5. The board
// ---------------------------------------------------------------------------

const NOW = new Date('2026-11-01T12:00:00Z');
const daysAgo = (d) => new Date(NOW.getTime() - d * 86400000).toISOString();
const row = (over) => ({
  teil: 'ga2.h1', source: 'ls4', mode: 'pruefung', full_length: true, raw_score: 3, raw_max: 5, ai_range: null, created_at: daysAgo(1), ...over,
});

test('only full-length Prüfungsmodus attempts make a number', () => {
  assert.equal(isQualifying(row()), true);
  assert.equal(isQualifying(row({ mode: 'lern' })), false);
  assert.equal(isQualifying(row({ full_length: false })), false);
  assert.equal(isQualifying(row({ raw_max: 0 })), false);
  assert.equal(teilValue([row({ mode: 'lern' }), row({ full_length: false })], { now: NOW }), null);
});

test('Teil value: last five, Modelltest × 1.5, older than 21 days × 0.5', () => {
  assert.equal(attemptWeight(row({ source: 'modelltest' }), NOW), 1.5);
  assert.equal(attemptWeight(row({ created_at: daysAgo(22) }), NOW), 0.5);
  assert.equal(attemptWeight(row({ source: 'modelltest', created_at: daysAgo(30) }), NOW), 0.75);
  const v = teilValue([row({ raw_score: 5 }), row({ raw_score: 0, source: 'modelltest' })], { now: NOW });
  assert.ok(Math.abs(v.value - (1 * 1 + 0 * 1.5) / 2.5) < 1e-9);
  const six = [0, 1, 2, 3, 4, 5].map((d) => row({ raw_score: d === 5 ? 0 : 5, created_at: daysAgo(d + 1) }));
  assert.equal(teilValue(six, { now: NOW }).value, 1, 'the sixth-newest attempt is out');
  assert.equal(teilValue(six, { now: NOW }).attempts, BOARD_RULES.lastAttempts);
});

test('AI-graded Teile carry a range; miniatures are never scaled up', () => {
  const ai = teilStatus('tb1.sa', [row({ teil: 'tb1.sa', raw_score: 24, raw_max: 45, ai_range: [21, 27] })], { now: NOW });
  assert.equal(ai.state, 'voll');
  assert.equal(teilLabelDe(ai), 'in voller Länge geübt – Übungswert 21–27/45');
  const exact = teilStatus('ga2.h1', [row({ raw_score: 11, raw_max: 15 })], { now: NOW });
  assert.equal(teilLabelDe(exact), 'in voller Länge geübt – Übungswert 11/15');
  const mini = teilStatus('ga2.h1', [row({ full_length: false, mode: 'lern', raw_score: 2, raw_max: 3 })], { now: NOW });
  assert.equal(mini.state, 'klein');
  assert.deepEqual(mini.mini, { raw: 2, max: 3 });
  assert.equal(teilLabelDe(mini), 'im Kleinen geübt');
  assert.equal(teilLabelDe(teilStatus('ga2.s1', [], {}), { comesIn: 'A2.2, Lektion 2' }), 'kommt in A2.2, Lektion 2');
});

test('the Teil-Karte is one line per Teil, never a total, and uses only allowed words', () => {
  const rows = [row({ raw_score: 4 }), row({ teil: 'ga2.l2', full_length: false, mode: 'lern' })];
  const karte = teilKarte([{ template: 'ga2.h1' }, { template: 'ga2.l2' }, { template: 'ga2.sp3', comesIn: 'A2.2, Lektion 3' }], rows, { now: NOW });
  assert.deepEqual(karte.map((k) => k.state), ['voll', 'klein', 'offen']);
  for (const k of karte) {
    for (const banned of BANNED_BOARD_PATTERNS) assert.ok(!banned.test(k.label), `„${k.label}" uses a banned phrase`);
  }
  assert.ok(ALLOWED_BOARD_WORDS.some((w) => karte[0].label.includes(w)));
  assert.ok(!karte.some((k) => /\/100\b|gesamt/i.test(k.label)), 'no total on a Teil-Karte');
  assert.ok(BANNED_BOARD_PATTERNS.some((p) => p.test('Sie haben bestanden')));
  assert.ok(BANNED_BOARD_PATTERNS.some((p) => p.test('in 3 Wochen prüfungsreif')));
});

test('the checklist counts Teile practised twice in full length', () => {
  const rows = [row(), row(), row({ teil: 'ga2.l1' }), row({ teil: 'ga2.s1', full_length: false })];
  assert.deepEqual(fullLengthChecklist(['ga2.h1', 'ga2.l1', 'ga2.s1'], rows), { total: 3, practisedOnce: 2, practisedEnough: 1 });
});
