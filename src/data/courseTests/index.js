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
import { abschlusstestA12 } from './abschlusstestA12.js';
import { abschlusstestA21 } from './abschlusstestA21.js';
import { abschlusstestA22 } from './abschlusstestA22.js';

export const COURSE_TESTS = [
  {
    key: 'a1_1_abschluss',
    slug: 'abschlusstest-a1-1',
    nameDe: 'Abschlusstest A1.1',
    level: 'a1.1',
    formatOf: 'goethe_a1',
    mock: abschlusstestA11,
  },
  // A1.2 is NOT a free level (src/config/freeTier.js), so resolveModelltest's
  // gateLevel = 'a1.2' makes ExamSubscriptionGuard require Pro/trial or the
  // A1 course purchase — the same gate the A1.2 level and /a1-2-phase use.
  {
    key: 'a1_2_abschluss',
    slug: 'abschlusstest-a1-2',
    nameDe: 'Abschlusstest A1.2',
    level: 'a1.2',
    formatOf: 'goethe_a1',
    mock: abschlusstestA12,
  },
  // A2.1 is a paid level (the A2 band course): gateLevel 'a2.1' makes
  // ExamSubscriptionGuard require Pro/trial or the A2 course — the same gate
  // /level/a2.1 and /a2-1-phase use. Written in the Goethe-Zertifikat A2
  // style (formatOf goethe_a2; the A2 mock itself landed in Wave 5 PR D1).
  {
    key: 'a2_1_abschluss',
    slug: 'abschlusstest-a2-1',
    nameDe: 'Abschlusstest A2.1',
    level: 'a2.1',
    formatOf: 'goethe_a2',
    mock: abschlusstestA21,
  },
  // A2.2 is the second paid half of the A2 band: gateLevel 'a2.2' is the same
  // gate /level/a2.2 and /a2-2-phase use. Goethe-Zertifikat A2 style
  // (formatOf goethe_a2 — a track WITH a mock since Wave 5 PR D1, so the plan's
  // Tag 28 hands off to /modelltest/goethe-a2 after this test).
  {
    key: 'a2_2_abschluss',
    slug: 'abschlusstest-a2-2',
    nameDe: 'Abschlusstest A2.2',
    level: 'a2.2',
    formatOf: 'goethe_a2',
    mock: abschlusstestA22,
  },
];

export const courseTestBySlug = (slug) => COURSE_TESTS.find((t) => t.slug === slug) || null;
export const courseTestByKey = (key) => COURSE_TESTS.find((t) => t.key === key) || null;
