// The assessments measure what they claim (2026-10-07, Codex all-aspects review — each defect
// below was verified against the code before this suite was written, and each test fails on the
// code that had the defect).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreListeningAnswers } from '../src/services/examScoring.js';

const MOCK = {
  sections: [
    { key: 'hoeren', parts: [{ key: 'h1', type: 'listening', level: 'A1', exerciseNumber: 1 }] },
    { key: 'lesen', parts: [{ key: 'l1', type: 'mc-group', items: [{ id: 'q1', answer: 'a' }] }] },
  ],
};

test('final test: a listening part whose keys are not loaded is INCOMPLETE, never a silent zero-point section', () => {
  // Resuming after the Hören section never mounts it, so no keys were registered. The old
  // scorer returned { score: 0, max: 0 } and listening silently left the denominator.
  const none = scoreListeningAnswers(MOCK, {}, {});
  assert.equal(none.complete, false);
  assert.deepEqual(none.missing, ['h1']);
  const keys = { h1: [{ id: 'a', correct: 'x' }, { id: 'b', correct: 'y' }] };
  const scored = scoreListeningAnswers(MOCK, keys, { 'listening:h1:a': 'x', 'listening:h1:b': 'z' });
  assert.deepEqual(scored, { complete: true, missing: [], score: 1, max: 2 });
});

test('final test: the runner loads missing listening keys and refuses to submit without them', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/pages/Modelltest/ModelltestRun.jsx', import.meta.url), 'utf8');
  assert.match(src, /await loadMissingListeningKeys\(snapshot\)/);
  assert.match(src, /if \(!listening\.complete\) \{\s*setFinishing\(false\);/, 'no submission while listening keys are missing');
  assert.doesNotMatch(src, /Object\.entries\(listeningKeysRef\.current\)/, 'the on-screen-only scorer is gone');
});

test('checkpoint: self-confirming a line keeps its measured mic result — a failed Sprechen section cannot disappear', async () => {
  const { selfConfirmedResult } = await import('../src/lib/lesson/readaloud.js');
  const { isMicResult } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const measured = { pct: 0.2 };
  const after = selfConfirmedResult(measured, 3);
  assert.equal(after.pct, 0.2, 'the measurement stands');
  assert.equal(after.usedMic, true);
  assert.equal(after.selfConfirmed, true);
  assert.ok(isMicResult(after), 'so the checkpoint still scores the section');
  const never = selfConfirmedResult(null, 0);
  assert.deepEqual([never.pct, never.usedMic], [null, false], 'only a line that was never measured is "no mic"');
  const { readFileSync } = await import('node:fs');
  const line = readFileSync(new URL('../src/components/lesson/ReadAloudLine.jsx', import.meta.url), 'utf8');
  assert.match(line, /onResultRef\.current\?\.\(selfConfirmedResult\(result, attempts\)\)/, 'the component reports through the rule');
});

test('checkpoint: answering the same option everywhere never passes a section (always-„Richtig" scored 50 % on reading)', async () => {
  const { buildCheckpoint, scoreCheckpoint } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const { readFileSync } = await import('node:fs');
  const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url), 'utf8'));
  for (const checkpoint of CURRICULUM_A11.checkpoints) {
    const items = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint, pool });
    const lesen = items.filter((i) => i.section === 'lesen');
    // Everything else answered perfectly, reading answered „Richtig" throughout.
    const answers = Object.fromEntries(items.map((i) => [i.id, i.section === 'lesen' ? 'Richtig' : i.answer]));
    const r = scoreCheckpoint(items, answers);
    assert.ok(r.sections.lesen.correct <= r.sections.lesen.guessCeiling, `${checkpoint.id}: the constant answer reaches the ceiling`);
    assert.equal(r.passed, false, `${checkpoint.id}: a constant answer on reading must not pass the checkpoint`);
    // …while genuinely reading passes.
    const honest = scoreCheckpoint(items, Object.fromEntries(items.map((i) => [i.id, i.answer])));
    assert.equal(honest.sections.lesen.pct, 100);
    assert.ok(lesen.length >= 4);
  }
});

test('dictation: a spelled line ending in a full stop accepts the joined word; spoken numbers accept digits', async () => {
  const { checkAnswer, checkOptionsFor, RESULT } = await import('../src/lib/lesson/check.js');
  const dict = (answer) => ({ id: 'd', kind: 'dictation', type: 'dictation', answer, accepted: [answer] });
  const check = (item, input) => checkAnswer(input, item.accepted, checkOptionsFor(item)).result;
  const spelled = dict('C-H-A-K-I-R-I.');
  for (const input of ['Chakiri', 'CHAKIRI', 'C-H-A-K-I-R-I', 'C H A K I R I']) assert.equal(check(spelled, input), RESULT.CORRECT, input);
  assert.notEqual(check(spelled, 'Chakira'), RESULT.CORRECT);
  const phone = dict('Null vier zwei – drei drei acht eins.');
  for (const input of ['042 3381', '0423381', '042-3381', 'null vier zwei drei drei acht eins']) assert.equal(check(phone, input), RESULT.CORRECT, input);
  assert.equal(check(phone, '042 3382'), RESULT.WRONG, 'a wrong digit is still wrong');
  const age = dict('Er ist zwanzig.');
  assert.equal(check(age, 'Er ist 20.'), RESULT.CORRECT);
  assert.equal(check(age, 'Er ist 21.'), RESULT.WRONG);
  assert.equal(check(dict('Ich brauche ein Handy.'), 'Ich brauche ein Handy.'), RESULT.CORRECT, 'the article ein is not a number');
});

test('dictation numbers: a different number is never "just a typo", and umlaut-free spellings still count (Codex review of the fix)', async () => {
  const { checkAnswer, checkOptionsFor, RESULT } = await import('../src/lib/lesson/check.js');
  const dict = (answer) => ({ id: 'd', kind: 'dictation', type: 'dictation', answer, accepted: [answer] });
  const check = (item, input) => checkAnswer(input, item.accepted, checkOptionsFor(item)).result;
  assert.equal(check(dict('Er ist zwanzig.'), 'Er ist neunzig.'), RESULT.WRONG, '90 for 20 is a wrong number, not a typo');
  assert.equal(check(dict('Null vier zwei – drei drei acht eins.'), '042 3391'), RESULT.WRONG, 'one wrong digit in a phone number');
  assert.equal(check(dict('Der Tisch kostet fünfzehn Euro.'), 'Der Tisch kostet fuenfzehn Euro.'), RESULT.CORRECT);
  assert.equal(check(dict('Der Tisch kostet fünfzehn Euro.'), 'Der Tisch kostet 15 Euro.'), RESULT.CORRECT);
  assert.equal(check(dict('Es ist zwölf Uhr.'), 'Es ist zwoelf Uhr.'), RESULT.CORRECT);
  assert.equal(check(dict('Wir sind dreißig.'), 'Wir sind dreissig.'), RESULT.CORRECT);
  assert.equal(check(dict('Ich wohne in der Hauptstraße.'), 'Ich wohne in der Hauptstrase.'), RESULT.TYPO, 'ordinary typo forgiveness is unchanged');
});

test('dictation prices keep their decimal: „2,0 Euro" is not „zwanzig Euro" (Codex adversarial review of the fix)', async () => {
  const { checkAnswer, checkOptionsFor, RESULT } = await import('../src/lib/lesson/check.js');
  const item = { id: 'p', kind: 'dictation', type: 'dictation', answer: 'Das macht zusammen zwanzig Euro.', accepted: ['Das macht zusammen zwanzig Euro.'] };
  const check = (input) => checkAnswer(input, item.accepted, checkOptionsFor(item)).result;
  assert.equal(check('Das macht zusammen 20 Euro.'), RESULT.CORRECT);
  assert.equal(check('Das macht zusammen 2,0 Euro.'), RESULT.WRONG);
  assert.equal(check('Das macht zusammen fuenfundzwanzig Euro.'), RESULT.WRONG, 'a different compound number');
  const compound = { ...item, answer: 'Das macht fünfundzwanzig Euro.', accepted: ['Das macht fünfundzwanzig Euro.'] };
  assert.equal(checkAnswer('Das macht fuenfundzwanzig Euro.', compound.accepted, checkOptionsFor(compound)).result, RESULT.CORRECT);
  assert.equal(checkAnswer('Das macht 25 Euro.', compound.accepted, checkOptionsFor(compound)).result, RESULT.CORRECT);
});

test('final test: submission freezes one answer snapshot, and loading the listening keys is bounded', async () => {
  const { readFileSync } = await import('node:fs');
  const run = readFileSync(new URL('../src/pages/Modelltest/ModelltestRun.jsx', import.meta.url), 'utf8');
  assert.match(run, /const setAnswer = \(key, value\) => \{\s*if \(frozenRef\.current\) return;/, 'no edits after submit / expiry');
  assert.match(run, /if \(!frozenRef\.current\) frozenRef\.current = answers;\s*const snapshot = frozenRef\.current;/, 'every retry scores the same snapshot');
  assert.match(run, /scoreObjectiveSections\(mock, snapshot\)/);
  assert.match(run, /answers: \{ \.\.\.snapshot, _meta/);
  assert.doesNotMatch(run, /const answers = frozenRef/, 'no shadowed state inside finish');
  const hook = readFileSync(new URL('../src/hooks/useListening.js', import.meta.url), 'utf8');
  const loader = hook.slice(hook.indexOf('export async function fetchExerciseQuestions'), hook.indexOf('export function useExerciseDetails'));
  assert.equal((loader.match(/withTimeout\(/g) || []).length, 2, 'both requests are bounded');
});

test('final test A1.1: what the learner must understand uses taught words only, and every instruction speaks Sie', async () => {
  // Codex all-aspects review, 2026-10-07: the Lesen texts asked about a Zimmer „maximal 300 Euro
  // pro Monat, warm", a „Aufzug kaputt" and „heißes Wasser" — none of it taught in twelve Lektionen —
  // and the instructions said „Lies … entscheide … Schreib … nutze" to a course that says Sie.
  const { taughtUpTo, levelSpec, untaughtTokens } = await import('../scripts/validate-curriculum.mjs');
  const { abschlusstestA11: t } = await import('../src/data/courseTests/abschlusstestA11.js');
  const spec = levelSpec('a1.1');
  const known = taughtUpTo(spec.curriculum, spec).get(12);
  // Names, and the exam's own task words — the format, as the real test prints it.
  const FORMAT = new Set(['Mia', 'Aylin', 'Demir', 'Elif', 'Rosenweg', 'Anzeige', 'passt', 'Schild', 'Schreiben',
    'Familienname', 'Straße', 'Hausnummer', 'Zeilen', 'untereinander', 'Textfeld', 'Beispiel']);
  const lesen = t.sections.find((s) => s.key === 'lesen');
  const schreiben = t.sections.find((s) => s.key === 'schreiben');
  const stimuli = [...lesen.parts.flatMap((p) => [p.text, ...p.items.map((i) => i.prompt)]), schreiben.parts[0].task].filter(Boolean);
  for (const text of stimuli) {
    const untaught = untaughtTokens({ questionDe: text }, known, spec).filter((w) => !FORMAT.has(w));
    assert.deepEqual(untaught, [], text);
  }
  // The note between two friends duzt in-world; everything said TO the learner says Sie.
  const toLearner = [t.intro, ...t.sections.map((s) => s.instructions), schreiben.parts[0].task];
  for (const text of toLearner) assert.doesNotMatch(text, /\b(du|dein\w*|Deine?|Lies|entscheide|Schreib|nutze|Füll)\b/, text);
});

test('checkpoint Schreiben: a graded text that failed fails the section — two sentence drills cannot carry it', async () => {
  // Codex review, 2026-10-07: two drills right + the real text at 0 % was 2 of 3 = 67 %, a pass.
  const { buildCheckpoint, scoreCheckpoint, sectionPasses } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const { readFileSync } = await import('node:fs');
  const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url), 'utf8'));
  const checkpoint = CURRICULUM_A11.checkpoints[0];
  const items = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint, pool });
  const graded = items.find((i) => i.kind === 'gradedWriting');
  assert.ok(graded);
  const answersWith = (writing) => ({ ...Object.fromEntries(items.map((i) => [i.id, i.answer])), [graded.id]: writing });
  const failed = scoreCheckpoint(items, answersWith({ graded: true, pct: 0 }));
  assert.equal(failed.sections.schreiben.realTask, false);
  assert.equal(failed.passed, false, 'a 0 % text never passes the checkpoint');
  assert.equal(sectionPasses(failed.sections.schreiben), false, 'and the result row shows the part red');
  const good = scoreCheckpoint(items, answersWith({ graded: true, pct: 0.8 }));
  assert.equal(good.sections.schreiben.realTask, true);
  assert.equal(good.passed, true);
  // No grader verdict (offline, signed out): the task is not attempted — never a failed section.
  const none = scoreCheckpoint(items, answersWith(undefined));
  assert.equal(none.sections.schreiben.realTask, null);
  assert.equal(none.passed, true);
  const page = readFileSync(new URL('../src/pages/lesson/CheckpointPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /sectionPasses\(section\)/, 'the row reads the same rule the score does');
});

test('checkpoint retake: a new paper under the same rules, never the same 20 items reshuffled', async () => {
  // Codex review, 2026-10-07: „Nochmal" reshuffled the paper whose answers the result had just shown.
  const { buildCheckpoint, scoreCheckpoint, SECTION_ORDER } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const { readFileSync } = await import('node:fs');
  const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url), 'utf8'));
  const key = (i) => i.poolItemId || i.promptDe || i.id;
  const counts = (items) => SECTION_ORDER.map((s) => items.filter((i) => i.section === s).length).join(',');
  for (const cp of CURRICULUM_A11.checkpoints) {
    const first = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: cp, pool });
    const seen = new Set(first.map(key));
    for (let round = 1; round <= 3; round++) {
      const paper = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: cp, pool, seed: `${cp.id}-round-${round}` });
      assert.equal(counts(paper), counts(first), `${cp.id} round ${round}: same section sizes`);
      assert.ok(paper.filter((i) => !seen.has(key(i))).length >= 4, `${cp.id} round ${round}: new items`);
      assert.equal(scoreCheckpoint(paper, Object.fromEntries(paper.map((i) => [i.id, i.answer]))).passed, true, 'still passable');
    }
  }
  const page = readFileSync(new URL('../src/pages/lesson/CheckpointPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /buildCheckpoint\(\{ curriculum, checkpoint, pool, seed: round \?/);
  assert.match(page, /setRound\(attempts\?\.used \|\| 0\)/, 'a reload starts at this window\'s next paper');
  assert.doesNotMatch(page, /shuffle\(built/, 'no reshuffle of the old paper');
});

test('word order: when an object or a modal adverb could open the sentence, the prompt names the opening', async () => {
  // Codex review, 2026-10-07: checkpoint items marked „Zusammen tanzen wir." and „Ein Büro braucht
  // die Firma." wrong, and neither task named the opening. Neither is an Angabe the answer-key rule
  // derives — REVIEW #12/#13 pin both negatives (`fd-n2`, `fd-n5`) — so the PROMPT names the opening
  // instead: the determiner-cue convention, never a hand-widened accepted list.
  const { missingOpeningCue, frontableOrders } = await import('../src/data/lessonPools/quality.js');
  const { buildCheckpoint } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const { readFileSync } = await import('node:fs');
  const sb = (questionDe, answer) => ({ type: 'sentence_building', questionDe, answer, accepted: [answer] });
  assert.equal(missingOpeningCue(sb('Bilden Sie den Satz: [die Firma / brauchen / ein / Büro]', 'Die Firma braucht ein Büro.')), 'Die Firma');
  assert.equal(missingOpeningCue(sb('Bilden Sie den Satz: [wir / tanzen / zusammen]', 'Wir tanzen zusammen.')), 'Wir');
  assert.equal(missingOpeningCue(sb('Bilden Sie den Satz: [ich / trinken / gern / Kaffee]', 'Ich trinke gern Kaffee.')), 'Ich');
  // Nothing competes for the opening: a copula's predicate, a pronoun object with its prefix.
  assert.equal(missingOpeningCue(sb('Bilden Sie den Satz: [ich / sein / Lehrer]', 'Ich bin Lehrer.')), null);
  assert.equal(missingOpeningCue(sb('Bilden Sie den Satz: [ich / rufen / dich / an]', 'Ich rufe dich an.')), null);
  // …and a cued prompt is done; the answer-key rule is untouched by any of it.
  assert.equal(missingOpeningCue(sb('Bilden Sie den Satz (Beginnen Sie mit „Wir“): [wir / tanzen / zusammen]', 'Wir tanzen zusammen.')), null);
  assert.deepEqual(frontableOrders(sb('Bilden Sie den Satz: [wir / tanzen / zusammen]', 'Wir tanzen zusammen.')), []);
  const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url), 'utf8'));
  const items = pool.items || pool;
  assert.match(items.find((i) => i.id === 'extra-a11-l06-15').questionDe, /\(Beginnen Sie mit „Die Firma“\)/);
  assert.match(items.find((i) => i.id === 'extra-a11-l07-05').questionDe, /\(Beginnen Sie mit „Wir“\)/);
  // The cue is an instruction, not the exercise: the task shape — and so the lesson draw — is
  // the one the uncued prompt had (Codex review 2026-10-08 measured a changed draw without this).
  const { taskShape } = await import('../src/lib/lesson/buildLesson.js');
  const cued = items.filter((i) => /\(Beginnen Sie mit /.test(i.questionDe));
  assert.ok(cued.length >= 2);
  for (const i of cued) {
    assert.equal(taskShape(i), taskShape({ ...i, questionDe: i.questionDe.replace(/ \(Beginnen Sie mit „[^“]*“\)/, '') }), i.id);
  }
  // The class, over the built pool and every checkpoint paper the learner can draw.
  const papers = CURRICULUM_A11.checkpoints.flatMap((checkpoint) => [0, 1, 2].flatMap((r) =>
    buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint, pool, seed: r ? `${checkpoint.id}-round-${r}` : undefined })));
  for (const item of [...items, ...papers.map((i) => ({ ...i, questionDe: i.promptDe ?? i.questionDe }))]) {
    assert.equal(missingOpeningCue(item), null, `${item.id}: „${item.answer}" can open two ways and the prompt names neither`);
  }
});

test('writing grader: task fulfilment decides — off-topic and copied texts cannot pass on form alone', async () => {
  // Codex review, 2026-10-07: four 0–5 criteria let a text that answered no Leitpunkt collect 15/20.
  const { gateEvaluation, copiedShare, COPY_SHARE } = await import('../netlify/functions/evaluate-writing.mjs');
  const { writingTaskByKey, WRITING_TASKS } = await import('../src/data/writingTasks.js');
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const { readFileSync } = await import('node:fs');
  const model = (scores, checks) => ({ scores, total_score: scores.task + scores.structure + scores.accuracy + scores.vocabulary, leitpunkt_check: checks, improvements: [] });
  const full = { task: 5, structure: 4, accuracy: 4, vocabulary: 4 };
  const l10 = writingTaskByKey('goethe_a1', 'a11-l10');
  // Off-topic: the model marks no Leitpunkt but awards form points — the total is 0.
  const off = gateEvaluation(l10, 'Ich mag Pizza und Musik. Mein Hund heißt Max. Viele Grüße, Ana', model({ task: 0, structure: 5, accuracy: 5, vocabulary: 5 }, [false, false, false]));
  assert.equal(off.total_score, 0);
  // One Leitpunkt of three: task ≤ 2, total ≤ 8 — even when the model said task 4.
  const one = gateEvaluation(l10, 'Guten Tag, Frau Kaya! Der Zug hat Verspätung. Viele Grüße, Ana', model({ task: 4, structure: 4, accuracy: 4, vocabulary: 4 }, [true, false, false]));
  assert.equal(one.scores.task, 2);
  assert.ok(one.total_score <= 8);
  // The task copied back scores 0, whatever the model said.
  const copied = gateEvaluation(l10, l10.task, model(full, [true, true, true]));
  assert.equal(copied.gate.copied, true);
  assert.equal(copied.total_score, 0);
  assert.match(copied.improvements[0], /eigene Sätze/);
  // Every model text of the course, Lektion and checkpoint, keeps its full score.
  const samples = [
    ...CURRICULUM_A11.lektionen.map((l) => [writingTaskByKey('goethe_a1', l.schreiben.taskKey), l.schreiben.sample]),
    ...WRITING_TASKS.filter((t) => t.checkpoint).map((t) => [t, t.sample]),
  ];
  for (const [task, sample] of samples) {
    if (task.register !== 'formular') assert.ok(copiedShare(task, sample) < COPY_SHARE, `${task.taskKey}: the model text reads as copied`);
    const kept = gateEvaluation(task, sample, model(full, task.leitpunkte.map(() => true)));
    assert.equal(kept.total_score, 17, `${task.taskKey}: a complete answer loses points to the gate`);
  }
  const src = readFileSync(new URL('../netlify/functions/evaluate-writing.mjs', import.meta.url), 'utf8');
  assert.match(src, /evaluation = gateEvaluation\(task, text, evaluation\);\s*const wordCount/, 'the handler stores the gated score');
});

test('typo forgiveness never covers a changed short word inside a sentence — „ein" is not „bin" or „kein"', async () => {
  // Codex score review, 2026-10-08: the graded checkpoint item „Ich bin von Beruf Lehrer." accepted
  // „Ich ein von Beruf Lehrer." as a typo, and „Wir haben ein Handy." passed for „kein Handy".
  // The short-word guard only protected one-word answers; the changed WORD decides now.
  const { checkAnswer, checkOptionsFor, RESULT } = await import('../src/lib/lesson/check.js');
  const run = (answer, input, type = 'sentence_building') => {
    const item = { id: 'x', type, answer, accepted: [answer] };
    return checkAnswer(input, item.accepted, checkOptionsFor(item)).result;
  };
  assert.equal(run('Ich bin von Beruf Lehrer.', 'Ich ein von Beruf Lehrer.'), RESULT.WRONG);
  assert.equal(run('Wir haben kein Handy.', 'Wir haben ein Handy.'), RESULT.WRONG);
  assert.equal(run('Ich sehe den Mann.', 'Ich sehe dem Mann.'), RESULT.WRONG, 'a case ending is grammar');
  assert.equal(run('Das ist nicht teuer.', 'Das ist nich teuer.'), RESULT.WRONG, 'negation is meaning');
  assert.equal(run('Wir haben kein Handy.', 'Wir haben ein Handy.', 'dictation'), RESULT.WRONG, 'in dictation too');
  // A slip in a longer word is still a typo, one retry, as before.
  assert.equal(run('Ich wohne in der Hauptstraße.', 'Ich wohne in der Hauptstrase.'), RESULT.TYPO);
  assert.equal(run('Er kommt aus Marokko.', 'Er kommt aus Marocko.'), RESULT.TYPO);
  assert.equal(run('Er kommt aus Marokko.', 'Er komt aus Marokko.'), RESULT.TYPO, 'a slip in a verb of five letters');
  assert.equal(run('Ich heiße Ana.', 'Ich heise Ana.'), RESULT.TYPO);
  assert.equal(run('Du bist hier.', 'Du bistt hier.'), RESULT.TYPO, 'a short word typed whole plus one stray key');
  assert.equal(run('Ich habe eine Frage.', 'Ich habe keine Frage.'), RESULT.WRONG, 'an added negation is not a stray key');
});

test('writing grader: a malformed AI result is unassessed, never a score (empty coverage once scored 20/20)', async () => {
  // Codex score review, 2026-10-08: `leitpunkt_check: []` made coverage unknown, the cap was
  // skipped and the text scored 20/20.
  const { validEvaluation } = await import('../netlify/functions/evaluate-writing.mjs');
  const { writingTaskByKey } = await import('../src/data/writingTasks.js');
  const task = writingTaskByKey('goethe_a1', 'a11-l10');
  const good = { scores: { task: 5, structure: 4, accuracy: 4, vocabulary: 4 }, total_score: 17, leitpunkt_check: [true, true, false] };
  assert.equal(validEvaluation(task, good), true);
  assert.equal(validEvaluation(task, { ...good, leitpunkt_check: ['true', 'false', 'true'] }), true, 'JSON booleans as strings');
  for (const [why, bad] of [
    ['no coverage', { ...good, leitpunkt_check: [] }],
    ['wrong length', { ...good, leitpunkt_check: [true, true] }],
    ['not booleans', { ...good, leitpunkt_check: [1, 0, 1] }],
    ['coverage missing', { scores: good.scores, total_score: 17 }],
    ['a score missing', { ...good, scores: { task: 5, structure: 4, accuracy: 4 } }],
    ['a score out of range', { ...good, scores: { ...good.scores, task: 9 } }],
    ['total not a number', { ...good, total_score: '17' }],
    ['nothing', null],
  ]) assert.equal(validEvaluation(task, bad), false, why);
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../netlify/functions/evaluate-writing.mjs', import.meta.url), 'utf8');
  assert.match(src, /if \(!validEvaluation\(task, evaluation\)\) \{\s*return \{/, 'an invalid result returns evaluation_failed, after one retry');
});

/** A Supabase stand-in: chainable filters over an in-memory table, inserts that can fail. */
function fakeAttemptsClient({ rows = [], failInsert = false } = {}) {
  const inserted = [];
  return {
    rows,
    inserted,
    from: () => {
      const filters = [];
      const q = {
        select: () => q,
        eq: (k, v) => { filters.push((r) => r[k] === v); return q; },
        in: (k, vs) => { filters.push((r) => vs.includes(r[k])); return q; },
        insert: async (rs) => {
          if (failInsert) return { error: { message: 'offline' } };
          inserted.push(...rs); rows.push(...rs); return { error: null };
        },
        then: (resolve) => resolve({ data: rows.filter((r) => filters.every((f) => f(r))), error: null }),
      };
      return q;
    },
  };
}

test('checkpoint save: a failed completion is reported, a retry with the same stamp adds no attempt, the course home completes a saved pass', async () => {
  // Codex score review, 2026-10-08: recordAttempt returned true although both completion writes
  // failed — the pass sat in lesson_attempts while the course path stayed one node short.
  const { recordAttempt, reconcileCheckpoints } = await import('../src/services/checkpointService.js');
  const args = { level: 'a1.1', checkpointId: 'a1.1-cp1', items: [], answers: {}, result: { passed: true, overall: 80 }, stamp: '2026-10-08T10:00:00.000Z' };
  const client = fakeAttemptsClient();
  assert.equal(await recordAttempt('u1', args, client, async () => false), false, 'completion failed → not saved');
  assert.equal(client.inserted.length, 1, 'the summary row landed');
  let completed = 0;
  assert.equal(await recordAttempt('u1', args, client, async () => { completed += 1; return true; }), true, 'the retry completes');
  assert.equal(client.inserted.length, 1, 'and does not count a second attempt');
  assert.equal(completed, 1);
  const down = fakeAttemptsClient({ failInsert: true });
  assert.equal(await recordAttempt('u1', args, down, async () => true), false, 'an insert that did not land is not saved');
  // The course home: a saved pass whose node is missing is completed; a failed attempt is not.
  const ledger = fakeAttemptsClient({ rows: [
    { user_id: 'u1', lektion_id: 'a1.1-cp1', item_id: 'a1.1-cp1', stage: 'checkpoint', correct: true },
    { user_id: 'u1', lektion_id: 'a1.1-cp2', item_id: 'a1.1-cp2', stage: 'checkpoint', correct: false },
    { user_id: 'u1', lektion_id: 'a1.1-cp2', item_id: 'a1.1-cp2-lesen-1', stage: 'checkpoint', correct: true },
  ] });
  const done = [];
  const curriculum = { level: 'a1.1', checkpoints: [{ id: 'a1.1-cp1' }, { id: 'a1.1-cp2' }] };
  const fixed = await reconcileCheckpoints('u1', curriculum, new Set(), { client: ledger, complete: async (_, { checkpointId }) => { done.push(checkpointId); return true; } });
  assert.deepEqual(fixed, ['a1.1-cp1']);
  assert.deepEqual(done, ['a1.1-cp1'], 'a correct ITEM row of a failed paper is not a pass');
  const { readFileSync } = await import('node:fs');
  const page = readFileSync(new URL('../src/pages/lesson/CheckpointPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /stamp: saveRef\.current\.stamp/, 'the page saves one stamped attempt per paper');
  assert.match(page, /t\('checkpoint\.saveFailed', lang\)/, 'and says so when it did not land');
  const home = readFileSync(new URL('../src/pages/CurriculumHomePage.jsx', import.meta.url), 'utf8');
  assert.match(home, /reconcileCheckpoints\(user\.id, curriculum, set\)/);
});

test('final test: a completion that did not save keeps the learner on the test with a retry, never a result page', async () => {
  // Codex score review, 2026-10-08: finish() ignored completeAttempt's false and navigated on.
  const { readFileSync } = await import('node:fs');
  const run = readFileSync(new URL('../src/pages/Modelltest/ModelltestRun.jsx', import.meta.url), 'utf8');
  assert.match(run, /const saved = await completeAttempt\(attempt\.id, \{[\s\S]*?\}\);(?:\s*\/\/[^\n]*)*\s*if \(!saved\) \{\s*setFinishing\(false\);\s*setFinishError\(/);
});

test('writing: a draft survives a reload, per learner and task, and is dropped on submit', async () => {
  // Codex score review, 2026-10-08: the learner's text lived in component state only.
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/components/lesson/GradedWriting.jsx', import.meta.url), 'utf8');
  assert.match(src, /dm_writing_draft:\$\{userId \|\| 'guest'\}:\$\{taskKey \|\| ''\}/, 'scoped to the learner and the task');
  assert.match(src, /useState\(\(\) => readDraft\(key\)\?\.text \|\| ''\)/, 'restored on mount');
  assert.match(src, /safeSetJSON\(key, \{ text, fields, savedAt: Date\.now\(\) \}\)/, 'saved as typed');
  assert.match(src, /const finish = \(r, noteText\) => \{\s*safeRemove\(key\);/, 'dropped once handed in');
  assert.match(src, /DRAFT_MAX_AGE_MS = 7 \* 24 \* 60 \* 60 \* 1000/);
});

test('read-aloud: words that are not in the line count against the score — „Ich bin nicht Ana." is not „Ich bin Ana."', async () => {
  // Codex score review, 2026-10-08: the score was hits / expected words, so an inserted negation
  // scored 100 %. Hesitation fillers are not words of the answer and cost nothing.
  const { alignTranscript } = await import('../src/lib/lesson/readaloud.js');
  const negated = alignTranscript('Ich bin Ana.', 'Ich bin nicht Ana.');
  assert.equal(negated.extra, 1);
  assert.equal(negated.pct, 0.75);
  assert.ok(negated.pct < 0.8, 'below the line logged as correct');
  const um = alignTranscript('Ich bin Ana.', 'Ähm ich bin äh Ana.');
  assert.deepEqual([um.extra, um.pct], [0, 1], 'fillers are free');
  assert.equal(alignTranscript('Ich bin Ana.', 'Ich bin Ana.').pct, 1);
  assert.equal(alignTranscript('Ich wohne in Berlin.', 'Ich wohne Berlin.').pct, 0.75, 'a missing word, as before');
  const { readFileSync } = await import('node:fs');
  const twin = readFileSync(new URL('../netlify/functions/_shared/readaloud.mjs', import.meta.url), 'utf8');
  assert.equal(twin, readFileSync(new URL('../src/lib/lesson/readaloud.js', import.meta.url), 'utf8'), 'the server scores with the same rule');
  const line = readFileSync(new URL('../src/components/lesson/ReadAloudLine.jsx', import.meta.url), 'utf8');
  assert.match(line, /t\('speaking\.extraWords', lang, \{ n: result\.extra \}\)/, 'and the learner is told why the number dropped');
});

test('checkpoint and read-aloud audio use checked playback; an item read instead of heard leaves the score', async () => {
  // Codex score review, 2026-10-08: checkpoint listening played through playLine, whose success
  // means "queued", so silence looked like playback — and a learner who could not hear was scored.
  const { readFileSync } = await import('node:fs');
  const page = readFileSync(new URL('../src/pages/lesson/CheckpointPage.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(page, /\bplayLine\b/, 'no unchecked playback in an assessment');
  assert.match(page, /<PlayButton[^>]*onFallback=\{\(\) => \{ setShownText\(true\); onReadInstead\(item\.id\); \}\}/);
  assert.match(page, /const scoredItems = useMemo\(\(\) => items\.filter\(\(i\) => !notHeard\.has\(i\.id\)\), \[items, notHeard\]\)/);
  assert.match(page, /scoreCheckpoint\(scoredItems, finalAnswers\)/, 'the result and the saved attempt leave it out');
  const line = readFileSync(new URL('../src/components/lesson/ReadAloudLine.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(line, /\bplayLine\b/, 'the model line is checked too');
  assert.match(line, /<PlayButton /);
});

test('a checkpoint result names what it assessed: perfect objective answers with ungraded production are not an all-skills pass', async () => {
  // Codex score review, 2026-10-08: all four checkpoints returned „passed" at 100 % with the
  // text ungraded and speaking self-confirmed, and nothing said the result was narrower.
  const { buildCheckpoint, scoreCheckpoint, assessedParts } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const { readFileSync } = await import('node:fs');
  const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url), 'utf8'));
  const items = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: CURRICULUM_A11.checkpoints[0], pool });
  const objective = Object.fromEntries(items.filter((i) => i.kind !== 'gradedWriting' && i.kind !== 'readAloud').map((i) => [i.id, i.answer]));
  const narrow = assessedParts(items, scoreCheckpoint(items, objective));
  assert.ok(narrow.notAssessed.includes('sprechen'), 'a self-confirmed read-aloud is not assessed speaking');
  assert.equal(narrow.writing, 'drills', 'two drills are not a graded text');
  const graded = items.find((i) => i.kind === 'gradedWriting');
  const mic = Object.fromEntries(items.filter((i) => i.kind === 'readAloud').map((i) => [i.id, { pct: 0.9, usedMic: true }]));
  const full = assessedParts(items, scoreCheckpoint(items, { ...objective, ...mic, [graded.id]: { graded: true, pct: 0.8 } }));
  assert.deepEqual(full.notAssessed, []);
  assert.equal(full.writing, 'graded');
  const page = readFileSync(new URL('../src/pages/lesson/CheckpointPage.jsx', import.meta.url), 'utf8');
  // Read from the WHOLE paper: a part whose items were all read instead of heard is „not assessed",
  // never silently absent (Codex rescore, 2026-10-08).
  assert.match(page, /assessedParts\(items, result\)/, 'the result card states its scope');
  const allRead = scoreCheckpoint(items.filter((i) => i.section !== 'hoeren'), objective);
  assert.ok(assessedParts(items, allRead).notAssessed.includes('hoeren'), 'Hören unheard is Hören not assessed');
});

test('the A1.1 final-test result speaks Sie and names what its score covers', async () => {
  // Codex score review, 2026-10-08 (honesty of claims): the result page shared the exam mocks' du copy.
  const { abschlusstestA11: t } = await import('../src/data/courseTests/abschlusstestA11.js');
  for (const key of ['solide', 'knapp', 'nicht-bereit']) {
    const copy = t.verdictCopyDe?.[key];
    assert.ok(copy && copy.title && copy.body, key);
    assert.doesNotMatch(`${copy.title} ${copy.body}`, /\b(du|dich|dir|dein\w*|Du|Dein\w*)\b|\bsieh\b|\bHalte\b|\büb(e|t)\b/, key);
  }
  assert.match(t.verdictCopyDe.solide.body, /Hören und Lesen/, 'the score covers the two automatically scored parts');
  const { readFileSync } = await import('node:fs');
  const page = readFileSync(new URL('../src/pages/Modelltest/ModelltestResult.jsx', import.meta.url), 'utf8');
  assert.match(page, /return `Ihre letzten zwei Abschlusstests liegen bei/);
});

test('assessment a11y: a checkpoint verdict takes focus, and the writing coverage icons have words', async () => {
  // Codex score review, 2026-10-08: checkpoint feedback appeared with no announcement and focus
  // stayed behind; the Leitpunkt ticks and crosses were aria-hidden icons with no text.
  const { readFileSync } = await import('node:fs');
  const page = readFileSync(new URL('../src/pages/lesson/CheckpointPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /<p ref=\{verdictRef\} tabIndex=\{-1\}/, 'the verdict line is focusable');
  assert.match(page, /useEffect\(\(\) => \{\s*if \(feedback\) verdictRef\.current\?\.focus\(\);\s*\}, \[feedback\]\);/, 'and takes focus once checked');
  const gw = readFileSync(new URL('../src/components/lesson/GradedWriting.jsx', import.meta.url), 'utf8');
  assert.match(gw, /<span className="sr-only">\{t\(outcome\.leitpunktCheck\[i\] \? 'writing\.covered' : 'writing\.notCovered', lang\)\}/);
  const { t } = await import('../src/lib/lesson/strings.js');
  for (const lang of ['en', 'de']) for (const k of ['writing.covered', 'writing.notCovered']) assert.notEqual(t(k, lang), k, `${k} (${lang})`);
});

test('the course says what its final test is and what an account is for', async () => {
  // Codex score review, 2026-10-08: „ends with the Start Deutsch 1 final test" (it is our shortened
  // practice test in that format), and „sign up only to save your progress" (AI feedback needs it too).
  const { readFileSync } = await import('node:fs');
  const home = readFileSync(new URL('../src/pages/CurriculumHomePage.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(home, /ends with the \{curriculum\.examName\} final test/);
  assert.match(home, /ends with a shortened practice test in the \{curriculum\.examName\} format/);
  const { A11_META } = await import('../src/data/curricula/a11.meta.js');
  assert.match(A11_META.aboutEn, /shortened practice test in the Start Deutsch 1 format/);
  assert.match(A11_META.aboutEn, /not an official exam/);
  assert.match(A11_META.aboutEn, /AI feedback/);
  assert.doesNotMatch(A11_META.aboutEn, /only if you want to save/);
});

test('the grader returns real booleans, and the read-aloud extra-word count reaches the learner (Codex rescore)', async () => {
  // A „false" string passed validation and the client's !!value showed it as covered; the server
  // dropped `extra`, so the new „words not in the line" note could never appear.
  const { gateEvaluation } = await import('../netlify/functions/evaluate-writing.mjs');
  const { writingTaskByKey } = await import('../src/data/writingTasks.js');
  const task = writingTaskByKey('goethe_a1', 'a11-l10');
  const out = gateEvaluation(task, 'Guten Tag, Frau Kaya! Der Zug hat Verspätung. Viele Grüße, Ana',
    { scores: { task: 1, structure: 4, accuracy: 4, vocabulary: 4 }, total_score: 13, leitpunkt_check: ['false', 'true', 'false'] });
  assert.deepEqual(out.leitpunkt_check, [false, true, false]);
  const { readFileSync } = await import('node:fs');
  const fn = readFileSync(new URL('../netlify/functions/score-readaloud.mjs', import.meta.url), 'utf8');
  assert.match(fn, /const \{ words, pct, extra \} = alignTranscript\(expected, transcript\);/);
  assert.match(fn, /body: JSON\.stringify\(\{ transcript, words, pct, extra,/);
  const line = readFileSync(new URL('../src/components/lesson/ReadAloudLine.jsx', import.meta.url), 'utf8');
  assert.match(line, /setResult\(\{ words, pct, extra \}\)/);
});
