// Curriculum registry — the 12 situational Lektionen of each rebuilt course
// (docs/course-standard-2026-09-12.md §2). A level appears here only once its
// curriculum module is complete and passes tests/curricula.test.mjs; levels
// without an entry keep the legacy 28-day program in the course player.
import { CURRICULUM_A11 } from './a11.js';
import { CURRICULUM_A12 } from './a12.js';
import { CURRICULUM_A21 } from './a21.js';
import { A21_PROMOTED } from './a21-release.js';
import { abschlusstestA21Course } from '../courseTests/abschlusstestA21Course.js';

/**
 * LIVE curricula — what the course player, the checkpoint page and the Astro syllabus
 * render. A level is promoted here only when its lesson pool (lessonPools/<level>.json),
 * its rule-card overrides and its hand-written items exist and a DaF review has signed it
 * off; before that, registering it would switch a PAID course page to an engine with
 * nothing behind it. A1.2 was promoted by owner decision (2026-10-22) after DaF reviews #12–#16;
 * its accepted known issues are listed in docs/course-factory/a12-rebuild/HANDOFF-2026-10-16.md.
 */
export const CURRICULA = { 'a1.1': CURRICULUM_A11, 'a1.2': CURRICULUM_A12, ...(A21_PROMOTED ? { 'a2.1': CURRICULUM_A21 } : {}) };

/** Validated but not yet shipped — see the promotion rule above. */
export const DRAFT_CURRICULA = A21_PROMOTED ? {} : { 'a2.1': CURRICULUM_A21 };

/** Every curriculum module, live or draft — for the validator and the test suites. */
export const ALL_CURRICULA = { ...CURRICULA, ...DRAFT_CURRICULA };

/** The LIVE curriculum for a level (any case), or null when the level is not rebuilt yet. */
export const curriculumFor = (level) => CURRICULA[String(level || '').toLowerCase()] || null;

/** Any curriculum module, live or draft — never for rendering. */
export const anyCurriculumFor = (level) => ALL_CURRICULA[String(level || '').toLowerCase()] || null;

/** The path node a passed final test completes (program_progress item id). */
export const levelTestNodeId = (curriculum) => `${curriculum.level}-leveltest`;

/** The LIVE curriculum whose final test is this Modelltest slug, or null. */
export const curriculumForTestSlug = (slug) => Object.values(CURRICULA).find((c) => c.testSlug && c.testSlug === slug) || null;

/** Flattened path: lektion, checkpoint, lektion … leveltest — what the course home renders. */
export function curriculumPath(curriculum) {
  const path = [];
  for (const l of curriculum.lektionen) {
    path.push({ kind: 'lektion', id: l.id, nr: l.nr, title: l.title, minutes: l.minutes });
    const cp = curriculum.checkpoints.find((c) => c.afterLektion === l.nr);
    if (cp) path.push({ kind: 'checkpoint', id: cp.id, nr: cp.nr, title: cp.title, minutes: 12, afterLektion: l.nr });
  }
  // The rebuilt A2.1 course uses the D4 paper in both draft and promoted states.
  // Keep the live A1 path budgets unchanged.
  const testMinutes = curriculum.level === 'a2.1'
    ? abschlusstestA21Course.sections.reduce((sum, section) => sum + section.minutes, 0)
    : 65;
  path.push({ kind: 'leveltest', id: levelTestNodeId(curriculum), title: `Abschlusstest ${curriculum.code}`, minutes: testMinutes, testSlug: curriculum.testSlug });
  return path;
}
