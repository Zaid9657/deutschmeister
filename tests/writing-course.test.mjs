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
  // Exactly two of the eighteen A1.1 Leitpunkte are in this class, and both are the same sentence.
  const undecidable = COURSE.flatMap((t) => (t.register === 'formular' ? [] : t.leitpunkte))
    .filter((lp) => leitpunktSatisfied(lp, 'Hallo Lena! Viele Grüße, Ana') === null);
  // ROUND 16 (DaF review #15, MAJOR 2): „Warum Sie feiern“ joins them. A reason is not a form, and
  // the only lower-case word of that Leitpunkt is the TASK's own verb — deciding it by that word
  // made the empty echo („Wir feiern.“) green and the reason („Ich habe Geburtstag.“) red.
  assert.deepEqual(undecidable, ['Warum Sie schreiben', 'Warum Sie schreiben', 'Warum Sie feiern']);
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
  ['Was die Kollegin bis dahin machen soll', 'Ich komme um zehn Uhr. Bis dann!'],
  ['Was die Gäste mitbringen sollen', 'Ich lade meine Gäste ein.'],
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
  // „Was die Gäste mitbringen sollen“ ← „Ich lade meine Gäste ein.“ names the Gäste and answers
  // nothing; the separable verb counts split („Bringt ihr Kuchen mit?“).
  const lp = 'Was die Gäste mitbringen sollen';
  assert.deepEqual(leitpunktEvidence(lp).conjuncts[0].words, ['mitbringen']);
  assert.equal(leitpunktSatisfied(lp, 'Bringt ihr bitte Kuchen und Musik mit?'), true);
  assert.equal(leitpunktSatisfied(lp, 'Die Gäste kommen um acht Uhr.'), false);
  // ROUND 18: the verb is kept as the conjunct's word (RULE 21 measures whether it is taught), but
  // it no longer SCORES — an Auftrag is a sentence type, see the round-18 block below.
  assert.equal(leitpunktEvidence(lp).conjuncts[0].shapes.length, 1, 'the Auftrag conjunct carries the instruction shape');
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
  ['Was die Kollegin bis dahin machen soll', 'Bitte machen Sie die Arbeit ohne mich.', 'Ich komme um zehn Uhr. Bis dann!', 'Die Kollegin weiß, was sie tut.'],
  ['Tag und Uhrzeit', 'Wir feiern am Freitag um acht Uhr.', 'Wir feiern am Freitag.', 'Der Tag und die Uhrzeit stehen fest.'],
  ['Was die Gäste mitbringen sollen', 'Bringt ihr bitte Kuchen und Musik mit?', 'Die Gäste kommen um acht Uhr.', 'Die Gäste sind eingeladen.'],
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
// in both directions, never as a list of the sentences that happened to fail.
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

/**
 * PER AUFTRAG LEITPUNKT: three instructions that do NOT contain the task's verb (green) and three
 * echoes of the task's verb that instruct nothing (red). The echo is the old rule's whole evidence;
 * the instruction is what the exam asks for. The L10 line the content worker writes into the model
 * text („Bitte rufen Sie Herrn Weber an.“) is the first green of its row.
 */
const AUFTRAG_FIXTURE = [
  ['Was die Kollegin bis dahin machen soll',
    ['Bitte rufen Sie Herrn Weber an.', 'Warten Sie bitte im Büro.', 'Sie können ohne mich beginnen.'],
    ['Das macht nichts.', 'Ich mache das später.', 'Wir machen eine Pause.']],
  // ROUND 19 (DaF review #18, MAJOR 1): „Kuchen und Salat, bitte!“ left this row — `bitte` now needs
  // a verb in its clause, or „Entschuldigung, bitte.“ is an Auftrag too — and „Die Gäste bringen
  // nichts mit.“ left the echo list: it is a statement about the guests, which IS the exam's answer
  // (see the round-19 block below), not an echo.
  ['Was die Gäste mitbringen sollen',
    ['Bitte kommt mit Kuchen.', 'Bitte Kuchen und Salat kaufen.', 'Ihr könnt Getränke kaufen.'],
    ['Ich bringe Kuchen mit.', 'Wir bringen Musik mit.', 'Wir bringen nichts mit.']],
];

test('MAJOR 1 (round 18): an Auftrag is a sentence type — instruction green, verb echo red', () => {
  const auftraege = COURSE.filter((t) => t.register !== 'formular').flatMap((t) => t.leitpunkte)
    .filter((lp) => /\b(?:soll|sollen|muss|müssen|kann|können)\b/.test(lp));
  assert.deepEqual([...new Set(auftraege)], AUFTRAG_FIXTURE.map(([lp]) => lp), 'every Auftrag Leitpunkt of the course is in the fixture');
  for (const [lp, instructions, echoes] of AUFTRAG_FIXTURE) {
    const verb = leitpunktEvidence(lp).conjuncts[0].folded;
    for (const t of instructions) {
      assert.ok(!verb.some((v) => t.toLowerCase().includes(v)), `„${t}“ must not contain the task verb, or it proves nothing`);
      assert.equal(leitpunktSatisfied(lp, `Hallo Lena! ${t} Viele Grüße, Ana`), true, `„${lp}“ ← „${t}“ is an instruction`);
    }
    for (const t of echoes) {
      assert.ok(verb.some((v) => t.toLowerCase().includes(v)), `„${t}“ must echo the task verb, or it proves nothing`);
      assert.equal(leitpunktSatisfied(lp, `Hallo Lena! ${t} Viele Grüße, Ana`), false, `„${lp}“ ← „${t}“ echoes and instructs nothing`);
    }
  }
  // The three sentence types, one each, and the three that are none of them.
  const lp = 'Was die Kollegin bis dahin machen soll';
  assert.equal(leitpunktSatisfied(lp, 'Rufen Sie Herrn Weber an.'), true, 'imperative');
  assert.equal(leitpunktSatisfied(lp, 'Bitte Herrn Weber anrufen.'), true, 'bitte + verb');
  assert.equal(leitpunktSatisfied(lp, 'Sie müssen Herrn Weber anrufen.'), true, 'modal chunk');
  assert.equal(leitpunktSatisfied(lp, 'Was machen Sie heute?'), false, 'a question word is not an instruction');
  assert.equal(leitpunktSatisfied(lp, 'Ich muss Herrn Weber anrufen.'), false, 'the writer’s own modal is a plan, not an instruction');
  assert.equal(leitpunktSatisfied(lp, 'Kommst du?'), false, 'a verb-first question with nothing asked for');
  assert.equal(leitpunktSatisfied(lp, 'Hast du Zeit?'), false, 'a function-word question');
  // The sentence going into the L10 model text satisfies the L10 Auftrag on the bank's own task.
  assert.equal(scoreWriting(formcheckTask(10), 'Liebe Kollegin, der Zug hat leider Verspätung. Ich komme erst um zehn Uhr. Bitte rufen Sie Herrn Weber an und beginnen Sie ohne mich. Vielen Dank und viele Grüße, Ana').ok, true);
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
  assert.equal(leitpunktSatisfied('Was die Kollegin bis dahin machen soll', 'Bitte rufen Sie Herrn Weber an.'), true);
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
// ───────────────────────────────────────────────────────────────────────────────────────────────

const L10 = 'Was die Kollegin bis dahin machen soll';
const L12 = 'Was die Gäste mitbringen sollen';
const wrap10 = (t) => `Liebe Kollegin, der Zug hat Verspätung. Ich komme um zehn Uhr. ${t} Viele Grüße, Ana`;
const wrap12 = (t) => `Hallo Lena! Ich habe Geburtstag. Wir feiern am Samstag um acht Uhr. ${t} Bis bald, Ana`;

test('MAJOR 1 (round 19): the statement about the person is the exam’s answer — a person subject, a full verb', () => {
  // The reviewer's ten exam-typical statements: eight green; the two with `ich`/`wir` are the
  // writer's own plan and stay red, as the round-18 fixture above already pins.
  for (const t of ['Die Gäste bringen Kuchen mit.', 'Jeder bringt etwas mit.', 'Alle bringen Getränke mit.',
    'Lena bringt den Salat mit.', 'Die Gäste bringen Kuchen und Musik mit.', 'Du bringst den Kuchen mit.',
    'Ihr bringt Salat und Brot mit.', 'Jeder Gast bringt einen Salat.', 'Die Gäste bringen nichts mit.']) {
    assert.equal(leitpunktSatisfied(L12, wrap12(t)), true, `L12 ← „${t}“`);
  }
  for (const t of ['Wir brauchen Kuchen und Getränke.', 'Ich brauche Kuchen und Musik.']) {
    assert.equal(leitpunktSatisfied(L12, wrap12(t)), false, `L12 ← „${t}“ is the writer, not the guests`);
  }
  // Three statements per Auftrag Leitpunkt about the person it names, and the subject rule's people:
  // the Leitpunkt's own noun in any inflection, `Sie`, a name.
  for (const t of ['Die Kollegin beginnt ohne mich.', 'Sie beginnt bitte ohne mich.', 'Die Kollegen können schon beginnen.',
    'Meine Kollegin soll warten.', 'Frau Berg beginnt ohne mich.']) {
    assert.equal(leitpunktSatisfied(L10, wrap10(t)), true, `L10 ← „${t}“`);
  }
  // A statement whose only content after the verb is a TIME answers a Wann, not this Leitpunkt.
  assert.equal(leitpunktSatisfied(L12, wrap12('Die Gäste kommen um acht Uhr.')), false);
  assert.equal(leitpunktSatisfied(L10, wrap10('Die Kollegin kommt um neun Uhr.')), false);
  // `sein`/`haben` are no full verb; a question is no statement; a W-word is no statement.
  for (const t of ['Sie ist müde.', 'Die Kollegin hat Zeit.', 'Sind Sie müde?', 'Was machen Sie heute?']) {
    assert.equal(leitpunktSatisfied(L10, wrap10(t)), false, `L10 ← „${t}“`);
  }
});

test('MAJOR 1 (round 19): the modal shape needs a PERSON subject — a thing, `es`, `man` describe the world', () => {
  // The reviewer's six, all green in round 18.
  for (const t of ['Der Zug kann nicht fahren.', 'Der Bus kann nicht fahren.', 'Es kann regnen.', 'Es muss schnell gehen.',
    'Der Zug muss um neun Uhr fahren.', 'Der Chef muss das wissen.', 'Man muss warten.', 'Dann können wir beginnen.',
    'Leider kann ich nicht kommen.']) {
    assert.equal(leitpunktSatisfied(L10, wrap10(t)), false, `L10 ← „${t}“ instructs nobody`);
  }
  // …and the modal sentences with a person stay green.
  for (const t of ['Sie kann ohne mich beginnen.', 'Die Kollegin soll warten.', 'Sie müssen nichts machen.', 'Können Sie Herrn Weber anrufen?']) {
    assert.equal(leitpunktSatisfied(L10, wrap10(t)), true, `L10 ← „${t}“`);
  }
  for (const t of ['Die Gäste sollen Kuchen und Salat mitbringen.', 'Könnt ihr Kuchen mitbringen?', 'Kannst du den Salat mitbringen?']) {
    assert.equal(leitpunktSatisfied(L12, wrap12(t)), true, `L12 ← „${t}“`);
  }
  // Two full exam texts of the reviewer's: „der Zug kann heute nicht fahren“ is no Auftrag.
  const task = formcheckTask(10);
  for (const t of ['Liebe Kollegin, der Zug kann heute nicht fahren, er hat Verspätung. Ich komme um zehn Uhr. Viele Grüße, Ana',
    'Liebe Kollegin, ich komme um zehn Uhr, der Bus kann nicht fahren. Es muss leider so gehen. Viele Grüße, Ana']) {
    const row = scoreWriting(task, t).checks.find((c) => c.label === L10);
    assert.equal(row.ok, false, t);
  }
});

test('MAJOR 1 (round 19): `bitte` needs a verb in its clause; „Warten Sie.“ is an Auftrag; the question asks for more than a time', () => {
  for (const t of ['Entschuldigung, bitte.', 'Vielen Dank, bitte.', 'Danke, bitte.', 'Bitte, der Zug hat Verspätung.', 'Ich komme bitte um zehn Uhr.', 'Wie bitte?']) {
    assert.equal(leitpunktSatisfied(L10, wrap10(t)), false, `L10 ← „${t}“ requests nothing`);
  }
  for (const t of ['Bitte warten.', 'Bitte warten Sie auf mich.', 'Warten Sie.', 'Warten Sie bitte.', 'Bitte schreiben Sie Frau Berg.', 'Bitte sagen Sie Herrn Weber Bescheid.']) {
    assert.equal(leitpunktSatisfied(L10, wrap10(t)), true, `L10 ← „${t}“`);
  }
  for (const t of ['Bring bitte einen Salat mit.', 'Bringt bitte Kuchen mit.', 'Bitte Kuchen und Musik mitbringen.', 'Bitte bringt Kuchen mit, ich habe Getränke.']) {
    assert.equal(leitpunktSatisfied(L12, wrap12(t)), true, `L12 ← „${t}“`);
  }
  // A verb-first question: „Bringst du Musik mit?“ asks for a thing, „Kommen Sie um zehn Uhr?“ for
  // a time, „Kommst du?“ for presence — one Auftrag, two questions.
  assert.equal(leitpunktSatisfied(L12, wrap12('Bringst du Musik mit?')), true);
  assert.equal(leitpunktSatisfied(L10, wrap10('Kommen Sie um zehn Uhr?')), false);
  assert.equal(leitpunktSatisfied(L10, wrap10('Arbeiten Sie heute?')), false);
  assert.equal(leitpunktSatisfied(L10, wrap10('Kommst du?')), false);
});

test('MAJOR 1 (round 19): the L12 model text passes on its statement, not on its question', () => {
  const l12 = LEKTIONEN[11].schreiben;
  assert.equal(l12.kind, 'mitteilung');
  const question = 'Bringst du bitte den Salat mit?';
  assert.ok(l12.sample.includes(question), 'the fixture reads the model text as built');
  const blanked = l12.sample.replace(` ${question}`, '');
  const row = scoreWriting(formcheckTask(12), blanked).checks.find((c) => c.label === L12);
  assert.equal(row.ok, true, 'without its question the model text still answers the Auftrag by its statement');
  // The two exam texts of the reviewer's, 32 and 26 words, both answering with a statement.
  for (const t of ['Liebe Lena, ich habe am Freitag Geburtstag. Wir feiern am Samstag um acht Uhr bei mir. Jeder bringt etwas zu essen mit, ich habe Getränke und Musik. Kommst du? Viele Grüße, Ana',
    'Hallo Lena! Ich habe Geburtstag und wir feiern am Samstag um sieben Uhr. Die Gäste bringen Kuchen und Salat mit. Ich freue mich! Bis bald, Ana']) {
    assert.equal(scoreWriting(formcheckTask(12), t).ok, true, t);
  }
});

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
  for (const v of ['Marokko', 'Türkei', 'Deutschland', 'Iran', 'Arabisch', 'Deutsch', 'Dari']) assert.equal(name(v), false, v);
  // The language remainder: capitalised, no `-isch` (those are read by form), no duplicates.
  assert.equal(new Set(LANGUAGE_NAMES.map((n) => n.toLowerCase())).size, LANGUAGE_NAMES.length);
  assert.ok(LANGUAGE_NAMES.every((n) => /^[A-ZÄÖÜ][a-zäöüß]+$/.test(n) && !/isch$/.test(n)), 'the list holds only what the form cannot read');
  assert.equal(leitpunktSatisfied('Ihre Staatsangehörigkeit', 'Ich spreche Dari.'), false);
});
