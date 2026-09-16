// Curriculum registry — the 12 situational Lektionen of each rebuilt course
// (docs/course-standard-2026-09-12.md §2). A level appears here only once its
// curriculum module is complete and passes tests/curricula.test.mjs; levels
// without an entry keep the legacy 28-day program in the course player.
import { CURRICULUM_A11 } from './a11.js';
import { CURRICULUM_A12 } from './a12.js';

/**
 * LIVE curricula — what the course player, the checkpoint page and the Astro syllabus
 * render. A level is promoted here only when its lesson pool (lessonPools/<level>.json),
 * its rule-card overrides and its hand-written items exist and a DaF review has signed it
 * off; before that, registering it would switch a PAID course page to an engine with
 * nothing behind it. A1.2 is a validated DRAFT (2026-09-13): validator and tests see it
 * through ALL_CURRICULA, the app does not.
 */
export const CURRICULA = { 'a1.1': CURRICULUM_A11 };

/** Validated but not yet shipped — see the promotion rule above. */
export const DRAFT_CURRICULA = { 'a1.2': CURRICULUM_A12 };

/** Every curriculum module, live or draft — for the validator and the test suites. */
export const ALL_CURRICULA = { ...CURRICULA, ...DRAFT_CURRICULA };

/** The LIVE curriculum for a level (any case), or null when the level is not rebuilt yet. */
export const curriculumFor = (level) => CURRICULA[String(level || '').toLowerCase()] || null;

/** Any curriculum module, live or draft — never for rendering. */
export const anyCurriculumFor = (level) => ALL_CURRICULA[String(level || '').toLowerCase()] || null;

/** Flattened path: lektion, checkpoint, lektion … leveltest — what the course home renders. */
export function curriculumPath(curriculum) {
  const path = [];
  for (const l of curriculum.lektionen) {
    path.push({ kind: 'lektion', id: l.id, nr: l.nr, title: l.title, minutes: l.minutes });
    const cp = curriculum.checkpoints.find((c) => c.afterLektion === l.nr);
    if (cp) path.push({ kind: 'checkpoint', id: cp.id, nr: cp.nr, title: cp.title, minutes: 12, afterLektion: l.nr });
  }
  // Both rebuilt A1 completion tests are deliberately shortened 40-minute
  // passes (15 Hören + 15 Lesen + 10 Schreiben). Do not display the old
  // full-test estimate on the course path.
  path.push({ kind: 'leveltest', id: `${curriculum.level}-leveltest`, title: `Abschlusstest ${curriculum.code}`, minutes: 40, testSlug: curriculum.testSlug });
  return path;
}

/** Program-progress key shared by the course home and route-level access checks. */
export const curriculumProgramKey = (level) => `${String(level || '').toLowerCase().replace('.', '')}_course`;

/**
 * A curriculum node is reachable when it is the first node, already complete,
 * or immediately follows a completed node. Keeping this rule pure lets the
 * course map and the actual routes enforce the same sequence.
 */
export function curriculumNodeUnlocked(path, nodeId, doneSet) {
  const index = (path || []).findIndex((node) => node.id === nodeId);
  if (index < 0 || !(doneSet instanceof Set)) return false;
  return index === 0 || doneSet.has(nodeId) || doneSet.has(path[index - 1].id);
}
