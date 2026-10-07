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
