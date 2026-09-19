// Guard suite for the course-home orientation layer (Wave 1, 2026-09-19):
// the chapter banners, the welcome screen, the first-run tour anchors, the
// endowed-progress rule, the Lektion intro screen and the placement hook.
//
// Source-level pins, deliberately: these are wiring facts (the page imports
// the meta module, the anchors exist, the player mounts the intro) that a
// render test would need a DOM and Supabase mocks to reach, and that a lint
// pass cannot see. Every pin names the file and the line it expects, so a
// refactor that drops one fails with the reason, not with a blank screen.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { A11_META } from '../src/data/curricula/a11.meta.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { LEVEL_ORDER } from '../src/config/levels.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const HOME = 'src/pages/CurriculumHomePage.jsx';
const PLAYER = 'src/pages/lesson/LessonPlayerPage.jsx';
const INTRO = 'src/components/lesson/IntroStage.jsx';
const RESULTS = 'src/components/LevelTest/LevelTestResults.jsx';

// ---------------------------------------------------------------------------
// 1. The course home reads the meta module and mounts the orientation pieces
// ---------------------------------------------------------------------------

test('CurriculumHomePage imports A11_META, CourseWelcome and FirstRunTour', () => {
  const src = read(HOME);
  assert.match(src, /import \{ A11_META \} from '\.\.\/data\/curricula\/a11\.meta\.js'/, 'the page must read the meta module');
  assert.match(src, /import CourseWelcome from '\.\.\/components\/course\/CourseWelcome\.jsx'/);
  assert.match(src, /import FirstRunTour from '\.\.\/components\/course\/FirstRunTour\.jsx'/);
  assert.match(src, /<CourseWelcome curriculum=\{curriculum\} meta=\{meta\}/, 'CourseWelcome must be rendered with the curriculum and its meta');
  assert.match(src, /<FirstRunTour curriculum=\{curriculum\} meta=\{meta\}/, 'FirstRunTour must be rendered with the curriculum and its meta');
});

test('the welcome shows while nothing is finished, and otherwise behind an aria-expanded toggle', () => {
  const src = read(HOME);
  assert.match(src, /const fresh = loaded && doneCount === 0;/, 'fresh = nothing finished (after load, so a signed-in user never sees a flash)');
  assert.match(src, /const welcomeOpen = fresh \|\| showWelcome;/);
  assert.match(src, /aria-expanded=\{showWelcome\}/, 'the header toggle must announce its state');
  assert.match(src, /How this course works/, 'the header toggle copy');
});

test('chapter banners render the chapter titleEn, the German title as a small line, and the story', () => {
  const src = read(HOME);
  assert.match(src, /meta\.chapters\[ci\]/, 'chapters are looked up by index in A11_META.chapters');
  assert.match(src, /chapterMeta\?\.titleEn/, 'the banner heading is the English chapter title');
  assert.match(src, /chapterMeta\.titleDe/, 'the German chapter title is kept as a small line');
  assert.match(src, /chapterMeta\.storyEn/, 'the one-line story is rendered');
  // The old heading is only the fallback for a level without a meta module.
  assert.match(src, /\?\? `Lektion \$\{lektionen\[0\]\?\.nr\}–/, 'the "Lektion 1–3" label survives only as the fallback');
});

test('the three tour anchors are on the path, the continue card and the plan', () => {
  const src = read(HOME);
  for (const target of ['path', 'continue', 'plan']) {
    assert.ok(src.includes(`data-tour="${target}"`), `missing data-tour="${target}"`);
  }
  // And the tour's default steps point at exactly those three.
  const tour = read('src/components/course/FirstRunTour.jsx');
  for (const target of ['path', 'continue', 'plan']) assert.ok(tour.includes(`target: '${target}'`), `FirstRunTour has no step for ${target}`);
});

// ---------------------------------------------------------------------------
// 2. Endowed progress
// ---------------------------------------------------------------------------

test('the unlock rule carries an endowed clause, and endowed never marks a node done', () => {
  const src = read(HOME);
  assert.match(
    src,
    /const unlocked = \(!user \|\| loaded\) && \(endowed \|\| node\.index === 0 \|\| done\.has\(path\[node\.index - 1\]\.id\)\);/,
    'unlocked must be: loaded && (endowed || first || previous done)',
  );
  assert.match(src, /placedAbove\(profile\?\.current_level, level\)/, 'endowed reads the placement from the profile');
  assert.match(src, /searchParams\.get\('from'\) === 'placement'/, 'and from the results page hand-off');
  // `done` is only ever set from the ledger / local store — never widened by the endowed flag.
  const setDoneCalls = [...src.matchAll(/setDone\(([^)]*)\)/g)].map((m) => m[1]);
  assert.ok(setDoneCalls.length >= 2, 'setDone call sites not found');
  for (const arg of setDoneCalls) assert.doesNotMatch(arg, /endowed|path/, `setDone must not be driven by endowed: setDone(${arg})`);
});

test('placedAbove compares on the level ladder in either case and never promises a level', async () => {
  const { placedAbove } = await import('../src/pages/CurriculumHomePage.jsx').catch(() => ({}));
  if (placedAbove) {
    assert.equal(placedAbove('A2.1', 'a1.1'), true);
    assert.equal(placedAbove('a1.2', 'a1.1'), true);
    assert.equal(placedAbove('A1.1', 'a1.1'), false);
    assert.equal(placedAbove(null, 'a1.1'), false);
    assert.equal(placedAbove('nonsense', 'a1.1'), false);
  }
  // Whether or not the JSX module can load under node, the rule text is pinned.
  const src = read(HOME);
  assert.match(src, /LEVEL_ORDER\.indexOf\(String\(placed \|\| ''\)\.toUpperCase\(\)\)/, 'DB level is UPPERCASE; normalise before comparing');
  assert.ok(LEVEL_ORDER[0] === 'A1.1', 'the ladder starts at A1.1');
  assert.match(src, /Your test suggests a level above/, 'the endowed label says "your test suggests"');
  assert.doesNotMatch(src, /you will pass|guaranteed|you are (now )?[AB][12]\.[12]/i, 'no pass or level promise');
});

test('the footer tells a signed-out visitor where their progress lives', () => {
  const src = read(HOME);
  assert.match(src, /Your progress saves on this device until you sign in\./);
  assert.match(src, /user \? ' On any device\.' : ' Your progress saves on this device until you sign in\.'/, 'the sentence is conditional on `user`');
});

// ---------------------------------------------------------------------------
// 3. The Lektion intro screen
// ---------------------------------------------------------------------------

test('IntroStage exists, the player imports it, and it is player state that preview skips', () => {
  const intro = read(INTRO);
  assert.match(intro, /export default function IntroStage/);
  assert.match(intro, /meta\.characters\.filter\(\(c\) => c\.appearsIn\.includes\(lektion\.nr\)\)/, 'the cast is filtered by appearsIn');
  assert.match(intro, /data-avatar-slot=\{c\.name\}/, 'initial circles carry the avatar slot for Wave 2 art');
  assert.match(intro, /intro\.canDoEn/, 'the "by the end you can" list comes from lektionIntro.canDoEn');
  assert.match(intro, /intro\.situationEn/, 'the situation line comes from lektionIntro.situationEn');
  assert.match(intro, /lektion\.minutes/, 'minutes are read off the Lektion, never typed');
  assert.match(intro, /useLessonLang\(\)/, 'the intro follows the chrome-language toggle');

  const player = read(PLAYER);
  assert.match(player, /import IntroStage from '\.\.\/\.\.\/components\/lesson\/IntroStage\.jsx'/);
  assert.match(player, /const \[introDone, setIntroDone\] = useState\(preview\);/, 'introDone is player state, default false, true in preview');
  assert.match(player, /if \(!introDone\) \{\s*return <IntroStage/, 'the intro renders before stage 0');
  assert.doesNotMatch(read('src/lib/lesson/buildLesson.js'), /kind: 'intro'/, 'the intro must NOT be a buildLesson stage');
});

test('Start fires lesson_started and the recap write fires lesson_completed', () => {
  const player = read(PLAYER);
  assert.match(player, /import \{ trackLessonCompleted, trackLessonStarted \} from '\.\.\/\.\.\/lib\/funnelTracking\.js'/);
  assert.match(player, /onStart=\{\(\) => \{ trackLessonStarted\(curriculum\.level, lektion\.id\); setIntroDone\(true\); \}\}/);
  assert.match(player, /setSaved\(true\);\s*trackLessonCompleted\(curriculum\.level, lektion\.id\);/, 'completed is tracked exactly where the lesson is persisted');
  const funnel = read('src/lib/funnelTracking.js');
  assert.match(funnel, /export const trackLessonStarted = \(level, topic\) => track\('lesson_started'/);
  assert.match(funnel, /export const trackLessonCompleted = \(level, topic\) => track\('lesson_completed'/);
});

test('the intro string table is complete in both languages and the German is Sie', () => {
  const src = read(INTRO);
  const en = [...src.matchAll(/'(intro\.[a-zA-Z]+)':/g)].map((m) => m[1]);
  const keys = [...new Set(en)];
  assert.ok(keys.length >= 6, 'the intro table is suspiciously small');
  for (const k of keys) assert.equal(en.filter((x) => x === k).length, 2, `${k} must appear in both the en and de tables`);
  assert.doesNotMatch(src, /\b(du|dich|dir|dein|deine[mnrs]?|kannst|hast)\b/, 'German chrome must be Sie');
});

test('every A1.1 Lektion has a cast, a chapter and an intro to render', () => {
  for (const l of CURRICULUM_A11.lektionen) {
    assert.ok(A11_META.characters.some((c) => c.appearsIn.includes(l.nr)), `Lektion ${l.nr} has nobody in its cast strip`);
    assert.equal(A11_META.chapters.filter((c) => c.lektionen.includes(l.nr)).length, 1, `Lektion ${l.nr} must sit in exactly one chapter`);
    assert.ok(A11_META.lektionIntro[l.id], `Lektion ${l.nr} has no intro`);
  }
});

// ---------------------------------------------------------------------------
// 4. The placement hook
// ---------------------------------------------------------------------------

test('LevelTestResults links the A1.1 course: Lektion 1 for an A1.1 result, unlocked for anything higher', () => {
  const src = read(RESULTS);
  assert.match(src, /const placedAtStart = finalSublevel === 'A1\.1';/);
  assert.match(src, /placedAtStart \? '\/course\/a1\.1' : '\/course\/a1\.1\?from=placement'/, 'the two hrefs');
  assert.match(src, /Start your course at Lektion 1/);
  assert.match(src, /Open the A1\.1 course \(all Lektionen unlocked for you\)/);
  assert.match(src, /to=\{courseHref\}/, 'the CTA is a client-side Link (no trailing slash — case 3 SPA route)');
  assert.doesNotMatch(src, /\/course\/a1\.1\//, 'SPA course routes carry no trailing slash');
  assert.doesNotMatch(src, /you will pass|guaranteed to/i, 'no pass promise');
});
