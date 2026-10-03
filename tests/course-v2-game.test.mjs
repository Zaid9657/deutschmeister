// Course v2 — the game layer (src/lib/course-v2/gamify.js) and the course theme
// tokens (design-tokens.js "THE COURSE THEME").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  XP, xpForItem, dayKey, prevDay, readGame, recordGame, streakOf, weekOf, gameSummary, dailyGoalMinutes, GAME_KEY,
} from '../src/lib/course-v2/gamify.js';
import { coursePalettes, COURSE_PALETTE, courseHues, courseGame, kasus } from '../src/data/design-tokens.js';

function memoryStore() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m };
}

const at = (y, mo, d, h = 10) => new Date(y, mo - 1, d, h);

test('XP: right first try 10, right after a retry 5, a miss costs nothing', () => {
  assert.equal(xpForItem({ correct: true, firstTry: true }), XP.firstTry);
  assert.equal(xpForItem({ correct: true, firstTry: false }), XP.retry);
  assert.equal(xpForItem({ correct: false, firstTry: true }), 0);
  assert.ok(Object.values(XP).every((n) => n >= 0), 'no negative XP anywhere');
});

test('dayKey / prevDay use the local calendar and cross month and year ends', () => {
  assert.equal(dayKey(at(2026, 9, 29)), '2026-09-29');
  assert.equal(prevDay('2026-10-01'), '2026-09-30');
  assert.equal(prevDay('2027-01-01'), '2026-12-31');
  assert.equal(prevDay('2026-03-30'), '2026-03-29', 'DST week in Europe');
});

test('recordGame adds to today and survives a blocked or broken store', () => {
  const store = memoryStore();
  recordGame({ xp: 30, minutes: 12.26, steps: 0 }, { store, now: at(2026, 9, 29) });
  const g = recordGame({ xp: 20, minutes: 3, steps: 1 }, { store, now: at(2026, 9, 29, 20) });
  assert.deepEqual(g.days['2026-09-29'], { xp: 50, minutes: 15.3, steps: 1 });
  assert.deepEqual(readGame(store), g);
  assert.deepEqual(recordGame({ xp: 5 }, { store: null, now: at(2026, 9, 29) }).days['2026-09-29'].xp, 5);
  const broken = memoryStore();
  broken.setItem(GAME_KEY, '{not json');
  assert.deepEqual(readGame(broken), { v: 1, days: {} });
  assert.deepEqual(readGame({ getItem() { throw new Error('SecurityError'); } }), { v: 1, days: {} });
});

test('the streak counts learning days (a finished step), and today stays open until midnight', () => {
  const store = memoryStore();
  recordGame({ steps: 1 }, { store, now: at(2026, 9, 27) });
  recordGame({ steps: 1 }, { store, now: at(2026, 9, 28) });
  const g = readGame(store);
  assert.equal(streakOf(g, at(2026, 9, 29)), 2, 'today not done yet: yesterday still carries the streak');
  recordGame({ xp: 40 }, { store, now: at(2026, 9, 29) });
  assert.equal(streakOf(readGame(store), at(2026, 9, 29)), 2, 'XP without a finished step is not a learning day');
  recordGame({ steps: 1 }, { store, now: at(2026, 9, 29) });
  assert.equal(streakOf(readGame(store), at(2026, 9, 29)), 3);
  assert.equal(streakOf(readGame(store), at(2026, 10, 1)), 0, 'a whole missed day ends it');
});

test('the week runs Monday to Sunday and marks today', () => {
  const store = memoryStore();
  recordGame({ steps: 1 }, { store, now: at(2026, 9, 28) }); // a Monday
  const week = weekOf(readGame(store), at(2026, 9, 29)); // a Tuesday
  assert.deepEqual(week.map((d) => d.label), ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);
  assert.equal(week[0].key, '2026-09-28');
  assert.equal(week[0].done, true);
  assert.equal(week[1].today, true);
  assert.equal(week[6].key, '2026-10-04');
});

test('gameSummary totals every day and reports today', () => {
  const store = memoryStore();
  recordGame({ xp: 100, steps: 2, minutes: 30 }, { store, now: at(2026, 9, 28) });
  recordGame({ xp: 40, steps: 1, minutes: 18 }, { store, now: at(2026, 9, 29) });
  const s = gameSummary(readGame(store), at(2026, 9, 29));
  assert.equal(s.totalXp, 140);
  assert.equal(s.todayXp, 40);
  assert.equal(s.todayMinutes, 18);
  assert.equal(s.todayDone, true);
  assert.equal(s.streak, 2);
});

test('the daily goal follows the pace preset (A1.1: 25 / 35 / 45 minutes)', () => {
  const manifest = {
    pace: { leicht: { unitsPerWeek: 0.5, learningDays: 3 }, standard: { unitsPerWeek: 1, learningDays: 4 }, intensiv: { unitsPerWeek: 2, learningDays: 6 } },
    units: Array.from({ length: 12 }, () => ({ minutesPlanned: 135 })),
  };
  assert.equal(dailyGoalMinutes(manifest, 'leicht'), 25);
  assert.equal(dailyGoalMinutes(manifest, 'standard'), 35);
  assert.equal(dailyGoalMinutes(manifest, 'intensiv'), 45);
  assert.equal(dailyGoalMinutes(null), 35, 'no manifest: the SCHEMA defaults');
});

test('the course theme: the live palette exists, and no course colour is a kasus colour (rule 1)', () => {
  assert.ok(coursePalettes[COURSE_PALETTE], 'COURSE_PALETTE names a palette');
  const caseHexes = new Set(Object.values(kasus).flatMap((k) => [k.line, k.wash, k.ink]).map((h) => h.toLowerCase()));
  const courseHexes = [
    ...Object.values(coursePalettes).flatMap((p) => Object.values(p)),
    ...Object.values(courseHues).flatMap((h) => Object.values(h)),
    ...Object.values(courseGame),
  ].map((h) => h.toLowerCase());
  for (const hex of courseHexes) assert.ok(!caseHexes.has(hex), `${hex} is a kasus colour`);
  for (const p of Object.values(coursePalettes)) {
    for (const k of ['primary', 'edge', 'wash', 'soft', 'ink', 'ground']) assert.match(p[k], /^#[0-9A-F]{6}$/i, k);
  }
});
