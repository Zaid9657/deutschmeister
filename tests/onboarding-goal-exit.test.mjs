import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onboardingGoalAction, onboardingExitPath, FIRST_LESSON_HREF } from '../src/lib/firstRun.js';
import { EXAM_TRACKS } from '../src/data/examTracks.js';
import { writingTasksForExam } from '../src/data/writingTasks.js';
import { PROGRAM } from '../src/data/programs/telcB1Komplett.js';
import { resolveModelltest } from '../src/data/modelltest.js';

test('each chosen exam opens its named first task, with placement optional', () => {
  for (const track of EXAM_TRACKS) {
    const action = onboardingGoalAction({ examTrack: track.key, hasLevelAccess: () => true });
    const task = writingTasksForExam(track.key)[0];
    const expected = track.key === 'telc_b1' ? PROGRAM.weeks[0].days[0].items[0].href
      : task ? `/schreiben/${track.slug}?task=${encodeURIComponent(task.taskKey)}` : `/modelltest/${track.slug}`;
    assert.equal(action.href, expected);
    assert.equal(onboardingExitPath('exam-task', { examTrack: track.key }), expected);
    assert.ok(action.label.includes(track.nameDe));
    assert.ok(action.label.endsWith('öffnen'));
    assert.equal(action.locked, false);
  }
});

test('locked and unknown access keep the exam destination and describe its existing lock', () => {
  for (const track of EXAM_TRACKS) {
    for (const hasLevelAccess of [undefined, () => false, (level) => level === 'a1.1']) {
      assert.equal(onboardingGoalAction({ examTrack: track.key, hasLevelAccess }).locked, true);
      assert.notEqual(onboardingExitPath('exam-task', { examTrack: track.key, hasLevelAccess }), FIRST_LESSON_HREF);
    }
    const levels = [];
    onboardingGoalAction({ examTrack: track.key, hasLevelAccess: (level) => { levels.push(level); return true; } });
    assert.deepEqual(levels, [resolveModelltest(track.slug).gateLevel]);
  }
});

test('beginners retain Lektion 1; prior experience never defaults back to it', () => {
  assert.equal(onboardingGoalAction({ examTrack: 'none', currentLevel: 'a1' }), null);
  assert.equal(onboardingExitPath('first-lesson'), FIRST_LESSON_HREF);
  for (const preferences of [{ startingPoint: 'some' }, { currentLevel: 'B1.1' }, { currentLevel: 'A1.2' }]) {
    assert.equal(onboardingGoalAction(preferences).href, '/level-test/');
    assert.equal(onboardingExitPath('exam-task', preferences), '/level-test/');
  }
  assert.equal(onboardingExitPath('exam-task', { examTrack: '//evil.test' }), '/dashboard');
});

test('the local exam choice reaches completion even before the shared profile refresh', () => {
  const source = readFileSync(new URL('../src/components/onboarding/IntroSlides.jsx', import.meta.url), 'utf8');
  assert.match(source, /examTrack: examTrack \?\? profile\?\.exam_track/);
  assert.match(source, /finish\('exam-task', goalPreferences\)/);
  assert.match(source, /await completeOnboarding\(exitPath, options\)/);
  assert.match(source, /goalAction\.label/);
  assert.match(source, /goalAction\.locked/);
  assert.match(source, /Optional: Einstufungstest öffnen \(15–20 Minuten\)/);
});
