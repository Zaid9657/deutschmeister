// Guided-course preview policy — plan:
// docs/superpowers/plans/2026-09-15-deutschstart-a11-course-readiness.md Task 2.
//
// The A1.1 guided course keeps its home and lessons 1–3 as the signed-in
// preview; everything later (lessons 4–12, checkpoints, review, completion,
// certificate) needs the course_a1_1 purchase or an active subscription.
// Other levels are untouched: their access is decided by LevelSubscriptionGuard.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canOpenGuidedCourseItem } from '../src/lib/guidedCourseAccess.js';

const access = (kind, nr, extra = {}) => canOpenGuidedCourseItem({
  level: 'a1.1', kind, nr, ownsCourse: false, hasSubscription: false, ...extra,
});

test('A1.1 course home and lessons 1-3 form the preview', () => {
  assert.equal(access('home'), true);
  assert.equal(access('lesson', 1), true);
  assert.equal(access('lesson', 3), true);
  assert.equal(access('lesson', 4), false);
  assert.equal(access('checkpoint', 1), false);
  assert.equal(access('certificate'), false);
});

test('purchase or active subscription opens the complete guided course', () => {
  assert.equal(access('lesson', 12, { ownsCourse: true }), true);
  assert.equal(access('complete', null, { hasSubscription: true }), true);
});

test('non-A1.1 levels are not restricted by the preview policy', () => {
  assert.equal(canOpenGuidedCourseItem({
    level: 'a1.2', kind: 'lesson', nr: 9, ownsCourse: false, hasSubscription: false,
  }), true, 'other levels are gated by LevelSubscriptionGuard, not this policy');
});

test('malformed lesson numbers never fall inside the preview window', () => {
  assert.equal(access('lesson', 0), false);
  assert.equal(access('lesson', 'abc'), false);
  assert.equal(access('lesson', 3.5), false);
  assert.equal(access('review'), false);
});
