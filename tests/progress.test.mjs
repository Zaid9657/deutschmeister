// Guard suite for the truth-repair layer (renovation Phase 1).
//
// What each pin defends:
//
//   1. PLACEMENT FLOORING — the level test writes profiles.current_level; the
//      dashboard walk must start THERE. Before this, every learner was routed
//      to a1.1 topic 1 regardless of their result (a B2 placer faced 56
//      topics below their level), which made the placement test decorative.
//   2. DAILY-GOAL HONESTY — one grammar row used to emit two stamps
//      (last_accessed AND completed_at), so completing a single lesson filled
//      2 of the 3 daily-goal slots. Same-day stamps must collapse to one;
//      genuinely different days must both count (they are real activity days).
//   3. STREAK MATH — consecutive-day derivation with the yesterday anchor
//      (a streak isn't lost before the user has acted today).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { deriveCurrent } from '../src/services/currentPosition.js';
import {
  grammarRowStamps,
  computeStreak,
  computeActivitiesToday,
} from '../src/services/dashboardStats.js';
import { getTopicsForLevel } from '../src/data/grammarTopics.js';

// ── helpers ──────────────────────────────────────────────────────────────

const emptyProgress = () => ({});

/** progress shape with every topic of `level` marked completed */
const levelCompleted = (level) => {
  const grammarTopics = {};
  getTopicsForLevel(level).forEach((t) => {
    grammarTopics[t.id] = { completed: true };
  });
  return { [level]: { grammarTopics } };
};

const iso = (daysAgo, hour = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

// ── 1. placement flooring ────────────────────────────────────────────────

test('deriveCurrent with no placement starts at a1.1', () => {
  const cur = deriveCurrent(emptyProgress(), null);
  assert.equal(cur.level, 'a1.1');
  assert.equal(cur.nextIndex, 0);
  assert.equal(cur.allDone, false);
});

test('deriveCurrent floors the walk at the placed level (DB uppercase form)', () => {
  const cur = deriveCurrent(emptyProgress(), 'B1.1');
  assert.equal(cur.level, 'b1.1');
  assert.equal(cur.nextIndex, 0);
});

test('deriveCurrent ignores completions below the placement floor', () => {
  // Learner placed at b1.1 who once completed all of a1.1 must still be at b1.1
  const cur = deriveCurrent(levelCompleted('a1.1'), 'b1.1');
  assert.equal(cur.level, 'b1.1');
});

test('deriveCurrent advances past a completed level above the floor', () => {
  const cur = deriveCurrent(levelCompleted('b1.1'), 'b1.1');
  assert.equal(cur.level, 'b1.2');
  assert.equal(cur.nextIndex, 0);
});

test('deriveCurrent treats an invalid placement value as no placement', () => {
  const cur = deriveCurrent(emptyProgress(), 'C1');
  assert.equal(cur.level, 'a1.1');
});

test('deriveCurrent reports allDone when everything from the floor up is complete', () => {
  const progress = {
    ...levelCompleted('b2.1'),
    ...levelCompleted('b2.2'),
  };
  const cur = deriveCurrent(progress, 'b2.1');
  assert.equal(cur.allDone, true);
  assert.equal(cur.nextTopic, null);
});

// ── 2. grammar-row stamp dedupe ──────────────────────────────────────────

test('grammarRowStamps collapses same-day access+completion to one stamp', () => {
  const stamps = grammarRowStamps({ completed_at: iso(0, 10), last_accessed: iso(0, 11) });
  assert.equal(stamps.length, 1);
});

test('grammarRowStamps keeps a completion and a different-day revisit as two', () => {
  const stamps = grammarRowStamps({ completed_at: iso(3), last_accessed: iso(0) });
  assert.equal(stamps.length, 2);
});

test('grammarRowStamps handles rows with only one timestamp', () => {
  assert.equal(grammarRowStamps({ last_accessed: iso(0) }).length, 1);
  assert.equal(grammarRowStamps({ completed_at: iso(0) }).length, 1);
  assert.equal(grammarRowStamps({}).length, 0);
});

test('one completed lesson counts as ONE activity today (the double-count bug)', () => {
  const stamps = grammarRowStamps({ completed_at: iso(0, 9), last_accessed: iso(0, 9) });
  assert.equal(computeActivitiesToday(stamps), 1);
});

// ── 3. streak math ───────────────────────────────────────────────────────

test('computeStreak counts consecutive days ending today', () => {
  assert.equal(computeStreak([iso(0), iso(1), iso(2)]), 3);
});

test('computeStreak anchors on yesterday when nothing happened today yet', () => {
  assert.equal(computeStreak([iso(1), iso(2)]), 2);
});

test('computeStreak breaks on a gap', () => {
  assert.equal(computeStreak([iso(0), iso(2), iso(3)]), 1);
});

test('computeStreak is 0 with no recent activity', () => {
  assert.equal(computeStreak([iso(5)]), 0);
  assert.equal(computeStreak([]), 0);
});

test('computeActivitiesToday counts only today', () => {
  assert.equal(computeActivitiesToday([iso(0), iso(0), iso(1)]), 2);
});
