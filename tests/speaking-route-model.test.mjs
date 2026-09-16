// Pure route model for the City Conversation Map — plan:
// docs/superpowers/plans/2026-09-15-speaking-guided-city-map.md Task 2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildA11Route, canOpenStation } from '../src/features/speaking/routeModel.js';

const missions = (n) => Array.from({ length: n }, (_, i) => ({ order: i + 1, title: `M${i + 1}` }));

test('route unlocks the first incomplete station but keeps completed stations replayable', () => {
  const route = buildA11Route({
    missions: missions(3),
    attempts: [{ missionOrder: 1, passed: true }],
  });
  assert.deepEqual(route.map(({ state }) => state), ['complete', 'current', 'locked']);
});

test('a fresh learner starts at station 1 with everything later locked', () => {
  const route = buildA11Route({ missions: missions(12), attempts: [] });
  assert.equal(route[0].state, 'current');
  assert.ok(route.slice(1).every((s) => s.state === 'locked'));
});

test('preview users see stations 1-3 playable and 4-12 course-locked', () => {
  const route = buildA11Route({ missions: missions(12), attempts: [], access: 'preview' });
  assert.equal(route[0].state, 'current');
  assert.deepEqual(route.slice(3).map((s) => s.state), Array(9).fill('course-locked'));
  // The course-locked stations carry the unlock action, not a mission link.
  assert.ok(route.slice(3).every((s) => s.action === 'unlock-course'));
});

test('a passed early station stays replayable for preview users too', () => {
  const route = buildA11Route({
    missions: missions(12),
    attempts: [{ missionOrder: 1, passed: true }, { missionOrder: 2, passed: true }],
    access: 'preview',
  });
  assert.deepEqual(route.slice(0, 3).map((s) => s.state), ['complete', 'complete', 'current']);
  assert.equal(route[3].state, 'course-locked', 'progress never overrides the paywall');
});

test('direct URLs cannot skip locked stations', () => {
  const attempts = [{ missionOrder: 1, passed: true }];
  assert.equal(canOpenStation({ missions: missions(12), attempts, order: 2 }), true);
  assert.equal(canOpenStation({ missions: missions(12), attempts, order: 3 }), false, 'station after the current one is locked');
  assert.equal(canOpenStation({ missions: missions(12), attempts, order: 1 }), true, 'completed stays replayable');
  assert.equal(canOpenStation({ missions: missions(12), attempts, order: 4, access: 'preview' }), false);
  assert.equal(canOpenStation({ missions: missions(12), attempts: [], order: 99 }), false, 'unknown station never opens');
});

test('a failed attempt keeps the station current, not complete', () => {
  const route = buildA11Route({
    missions: missions(3),
    attempts: [{ missionOrder: 1, passed: false }],
  });
  assert.deepEqual(route.map(({ state }) => state), ['current', 'locked', 'locked']);
});

test('owners may open any station progress has reached', () => {
  const attempts = [1, 2, 3, 4].map((n) => ({ missionOrder: n, passed: true }));
  const route = buildA11Route({ missions: missions(12), attempts, access: 'owner' });
  assert.deepEqual(route.slice(0, 5).map((s) => s.state), ['complete', 'complete', 'complete', 'complete', 'current']);
  assert.equal(canOpenStation({ missions: missions(12), attempts, order: 5, access: 'owner' }), true);
  assert.equal(canOpenStation({ missions: missions(12), attempts, order: 6, access: 'owner' }), false);
});
