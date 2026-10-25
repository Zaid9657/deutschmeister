// Explicit .js extensions so node --test can import this module directly
// (Vite resolves either form; bare specifiers break under Node ESM).
import { levels as ALL_LEVELS } from '../data/content.js';
import { getTopicsForLevel } from '../data/grammarTopics.js';

// ──────────────────────────────────────────────────────────────
// Where is this learner right now? One pure answer, used by the
// dashboard hero and anything else that needs "the next lesson".
//
// The placement floor exists because the level test writes
// profiles.current_level and the dashboard used to ignore it —
// every learner, whatever their result, was walked from a1.1
// topic 1. A B2 placer faced 56 A1–B1 topics before the hero
// pointed at their level. The floor starts the walk at the placed
// level; completions above it still advance, completions below it
// are ignored (they were placed out of, not earned through).
//
// Pure data in, plain object out — no React, no Supabase — so
// node --test can pin the behaviour (tests/progress.test.mjs).
// ──────────────────────────────────────────────────────────────

export const isTopicCompleted = (progress, level, topicId) =>
  !!progress?.[level]?.grammarTopics?.[topicId]?.completed;

export const topicPercent = (progress, level, topicId) => {
  const t = progress?.[level]?.grammarTopics?.[topicId];
  if (!t) return 0;
  if (t.completed) return 100;
  return typeof t.progress === 'number' ? t.progress : 0;
};

/** DB stores 'B1.1', URLs and progress keys use 'b1.1' — normalize at this boundary. */
const normalizeLevel = (level) => {
  const l = String(level || '').toLowerCase().trim();
  return ALL_LEVELS.includes(l) ? l : null;
};

/**
 * Find the learner's effective current sub-level + next uncompleted topic.
 * @param {object} progress        useProgress() shape ({ 'a1.1': { grammarTopics: {...} }, ... })
 * @param {string} [placementLevel] profiles.current_level ('B1.1' or 'b1.1'); walk starts here
 */
export function deriveCurrent(progress, placementLevel) {
  const floor = normalizeLevel(placementLevel);
  const startIndex = floor ? ALL_LEVELS.indexOf(floor) : 0;

  for (const level of ALL_LEVELS.slice(startIndex)) {
    const topics = getTopicsForLevel(level);
    if (!topics || topics.length === 0) continue;
    const next = topics.find((t) => !isTopicCompleted(progress, level, t.id));
    const anyDone = topics.some((t) => isTopicCompleted(progress, level, t.id));
    if (next) {
      const idx = topics.findIndex((t) => t.id === next.id);
      return {
        level,
        topics,
        nextTopic: next,
        nextIndex: idx,
        started: anyDone || topicPercent(progress, level, next.id) > 0,
        allDone: false,
      };
    }
  }
  // Everything from the floor upward completed — anchor on the last level.
  const last = ALL_LEVELS[ALL_LEVELS.length - 1];
  const topics = getTopicsForLevel(last) || [];
  return { level: last, topics, nextTopic: null, nextIndex: topics.length, started: true, allDone: true };
}

/**
 * The finished topic most worth revisiting, from the placement floor up: the
 * lowest best score first, then the oldest completion (a completion with no
 * date counts as the oldest). null while nothing is finished.
 *
 * The dashboard's Review card opens it. It used to open the next NEW topic —
 * the same link as the hero for B1+ learners — so nothing on the dashboard ever
 * brought back grammar a learner had already learned.
 * @param {object} progress        useProgress() shape
 * @param {string} [placementLevel] profiles.current_level; topics below it are not offered
 * @returns {null | { level: string, topic: object, score: number, completedAt: string|null }}
 */
export function reviewTopic(progress, placementLevel) {
  const floor = normalizeLevel(placementLevel);
  const startIndex = floor ? ALL_LEVELS.indexOf(floor) : 0;
  let best = null;
  for (const level of ALL_LEVELS.slice(startIndex)) {
    for (const topic of getTopicsForLevel(level) || []) {
      const entry = progress?.[level]?.grammarTopics?.[topic.id];
      if (!entry?.completed) continue;
      const score = Number.isFinite(entry.score) ? entry.score : 0;
      const at = Date.parse(entry.completedAt);
      const time = Number.isFinite(at) ? at : 0;
      if (!best || score < best.score || (score === best.score && time < best.time)) {
        best = { level, topic, score, completedAt: entry.completedAt ?? null, time };
      }
    }
  }
  if (!best) return null;
  return { level: best.level, topic: best.topic, score: best.score, completedAt: best.completedAt };
}
