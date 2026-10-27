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
//   4. SRS SCHEDULER — the SM-2-lite steps, "Leicht" never sooner than "Gut",
//      and day-or-more due dates on a calendar day (04:00 local).
//   5. SRS SESSIONS — "Nochmal" re-queues the SAVED lapse, never the stale
//      card; due reviews come before new words, and "fällig" counts the new
//      words one session adds, not the raw backlog (srsService queries run
//      against a small in-memory stand-in for PostgREST).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { deriveCurrent } from '../src/services/currentPosition.js';
import {
  review,
  GRADES,
  DAY_START_HOUR,
  SESSION_SIZE,
  NEW_CARDS_PER_SESSION,
  sessionQueue,
  dueNow,
  queueAfterGrade,
} from '../src/services/srsScheduler.js';
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

// ── 4. SRS scheduler (SM-2-lite) ─────────────────────────────────────────

const newCard = () => ({ ease: 2.5, interval_days: 0, reps: 0, lapses: 0 });

test('a new card graded GOOD comes back tomorrow, then in ~3 days, then ease-spaced', () => {
  const now = new Date('2026-08-31T12:00:00Z');
  const r1 = review(newCard(), GRADES.GOOD, now);
  assert.equal(r1.interval_days, 1);
  const r2 = review({ ...newCard(), ...r1 }, GRADES.GOOD, now);
  assert.equal(r2.interval_days, 3);
  const r3 = review({ ...newCard(), ...r2 }, GRADES.GOOD, now);
  assert.ok(r3.interval_days >= 7, `third GOOD interval too short: ${r3.interval_days}`);
});

test('AGAIN lapses the card back to the start and drops ease', () => {
  const mature = { ease: 2.5, interval_days: 30, reps: 5, lapses: 0 };
  const r = review(mature, GRADES.AGAIN);
  assert.equal(r.interval_days, 0);
  assert.equal(r.lapses, 1);
  assert.ok(r.ease < 2.5);
  // "again" resurfaces within the session, not tomorrow
  assert.ok(new Date(r.due_at) - Date.now() < 60 * 60 * 1000);
});

test('ease is clamped to the SM-2 floor and ceiling', () => {
  let card = { ease: 1.35, interval_days: 1, reps: 1, lapses: 0 };
  card = { ...card, ...review(card, GRADES.AGAIN) };
  assert.ok(card.ease >= 1.3);
  let easyCard = { ease: 2.95, interval_days: 10, reps: 5, lapses: 0 };
  easyCard = { ...easyCard, ...review(easyCard, GRADES.EASY) };
  assert.ok(easyCard.ease <= 3.0);
});

test('EASY grows the interval faster than GOOD', () => {
  const card = { ease: 2.5, interval_days: 10, reps: 3, lapses: 0 };
  const good = review(card, GRADES.GOOD);
  const easy = review(card, GRADES.EASY);
  assert.ok(easy.interval_days > good.interval_days);
});

test('"Leicht" is never sooner than "Gut": on the 1-day step at every ease, and across the grid', () => {
  // A card on its 1-day step after a few lapses (ease 1.9) got 2 days for Leicht against Gut's 3.
  for (const ease of [1.3, 1.6, 1.9, 2.1, 2.3, 2.5]) {
    const card = { ease, interval_days: 1, reps: 3, lapses: 2 };
    const good = review(card, GRADES.GOOD).interval_days;
    const easy = review(card, GRADES.EASY).interval_days;
    assert.ok(easy > good, `interval 1, ease ${ease}: EASY ${easy} must beat GOOD ${good}`);
  }
  for (let interval = 0; interval <= 60; interval++) {
    for (let ease = 1.3; ease <= 3.0001; ease += 0.1) {
      const card = { ease, interval_days: interval, reps: 4, lapses: 0 };
      assert.ok(
        review(card, GRADES.EASY).interval_days > review(card, GRADES.GOOD).interval_days,
        `interval ${interval}, ease ${ease.toFixed(1)}`,
      );
    }
  }
  // The first step keeps its published shape: Gut tomorrow, Leicht in 4 days.
  assert.equal(review(newCard(), GRADES.GOOD).interval_days, 1);
  assert.equal(review(newCard(), GRADES.EASY).interval_days, 4);
});

test('a card due on a later day is due from 04:00 that day: an evening review is due the next morning', () => {
  // Built and read in LOCAL time, so the assertion holds in any time zone.
  const mondayEvening = new Date(2026, 10, 2, 21, 0, 0); // Mon 2 Nov 2026, 21:00
  const good = new Date(review(newCard(), GRADES.GOOD, mondayEvening).due_at);
  assert.equal(good.getDate(), 3, 'due on Tuesday');
  assert.equal(good.getHours(), DAY_START_HOUR);
  assert.equal(DAY_START_HOUR, 4);
  assert.equal(good.getMinutes(), 0);
  assert.ok(good < new Date(2026, 10, 3, 8, 0, 0), 'a return on Tuesday at 08:00 finds it due');
  // Longer steps land on the same hour of their own day.
  const easy = new Date(review(newCard(), GRADES.EASY, mondayEvening).due_at);
  assert.equal(easy.getDate(), 6);
  assert.equal(easy.getHours(), DAY_START_HOUR);
  // "Nochmal" is unchanged: back within the session, ten minutes later.
  const again = new Date(review({ ease: 2.5, interval_days: 20, reps: 5, lapses: 0 }, GRADES.AGAIN, mondayEvening).due_at);
  assert.equal(again - mondayEvening, 10 * 60 * 1000);
});

// ── 5. SRS sessions ──────────────────────────────────────────────────────

test('"Nochmal" re-queues the saved lapse: AGAIN then GOOD gives 1 day, ease 2.3, lapses 1 — not 50 days, lapses 0', () => {
  const now = new Date(2026, 10, 2, 19, 0, 0);
  const mature = { word_id: 'w1', words: { german: 'Tisch' }, ease: 2.5, interval_days: 20, reps: 6, lapses: 0 };
  const other = { word_id: 'w2', words: { german: 'Stuhl' }, ease: 2.5, interval_days: 0, reps: 0, lapses: 0 };
  const saved = review(mature, GRADES.AGAIN, now); // what recordReview persisted (and now returns)
  const queue = queueAfterGrade([mature, other], mature, GRADES.AGAIN, saved);
  assert.deepEqual(queue.map((c) => c.word_id), ['w2', 'w1'], 'the card goes to the back of the session');
  const requeued = queue[1];
  assert.equal(requeued.words.german, 'Tisch', 'the joined word travels with it');
  const regrade = review(requeued, GRADES.GOOD, now);
  assert.equal(regrade.interval_days, 1);
  assert.equal(regrade.ease, 2.3);
  assert.equal(regrade.lapses, 1);
  // The bug this pins: grading the STALE object erased the lapse and pushed the word out ~7 weeks.
  const stale = review(mature, GRADES.GOOD, now);
  assert.equal(stale.interval_days, 50);
  assert.equal(stale.lapses, 0);
  // Any other grade simply drops the card; a queue whose front moved on is left alone.
  assert.deepEqual(queueAfterGrade([mature, other], mature, GRADES.GOOD, saved).map((c) => c.word_id), ['w2']);
  assert.deepEqual(queueAfterGrade([other], mature, GRADES.GOOD, saved).map((c) => c.word_id), ['w2']);
});

test('a session serves the due reviews first, then new words up to the allowance', () => {
  const reviews = Array.from({ length: 4 }, (_, i) => ({ word_id: `r${i}` }));
  const fresh = Array.from({ length: 30 }, (_, i) => ({ word_id: `n${i}` }));
  const q = sessionQueue(reviews, fresh);
  assert.deepEqual(q.slice(0, 4).map((c) => c.word_id), ['r0', 'r1', 'r2', 'r3']);
  assert.equal(q.length, 4 + NEW_CARDS_PER_SESSION);
  assert.equal(NEW_CARDS_PER_SESSION, 10);
  assert.equal(SESSION_SIZE, 20);
  // A full review backlog leaves no room for new words; the session never exceeds its size.
  const many = Array.from({ length: 25 }, (_, i) => ({ word_id: `r${i}` }));
  assert.deepEqual(sessionQueue(many, fresh).map((c) => c.word_id), many.slice(0, SESSION_SIZE).map((c) => c.word_id));
  assert.equal(sessionQueue(Array.from({ length: 15 }, (_, i) => ({ word_id: `r${i}` })), fresh).length, SESSION_SIZE);
  // "fällig" = due reviews + the new words one session would add, never the raw backlog.
  assert.equal(dueNow(0, 339), 10);
  assert.equal(dueNow(12, 3), 15);
  assert.equal(dueNow(0, 0), 0);
});

test('a whole level added at once: day-1 words come back on day 2, and every later session mixes reviews in', () => {
  // The simulation from the finding: 339 A1.1 words added in one go, one session a day, every card
  // "Gut". With new words sorted ahead of reviews, sessions 1-16 were all new and day-1 words were
  // first repeated on day 16 or 17.
  const deck = Array.from({ length: 339 }, (_, i) => ({ word_id: `w${i}`, ease: 2.5, interval_days: 0, reps: 0, lapses: 0, due_at: new Date(2026, 10, 1, 12).toISOString() }));
  const seen = new Map();
  for (let day = 0; day < 8; day++) {
    const now = new Date(2026, 10, 2 + day, 19, 0, 0);
    const reviews = deck.filter((c) => c.reps > 0 && new Date(c.due_at) <= now).sort((a, b) => new Date(a.due_at) - new Date(b.due_at));
    const fresh = deck.filter((c) => c.reps === 0);
    const queue = sessionQueue(reviews, fresh);
    if (day > 0) assert.ok(queue.some((c) => c.reps > 0), `day ${day + 1} repeats something`);
    for (const card of queue) {
      if (!seen.has(card.word_id)) seen.set(card.word_id, []);
      seen.get(card.word_id).push(day);
      Object.assign(card, review(card, GRADES.GOOD, now));
    }
  }
  const dayOne = [...seen].filter(([, days]) => days[0] === 0);
  assert.equal(dayOne.length, NEW_CARDS_PER_SESSION);
  for (const [id, days] of dayOne) assert.equal(days[1], 1, `${id} must be repeated on day 2`);
});

// srsService against a small in-memory stand-in for PostgREST: eq/gt/lte filters, multi-key order,
// limit, head counts and update. `fail(query)` may return an error for a query.
function fakeSupabase(rows, { fail = () => null } = {}) {
  const queries = [];
  const matches = (q) => (r) => q.filters.every(([op, col, v]) => (op === 'eq' ? r[col] === v : op === 'gt' ? r[col] > v : r[col] <= v));
  const run = (q) => {
    const error = fail(q);
    if (error) return { data: null, count: null, error };
    const hits = rows.filter(matches(q));
    if (q.values) {
      hits.forEach((r) => Object.assign(r, q.values));
      return { data: null, error: null };
    }
    if (q.head) return { data: null, count: hits.length, error: null };
    const sorted = [...hits].sort((a, b) => {
      for (const [col, asc] of q.orders) {
        if (a[col] < b[col]) return asc ? -1 : 1;
        if (a[col] > b[col]) return asc ? 1 : -1;
      }
      return 0;
    });
    return { data: q.limit == null ? sorted : sorted.slice(0, q.limit), error: null };
  };
  return {
    queries,
    from(table) {
      const q = { table, filters: [], orders: [], limit: null, head: false, values: null };
      queries.push(q);
      const chain = {
        select(_columns, opts) { q.head = Boolean(opts?.head); return chain; },
        update(values) { q.values = values; return chain; },
        eq(col, v) { q.filters.push(['eq', col, v]); return chain; },
        gt(col, v) { q.filters.push(['gt', col, v]); return chain; },
        lte(col, v) { q.filters.push(['lte', col, v]); return chain; },
        order(col, { ascending = true } = {}) { q.orders.push([col, ascending]); return chain; },
        limit(n) { q.limit = n; return chain; },
        then(resolve, reject) { return Promise.resolve().then(() => run(q)).then(resolve, reject); },
      };
      return chain;
    },
  };
}

async function loadSrsService(supabase) {
  const scheduler = await import('../src/services/srsScheduler.js');
  const source = readFileSync(new URL('../src/services/srsService.js', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '')
    .replaceAll('export async function ', 'async function ');
  const names = ['review', 'sessionQueue', 'dueNow', 'SESSION_SIZE', 'NEW_CARDS_PER_SESSION'];
  return new Function('supabase', ...names, `${source}\nreturn { fetchDueCards, fetchDeckCounts, recordReview };`)(
    supabase, ...names.map((n) => scheduler[n]),
  );
}

const quietly = async (fn) => {
  const original = console.error;
  console.error = () => {};
  try { return await fn(); } finally { console.error = original; }
};

/** Five reviewed cards due now and 300 new ones whose due_at is the (earlier) moment they were added. */
function deckRows(userId = 'u1') {
  const added = new Date(Date.now() - 3 * 86400000).toISOString();
  const rows = Array.from({ length: 300 }, (_, i) => ({
    user_id: userId, word_id: `n${String(i).padStart(3, '0')}`, reps: 0, lapses: 0, ease: 2.5, interval_days: 0,
    due_at: added, created_at: added, words: { german: `neu${i}` },
  }));
  for (let i = 0; i < 5; i++) {
    rows.push({
      user_id: userId, word_id: `r${i}`, reps: 2, lapses: 0, ease: 2.5, interval_days: 3,
      due_at: new Date(Date.now() - (i + 1) * 3600000).toISOString(), created_at: added, words: { german: `alt${i}` },
    });
  }
  rows.push({ // a review that is not due yet, and another learner's card
    user_id: userId, word_id: 'later', reps: 3, lapses: 0, ease: 2.5, interval_days: 7,
    due_at: new Date(Date.now() + 5 * 86400000).toISOString(), created_at: added, words: { german: 'später' },
  });
  rows.push({ user_id: 'u2', word_id: 'x', reps: 1, lapses: 0, ease: 2.5, interval_days: 1, due_at: added, created_at: added, words: {} });
  return rows;
}

test('fetchDueCards serves the due reviews before the unseen backlog, then 10 new words', async () => {
  const supabase = fakeSupabase(deckRows());
  const { fetchDueCards } = await loadSrsService(supabase);
  const cards = await fetchDueCards('u1');
  assert.deepEqual(cards.slice(0, 5).map((c) => c.word_id), ['r4', 'r3', 'r2', 'r1', 'r0'], 'oldest-due review first');
  assert.equal(cards.length, 5 + NEW_CARDS_PER_SESSION);
  assert.ok(cards.slice(5).every((c) => c.reps === 0), 'then new words');
  assert.ok(!cards.some((c) => c.word_id === 'later' || c.user_id !== 'u1'));
  // A failed read serves nothing rather than new words alone (which would put them first again).
  const broken = fakeSupabase(deckRows(), { fail: (q) => (q.filters.some(([op]) => op === 'gt') ? { message: 'Failed to fetch' } : null) });
  const { fetchDueCards: brokenFetch } = await loadSrsService(broken);
  assert.deepEqual(await quietly(() => brokenFetch('u1')), []);
});

test('fetchDeckCounts reports due reviews plus the new-word allowance, and flags a failed read', async () => {
  const { fetchDeckCounts } = await loadSrsService(fakeSupabase(deckRows()));
  assert.deepEqual(await fetchDeckCounts('u1'), { total: 306, due: 5 + NEW_CARDS_PER_SESSION, ok: true });
  const failing = fakeSupabase(deckRows(), { fail: (q) => (q.head && q.filters.some(([op, col]) => op === 'eq' && col === 'reps') ? { message: 'Failed to fetch' } : null) });
  const { fetchDeckCounts: failingCounts } = await loadSrsService(failing);
  const counts = await quietly(() => failingCounts('u1'));
  assert.equal(counts.ok, false, 'a failed count is not a zero');
});

test('recordReview returns the saved state (null when the write failed) and still stamps last_reviewed_at', async () => {
  const rows = deckRows();
  const { recordReview } = await loadSrsService(fakeSupabase(rows));
  const card = rows.find((r) => r.word_id === 'r0');
  const saved = await recordReview('u1', { ...card }, GRADES.AGAIN);
  assert.equal(saved.interval_days, 0);
  assert.equal(saved.lapses, 1);
  assert.equal(saved.last_grade, GRADES.AGAIN);
  assert.equal(card.lapses, 1, 'the row was written');
  assert.equal(card.due_at, saved.due_at, 'and the returned state is what was written');
  assert.ok(card.last_reviewed_at, 'the review is stamped on the row');
  const { recordReview: failing } = await loadSrsService(fakeSupabase(rows, { fail: () => ({ message: 'Failed to fetch' }) }));
  assert.equal(await quietly(() => failing('u1', { ...card }, GRADES.GOOD)), null);
});
