// Which level opens a /modelltest/:examSlug page — and nothing else.
//
// ExamSubscriptionGuard is imported eagerly by App.jsx and needs only this
// lookup, but it called resolveModelltest (./modelltest.js), which imports every
// mock exam and Abschlusstest body: ~68 KB minified (~19 KB gzipped) of the SPA
// entry chunk that every first visit downloads, signup and the first A1.1
// lesson included. The full resolver stays with the lazy Modelltest pages;
// tests/entry-chunk-mocks.test.mjs pins this lookup to it for every slug, so
// the two cannot drift.
//
// The rule is resolveModelltest's: an exam track opens at its band's TOP
// sublevel (never the first: a1.1 is free, so gating on it would open the A1
// mock to everyone), and resolves only when the track has a mock; a course test
// opens at its course's own level. Any other slug resolves to null.
import { EXAM_TRACKS } from './examTracks.js';

// src/data/courseTests/index.js COURSE_TESTS, slug → level (lowercase).
const COURSE_TEST_LEVELS = new Map([
  ['abschlusstest-a1-1', 'a1.1'],
  ['abschlusstest-a1-2', 'a1.2'],
  ['abschlusstest-a2-1', 'a2.1'],
  ['abschlusstest-a2-2', 'a2.2'],
]);

/** resolveModelltest(slug) reduced to its gate: { gateLevel } or null. */
export function resolveModelltestGate(slug) {
  const track = EXAM_TRACKS.find((t) => t.slug === slug);
  if (track) {
    if (!track.hasMock) return null;
    return { gateLevel: track.sublevels?.[track.sublevels.length - 1] || null };
  }
  const level = COURSE_TEST_LEVELS.get(slug);
  return level ? { gateLevel: level } : null;
}
