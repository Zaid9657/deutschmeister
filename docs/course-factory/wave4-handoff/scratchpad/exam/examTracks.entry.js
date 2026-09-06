// ─────────────────────────────────────────────────────────────────────────────
// examTracks.entry.js — the object literal to APPEND to EXAM_TRACKS.
//
// This file is NOT shipped. It carries the single entry that has to be pasted
// into BOTH copies of the registry, which are byte-identical twins guarded by
// scripts/check-duplicates.mjs:
//     src/data/examTracks.js
//     astro-site/src/data/examTracks.js
// Editing only one of them fails the duplicate check, not the build — so paste
// twice, or copy one file over the other.
//
// PLACEMENT: insert directly after the `goethe_a1` entry, before `telc_b1`.
// EXAM_TRACKS is rendered in array order on /pruefung/, and A1 → A2 → B1 → B2
// is the order a learner climbs. Anywhere else and the hub lists A2 after B2.
//
// FACT DISCIPLINE (the registry header states it): this entry carries IDENTITY
// ONLY. No minutes, no points, no pass mark — those live in the guide module
// astro-site/src/data/guides/goethe-a2.js with factsCheckedOn + sources, and
// astro-site/src/data/exams/index.js imports them from there.
//
// THE TWO FLAGS, and what each one commits to:
//   hasWriting: true  — requires writingTasks.goethe-a2.js to be merged into
//     src/data/writingTasks.js AND its twin netlify/functions/_shared/
//     writingTasks.mjs in the SAME commit. tests/exams.test.mjs asserts the
//     flag against WRITING_TASKS.some(w => w.examKey === 'goethe_a2'); a true
//     flag without tasks makes the hub advertise a tool that is not there.
//   hasMock: false    — there is no MOCK_EXAMS.goethe_a2 yet. The same test
//     asserts this in both directions, so this stays false until a mock set
//     for A2 exists. (An A2 mock is a separate PR, not a flag flip.)
//
// courseHref: null for now. PR D2 flips it to the A2.1 course landing page
// ('/a2-1-phase'). It is deliberately NOT set here: a non-null courseHref
// renders a "Kurs" link on the hub, and a link to a page that does not exist
// yet is worse than no link. The guide meanwhile already links the SPA course
// area at /level/a2.1 (no trailing slash).
//
// sublevels: ['a2.1', 'a2.2'] — both must exist in src/data/content.js `levels`
// (tests/exams.test.mjs resolves every sublevel against it). The hub derives
// its grammar links from this array, so the order is the learning order.
// ─────────────────────────────────────────────────────────────────────────────

export const goetheA2Track = {
  key: 'goethe_a2',
  slug: 'goethe-a2',
  nameDe: 'Goethe-Zertifikat A2',
  level: 'A2',
  sublevels: ['a2.1', 'a2.2'],
  guideSlug: 'goethe-a2',
  // PR D2 sets this to '/a2-1-phase' once the A2.1 course landing page ships.
  courseHref: null,
  hasMock: false,
  hasWriting: true,
};

// ── The literal to paste, in the registry's own formatting ───────────────────
//
//   {
//     key: 'goethe_a2',
//     slug: 'goethe-a2',
//     nameDe: 'Goethe-Zertifikat A2',
//     level: 'A2',
//     sublevels: ['a2.1', 'a2.2'],
//     guideSlug: 'goethe-a2',
//     // PR D2 flips this to the A2.1 course landing page ('/a2-1-phase').
//     courseHref: null,
//     // No MOCK_EXAMS.goethe_a2 yet; tests/exams.test.mjs pins the flag both
//     // ways, so this stays false until an A2 mock set exists.
//     hasMock: false,
//     hasWriting: true,
//   },
//
// ── Checklist for the PR that lands it ───────────────────────────────────────
// 1. Paste into src/data/examTracks.js AND astro-site/src/data/examTracks.js
//    (byte-identical — `npm run check:duplicates`).
// 2. Register the guide: import goetheA2 in astro-site/src/data/guides/index.js
//    and add it to GUIDES.
// 3. astro-site/src/data/exams/index.js: import goetheA2, add it to
//    GUIDES_BY_SLUG under 'goethe-a2', and add the HUB_COPY.goethe_a2 block
//    from hub-copy.js (tests/exams.test.mjs greps the file for `goethe_a2:`).
// 4. Merge writingTasks.goethe-a2.js into src/data/writingTasks.js and its
//    _shared twin, or hasWriting: true fails the flag test.
// 5. scripts/check-built-html.mjs MANIFEST: add both
//    `leitfaden/goethe-a2/index.html` and `pruefung/goethe-a2/index.html`
//    (tests/exams.test.mjs asserts the pruefung entry for every track).
// 6. tests/guides.test.mjs: the internal-link check has no `/level/` route
//    shape yet. Add '/level/a2.1' to NO_SLASH_ROUTES (or '/level/' to a
//    no-slash prefix list) or the guide's course link fails the suite.
