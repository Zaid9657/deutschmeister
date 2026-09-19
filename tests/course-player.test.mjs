// Guard suite for the guided course player (decision 2026-09-08: a course is a
// separate identity — enrol, lesson 1 → …, final test, completion). Pins the
// pure sequencing (src/lib/courseFlow.js), the registry, and the three-place
// route rule for /course/*.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { flattenCourse, isUnlocked, currentItem, isComplete, percentDone, nextItem, INSTRUCTION } from '../src/lib/courseFlow.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const course = {
  level: 'x1.1', programKey: 'x', program: { weeks: [
    { title: 'W1', intro: '', days: [{ label: 'Tag 1', items: [{ id: 'a', type: 'lesson', title: 'A', minutes: 10, href: '/x' }, { id: 'b', type: 'review', title: 'B', minutes: 5, href: '/y' }] }] },
    { title: 'W2', intro: '', days: [{ label: 'Tag 2', items: [{ id: 'c', type: 'exam', title: 'C', minutes: 30, href: '/z' }] }] },
  ] },
};

test('flattenCourse keeps program order and annotates position, unit and day', () => {
  const items = flattenCourse(course);
  assert.deepEqual(items.map((i) => i.id), ['a', 'b', 'c']);
  assert.deepEqual(items.map((i) => i.position), [0, 1, 2]);
  assert.equal(items[2].weekIndex, 1);
  assert.equal(items[1].dayCount, 2);
});

test('lessons unlock strictly in sequence and the current lesson is the first not done', () => {
  const items = flattenCourse(course);
  const none = new Set();
  assert.equal(isUnlocked(items, 0, none), true, 'lesson 1 is always open');
  assert.equal(isUnlocked(items, 1, none), false);
  assert.equal(currentItem(items, none).id, 'a');
  const one = new Set(['a']);
  assert.equal(isUnlocked(items, 1, one), true);
  assert.equal(isUnlocked(items, 2, one), false, 'skipping is not possible');
  assert.equal(currentItem(items, one).id, 'b');
  assert.equal(nextItem(items, 2), null);
  assert.equal(percentDone(items, one), 33);
  assert.equal(isComplete(items, new Set(['a', 'b', 'c'])), true);
  assert.equal(currentItem(items, new Set(['a', 'b', 'c'])), null);
});

test('every program item type the runner styles has an instruction', () => {
  for (const t of ['lesson', 'listening', 'reading', 'speaking', 'xray', 'exam', 'review']) assert.ok(INSTRUCTION[t], `no instruction for ${t}`);
});

test('the registry covers the four A sub-levels with their final tests, and the routes exist in all three places', async () => {
  const { COURSES, COURSE_LEVELS } = await import('../src/data/courses/index.js');
  assert.deepEqual(COURSE_LEVELS, ['a1.1', 'a1.2', 'a2.1', 'a2.2']);
  const tests = read('src/data/courseTests/index.js');
  for (const c of Object.values(COURSES)) {
    assert.ok(tests.includes(`slug: '${c.testSlug}'`), `${c.level} final test ${c.testSlug} is not a registered course test`);
    assert.ok(flattenCourse(c).length > 20, `${c.level} program is suspiciously short`);
    const ids = flattenCourse(c).map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length, `${c.level} has duplicate item ids`);
  }
  const app = read('src/App.jsx');
  for (const p of ['/course/:level', '/course/:level/:itemId', '/course/:level/complete', '/course/:level/certificate']) assert.ok(app.includes(`path="${p}"`), `missing route ${p}`);
  assert.ok(app.includes('<CourseReturnBar />'), 'the return bar must be mounted in the shell');
  assert.ok(read('netlify.toml').includes('from = "/course/*"'), '/course/* must be rewritten to /app.html (three-place rule)');
  assert.ok(read('astro-site/src/layouts/Layout.astro').includes("sessionStorage.getItem('dm_course_ctx')"), 'static lessons must render the return bar');
});

// ---------------------------------------------------------------------------
// Register (DaF review #4, MAJOR "PretestStage.jsx register"). One decision,
// enforced: the lesson chrome is ENGLISH by default and GERMAN in Deutsch-Modus
// (Wave 1, 2026-09-19; docs/language-strategy.md — English chrome, German
// content), and the German chrome addresses the learner as Sie; only the
// dialogue characters duzen each other — and the dialogue is curriculum DATA,
// never a string in these files, so any du-form found here is chrome by
// definition. The pretest screen showed 'Wie heißen Sie?' above a field
// placeholdered 'Schreib einfach, was du kannst.' — two Anreden, two lines
// apart, in the free first lesson. Since Wave 1 the German chrome lives in the
// `de` table of src/lib/lesson/strings.js, which is globbed in below like any
// other chrome file, so the Sie rule now guards the table instead of twenty
// scattered literals.
// ---------------------------------------------------------------------------
// MAJOR 1 (DaF review #7): a hand-enumerated list is a list of what the last
// report thought of, not of what exists — PracticeItem.jsx was never in this
// list and its "Deine Antwort" label duzed on all 84 practice screens while
// CheckpointPage.jsx said "Ihre Antwort" two files away, and nothing here ever
// read it. So this is a GLOB over both directories the player actually
// renders from, plus the one top-level page the speaking task hands off to —
// no file in scope can be omitted by forgetting to type its name.
// MAJOR 3 (DaF review #8): the course chrome lives in THREE directories, not
// two — src/components/course/ is the third, and ExamDatePlan.jsx duzed on
// four lines while every other course screen siezt. Glob it in exactly like
// the other two, and see the derived-directory guard below for what stops a
// fourth directory from going unnoticed the same way.
const CHROME_DIRS = ['src/components/lesson', 'src/components/course', 'src/components/ui'];
const CHROME_FILES = [
  ...CHROME_DIRS.flatMap((dir) => readdirSync(join(ROOT, dir)).filter((f) => f.endsWith('.jsx')).map((f) => `${dir}/${f}`)),
  // MAJOR 10 (DaF review #5, last sentence): the register test must also cover
  // the pages the player renders, not just its stage components — that is
  // exactly where CheckpointPage.jsx and ReviewPage.jsx duzed.
  ...readdirSync(join(ROOT, 'src/pages/lesson')).filter((f) => f.endsWith('.jsx')).map((f) => `src/pages/lesson/${f}`),
  'src/pages/SpeakingPage.jsx',
  // The string table IS the German chrome now (Deutsch-Modus): its `de` values
  // must sieze like the literals they replaced.
  'src/lib/lesson/strings.js',
];

// Pronouns, the du-forms of the verbs these screens use, and the du-imperatives
// that were actually there. 'Versuch' is deliberately absent: it is also the
// noun ("im ersten Versuch"), so the imperative is caught as 'Versuch es'.
const DU_TOKENS = /\b(du|Du|dir|Dir|dich|Dich|dein|Dein|deine[mnrs]?|Deine[mnrs]?|kannst|musst|hast|willst|machst|hörst|schreibst|Schreib|Tippe|Lies|Hör|Sprich|Melde|Probier|bestätige|Versuch es)\b/;

// ---------------------------------------------------------------------------
// ONE GRADER, AND THE ITEM DECIDES (DaF review #6, BLOCKER 3). Every grading
// site calls `checkAnswer(user, expected, checkOptionsFor(item))` — the four
// options (strict, caseSensitive, dictation, spelling) are properties of the
// ITEM, never arguments a screen makes up. Round 5 handed `caseSensitive`
// through by hand at each site and `dictation` was forgotten in the checkpoint,
// so the one dictation with a separator (a phone number) was `correct` in the
// lesson and `wrong` in the graded test for the same typed answer. A hand-built
// options object at any of these four sites is that bug coming back.
// ---------------------------------------------------------------------------
const GRADING_SITES = [
  'src/components/lesson/PracticeItem.jsx',
  'src/components/lesson/DictationItem.jsx',
  'src/lib/checkpoint/buildCheckpoint.js',
  'src/lib/checkpoint/reviewGrading.js',
];

test('every grading site takes its checkAnswer options from the item, not from the call site', () => {
  for (const file of GRADING_SITES) {
    const src = read(file);
    const calls = [...src.matchAll(/checkAnswer\([^;]*?\);/gs)].map((m) => m[0]);
    assert.ok(calls.length >= 1, `${file} must grade through checkAnswer`);
    for (const call of calls) {
      assert.ok(
        /checkOptionsFor\(|checkOpts/.test(call),
        `${file}: options are hand-built at a call site — ${call.replace(/\s+/g, ' ')}`,
      );
      assert.ok(
        !/\{\s*(strict|dictation|caseSensitive|spelling)\s*:/.test(call),
        `${file}: a literal option object in a checkAnswer call — ${call.replace(/\s+/g, ' ')}`,
      );
    }
    assert.match(src, /checkOptionsFor/, `${file} must import checkOptionsFor`);
  }
});

// Named exceptions only, each with the reason inline — never a gap in the
// file list above. A `du`/`Du` token here is NOT dialogue rendering (the
// curriculum data the standard's own register decision exempts): it is code
// that reads or normalises a stored register value, never a string the
// learner reads on screen. Match on the exact line text so a future edit that
// changes what the line does re-trips the test instead of riding the waiver.
const REGISTER_EXEMPT = [
  {
    file: 'src/pages/SpeakingPage.jsx',
    line: "anrede: ctx.anrede === 'du' ? 'du' : 'Sie',",
    reason: "normalises a stored anrede VALUE ('du'/'Sie') from the course context into the speaking task sent to the coach — not learner-facing chrome text.",
  },
];

test('the lesson chrome sieze: no du-register token in any screen the player renders', () => {
  const offenders = [];
  for (const f of CHROME_FILES) {
    read(f).split('\n').forEach((line, i) => {
      if (!DU_TOKENS.test(line)) return;
      const trimmed = line.trim();
      if (REGISTER_EXEMPT.some((ex) => ex.file === f && ex.line === trimmed)) return;
      offenders.push(`${f}:${i + 1}  ${trimmed}`);
    });
  }
  assert.deepEqual(offenders, [], `du-register in the lesson chrome:\n${offenders.join('\n')}`);
});

// MAJOR 3's own guard against MAJOR 1's failure mode recurring one directory
// later: don't hand-list which src/components/<dir> the player renders from —
// read the import lines of the pages that assemble the course screens and
// assert every `components/<dir>` they pull from is one of CHROME_DIRS. A
// fourth directory (or a fifth) then fails on its first import, before any
// du-form has to be found in it to notice.
const IMPORT_SCAN_FILES = [
  'src/pages/CurriculumHomePage.jsx',
  ...readdirSync(join(ROOT, 'src/pages/lesson')).filter((f) => f.endsWith('.jsx')).map((f) => `src/pages/lesson/${f}`),
];
const COMPONENT_IMPORT_RE = /from\s+['"](?:\.\.\/)+components\/([^/'"]+)\//g;

test('CHROME_DIRS covers every src/components/<dir> the course pages import from', () => {
  const importedDirs = new Set();
  for (const f of IMPORT_SCAN_FILES) {
    const src = read(f);
    for (const m of src.matchAll(COMPONENT_IMPORT_RE)) importedDirs.add(m[1]);
  }
  assert.ok(importedDirs.size > 0, 'the import scan found nothing — the regex or file list is broken');
  const globbed = new Set(CHROME_DIRS.map((d) => d.replace(/^src\/components\//, '')));
  const missing = [...importedDirs].filter((d) => !globbed.has(d));
  assert.deepEqual(missing, [], `these src/components/<dir> are imported by course pages but not globbed into CHROME_FILES: ${missing.join(', ')}`);
});

test('every REGISTER_EXEMPT line still exists verbatim (a waiver must not silently drift)', () => {
  for (const ex of REGISTER_EXEMPT) {
    const lines = read(ex.file).split('\n').map((l) => l.trim());
    assert.ok(lines.includes(ex.line), `${ex.file}: exempted line no longer present — "${ex.line}"; remove or update the waiver`);
  }
});

// ---------------------------------------------------------------------------
// DaF review #7, BLOCKER 1 (the review-card half). A SENTENCE review card's
// `accepted` is a whole dialogue line, not a bare polite word, so
// `politeCaseItem` alone never reached it — the L1 sentence card
// "Gut. Wie geht es Ihnen?" forgave `ihnen` as a typo while the lesson item
// for the identical form (`extra-a11-l01-06`) grades it wrong. Pin the fix at
// the card the review named.
// ---------------------------------------------------------------------------
test('the "Wie geht es Ihnen?" sentence card is case-sensitive and grades "ihnen" wrong, like the lesson item', async () => {
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const { buildCardIndex } = await import('../src/services/reviewService.js');
  const { sentenceCardKey } = await import('../src/lib/review/ladder.js');
  const { gradeTypedReview } = await import('../src/lib/checkpoint/reviewGrading.js');

  const index = buildCardIndex(CURRICULUM_A11);
  const key = sentenceCardKey('a1.1-l01', 6);
  const card = index.get(key);
  assert.ok(card, `card ${key} must exist in the built index`);
  assert.equal(card.front, 'Gut. Wie geht es Ihnen?');
  assert.equal(card.caseSensitive, true, 'a polite Ihnen mid-sentence must flag the card case-sensitive');

  const graded = gradeTypedReview(key, card.accepted, 'ihnen', { caseSensitive: card.caseSensitive });
  assert.equal(graded.ok, false, 'lowercase "ihnen" must grade wrong, not typo-forgiven, for this card');
  const gradedCorrect = gradeTypedReview(key, card.accepted, card.accepted[0], { caseSensitive: card.caseSensitive });
  assert.equal(gradedCorrect.ok, true, 'the card\'s own accepted form must still grade correct');
});

// ---------------------------------------------------------------------------
// The speaking task travels (DaF review #4, MAJOR "missionOrder null /
// SpeakingStage"). Four A1.1 Lektionen carry a `sprechen.open` prompt without a
// missionOrder, so no ?mission= can be handed over; without the prompt in the
// course context the learner reads a task and then lands on a generic page.
// ---------------------------------------------------------------------------
test('saveCourseContext round-trips the speaking task, and old contexts still read', async () => {
  const store = new Map();
  globalThis.sessionStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  const { saveCourseContext, readCourseContext, clearCourseContext } = await import('../src/lib/courseFlow.js');

  saveCourseContext({
    level: 'a1.1', code: 'A1.1', itemId: 'l7', title: 'Freizeit',
    returnTo: '/course/a1.1/l/7',
    openPrompt: 'Fragen und antworten Sie zum Thema Freizeit: Hobby? Musik? Wochenende?',
    openTeil: 'Sprechen Teil 2',
    hintWords: ['das Hobby', 'gern'],
  });
  const ctx = readCourseContext();
  assert.equal(ctx.openPrompt, 'Fragen und antworten Sie zum Thema Freizeit: Hobby? Musik? Wochenende?');
  assert.equal(ctx.openTeil, 'Sprechen Teil 2');
  assert.deepEqual(ctx.hintWords, ['das Hobby', 'gern']);
  assert.equal(ctx.returnTo, '/course/a1.1/l/7', 'the old fields survive');

  // Backward compatibility: a context written by the course path carries no
  // speaking task, and every reader must still get a usable object.
  clearCourseContext();
  saveCourseContext({ level: 'a1.1', code: 'A1.1', itemId: 'w1d1', title: 'Lektion 1' });
  const plain = readCourseContext();
  assert.equal(plain.openPrompt, null);
  assert.equal(plain.openTeil, null);
  assert.deepEqual(plain.hintWords, []);

  clearCourseContext();
  assert.equal(readCourseContext(), null);
  delete globalThis.sessionStorage;
});

test('SpeakingStage hands the prompt over and the speaking page uses it when no mission is set', () => {
  const stage = read('src/components/lesson/SpeakingStage.jsx');
  for (const field of ['openPrompt: open', 'openTeil: open', 'hintWords: open']) {
    assert.ok(stage.includes(field), `SpeakingStage does not save ${field}`);
  }
  const page = read('src/pages/SpeakingPage.jsx');
  assert.ok(page.includes('readCourseContext'), 'the speaking page never reads the course context');
  assert.ok(/if \(wantedMission\) return null;/.test(page), 'an explicit ?mission= must win over the course task');
  assert.ok(page.includes('courseTask.promptDe'), 'the handed-over prompt is not rendered');
});

// ---------------------------------------------------------------------------
// Walkthrough 2026-09-19: ten dialogue lines cost nine taps. The dialogue
// stage keeps line-by-line as its default and adds ONE secondary control that
// reveals the rest; the footer primary stays "Next line" / "Continue"
// (`action.nextLine` / `action.next` in the string table).
// ---------------------------------------------------------------------------
test('DialogStage reveals line by line by default and offers "Show all lines" as the secondary way out', () => {
  const src = read('src/components/lesson/DialogStage.jsx');
  assert.ok(src.includes('useState(1)'), 'the first line is shown alone by default');
  assert.ok(src.includes("primaryLabel={allShown ? t('action.next', lang) : t('action.nextLine', lang)}"), 'the primary still pages line by line');
  assert.ok(src.includes("t('action.showAllLines', lang)"), 'the reveal-all control is missing');
  assert.ok(src.includes('onClick={() => setShown(lines.length)}'), 'reveal-all must show every line, after which the primary reads Continue');
  assert.ok(src.includes('<AudioSourceBadge recorded={recorded} />'), 'the audio-source badge stays on every line');
  assert.ok(src.includes("{t(gloss ? 'dialog.glossOff' : 'dialog.glossOn', lang)}"), 'the English gloss toggle stays');
});

// ---------------------------------------------------------------------------
// Wave 1 (2026-09-19): English chrome, German content. The lesson chrome used
// to be German-only — „Schritt 4 · Üben", „Ihre Antwort", „Prüfen", „Weiter" —
// so a day-one English-speaking beginner could not read the instructions of
// the app teaching them. Every chrome label now comes from
// src/lib/lesson/strings.js: `en` by default, `de` in Deutsch-Modus.
// ---------------------------------------------------------------------------
const OWNED_CHROME_FILES = [
  ...readdirSync(join(ROOT, 'src/components/lesson')).filter((f) => f.endsWith('.jsx')).map((f) => `src/components/lesson/${f}`),
  'src/components/course/ExamDatePlan.jsx',
  'src/components/course/SaveProgressCard.jsx',
  ...readdirSync(join(ROOT, 'src/pages/lesson')).filter((f) => f.endsWith('.jsx')).map((f) => `src/pages/lesson/${f}`),
];

// The exact literals the walkthrough named. Quoted forms only ('Weiter' as a
// JS string), so a doc comment that mentions the word does not trip it, and a
// JSX text node does not hide from it: JSX text is covered by the `>Weiter<`
// form.
const BANNED_CHROME_LITERALS = ['Weiter', 'Prüfen', 'Ihre Antwort', 'Schritt ', 'Verstanden', 'Nächste Zeile', 'Antwort zeigen'];

test('STRINGS.en and STRINGS.de carry exactly the same keys and no empty value', async () => {
  const { STRINGS, t, DEFAULT_LESSON_LANG } = await import('../src/lib/lesson/strings.js');
  const en = Object.keys(STRINGS.en);
  const de = Object.keys(STRINGS.de);
  assert.deepEqual(de.filter((k) => !en.includes(k)), [], 'keys only in de');
  assert.deepEqual(en.filter((k) => !de.includes(k)), [], 'keys only in en');
  assert.ok(en.length >= 150, `the table is suspiciously small (${en.length} keys)`);
  for (const table of ['en', 'de']) {
    for (const [k, v] of Object.entries(STRINGS[table])) {
      assert.ok(typeof v === 'string' && v.trim().length > 0, `${table}.${k} is empty`);
    }
  }
  assert.equal(DEFAULT_LESSON_LANG, 'en');
  assert.equal(t('action.next'), 'Continue', 'the default is the English chrome');
  assert.equal(t('action.next', 'de'), 'Weiter');
  assert.equal(t('action.next', 'xx'), 'Continue', 'an unknown lang falls back to en');
  assert.equal(t('no.such.key', 'de'), 'no.such.key', 'a missing key shows the key, never a blank');
  assert.equal(t('stage.practice.eyebrow', 'en', { n: 3, total: 7 }), 'Step 4 · Practice 3/7');
  assert.equal(t('stage.requeue.eyebrow', 'de', { n: 1, total: 2 }), 'Schritt 7 · Noch einmal 1/2', 'the requeue has its own eyebrow');
});

test('no owned lesson chrome file carries a banned German chrome literal outside strings.js', () => {
  const offenders = [];
  for (const f of OWNED_CHROME_FILES) {
    const src = read(f);
    for (const lit of BANNED_CHROME_LITERALS) {
      const forms = [`'${lit}'`, `"${lit}"`, `>${lit}<`, `\`${lit}`];
      for (const form of forms) if (src.includes(form)) offenders.push(`${f}: ${form}`);
    }
  }
  assert.deepEqual(offenders, [], `German chrome literals outside the string table:\n${offenders.join('\n')}`);
});

test('every stage screen the player renders reads its chrome through useLessonLang', () => {
  for (const f of OWNED_CHROME_FILES) {
    if (f.endsWith('LessonPreviewPage.jsx')) continue; // dev-only redirect wrapper, no copy
    assert.match(read(f), /useLessonLang\(\)|lang\b/, `${f} renders chrome without a chrome language`);
  }
  const player = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.ok(player.includes('<LangToggle />'), 'the player header carries the Deutsch-Modus toggle');
  assert.ok(read('src/pages/lesson/CheckpointPage.jsx').includes('<LangToggle'), 'the checkpoint header carries the toggle');
  assert.ok(read('src/pages/lesson/ReviewPage.jsx').includes('<LangToggle'), 'the review header carries the toggle');
  const toggle = read('src/components/lesson/LangToggle.jsx');
  assert.ok(toggle.includes('aria-pressed={on}'), 'the toggle exposes its state');
});

// The requeue stage used to reuse PracticeItem's "Step 4 · Practice n/N"
// eyebrow AFTER "Step 6 · Writing", so the lesson appeared to go backwards.
test('the requeue stage has its own eyebrow (Step 7 · Try again)', () => {
  const player = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.ok(player.includes("eyebrowKey={stage.kind === 'requeue' ? 'stage.requeue.eyebrow' : 'stage.practice.eyebrow'}"), 'the player must pass the requeue eyebrow key');
  const item = read('src/components/lesson/PracticeItem.jsx');
  assert.ok(item.includes("eyebrowKey = 'stage.practice.eyebrow'"), 'PracticeItem defaults to the practice eyebrow');
  assert.ok(item.includes('{t(eyebrowKey, lang, { n: index + 1, total })}'), 'PracticeItem renders the eyebrow it is given');
});

// The speaking stage trap: the primary is disabled until every read-aloud line
// is self-confirmed, so a learner without a mic or the nerve only had "Back"
// and looped into the dictation. "Skip for now" advances WITHOUT confirming:
// it records nothing, so a skipped line is neither said nor correct.
test('SpeakingStage offers "Skip for now" that advances without recording a result', () => {
  const src = read('src/components/lesson/SpeakingStage.jsx');
  assert.ok(src.includes('primaryDisabled={lines.length > 0 && !allDone}'), 'the primary still waits for every line');
  assert.match(src, /secondary=\{\s*lines\.length > 0 && !allDone \? \(/, 'the skip is a secondary control, shown only while lines are unconfirmed');
  assert.match(src, /onClick=\{onDone\}[^]*?t\('speaking\.skip', lang\)/, 'the skip calls onDone directly');
  // recordResult is the ONLY writer of `results`; the skip must not call it.
  const skipBlock = src.slice(src.indexOf('secondary={'), src.indexOf('</button>', src.indexOf('secondary={')));
  assert.ok(!skipBlock.includes('recordResult'), 'skipping must not fabricate a result for the unconfirmed lines');
});

// ExplainAnswer sends the chrome language and the function answers in it —
// both variants grounded in the same rule card, `lang` validated server-side.
test('explain-answer carries lang end to end and defaults to German server-side', () => {
  const client = read('src/components/lesson/ExplainAnswer.jsx');
  assert.ok(client.includes('lang,'), 'the client must send lang');
  const fn = read('netlify/functions/explain-answer.mjs');
  assert.ok(fn.includes("const lang = LANGS.has(body.lang) ? body.lang : 'de';"), 'lang must be validated, default de');
  assert.ok(fn.includes('SYSTEM_RULES[lang]'), 'the system prompt must vary by lang');
  assert.ok(fn.includes('RULE_CARD_HEADING[lang]'), 'the rule card must ground both variants');
  assert.ok(fn.includes('EXPLAIN_DAILY_LIMIT = 40'), 'the daily cap is untouched');
  assert.ok(fn.includes('getAuthenticatedUserId(event)'), 'the auth is untouched');
});

// ---------------------------------------------------------------------------
// Wave 2 (2026-09-19): FeedbackSheet, option chips, ComboChip, StageShell
// variants — "make the lesson feel like a premium app inside the token
// rules." Fun is pace and micro-feedback, never mascots/hearts/gems.
// ---------------------------------------------------------------------------

test('FeedbackSheet renders all three result tones, each with its own icon, string-table label and token tone class (never a kasus colour)', () => {
  const src = read('src/components/lesson/FeedbackSheet.jsx');
  assert.ok(src.includes("import { Check, AlertTriangle, X, Sparkles } from 'lucide-react';"), 'each tone needs its own icon');
  for (const [state, key, tone] of [
    ['RESULT.CORRECT', 'feedback.correct', 'siegel'],
    ['RESULT.TYPO', 'feedback.typo', 'accent-aprikose'],
    ['RESULT.WRONG', 'feedback.wrong', 'accent-himbeer'],
  ]) {
    assert.ok(src.includes(`[${state}]`), `no tone entry for ${state}`);
    assert.ok(src.includes(`key: '${key}'`), `${state} does not use the ${key} string-table label`);
    assert.ok(src.includes(tone), `${state} does not use the ${tone} token`);
  }
  for (const kasus of ['kasus-nominativ', 'kasus-akkusativ', 'kasus-dativ', 'kasus-genitiv']) {
    assert.ok(!src.includes(kasus), `FeedbackSheet must never use the ${kasus} case colour (design-tokens.js rule 1)`);
  }
  // One action per screen: no dismiss control, Continue is the only button.
  assert.ok(!/aria-label=["'].*[Cc]lose/.test(src), 'FeedbackSheet must not offer a close/dismiss control');
  assert.ok(src.includes('onContinue'), 'the sheet needs a single Continue action');
  assert.ok(src.includes('animate-feedback-sheet'), 'the mobile sheet must carry its slide-up class');
  assert.ok(src.includes('motion-reduce:animate-none'), 'the slide-up must be gated for reduced motion, belt-and-suspenders with the site-wide gate');
});

test('PracticeItem and DictationItem render feedback through FeedbackSheet, not an inline card', () => {
  for (const f of ['src/components/lesson/PracticeItem.jsx', 'src/components/lesson/DictationItem.jsx']) {
    const src = read(f);
    assert.ok(src.includes("import FeedbackSheet from './FeedbackSheet.jsx';"), `${f} must import FeedbackSheet`);
    assert.ok(src.includes('<FeedbackSheet'), `${f} must render <FeedbackSheet>`);
    assert.ok(src.includes('onContinue={onNext}'), `${f} must wire Continue to onNext`);
  }
});

test('the option chips are full-width and stacked on mobile, at least 44px tall, and mark the selected option with an icon (never colour alone)', () => {
  const src = read('src/components/lesson/PracticeItem.jsx');
  assert.ok(src.includes('min-h-11'), 'option chips must be at least 44px tall');
  assert.ok(src.includes('flex-col gap-2 sm:flex-row'), 'option chips must stack full-width on mobile');
  assert.ok(src.includes('{on && <Check'), 'the selected chip must carry a check icon, not colour alone');
});

test('the primary Continue label key exists, non-empty, in both chrome tables', async () => {
  const { STRINGS } = await import('../src/lib/lesson/strings.js');
  for (const lang of ['en', 'de']) {
    assert.ok(STRINGS[lang]['action.next'] && STRINGS[lang]['action.next'].trim().length > 0, `action.next missing or empty in ${lang}`);
  }
});

// ComboChip.jsx is JSX and cannot be dynamically imported under plain
// `node --test` (no JSX loader registered — the same reason
// tests/course-home.test.mjs guards its one .jsx import with `.catch`), so
// `nextCombo` is pinned at the source line (it is a pure one-liner) and its
// behaviour is re-derived here from the same rule the comment above it
// states: extend on true, reset to zero on false — never anything else.
test('ComboChip.nextCombo: extends on a first-try correct, resets to zero on a miss', () => {
  const src = read('src/components/lesson/ComboChip.jsx');
  assert.ok(src.includes('export function nextCombo(combo, correct) {'), 'nextCombo must be an exported pure function');
  assert.ok(src.includes('return correct ? combo + 1 : 0;'), 'nextCombo must extend by one on true and hard-reset to zero on false');
  // Exercises the pinned one-liner above as a real function, not a re-implementation.
  const nextCombo = new Function('combo', 'correct', 'return correct ? combo + 1 : 0;');
  assert.equal(nextCombo(0, true), 1);
  assert.equal(nextCombo(2, true), 3);
  assert.equal(nextCombo(5, false), 0, 'a miss must reset the streak, not just fail to extend it');
  assert.equal(nextCombo(0, false), 0);
});

test('ComboChip shows only at 3+ in a row and never renders XP/hearts/gems copy', () => {
  const src = read('src/components/lesson/ComboChip.jsx');
  assert.ok(src.includes('if (combo < 3) return null;'), 'the chip must stay hidden below a 3-streak');
  assert.ok(src.includes("t('combo.streak', lang, { n: combo })"), 'the chip must render through the string table');
  // A design comment is allowed to SAY "no XP" (this file has one); the
  // banned form is XP awarded as a game score, e.g. `+{xp}` or `xp:`.
  assert.ok(!/[+{]\s*xp\b|\bxp\s*[:=]/i.test(src), 'ComboChip must not introduce an XP score');
  for (const banned of ['gem', 'heart', 'coin']) {
    assert.ok(!new RegExp(banned, 'i').test(src), `ComboChip must not introduce ${banned}-style game currency`);
  }
  // Sound is opt-in: default OFF, never plays without a prior unmute.
  assert.ok(src.includes("safeGet(SOUND_KEY) !== 'on'"), 'sound must default to muted');
});

test('LessonPlayerPage updates the combo through nextCombo and shows <ComboChip> beside the progress bar', () => {
  const src = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.ok(src.includes("import ComboChip, { nextCombo } from '../../components/lesson/ComboChip.jsx';"), 'the player must import ComboChip and nextCombo');
  assert.ok(src.includes('setCombo((c) => nextCombo(c, correct))'), 'the combo must be updated through the pure helper, not re-derived inline');
  assert.ok(src.includes('<ComboChip combo={combo} />'), 'the chip must be rendered in the player header');
});

test('StageShell accepts a variant prop that only changes the background wash, via existing token classes', () => {
  const src = read('src/components/lesson/StageShell.jsx');
  assert.ok(src.includes('variant = null'), 'variant must default to null so unmigrated callers keep today\'s look');
  for (const [name, cls] of [['input', 'bg-siegel-wash'], ['speaking', 'bg-siegel-wash'], ['recap', 'bg-paper-sunk']]) {
    assert.ok(src.includes(`${name}: '${cls}'`), `variant "${name}" must map to the token class ${cls}`);
  }
  for (const kasus of ['kasus-nominativ', 'kasus-akkusativ', 'kasus-dativ', 'kasus-genitiv']) {
    assert.ok(!src.includes(kasus), `StageShell variants must never use the ${kasus} case colour`);
  }
});

// ---------------------------------------------------------------------------
// Phonetik stage (stage 3, shared with notice) and the shared ReviewCard.
// ---------------------------------------------------------------------------

test('PhonetikStage plays through speech.js, splits syllables on the capitalised stress, and reads its strings from the table', () => {
  const src = read('src/components/lesson/PhonetikStage.jsx');
  assert.match(src, /playLine\(lektionId, `phonetik-\$\{i\}`, phonetikSpeechText\(item\)\)/, 'the play button must speak the normalised text through the recorded/fallback path, keyed phonetik-<i>');
  assert.ok(src.includes("import { playLine, phonetikSpeechText } from '../../lib/lesson/speech.js';"), 'phonetikSpeechText must be imported from speech.js, not re-implemented here');
  assert.match(src, /part === part\.toUpperCase\(\)/, 'the stressed syllable must be found by its own capitalisation, not a hand-picked index');
  assert.ok(src.includes('<strong'), 'the stressed syllable must render as <strong>');
  for (const key of ["t('stage.phonetik.eyebrow', lang)", "t('stage.phonetik.title', lang)", "t('phonetik.listenFor', lang)", "t('phonetik.sayAfter', lang)", "t('phonetik.said', lang)"]) {
    assert.ok(src.includes(key), `PhonetikStage must read "${key}" from the string table rather than a literal`);
  }
});

test('the phonetik string keys exist, non-empty, in both chrome tables', () => {
  const src = read('src/lib/lesson/strings.js');
  for (const key of ['stage.phonetik.eyebrow', 'stage.phonetik.title', 'phonetik.listenFor', 'phonetik.sayAfter', 'phonetik.said']) {
    const matches = [...src.matchAll(new RegExp(`'${key}':\\s*'([^']*)'`, 'g'))];
    assert.equal(matches.length, 2, `"${key}" must appear exactly once in each of the en/de tables`);
    for (const m of matches) assert.ok(m[1].trim().length > 0, `"${key}" must not be empty`);
  }
});

test('buildLesson inserts the phonetik stage right after notice, sharing its stage number', () => {
  const src = read('src/lib/lesson/buildLesson.js');
  const noticeAt = src.indexOf("key: 'notice'");
  const phonetikAt = src.indexOf("key: 'phonetik'");
  assert.ok(noticeAt >= 0 && phonetikAt >= 0 && phonetikAt > noticeAt, 'the phonetik stage must be pushed after the notice stage');
  assert.ok(src.includes("nr: 3, key: 'phonetik'"), 'the phonetik stage must share stage number 3 with notice');
});

test('LessonPlayerPage renders the phonetik stage with PhonetikStage', () => {
  const src = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.ok(src.includes("import PhonetikStage from '../../components/lesson/PhonetikStage.jsx';"), 'the player must import PhonetikStage');
  assert.match(src, /case 'phonetik':\s*\n\s*body = <PhonetikStage/, "the stage switch must render PhonetikStage for kind 'phonetik'");
});

test('ReviewCard is the one per-mode card renderer, used by both ReviewPage and the lesson player\'s warm-up', () => {
  const card = read('src/components/lesson/ReviewCard.jsx');
  assert.ok(card.includes('export const MODES_BY_KIND'), 'ReviewCard must export the mode table');
  assert.ok(card.includes('export const modeForCard'), 'ReviewCard must export the pure mode-selection helper');
  assert.ok(card.includes("export default function ReviewCard("), 'ReviewCard must be the default export');

  const reviewPage = read('src/pages/lesson/ReviewPage.jsx');
  assert.ok(reviewPage.includes("import ReviewCard, { modeForCard } from '../../components/lesson/ReviewCard.jsx';"), 'ReviewPage must import ReviewCard and modeForCard');
  assert.ok(reviewPage.includes('<ReviewCard'), 'ReviewPage must render <ReviewCard>');
  assert.ok(!reviewPage.includes('MODES_BY_KIND ='), 'ReviewPage must not keep its own copy of the mode table');

  const player = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.ok(player.includes("import ReviewCard, { modeForCard } from '../../components/lesson/ReviewCard.jsx';"), 'the player must import ReviewCard and modeForCard');
  assert.ok(player.includes('<ReviewCard'), 'the player\'s warm-up must render <ReviewCard>');
});

test('the player\'s warm-up grades through gradeCard and gradeTypedReview, the same helpers ReviewPage uses', () => {
  const player = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.ok(player.includes("import { gradeCard } from '../../services/reviewService.js';"), 'the player must import gradeCard from the review service');
  assert.ok(player.includes("import { gradeTypedReview } from '../../lib/checkpoint/reviewGrading.js';"), 'the player must import gradeTypedReview');
  assert.match(player, /gradeCard\(user\.id, warmupCard\.cardKey, correct\)/, 'a graded warm-up card must write through gradeCard, keyed by its card_key');
  assert.match(player, /gradeTypedReview\(warmupCard\.cardKey, warmupCard\.accepted, warmupTyped/, 'a typed warm-up card must grade through gradeTypedReview, not a hand-rolled comparison');
});
