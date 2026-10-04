// Course v2 — the game layer's ledger: XP, the daily goal and the streak (owner
// decision 2026-09-29: "gamify it, make it similar to Duolingo, fun and not
// intimidating").
//
// Local-first: one localStorage key for every learner, signed in or not. It is a
// per-browser convenience until the learner-state migration carries it
// server-side — course_events already logs `lernschritt_completed` with its
// minutes, so a server total can be rebuilt from those rows later. Every storage
// access is wrapped: blocked storage means a fresh ledger, never a crash.
//
// The rules (one place, tested in tests/course-v2-game.test.mjs):
//   - XP: 10 for an item right on the first try, 5 for an item right after a
//     retry, 0 for a miss — a miss never costs anything (no hearts, no lost XP);
//     +20 for a finished Lernschritt, +50 for a finished Lektion.
//   - A LEARNING DAY is a local calendar day with at least one finished
//     Lernschritt (XP alone does not make a day: an abandoned step is not a day).
//   - The STREAK counts learning days back from today — or from yesterday while
//     today has no step yet: the streak stays alive until midnight and is shown
//     as "today still open", never as lost early.
//   - The DAILY GOAL is minutes: the pace preset's minutes per learning day
//     (dailyGoalMinutes), rounded up to 5.

export const GAME_KEY = 'dm_course_v2_game';

export const XP = Object.freeze({ firstTry: 10, retry: 5, step: 20, unit: 50 });

export const WEEKDAYS_DE = Object.freeze(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);

function storage() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

const pad = (n) => String(n).padStart(2, '0');

/** The local calendar day of `date` as YYYY-MM-DD. */
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The day before a YYYY-MM-DD key (local calendar, DST-safe: noon arithmetic). */
export function prevDay(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  const noon = new Date(y, m - 1, d, 12);
  noon.setDate(noon.getDate() - 1);
  return dayKey(noon);
}

const EMPTY = () => ({ v: 1, days: {} });

export function readGame(store = storage()) {
  if (!store) return EMPTY();
  try {
    const parsed = JSON.parse(store.getItem(GAME_KEY) || 'null');
    if (parsed && parsed.v === 1 && parsed.days && typeof parsed.days === 'object') return parsed;
  } catch {
    // unreadable → a fresh ledger
  }
  return EMPTY();
}

function writeGame(game, store = storage()) {
  if (!store) return false;
  try {
    store.setItem(GAME_KEY, JSON.stringify(game));
    return true;
  } catch {
    return false;
  }
}

/** XP for one answered item: right first try, right after a retry, or missed. */
export function xpForItem({ correct, firstTry }) {
  if (!correct) return 0;
  return firstTry ? XP.firstTry : XP.retry;
}

/**
 * Add to today's row: { xp, minutes, steps }. Returns the new ledger (also when
 * storage is blocked, so the screen can still show this session's numbers).
 * Fires a `dm-course-game` window event so every mounted counter re-reads.
 */
export function recordGame({ xp = 0, minutes = 0, steps = 0 } = {}, { store = storage(), now = new Date() } = {}) {
  const game = readGame(store);
  const key = dayKey(now);
  const row = game.days[key] || { xp: 0, minutes: 0, steps: 0 };
  game.days[key] = {
    xp: row.xp + Math.max(0, Number(xp) || 0),
    minutes: Math.round((row.minutes + Math.max(0, Number(minutes) || 0)) * 10) / 10,
    steps: row.steps + Math.max(0, Number(steps) || 0),
  };
  writeGame(game, store);
  try {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('dm-course-game'));
  } catch {
    // no window events (tests, SSR) → nothing listens anyway
  }
  return game;
}

const isLearningDay = (row) => Boolean(row && row.steps > 0);

/** Learning days in a row, ending today — or yesterday while today is still open. */
export function streakOf(game, now = new Date()) {
  const days = (game && game.days) || {};
  const today = dayKey(now);
  let key = isLearningDay(days[today]) ? today : prevDay(today);
  let n = 0;
  while (isLearningDay(days[key])) {
    n += 1;
    key = prevDay(key);
  }
  return n;
}

/** The current week, Monday first: [{ label, key, done, today }]. */
export function weekOf(game, now = new Date()) {
  const days = (game && game.days) || {};
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset, 12);
  return WEEKDAYS_DE.map((label, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 12);
    const key = dayKey(d);
    return { label, key, done: isLearningDay(days[key]), today: key === dayKey(now) };
  });
}

/** Everything a screen shows: totals, today, the streak and the week. */
export function gameSummary(game, now = new Date()) {
  const days = (game && game.days) || {};
  const today = days[dayKey(now)] || { xp: 0, minutes: 0, steps: 0 };
  const totalXp = Object.values(days).reduce((n, r) => n + (Number(r && r.xp) || 0), 0);
  return {
    totalXp,
    todayXp: today.xp,
    todayMinutes: today.minutes,
    todaySteps: today.steps,
    todayDone: isLearningDay(today),
    streak: streakOf(game, now),
    week: weekOf(game, now),
  };
}

/**
 * Minutes per learning day for a pace preset: the level's planned unit minutes ×
 * units per week ÷ learning days (course.json `pace`), rounded up to 5.
 */
export function dailyGoalMinutes(manifest, pace = 'standard') {
  const presets = (manifest && manifest.pace) || {};
  const p = presets[pace] || presets.standard || { unitsPerWeek: 1, learningDays: 4 };
  const units = (manifest && manifest.units) || [];
  const planned = units.map((u) => Number(u && u.minutesPlanned) || 0).filter(Boolean);
  const perUnit = planned.length ? planned.reduce((a, b) => a + b, 0) / planned.length : 135;
  const raw = (perUnit * (Number(p.unitsPerWeek) || 1)) / Math.max(1, Number(p.learningDays) || 4);
  return Math.max(5, Math.ceil(raw / 5) * 5);
}
