// The spaced-review ladder (docs/course-standard-2026-09-12.md §3, "Spaced
// review"). The standard's first choice is FSRS-5 via `ts-fsrs`; this is the
// documented fallback it names — Babbel's fixed ladder 1 → 4 → 7 → 14 → 60 →
// 180 days, lapse back to the start. The memo puts expanding against uniform
// spacing at g = 0.03, which is why the simple ladder is defensible as v1: no
// dependency, no weights to tune, and every interval is explainable to a
// learner ("in 4 Tagen siehst du das wieder").
//
// Pure functions only — no React, no Supabase, so tests/checkpoint.test.mjs can
// pin the whole schedule.

export const LADDER_DAYS = [1, 4, 7, 14, 60, 180];

/** step = how many correct reviews in a row; 0 = new or just lapsed. */
export const MAX_STEP = LADDER_DAYS.length; // 6 — the 180-day plateau

export const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * nextDue(step, correct, now?) → { step, dueInDays, dueAt, lapsed }
 *
 * Correct: advance one rung and wait the NEW rung's interval (a new card seen
 * correctly today returns tomorrow, then in 4 days, 7, 14, 60, 180, 180…).
 * Wrong: drop to step 0 and come back tomorrow — the lapse rule.
 */
export function nextDue(step, correct, now = new Date()) {
  const current = Number.isFinite(Number(step)) ? Math.max(0, Math.min(MAX_STEP, Number(step))) : 0;
  const nextStep = correct ? Math.min(MAX_STEP, current + 1) : 0;
  const dueInDays = LADDER_DAYS[Math.min(current, LADDER_DAYS.length - 1)];
  const days = correct ? dueInDays : LADDER_DAYS[0];
  return {
    step: nextStep,
    dueInDays: days,
    dueAt: new Date(now.getTime() + days * DAY_MS),
    lapsed: !correct,
  };
}

// Card keys — one namespace, three kinds (CONTRACT.md, `review_cards`).
export const cardKinds = { WORD: 'word', PATTERN: 'pattern', SENTENCE: 'sentence' };

/** A Wortfeld entry: prefer the database word id, fall back to the German form. */
export const wordCardKey = (word) => `word:${word?.wordId || word?.de || word?.word}`;
/** A grammar slug the Lektion drills. */
export const patternCardKey = (slug) => `pattern:${slug}`;
/** One line of one Lektion's dialogue. */
export const sentenceCardKey = (lektionId, lineIdx) => `sentence:${lektionId}:${lineIdx}`;

/** `word:abc` → { kind: 'word', ref: 'abc' }; sentence keys keep both parts. */
export function parseCardKey(cardKey) {
  const [kind, ...rest] = String(cardKey || '').split(':');
  if (!Object.values(cardKinds).includes(kind)) return null;
  if (kind === cardKinds.SENTENCE) return { kind, lektionId: rest[0], lineIdx: Number(rest[1]), ref: rest.join(':') };
  return { kind, ref: rest.join(':') };
}
