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
  leitpunktConjuncts,
  openingCut,
} from '../src/lib/lesson/writing.js';
import { COUNTRY_STEMS, COUNTRY_NAMES, LANGUAGE_NAMES } from '../src/lib/lesson/countries.js';
import { formSpeakInModelTexts, formularSampleValues, LEVELS } from '../scripts/validate-curriculum.mjs';

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
  assert.match(src, /\? courseLimit\r?\n/, 'the enforced limit must be the derived course allowance');
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
  // (Round 15: the old fixture dropped the Staatsangehörigkeit too, and „Ich komme aus Marokko“
  // only answers the FIRST half of that coordinated Leitpunkt — so it now names the nationality,
  // or the test would no longer isolate lp2. DaF review #14, MAJOR 1.)
  const missing = 'Sehr geehrte Damen und Herren, ich heiße Ana Chakiri. Ich bin am 3. Mai 1998 geboren. Ich komme aus Marokko und bin Marokkanerin. Ich wohne jetzt in Bremen. Viele Grüße, Ana Chakiri';
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
  // Five of the eighteen A1.1 Leitpunkte are in this class.
  const undecidable = COURSE.flatMap((t) => (t.register === 'formular' ? [] : t.leitpunkte))
    .filter((lp) => leitpunktSatisfied(lp, 'Hallo Lena! Viele Grüße, Ana') === null);
  // ROUND 16 (DaF review #15, MAJOR 2): „Warum Sie feiern“ joins them. A reason is not a form, and
  // the only lower-case word of that Leitpunkt is the TASK's own verb — deciding it by that word
  // made the empty echo („Wir feiern.“) green and the reason („Ich habe Geburtstag.“) red.
  // 2026-09-14: the two Aufträge join them by owner decision — see the round-21 block below.
  assert.deepEqual(undecidable, ['Warum Sie schreiben', 'Warum Sie schreiben', 'Was die Kollegin bis dahin machen soll',
    'Warum Sie feiern', 'Was die Gäste mitbringen sollen']);
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
  // ROUND 18 (DaF review #17, Minor 17): ONE import is allowed, and it is a fact, not a rule — the
  // countries of the world, which the validator reads from the same file. Nothing from `src/data/`
  // (a level's Wortfeld, a curriculum) may ever be handed in: that is the dependency-freedom this
  // test has always pinned, and it still holds.
  const imports = [...writing.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]);
  assert.deepEqual(imports, ['./countries.js'], 'writing.js imports the world list and nothing else');
  assert.ok(!/from '[^']*\/data\//.test(writing), 'writing.js never imports a course');
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
    // FORM-SPEAK IS CHECKED AS A FORM, not as three strings — see the RULE 22 test below. The old
    // line here („Der Familienstand:|Das Land ist|Der Nachname ist“) knew none of the five
    // Formularsätze that stood in this file when DaF review #15 measured it.
  }
});


// ───────────────────────────────────────────────────────────────────────────────────────────────
// THE OTHER DIRECTION — DaF review #14, MAJOR 1
//
// Round 14 repaired the false RED of round 13 and bought a false GREEN: eleven texts that
// demonstrably do not answer their Leitpunkt all got a tick („Wir sind zwei Kollegen.“ satisfied
// „Ihre Telefonnummer“ because the old PHONE_RE saw the numeral `zwei`; any coordinated Leitpunkt
// „X und Y“ was satisfied by half of itself). A rule tested only in the green direction is exactly
// the rule that round built, so these are the reviewer's own eleven probes, quoted from
// REVIEW-daf-14-2026-09-12.md, and the invariant they pin is: **the Formcheck is never green on a
// text that omits a Leitpunkt.** It is the only feedback a signed-out or offline learner gets.
// ───────────────────────────────────────────────────────────────────────────────────────────────

/** Nine single-Leitpunkt probes; the two whole Mitteilungen follow below (eleven rows in all). */
const NEGATIVE_PROBES = [
  ['Ihr Name und Ihr Geburtsdatum', 'Sehr geehrte Damen und Herren, ich heiße Ana Chakiri. Viele Grüße, Ana'],
  ['Ihr Land und Ihre Staatsangehörigkeit', 'Ich bin aus Marokko.'],
  ['Ihre Telefonnummer', 'Ich bin um neun Uhr im Büro.'],
  ['Ihre Telefonnummer', 'Wir sind zwei Kollegen.'],
  ['Neuer Tag und neue Uhrzeit', 'Ich komme am Montag zu spät.'],
  // The review's two Auftrag probes („Ich komme um zehn Uhr. Bis dann!“, „Ich lade meine Gäste
  // ein.“) moved to AUFTRAG_PROBES below on 2026-09-14: the Auftrag row is the KI's, never red.
  ['Wann Sie sich treffen', 'Wir treffen Ana auf dem Flohmarkt.'],
  // The reworded L4 Leitpunkt (DaF review #14, BLOCKER 1) under the same probe: a verb without a
  // time does not say WANN.
  ['Wann Sie kommen', 'Ich komme bald.'],
];

test('the eleven probes of DaF review #14: a text that does not answer its Leitpunkt is never green', () => {
  for (const [lp, text] of NEGATIVE_PROBES) {
    assert.equal(leitpunktSatisfied(lp, text), false, `„${lp}“ ← „${text}“ must not be satisfied`);
  }
  // Probe 10: the L2 Mitteilung without the Geburtsdatum. Everything else about it is right —
  // length, Anrede, Gruß, the other two Leitpunkte — so the only thing that may turn it red is the
  // Leitpunkt it omits.
  const l2 = 'Sehr geehrte Damen und Herren, ich heiße Ana Chakiri. Ich komme aus Marokko und bin Marokkanerin. Ich bin ledig. Ich wohne jetzt in Bremen. Viele Grüße, Ana Chakiri';
  const r2 = scoreWriting(formcheckTask(2), l2);
  assert.deepEqual(r2.checks.filter((c) => !c.ok).map((c) => c.key), ['lp0'], JSON.stringify(r2.checks));
  assert.equal(r2.ok, false);
  // Probe 11: the L6 Mitteilung without the Telefonnummer — and it still mentions a „Nummer“ and a
  // clock time, which is what made round 14 call it complete.
  const l6 = 'Guten Tag, Frau Berg! Ich brauche einen Computer. Wir brauchen auch ein Handy. Die Nummer ist für das Handy. Ich bin um neun Uhr im Büro. Viele Grüße, Ana';
  const r6 = scoreWriting(formcheckTask(6), l6);
  assert.deepEqual(r6.checks.filter((c) => !c.ok).map((c) => c.key), ['lp1'], JSON.stringify(r6.checks));
  assert.equal(r6.ok, false);
});

test('a coordinated Leitpunkt is a conjunction, „oder“ is not', () => {
  // „Ihr Land und Ihre Staatsangehörigkeit“ is ONE Leitpunkt in Start Deutsch 1 and half an answer
  // is no answer; „ledig oder verheiratet“ is one conjunct with two alternatives, and the
  // Leitpunkt supplies its own answers there.
  assert.deepEqual(leitpunktConjuncts('Ihr Land und Ihre Staatsangehörigkeit'), ['Ihr Land', 'Ihre Staatsangehörigkeit']);
  assert.deepEqual(leitpunktConjuncts('Ihr Familienstand: ledig oder verheiratet'), ['Ihr Familienstand: ledig oder verheiratet']);
  assert.equal(leitpunktSatisfied('Ihr Familienstand: ledig oder verheiratet', 'Ich bin verheiratet.'), true);
  assert.equal(leitpunktSatisfied('Ihr Land und Ihre Staatsangehörigkeit', 'Ich komme aus Marokko und bin Marokkanerin.'), true);
});

test('the answer shapes are shape-specific: a bare numeral satisfies nothing', () => {
  // A phone number is four digits or four number words in sequence — the shortest number the
  // course itself writes is „null eins sieben sechs“ (A1.1 L2 dialogue).
  assert.equal(leitpunktSatisfied('Ihre Telefonnummer', 'Meine Telefonnummer ist null eins sieben sechs.'), true);
  assert.equal(leitpunktSatisfied('Ihre Telefonnummer', 'Meine Nummer ist 0176 22 44 88.'), true);
  assert.equal(leitpunktSatisfied('Ihre Telefonnummer', 'Der Stuhl kostet zwölf Euro.'), false);
  // A price has Euro, a clock has Uhr, a weekday is a weekday, a date is day + month.
  assert.equal(leitpunktSatisfied('Was es kostet', 'Er kostet zwölf Euro.'), true);
  assert.equal(leitpunktSatisfied('Was es kostet', 'Ich kaufe drei Stühle.'), false);
  assert.equal(leitpunktSatisfied('Neuer Tag und neue Uhrzeit', 'Geht es am Dienstag um halb neun?'), true);
  assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', 'Ich bin am 3. Mai 1998 geboren.'), true);
  assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', 'Ich bin zwanzig.'), false);
  // A country is not a nationality, and a profession is not one either.
  assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', 'Ich bin Studentin in Bremen.'), false);
  assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', 'Die Staatsangehörigkeit ist marokkanisch.'), true);
});

test('in an indirect question the nouns are the task’s topic and the verb is the answer', () => {
  // „Was Sie kaufen“ ← „Der Flohmarkt ist gut.“ answers nothing; the lower-case verb is the evidence.
  const lp = 'Was Sie kaufen';
  assert.deepEqual(leitpunktEvidence(lp).conjuncts[0].words, ['kaufen']);
  assert.equal(leitpunktSatisfied(lp, 'Ich kaufe den Stuhl.'), true);
  assert.equal(leitpunktSatisfied(lp, 'Der Flohmarkt ist gut.'), false);
  // The Auftrag („… mitbringen sollen“) keeps its verb as the conjunct's WORD — RULE 21 measures
  // whether the course has taught it — but carries nothing that scores: no fold, no shape. Since
  // 2026-09-14 the row is the KI's (see the round-21 block below).
  const auftrag = leitpunktEvidence('Was die Gäste mitbringen sollen').conjuncts[0];
  assert.deepEqual(auftrag.words, ['mitbringen']);
  assert.deepEqual([auftrag.folded, auftrag.shapes], [[], []], 'the Auftrag conjunct decides nothing by form');
});


// ───────────────────────────────────────────────────────────────────────────────────────────────
// ROUND 16 — DaF review #15, MAJOR 1 and MAJOR 2
//
// Two findings of one kind: a rule that closes its instance and leaves its class open.
//  • MAJOR 1 — RULE 21 asked „is this Leitpunkt answerable from the taught lexis?“ and measured it
//    with a checker that accepts the NAMED FIELD, so „Das Geburtsdatum ist der 3.5.1998.“ counted
//    as an answer although A1.1 teaches neither `geboren` nor a month by Lektion 2. The course then
//    wrote that sentence into its model text — five such sentences in three of six Mitteilungen —
//    and the guard against them was a list of three strings that knew none of the five.
//  • MAJOR 2 — `NATIONALITY_RE` recognised 18 of 50 common nationality forms, essentially those of
//    the course's own character, so every learner who is not Ana got a red cross on a right answer.
// ───────────────────────────────────────────────────────────────────────────────────────────────

/**
 * FIFTY common nationality forms — adjective and noun, masculine and feminine. The 28 the review
 * names verbatim (the eight adjectives and twelve nouns it measured as MISSED, plus the seven it
 * measured as hit and `Deutscher`) are marked; the rest are the same classes for the other big
 * origin groups of a German integration course. ALL FIFTY must be recognised.
 */
const NATIONALITY_FORMS = [
  // Quoted from REVIEW-daf-15: not recognised before round 16 (adjectives) …
  'türkisch', 'polnisch', 'russisch', 'syrisch', 'arabisch', 'spanisch', 'indisch', 'iranisch',
  // … and the nouns it measured as missed.
  'Türkin', 'Türke', 'Polin', 'Pole', 'Russin', 'Syrerin', 'Italienerin', 'Ukrainerin', 'Inderin',
  'Griechin', 'Afghanin', 'Rumänin',
  // Quoted from REVIEW-daf-15 as the forms that WERE recognised — they must stay recognised.
  'marokkanisch', 'Marokkanerin', 'Marokkaner', 'deutsch', 'Deutsche', 'Spanier', 'Italienisch',
  'Deutscher',
  // The same two classes for the other large origin groups.
  'ukrainisch', 'italienisch', 'griechisch', 'afghanisch', 'rumänisch', 'portugiesisch',
  'chinesisch', 'vietnamesisch', 'brasilianisch', 'amerikanisch', 'kroatisch', 'serbisch',
  'bulgarisch', 'albanisch', 'kurdisch',
  'Russe', 'Syrer', 'Ukrainer', 'Inder', 'Grieche', 'Französin', 'Chinesin',
];

/** Ten words the same shapes must NOT swallow: the profession family and the course's own nouns. */
const NOT_NATIONALITIES = [
  'Studentin', 'Student', 'Lehrerin', 'Lehrer', 'Kellner', 'Verkäuferin', 'Fahrer', 'Ärztin',
  'Kollegin', 'Ingenieurin',
];

test('MAJOR 2: the nationality shape is a CLASS — all fifty forms, none of the ten professions', () => {
  assert.equal(NATIONALITY_FORMS.length, 50, 'the review measured fifty forms');
  const missed = NATIONALITY_FORMS.filter(
    (f) => leitpunktSatisfied('Ihre Staatsangehörigkeit', `Ich bin ${f}.`) !== true,
  );
  assert.deepEqual(missed, [], `${missed.length} of 50 nationality forms are not recognised`);
  const wrong = NOT_NATIONALITIES.filter(
    (f) => leitpunktSatisfied('Ihre Staatsangehörigkeit', `Ich bin ${f}.`) !== false,
  );
  assert.deepEqual(wrong, [], 'a profession must never answer „Ihre Staatsangehörigkeit“');
  // And the country half: „aus der Türkei“ is a country name with its article.
  assert.equal(leitpunktSatisfied('Ihr Land', 'Ich komme aus der Türkei.'), true);
  assert.equal(leitpunktSatisfied('Ihr Land', 'Ich komme aus dem Irak.'), true);
});

test('MAJOR 2: „Warum“ is undecidable by form — the reason is not the task’s verb echoed back', () => {
  // Round 15 made „Warum Sie feiern“ decidable through the only lower-case word it has, which is
  // the TASK's own verb: „Wir feiern.“ (the empty echo) was green, „Ich habe Geburtstag.“ (the
  // reason) was red. Both are now „prüft die KI“, where „Warum Sie schreiben“ already stood.
  assert.equal(leitpunktSatisfied('Warum Sie feiern', 'Wir feiern.'), null);
  assert.equal(leitpunktSatisfied('Warum Sie feiern', 'Ich habe Geburtstag.'), null);
  assert.equal(leitpunktSatisfied('Warum Sie schreiben', 'Der Zug hat Verspätung.'), null);
  // „Wann“ keeps its shape: a time IS a form.
  assert.equal(leitpunktSatisfied('Wann Sie kommen', 'Wir kommen morgen.'), true);
  assert.equal(leitpunktSatisfied('Wann Sie kommen', 'Wir kommen bald.'), false);
});

/**
 * THREE LINES PER LEITPUNKT of all six A1.1 Mitteilungen — one exam-grade answer that must be
 * GREEN, one that does not answer the Leitpunkt and must be RED, and (round 17, DaF review #16,
 * MAJOR 1, „Drittens“) the TOPIC-ECHO: a text that names the Leitpunkt's own topic and gives no
 * value („Ich bin in Bremen geboren.“ for a Geburtsdatum, „Ich komme aus Bremen.“ for a Land,
 * „Ich spreche Arabisch.“ for a Staatsangehörigkeit). It must be RED too, and on three of these
 * rows it was green until round 17. The rule is tested in both directions on every Leitpunkt of
 * the course rather than on the probes of one round, and the nationality line plays five origins
 * in both word classes.
 */
const LEITPUNKT_FIXTURE = [
  // Leitpunkt, GREEN, RED, TOPIC-ECHO (also red — it names the topic and gives no value)
  ['Ihr Name und Ihr Geburtsdatum', 'Ich heiße Ana Chakiri. Ich bin am 3.5.1998 geboren.', 'Ich heiße Ana Chakiri.', 'Ich heiße Ana Chakiri. Ich bin in Bremen geboren.'],
  ['Ihr Land und Ihre Staatsangehörigkeit', 'Ich komme aus der Türkei. Ich bin Türkin.', 'Ich komme aus der Türkei.', 'Ich komme aus Bremen. Ich spreche Türkisch.'],
  ['Ihr Familienstand: ledig oder verheiratet', 'Ich bin verheiratet.', 'Ich bin Studentin in Bremen.', 'Der Familienstand ist wichtig.'],
  ['Was Sie kaufen', 'Ich kaufe den Stuhl und die Lampe.', 'Der Flohmarkt ist gut.', 'Ich gehe zum Einkaufen.'],
  ['Was es kostet', 'Der Stuhl kostet zwölf Euro.', 'Der Stuhl ist nicht teuer.', 'Der Preis ist gut.'],
  ['Wann Sie kommen', 'Wir kommen morgen.', 'Wir kommen bald.', 'Wir kommen zu der Zeit.'],
  ['Was Sie brauchen', 'Ich brauche einen Computer.', 'Das Büro ist neu.', 'Ich habe einen Wunsch.'],
  ['Ihre Telefonnummer', 'Hier ist die Nummer: null vier zwei drei drei acht eins.', 'Ich bin um neun Uhr im Büro.', 'Meine Telefonnummer ist neu.'],
  ['Wann Sie im Büro sind', 'Ich bin um neun Uhr im Büro.', 'Ich arbeite im Büro.', 'Ich bin zur Bürozeit da.'],
  ['Neuer Tag und neue Uhrzeit', 'Geht es am Dienstag um halb neun?', 'Ich komme am Montag zu spät.', 'Wir brauchen einen neuen Tag und eine neue Uhrzeit.'],
  ['Eine Frage an Lena', 'Bist du dann pünktlich?', 'Ich habe eine Frage für Lena.', 'Ich stelle Lena eine Frage.'],
  ['Tag und Uhrzeit', 'Wir feiern am Freitag um acht Uhr.', 'Wir feiern am Freitag.', 'Der Tag und die Uhrzeit stehen fest.'],
  // The two Aufträge („Was die Kollegin bis dahin machen soll“, „Was die Gäste mitbringen sollen“)
  // left this table on 2026-09-14: they are KI rows now, and the `open` check below covers them.
];

test('every decidable Leitpunkt of the six Mitteilungen is tested GREEN and RED', () => {
  for (const [lp, green, red, echo] of LEITPUNKT_FIXTURE) {
    assert.equal(leitpunktSatisfied(lp, green), true, `„${lp}“ ← „${green}“ must be green`);
    assert.equal(leitpunktSatisfied(lp, red), false, `„${lp}“ ← „${red}“ must be red`);
    // The topic-echo: the Leitpunkt's own subject named, no value given (DaF review #16, MAJOR 1).
    assert.equal(leitpunktSatisfied(lp, echo), false, `„${lp}“ ← „${echo}“ names the topic, not a value`);
  }
  // Five origins, adjective and noun, on the Leitpunkt the review measured (MAJOR 2).
  for (const [adj, noun] of [['marokkanisch', 'Marokkanerin'], ['türkisch', 'Türkin'],
    ['polnisch', 'Polin'], ['syrisch', 'Syrerin'], ['ukrainisch', 'Ukrainerin']]) {
    assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', `Ich bin ${adj}.`), true, adj);
    assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', `Ich bin ${noun}.`), true, noun);
  }
  // Every Leitpunkt of the course is either in the fixture or undecidable („Warum Sie …“).
  const covered = new Set(LEITPUNKT_FIXTURE.map(([lp]) => lp));
  const open = COURSE.filter((t) => t.register !== 'formular')
    .flatMap((t) => t.leitpunkte)
    .filter((lp) => !covered.has(lp) && leitpunktSatisfied(lp, 'Hallo! Viele Grüße, Ana') !== null);
  assert.deepEqual(open, [], 'a Leitpunkt of the course is in neither the fixture nor the KI rows');
});

// ───────────────────────────────────────────────────────────────────────────────────────────────
// ROUND 17 — DaF review #16, MAJOR 1: A VALUE, NOT A TOPIC
//
// Round 16's shapes recognised the SUBJECT of the question instead of its ANSWER. The reviewer ran
// 21 probes over the Leitpunkte of all six Mitteilungen, one exam-grade and one topic-echo each,
// and three came back green on a text that answers nothing: `DATE_RE` counted the bare word
// `geboren`, `COUNTRY_RE` counted any capitalised word after `aus`, and `isNationalityWord`
// counted `Arabisch` — which in German is a LANGUAGE, and „Ich spreche Arabisch und Deutsch.“ is
// the sentence every learner of this course writes. The rule this table pins is one line:
// AN ANSWER FORM MUST MATCH A VALUE OF ITS KIND. The six texts the review quotes verbatim are
// marked; the rest carry the same rule across the other shapes.
// ───────────────────────────────────────────────────────────────────────────────────────────────

/** `[Leitpunkt, text, expected, quoted-from-review]` — 21 probes, 7 red, 14 green. */
const ROUND_17_PROBES = [
  // The three findings, in the reviewer's own words (six texts).
  ['Ihr Name und Ihr Geburtsdatum', 'Ich heiße Ana. Ich bin in Bremen geboren.', false, true],
  ['Ihr Name und Ihr Geburtsdatum', 'Ich heiße Ana. Ich habe Geburtstag.', false, true],
  ['Ihr Name und Ihr Geburtsdatum', 'Ich heiße Ana. Meine Mutter ist auch geboren.', false, true],
  ['Ihr Land', 'Ich komme aus Bremen.', false, true],
  ['Ihre Staatsangehörigkeit', 'Ich spreche Arabisch.', false, true],
  ['Ihre Staatsangehörigkeit', 'Meine Sprache ist Arabisch.', false, true],
  // The sentence the review calls the rule rather than the edge.
  ['Ihre Staatsangehörigkeit', 'Ich spreche Arabisch und Deutsch.', false, false],
  // The same three axes in the GREEN direction — a value of the right kind is still an answer.
  ['Ihr Name und Ihr Geburtsdatum', 'Ich heiße Ana Chakiri. Ich bin am 3. Mai 1998 geboren.', true, false],
  ['Ihr Name und Ihr Geburtsdatum', 'Ich heiße Ana Chakiri. Ich bin am 3.5.1998 geboren.', true, false],
  ['Ihr Geburtsdatum', 'Ich bin am 3.5.98 geboren.', true, false],
  ['Ihr Land', 'Ich komme aus Marokko.', true, false],
  ['Ihr Land', 'Ich komme aus der Türkei.', true, false],
  ['Ihr Land', 'Ich komme aus Frankreich.', true, false],
  ['Ihre Staatsangehörigkeit', 'Ich spreche Arabisch und bin Marokkanerin.', true, false],
  ['Ihre Staatsangehörigkeit', 'Ich spreche Arabisch. Ich bin Marokkanerin.', true, false],
  ['Ihre Staatsangehörigkeit', 'Ich bin türkisch.', true, false],
  // The same rule on the other shapes: the field named without a value of its kind is no answer.
  ['Ihre Telefonnummer', 'Meine Telefonnummer ist neu.', false, false],
  ['Ihre Telefonnummer', 'Meine Telefonnummer ist null eins sieben sechs.', true, false],
  ['Ihre Uhrzeit', 'Die Uhr ist kaputt.', false, false],
  ['Ihre Uhrzeit', 'Der Termin ist um acht Uhr.', true, false],
  ['Was es kostet', 'Der Stuhl kostet zwölf Euro.', true, false],
];

test('MAJOR 1: an answer form matches a VALUE of its kind, never the topic of the question', () => {
  assert.equal(ROUND_17_PROBES.length, 21, 'the review ran twenty-one probes');
  assert.equal(ROUND_17_PROBES.filter(([, , , quoted]) => quoted).length, 6, 'six texts are quoted verbatim');
  const wrong = ROUND_17_PROBES
    .filter(([lp, text, want]) => leitpunktSatisfied(lp, text) !== want)
    .map(([lp, text, want]) => `„${lp}“ ← „${text}“ must be ${want ? 'GREEN' : 'RED'}`);
  assert.deepEqual(wrong, [], `${wrong.length} of 21 probes disagree`);
  // And the field named with nothing behind it — the purest form of the same error.
  assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', 'Mein Geburtsdatum: …'), false);
  assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', 'Mein Geburtsdatum ist wichtig.'), false);
  assert.equal(leitpunktSatisfied('Ihr Land', 'Das Land ist schön.'), false);
  assert.equal(leitpunktSatisfied('Ihr Land', 'Das Land ist Marokko.'), true);
});

test('MAJOR 1: a language is not a nationality — case and context tell them apart', () => {
  // German spells them alike. The language is the capitalised noun after `sprechen`; the
  // nationality is the lower-case adjective after `sein` or the noun („Marokkanerin“).
  for (const lang of ['Arabisch', 'Deutsch', 'Englisch', 'Türkisch', 'Russisch']) {
    assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', `Ich spreche ${lang}.`), false, lang);
    assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', `Meine Sprache ist ${lang}.`), false, lang);
  }
  // …and the same sentence still answers „Ihre Sprachen“-shaped rows through its own words, while
  // a second sentence that names the nationality is read normally.
  assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', 'Ich spreche Arabisch. Ich bin arabisch.'), true);
  assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', 'Nationalität: arabisch'), true);
});

test('MAJOR 1: a country is a country name, not any capitalised word after „aus“', () => {
  for (const city of ['Bremen', 'Berlin', 'Bonn', 'Köln', 'Frankfurt', 'Hamburg', 'München']) {
    assert.equal(leitpunktSatisfied('Ihr Land', `Ich komme aus ${city}.`), false, city);
  }
  for (const land of ['Marokko', 'der Türkei', 'dem Irak', 'Syrien', 'Polen', 'Frankreich',
    'China', 'Vietnam', 'Mexiko', 'Deutschland', 'Indien', 'der Ukraine', 'Italien']) {
    assert.equal(leitpunktSatisfied('Ihr Land', `Ich komme aus ${land}.`), true, land);
  }
});

test('MAJOR 1: a date is a day and a month, and `geboren` alone is neither', () => {
  for (const text of ['Ich bin am 3. Mai 1998 geboren.', 'Ich bin am 3.5.1998 geboren.',
    'Ich bin am 3.5.98 geboren.', 'Ich bin im Mai 1998 geboren.', 'Geburtsdatum: 03.05.1998']) {
    assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', text), true, text);
  }
  for (const text of ['Ich bin in Bremen geboren.', 'Ich habe Geburtstag.',
    'Meine Mutter ist auch geboren.', 'Mein Geburtsdatum steht im Pass.', 'Ich bin zwanzig.']) {
    assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', text), false, text);
  }
  // An AGE is a value of another kind, and it has its own row — „Ihr Alter“ is not a Geburtsdatum.
  assert.equal(leitpunktSatisfied('Ihr Alter', 'Ich bin zwanzig.'), true);
  assert.equal(leitpunktSatisfied('Ihr Alter', 'Ich bin 25 Jahre alt.'), true);
  assert.equal(leitpunktSatisfied('Ihr Alter', 'Ich bin jung.'), false);
});

test('MAJOR 1: the named field is the learner’s answer and never the course’s', () => {
  // On the screen (`allowNamedField` defaults to true) naming the field and filling it IS an
  // answer — a Spanish name is not matched by `heiße`, and the learner has answered.
  assert.equal(leitpunktSatisfied('Ihr Name', 'Der Name ist Ana Ruiz.'), true);
  assert.equal(leitpunktSatisfied('Ihr Familienstand', 'Der Familienstand: geschieden'), true);
  // Where the COURSE is measured it is not: RULE 21 asks whether a real Mitteilung exists in the
  // taught lexis, not whether some string turns the checklist green.
  assert.equal(leitpunktSatisfied('Ihr Name', 'Der Name ist Ana Ruiz.', { allowNamedField: false }), false);
  assert.equal(leitpunktSatisfied('Ihr Name', 'Ich heiße Ana Ruiz.', { allowNamedField: false }), true);
  assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', 'Ich bin am 3.5.1998 geboren.', { allowNamedField: false }), true);
  const validator = readFileSync(join(ROOT, 'scripts/validate-curriculum.mjs'), 'utf8');
  assert.match(validator, /allowNamedField: false/, 'RULE 21 measures without the named field');
});

test('RULE 22: no sentence of a Mitteilung Beispieltext is a form being read out', () => {
  // The nouns come from the TASK BANK, so the rule finds what it finds; round 15's guard was three
  // typed strings and stayed silent over five real Formularsätze (L2 two, L6 two, L12 one).
  assert.deepEqual(formSpeakInModelTexts(CURRICULUM_A11, LEVELS['a1.1']), []);
  // And the negative probe: the sentence the review quoted must be REPORTED when it stands there.
  const probe = {
    ...CURRICULUM_A11,
    lektionen: CURRICULUM_A11.lektionen.map((l) => (l.nr !== 2 ? l : {
      ...l,
      schreiben: { ...l.schreiben, sample: `${l.schreiben.sample}. Die Staatsangehörigkeit ist marokkanisch.` },
    })),
  };
  const found = formSpeakInModelTexts(probe, LEVELS['a1.1']);
  assert.equal(found.length, 1, JSON.stringify(found));
  assert.equal(found[0].noun, 'Staatsangehörigkeit');
  // A POSSESSIVE is not form-speak: „Meine Telefonnummer ist …“ is what a person writes.
  const ok = {
    ...CURRICULUM_A11,
    lektionen: CURRICULUM_A11.lektionen.map((l) => (l.nr !== 2 ? l : {
      ...l,
      schreiben: { ...l.schreiben, sample: `${l.schreiben.sample}. Meine Telefonnummer ist null eins sieben sechs.` },
    })),
  };
  assert.deepEqual(formSpeakInModelTexts(ok, LEVELS['a1.1']), []);
});


// ───────────────────────────────────────────────────────────────────────────────────────────────
// ROUND 18 — DaF review #17, MAJOR 1 (with Minor 12 and Minor 17): THE CLASS, IN BOTH DIRECTIONS
//
// Round 17 closed „a language is not a nationality“ at three instances and left the class open: the
// marker had a `\b` before `sprach`, so the compound `Muttersprache` was no marker, and `lernen` was
// none at all — 37 of the reviewer's 162 language sentences were green on „Ihre Staatsangehörigkeit“,
// every one in „Meine Muttersprache ist …“ or „Ich lerne …“, and „Ich lerne Deutsch.“ is the sentence
// every learner writes. And the Auftrag Leitpunkte („Was die Kollegin bis dahin machen soll“) were
// still decided by a predicate echo: on L10 ten of twelve correct instructions were red and four
// `machen` sentences that instruct nothing were green. Each is closed here as a RULE with the probe
// in both directions, never as a list of the sentences that happened to fail. (The Auftrag half of
// rounds 18–20 was superseded on 2026-09-14 — see the round-21 block below.)
// ───────────────────────────────────────────────────────────────────────────────────────────────

test('MAJOR 1 (round 18): what a person speaks, has as a mother tongue or learns is a language', () => {
  // The two sentences the review names, and the two the Leitpunkt line of every learner carries.
  assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', 'Meine Muttersprache ist Arabisch.'), false);
  assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', 'Ich lerne Deutsch.'), false);
  assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', 'Ich möchte Deutsch lernen.'), false);
  assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', 'Deutsch ist schwer.'), false, 'the bare capitalised Deutsch is the language');
  // THE CLASS: the reviewer's six sentence frames over the languages of the room — none green.
  const langs = ['Arabisch', 'Deutsch', 'Englisch', 'Türkisch', 'Kurdisch', 'Persisch', 'Russisch',
    'Ukrainisch', 'Polnisch', 'Rumänisch', 'Französisch', 'Spanisch', 'Italienisch', 'Chinesisch',
    'Vietnamesisch', 'Griechisch', 'Albanisch', 'Serbisch', 'Bosnisch', 'Portugiesisch'];
  const frames = [(l) => `Ich spreche ${l}.`, (l) => `Ich spreche ${l} und Deutsch.`, (l) => `Meine Sprache ist ${l}.`,
    (l) => `Meine Muttersprache ist ${l}.`, (l) => `Ich lerne ${l}.`, (l) => `${l} ist meine Sprache.`];
  const green = langs.flatMap((l) => frames.map((f) => f(l)))
    .filter((t) => leitpunktSatisfied('Ihre Staatsangehörigkeit', `Ich heiße Ana. ${t}`) !== false);
  assert.deepEqual(green, [], `${green.length} language sentences answer a Staatsangehörigkeit`);
  // …and no true nationality sentence turned red with it: the same sentence that names one is green.
  for (const t of ['Ich lerne Deutsch und bin Marokkanerin.', 'Meine Muttersprache ist Arabisch. Ich bin Syrer.',
    'Ich bin Deutsche und lerne Arabisch.', 'Ich bin Deutsch.', 'Nationalität: deutsch', 'Ich bin türkisch.']) {
    assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', t), true, t);
  }
});

// ───────────────────────────────────────────────────────────────────────────────────────────────
// ROUND 21 (2026-09-14) — THE AUFTRAG IS UNDECIDABLE BY FORM (owner decision after DaF reviews
// #17–#20)
//
// „Was die Kollegin bis dahin machen soll“ and „Was die Gäste mitbringen sollen“ — an indirect
// question closed by a modal — were repaired four rounds in a row and measured wrong four times:
// round 17 decided them by the task's verb echoed back (10 of 12 correct Aufträge red), round 18 by
// three instruction shapes (0 of 10 exam statements green, „Der Zug kann nicht fahren.“ green),
// round 19 by a fourth shape with a subject and a complement rule (22 of 48 correct answers red,
// „Die Gäste tanzen.“ green), round 20 by a vocative cut and a bare imperative (13 of 51 red, „Die
// Kollegin fährt mit dem Zug.“ green). The reason is not a missing case: „Die Kollegin trinkt
// Kaffee.“ and „Die Kollegin ruft Herrn Weber an.“ have one form, and only their meaning tells a
// description from an instruction. So the row is the KI's — „prüft die KI“, exactly like „Warum Sie
// schreiben“ — and the Formcheck neither greens nor reds it. ONE rule test below: every sentence the
// four rounds argued over, correct answers and non-answers alike, yields the KI row; a non-modal
// Leitpunkt in the same task is still decided by form; and the rule is the SHAPE of the Leitpunkt
// (W-word first, modal last), not a list of the two that carry it today.
// ───────────────────────────────────────────────────────────────────────────────────────────────

const L10 = 'Was die Kollegin bis dahin machen soll';
const L12 = 'Was die Gäste mitbringen sollen';
const wrap10 = (t) => `Liebe Kollegin, der Zug hat Verspätung. Ich komme um zehn Uhr. ${t} Viele Grüße, Ana`;
const wrap12 = (t) => `Hallo Lena! Ich habe Geburtstag. Wir feiern am Samstag um acht Uhr. ${t} Bis bald, Ana`;

/**
 * EVERY SENTENCE THE FOUR ROUNDS PROBED, kept as the history of the finding — `correct` were the
 * exam-grade answers the reviews wanted green, `other` the echoes, descriptions, questions, thing
 * subjects, greetings and the writer's own plans they wanted red. Under the rule of this round the
 * two lists have ONE verdict: the KI row.
 */
const AUFTRAG_PROBES = [
  [L10, wrap10, {
    correct: [
      // round 18: instruction, `bitte` + verb, modal chunk
      'Bitte rufen Sie Herrn Weber an.', 'Warten Sie bitte im Büro.', 'Sie können ohne mich beginnen.',
      'Rufen Sie Herrn Weber an.', 'Bitte Herrn Weber anrufen.', 'Sie müssen Herrn Weber anrufen.',
      'Bitte machen Sie die Arbeit ohne mich.',
      // round 19: the statement about the person; the modal with a person subject; `bitte` + verb
      'Die Kollegin beginnt ohne mich.', 'Sie beginnt bitte ohne mich.', 'Die Kollegen können schon beginnen.',
      'Meine Kollegin soll warten.', 'Frau Berg beginnt ohne mich.',
      'Sie kann ohne mich beginnen.', 'Die Kollegin soll warten.', 'Sie müssen nichts machen.', 'Können Sie Herrn Weber anrufen?',
      'Bitte warten.', 'Bitte warten Sie auf mich.', 'Warten Sie.', 'Warten Sie bitte.', 'Bitte schreiben Sie Frau Berg.',
      'Bitte sagen Sie Herrn Weber Bescheid.',
      // round 20: the complement that is one; the modal question with a noun subject; the vocative
      'Sie beginnt ohne mich.', 'Die Kollegin wartet auf mich.',
      'Kann die Kollegin warten?', 'Soll die Kollegin warten?', 'Muss die Kollegin warten?', 'Kann sie warten?',
      'Frau Berg, warten Sie bitte.', 'Herr Weber, rufen Sie bitte Frau Berg an.', 'Und die Kollegin soll warten.',
      // review #20, MAJOR 1: the formal address in the sentence
      'Sehr geehrte Frau Berg, beginnen Sie ohne mich.',
    ],
    other: [
      // review #14: the time, not the task
      'Ich komme um zehn Uhr. Bis dann!',
      // round 18: the verb echo; the question; the writer's own modal
      'Das macht nichts.', 'Ich mache das später.', 'Wir machen eine Pause.', 'Was machen Sie heute?',
      'Ich muss Herrn Weber anrufen.', 'Kommst du?', 'Hast du Zeit?', 'Die Kollegin weiß, was sie tut.',
      // round 19: a time; `sein`/`haben`; a thing, `es`, `man`; `bitte` without a verb; the time question
      'Die Kollegin kommt um neun Uhr.', 'Sie ist müde.', 'Die Kollegin hat Zeit.', 'Sind Sie müde?',
      'Der Zug kann nicht fahren.', 'Der Bus kann nicht fahren.', 'Es kann regnen.', 'Es muss schnell gehen.',
      'Der Zug muss um neun Uhr fahren.', 'Der Chef muss das wissen.', 'Man muss warten.', 'Dann können wir beginnen.',
      'Leider kann ich nicht kommen.',
      'Entschuldigung, bitte.', 'Vielen Dank, bitte.', 'Danke, bitte.', 'Bitte, der Zug hat Verspätung.', 'Ich komme bitte um zehn Uhr.', 'Wie bitte?',
      'Kommen Sie um zehn Uhr?', 'Arbeiten Sie heute?',
      // round 20: nothing beyond the verb, a time, a place; greetings; a thing subject in any order
      'Die Kollegin arbeitet.', 'Herr Weber wartet.', 'Die Kollegin telefoniert.', 'Die Kollegin kommt auch.',
      'Die Kollegin wartet im Büro.', 'Die Kollegin arbeitet im Büro.', 'Die Kollegin wohnt in Bremen.', 'Die Kollegin fährt nach Bremen.',
      'Sie arbeitet im Büro.', 'Sie kommt auch später.', 'Die Kollegen kommen auch.', 'Frau Berg kommt auch.', 'Herr Weber ist da.',
      'Der Chef arbeitet.', 'Sie kommt um neun Uhr.', 'Die Kollegen kommen um neun Uhr, ich komme um zehn Uhr.',
      'Frau Berg, der Zug hat Verspätung.', 'Hallo Frau Berg!', 'Guten Tag, Frau Berg!', 'Vielen Dank!', 'Schöne Grüße!', 'Gute Party!',
      'Herr Weber ruft an.', 'Lena ruft an.',
      'Und der Zug kann nicht fahren.', 'Morgen fährt der Zug nicht.',
      // review #20, MAJOR 2: the means of transport that the complement rule read as an Auftrag
      'Die Kollegin fährt mit dem Zug.', 'Die Kollegen fahren mit dem Bus.',
    ],
  }],
  [L12, wrap12, {
    correct: [
      // round 18
      'Bringt ihr bitte Kuchen und Musik mit?', 'Bitte kommt mit Kuchen.', 'Bitte Kuchen und Salat kaufen.', 'Ihr könnt Getränke kaufen.',
      // round 19: the exam's statements; the modal with a person; `bitte` + verb; the thing asked for
      'Die Gäste bringen Kuchen mit.', 'Jeder bringt etwas mit.', 'Alle bringen Getränke mit.',
      'Lena bringt den Salat mit.', 'Die Gäste bringen Kuchen und Musik mit.', 'Du bringst den Kuchen mit.',
      'Ihr bringt Salat und Brot mit.', 'Jeder Gast bringt einen Salat.', 'Die Gäste bringen nichts mit.',
      'Die Gäste sollen Kuchen und Salat mitbringen.', 'Könnt ihr Kuchen mitbringen?', 'Kannst du den Salat mitbringen?',
      'Bring bitte einen Salat mit.', 'Bringt bitte Kuchen mit.', 'Bitte Kuchen und Musik mitbringen.', 'Bitte bringt Kuchen mit, ich habe Getränke.',
      'Bringst du Musik mit?', 'Bringst du bitte den Salat mit?',
      // round 20: the 30 of the reviewer's 48 — vocative, `Und`, Vorfeld, person nouns, bare imperative
      'Alle bringen etwas zu essen mit.',
      'Lena, bringst du Kuchen mit?', 'Lena, kannst du Musik mitbringen?', 'Lena, bring bitte Kuchen mit!',
      'Liebe Lena, bring bitte einen Salat mit.', 'Hallo Lena, bringst du bitte Kuchen mit?',
      'Und Tim bringt Musik mit.', 'Und die Gäste bringen Kuchen mit.', 'Und du bringst den Salat mit.', 'Dann bringt jeder etwas mit.',
      'Vielleicht bringt Lena Kuchen mit.', 'Am Freitag bringen die Gäste Kuchen mit.', 'Am Samstag bringt jeder etwas mit.',
      'Um acht Uhr bringen die Gäste Kuchen mit.', 'Meine Freunde bringen Getränke mit.', 'Meine Familie bringt Kuchen mit.',
      'Die Freunde bringen Musik mit.', 'Die Kinder bringen Spiele mit.', 'Meine Freunde sollen Kuchen mitbringen.', 'Alle Gäste bringen etwas mit.',
      'Bringt Kuchen und Getränke mit!', 'Bring Kuchen mit!', 'Komm und bring Musik mit!', 'Bringen Sie bitte Kuchen mit.', 'Sie bringen Kuchen mit.',
      'Die Gäste müssen nichts mitbringen.', 'Kuchen bringt jeder mit.',
      'Alle bringen Kuchen mit, ich mache Musik.', 'Ich mache Salat und die Gäste bringen Kuchen mit.', 'Ja, die Gäste bringen Kuchen mit.',
      // review #20, MAJOR 1: the Start-Deutsch-1 sentence, `Und`/`Dann` before the imperative and the
      // question, the comma at the end, two addressees; MAJOR 2: the fronted object in both orders
      'Bringt etwas zu essen mit!', 'Und bringt Kuchen mit!', 'Und bringst du den Salat mit?', 'Und könnt ihr Musik mitbringen?',
      'Dann bring Kuchen mit!', 'Bringt Kuchen mit, bitte!', 'Bring Musik mit, Lena!', 'Lena und Tim, bringt Kuchen mit!',
      'Kuchen bringt der Chef mit.', 'Der Chef bringt Kuchen mit.', 'Musik macht die Band.', 'Die Band macht Musik.',
    ],
    other: [
      // review #14: the guests named, nothing asked of them
      'Ich lade meine Gäste ein.', 'Die Gäste kommen um acht Uhr.', 'Die Gäste sind eingeladen.',
      // round 18: the writer's echo
      'Ich bringe Kuchen mit.', 'Wir bringen Musik mit.', 'Wir bringen nichts mit.',
      // round 19: the writer's plan
      'Wir brauchen Kuchen und Getränke.', 'Ich brauche Kuchen und Musik.',
      // round 20: nothing beyond the verb, a time, a place; the fronted object with the writer behind it
      'Die Gäste tanzen.', 'Lena kommt.', 'Die Gäste kommen.', 'Alle kommen.', 'Jeder kommt.', 'Lena lacht.',
      'Lena kommt auch.', 'Alle Freunde kommen.', 'Meine Freunde kommen auch.', 'Lena wohnt in Bremen.',
      'Um acht Uhr kommen die Gäste.', 'Am Freitag kommen meine Freunde.', 'Tim arbeitet am Freitag.', 'Meine Mama kocht.',
      'Kuchen bringe ich mit.', 'Musik mache ich.', 'Getränke kaufe ich.', 'Musik machen wir.',
      // round 20, THE LIMIT the form check could not read — which is the whole finding
      'Die Gäste tanzen und hören Musik.', 'Die Gäste trinken Kaffee.', 'Die Gäste tanzen und bringen Kuchen mit.',
      // review #20, MAJOR 2: the means of transport
      'Meine Freunde kommen mit dem Auto.',
    ],
  }],
];

test('round 21: the Auftrag is undecidable by form — every probe of rounds 17–20 is the KI row, never green, never red', () => {
  // Both Auftrag Leitpunkte of the course are in the fixture, and the fixture is not a list of two:
  // the rule is the shape (W-word first, modal last), and it decides an exam-bank Leitpunkt and an
  // invented one the same way.
  const auftraege = COURSE.filter((t) => t.register !== 'formular').flatMap((t) => t.leitpunkte)
    .filter((lp) => /\b(?:soll|sollen|muss|müssen|kann|können)\b/.test(lp));
  assert.deepEqual([...new Set(auftraege)], AUFTRAG_PROBES.map(([lp]) => lp), 'every Auftrag Leitpunkt of the course is in the fixture');
  for (const lp of ['Wohin der Teppich soll', 'Was Ihr Bruder kaufen muss', 'Wann die Gäste kommen können']) {
    assert.equal(leitpunktSatisfied(lp, 'Der Teppich kommt ins Wohnzimmer. Mein Bruder kauft Brot. Die Gäste können um acht Uhr kommen.'), null, lp);
  }
  // …and an indirect question WITHOUT a modal is still decided by its verb.
  assert.equal(leitpunktSatisfied('Was Sie kaufen', 'Ich kaufe den Stuhl.'), true);
  assert.equal(leitpunktSatisfied('Was Sie kaufen', 'Der Flohmarkt ist gut.'), false);

  let probes = 0;
  for (const [lp, wrap, { correct, other }] of AUFTRAG_PROBES) {
    assert.ok(correct.length >= 30 && other.length >= 20, `${lp}: the history is kept`);
    for (const t of [...correct, ...other]) {
      assert.equal(leitpunktSatisfied(lp, wrap(t)), null, `„${lp}“ ← „${t}“ is the KI's to decide`);
      assert.equal(leitpunktSatisfied(lp, t), null, `„${lp}“ ← „${t}“ (bare) is the KI's to decide`);
      probes += 1;
    }
  }
  assert.ok(probes >= 180, `${probes} probes`);
  // The empty text and a single word: the row is undecidable by form, not by content.
  assert.equal(leitpunktSatisfied(L10, ''), null);
  assert.equal(leitpunktSatisfied(L12, 'Kuchen'), null);
});

test('round 21: on the screen the Auftrag row is „prüft die KI“, and the other Leitpunkte of the same task are still decided by form', () => {
  // Whole exam texts of the reviews — the two L10 texts round 20 pinned RED (no Auftrag in them),
  // the L10 model line, the two L12 texts round 19 pinned GREEN, the L12 text round 20 pinned RED
  // („Die Gäste tanzen.“) and the Start-Deutsch-1 text review #20 measured „fehlt noch“. All carry
  // the same row now: `ok: true, ai: true`, and the `ok` of the checklist rests on the other rows.
  const texts = [
    [10, 'Liebe Kollegin, der Zug hat Verspätung. Ich komme erst um zehn Uhr. Die Kollegen kommen auch um neun Uhr. Frau Berg arbeitet im Büro. Viele Grüße, Ana'],
    [10, 'Liebe Frau Berg, der Zug hat leider Verspätung. Ich komme um zehn Uhr. Der Chef arbeitet heute im Büro. Herr Weber wartet. Viele Grüße, Ana'],
    [10, 'Liebe Kollegin, der Zug kann heute nicht fahren, er hat Verspätung. Ich komme um zehn Uhr. Viele Grüße, Ana'],
    [10, 'Liebe Kollegin, der Zug hat leider Verspätung. Ich komme erst um zehn Uhr. Bitte rufen Sie Herrn Weber an und beginnen Sie ohne mich. Vielen Dank und viele Grüße, Ana'],
    [12, 'Liebe Lena, ich habe am Freitag Geburtstag. Wir feiern am Samstag um acht Uhr bei mir. Jeder bringt etwas zu essen mit, ich habe Getränke und Musik. Kommst du? Viele Grüße, Ana'],
    [12, 'Hallo Lena! Ich habe Geburtstag und wir feiern am Samstag um sieben Uhr. Die Gäste bringen Kuchen und Salat mit. Ich freue mich! Bis bald, Ana'],
    [12, 'Hallo Tim! Am Freitag habe ich Geburtstag. Wir feiern um acht Uhr. Die Gäste tanzen. Ich freue mich. Bis bald, Lena'],
    [12, 'Hallo Lena! Ich habe im Mai Geburtstag. Wir feiern am Freitag um acht Uhr bei mir. Meine Freunde kommen auch. Wir hören Musik und tanzen. Bis bald, Ana'],
    [12, 'Liebe Lena, ich habe am Samstag Geburtstag. Wir feiern um acht Uhr bei mir. Bringt etwas zu essen mit! Viele Grüße, Ana'],
  ];
  for (const [nr, text] of texts) {
    const res = scoreWriting(formcheckTask(nr), text);
    const lp = nr === 10 ? L10 : L12;
    const row = res.checks.find((c) => c.label === lp);
    assert.deepEqual({ ok: row.ok, ai: row.ai }, { ok: true, ai: true }, `L${nr} ← „${text}“`);
    // Nothing but the word window may be red (the 20-word L10 text of review #18 is under it).
    assert.deepEqual(res.checks.filter((c) => !c.ok && c.key !== 'length'), [], `L${nr}: ${JSON.stringify(res.checks)}`);
    // The row count is the Leitpunkt count: the KI row is shown, never dropped (round 13's mistake).
    assert.equal(res.checks.filter((c) => c.key.startsWith('lp')).length, formcheckTask(nr).leitpunkte.length);
  }
  // The non-modal Leitpunkt in the same task is still decided by FORM — green with a value, red without.
  const l10 = scoreWriting(formcheckTask(10), 'Liebe Kollegin, der Zug hat Verspätung. Die Kollegin soll warten. Viele Grüße, Ana').checks;
  assert.equal(l10.find((c) => c.label === 'Wann Sie kommen').ok, false, 'L10: no time, no Wann');
  assert.equal(l10.find((c) => c.label === L10).ai, true);
  const l12 = scoreWriting(formcheckTask(12), 'Hallo Lena! Ich habe Geburtstag. Wir feiern bald. Bringt Kuchen mit! Bis bald, Ana').checks;
  assert.equal(l12.find((c) => c.label === 'Tag und Uhrzeit').ok, false, 'L12: „bald“ is no Tag and no Uhrzeit');
  assert.equal(l12.find((c) => c.label === L12).ai, true);
  assert.equal(scoreWriting(formcheckTask(12), 'Hallo Lena! Ich habe Geburtstag. Wir feiern am Samstag um acht Uhr. Bis bald, Ana')
    .checks.find((c) => c.label === 'Tag und Uhrzeit').ok, true);
  // `canSubmit` semantics are unchanged: a KI row is `ok: true` in the checklist, so the button
  // rests on length, Anrede, Gruß and the decidable rows exactly as for „Warum Sie schreiben“.
  const warum = scoreWriting(formcheckTask(10), 'Liebe Kollegin, ich komme um zehn Uhr. Viele Grüße, Ana').checks;
  assert.deepEqual(warum.filter((c) => c.ai).map((c) => c.label), ['Warum Sie schreiben', L10]);
});

test('Minor 12 (round 18): the number stands BESIDE the birth word — same clause, not same sentence', () => {
  assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', 'Ich bin in Bremen geboren und habe 2 Kinder.'), false);
  assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', 'Ich habe 2 Kinder, ich bin in Bremen geboren.'), false);
  assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', 'Ich habe 2 Kinder, aber ich bin in Bremen geboren.'), false);
  // A month NAME is a date value on its own (round 17: „Ich habe im Mai Geburtstag.“) — that is the
  // value rule, not this one; only the bare number needs the birth word beside it.
  for (const t of ['Ich bin 1998 geboren.', 'Ich bin im Mai 1998 geboren.', 'Mein Geburtstag ist der 12.3.1990.',
    'Ich bin in Bremen geboren, am 3. Mai 1998.', 'Ich habe 2 Kinder und bin 1998 geboren.']) {
    assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', t), true, t);
  }
});

test('Minor 17 (round 18): one world list — no duplicates, stems lower case, names as written', () => {
  assert.equal(new Set(COUNTRY_STEMS).size, COUNTRY_STEMS.length, 'a duplicate stem');
  assert.equal(new Set(COUNTRY_NAMES.map((n) => n.toLowerCase())).size, COUNTRY_NAMES.length, 'a duplicate name');
  assert.ok(COUNTRY_STEMS.every((s) => s === s.toLowerCase() && /^[a-zäöüß-]+$/.test(s)), 'stems are lower-case letters');
  // A name is one or two capitalised words as a person writes them („Sierra Leone“, round 19).
  assert.ok(COUNTRY_NAMES.every((n) => /^[A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]+(?:\s(?:und\s)?[A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]+)?$/.test(n)), 'names are capitalised words as a person writes them');
  // The four the review measured red on „Ihr Land“ and the five stems it asked for.
  for (const land of ['England', 'Slowenien', 'Zypern', 'Luxemburg', 'Guinea', 'Mali', 'Togo', 'Benin', 'Angola']) {
    assert.equal(leitpunktSatisfied('Ihr Land', `Ich komme aus ${land}.`), true, land);
  }
  for (const stem of ['guine', 'mali', 'togo', 'benin', 'angolan', 'eritre', 'deutsch', 'engländ']) {
    assert.ok(COUNTRY_STEMS.includes(stem), stem);
  }
  // A stem is never a prefix search: the profession beside the new short stems stays a profession.
  for (const word of ['Maler', 'Malerin', 'Manager', 'Studentin']) {
    assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', `Ich bin ${word}.`), false, word);
  }
  // …and the reviewer's fifty-one cities still do not answer „Ihr Land“ (two US states excepted, known).
  for (const city of ['Istanbul', 'Damaskus', 'Kabul', 'Casablanca', 'Kiew', 'Warschau', 'Lagos', 'Tunis', 'Kairo', 'Mailand', 'Tiflis']) {
    assert.equal(leitpunktSatisfied('Ihr Land', `Ich komme aus ${city}.`), false, city);
  }
  // The validator reads the same module — a second copy is the finding.
  const validator = readFileSync(join(ROOT, 'scripts/validate-curriculum.mjs'), 'utf8');
  if (/from '\.\.\/src\/lib\/lesson\/countries\.js'/.test(validator)) {
    assert.ok(!/^export const COUNTRY_STEMS = \[/m.test(validator), 'the validator imports the world list and keeps no copy');
  }
});

test('the six model texts pass their Formcheck with the round-18 rules, and the L10 line to come', () => {
  for (const l of LEKTIONEN) {
    if (l.schreiben.kind !== 'mitteilung') continue;
    const res = scoreWriting(formcheckTask(l.nr), l.schreiben.sample);
    assert.equal(res.ok, true, `L${l.nr}: ${JSON.stringify(res.checks.filter((c) => !c.ok))}`);
  }
  // The L10 line („Bitte rufen Sie Herrn Weber an.“) went in as the first green of the Auftrag row;
  // since 2026-09-14 that row is the KI's and no sentence turns it green (round-21 block below).
  assert.equal(leitpunktSatisfied('Was die Kollegin bis dahin machen soll', 'Bitte rufen Sie Herrn Weber an.'), null);
});


// ───────────────────────────────────────────────────────────────────────────────────────────────
// ROUND 19 — DaF review #18, MAJOR 1 and MAJOR 2 (with Minors 17, 18, 21): THE CANDIDATE, NOT THE
// CHECKER
//
// Round 18 replaced the verb echo by three instruction shapes, and the reviewer measured the shapes
// against what a candidate writes: the exam answers „Was die Gäste mitbringen sollen“ with a
// STATEMENT („Die Gäste bringen Kuchen mit.“, „Jeder bringt etwas mit.“ — 0 of 10 green), and the
// modal shape let a THING be the subject („Der Zug kann nicht fahren.“ — 6 of 6 green). And the six
// Formulare had no form check at all: `ok: value.trim().length > 0`, so „Land: Bremen“ and a single
// dot were „erledigt“ on all thirty fields. Each is closed as a RULE with probes in both directions.
// (MAJOR 1's Auftrag tests were superseded on 2026-09-14 by the round-21 block below; MAJOR 2 stands.)
// ───────────────────────────────────────────────────────────────────────────────────────────────

/**
 * PER FORMULAR FIELD of the six A1.1 Formulare: the sample value (green), ONE value of the wrong
 * kind (red), and a single dot (never green). The wrong-kind value is one the field's SHAPE can
 * refuse — a country in a name field, a language in a country field, a weekday in a clock field;
 * a city in a name field („Vorname: Bremen“) is not one, there is no world list of cities. Fields
 * without a shape („Hobby“, „Material“, „Kurs“, „Unterschrift“) are `ai` when filled: named, never
 * ticked, never crossed — the third row of the Mitteilung.
 */
const FORMULAR_WRONG_KIND = {
  Familienname: 'Marokko', Vorname: 'Arabisch', Nachname: '12', Name: '12', Land: 'Bremen', Sprache: 'Marokko',
  Sprachen: 'Marokko', Familienstand: 'gut', Zimmer: 'grün', Farbe: 'Wörterbuch', 'Kurs am': 'Schwimmen',
  Tag: '15 Uhr', Uhrzeit: 'Montag', Personen: 'Chakiri', Telefonnummer: 'neu', 'Kurs von': 'Donnerstag',
  'Kurs bis': 'Zimmer',
};
const FORMULAR_AI_FIELDS = ['Unterschrift', 'Kurs', 'Material', 'Hobby'];

test('MAJOR 2 (round 19): a Formular field is a Leitpunkt with a name — its value must have the field’s shape', () => {
  let fields = 0;
  for (const l of LEKTIONEN) {
    const w = l.schreiben;
    if (w.kind !== 'formular') continue;
    const bank = writingTaskByKey('goethe_a1', w.taskKey);
    const task = { kind: 'formular', fields: bank.leitpunkte };
    const sample = formularSampleValues(w.sample, bank.leitpunkte);
    // The sample, as built: every field green (RULE 17's question, asked here of the bank's fields).
    const ok = scoreWriting(task, sample);
    assert.equal(ok.ok, true, `L${l.nr}: ${JSON.stringify(ok.checks.filter((c) => !c.ok))}`);
    for (const field of bank.leitpunkte) {
      fields += 1;
      const row = (value) => scoreWriting(task, { ...sample, [field]: value }).checks.find((c) => c.key === field);
      assert.equal(row(sample[field]).filled, true, `L${l.nr} ${field}: the sample value fills the field`);
      // A single dot, a dash, spaces: not filled, red, never `ai`.
      for (const empty of ['.', '-', '   ', '']) {
        const r = row(empty);
        assert.equal(r.ok, false, `L${l.nr} ${field} ← „${empty}“`);
        assert.equal(r.filled, false, `L${l.nr} ${field} ← „${empty}“ is not filled`);
        assert.ok(!r.ai, `L${l.nr} ${field} ← „${empty}“ is not for the KI`);
      }
      if (FORMULAR_AI_FIELDS.includes(field)) {
        assert.equal(row(sample[field]).ai, true, `L${l.nr} ${field} has no shape and is „prüft die KI“`);
        assert.equal(row('irgendwas').ai, true);
        continue;
      }
      assert.ok(field in FORMULAR_WRONG_KIND, `L${l.nr} ${field}: every shaped field has a wrong-kind probe`);
      assert.ok(!row(sample[field]).ai, `L${l.nr} ${field} has a shape`);
      const wrong = row(FORMULAR_WRONG_KIND[field]);
      assert.equal(wrong.ok, false, `L${l.nr} ${field} ← „${FORMULAR_WRONG_KIND[field]}“ is a value of another kind`);
      assert.equal(wrong.filled, true);
    }
  }
  assert.equal(fields, 30, 'the six Formulare have thirty fields');
  // The shapes are the Mitteilung's, not a second copy: the same value that names a field in a
  // Mitteilung fills the form field, and the same wrong value fails both.
  assert.equal(leitpunktSatisfied('Ihre Telefonnummer', 'Meine Telefonnummer ist neu.'), false);
  assert.equal(leitpunktSatisfied('Ihr Land', 'Mein Land ist die Türkei.'), true);
  assert.equal(scoreWriting({ kind: 'formular', fields: ['Land'] }, { Land: 'die Türkei' }).ok, true);
  // Field names the bank does not use yet, mapped by the same table.
  const one = (field, value) => scoreWriting({ kind: 'formular', fields: [field] }, { [field]: value }).checks[0];
  assert.equal(one('Geburtsdatum', '3.5.1998').ok, true);
  assert.equal(one('Geburtsdatum', 'Marokko').ok, false);
  assert.equal(one('Staatsangehörigkeit', 'marokkanisch').ok, true);
  assert.equal(one('Staatsangehörigkeit', 'Marokko').ok, false, 'a country is not a nationality');
  assert.equal(one('Alter', '25').ok, true);
  assert.equal(one('Wohnort', 'Bremen').ok, true);
  assert.equal(one('Wohnort', '12').ok, false);
  assert.equal(one('Sprache', 'Dari').ok, true, 'a language that does not end in -isch is in the world list');
  assert.equal(one('E-Mail', 'ana@example.org').ok, true);
  assert.equal(one('Beruf', 'Studentin').ai, true, 'no shape: the KI reads it');
});

test('MAJOR 2 (round 19): the screen hands a Formular in only when every field is filled', () => {
  const src = readFileSync(join(ROOT, 'src/components/lesson/GradedWriting.jsx'), 'utf8');
  assert.match(src, /canSubmit = isFormular \? check\.checks\.length > 0 && check\.checks\.every\(\(c\) => c\.filled\)/);
  const task = { kind: 'formular', fields: ['Name', 'Tag'] };
  assert.deepEqual(scoreWriting(task, { Name: 'Ana' }).checks.map((c) => c.filled), [true, false]);
  assert.deepEqual(scoreWriting(task, { Name: 'Ana', Tag: '.' }).checks.map((c) => c.filled), [true, false]);
  assert.deepEqual(scoreWriting(task, { Name: 'Ana', Tag: 'Montag' }).checks.map((c) => c.filled), [true, true]);
});

test('Minor 18 (round 19): a question that echoes the verb answers a shape-less Leitpunkt no more than a statement without it', () => {
  for (const [lp, t] of [['Was Sie kaufen', 'Kaufst du auch?'], ['Was Sie kaufen', 'Kaufen Sie das?'], ['Was Sie kaufen', 'Was kaufen wir?'],
    ['Was Sie brauchen', 'Brauchen Sie etwas?'], ['Was Sie brauchen', 'Was brauchen Sie?']]) {
    assert.equal(leitpunktSatisfied(lp, `Hallo Lena! ${t} Viele Grüße, Ana`), false, `„${lp}“ ← „${t}“ asks`);
  }
  for (const [lp, t] of [['Was Sie kaufen', 'Ich kaufe nichts.'], ['Was Sie kaufen', 'Ich kaufe den Stuhl.'],
    ['Was Sie brauchen', 'Ich brauche einen Stuhl.'], ['Was Sie brauchen', 'Wir brauchen nichts.']]) {
    assert.equal(leitpunktSatisfied(lp, `Hallo Lena! ${t} Viele Grüße, Ana`), true, `„${lp}“ ← „${t}“ answers`);
  }
  // A shape still reads the whole text, questions included: „Eine Frage an Lena“ IS a question.
  assert.equal(leitpunktSatisfied('Eine Frage an Lena', 'Lena, hast du Zeit?'), true);
  assert.equal(leitpunktSatisfied('Wann Sie kommen', 'Kommen Sie um zehn?'), true);
});

test('Minor 21 (round 19): the year behind the comma belongs to the birth clause it follows', () => {
  assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', 'Ich bin geboren in Marokko, 1998.'), true);
  assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', 'Ich bin in Marokko geboren, im Mai 1998.'), true);
  // …only when that clause is nothing but the date.
  assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', 'Ich bin in Bremen geboren, ich habe 2 Kinder.'), false);
  assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', 'Ich bin in Bremen geboren, Bahnhofstraße 3.'), false);
});

test('Minor 17 (round 19): `-sch`, `-i` and the bare stem as a nationality; two-word countries; the language remainder', () => {
  for (const t of ['Meine Staatsangehörigkeit ist libysch.', 'Ich bin Jemenit.', 'Ich bin Israeli.', 'Ich bin Ungar.', 'Ich bin Saudi.']) {
    assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', `Ich heiße Ana. ${t}`), true, t);
  }
  // The bare stem is a nationality only in the predicative position — a country is not one.
  assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', 'Ich komme aus dem Iran.'), false);
  assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', 'Ich komme aus Israel.'), false);
  assert.equal(leitpunktSatisfied('Ihr Land', 'Ich komme aus Sierra Leone.'), true);
  assert.equal(leitpunktSatisfied('Ihr Land', 'Ich komme aus Sri Lanka.'), true);
  assert.ok(COUNTRY_NAMES.includes('Sierra Leone'));
  // Names are names: the short stems (`ir`, `ind`, `pol`) do not make „Irina“ or „Indira“ a country.
  const name = (v) => scoreWriting({ kind: 'formular', fields: ['Vorname'] }, { Vorname: v }).checks[0].ok;
  for (const v of ['Irina', 'Indira', 'Ben', 'Ira', 'Ana', 'Ali', 'Lena', 'Tim', 'Chakiri', 'Brandt', 'Berger']) assert.equal(name(v), true, v);
  // ROUND 20: a BARE nationality stem is a name on a name field („Israel“, „Jordan“, „Iran“ are given
  // names; „Türk“, „Schweizer“ surnames) — the whole country name is not (see `isWholeCountryName`).
  for (const v of ['Marokko', 'Türkei', 'Deutschland', 'Arabisch', 'Deutsch', 'Dari']) assert.equal(name(v), false, v);
  for (const v of ['Iran', 'Israel', 'Jordan']) assert.equal(name(v), true, `${v} is a given name on a name field`);
  // The language remainder: capitalised, no `-isch` (those are read by form), no duplicates.
  assert.equal(new Set(LANGUAGE_NAMES.map((n) => n.toLowerCase())).size, LANGUAGE_NAMES.length);
  assert.ok(LANGUAGE_NAMES.every((n) => /^[A-ZÄÖÜ][a-zäöüß]+$/.test(n) && !/isch$/.test(n)), 'the list holds only what the form cannot read');
  assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', 'Ich spreche Dari.'), false);
});


// ───────────────────────────────────────────────────────────────────────────────────────────────
// ROUND 20 — DaF review #19, MAJOR 1 and MAJOR 2: THE SENTENCE, NOT THE MODEL TEXT'S WORD ORDER;
// THE FIELD, NOT THE SENTENCE
//
// Round 19's declarative shape had its third condition on its head (an EMPTY rest after the verb was
// green, so „Die Gäste tanzen.“ answered „Was die Gäste mitbringen sollen“ and two whole L10 exam
// texts without an Auftrag got the tick) and a subject reader that knew only the model text's word
// order (vocative, `Und`, two-word Vorfeld, bare imperative, „Meine Freunde“ — 22 of 48 correct
// answers red). And the Formular read its values with the Mitteilung's readers: „Land: Arabisch“
// was a country, „Vorname: ana“ was „fehlt noch“, „Uhrzeit: 15.00“ no time, „Vorname: Franz“ a
// country. Each is closed as a RULE, with the reviewer's own probes in both directions.
// (MAJOR 1's Auftrag tests were superseded on 2026-09-14 by the round-21 block below; MAJOR 2 stands.)
// ───────────────────────────────────────────────────────────────────────────────────────────────

test('MAJOR 2 (round 20): a form value stands bare — a language or a nationality is no country, whatever field it is in', () => {
  const l1 = LEKTIONEN[0].schreiben;
  assert.equal(l1.kind, 'formular');
  const field = (f, v) => scoreWriting(l1, { [f]: v }).checks.find((c) => c.key === f);
  for (const v of ['Arabisch', 'Deutsch', 'Türkisch', 'Englisch', 'Polnisch', 'Russisch', 'Syrisch', 'Kurdisch', 'Spanisch', 'Italienisch',
    'Japanisch', 'Persisch', 'Französisch', 'Chinesisch', 'arabisch', 'Dari', 'Marokkanerin', 'Marokkaner', 'Türkin', 'marokkanisch']) {
    assert.equal(field('Land', v).ok, false, `Land: ${v} is a language or a nationality, not a country`);
  }
  for (const v of ['Marokko', 'die Türkei', 'Türkei', 'Syrien', 'Deutschland', 'Afghanistan', 'Iran', 'Irak', 'Ukraine', 'Eritrea',
    'Sierra Leone', 'USA', 'Kosovo', 'marokko', 'Polen']) {
    assert.equal(field('Land', v).ok, true, `Land: ${v}`);
  }
  // The same exclusion in the Mitteilung.
  for (const t of ['Mein Land ist Arabisch.', 'Ich komme aus Arabisch.', 'Mein Land ist Deutsch.']) {
    assert.equal(leitpunktSatisfied('Ihr Land', t), false, t);
  }
  assert.equal(leitpunktSatisfied('Ihr Land', 'Ich komme aus der Ukraine.'), true, 'a listed name wins over the -e suffix');
  // Ana's Formular with the two fields swapped: TWO red fields.
  const swapped = scoreWriting(l1, { Familienname: 'Chakiri', Vorname: 'Ana', Land: 'Arabisch', Sprache: 'Marokko', Unterschrift: 'A. Chakiri' });
  assert.deepEqual(swapped.checks.filter((c) => !c.ok).map((c) => c.key), ['Land', 'Sprache']);
  assert.equal(swapped.ok, false);
});

test('MAJOR 2 (round 20): the case question is decided once — a form value is read case-folded; the Mitteilung is not', () => {
  const l1 = LEKTIONEN[0].schreiben;
  const l3 = LEKTIONEN[2].schreiben;
  const field = (task, f, v) => scoreWriting(task, { [f]: v }).checks.find((c) => c.key === f);
  for (const [f, v] of [['Vorname', 'ana'], ['Vorname', 'ali'], ['Familienname', 'chakiri'], ['Familienname', 'yilmaz'], ['Familienname', 'al-hassan'],
    ['Sprache', 'arabisch'], ['Sprache', 'deutsch'], ['Sprache', 'arabisch, deutsch'], ['Land', 'marokko']]) {
    const r = field(l1, f, v);
    assert.equal(r.ok, true, `L1 ${f}: ${v}`);
    assert.equal(r.filled, true);
  }
  assert.equal(field(l3, 'Sprachen', 'arabisch und deutsch').ok, true);
  assert.equal(field(l3, 'Familienstand', 'Ledig').ok, true);
  // …and case-folding does not turn a wrong kind into a right one.
  for (const [f, v] of [['Vorname', 'marokko'], ['Vorname', 'deutsch'], ['Vorname', 'türkei'], ['Land', 'arabisch'], ['Sprache', 'marokko'], ['Land', 'bremen']]) {
    assert.equal(field(l1, f, v).ok, false, `L1 ${f}: ${v}`);
  }
  // The Mitteilung keeps its capital: lower-case `arabisch` after `sein` is the nationality (round 16).
  assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', 'Ich bin arabisch.'), true);
  assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', 'Ich spreche Arabisch.'), false);
});

test('MAJOR 2 (round 20): the clock of the form — „15.00“ and the bare hour on a clock field, never in a Mitteilung', () => {
  const l9 = LEKTIONEN[8].schreiben;
  const l11 = LEKTIONEN[10].schreiben;
  const field = (task, f, v) => scoreWriting(task, { [f]: v }).checks.find((c) => c.key === f);
  for (const v of ['15 Uhr', '15:00', '15.00 Uhr', 'drei Uhr', '15', '15.00', 'um 15 Uhr', 'halb vier', '15:00 Uhr', '9', '0', '24']) {
    assert.equal(field(l9, 'Uhrzeit', v).ok, true, `Uhrzeit: ${v}`);
  }
  for (const v of ['9 Uhr', '9:00', '9.00', '9', 'neun Uhr', '9.00 Uhr']) assert.equal(field(l11, 'Kurs von', v).ok, true, `Kurs von: ${v}`);
  for (const v of ['12 Uhr', '12:00', '12', 'zwölf Uhr']) assert.equal(field(l11, 'Kurs bis', v).ok, true, `Kurs bis: ${v}`);
  for (const v of ['Montag', 'Uhr', 'neu', 'Chakiri', '25', '3.5.1998', '15.00.00']) assert.equal(field(l9, 'Uhrzeit', v).ok, false, `Uhrzeit: ${v}`);
  for (const v of ['Donnerstag', 'Zimmer']) assert.equal(field(l11, 'Kurs von', v).ok, false, `Kurs von: ${v}`);
  // A dotted number in running text is a date, not a clock: the Mitteilung's readers are untouched.
  assert.equal(leitpunktSatisfied('Ihre Uhrzeit', 'Ich komme am 12.10.'), false);
  assert.equal(leitpunktSatisfied('Ihre Uhrzeit', 'Ich komme um 15.00 Uhr.'), true);
  assert.equal(leitpunktSatisfied('Wann Sie kommen', 'Ich habe 9 Kinder.'), false, 'a bare number in a sentence is not a time');
});

test('MAJOR 2 (round 20): a name field asks „is this a whole country name?“ — German first and family names are names', () => {
  const l1 = LEKTIONEN[0].schreiben;
  const field = (f, v) => scoreWriting(l1, { [f]: v }).checks.find((c) => c.key === f).ok;
  // The reviewer's 38, minus the two left red on purpose below.
  for (const v of ['Chakiri', 'Yilmaz', 'Öztürk', 'Al-Hassan', 'Nguyen', 'Schmidt', 'Müller', 'Schweizer', 'Franz', 'Türk', 'Engländer',
    'Holländer', 'Pole', 'Russo', 'Jordan']) assert.equal(field('Familienname', v), true, `Familienname: ${v}`);
  for (const v of ['Ana', 'Ali', 'Ira', 'Ben', 'Ina', 'Irina', 'Indira', 'Malte', 'Dominik', 'Georg', 'Franz', 'Franziska', 'Israel', 'Jordan',
    'Kuba', 'Chad', 'Nour', 'Fatima', 'Mohammed', 'Aylin', 'Ahmad']) assert.equal(field('Vorname', v), true, `Vorname: ${v}`);
  // Left red on purpose: „Deutsch“ is the language name in every field (round 17 pinned „Vorname:
  // Deutsch“), and „Malta“ is a whole country name (`malt` + `a`) — a learner typing either into a
  // name field is more likely lost than a Herr Deutsch or a Frau Malta.
  assert.equal(field('Familienname', 'Deutsch'), false);
  assert.equal(field('Familienname', 'Malta'), false);
  // Whole country names stay red on a name field, in every composition German builds them with.
  for (const v of ['Marokko', 'Türkei', 'Deutschland', 'Syrien', 'Polen', 'Afghanistan', 'Eritrea', 'Georgien', 'Ukraine', 'Frankreich',
    'Russland', 'Irland', 'Italien', 'Griechenland', 'Kasachstan', 'Somalia', 'Kanada', 'Arabisch', 'Dari']) {
    assert.equal(field('Vorname', v), false, `Vorname: ${v} is a country or a language`);
    assert.equal(field('Familienname', v), false, `Familienname: ${v} is a country or a language`);
  }
  // …and „Ihr Land“ reads the same world as before: every listed name is a country there too.
  for (const n of COUNTRY_NAMES.filter((x) => !x.includes(' und '))) assert.equal(leitpunktSatisfied('Ihr Land', `Ich komme aus ${n}.`), true, n);
});


// ───────────────────────────────────────────────────────────────────────────────────────────────
// ROUND 22 — DaF review #21, MAJOR 1 and MAJOR 2 (with Minors 33, 34, 37): A PLACE, NOT A WORD
//
// Round 21 moved the Auftrag to the KI and left the two rows that stand in EVERY Mitteilung
// unmeasured since round 5. The reviewer measured them: `ANREDE`/`GRUSS` read a word anywhere in
// the text, so „Liebe Grüße“ at the end was an Anrede, „Viele Grüße an Tim!“ in the middle was a
// Gruß, and 21 of 31 closings — „Bis morgen“ (L1 Wortfeld), „Bis später“ and „Mach's gut“ (L12
// Wortfeld), „Deine Ana“ — were red. And the Wann shape read `morgen` case-blind over the whole
// text, so „Guten Morgen, Frau Berg“ answered „Wann Sie kommen“, while `nachmittags`, `abends`,
// `am Abend` — L8's own Wortfeld — were no answer at all. Both are closed as RULES, and the fixtures
// are LOOPS over the course's own Wortfeld: every greeting and closing formula the curriculum
// teaches, every time of day it teaches, every weekday — never a typed list of the three the
// reviewer happened to quote.
// ───────────────────────────────────────────────────────────────────────────────────────────────

/** The Wortfeld of the whole course, flat, with the Lektion number. */
const WORTFELD = LEKTIONEN.flatMap((l) => (l.wortfeld || []).map((w) => ({ ...w, nr: l.nr })));
/** The course's greeting formulas, read off its own gloss — an opening is „Hello / Good …“. */
const OPENING_FORMULAS = WORTFELD.filter((w) => /^(?:hello|good (?:morning|day|evening))\b/i.test(w.en)).map((w) => w.de);
/** …and a closing is „See you … / Bye / Goodbye / Take care / Have a nice day“. */
const CLOSING_FORMULAS = WORTFELD.filter((w) => /^(?:see you|bye|goodbye|take care|have a nice day)\b/i.test(w.en)).map((w) => w.de);
/** The seven weekdays, as the Wortfeld teaches them. */
const WEEKDAYS = WORTFELD.filter((w) => /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/.test(w.en)).map((w) => w.word);
/** The times of day: the adverbs (`morgens`) and the nouns (`der Abend` → „am Abend“). */
const TIMES_OF_DAY = WORTFELD.filter((w) => /^(?:in the )?(?:morning|forenoon|noon|afternoon|evening|night)(?:\(s\))?$/i.test(w.en));

const BODY_L4 = 'Ich bin auf dem Flohmarkt und kaufe eine Lampe und einen Tisch. Die Lampe kostet fünf Euro, der Tisch zwanzig Euro. Ich komme um drei Uhr nach Hause.';
const row = (task, text, key) => scoreWriting(task, text).checks.find((c) => c.key === key).ok;
const ANY_MITTEILUNG = { kind: 'mitteilung', register: 'informell', minWords: 1, maxWords: 200, leitpunkte: [] };

test('MAJOR 1 (round 22): every closing formula of the Wortfeld closes a Mitteilung at its END and none in the MIDDLE', () => {
  // The selector reads the course, so it cannot be empty and must reach both Lektionen that teach
  // a Gruß (L1 „Bis morgen“, L12 „Bis später“ / „Mach's gut“); the count guards the selector.
  assert.ok(CLOSING_FORMULAS.length >= 6, `${CLOSING_FORMULAS.length} closings found in the Wortfeld`);
  assert.ok(CLOSING_FORMULAS.some((f) => /morgen/i.test(f)) && CLOSING_FORMULAS.some((f) => /später/i.test(f)), 'L1 and L12 both reached');
  for (const formula of [...CLOSING_FORMULAS, ...WEEKDAYS.map((d) => `Bis ${d}`)]) {
    assert.equal(row(ANY_MITTEILUNG, `Hallo Lena! ${BODY_L4} ${formula}, Ana`, 'gruss'), true, `„${formula}, Ana“ at the end is a Gruß`);
    assert.equal(row(ANY_MITTEILUNG, `Hallo Lena! ${BODY_L4} ${formula}!`, 'gruss'), true, `„${formula}!“ unsigned at the end is a Gruß`);
    assert.equal(row(ANY_MITTEILUNG, `Hallo Lena! ${formula}, Ana. ${BODY_L4}`, 'gruss'), false, `„${formula}, Ana“ in the middle is no Gruß`);
  }
  assert.equal(WEEKDAYS.length, 7);
  // The shapes the Wortfeld does not spell out but the exam does: the signature („Deine Ana“), the
  // abbreviation, the formula on its own line, and „Danke und …“ in front of it.
  for (const closing of ['Deine Ana', 'Dein Tim', 'LG Ana', 'Bis dann! Ana', 'Viele Grüße\nAna', 'Vielen Dank und viele Grüße, Ana',
    'Mit freundlichen Grüßen, Ihre Ana Chakiri', 'Liebe Grüße von Ana', 'Alles Gute, Ana', 'Bis zum Wochenende, Ana', 'Tschüs, Ana']) {
    assert.equal(row(ANY_MITTEILUNG, `Hallo Lena! ${BODY_L4} ${closing}`, 'gruss'), true, closing);
  }
  // THE OTHER DIRECTION — the reviewer's four texts without a Schlussformel, all green in round 21:
  // the Gruß word inside a sentence („Viele Grüße an Tim!“), the verb („Ich grüße Tim“), a relayed
  // greeting („Grüße von Tim.“, „Tschüss sagt Tim.“). And „Dein“ without a name is no signature.
  for (const text of [
    `Hallo Lena! ${BODY_L4.replace('Ich komme um drei Uhr nach Hause.', '')} Viele Grüße an Tim! Ich komme um drei Uhr nach Hause. Ana`,
    'Hallo Lena! Ich grüße Tim und Lena. Ich komme um zehn Uhr.',
    'Hallo Lena! Viele Grüße an Tim. Ich komme um zehn Uhr.',
    'Hallo Lena! Ich komme um zehn Uhr. Tschüss sagt Tim.',
    'Hallo Lena! Ich komme um zehn Uhr. Grüße von Tim.',
    'Hallo Lena! Ich komme um zehn Uhr. Ich freue mich, Ana',
    'Hallo Lena! Ich komme um zehn Uhr. Das ist dein',
  ]) {
    assert.equal(row(ANY_MITTEILUNG, text, 'gruss'), false, `no Gruß: „${text.slice(-40)}“`);
  }
});

test('MAJOR 1 (round 22): every opening formula of the Wortfeld is an Anrede in the FIRST sentence and none later', () => {
  assert.ok(OPENING_FORMULAS.length >= 4, `${OPENING_FORMULAS.length} openings found in the Wortfeld`);
  for (const formula of [...OPENING_FORMULAS, 'Hi', 'Hey', 'Moin', 'Servus', 'Grüß dich', 'Liebe', 'Lieber', 'Sehr geehrte Frau', 'Sehr geehrter Herr']) {
    assert.equal(row(ANY_MITTEILUNG, `${formula} Lena! ${BODY_L4} Viele Grüße, Ana`, 'anrede'), true, `„${formula} Lena!“ opens`);
    assert.equal(row(ANY_MITTEILUNG, `${formula} Lena, ${BODY_L4} Viele Grüße, Ana`, 'anrede'), true, `„${formula} Lena,“ opens`);
    assert.equal(row(ANY_MITTEILUNG, `Ich bin auf dem Flohmarkt. ${formula} Lena! ${BODY_L4} Viele Grüße, Ana`, 'anrede'), false, `„${formula} Lena!“ in sentence two is no Anrede`);
  }
  // THE OTHER DIRECTION — the reviewer's texts without an Anrede, three of four green in round 21
  // because `liebe` stood in the Gruß or `lieber` was the adverb.
  for (const text of [
    `${BODY_L4} Liebe Grüße, Ana`,
    `Ana hier. ${BODY_L4} Liebe Grüße, Ana`,
    'Ich komme am Montag nicht, ich bin lieber zu Hause, ich bin krank. Geht es am Mittwoch um zehn Uhr? Hast du da Zeit? Viele Grüße, Ana',
    'Liebe Grüße, Ana',
    `Lena, ${BODY_L4} Viele Grüße, Ana`,
  ]) {
    assert.equal(row(ANY_MITTEILUNG, text, 'anrede'), false, `no Anrede: „${text.slice(0, 40)}“`);
  }
  // …and the Anrede does not make the Gruß, nor the Gruß the Anrede: one formula, one row.
  assert.equal(row(ANY_MITTEILUNG, 'Hallo Lena! Ich komme um zehn Uhr.', 'gruss'), false);
  assert.equal(row(ANY_MITTEILUNG, 'Liebe Lena, ich komme um zehn Uhr.', 'gruss'), false);
});

/** The reviewer's 31 closings (30 real, one control) and 21 openings, as measured in round 21. */
const REVIEW_21_CLOSINGS = ['Viele Grüße, Ana', 'Liebe Grüße, Ana', 'Bis bald, Ana', 'Tschüss, Ana', 'Bis dann, Ana', 'Bis dann! Ana', 'Bis später, Ana',
  'Bis morgen, Ana', 'Bis Samstag, Ana', 'Bis Freitag! Ana', 'Schöne Grüße, Ana', 'Herzliche Grüße, Ana', 'Gruß, Ana', 'Grüße, Ana', 'LG Ana', 'Deine Ana',
  'Dein Tim', 'Alles Gute, Ana', 'Alles Liebe, Ana', 'Mach\'s gut, Ana', 'Ciao, Ana', 'Tschüs, Ana', 'Tschau, Ana', 'Bis nachher, Ana',
  'Mit freundlichen Grüßen, Ana', 'Freundliche Grüße, Ana', 'Beste Grüße, Ana', 'Bis gleich, Ana', 'Schönen Tag, Ana', 'Danke und bis später, Ana'];
const REVIEW_21_OPENINGS = ['Hallo Lena!', 'Liebe Lena,', 'Lieber Tim,', 'Guten Tag, Frau Berg!', 'Sehr geehrte Frau Berg,', 'Sehr geehrter Herr Weber,',
  'Hi Lena!', 'Hey Lena,', 'Moin Lena,', 'Guten Morgen Frau Berg,', 'Guten Abend, Herr Weber!', 'Liebe Frau Berg,', 'Hallo!', 'Hallo zusammen,',
  'Liebe Freunde,', 'Liebe Kollegin,', 'Grüß dich, Lena!', 'Servus Tim,', 'Sehr geehrte Damen und Herren,'];

test('MAJOR 1 (round 22): the reviewer\'s measurement — 21 of 31 closings red and 7 of 21 openings red — is 0 and 0', () => {
  assert.equal(REVIEW_21_CLOSINGS.length, 30);
  for (const g of REVIEW_21_CLOSINGS) assert.equal(row(ANY_MITTEILUNG, `Hallo Lena! ${BODY_L4} ${g}`, 'gruss'), true, g);
  assert.equal(row(ANY_MITTEILUNG, `Hallo Lena! ${BODY_L4} Ich freue mich, Ana`, 'gruss'), false, 'the control is not a formula');
  for (const a of REVIEW_21_OPENINGS) assert.equal(row(ANY_MITTEILUNG, `${a} ${BODY_L4} Viele Grüße, Ana`, 'anrede'), true, a);
  // A bare name is not an address formula („Lena,“ / „Frau Berg,“ — the reviewer conceded only
  // „Hi“ among the seven as one a candidate writes); those two stay red, on purpose.
  for (const a of ['Lena,', 'Frau Berg,']) assert.equal(row(ANY_MITTEILUNG, `${a} ${BODY_L4} Viele Grüße, Ana`, 'anrede'), false, a);
});

test('MAJOR 2 (round 22): „Guten Morgen“ is an Anrede, not a day — the five texts without a time are red at their Wann row', () => {
  const wannRow = (nr, text, label) => scoreWriting(formcheckTask(nr), text).checks.find((c) => c.label === label);
  const five = [
    [10, 'Guten Morgen Frau Berg, der Zug hat Verspätung und ich komme später ins Büro. Bitte beginnen Sie ohne mich und rufen Sie Herrn Weber an. Bis später, Ana', 'Wann Sie kommen'],
    [10, 'Guten Morgen Frau Berg, mein Bus kommt nicht. Ich komme später ins Büro, es tut mir leid. Bitte fangen Sie ohne mich an. Bis morgen, Ana', 'Wann Sie kommen'],
    [6, 'Guten Morgen, Frau Berg! Ich brauche einen neuen Computer und ein Handy. Meine Telefonnummer ist 0176 3344 5566. Ich bin nicht im Büro. Mit freundlichen Grüßen, Omar', 'Wann Sie im Büro sind'],
    [4, 'Guten Morgen Lena! Ich bin auf dem Flohmarkt. Ich kaufe eine Lampe und einen Tisch. Die Lampe kostet fünf Euro, der Tisch zwanzig Euro. Ich komme später nach Hause. Liebe Grüße, Ana', 'Wann Sie kommen'],
    // `heute` belongs to the bus: the time must stand in the WRITER's clause, and not a negated one.
    [10, 'Liebe Frau Berg, der Bus kommt heute nicht. Ich komme später ins Büro, es tut mir leid. Bitte fangen Sie ohne mich an. Viele Grüße, Ana', 'Wann Sie kommen'],
  ];
  for (const [nr, text, label] of five) {
    const r = wannRow(nr, text, label);
    assert.equal(r.ok, false, `L${nr} „${label}“ ← „${text.slice(0, 30)}…“ names no time`);
    assert.equal(r.ai, undefined, 'the Wann row is decided by form, not by the KI');
    // The Anrede row still reads the same „Guten Morgen“ / „Liebe Frau Berg“ as an Anrede.
    assert.equal(scoreWriting(formcheckTask(nr), text).checks.find((c) => c.key === 'anrede').ok, true);
  }
  // The same texts WITH a time in the writer's clause are green — the rule is the time, not the Anrede.
  assert.equal(wannRow(10, five[0][1].replace('ich komme später ins Büro', 'ich komme um zehn Uhr ins Büro'), 'Wann Sie kommen').ok, true);
  assert.equal(wannRow(6, five[2][1].replace('Ich bin nicht im Büro.', 'Ich bin morgen im Büro.'), 'Wann Sie im Büro sind').ok, true);
  assert.equal(wannRow(10, five[4][1].replace('Ich komme später ins Büro', 'Ich komme heute um elf Uhr ins Büro'), 'Wann Sie kommen').ok, true);
  // The Tag conjuncts of L8 and L12 were red before and are red still — for the Uhrzeit AND now for the Tag.
  assert.equal(leitpunktSatisfied('Neuer Tag und neue Uhrzeit', 'Guten Morgen Lena! Ich kann nicht kommen. Geht es später?'), false);
  assert.equal(leitpunktSatisfied('Tag und Uhrzeit', 'Guten Morgen Lena! Wir feiern bei mir. Kommst du?'), false);
  assert.equal(leitpunktSatisfied('Tag und Uhrzeit', 'Guten Morgen Lena! Wir feiern um acht Uhr bei mir.'), false, '„Guten Morgen“ is no Tag');
});

test('MAJOR 2 (round 22): the times of day L8 teaches answer „Wann“ — as a loop over the Wortfeld, not three sentences', () => {
  assert.ok(TIMES_OF_DAY.length >= 4, `${TIMES_OF_DAY.length} times of day found in the Wortfeld`);
  assert.ok(TIMES_OF_DAY.every((w) => w.nr === 8), 'the times of day are Lektion 8\'s');
  for (const w of TIMES_OF_DAY) {
    // The adverb stands bare („Ich komme abends.“); the noun stands after `am` („Ich komme am Abend.“).
    const phrase = w.article ? `am ${w.word}` : w.word;
    assert.equal(leitpunktSatisfied('Wann Sie kommen', `Ich komme ${phrase}.`), true, `Ich komme ${phrase}.`);
    assert.equal(leitpunktSatisfied('Wann Sie im Büro sind', `Ich bin ${phrase} im Büro.`), true, `Ich bin ${phrase} im Büro.`);
    // A time of day is an answer to WANN and to nothing else: „Tag: abends“ is no day on a form…
    assert.equal(scoreWriting({ kind: 'formular', fields: ['Tag'] }, { Tag: phrase }).ok, false, `Tag: ${phrase} is no day`);
    // …and no Tag in a Mitteilung either.
    assert.equal(leitpunktSatisfied('Tag und Uhrzeit', `Wir feiern ${phrase} um acht Uhr.`), false, `„${phrase}“ is no Tag`);
  }
  // The reviewer's three sentences, and the compounds and the `heute/morgen + Tageszeit` family.
  for (const t of ['Ich bin nachmittags im Büro.', 'Ich bin am Nachmittag im Büro.', 'Ich bin am Vormittag im Büro.']) {
    assert.equal(leitpunktSatisfied('Wann Sie im Büro sind', t), true, t);
  }
  for (const t of ['Ich komme am Abend.', 'Ich komme am Nachmittag.', 'Ich komme heute Abend.', 'Ich komme morgen früh.', 'Ich komme am Montagabend.',
    'Ich komme übermorgen Nachmittag.', 'Ich komme um zehn Uhr abends.', 'Morgen komme ich.', 'Heute Nachmittag komme ich.']) {
    assert.equal(leitpunktSatisfied('Wann Sie kommen', t), true, t);
  }
  // Still red, and rightly: no time at all.
  for (const t of ['Ich komme bald.', 'Ich komme später.', 'Ich komme in einer Stunde.', 'Guten Morgen! Ich komme.']) {
    assert.equal(leitpunktSatisfied('Wann Sie kommen', t), false, t);
  }
});

test('MAJOR 2 (round 22): the Wann shape reads the sentence — the writer\'s clause, not negated', () => {
  // The header's own example: a first-person sentence that shares no token with the Leitpunkt.
  assert.equal(leitpunktSatisfied('Wann Sie kommen', 'Ich bin erst um zehn Uhr da.'), true);
  assert.equal(leitpunktSatisfied('Wann Sie im Büro sind', 'Ich bin von neun bis zwölf Uhr da.'), true);
  // The Leitpunkt's own matter without a first person.
  assert.equal(leitpunktSatisfied('Wann Sie kommen', 'Der Zug kommt um zehn Uhr an.'), true);
  assert.equal(leitpunktSatisfied('Wann Sie im Büro sind', 'Das Büro ist ab neun Uhr offen.'), true);
  assert.equal(leitpunktSatisfied('Wann Sie kommen', 'Kommen Sie um zehn?'), true);
  // Someone else's time is not the writer's.
  assert.equal(leitpunktSatisfied('Wann Sie kommen', 'Der Zug hat heute Verspätung. Ich komme später.'), false);
  assert.equal(leitpunktSatisfied('Wann Sie kommen', 'Der Termin ist um zehn Uhr.'), false);
  // A negated clause says when something does NOT happen; the next clause may still answer.
  assert.equal(leitpunktSatisfied('Wann Sie kommen', 'Der Bus kommt heute nicht.'), false);
  assert.equal(leitpunktSatisfied('Wann Sie kommen', 'Ich komme heute nicht.'), false);
  assert.equal(leitpunktSatisfied('Wann Sie im Büro sind', 'Ich bin heute nicht im Büro.'), false);
  assert.equal(leitpunktSatisfied('Wann Sie kommen', 'Ich kann heute nicht kommen, ich komme morgen.'), true);
  assert.equal(leitpunktSatisfied('Wann Sie kommen', 'Ich komme nicht um zehn, sondern um elf Uhr.'), true);
  assert.equal(leitpunktSatisfied('Wann Sie kommen', 'Ich komme heute nicht, aber morgen um zehn Uhr.'), true);
  // The Tag field of the form keeps its own reading: a weekday in either case, the adverb, a date —
  // and the capitalised adverb where it heads the value.
  const tag = (v) => scoreWriting({ kind: 'formular', fields: ['Tag'] }, { Tag: v }).ok;
  for (const v of ['Montag', 'montag', 'morgen', 'Morgen', 'übermorgen', 'Wochenende', '3. Mai']) assert.equal(tag(v), true, v);
  for (const v of ['15 Uhr', 'Guten Morgen', 'bald']) assert.equal(tag(v), false, v);
});

test('Minor 34 (round 22): the Auftrag row is the shape of the Leitpunkt — every modal, a closing mark, and „ob“', () => {
  const answers = 'Die Gäste bringen Kuchen mit. Ich möchte die Wohnung am Montag um zehn Uhr sehen. Der Teppich kommt ins Wohnzimmer.';
  for (const lp of ['Was die Gäste mitbringen sollen', 'Was die Gäste mitbringen sollen?', 'Was die Gäste mitbringen sollen.', 'Was die Gäste mitbringen wollen',
    'Was die Gäste mitbringen möchten', 'Was die Gäste mitbringen mögen', 'Was die Gäste mitbringen will', 'Ob die Gäste etwas mitbringen sollen',
    'Wohin der Teppich soll', 'Wann Sie die Wohnung sehen möchten', 'Was die Kollegin machen soll!']) {
    assert.equal(leitpunktSatisfied(lp, answers), null, `„${lp}“ is the KI's`);
    assert.equal(leitpunktSatisfied(lp, ''), null, `„${lp}“ is the KI's on the empty text too`);
  }
  // …and without the modal the W-question is still decided by form.
  assert.equal(leitpunktSatisfied('Wann Sie die Wohnung sehen', 'Ich sehe die Wohnung am Montag um zehn Uhr.'), true);
  assert.equal(leitpunktSatisfied('Was die Gäste mitbringen', 'Die Gäste bringen Kuchen mit.'), true);
  assert.equal(leitpunktSatisfied('Was die Gäste mitbringen', 'Die Gäste tanzen.'), false);
});

test('Minors 33 and 37 (round 22): the fallback card names the row for what it is, and the comment tells the whole truth', () => {
  const src = readFileSync(join(ROOT, 'src/components/lesson/GradedWriting.jsx'), 'utf8');
  // The card is shown WITHOUT the KI („Formcheck, keine KI-Bewertung.“ stands under it), so no row
  // on it may say in the present tense that the KI is checking (Minor 33). Since round 23 the SAME
  // rows also stand live under the text before submission, where „prüft die KI“ is the truth
  // (Minor 38) — so the pin is on the mode: the fallback label is its own string, the live one is
  // not reachable from the fallback card. See the round-23 test below.
  assert.match(src, /fallback: 'ohne KI-Bewertung nicht prüfbar'/);
  assert.match(src, /<Checklist checks=\{check\.checks\} mode="fallback"/);
  assert.ok(!/mode="fallback"[^]*?prüft die KI/.test(src.slice(src.indexOf('done && !outcome.scored'))), 'the fallback card must not say „prüft die KI“');
  // Since 2026-09-14 an `ai` row is not only „every token a function word“: the Auftrag has content
  // words and is the KI's all the same (Minor 37).
  assert.match(src, /asks for an INTENTION/);
  assert.ok(!/every token of it is a\s+\/\/\s*function word\), so/.test(src));
});

// ───────────────────────────────────────────────────────────────────────────────────────────────
// ROUND 23 — DaF review #22, MAJOR 1 and MAJOR 2 (with Minors 38–42): THE CLOSING BLOCK, AND THE
// ANREDE CUT OFF BEFORE THE FORM IS READ
//
// Round 22 built the place-not-word rule and the reviewer measured it against the text of the
// CANDIDATE rather than the text of the review: „gefolgt von nichts als einer Unterschrift“ was
// literal, so two formulas joined by `und` („Tschüss und bis morgen“ — both L1 Wortfeld), `Bis` +
// any time the course teaches („Bis Samstag um acht Uhr!“, „Bis heute Abend“), „Gute Nacht“ (L1)
// and a telephone number under the name (the L6 Leitpunkt) were red — 49 of 63 closings, 8 of 10
// exam texts (MAJOR 1). And the Wann shape told `Morgen` from `morgen` by its capital, the one
// feature an A1 candidate does not have: „Guten **m**orgen Frau Berg, … ich komme später“ was
// green, „Ich komme **M**orgen.“ red (MAJOR 2). Both are closed as RULES — a closing BLOCK read in
// layers; the Anrede CUT OFF before any shape reads the body, and the day words case-blind — and
// the fixtures are LOOPS: every closing formula of the Wortfeld (selected by its GERMAN, so „Gute
// Nacht“ is in), every PAIR of them, every weekday and time of day behind `Bis`, every time of day
// in three spellings, the reviewer's 63 legitimate closings and the ten non-formulas.
// ───────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The course's closing formulas, selected by the GERMAN text (DaF review #22, MAJOR 1 (d): the
 * `en`-gloss selector missed „Gute Nacht“ — „Good night“ is no „See you“). A closing is a Wortfeld
 * phrase without an article that is a leave-taking: `Bis …`, or one of the fixed farewells.
 */
const CLOSING_FORMULAS_DE = WORTFELD
  .filter((w) => !w.article && /^(?:bis\s+\S+|tschüs+|auf wiedersehen|gute nacht|mach'?s gut|schönen tag(?: noch)?|ciao|tschau)$/i.test(w.de))
  .map((w) => w.de);
/** The reviewer's 63 legitimate closings of round 22, verbatim from the probe `gruss2.mjs`. */
const REVIEW_22_CLOSINGS = {
  chained: ['Viele Grüße und bis bald, Ana', 'Tschüss und bis morgen, Ana', 'Bis bald und viele Grüße, Ana', 'Mach\'s gut und bis Samstag, Ana',
    'Liebe Grüße und bis Samstag! Ana', 'Vielen Dank und bis morgen, Ana', 'Danke und viele Grüße, Ana', 'Tschüss, bis morgen! Ana',
    'Mach\'s gut. Bis bald! Ana', 'Bis bald, viele Grüße, Ana'],
  bis: ['Bis heute Abend, Ana', 'Bis morgen Abend! Ana', 'Bis Samstagabend, Ana', 'Bis Samstag um acht Uhr! Ana', 'Bis Montag um zehn, Ana',
    'Bis morgen um zehn Uhr, Ana', 'Bis dahin, Ana', 'Bis nächste Woche, Ana', 'Bis nächsten Montag, Ana', 'Bis zum Fest! Ana', 'Bis Samstag Abend, Ana',
    'Bis morgen früh, Ana'],
  formulas: ['Viele liebe Grüße, Ana', 'Ganz liebe Grüße, Ana', 'Herzlichen Gruß, Ana', 'Liebe Grüße aus Bremen, Ana', 'Viele Grüße aus dem Büro, Omar',
    'Schönes Wochenende! Ana', 'Schönen Abend noch, Ana', 'Gute Nacht, Ana', 'Einen schönen Tag noch, Ana', 'Mit besten Grüßen, Omar',
    'Mit freundlichem Gruß, Omar', 'Eure Ana', 'Ihre Ana Chakiri', 'Ihr Omar Haddad', 'Hochachtungsvoll Omar Haddad', 'Viele Grüße, Ana und Tim',
    'Viele Grüße von Ana und Tim', 'Liebe Grüße, deine Freundin Ana', 'Grüße, deine Ana', 'Bis bald, eure Ana', 'Bis dann, Ihre Ana Chakiri'],
  signatures: ['Viele Grüße, Ana\nP.S. Bring Kuchen mit!', 'Viele Grüße, Ana\nPS: Bring Kuchen mit!', 'Mit freundlichen Grüßen\nOmar Haddad\nTel. 0176 3344 5566',
    'Mit freundlichen Grüßen\nOmar Haddad\n0176 3344 5566', 'Viele Grüße, Ana (Kurs A1)', 'Viele Grüße Ana :)', 'Viele Grüße, Ana 😊', 'Viele Grüße,\nAna',
    'Viele Grüße, Ana.', 'Liebe Grüße, Ana!!!', 'LG, Ana', 'Lg Ana', 'MfG Omar', 'VG Ana', 'Viele Grüße\nAna Chakiri\nKurs A1.1', 'viele grüße, ana',
    'deine ana', 'tschüss, ana', 'bis morgen, ana', 'Viele Grüße, Ana Chakiri, Zimmer 12'],
};
/** …and the ten that are not a Schlussformel — 0 of 10 green in round 22, and 0 still. */
const REVIEW_22_NON_CLOSINGS = ['Ich freue mich, Ana', 'Ich grüße Tim. Ana', 'Grüße von Tim. Ana', 'Bis Samstag ist Ana krank.', 'Grüße Tim von mir!',
  'Ich komme bis Samstag. Ana', 'Das ist alles. Ana', 'Tschüss sagt Tim.', 'Viele Grüße an Tim! Ana', 'Bis Samstag Ana Chakiri arbeitet.'];

test('MAJOR 1 (round 23): the closing is a BLOCK — every pair of Wortfeld closings, joined by `und`, a comma or a mark, closes', () => {
  // The German selector reaches L1 AND L12, and „Gute Nacht“ — which the `en` selector missed.
  assert.ok(CLOSING_FORMULAS_DE.length >= 7, `${CLOSING_FORMULAS_DE.length} closings found in the Wortfeld`);
  assert.ok(CLOSING_FORMULAS_DE.includes('Gute Nacht'), 'L1 „Gute Nacht“ is a closing');
  assert.ok(CLOSING_FORMULAS_DE.some((f) => /^Bis morgen$/.test(f)) && CLOSING_FORMULAS_DE.some((f) => /^Bis später$/.test(f)), 'L1 and L12 both reached');
  const gruss = (closing) => row(ANY_MITTEILUNG, `Hallo Lena! ${BODY_L4} ${closing}`, 'gruss');
  for (const a of CLOSING_FORMULAS_DE) {
    assert.equal(gruss(`${a}, Ana`), true, `„${a}, Ana“`);
    assert.equal(gruss(`${a.toLowerCase()}, ana`), true, `„${a.toLowerCase()}, ana“ — no capital anywhere (Minor 39)`);
    for (const b of CLOSING_FORMULAS_DE) {
      if (a === b) continue;
      // The two ways the course's own dialogues join them (L1: „Tschüss! Bis morgen.“, L12: „Mach's
      // gut, Lena. Bis bald!“) and the two the learner writes („Tschüss und bis morgen“, „Tschüss, bis morgen“).
      assert.equal(gruss(`${a} und ${b.charAt(0).toLowerCase()}${b.slice(1)}, Ana`), true, `„${a} und ${b}, Ana“`);
      assert.equal(gruss(`${a}, ${b.charAt(0).toLowerCase()}${b.slice(1)}! Ana`), true, `„${a}, ${b}! Ana“`);
      assert.equal(gruss(`${a}! ${b}. Ana`), true, `„${a}! ${b}. Ana“`);
      // …and a pair in the MIDDLE of the text is still no closing.
      assert.equal(row(ANY_MITTEILUNG, `Hallo Lena! ${a} und ${b}, Ana. ${BODY_L4}`, 'gruss'), false, `„${a} und ${b}“ mid-text`);
    }
  }
});

test('MAJOR 1 (round 23): `bis` + ANY time the course teaches closes — every weekday, every time of day, the clock, `dahin`', () => {
  const gruss = (closing) => row(ANY_MITTEILUNG, `Hallo Lena! ${BODY_L4} ${closing}`, 'gruss');
  const nouns = TIMES_OF_DAY.filter((w) => w.article).map((w) => w.word);
  assert.ok(nouns.length >= 1, 'L8 teaches at least one time-of-day noun');
  assert.equal(WEEKDAYS.length, 7);
  for (const d of WEEKDAYS) {
    for (const c of [`Bis ${d}`, `Bis ${d} um acht Uhr`, `Bis ${d} um halb neun`, `Bis zum ${d}`, ...nouns.flatMap((n) => [`Bis ${d}${n.toLowerCase()}`, `Bis ${d} ${n}`])]) {
      assert.equal(gruss(`${c}, Ana`), true, `„${c}, Ana“`);
      assert.equal(gruss(`${c}! Ana`), true, `„${c}! Ana“`);
    }
    // The weekday is a closing only at the head: „Ich komme bis Samstag.“ is a sentence.
    assert.equal(gruss(`Ich komme bis ${d}. Ana`), false, `„Ich komme bis ${d}. Ana“`);
  }
  for (const adv of ['heute', 'morgen', 'übermorgen']) {
    for (const c of [`Bis ${adv}`, `Bis ${adv} früh`, ...nouns.map((n) => `Bis ${adv} ${n}`), `Bis ${adv} um zehn Uhr`]) {
      assert.equal(gruss(`${c}, Ana`), true, `„${c}, Ana“`);
    }
  }
  for (const c of ['Bis dahin', 'Bis nachher', 'Bis später', 'Bis gleich', 'Bis bald', 'Bis dann', 'Bis zum Wochenende', 'Bis nächste Woche', 'Bis 15 Uhr', 'Bis drei Uhr']) {
    assert.equal(gruss(`${c}, Ana`), true, `„${c}, Ana“`);
  }
});

test('MAJOR 1 (round 23): the signature may carry contact lines — and the reviewer\'s 63 closings are 0 red, the 10 non-closings 0 green', () => {
  const gruss = (closing) => row(ANY_MITTEILUNG, `Hallo Lena! ${BODY_L4} ${closing}`, 'gruss');
  const all = Object.values(REVIEW_22_CLOSINGS).flat();
  assert.equal(all.length, 63);
  for (const c of all) assert.equal(gruss(c), true, `„${c.replace(/\n/g, '⏎')}“`);
  for (const c of REVIEW_22_NON_CLOSINGS) assert.equal(gruss(c), false, `„${c}“ is no Gruß`);
  // The L6 exam text with the number under the name: the Gruß AND the Telefonnummer are green.
  const l6 = scoreWriting(formcheckTask(6), 'Sehr geehrte Frau Berg, ich brauche einen neuen Computer und ein Handy. Ich bin am Montag von neun bis zwölf Uhr im Büro. Mit freundlichen Grüßen\nOmar Haddad\nTel. 0176 3344 5566');
  assert.deepEqual(l6.checks.filter((c) => !c.ok).map((c) => c.label), [], JSON.stringify(l6.checks));
  // An appendix is a P.S., a phone or address line, an emoji line — and nothing else: a sentence
  // after the signature is still a sentence.
  for (const c of ['Viele Grüße, Ana\nMusterstraße 12, 28195 Bremen', 'Viele Grüße, Ana\n:)', 'Viele Grüße, Ana\nP.S. Bring Kuchen mit!\nUnd Musik!']) {
    assert.equal(gruss(c), true, `„${c.replace(/\n/g, '⏎')}“`);
  }
  assert.equal(gruss('Viele Grüße, Ana\nIch komme um drei Uhr.'), false, 'a sentence under the name is not an appendix');
  // Round 22's own pins hold: the reviewer's 30 closings of round 21, the control, „Dein“ without a name.
  for (const g of REVIEW_21_CLOSINGS) assert.equal(gruss(g), true, g);
  assert.equal(gruss('Ich freue mich, Ana'), false);
  assert.equal(gruss('Das ist dein'), false);
});

test('MAJOR 2 (round 23): the Anrede is cut off before the form is read — „Guten morgen“ in the learner\'s spelling answers no Wann', () => {
  const wannRow = (nr, text, label) => scoreWriting(formcheckTask(nr), text).checks.find((c) => c.label === label);
  // The reviewer's four full exam texts without a time, all green in round 22.
  const four = [
    [10, 'Guten morgen Frau Berg, der Zug hat Verspätung und ich komme später ins Büro. Bitte beginnen Sie ohne mich und rufen Sie Herrn Weber an. Bis später, Ana', 'Wann Sie kommen'],
    [6, 'Guten morgen Frau Berg, ich brauche einen neuen Computer und ein Handy. Meine Telefonnummer ist 0176 3344 5566. Ich bin nicht im Büro. Mit freundlichen Grüßen, Omar', 'Wann Sie im Büro sind'],
    [4, 'Guten morgen Lena, ich bin auf dem Flohmarkt. Ich kaufe eine Lampe und einen Tisch. Die Lampe kostet fünf Euro, der Tisch zwanzig Euro. Ich komme später nach Hause. Liebe Grüße, Ana', 'Wann Sie kommen'],
    [12, 'Guten morgen Lena, ich habe Geburtstag und ich feiere um acht Uhr bei mir. Bringst du bitte Musik und einen Salat mit? Ich freue mich auf dich! Viele Grüße, Ana', 'Tag und Uhrzeit'],
  ];
  for (const [nr, text, label] of four) {
    const r = wannRow(nr, text, label);
    assert.equal(r.ok, false, `L${nr} „${label}“ ← „${text.slice(0, 30)}…“ names no time`);
    assert.equal(scoreWriting(formcheckTask(nr), text).checks.find((c) => c.key === 'anrede').ok, true, 'the Anrede row still reads „Guten morgen“');
  }
  // The five round-22 texts in all three spellings of the Anrede: still red.
  const five = [
    [10, 'Guten Morgen Frau Berg, der Zug hat Verspätung und ich komme später ins Büro. Bitte beginnen Sie ohne mich und rufen Sie Herrn Weber an. Bis später, Ana', 'Wann Sie kommen'],
    [10, 'Guten Morgen Frau Berg, mein Bus kommt nicht. Ich komme später ins Büro, es tut mir leid. Bitte fangen Sie ohne mich an. Bis morgen, Ana', 'Wann Sie kommen'],
    [6, 'Guten Morgen, Frau Berg! Ich brauche einen neuen Computer und ein Handy. Meine Telefonnummer ist 0176 3344 5566. Ich bin nicht im Büro. Mit freundlichen Grüßen, Omar', 'Wann Sie im Büro sind'],
    [4, 'Guten Morgen Lena! Ich bin auf dem Flohmarkt. Ich kaufe eine Lampe und einen Tisch. Die Lampe kostet fünf Euro, der Tisch zwanzig Euro. Ich komme später nach Hause. Liebe Grüße, Ana', 'Wann Sie kommen'],
    [10, 'Liebe Frau Berg, der Bus kommt heute nicht. Ich komme später ins Büro, es tut mir leid. Bitte fangen Sie ohne mich an. Viele Grüße, Ana', 'Wann Sie kommen'],
  ];
  for (const [nr, text, label] of five) {
    for (const spelling of ['Guten Morgen', 'Guten morgen', 'guten morgen']) {
      const t = text.replace('Guten Morgen', spelling);
      assert.equal(wannRow(nr, t, label).ok, false, `L${nr} „${label}“ ← „${t.slice(0, 30)}…“`);
    }
  }
  // The reviewer's isolated probes: the Anrede with a comma, a mark, no capital, a second Anrede,
  // and „Guten Morgen“ as words inside a sentence.
  for (const t of ['Guten morgen Frau Berg, ich komme später ins Büro.', 'Guten morgen Frau Berg! Ich komme später ins Büro.',
    'guten morgen frau berg, ich komme später.', 'Hallo Lena, guten Morgen, ich komme später.', 'Ich sage Guten Morgen, ich komme später.']) {
    assert.equal(leitpunktSatisfied('Wann Sie kommen', t), false, t);
  }
  assert.equal(leitpunktSatisfied('Wann Sie im Büro sind', 'Guten morgen Frau Berg, ich bin krank und nicht im Büro.'), false);
  assert.equal(leitpunktSatisfied('Wann Sie im Büro sind', 'Guten morgen, Frau Berg! Ich brauche einen Computer. Ich bin heute nicht im Büro.'), false);
  assert.equal(leitpunktSatisfied('Tag und Uhrzeit', 'Guten morgen Lena! Wir feiern um acht Uhr bei mir.'), false);
  // The cut takes the Anrede and nothing of the sentence: the first clause after it still answers.
  assert.equal(leitpunktSatisfied('Wann Sie kommen', 'Hallo Lena, ich komme um drei Uhr nach Hause.'), true);
  assert.equal(leitpunktSatisfied('Ihr Name und Ihr Geburtsdatum', 'Hallo, ich bin Ana Chakiri. Ich bin am 3. Mai 1998 geboren.'), true, '„Hallo, ich bin …“ keeps its clause');
  assert.equal(leitpunktSatisfied('Wann Sie kommen', 'Guten Morgen Frau Berg ich komme um zehn Uhr'), true, 'no mark after the Anrede: only the formula goes');
  assert.deepEqual(openingCut('Sehr geehrte Damen und Herren, ich heiße Ana.'), { anrede: true, body: 'ich heiße Ana.' });
  assert.deepEqual(openingCut('Guten Tag, Frau Berg! Ich brauche einen Computer.'), { anrede: true, body: 'Ich brauche einen Computer.' });
});

test('MAJOR 2 (round 23): the day words are read case-blind — „Ich komme Morgen.“, „Nachmittags“, „am nachmittag“ answer Wann', () => {
  for (const t of ['Hallo Lena, ich komme Morgen.', 'Ich komme Morgen.', 'Ich komme Morgen um drei Uhr.', 'Ich komme Heute Nachmittag.', 'Ich komme am nachmittag.',
    'Ich komme am abend.', 'Ich komme heute nachmittag.', 'Ich komme heute abend.', 'Ich komme Montag Abend.', 'Ich komme am Samstag Nachmittag.', 'Ich komme Übermorgen.']) {
    assert.equal(leitpunktSatisfied('Wann Sie kommen', t), true, t);
  }
  assert.equal(leitpunktSatisfied('Wann Sie im Büro sind', 'Ich bin Nachmittags im Büro.'), true);
  // The time-of-day loop of round 22, now in THREE spellings per Wortfeld entry — the test finds
  // „Nachmittags“ before the reviewer does.
  for (const w of TIMES_OF_DAY) {
    const phrase = w.article ? `am ${w.word}` : w.word;
    const cap = (s) => s.replace(/(^|\s)(\p{L})(?=\p{L}*$)/u, (m, sp, ch) => `${sp}${ch.toUpperCase()}`);
    for (const p of new Set([phrase, phrase.toLowerCase(), cap(phrase)])) {
      assert.equal(leitpunktSatisfied('Wann Sie kommen', `Ich komme ${p}.`), true, `Ich komme ${p}.`);
      assert.equal(leitpunktSatisfied('Wann Sie im Büro sind', `Ich bin ${p} im Büro.`), true, `Ich bin ${p} im Büro.`);
      assert.equal(leitpunktSatisfied('Tag und Uhrzeit', `Wir feiern ${p} um acht Uhr.`), false, `„${p}“ is no Tag`);
    }
  }
  // …and the weekdays in both cases, on the Mitteilung and on the form.
  const tag = (v) => scoreWriting({ kind: 'formular', fields: ['Tag'] }, { Tag: v }).ok;
  for (const d of WEEKDAYS) {
    for (const v of [d, d.toLowerCase(), `${d}abend`]) assert.equal(leitpunktSatisfied('Wann Sie kommen', `Ich komme am ${v}.`), true, v);
    assert.equal(tag(d.toLowerCase()), true, d);
  }
  for (const v of ['Morgen', 'morgen', 'Heute', 'Übermorgen']) assert.equal(tag(v), true, v);
  // „Guten Morgen“ is a greeting wherever it stands — on the form and in the text.
  for (const v of ['Guten Morgen', 'guten morgen', 'Guten morgen']) assert.equal(tag(v), false, v);
  for (const t of ['Ich komme bald.', 'Ich komme später.', 'Guten Morgen! Ich komme.', 'guten morgen! ich komme.', 'Der Bus kommt heute nicht.', 'Ich komme heute nicht.']) {
    assert.equal(leitpunktSatisfied('Wann Sie kommen', t), false, t);
  }
});

test('Minors 39 and 40 (round 23): the Anrede has no case rule, „Liebe alle“ opens, and a header line before it is skipped', () => {
  const anrede = (opening) => row(ANY_MITTEILUNG, `${opening} ${BODY_L4} Viele Grüße, Ana`, 'anrede');
  // Every opening formula of the Wortfeld in three spellings.
  for (const f of OPENING_FORMULAS) {
    for (const o of [`${f} Lena,`, `${f.toLowerCase()} lena,`, `${f.toUpperCase()} LENA!`]) assert.equal(anrede(o), true, o);
  }
  for (const o of ['liebe lena,', 'lieber tim,', 'hallo lena,', 'guten tag frau berg,', 'sehr geehrte frau berg,', 'LIEBE LENA,', 'HALLO LENA!', 'Liebe alle,',
    'Liebe Kolleginnen und Kollegen,', 'Hallo ihr Lieben,', 'Liebes Team,', 'Liebe Frau Dr. Berg,', 'Lieber Herr Weber,', 'Hallo, liebe Lena!', 'Liebe Lena, lieber Tim,',
    'Guten Morgen Lena,', 'Guten Tag!', 'Hallo Frau Berg, guten Morgen!', 'Liebe Lena!', 'Liebe Lena']) {
    assert.equal(anrede(o), true, o);
  }
  // A place and date, a Betreff, an addressee — the letter form some courses teach — before the Anrede.
  for (const o of ['Bremen, 12.5.2026\nLiebe Lena,', '12.05.2026\nHallo Lena,', 'Bremen, den 12. Mai\nLiebe Lena,', 'Betreff: Verspätung\nGuten Morgen Frau Berg,',
    'An Frau Berg\nGuten Tag,', 'Montag\nHallo Lena,', 'Nachricht für Lena\nHallo Lena!', 'Hallo Lena!\n\n']) {
    assert.equal(anrede(o), true, o.replace(/\n/g, '⏎'));
  }
  // …and the header's date is not the text's: L12 „Tag und Uhrzeit“ stays red without a day in the body.
  assert.equal(leitpunktSatisfied('Tag und Uhrzeit', 'Bremen, 12.5.2026\nLiebe Lena, wir feiern um acht Uhr bei mir.'), false);
  // No Anrede: a bare name, a colon, a sentence, the adverb, „Liebe Grüße“ — the reviewer's eight.
  for (const o of ['Ana hier.', 'Ich bin Ana.', 'Lena,', 'Frau Berg,', 'Für Lena:', 'Liebe Grüße!', 'Ich habe eine Frage, liebe Lena.', 'Danke, Lena!']) {
    assert.equal(anrede(o), false, o);
  }
  // A four-word SENTENCE is not a header: the L2 fixture without an Anrede keeps its first sentence.
  assert.equal(leitpunktSatisfied('Ihr Name und Ihr Geburtsdatum', 'Ich heiße Ana Chakiri. Ich bin am 3.5.1998 geboren.'), true);
  // The whole exam text without a capital: every form row green.
  const lower = scoreWriting(formcheckTask(4), 'hallo lena! ich bin auf dem flohmarkt und kaufe eine lampe und einen tisch. die lampe kostet fünf euro, der tisch zwanzig euro. ich komme um drei uhr nach hause. viele grüße, ana');
  assert.deepEqual(lower.checks.filter((c) => !c.ok).map((c) => c.label), [], JSON.stringify(lower.checks));
});

test('Minors 41 and 42 (round 23): `mein`/`mich`/`mir` are the writer, `gegen drei` is a clock, and the negation is per clause — `sondern` splits', () => {
  for (const t of ['Mein Zug ist erst um zehn Uhr in Bremen.', 'Mein Bus kommt erst um zehn Uhr.', 'Ich komme gegen drei.', 'Ich komme gegen 15 Uhr.', 'Ich komme so gegen drei Uhr.',
    'Ich komme nicht um neun sondern um zehn Uhr.', 'Ich komme nicht um neun Uhr, sondern um zehn Uhr.', 'Ich bin nicht um neun, sondern erst um zehn Uhr im Büro.',
    'Ich komme um zehn Uhr nicht mit dem Zug, sondern mit dem Bus.', 'Kein Problem: ich komme um zehn Uhr.', 'Keine Sorge, ich komme um zehn Uhr.',
    'Ich komme leider nicht um zehn Uhr, ich komme um zwölf Uhr.', 'Ich komme heute nicht, morgen um zehn Uhr.', 'Ich bin nicht vor zehn Uhr im Büro.',
    'Ich komme nicht später als zehn Uhr.', 'Ich komme um zehn Uhr, nicht früher.']) {
    assert.equal(leitpunktSatisfied('Wann Sie kommen', t), true, t);
  }
  for (const t of ['Sie können mich von neun bis zwölf Uhr anrufen.', 'Sie erreichen mich von neun bis zwölf Uhr im Büro.', 'Mein Büro ist von neun bis zwölf Uhr offen.',
    'Ich bin heute nicht im Büro, aber morgen.', 'Ich bin heute nicht im Büro. Morgen bin ich wieder da.']) {
    assert.equal(leitpunktSatisfied('Wann Sie im Büro sind', t), true, t);
  }
  // Still red: a denied time with no contrast, someone else's time, no time.
  for (const t of ['Ich komme heute nicht.', 'Der Bus kommt heute nicht.', 'Ich kann heute nicht kommen.', 'Der Termin ist um zehn Uhr.', 'Ich komme später.']) {
    assert.equal(leitpunktSatisfied('Wann Sie kommen', t), false, t);
  }
  assert.equal(leitpunktSatisfied('Wann Sie im Büro sind', 'Ich bin heute nicht im Büro.'), false);
});

test('Minor 38 (round 23): the checklist stands live under the text before submission, and its KI rows say „prüft die KI“', () => {
  const src = readFileSync(join(ROOT, 'src/components/lesson/GradedWriting.jsx'), 'utf8');
  // One component renders both moments; the live one is mounted while `!done`, with the standard's wording.
  assert.match(src, /live: 'prüft die KI'/);
  assert.match(src, /\{!done && check\.checks\.length > 0 && \([^]*?<Checklist checks=\{check\.checks\} mode="live"/);
  // Live, an `ai` row is decided by the KI after submission; the fallback says the KI did not run.
  assert.match(src, /mode === 'fallback' \? AI_ROW_LABEL\.fallback/);
  // The FernUSG line stands under the live list too: a form check is not a correction.
  assert.match(src, /Formcheck: nur die Form/);
});
