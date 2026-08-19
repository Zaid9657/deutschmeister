// "Where should this learner go next?" — the one answer, shared.
//
// This walk used to live privately inside DashboardPage and always started at
// A1.1, so a learner placed at B1.2 who hadn't started yet was greeted with
// "Alphabet & Pronunciation". The placement test wrote a level that nothing on
// the dashboard read.
import { getTopicsForLevel } from '../data/grammarTopics';
import { levels as ALL_LEVELS } from '../data/content';
import { sublevelIndex } from '../config/levels';

/** Is a specific topic completed, per useProgress state? */
export const isTopicCompleted = (progress, level, topicId) =>
  !!progress?.[level]?.grammarTopics?.[topicId]?.completed;

/** Per-topic in-progress percent (0..100) from currentStage, else 0. */
export const topicPercent = (progress, level, topicId) => {
  const t = progress?.[level]?.grammarTopics?.[topicId];
  if (!t) return 0;
  if (t.completed) return 100;
  return typeof t.progress === 'number' ? t.progress : 0;
};

/**
 * Earliest level the learner has actually worked in, or -1 for an untouched
 * account. A topic counts as touched once completed or partially worked.
 */
export function firstLevelWithActivity(progress) {
  for (let i = 0; i < ALL_LEVELS.length; i++) {
    const level = ALL_LEVELS[i];
    const topics = getTopicsForLevel(level) || [];
    const touched = topics.some(
      (t) => isTopicCompleted(progress, level, t.id) || topicPercent(progress, level, t.id) > 0
    );
    if (touched) return i;
  }
  return -1;
}

/**
 * The learner's effective current sub-level and next uncompleted topic.
 *
 * The walk starts at their placement level rather than at the bottom of the
 * ladder. Real progress still outranks the placement: unfinished work in an
 * earlier level is where they left off, so the walk starts from there instead —
 * which also keeps the behaviour unchanged for accounts that never sat the test.
 *
 * @param {object} progress  useProgress() state
 * @param {string} [placementLevel]  profiles.current_level, any casing
 */
export function deriveCurrent(progress, placementLevel) {
  const placementIdx = sublevelIndex(placementLevel);
  const activityIdx = firstLevelWithActivity(progress);
  const startIdx = activityIdx === -1 ? placementIdx : Math.min(placementIdx, activityIdx);

  for (const level of ALL_LEVELS.slice(startIdx)) {
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

  // Everything from the starting point on is completed — anchor on the last
  // level for a celebratory state.
  const last = ALL_LEVELS[ALL_LEVELS.length - 1];
  const topics = getTopicsForLevel(last) || [];
  return { level: last, topics, nextTopic: null, nextIndex: topics.length, started: true, allDone: true };
}
