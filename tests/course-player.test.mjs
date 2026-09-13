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
// enforced: the lesson chrome addresses the learner as Sie; only the dialogue
// characters duzen each other — and the dialogue is curriculum DATA, never a
// string in these files, so any du-form found here is chrome by definition.
// The pretest screen showed 'Wie heißen Sie?' above a field placeholdered
// 'Schreib einfach, was du kannst.' — two Anreden, two lines apart, in the free
// first lesson.
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
