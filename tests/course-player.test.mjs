// Guard suite for the guided course player (decision 2026-09-08: a course is a
// separate identity — enrol, lesson 1 → …, final test, completion). Pins the
// pure sequencing (src/lib/courseFlow.js), the registry, and the three-place
// route rule for /course/*.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
const CHROME_FILES = [
  'src/components/lesson/PretestStage.jsx',
  'src/components/lesson/WortfeldStage.jsx',
  'src/components/lesson/ReadAloudLine.jsx',
  'src/components/lesson/GradedWriting.jsx',
  'src/components/lesson/SpeakingStage.jsx',
  'src/components/lesson/DialogStage.jsx',
  'src/components/lesson/DictationItem.jsx',
  'src/components/lesson/ExplainAnswer.jsx',
  'src/components/lesson/NoticeStage.jsx',
  'src/components/lesson/RecapStage.jsx',
  'src/components/lesson/StageShell.jsx',
  'src/components/lesson/WritingStage.jsx',
  'src/components/lesson/LessonProgressBar.jsx',
];

// Pronouns, the du-forms of the verbs these screens use, and the du-imperatives
// that were actually there. 'Versuch' is deliberately absent: it is also the
// noun ("im ersten Versuch"), so the imperative is caught as 'Versuch es'.
const DU_TOKENS = /\b(du|Du|dir|Dir|dich|Dich|dein|Dein|deine[mnrs]?|Deine[mnrs]?|kannst|musst|hast|willst|machst|hörst|schreibst|Schreib|Tippe|Lies|Hör|Sprich|Melde|Probier|bestätige|Versuch es)\b/;

test('the lesson chrome sieze: no du-register token in any screen the player renders', () => {
  const offenders = [];
  for (const f of CHROME_FILES) {
    read(f).split('\n').forEach((line, i) => {
      if (DU_TOKENS.test(line)) offenders.push(`${f}:${i + 1}  ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [], `du-register in the lesson chrome:\n${offenders.join('\n')}`);
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
