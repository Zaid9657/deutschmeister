// Guard suite for the first-lesson path (work order #6, docs/SCORECARD.md §3).
//
// Measured on the September 2026 cohort: 95 confirmed, 84 onboarded, 15 ever
// touched a lesson. The onboarding's primary button was a 15–20 minute test,
// its "first lesson" button sent exam-B1 pickers to a B1.1 grammar page, the
// dashboard offered four primary buttons, and the confirmation link landed a
// signed-in learner on a password form. This suite pins the fix:
//
//   1. firstRunAction (src/lib/firstRun.js) — the ONE decision: no lesson
//      activity → Lektion 1 of the free course, or the placement test for a
//      learner who said they know some German, or the placed level's guided
//      course (its grammar only where no course exists); the chosen exam's
//      first task until exam work exists; unknown activity is never first-run;
//      hasLevelAccess decides.
//   2. lessonActivityFrom (dashboardStats) — the scorecard's own definition
//      (any user_grammar_progress OR lesson_progress row), fail-safe on errors;
//      examActivityFrom (examActivity.js) — the same shape for exam work.
//   3. The hrefs are real: Lektion 1 exists in a live FREE curriculum, the
//      routes exist in App.jsx and netlify.toml, the trailing-slash classes hold.
//   4. The wiring: each onboarding exit lands where its label says, the
//      dashboard renders the card in the hero slot, /login forwards a signed-in
//      visitor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  firstRunAction,
  placedSublevel,
  placedCourseHref,
  onboardingExitPath,
  FIRST_LESSON_HREF,
  PLACEMENT_HREF,
  LEKTION_COURSE_LEVELS,
  STARTING_POINTS,
  STARTING_POINT_KEY,
} from '../src/lib/firstRun.js';
import { lessonActivityFrom } from '../src/services/dashboardStats.js';
import { examActivityFrom } from '../src/services/examActivity.js';
import { FREE_COURSE_LEVEL, FREE_COURSE_HOME } from '../src/lib/courseEntry.js';
import { isLevelFree } from '../src/config/freeTier.js';
import { curriculumFor, CURRICULA } from '../src/data/curricula/index.js';
import { COURSE_LEVELS } from '../src/data/courses/levels.js';
import { getTopicsForLevel } from '../src/data/grammarTopics.js';
import { EXAM_TRACKS } from '../src/data/examTracks.js';
import { writingTasksForExam } from '../src/data/writingTasks.js';
import { resolveModelltest } from '../src/data/modelltest.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const everything = () => true;
const freeOnly = (level) => isLevelFree(level);

const EXAM_TARGETS = {
  goethe_a1: '/schreiben/start-deutsch-1?task=formular-hotel-anmeldung',
  goethe_a2: '/schreiben/goethe-a2?task=sms-einladung-absagen',
  telc_b1: '/schreiben/telc-b1?task=beschwerde-lieferung',
  goethe_b1: '/modelltest/goethe-b1',
  dtz: '/modelltest/dtz',
  telc_b2: '/schreiben/telc-b2?task=beschwerde-kurs',
};

for (const track of EXAM_TRACKS) {
  test(`exam-first: ${track.key} opens its existing first task with the original path as alternative`, () => {
    for (const prefs of [
      {},
      { startingPoint: STARTING_POINTS.SOME },
      { currentLevel: 'B1.1' },
    ]) {
      const args = { hasLessonActivity: false, hasLevelAccess: everything, ...prefs };
      const { alternative: _alternative, ...original } = firstRunAction(args);
      const action = firstRunAction({ ...args, examTrack: track.key });
      assert.equal(action.href, EXAM_TARGETS[track.key]);
      assert.equal(action.fullLoad, false);
      assert.deepEqual(action.alternative, original);
    }
    const url = new URL(EXAM_TARGETS[track.key], 'https://example.test');
    assert.doesNotMatch(url.pathname, /\/$/, 'ordinary SPA routes have no trailing slash');
    const writing = writingTasksForExam(track.key)[0];
    if (writing) {
      assert.equal(url.searchParams.get('task'), writing.taskKey);
      assert.ok(read('src/App.jsx').includes('path="/schreiben/:examSlug"'));
      assert.match(read('netlify.toml'), /from = "\/schreiben\/\*"\s*\n\s*to = "\/app\.html"/);
    } else {
      assert.match(resolveModelltest(track.slug).mock.title, /Kurzversion/);
      assert.ok(read('src/App.jsx').includes('path="/modelltest/:examSlug"'));
      assert.match(read('netlify.toml'), /from = "\/modelltest\/\*"\s*\n\s*to = "\/app\.html"/);
    }
  });
}

test('unknown, empty and explicit no-exam choices preserve the complete original decision', () => {
  for (const examTrack of [undefined, null, '', 'none', 'unknown', 'TELC_B1']) {
    for (const prefs of [{}, { startingPoint: 'some' }, { currentLevel: 'B1.1' }]) {
      for (const hasLevelAccess of [freeOnly, everything, () => false]) {
        const args = { hasLessonActivity: false, hasLevelAccess, ...prefs };
        assert.deepEqual(firstRunAction({ ...args, examTrack }), firstRunAction(args));
      }
    }
  }
});

test('exam choice never replaces existing or unknown lesson activity', () => {
  for (const examTrack of Object.keys(EXAM_TARGETS)) {
    for (const hasLessonActivity of [true, null, undefined]) {
      assert.equal(firstRunAction({ hasLessonActivity, examTrack, hasLevelAccess: everything }), null);
    }
  }
});

test('exam tasks use the top-sublevel access gate; otherwise keep the original free path', () => {
  for (const examTrack of Object.keys(EXAM_TARGETS)) {
    for (const hasLevelAccess of [undefined, freeOnly, () => false]) {
      for (const prefs of [{}, { startingPoint: 'some' }, { currentLevel: 'B1.1' }]) {
        const args = { hasLessonActivity: false, hasLevelAccess, ...prefs };
        assert.deepEqual(firstRunAction({ ...args, examTrack }), firstRunAction(args));
      }
    }
    const track = EXAM_TRACKS.find((t) => t.key === examTrack);
    const gateLevel = resolveModelltest(track.slug).gateLevel;
    const action = firstRunAction({ hasLessonActivity: false, examTrack, hasLevelAccess: (level) => level === gateLevel || freeOnly(level) });
    assert.equal(action.href, EXAM_TARGETS[examTrack], 'the matching level access opens the exam task');
  }
});

// C-132/C-150: an exam pick used to send "I'm new to German — start Lektion 1"
// and "find my level" to a B1/B2 writing task. Each exit goes where its label
// says; the exam's first task waits on the dashboard card (tests above).
test('onboarding exits go where their labels say, whatever exam was picked', () => {
  for (const examTrack of [...Object.keys(EXAM_TARGETS), 'none', null, undefined]) {
    for (const hasLevelAccess of [everything, freeOnly, undefined]) {
      for (const currentLevel of [undefined, 'a1', 'B1.1']) {
        const prefs = { examTrack, currentLevel, hasLevelAccess };
        assert.equal(onboardingExitPath('first-lesson', prefs), FIRST_LESSON_HREF, `${examTrack}: start Lektion 1`);
        assert.equal(onboardingExitPath('level-test', prefs), '/level-test', `${examTrack}: find my level`);
        assert.equal(onboardingExitPath('dashboard', prefs), '/dashboard');
      }
    }
  }
  // The exam task is still the dashboard's first-run action for the same learner.
  assert.equal(firstRunAction({ hasLessonActivity: false, examTrack: 'telc_b1', hasLevelAccess: everything }).href, EXAM_TARGETS.telc_b1);
});

// C-149: the exam-first card offered the same task on every visit after the
// letter was written — that work writes no lesson row.
test('exam work retires the exam-first card: the course decision takes over', () => {
  for (const examTrack of Object.keys(EXAM_TARGETS)) {
    for (const prefs of [{}, { startingPoint: 'some' }, { currentLevel: 'B1.1' }, { currentLevel: 'A1.2' }]) {
      const args = { hasLessonActivity: false, hasLevelAccess: everything, ...prefs };
      assert.deepEqual(firstRunAction({ ...args, examTrack, examActivity: true }), firstRunAction(args), `${examTrack} ${JSON.stringify(prefs)}`);
      for (const examActivity of [false, null, undefined]) {
        assert.equal(firstRunAction({ ...args, examTrack, examActivity }).href, EXAM_TARGETS[examTrack], 'no (or unknown) exam work: the task stays');
      }
    }
    assert.equal(firstRunAction({ hasLessonActivity: true, examTrack, examActivity: true, hasLevelAccess: everything }), null);
  }
});

test('examActivityFrom: any writing submission OR completed exam is exam work; a failed read is unknown', () => {
  const rows = (n) => ({ data: Array.from({ length: n }, () => ({ id: 'x' })), error: null });
  const failed = { data: null, error: { message: 'boom' } };
  assert.equal(examActivityFrom(rows(0), rows(0)), false);
  assert.equal(examActivityFrom(rows(1), rows(0)), true);
  assert.equal(examActivityFrom(rows(0), rows(1)), true);
  assert.equal(examActivityFrom(failed, rows(1)), true);
  assert.equal(examActivityFrom(failed, rows(0)), null);
  assert.equal(examActivityFrom(rows(0), failed), null);
  assert.equal(examActivityFrom(undefined, rows(0)), null);
  const svc = read('src/services/examActivity.js');
  assert.match(svc, /from\('writing_submissions'\)\.select\('id'\)\.eq\('user_id', userId\)\.limit\(1\)/);
  assert.match(svc, /from\('exam_attempts'\)\.select\('id'\)\.eq\('user_id', userId\)\.eq\('status', 'completed'\)\.limit\(1\)/);
});

test('the dashboard reads exam work before it decides, and only while an exam is chosen', () => {
  const dash = read('src/pages/DashboardPage.jsx');
  assert.match(dash, /import \{ fetchExamActivity \} from '\.\.\/services\/examActivity';/);
  assert.match(dash, /const examActivityFor = user && examTrack \? `\$\{user\.id\}:\$\{examTrack\.key\}` : null;/);
  assert.match(dash, /fetchExamActivity\(user\.id\)\.then\(/);
  assert.match(dash, /const loading = progressLoading \|\| statsLoading \|\| examActivityLoading;/, 'the card never flashes the task it retires');
  assert.match(dash, /examActivity,\n\s*hasLevelAccess,\n/);
  assert.doesNotMatch(read('src/services/dashboardStats.js'), /examActivity/, 'dashboardStats stays as it was (another batch owns it)');
});

// ── 1. the decision ──────────────────────────────────────────────────────────

test('any lesson activity, or unknown activity, is never first-run', () => {
  for (const hasLessonActivity of [true, null, undefined]) {
    assert.equal(firstRunAction({ hasLessonActivity }), null, String(hasLessonActivity));
    assert.equal(firstRunAction({ hasLessonActivity, startingPoint: 'some', currentLevel: 'B1.1', hasLevelAccess: everything }), null);
  }
  assert.equal(firstRunAction(), null, 'no arguments = unknown = not first-run');
});

test('a new learner with no statement and no placement starts Lektion 1; the test is the alternative', () => {
  for (const startingPoint of [undefined, null, STARTING_POINTS.NEW, 'garbage']) {
    const a = firstRunAction({ hasLessonActivity: false, startingPoint, currentLevel: 'a1', hasLevelAccess: freeOnly });
    assert.equal(a.kind, 'lesson');
    assert.equal(a.href, FIRST_LESSON_HREF);
    assert.equal(a.fullLoad, false, 'the lesson player is an SPA route');
    assert.deepEqual(a.alternative, { kind: 'placement', href: PLACEMENT_HREF, fullLoad: false });
  }
});

test('"I know some German" and not yet placed → the placement test; Lektion 1 is the alternative', () => {
  const a = firstRunAction({ hasLessonActivity: false, startingPoint: STARTING_POINTS.SOME, currentLevel: 'a1', hasLevelAccess: freeOnly });
  assert.equal(a.kind, 'placement');
  assert.equal(a.href, PLACEMENT_HREF);
  assert.equal(a.alternative.kind, 'lesson');
  assert.equal(a.alternative.href, FIRST_LESSON_HREF);
});

test('placed at the free level → Lektion 1, whatever they said before the test', () => {
  for (const currentLevel of ['A1.1', 'a1.1']) {
    const a = firstRunAction({ hasLessonActivity: false, startingPoint: STARTING_POINTS.SOME, currentLevel, hasLevelAccess: freeOnly });
    assert.equal(a.kind, 'lesson', currentLevel);
    assert.equal(a.href, FIRST_LESSON_HREF);
    assert.equal(a.alternative, null, 'the test is done — do not offer it again');
  }
});

test('placed above the free level with access, at a level with no course yet → its first grammar lesson (full load, slash)', () => {
  for (const level of ['B1.1', 'B1.2', 'B2.1', 'B2.2']) {
    const a = firstRunAction({ hasLessonActivity: false, currentLevel: level, hasLevelAccess: everything });
    const lower = level.toLowerCase();
    const first = getTopicsForLevel(lower)[0];
    assert.equal(a.kind, 'placed');
    assert.equal(a.level, lower, 'UPPERCASE DB level normalised to the URL form');
    assert.equal(a.href, `/grammar/${lower}/${first.slug}/`);
    assert.equal(a.fullLoad, true, 'grammar is Astro-served — an <a>, never a router Link');
    assert.match(a.href, /\/$/, 'Astro pages end in a slash (trailing-slash case 1)');
    assert.equal(placedCourseHref(level), null, `${level} has no guided course`);
  }
});

// C-134/C-151: an A1.2–A2.2 placement was sent to the grammar library by slug,
// while the hero, the Kurs tab and the navbar opened the level's course.
test('placed at a level with a guided course → that course: Lektion 1 of a live rebuilt course, else its home', () => {
  const expected = { 'A1.2': '/course/a1.2/l/1', 'A2.1': '/course/a2.1', 'A2.2': '/course/a2.2' };
  for (const [level, href] of Object.entries(expected)) {
    const a = firstRunAction({ hasLessonActivity: false, currentLevel: level, hasLevelAccess: everything });
    assert.equal(a.kind, 'placed', level);
    assert.equal(a.level, level.toLowerCase());
    assert.equal(a.href, href);
    assert.equal(a.fullLoad, false, 'the course player is an SPA route');
    assert.doesNotMatch(a.href, /\/$/, 'a plain SPA route has no trailing slash (case 3)');
    assert.equal(a.topic, undefined, 'no grammar slug');
    assert.equal(placedCourseHref(level), href);
  }
  // The routes exist, and the rule matches the registries it mirrors.
  assert.ok(read('src/App.jsx').includes('path="/course/:level"'));
  assert.ok(read('src/App.jsx').includes('path="/course/:level/l/:nr"'));
  assert.deepEqual([...LEKTION_COURSE_LEVELS].sort(), Object.keys(CURRICULA).sort(), 'LEKTION_COURSE_LEVELS mirrors the LIVE curricula');
  for (const level of COURSE_LEVELS) {
    assert.equal(placedCourseHref(level), level === FREE_COURSE_LEVEL ? FIRST_LESSON_HREF : curriculumFor(level) ? `/course/${level}/l/1` : `/course/${level}`);
  }
  assert.doesNotMatch(read('src/lib/firstRun.js'), /from '\.\.\/data\/curricula/, 'firstRun rides in the entry chunk: no curriculum import');
});

// C-169: a placed learner had no way back to the free course on the card.
test('a placed learner keeps Lektion 1 of the free course as the alternative, when it opens', () => {
  for (const level of ['A1.2', 'A2.1', 'B1.1', 'B2.2']) {
    const a = firstRunAction({ hasLessonActivity: false, currentLevel: level, hasLevelAccess: everything });
    assert.deepEqual(a.alternative, { kind: 'lesson', level: FREE_COURSE_LEVEL, href: FIRST_LESSON_HREF, fullLoad: false }, level);
  }
  const freeClosed = firstRunAction({ hasLessonActivity: false, currentLevel: 'B1.1', hasLevelAccess: (l) => l === 'b1.1' });
  assert.equal(freeClosed.kind, 'placed');
  assert.equal(freeClosed.alternative, null, 'never offer a Lektion the learner cannot open');
  const card = read('src/components/FirstRunCard.jsx');
  assert.match(card, /lesson: 'Or start from zero with Lektion 1'/, 'the card already renders it');
  assert.match(card, /placed: \(a\) => \(a\.topic \? \{/, 'course copy for a course, grammar copy for a topic');
});

test('placed above the free level WITHOUT access → the free course home, never a lock', () => {
  const a = firstRunAction({ hasLessonActivity: false, currentLevel: 'B2.2', hasLevelAccess: freeOnly });
  assert.equal(a.kind, 'course');
  assert.equal(a.href, FREE_COURSE_HOME);
});

test('hasLevelAccess decides: if the free level ever stops opening, the fallback is the public placement test', () => {
  const nothing = () => false;
  const a = firstRunAction({ hasLessonActivity: false, hasLevelAccess: nothing });
  assert.equal(a.kind, 'placement');
  assert.equal(a.alternative, null, 'never offer a Lektion the learner cannot open');
  const b = firstRunAction({ hasLessonActivity: false, startingPoint: 'some', hasLevelAccess: nothing });
  assert.equal(b.kind, 'placement');
  assert.equal(b.alternative, null);
});

test("placedSublevel: the column's 'a1' default is not a placement; either case is", () => {
  assert.equal(placedSublevel('a1'), null);
  assert.equal(placedSublevel('A1'), null);
  assert.equal(placedSublevel(''), null);
  assert.equal(placedSublevel(null), null);
  assert.equal(placedSublevel('C1.1'), null);
  assert.equal(placedSublevel('B1.1'), 'b1.1');
  assert.equal(placedSublevel(' b2.2 '), 'b2.2');
});

// ── 2. the activity signal ──────────────────────────────────────────────────

test('lessonActivityFrom: any grammar OR lesson row is activity; a failed read is unknown, not "none"', () => {
  const rows = (n) => ({ data: Array.from({ length: n }, () => ({})), error: null });
  const failed = { data: null, error: { message: 'boom' } };
  assert.equal(lessonActivityFrom(rows(0), rows(0)), false);
  assert.equal(lessonActivityFrom(rows(1), rows(0)), true);
  assert.equal(lessonActivityFrom(rows(0), rows(2)), true);
  assert.equal(lessonActivityFrom(failed, rows(1)), true, 'a row is a row even if the other read failed');
  assert.equal(lessonActivityFrom(failed, rows(0)), null);
  assert.equal(lessonActivityFrom(rows(0), failed), null);
  assert.equal(lessonActivityFrom(undefined, rows(0)), null);
});

// ── 3. the hrefs are real ───────────────────────────────────────────────────

test('Lektion 1 is a real Lektion of a live curriculum on a FREE level, served by a real route', () => {
  assert.ok(isLevelFree(FREE_COURSE_LEVEL), 'the first-run lesson must be on a free level');
  const curriculum = curriculumFor(FREE_COURSE_LEVEL);
  assert.ok(curriculum, `${FREE_COURSE_LEVEL} has no live curriculum`);
  assert.equal(curriculum.lektionen[0].nr, 1);
  assert.equal(FIRST_LESSON_HREF, `/course/${FREE_COURSE_LEVEL}/l/1`);
  assert.doesNotMatch(FIRST_LESSON_HREF, /\/$/, 'a plain SPA rewrite route has no trailing slash (case 3)');
  assert.ok(read('src/App.jsx').includes('path="/course/:level/l/:nr"'));
  assert.match(read('netlify.toml'), /from = "\/course\/\*"\s*\n\s*to = "\/app\.html"/, 'three-place rule: /course/* must be rewritten to the app shell');
});

test('the placement test href is the prerendered, slashed form (case 2)', () => {
  assert.equal(PLACEMENT_HREF, '/level-test/');
  assert.match(read('scripts/prerender-spa-routes.mjs'), /path:\s*'\/level-test'/);
});

test('onboarding exits: the beginner answer lands IN Lektion 1', () => {
  assert.equal(onboardingExitPath('first-lesson'), FIRST_LESSON_HREF);
  assert.equal(onboardingExitPath('level-test'), '/level-test');
  assert.equal(onboardingExitPath('dashboard'), '/dashboard');
  assert.equal(onboardingExitPath(undefined), '/dashboard');
});

// C-135/X-095: the exam pick was written fire-and-forget and the shared profile
// never reloaded, so the dashboard after "Just show me around first" showed no
// goal and the course card (tests/onboarding-completion-regressions.test.mjs
// runs the exits).
test('every onboarding exit waits for the exam write, completes, then reloads the shared profile', () => {
  const slides = read('src/components/onboarding/IntroSlides.jsx');
  assert.match(slides, /const \{ refreshSubscription \} = useSubscription\(\);/);
  assert.match(slides, /examSave\.current = supabase\.from\('profiles'\)\.update\(\{ exam_track: key \}\)/);
  assert.match(slides, /const saved = examSave\.current \? await withTimeout\(examSave\.current, 3000\)\.catch\(\(\) => false\) : false;\n\s*await completeOnboarding\(exitPath\);\n\s*if \(saved\) await refreshSubscription\(\);/);
  assert.match(slides, /const handleSkip = \(\) => \{\n\s*trackOnboardingSkipped\(\);\n\s*return finish\('dashboard'\);/);
  assert.equal((slides.match(/\bcompleteOnboarding\(/g) || []).length, 1, 'no exit completes around finish()');
});

// ── 4. the wiring ───────────────────────────────────────────────────────────

test('onboarding asks the one question and its primary answer starts Lektion 1', () => {
  const slides = read('src/components/onboarding/IntroSlides.jsx');
  assert.ok(!/slide\.checklist|checklist:/.test(slides), 'the three-actions checklist slide is back');
  assert.ok(!/fastLane/.test(slides), 'the exam-track grammar fast lane is back (it sent B1 pickers to B1.1 grammar)');
  assert.equal((slides.match(/isFinal: true/g) || []).length, 1);
  // The shimmer (primary) button is the beginner answer; the test is secondary.
  const primary = slides.match(/<Button onClick=\{\(\) => chooseStart\(STARTING_POINTS\.(\w+)\)\} shimmer/);
  assert.ok(primary, 'the final slide has no primary chooseStart button');
  assert.equal(primary[1], 'NEW');
  assert.match(slides, /chooseStart\(STARTING_POINTS\.SOME\)\} variant="secondary"/);
  assert.match(slides, /return finish\(point === STARTING_POINTS\.SOME \? 'level-test' : 'first-lesson'\);/);
  assert.match(slides, /updateUser\(\{ data: \{ \[STARTING_POINT_KEY\]: point \} \}\)/, 'the "some German" answer must be remembered');
  assert.equal(STARTING_POINT_KEY, 'starting_point');
  assert.match(read('src/hooks/useOnboarding.js'), /onboardingExitPath\(exitPath, \{ examTrack, currentLevel: profile\?\.current_level, hasLevelAccess \}\)/);
});

test('the dashboard renders the first-run card in the hero slot and demotes its other primaries', () => {
  const dash = read('src/pages/DashboardPage.jsx');
  assert.match(dash, /firstRunAction\(\{/);
  assert.match(dash, /hasLessonActivity: stats\?\.lessonActivity/);
  assert.match(dash, /startingPoint: user\?\.user_metadata\?\.\[STARTING_POINT_KEY\]/);
  assert.match(dash, /examTrack: profile\?\.exam_track/);
  assert.match(dash, /hasLevelAccess,\n/, 'the decision must receive hasLevelAccess');
  assert.match(dash, /\) : firstRun \? \(\s*<FirstRunCard action=\{firstRun\} \/>/);
  const demoted = dash.match(/variant=\{firstRun \? 'secondary' : 'primary'\}/g) || [];
  assert.equal(demoted.length, 2, 'the exam-goal and trial-strip buttons must turn secondary on first run');
  assert.match(read('src/services/dashboardStats.js'), /lessonActivity: lessonActivityFrom\(grammar, lessons\)/);
});

test('the first-run card has exactly one primary action and speaks no du', () => {
  const card = read('src/components/FirstRunCard.jsx');
  assert.equal((card.match(/<Button\b/g) || []).length, 1, 'one Button — the alternative is a text link');
  assert.equal((card.match(/\bshimmer\b/g) || []).length, 1);
  const DU = /\b(du|Du|dir|Dir|dich|Dich|dein|Dein|deine[mnrs]?|Deine[mnrs]?|kannst|musst|hast|willst|machst)\b/;
  const offenders = card.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => DU.test(l));
  assert.deepEqual(offenders, []);
});

test('/login forwards a visitor who is already signed in (the confirmation link lands there)', () => {
  const login = read('src/pages/LoginPage.jsx');
  assert.match(login, /if \(!authLoading && user\) navigate\(from, \{ replace: true \}\);/);
  assert.match(login, /postAuthPath\(\)/, 'the pending checkout still beats the dashboard');
  // The confirmation redirect this compensates for — change it and revisit the forward.
  assert.match(read('src/contexts/AuthContext.jsx'), /emailRedirectTo: `\$\{window\.location\.origin\}\/login`/);
});
