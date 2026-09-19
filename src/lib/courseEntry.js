// Where "the course" is for a given learner — the one place the bottom nav's
// Kurs tab and a free learner's Home tab resolve their target. Pure, so
// tests/navigation.test.mjs can pin it without React.
//
// The free front door is /course/a1.1 (the rebuilt A1.1 course; FREE_LEVELS in
// src/config/freeTier.js). A learner whose placement (profiles.current_level,
// UPPERCASE in the DB — normalised here) names a level that has a course home
// AND that they may open goes there instead; anyone else lands on the free
// course, never on a level lock.
import { courseFor } from '../data/courses/index.js';
import { FREE_LEVELS } from '../config/freeTier.js';

export const FREE_COURSE_LEVEL = FREE_LEVELS[0];
export const FREE_COURSE_HOME = `/course/${FREE_COURSE_LEVEL}`;

/**
 * @param {object} args
 * @param {string|null|undefined} args.level      profiles.current_level ('B1.1' or 'b1.1')
 * @param {(level: string) => boolean} [args.hasLevelAccess]  SubscriptionContext.hasLevelAccess
 */
export const courseHomeFor = ({ level, hasLevelAccess } = {}) => {
  const l = String(level || '').toLowerCase();
  if (l && courseFor(l) && (typeof hasLevelAccess !== 'function' || hasLevelAccess(l))) return `/course/${l}`;
  return FREE_COURSE_HOME;
};
