// Resolves a /modelltest/:examSlug slug to whichever of the two mock-test
// registries owns it, so ModelltestOverview/Run/Result and
// ExamSubscriptionGuard need not each duplicate the "which registry, which
// gate" branch.
//
//   EXAM_TRACKS + src/data/mockExams — practice for a REAL external exam
//     (Goethe, telc, DTZ). Gate = the exam's band-top sublevel (unchanged
//     access rule: Pro/trial, or that band's course).
//   COURSE_TESTS (src/data/courseTests) — our OWN end-of-course checkpoint,
//     written in an exam's style but not that exam. Gate = the course's own
//     level. a1.1 is a free level (src/config/freeTier.js), so the A1.1
//     Abschlusstest opens to every logged-in user — a recorded decision,
//     not an oversight; see ExamSubscriptionGuard.jsx.
//
// A slug matching neither registry resolves to null; every caller already
// renders the same "kein Übungstest" fallback for that case.

import { examTrackBySlug } from './examTracks.js';
import { mockForExamKey } from './mockExams/index.js';
import { courseTestBySlug } from './courseTests/index.js';

export function resolveModelltest(examSlug) {
  const track = examTrackBySlug(examSlug);
  if (track) {
    const mock = mockForExamKey(track.key);
    if (!mock) return null;
    const gateLevel = track.sublevels?.[track.sublevels.length - 1] || null;
    return { kind: 'exam', key: track.key, slug: track.slug, nameDe: track.nameDe, mock, gateLevel };
  }

  const course = courseTestBySlug(examSlug);
  if (course) {
    return {
      kind: 'course',
      key: course.key,
      slug: course.slug,
      nameDe: course.nameDe,
      mock: course.mock,
      gateLevel: course.level,
    };
  }

  return null;
}
