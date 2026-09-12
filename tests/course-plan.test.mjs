// Guard suite for the completion levers that are pure arithmetic (P4 of the
// A1.1 plan): the exam-date plan and the forgiving streak.
//
// Why these two get their own suite: both are numbers a learner reads as a
// judgement on themselves. An off-by-one in `behindBy` tells someone they are
// behind when they are not; an off-by-one in the streak deletes a week of
// their work. Neither touches the network, so both can be pinned exactly.
//
// The plan is SOFT by contract — no branch of it may block anything — so the
// suite also pins that every status is one of the five documented strings and
// that a missing date is a state, not an error.

import test from 'node:test';
import assert from 'node:assert/strict';

import { planFor, SUSTAINABLE_PER_WEEK } from '../src/lib/course/plan.js';
import { computeStreakForgiving, dayKey } from '../src/services/dashboardStats.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { curriculumPath } from '../src/data/curricula/index.js';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const PATH = curriculumPath(CURRICULUM_A11);
const TODAY = new Date(2026, 8, 13); // 2026-09-13, local
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const inDays = (n) => {
  const d = new Date(TODAY.getTime());
  d.setDate(d.getDate() + n);
  return iso(d);
};
/** First `n` nodes of the path marked done. */
const doneFirst = (n) => new Set(PATH.slice(0, n).map((node) => node.id));

const STATUSES = new Set(['on-track', 'behind', 'ahead', 'no-date', 'past']);

// ---------------------------------------------------------------------------
// 1. the plan
// ---------------------------------------------------------------------------

test('the a1.1 path is the unit the plan counts', () => {
  // 12 Lektionen + 4 checkpoints + the final test.
  assert.equal(PATH.length, 17);
});

test('no exam date is a state, not an error', () => {
  const p = planFor({ examDate: null, today: TODAY, path: PATH, doneIds: doneFirst(3) });
  assert.equal(p.status, 'no-date');
  assert.equal(p.lektionenLeft, 14);
  assert.equal(p.weeksLeft, null);
  assert.equal(p.perWeekTarget, null);
  assert.equal(p.behindBy, 0, 'a learner without a date can never be "behind"');
});

test('an unparseable date degrades to no-date instead of NaN', () => {
  const p = planFor({ examDate: 'irgendwann', today: TODAY, path: PATH });
  assert.equal(p.status, 'no-date');
  assert.equal(p.behindBy, 0);
});

test('a plain YYYY-MM-DD is read as a LOCAL date (never a day early)', () => {
  // The exam is today: 0 days left, one week of work, and nothing negative.
  const p = planFor({ examDate: inDays(0), today: TODAY, path: PATH, doneIds: doneFirst(17) });
  assert.equal(p.daysLeft, 0);
  assert.equal(p.weeksLeft, 1);
  assert.equal(p.lektionenLeft, 0);
  assert.equal(p.perWeekTarget, 0);
  assert.equal(p.status, 'ahead');
});

test('a past exam date is its own state and stays soft', () => {
  const p = planFor({ examDate: inDays(-3), today: TODAY, path: PATH, doneIds: doneFirst(2) });
  assert.equal(p.status, 'past');
  assert.equal(p.daysLeft, -3);
  assert.equal(p.behindBy, 0);
  assert.equal(p.lektionenLeft, 15, 'the remaining work is still reported');
});

test('the weekly target is what remains over the weeks that remain', () => {
  // 28 days out, nothing done: 17 nodes over 4 weeks → 5 per week.
  const p = planFor({ examDate: inDays(28), today: TODAY, path: PATH, doneIds: new Set() });
  assert.equal(p.weeksLeft, 4);
  assert.equal(p.perWeekTarget, 5);
  assert.equal(p.expectedDoneByNow, 0, '17 nodes fit in 4 × 5 — nothing is owed yet');
  assert.equal(p.behindBy, 0);
  assert.equal(p.status, 'on-track');
});

test('a long runway reads as ahead, and the target drops as work is done', () => {
  const p = planFor({ examDate: inDays(84), today: TODAY, path: PATH, doneIds: doneFirst(4) });
  assert.equal(p.weeksLeft, 12);
  assert.equal(p.perWeekTarget, 2, '13 left over 12 weeks');
  assert.equal(p.status, 'ahead');
});

test('behindBy is the shortfall against a pace a working adult can hold', () => {
  // 14 days out → 2 weeks → capacity 2 × 5 = 10 nodes. 17 - 10 = 7 should
  // already be done; the learner has 3, so they are 4 behind.
  const p = planFor({ examDate: inDays(14), today: TODAY, path: PATH, doneIds: doneFirst(3) });
  assert.equal(p.weeksLeft, 2);
  assert.equal(p.expectedDoneByNow, 17 - SUSTAINABLE_PER_WEEK * 2);
  assert.equal(p.behindBy, 4);
  assert.equal(p.status, 'behind');
  assert.equal(p.perWeekTarget, 7, 'the target rises, it does not hide the gap');
});

test('the same learner two weeks earlier is not behind — the date is never retroactive blame', () => {
  const p = planFor({ examDate: inDays(28), today: TODAY, path: PATH, doneIds: doneFirst(3) });
  assert.equal(p.status, 'on-track');
  assert.equal(p.behindBy, 0);
});

test('every branch returns one of the five documented statuses and no negative numbers', () => {
  for (const days of [-10, 0, 1, 3, 7, 14, 30, 90, 400]) {
    for (const done of [0, 1, 8, 17]) {
      const p = planFor({ examDate: inDays(days), today: TODAY, path: PATH, doneIds: doneFirst(done) });
      assert.ok(STATUSES.has(p.status), `unknown status ${p.status}`);
      assert.ok(p.lektionenLeft >= 0 && p.behindBy >= 0, 'no negative counts');
      if (p.perWeekTarget !== null) assert.ok(p.perWeekTarget >= 0);
    }
  }
  const none = planFor();
  assert.equal(none.status, 'no-date');
  assert.equal(none.total, 0);
});

// ---------------------------------------------------------------------------
// 2. the forgiving streak
// ---------------------------------------------------------------------------

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return dayKey(d);
};
/** A day set from offsets in days-ago. */
const set = (...offsets) => new Set(offsets.map(daysAgo));

test('no gaps: every consecutive day counts', () => {
  assert.equal(computeStreakForgiving(set(0, 1, 2, 3, 4)), 5);
});

test('nothing today yet does not break or spend grace', () => {
  // Yesterday back to five days ago, nothing today: still five worked days,
  // and the gap at day 3 is the only one forgiven.
  assert.equal(computeStreakForgiving(set(1, 2, 3, 4, 5)), 5);
});

test('one gap in the week is forgiven and the streak continues past it', () => {
  // Worked today, 1, then missed 2, then 3, 4, 5 → 5 worked days.
  assert.equal(computeStreakForgiving(set(0, 1, 3, 4, 5)), 5);
});

test('two gaps inside the same week end the streak at the second', () => {
  // Missed day 2 AND day 4: the second miss is inside the same 7-day window,
  // so the streak is today + day 1 + day 3 = 3 worked days.
  assert.equal(computeStreakForgiving(set(0, 1, 3, 5, 6, 7)), 3);
});

test('a second gap OUTSIDE the first gap\'s week is forgiven too', () => {
  // Miss at day 2 and a second miss at day 10 — eight days apart, so each is
  // alone in its own rolling seven.
  const days = set(0, 1, 3, 4, 5, 6, 7, 8, 9, 11, 12);
  assert.equal(computeStreakForgiving(days), 11);
});

test('a single forgiven day before today keeps the streak alive', () => {
  // Nothing today (free) and nothing yesterday (the one grace day) — the
  // three days before that still count. This is the whole point of the lever.
  assert.equal(computeStreakForgiving(set(2, 3, 4)), 3);
});

test('two missed days below today end the streak', () => {
  // Today is free, but day 1 AND day 2 are both misses inside one window.
  assert.equal(computeStreakForgiving(set(3, 4, 5)), 0);
});

test('an empty history is 0, and graceDaysPer7 is configurable', () => {
  assert.equal(computeStreakForgiving(new Set()), 0);
  assert.equal(computeStreakForgiving(set(0, 2, 4), { graceDaysPer7: 2 }), 3);
  assert.equal(computeStreakForgiving(set(0, 2, 4), { graceDaysPer7: 0 }), 1, 'zero grace is the strict rule');
});

test('the forgiving streak never exceeds the number of days actually worked', () => {
  const days = set(0, 1, 3, 4, 6, 7, 9, 10);
  assert.ok(computeStreakForgiving(days) <= days.size);
});
