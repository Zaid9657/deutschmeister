// The course review's schedule, as the learner meets it (2026-10-25 cross-check).
//
// LSN-11. New cards were seeded due NOW, so the learner who finished Lektion 1 came back to
//   „25 cards to review first" ahead of Lektion 2, whose warm-up then pulled cards minutes old.
//   The ladder's own rule is that a new card returns tomorrow: it is seeded for the first rung.
// LSN-12. A card graded at 20:00 came back at 20:00 the next day — every read compared against the
//   current millisecond — so a learner who returned in the morning, as the recap promised, found
//   nothing due: the 1-day rung slipped to 2. "Due" means due by the end of the learner's local day.
// LSN-09. The Wiederholen screen with nothing due showed "Nothing is due today" AND "Done for today",
//   and never the date the next card comes back.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LADDER_DAYS, DAY_MS, nextDue } from '../src/lib/review/ladder.js';
import {
  endOfLocalDay, fetchDueCards, fetchNextDueAt, fetchReviewCounts, firstDueAt, seedCardsForLektion,
} from '../src/services/reviewService.js';
import { supabase } from '../src/utils/supabase.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const lektion = { id: 'a1.1-l01', level: 'a1.1', wortfeld: [{ de: 'Hallo' }, { de: 'Tschüss' }], practiceRule: { topics: ['greetings'] } };

/** A review_cards table behind supabase.from: filters applied as PostgREST would. */
function withCards(rows, fn) {
  const calls = [];
  const original = supabase.from;
  supabase.from = (table) => {
    assert.equal(table, 'review_cards');
    const filters = [];
    const call = { filters: [] };
    calls.push(call);
    const query = {
      select: (_cols, opts) => { call.head = !!(opts && opts.head); return query; },
      eq: (k, v) => { filters.push((r) => r[k] === v); call.filters.push(['eq', k, v]); return query; },
      lte: (k, v) => { filters.push((r) => r[k] <= v); call.filters.push(['lte', k, v]); return query; },
      gt: (k, v) => { filters.push((r) => r[k] > v); call.filters.push(['gt', k, v]); return query; },
      order: () => query,
      limit: (n) => { call.limit = n; return query; },
      then: (resolve) => {
        const data = rows.filter((r) => filters.every((f) => f(r))).sort((a, b) => a.due_at.localeCompare(b.due_at));
        return resolve(call.head ? { count: data.length, error: null } : { data: call.limit ? data.slice(0, call.limit) : data, error: null });
      },
    };
    return query;
  };
  return Promise.resolve(fn(calls)).finally(() => { supabase.from = original; });
}

test('a new card is seeded for the first rung of the ladder — tomorrow — never due at once', async () => {
  assert.equal(LADDER_DAYS[0], 1);
  const now = new Date(2026, 9, 21, 19, 30);
  assert.equal(firstDueAt(now).getTime(), now.getTime() + DAY_MS);
  const written = [];
  const client = { from: () => ({ upsert: async (rows, options) => { written.push({ rows, options }); return { error: null }; } }) };
  assert.equal(await seedCardsForLektion('u1', lektion, 'A1.1', client, now), written[0].rows.length);
  for (const row of written[0].rows) {
    assert.equal(row.due_at, firstDueAt(now).toISOString(), `${row.card_key} is due tomorrow`);
    assert.equal(row.step, 0, 'still a new card');
  }
  assert.equal(written[0].options.ignoreDuplicates, true, 'a card that exists keeps the schedule it has earned');
});

test('seeded today, the cards are not due today but are due all of tomorrow', async () => {
  const evening = new Date(2026, 9, 21, 20, 0);
  const due = firstDueAt(evening).toISOString();
  assert.ok(due > endOfLocalDay(evening).toISOString(), 'the evening they were seeded, nothing is due');
  const nextMorning = new Date(2026, 9, 22, 7, 15);
  assert.ok(due <= endOfLocalDay(nextMorning).toISOString(), 'the next morning, they are');
});

test('"due" means due by the end of the learner\'s local day, so a card graded at 20:00 is due the next morning', async () => {
  const graded = new Date(2026, 9, 21, 20, 0);
  const card = { user_id: 'u1', level: 'a1.1', card_key: 'word:Hallo', step: 1, due_at: nextDue(0, true, graded).dueAt.toISOString() };
  const later = { user_id: 'u1', level: 'a1.1', card_key: 'word:Tschüss', step: 2, due_at: new Date(2026, 9, 25, 9, 0).toISOString() };
  const end = endOfLocalDay();
  assert.equal(end.getHours(), 23);
  assert.equal(end.getMinutes(), 59);
  assert.equal(end.toDateString(), new Date().toDateString(), 'the bound is today, local time');
  await withCards([card, later], async (calls) => {
    // The morning after: 08:00 is before 20:00, and the card is due all the same.
    const morning = new Date(2026, 9, 22, 8, 0);
    assert.ok(card.due_at > morning.toISOString(), 'by the clock the card is not due yet at 08:00');
    assert.ok(card.due_at <= endOfLocalDay(morning).toISOString(), 'by the day, it is');
    // Every read takes the same bound — the end of today.
    await fetchDueCards('u1', 'a1.1', 4);
    await fetchReviewCounts('u1', 'a1.1');
    await fetchNextDueAt('u1', 'a1.1');
    const bounds = calls.flatMap((c) => c.filters.filter(([op]) => op === 'lte' || op === 'gt'));
    assert.deepEqual(bounds.map(([op, k]) => `${op} ${k}`), ['lte due_at', 'lte due_at', 'gt due_at'], 'due (twice) and the next date after today');
    for (const [, , value] of bounds) assert.equal(value.slice(0, 10), endOfLocalDay().toISOString().slice(0, 10));
    for (const [, , value] of bounds) assert.equal(new Date(value).getHours(), 23, 'end of the local day, never the current millisecond');
  });
});

test('the next date shown is the first card due AFTER today, and the counts agree with the deck', async () => {
  const today = new Date();
  const laterToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 30);
  const inTwoDays = new Date(today.getTime() + 2 * DAY_MS);
  const rows = [
    { user_id: 'u1', level: 'a1.1', card_key: 'word:a', due_at: laterToday.toISOString() },
    { user_id: 'u1', level: 'a1.1', card_key: 'word:b', due_at: inTwoDays.toISOString() },
  ];
  await withCards(rows, async () => {
    assert.deepEqual((await fetchDueCards('u1', 'a1.1')).map((r) => r.card_key), ['word:a'], 'due later today is due today');
    assert.deepEqual(await fetchReviewCounts('u1', 'a1.1'), { total: 2, due: 1 });
    assert.equal(await fetchNextDueAt('u1', 'a1.1'), inTwoDays.toISOString(), 'not a card that is already due today');
  });
});

test('Wiederholen with nothing due shows one card that names the next review date', () => {
  const page = read('src/pages/lesson/ReviewPage.jsx');
  assert.match(page, /const done = cards && cards\.length > 0 && index >= cards\.length;/, 'an empty fetch is not a finished batch');
  assert.doesNotMatch(page, /const done = cards && index >= cards\.length;/);
  const effect = page.slice(page.indexOf('fetchDueCards(user.id, curriculum.level, 12)'), page.indexOf('return () => { cancelled = true; };', page.indexOf('fetchDueCards(user.id, curriculum.level, 12)')));
  assert.match(effect, /if \(!due\.length\) \{\s*fetchNextDueAt\(user\.id, curriculum\.level\)\.then\(\(at\) => \{ if \(!cancelled\) setNextDueAt\(at\); \}\);/, 'the empty deck asks when the next card comes back');
  const empty = page.slice(page.indexOf('cards.length === 0 && ('), page.indexOf('{card && content && !done && ('));
  assert.match(empty, /\{user && \(\s*<p[^>]*>\s*\{nextOn \? t\('review\.nextOn', lang, \{ date: nextOn \}\) : t\('review\.newCards', lang\)\}/, 'signed in: the date, or that new cards come with the next lesson');
  assert.match(empty, /t\(user \? 'review\.nothingDue' : 'review\.signIn', lang\)/, 'signed out: the sign-in card only');
});
