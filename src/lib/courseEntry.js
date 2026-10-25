// Where "the course" is for a given learner — the one place the bottom nav's
// Kurs tab, a free learner's Home tab and the "Continue learning" keys (SPA
// navbar and the Astro layout) resolve their target. Pure, so
// tests/navigation.test.mjs can pin it without React.
//
// The free front door is /course/a1.1 (the rebuilt A1.1 course; FREE_LEVELS in
// src/config/freeTier.js). A learner whose placement (profiles.current_level,
// UPPERCASE in the DB — normalised here) names a level that has a course home
// AND that they may open goes there instead; anyone else lands on the free
// course, never on a level lock.
//
// A BOUGHT course comes first (cross-check 2026-10-25): current_level is
// written only by the placement test, so a buyer who never took it — or was
// placed below what they bought — was sent back to free A1.1 instead of the
// course they paid for. When the placement is missing or below the highest
// owned course level, the owned level wins: the first one at or above the
// placement, reading purchases the way the dashboard's courseLevelFor does
// (src/lib/courseNext.js: newest purchase first, a bundle in ladder order).
// courseNext.js itself is not imported: it pulls every curriculum into the
// entry chunk this file is part of.
import { COURSE_LEVELS } from '../data/courses/levels.js';
import { FREE_LEVELS } from '../config/freeTier.js';
import { levelsForProduct } from '../data/pricing.js';

export const FREE_COURSE_LEVEL = FREE_LEVELS[0];
export const FREE_COURSE_HOME = `/course/${FREE_COURSE_LEVEL}`;

const rank = (level) => COURSE_LEVELS.indexOf(level);

/** Course levels the active purchases own and `may` opens, newest purchase first, each once. */
const ownedCourseLevels = (purchases, may) => {
  const seen = new Set();
  return (Array.isArray(purchases) ? purchases : [])
    .filter((p) => p && (!p.status || p.status === 'active'))
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .flatMap((p) => levelsForProduct(p.product_key))
    .filter((l) => {
      if (seen.has(l) || !COURSE_LEVELS.includes(l) || !may(l)) return false;
      seen.add(l);
      return true;
    });
};

/**
 * @param {object} args
 * @param {string|null|undefined} args.level      profiles.current_level ('B1.1' or 'b1.1')
 * @param {(level: string) => boolean} [args.hasLevelAccess]  SubscriptionContext.hasLevelAccess
 * @param {Array<{product_key: string, status?: string, created_at?: string}>} [args.purchases]
 *        SubscriptionContext.purchases; callers without it keep the placement-only rule
 */
export const courseHomeFor = ({ level, hasLevelAccess, purchases } = {}) => {
  const may = (l) => typeof hasLevelAccess !== 'function' || hasLevelAccess(l);
  const l = String(level || '').toLowerCase();
  const placed = l && COURSE_LEVELS.includes(l) && may(l) ? l : null;
  const owned = ownedCourseLevels(purchases, may);
  if (owned.length && (!placed || rank(placed) < Math.max(...owned.map(rank)))) {
    return `/course/${owned.find((o) => !placed || rank(o) >= rank(placed)) || owned[0]}`;
  }
  if (placed) return `/course/${placed}`;
  return FREE_COURSE_HOME;
};
