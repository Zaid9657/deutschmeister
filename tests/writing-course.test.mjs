// The twelve course writing tasks of A1.1 — P2 of the A1.1 plan.
//
// What this guards is a single failure mode: the learner reads the task on the
// lesson screen (from src/data/curricula/a11.js) while the grader builds its
// rubric from the task bank (src/data/writingTasks.js, mirrored into
// netlify/functions/_shared/writingTasks.mjs). If the two drift, the screen
// shows one exercise and the AI marks another — and the learner is told their
// German is wrong about a task they were never given.
//
// Run with `npm test`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { WRITING_TASKS, writingTaskByKey, writingTasksForExam, courseWritingTasks } from '../src/data/writingTasks.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import {
  courseTaskKeyPrefix,
  courseAllowanceFor,
  CHECKPOINTS_PER_COURSE,
  COURSE_WRITING_FREE_LIFETIME,
} from '../netlify/functions/evaluate-writing.mjs';
import { ALL_CURRICULA } from '../src/data/curricula/index.js';
import { chapterWritingTask, chapterLektionen } from '../src/lib/checkpoint/buildCheckpoint.js';
import {
  scoreWriting, countWords, leitpunktKeyword, leitpunktKeywords, leitpunktEvidence, leitpunktSatisfied,
} from '../src/lib/lesson/writing.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LEKTIONEN = CURRICULUM_A11.lektionen;
const COURSE = courseWritingTasks('a1.1');

test('the bank holds exactly twelve A1.1 course tasks, one per Lektion, in order', () => {
  assert.equal(COURSE.length, 12);
  assert.deepEqual(
    COURSE.map((t) => t.taskKey),
    LEKTIONEN.map((l) => `a11-l${String(l.nr).padStart(2, '0')}`),
  );
  for (const t of COURSE) assert.equal(t.examKey, 'goethe_a1');
  assert.equal(new Set(WRITING_TASKS.map((t) => `${t.examKey}/${t.taskKey}`)).size, WRITING_TASKS.length, 'duplicate task key');
});

test('every Lektion\'s schreiben.taskKey resolves to its own course task', () => {
  for (const l of LEKTIONEN) {
    const key = l.schreiben.taskKey;
    assert.ok(key, `Lektion ${l.nr} has no schreiben.taskKey`);
    const task = writingTaskByKey('goethe_a1', key);
    assert.ok(task, `Lektion ${l.nr}: taskKey ${key} resolves to no goethe_a1 task`);
    assert.equal(task.course, 'a1.1', `Lektion ${l.nr}: ${key} is not marked as a course task`);
    assert.equal(task.task, l.schreiben.taskDe, `Lektion ${l.nr}: bank prompt differs from taskDe`);
    assert.equal(task.minWords, l.schreiben.minWords);
    assert.equal(task.maxWords, l.schreiben.maxWords);
  }
});

test('register and Leitpunkte match the kind of task the Lektion sets', () => {
  for (const l of LEKTIONEN) {
    const task = writingTaskByKey('goethe_a1', l.schreiben.taskKey);
    if (l.schreiben.kind === 'formular') {
      assert.equal(task.register, 'formular', `${task.taskKey}: a Formular must be graded as one`);
      // The Leitpunkte ARE the form's fields — that is what the grader ticks.
      assert.deepEqual(task.leitpunkte, l.schreiben.fields, `${task.taskKey}: Leitpunkte are not the Lektion's fields`);
      assert.ok(task.leitpunkte.length >= 3 && task.leitpunkte.length <= 5, `${task.taskKey}: ${task.leitpunkte.length} fields`);
    } else {
      assert.ok(['informell', 'formell'].includes(task.register), `${task.taskKey}: register "${task.register}" is not a Mitteilung register`);
      assert.deepEqual(task.leitpunkte, l.schreiben.leitpunkte, `${task.taskKey}: Leitpunkte differ from the Lektion`);
      assert.equal(task.leitpunkte.length, 3, `${task.taskKey}: a Mitteilung needs exactly three Leitpunkte`);
    }
  }
});

test('the six Mitteilungen carry the register their addressee implies', () => {
  // Sie/Herr/Chefin → formell; a Freundin, Lena or a Kollegin on first-name
  // terms → informell. The grader marks Anrede and Gruß against this.
  const expected = { 2: 'formell', 4: 'informell', 6: 'formell', 8: 'informell', 10: 'informell', 12: 'informell' };
  for (const [nr, register] of Object.entries(expected)) {
    const l = LEKTIONEN.find((x) => x.nr === Number(nr));
    assert.equal(l.schreiben.kind, 'mitteilung');
    assert.equal(writingTaskByKey('goethe_a1', l.schreiben.taskKey).register, register, `Lektion ${nr}`);
  }
});

test('course tasks stay out of the exam bank the /schreiben page lists', () => {
  // /schreiben sells exam training; the twelve course tasks belong to the free
  // A1.1 course and would otherwise appear there as twelve extra cards.
  const exam = writingTasksForExam('goethe_a1');
  assert.equal(exam.length, 12, 'the goethe_a1 exam bank is the 6 Formular + 6 Mitteilung tasks');
  assert.ok(exam.every((t) => !t.course));
  assert.ok(exam.every((t) => !t.taskKey.startsWith('a11-')));
});

test('the grader bills course tasks against the free course allowance', () => {
  // The behaviour the owner decision rests on, read off the function: the
  // course scope is counted by the task_key's OWN course prefix
  // (writing_submissions has no scope column), lifetime, and it covers
  // free_expired too — A1.1 stays free after the trial ends. The prefix must
  // be DERIVED from task_key, not a second hardcoded literal — a fixed
  // 'a11-%' would make every other course's submissions uncounted.
  const src = readFileSync(join(ROOT, 'netlify/functions/evaluate-writing.mjs'), 'utf8');
  assert.ok(
    COURSE.every((t) => courseTaskKeyPrefix(t.taskKey) && t.taskKey.startsWith(courseTaskKeyPrefix(t.taskKey))),
    'every A1.1 course taskKey must derive a non-null prefix that it starts with, or the usage count misses it',
  );
  assert.match(src, /const COURSE_WRITING_FREE_LIFETIME\s*=\s*12/);
  assert.equal(
    COURSE_WRITING_FREE_LIFETIME,
    COURSE.length,
    'the constant marketing states and claims.test.mjs parses must stay the per-Lektion count',
  );
  assert.match(src, /tier === 'free_trial' \|\| tier === 'free_expired'/, 'the course allowance must cover expired trials');
  assert.match(
    src,
    /\.like\('task_key', `\$\{courseTaskKeyPrefix\(task_key\)\}%`\)/,
    'the lifetime count must be scoped by the derived per-course prefix, not a fixed literal',
  );
});

test('courseTaskKeyPrefix derives the per-course scope from the task_key itself', () => {
  assert.equal(courseTaskKeyPrefix('a11-l03'), 'a11-');
  assert.equal(courseTaskKeyPrefix('a12-l07'), 'a12-');
  assert.equal(courseTaskKeyPrefix('formular-hotel-anmeldung'), null, 'a non-course task_key must not get a course prefix');
  assert.equal(courseTaskKeyPrefix('mitteilung-termin-absagen'), null);
  assert.equal(courseTaskKeyPrefix(undefined), null);
});

test('the derived prefix scopes the allowance count to that course only, not a sibling course', () => {
  // The regression this whole fix defends: a12-* tasks must be counted
  // against a12-%, never against a11-% (which would leave them uncounted)
  // nor against a bare 'a-%' (which would merge A1.1 and A1.2 usage).
  const a11Prefix = courseTaskKeyPrefix('a11-l01');
  const a12Prefix = courseTaskKeyPrefix('a12-l01');
  assert.notEqual(a11Prefix, a12Prefix);
  assert.ok('a12-l07'.startsWith(a12Prefix));
  assert.ok(!'a12-l07'.startsWith(a11Prefix));
});

test('every course Formular has five gaps and a source text to fill them from', () => {
  // SD1 Teil 1 hands the candidate a short text about a person and a form to
  // transfer it into, and scores 5 Punkte, one per field. A form with no source
  // text is not that task — it is a questionnaire about the learner, which is
  // what these twelve were until the DaF review of 2026-09-12 (§B, fix 8).
  const formulare = COURSE.filter((t) => t.register === 'formular');
  assert.equal(formulare.length, 6, 'the odd-numbered Lektionen are the six Formulare');
  for (const t of formulare) {
    assert.equal(t.leitpunkte.length, 5, `${t.taskKey}: SD1 Teil 1 has five gaps, this has ${t.leitpunkte.length}`);
    // The instruction ("Füllen Sie … aus") is the LAST sentence; everything
    // before it is the situation. Both halves must be there.
    const instruction = t.task.match(/Füllen Sie [^.]+\.$/);
    assert.ok(instruction, `${t.taskKey}: the prompt must end in the Füllen-Sie instruction`);
    const source = t.task.slice(0, t.task.length - instruction[0].length).trim();
    assert.ok(source.length > 40, `${t.taskKey}: no source text before the instruction`);
    assert.ok(/[.!?]$/.test(source), `${t.taskKey}: the source text must be whole sentences`);
    // The same shape the six exam-bank Formulare carry — one field, one `task`.
    assert.equal(typeof t.task, 'string');
  }
});

test('the word ranges are the ones the grader can accept', () => {
  // Every course task used to carry minWords 0 / maxWords 30 while
  // evaluate-writing.mjs rejected anything under 30 CHARACTERS, so a correctly
  // filled form never reached the grader. Both halves are pinned here.
  for (const t of COURSE) {
    if (t.register === 'formular') {
      assert.equal(t.minWords, 5, `${t.taskKey}: five field values are five words`);
      assert.equal(t.maxWords, 40, t.taskKey);
    } else {
      // Anrede + three Leitpunkte + Gruß is 35–40 words; 30 cut it off.
      assert.equal(t.minWords, 25, t.taskKey);
      assert.equal(t.maxWords, 45, t.taskKey);
      assert.ok(t.maxWords >= 40, `${t.taskKey}: a complete SD1 Teil 2 answer does not fit`);
    }
    assert.ok(t.minWords > 0, `${t.taskKey}: a minimum of 0 words tells the learner nothing`);
  }
});

test('the grader\'s character floor is bound to the register, not to one constant', () => {
  const src = readFileSync(join(ROOT, 'netlify/functions/evaluate-writing.mjs'), 'utf8');
  const table = src.match(/const MIN_CHARS\s*=\s*\{([^}]*)\}/);
  assert.ok(table, 'MIN_CHARS not found — the floor is a constant again');
  const formular = Number(table[1].match(/formular\s*:\s*(\d+)/)?.[1]);
  const fallback = Number(src.match(/MIN_CHARS\[task\.register\]\s*\?\?\s*(\d+)/)?.[1]);
  assert.equal(formular, 12);
  assert.equal(fallback, 30);
  assert.match(src, /text\.trim\(\)\.length < minChars/, 'the floor must be applied to the submission');
  // The failure this fixes: five short field values, joined as the submission.
  const shortestRealForm = 'Ana / A1 / 12 / Heft / grün';
  assert.ok(shortestRealForm.length >= formular, 'a correctly filled form must reach the grader');
  assert.ok(shortestRealForm.length < fallback, 'and it would not have, at the letter floor');
});

test('every a11-l* task title tracks its Lektion\'s title in CURRICULUM_A11', () => {
  // DaF review #3 (docs/course-factory/a11-rebuild/REVIEW-daf-3-2026-09-12.md) caught
  // Lektion 11 renamed to "Mein Tag" in the curriculum while the task bank still said
  // "Lektion 11: Gestern und heute" — the two titles drifted silently. Pin the
  // convention (`Lektion <nr>: <curriculum title>`) so a future rename cannot drift again.
  const a11Tasks = WRITING_TASKS.filter((t) => /^a11-l(\d+)/.test(t.taskKey));
  assert.ok(a11Tasks.length > 0, 'no a11-l* tasks found — has the id scheme changed?');
  for (const t of a11Tasks) {
    const nr = Number(t.taskKey.match(/^a11-l(\d+)/)[1]);
    const lektion = LEKTIONEN[nr - 1];
    assert.ok(lektion, `${t.taskKey}: no Lektion ${nr} in CURRICULUM_A11`);
    assert.equal(lektion.nr, nr, `${t.taskKey}: CURRICULUM_A11.lektionen[${nr - 1}].nr is not ${nr}`);
    assert.equal(
      t.title,
      `Lektion ${nr}: ${lektion.title}`,
      `${t.taskKey}: task title has drifted from CURRICULUM_A11's Lektion ${nr} title`,
    );
  }
});

test('the two writing-task copies are byte-identical', () => {
  assert.equal(
    readFileSync(join(ROOT, 'src/data/writingTasks.js'), 'utf8'),
    readFileSync(join(ROOT, 'netlify/functions/_shared/writingTasks.mjs'), 'utf8'),
    'src/data/writingTasks.js and netlify/functions/_shared/writingTasks.mjs drifted',
  );
});

test('the course allowance is derived from the course, and covers its checkpoints', () => {
  // BLOCKER 2 of the DaF review of 2026-09-12 (#7): the allowance was the
  // twelve Lektionen while the course asks for sixteen submissions — the four
  // checkpoints each end in the chapter's graded writing task, posted to the
  // SAME function with the SAME task_key. A free learner therefore met a 429 on
  // every checkpoint's writing, and because that item is `optional: true`,
  // itemCounts() dropped it instead of failing it: no test, no log, no screen.
  //
  // THE CLASS, not the instance: for every level that HAS a curriculum, the
  // allowance must cover one submission per course writing task plus one per
  // checkpoint that actually carries a graded task. A course may never have
  // more writing surfaces than its allowance grants.
  const levels = Object.keys(ALL_CURRICULA);
  assert.ok(levels.length > 0, 'no curricula registered — has the registry moved?');
  for (const level of levels) {
    const curriculum = ALL_CURRICULA[level];
    const prefix = `${level.replace(/\./g, '')}-`;
    const allowance = courseAllowanceFor(`${prefix}l01`);
    const tasks = courseWritingTasks(level).length;
    const gradedCheckpoints = curriculum.checkpoints.filter(
      (cp) => chapterWritingTask(chapterLektionen(curriculum, cp), level),
    ).length;
    assert.ok(tasks > 0, `${level}: no course writing tasks in the bank for a registered curriculum`);
    assert.ok(
      allowance >= tasks + gradedCheckpoints,
      `${level}: allowance ${allowance} < ${tasks} writing tasks + ${gradedCheckpoints} graded checkpoints`,
    );
  }
});

test('the allowance grows with the course instead of standing beside it', () => {
  // A1.1 today: twelve Lektionen + four checkpoints = sixteen. The number is
  // read off the bank, so adding a Lektion moves it without a second edit.
  assert.equal(CHECKPOINTS_PER_COURSE, 4);
  assert.equal(courseAllowanceFor('a11-l01'), COURSE.length + CHECKPOINTS_PER_COURSE);
  assert.equal(courseAllowanceFor('a11-l01'), 16);
  // Per course, never shared: A1.2 gets its own, counted from its own bank.
  assert.equal(courseAllowanceFor('a12-l01'), courseWritingTasks('a1.2').length + CHECKPOINTS_PER_COURSE);
  // A key that names no course gets no course allowance at all — the caller
  // then falls back to the ordinary tier limit rather than inventing one.
  assert.equal(courseAllowanceFor('formular-hotel-anmeldung'), 0);
  assert.equal(courseAllowanceFor(undefined), 0);
});

test('the function gates on the derived allowance, not on the bare constant', () => {
  const src = readFileSync(join(ROOT, 'netlify/functions/evaluate-writing.mjs'), 'utf8');
  assert.match(src, /courseWritingTasks\(level\)\.length/, 'the allowance must be counted off the task bank');
  assert.match(src, /const courseLimit = courseAllowanceFor\(task_key\)/);
  assert.match(src, /\? courseLimit\n/, 'the enforced limit must be the derived course allowance');
});


// ───────────────────────────────────────────────────────────────────────────────────────────────
// THE FORMCHECK AND A CORRECT ANSWER — DaF review #13, MAJOR 1
//
// RULE 17 asks „does my Beispieltext pass my checker“. This asks the harder question, the one the
// review says is the only one that can expose a WRONG checker: „does a correct answer pass my
// checker“. The round before answered `lp0/lp1/lp2 FAIL` on an exam-grade 30-word Mitteilung and
// rewrote the Beispieltext around its keywords („Der Familienstand: Ich bin ledig.“) instead of
// repairing the rule.
// ───────────────────────────────────────────────────────────────────────────────────────────────

/** The task shape `GradedWriting.jsx` hands `scoreWriting`, built from the BANK like RULE 17. */
const formcheckTask = (nr) => {
  const l = LEKTIONEN[nr - 1];
  const bank = writingTaskByKey('goethe_a1', l.schreiben.taskKey);
  return { kind: 'mitteilung', minWords: bank.minWords, maxWords: bank.maxWords, leitpunkte: bank.leitpunkte };
};

// One hand-written, exam-grade answer per Mitteilung. L2 is the reviewer's own text, quoted
// verbatim from REVIEW-daf-13-2026-09-12.md (MAJOR 1): 30 words, Anrede, Gruß, all three
// Leitpunkte answered, and `lp0 lp1 lp2` all red under the round-13 rule.
const EXAM_GRADE_ANSWERS = {
  2: 'Sehr geehrte Damen und Herren, ich heiße Ana Chakiri. Ich bin am 3. Mai 1998 geboren. Ich komme aus Marokko und bin Marokkanerin. Ich bin ledig. Viele Grüße, Ana Chakiri',
  4: 'Hallo Lena! Ich kaufe auf dem Flohmarkt einen Stuhl. Er kostet zwölf Euro, das ist nicht teuer. Treffen wir uns um vier Uhr am Eingang? Tschüss, Tim',
  6: 'Guten Tag, Frau Berg! Für das Büro brauche ich noch einen Computer. Meine Telefonnummer ist 0176 22 44 88. Ab neun Uhr bin ich im Büro. Viele Grüße, Ana',
  8: 'Hallo Lena! Leider passt der Termin am Montag nicht. Ich schreibe dir deshalb schnell. Geht es am Dienstag um halb neun? Hast du dann Zeit für mich? Viele Grüße, Ana',
  10: 'Liebe Kollegin, der Zug hat leider Verspätung. Ich bin erst um zehn Uhr da. Bitte machen Sie die Arbeit ohne mich. Vielen Dank und viele Grüße, Ana',
  12: 'Hallo Lena! Ich feiere am Freitag Geburtstag. Die Party ist um acht Uhr bei mir. Bringt ihr bitte Kuchen und Musik mit? Bis bald, Ana',
};

test('a correct, exam-grade answer passes the Formcheck of its own Mitteilung', () => {
  for (const [nr, answer] of Object.entries(EXAM_GRADE_ANSWERS)) {
    const res = scoreWriting(formcheckTask(Number(nr)), answer);
    const red = res.checks.filter((c) => !c.ok).map((c) => `${c.key} („${c.label}“)`);
    assert.deepEqual(red, [], `L${nr} (${countWords(answer)} Wörter): the Formcheck calls a correct answer incomplete`);
    assert.equal(res.ok, true, `L${nr}`);
  }
});

test('the reviewer’s L2 text is the fixture: it shares no token with two of its three Leitpunkte', () => {
  // WHY it used to fail, measured rather than asserted: the old rule took ONE token per Leitpunkt
  // („Name“, „Land“, „Familienstand“) and searched it as a substring. Two of the three do not occur
  // in a text that answers them — which is the structural point: a Leitpunkt is a request, an
  // answer is a statement.
  const text = EXAM_GRADE_ANSWERS[2];
  const bank = writingTaskByKey('goethe_a1', 'a11-l02');
  assert.deepEqual(bank.leitpunkte.map(leitpunktKeyword), ['Name', 'Land', 'Familienstand']);
  assert.ok(!/\bName\b/i.test(text) && !/\bLand\b/i.test(text), 'the fixture must not contain the old keywords');
  // …and every one of them is answered, by a word of the Leitpunkt's own family or by its shape.
  for (const lp of bank.leitpunkte) assert.equal(leitpunktSatisfied(lp, text), true, lp);
  // The family is DERIVED from the Leitpunkt: all its content words, plus the shape its head noun
  // asks for. „ledig oder verheiratet“ stands in the Leitpunkt itself — the text supplies its own
  // synonyms and round 13 read none of them.
  assert.deepEqual(leitpunktKeywords(bank.leitpunkte[2]), ['Familienstand', 'ledig', 'verheiratet']);
  assert.ok(leitpunktEvidence(bank.leitpunkte[0]).shapes.length, 'a Geburtsdatum has an answer shape (a date)');
});

test('the Formcheck stays honest: a text that omits a Leitpunkt fails that row', () => {
  // Same length, same Anrede and Gruß, same first two Leitpunkte — and no Familienstand anywhere.
  const missing = 'Sehr geehrte Damen und Herren, ich heiße Ana Chakiri. Ich bin am 3. Mai 1998 geboren. Ich komme aus Marokko und wohne jetzt in Bremen. Viele Grüße, Ana Chakiri';
  const res = scoreWriting(formcheckTask(2), missing);
  assert.ok(countWords(missing) >= 25, 'the fixture must clear the length row, or it proves nothing');
  assert.deepEqual(res.checks.filter((c) => !c.ok).map((c) => c.key), ['lp2'], JSON.stringify(res.checks));
  assert.equal(res.ok, false, 'a text that answers two of three Leitpunkte must not be green');
  // And the empty text fails everything that can be decided.
  const empty = scoreWriting(formcheckTask(2), '');
  assert.equal(empty.ok, false);
  assert.deepEqual(empty.checks.filter((c) => c.ok && !c.ai), []);
});

test('an undecidable Leitpunkt is shown and marked for the KI — never dropped, never green', () => {
  // „Warum Sie schreiben“: every token is a function word, so no form can decide it. Round 13
  // dropped those rows, and the task then showed three Leitpunkte while the checklist showed two.
  for (const nr of [8, 10]) {
    const task = formcheckTask(nr);
    const res = scoreWriting(task, EXAM_GRADE_ANSWERS[nr]);
    const lpRows = res.checks.filter((c) => c.key.startsWith('lp'));
    assert.equal(lpRows.length, task.leitpunkte.length, `L${nr}: the checklist must show every Leitpunkt`);
    assert.equal(lpRows[0].ai, true, `L${nr}: „${task.leitpunkte[0]}“ is undecidable by form`);
    assert.equal(leitpunktSatisfied(task.leitpunkte[0], 'irgendein Text'), null);
  }
  // Exactly two of the eighteen A1.1 Leitpunkte are in this class, and both are the same sentence.
  const undecidable = COURSE.flatMap((t) => (t.register === 'formular' ? [] : t.leitpunkte))
    .filter((lp) => leitpunktSatisfied(lp, 'Hallo Lena! Viele Grüße, Ana') === null);
  assert.deepEqual(undecidable, ['Warum Sie schreiben', 'Warum Sie schreiben']);
});

test('the Formcheck is one function: the screen and RULE 17 grade with the same code', () => {
  // `GradedWriting.jsx` calls scoreWriting, `scripts/validate-curriculum.mjs` calls scoreWriting.
  // No lexicon is passed in either place — everything the Leitpunkt check needs comes out of the
  // Leitpunkt, so the screen and the validator can never disagree (writing.js header).
  const src = readFileSync(join(ROOT, 'src/components/lesson/GradedWriting.jsx'), 'utf8');
  assert.match(src, /scoreWriting\(task, value\)/);
  const validator = readFileSync(join(ROOT, 'scripts/validate-curriculum.mjs'), 'utf8');
  assert.match(validator, /const res = scoreWriting\(task, value\)/);
  const writing = readFileSync(join(ROOT, 'src/lib/lesson/writing.js'), 'utf8');
  assert.ok(!/import /.test(writing), 'writing.js stays dependency-free — one function, both callers');
});

test('every A1.1 Beispieltext passes its own Formcheck — with the family rule, not around it', () => {
  // RULE 17 from the other side, and the guard the review asked for: no Beispieltext may contain a
  // word that is only there for the checker („Der Nachname ist Chakiri.“ next to „ich bin Ana
  // Chakiri“, „Das Land ist Marokko“ next to „Ich komme aus Marokko“).
  for (const l of LEKTIONEN) {
    if (l.schreiben.kind !== 'mitteilung') continue;
    const res = scoreWriting(formcheckTask(l.nr), l.schreiben.sample);
    assert.equal(res.ok, true, `L${l.nr}: ${JSON.stringify(res.checks.filter((c) => !c.ok))}`);
    assert.ok(countWords(l.schreiben.sample) >= 25 && countWords(l.schreiben.sample) <= 45, `L${l.nr} length`);
    assert.ok(!/Der Familienstand:|Das Land ist|Der Nachname ist/.test(l.schreiben.sample), `L${l.nr}: form-speak`);
  }
});
