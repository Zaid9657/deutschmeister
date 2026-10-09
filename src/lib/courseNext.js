// The dashboard's "Continue": the next step of the learner's COURSE. Pure, so
// tests/course-next.test.mjs pins it without React.
//
// WHY. The courses are the product (decision 2026-09-03, re-cut 2026-09-08),
// but the dashboard hero walked the grammar library: a learner who had just
// paid for A1.2 pressed "Keep learning" and landed on a grammar page, and had
// to find the course they bought through the nav. The hero now resumes the
// course; the grammar walk stays the fallback for anyone without one (B1/B2
// learners, a placed level the learner may not open).
//
// WHICH COURSE, in order:
//   1. the most recently bought level course (a ticket is the strongest
//      signal of where someone is), walking a bundle in ladder order;
//   2. the placed level (profiles.current_level, when it is a sub-level);
//   3. the level the grammar walk is on (deriveCurrent), so a beginner on the
//      'a1' default continues the free A1.1 course.
// A candidate counts only when it has a course AND hasLevelAccess opens it,
// so the hero never points at a lock.
//
// PROGRESS lives in program_progress under two keys: the rebuilt A1.1
// curriculum writes `<level>_course` (CurriculumHomePage.programKeyFor), the
// 28-day programs write their own PROGRAM_KEY. programKeyForCourse picks the
// one the course home of that level reads.
import { courseFor } from '../data/courses/index.js';
import { curriculumFor, curriculumPath } from '../data/curricula/index.js';
import { courseForProduct } from '../data/pricing.js';
import { flattenCourse, currentItem, courseLesson } from './courseFlow.js';
import { placedSublevel } from './firstRun.js';

const lower = (level) => String(level || '').trim().toLowerCase();

/** The program_progress key the course home of `level` reads, or null when the level has no course. */
export const programKeyForCourse = (level) => {
  const l = lower(level);
  if (curriculumFor(l)) return `${l.replace(/\./g, '')}_course`;
  return courseFor(l)?.programKey || null;
};

/** Where a curriculum node opens — the same routes CurriculumHomePage links (SPA, no trailing slash). */
export const curriculumNodeHref = (level, node) => {
  if (node.kind === 'lektion') return `/course/${level}/l/${node.nr}`;
  if (node.kind === 'checkpoint') return `/course/${level}/checkpoint/${node.nr}`;
  return `/modelltest/${node.testSlug}`;
};

/**
 * @param {object} args
 * @param {Array<{product_key: string, created_at?: string}>} [args.purchases]  SubscriptionContext.purchases
 * @param {string|null|undefined} [args.currentLevel]  profiles.current_level ('A1.2', 'a1', …)
 * @param {string|null|undefined} [args.walkLevel]     deriveCurrent(…).level
 * @param {(level: string) => boolean} [args.hasLevelAccess]
 * @returns {string|null} the course level to continue, lowercase
 */
export function courseLevelFor({ purchases = [], currentLevel, walkLevel, hasLevelAccess } = {}) {
  const may = (l) => typeof hasLevelAccess !== 'function' || hasLevelAccess(l);
  const bought = [...purchases]
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .flatMap((p) => courseForProduct(p.product_key)?.levels || []);
  for (const l of [...bought, placedSublevel(currentLevel), lower(walkLevel)]) {
    if (l && courseFor(l) && may(l)) return l;
  }
  return null;
}

/**
 * The next step of `level`'s course given the ids program_progress holds.
 *
 * @returns {null | {
 *   kind: 'step', level: string, code: string, title: string, minutes: number|null,
 *   href: string, position: number, total: number, done: number, started: boolean,
 * } | {
 *   kind: 'complete', level: string, code: string, next: string|null, total: number,
 * }}
 */
export function courseNextStep(level, doneIds = new Set()) {
  const l = lower(level);
  const course = courseFor(l);
  if (!course) return null;
  const curriculum = curriculumFor(l);
  const nodes = curriculum
    ? curriculumPath(curriculum).map((n) => ({ id: n.id, title: n.title, minutes: n.minutes ?? null, href: curriculumNodeHref(l, n) }))
    : flattenCourse(course).map((it) => ({ id: it.id, title: it.title, minutes: it.minutes ?? null, href: courseLesson(l, it.id) }));
  const done = nodes.filter((n) => doneIds.has(n.id)).length;
  const position = curriculum
    ? nodes.findIndex((n) => !doneIds.has(n.id))
    : (() => { const cur = currentItem(flattenCourse(course), doneIds); return cur ? cur.position : -1; })();
  if (position === -1) return { kind: 'complete', level: l, code: course.code, next: course.next || null, total: nodes.length };
  const n = nodes[position];
  return {
    kind: 'step', level: l, code: course.code, title: n.title, minutes: n.minutes, href: n.href,
    position, total: nodes.length, done, started: done > 0,
  };
}
