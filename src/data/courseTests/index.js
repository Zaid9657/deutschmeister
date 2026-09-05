// Course-test registry — end-of-course checkpoints, distinct from
// src/data/mockExams (practice for a real external exam) and from
// src/data/examTracks.js EXAM_TRACKS (the exams themselves). A course test
// belongs to one of our own course levels (`level`, lowercase per the level
// convention) and is written in the style of an exam named by `formatOf`
// (an EXAM_TRACKS key) — never a new exam track of its own; see
// tests/exams.test.mjs for the guard that `key` never collides with an
// EXAM_TRACKS key and that `formatOf` always resolves to a real one.
//
// The .js extension matters here too: imported by tests under plain Node
// ESM, same as src/data/mockExams/index.js.

import { abschlusstestA11 } from './abschlusstestA11.js';

export const COURSE_TESTS = [
  {
    key: 'a1_1_abschluss',
    slug: 'abschlusstest-a1-1',
    nameDe: 'Abschlusstest A1.1',
    level: 'a1.1',
    formatOf: 'goethe_a1',
    mock: abschlusstestA11,
  },
];

export const courseTestBySlug = (slug) => COURSE_TESTS.find((t) => t.slug === slug) || null;
export const courseTestByKey = (key) => COURSE_TESTS.find((t) => t.key === key) || null;
