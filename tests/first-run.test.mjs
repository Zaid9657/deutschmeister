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
//      learner who said they know some German, or the placed level's first
//      lesson; unknown activity is never first-run; hasLevelAccess decides.
//   2. lessonActivityFrom (dashboardStats) — the scorecard's own definition
//      (any user_grammar_progress OR lesson_progress row), fail-safe on errors.
//   3. The hrefs are real: Lektion 1 exists in a live FREE curriculum, the
//      routes exist in App.jsx and netlify.toml, the trailing-slash classes hold.
//   4. The wiring: onboarding's primary exit lands IN Lektion 1, the dashboard
//      renders the card in the hero slot, /login forwards a signed-in visitor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  firstRunAction,
  placedSublevel,
  onboardingExitPath,
  FIRST_LESSON_HREF,
  PLACEMENT_HREF,
  STARTING_POINTS,
  STARTING_POINT_KEY,
} from '../src/lib/firstRun.js';
import { lessonActivityFrom } from '../src/services/dashboardStats.js';
import { FREE_COURSE_LEVEL, FREE_COURSE_HOME } from '../src/lib/courseEntry.js';
import { isLevelFree } from '../src/config/freeTier.js';
import { curriculumFor } from '../src/data/curricula/index.js';
import { getTopicsForLevel } from '../src/data/grammarTopics.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const everything = () => true;
const freeOnly = (level) => isLevelFree(level);

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

test('placed above the free level with access → the first grammar lesson of the placed level (full load, slash)', () => {
  const a = firstRunAction({ hasLessonActivity: false, currentLevel: 'B1.1', hasLevelAccess: everything });
  const first = getTopicsForLevel('b1.1')[0];
  assert.equal(a.kind, 'placed');
  assert.equal(a.level, 'b1.1', 'UPPERCASE DB level normalised to the URL form');
  assert.equal(a.href, `/grammar/b1.1/${first.slug}/`);
  assert.equal(a.fullLoad, true, 'grammar is Astro-served — an <a>, never a router Link');
  assert.match(a.href, /\/$/, 'Astro pages end in a slash (trailing-slash case 1)');
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
  assert.match(slides, /completeOnboarding\(point === STARTING_POINTS\.SOME \? 'level-test' : 'first-lesson'\)/);
  assert.match(slides, /updateUser\(\{ data: \{ \[STARTING_POINT_KEY\]: point \} \}\)/, 'the "some German" answer must be remembered');
  assert.equal(STARTING_POINT_KEY, 'starting_point');
  assert.match(read('src/hooks/useOnboarding.js'), /onboardingExitPath\(exitPath\)/);
});

test('the dashboard renders the first-run card in the hero slot and demotes its other primaries', () => {
  const dash = read('src/pages/DashboardPage.jsx');
  assert.match(dash, /firstRunAction\(\{/);
  assert.match(dash, /hasLessonActivity: stats\?\.lessonActivity/);
  assert.match(dash, /startingPoint: user\?\.user_metadata\?\.\[STARTING_POINT_KEY\]/);
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
