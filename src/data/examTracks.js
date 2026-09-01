// ─────────────────────────────────────────────────────────────────────────────
// THE exam-track registry — the four exams DeutschMeister prepares for.
//
// Byte-identical twin: src/data/examTracks.js ⟷ astro-site/src/data/examTracks.js
// (drift-guarded by scripts/check-duplicates.mjs). The Astro exam hubs
// (/pruefung/*), the SPA dashboard and the future mock-exam runner all key off
// this module, so an exam exists exactly once.
//
// FACT DISCIPLINE: this file carries IDENTITY only (keys, slugs, names, CEFR
// level, which library sublevels feed the track, which guide documents the
// exam). Exam FACTS — points, sections, pass thresholds — live in the guide
// modules (astro-site/src/data/guides/*) with factsCheckedOn + sources, and
// are imported from there, never retyped here.
//
// `key` is the stable machine identifier (profiles.exam_track, mock exam and
// writing-task keys); `slug` is the URL form under /pruefung/.
// ─────────────────────────────────────────────────────────────────────────────

export const EXAM_TRACKS = [
  {
    key: 'telc_b1',
    slug: 'telc-b1',
    nameDe: 'telc Deutsch B1',
    level: 'B1',
    sublevels: ['b1.1', 'b1.2'],
    guideSlug: 'telc-b1',
    // The one exam with a purchasable course today (see src/data/pricing.js COURSES)
    courseHref: '/telc-b1-komplettvorbereitung/',
    // Which exam tools have content for this track. Pinned against the actual
    // content modules by tests/exams.test.mjs — a flag here can never drift
    // from src/data/mockExams / src/data/writingTasks.
    hasMock: true,
    hasWriting: true,
  },
  {
    key: 'goethe_b1',
    slug: 'goethe-b1',
    nameDe: 'Goethe-Zertifikat B1',
    level: 'B1',
    sublevels: ['b1.1', 'b1.2'],
    guideSlug: 'goethe-b1',
    courseHref: null,
    hasMock: false,
    hasWriting: false,
  },
  {
    key: 'dtz',
    slug: 'dtz',
    nameDe: 'DTZ (Deutsch-Test für Zuwanderer)',
    level: 'A2–B1',
    sublevels: ['a2.2', 'b1.1'],
    guideSlug: 'dtz',
    courseHref: null,
    hasMock: false,
    hasWriting: false,
  },
  {
    key: 'telc_b2',
    slug: 'telc-b2',
    nameDe: 'telc Deutsch B2',
    level: 'B2',
    sublevels: ['b2.1', 'b2.2'],
    guideSlug: 'telc-b2',
    courseHref: null,
    hasMock: false,
    hasWriting: true,
  },
];

export const examTrackByKey = (key) => EXAM_TRACKS.find((t) => t.key === key) || null;
export const examTrackBySlug = (slug) => EXAM_TRACKS.find((t) => t.slug === slug) || null;

// Rendered wherever practice material in an exam's style appears. Legal line:
// we prepare FOR these exams; we are not them, and we never claim official
// material or predict a pass (the guides' fact-discipline rules apply here too).
export const MOCK_DISCLAIMER_DE =
  'Übungsmaterial im Stil der Prüfung — kein offizielles Prüfungsmaterial. ' +
  'telc, Goethe-Zertifikat und DTZ sind Marken bzw. Prüfungen ihrer jeweiligen Anbieter; ' +
  'DeutschMeister steht in keiner Verbindung zu ihnen. Bewertungen hier sind Richtwerte ' +
  'nach den öffentlich dokumentierten Kriterien, keine offizielle Bewertung.';
