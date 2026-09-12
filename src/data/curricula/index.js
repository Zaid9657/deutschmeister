// Curriculum registry — the 12 situational Lektionen of each rebuilt course
// (docs/course-standard-2026-09-12.md §2). A level appears here only once its
// curriculum module is complete and passes tests/curricula.test.mjs; levels
// without an entry keep the legacy 28-day program in the course player.
import { CURRICULUM_A11 } from './a11.js';

export const CURRICULA = { 'a1.1': CURRICULUM_A11 };

/** The curriculum for a level (any case), or null when the level is not rebuilt yet. */
export const curriculumFor = (level) => CURRICULA[String(level || '').toLowerCase()] || null;

/** Flattened path: lektion, checkpoint, lektion … leveltest — what the course home renders. */
export function curriculumPath(curriculum) {
  const path = [];
  for (const l of curriculum.lektionen) {
    path.push({ kind: 'lektion', id: l.id, nr: l.nr, title: l.title, minutes: l.minutes });
    const cp = curriculum.checkpoints.find((c) => c.afterLektion === l.nr);
    if (cp) path.push({ kind: 'checkpoint', id: cp.id, nr: cp.nr, title: cp.title, minutes: 12, afterLektion: l.nr });
  }
  path.push({ kind: 'leveltest', id: `${curriculum.level}-leveltest`, title: `Abschlusstest ${curriculum.code}`, minutes: 65, testSlug: curriculum.testSlug });
  return path;
}
