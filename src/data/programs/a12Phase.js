// "A1.2-Phase: 28 Tage bis zum Abschlusstest" — a dated, backward-planned study
// plan over the SECOND half of the A1 band. Same shape, item factories,
// comment discipline and derive-never-retype rule as a11Phase.js and
// startDeutsch1.js — see a11Phase.js's header for the full rationale; not
// repeated here.
//
// Product framing (docs/course-research-2026-09-03.md §2 + the A1.1/A1.2 split
// in the parent brief): this plan is the SECOND of two courses on the road to
// Start Deutsch 1. It picks up where a11Phase.js's "Abschlusstest A1.1" left
// off and ends at its own half-length, half-content mock — the
// "Abschlusstest A1.2" — not at the real exam. Only the FULL Start Deutsch 1
// plan (startDeutsch1.js, route /start-deutsch-1-kurs — confirmed in
// src/App.jsx / netlify.toml) sits in front of the real Goethe exam; Tag 28
// carries a final "Weiter" item linking to it directly, and the Woche-4 intro
// names it once. Per the brief, A1.1 owns the Formular writing task; A1.2
// owns the Mitteilung task — this plan links only Mitteilung practice, never
// Formular.
//
// Same-wave forward references this module depends on but does not itself
// ship (see notes.md for what's verified today vs. still pending):
//   - four a1.2 grammar slugs — imperative, stem-changing-verbs,
//     perfekt-intro, dative-prepositions-intro — landing in grammarTopics.js
//     alongside the 8 that already exist there today;
//   - two exam-format reading lessons, "Lesen Teil 1: Zwei kurze E-Mails" and
//     "Lesen Teil 2: Anzeigen zu Wohnen und Arbeit" (order_index 9/10);
//   - a second, dictation-flavoured pass over listening exercises 1–6;
//   - the course test at /modelltest/abschlusstest-a1-2 (Probe on Tag 26,
//     final on Tag 28, type 'exam') — same URL-shape-safe, data-pending
//     pattern a11Phase.js used for /modelltest/abschlusstest-a1-1 before that
//     landed.
//
// Item `type` values drive the icon/label on the course page (mirrors
// A11PhasePage's TYPE_ICON map — the only types the runner styles):
//   lesson | listening | reading | speaking | xray | exam | review
// There is no dedicated "writing" or "vocabulary" type; the Mitteilung task,
// the "Weiter" hand-off item and both mock-exam items use 'exam', and the
// weekly SRS item reuses 'review' (closest styled type) — distinguished by
// title, same convention as a11Phase.js.

import { getTopicsForLevel } from '../grammarTopics.js';
import { writingTasksForExam } from '../writingTasks.js';

export const PROGRAM_KEY = 'a12_phase';

export const PROGRAM_TITLE = 'A1.2-Phase: 28 Tage bis zum Abschlusstest';

// -----------------------------------------------------------------------
// Grammar topics — all 12 REQUIRED at load time
// -----------------------------------------------------------------------
// This module ships once all 12 a1.2 slugs exist in grammarTopics.js (8
// today + 4 landing in this same wave: imperative, stem-changing-verbs,
// perfekt-intro, dative-prepositions-intro). Exactly like a11Phase.js, there
// is NO silent-drop guard — a missing slug throws at import time with the
// exact slug names, so CI fails loudly instead of quietly shipping a course
// with fewer than 12 lessons. Sequencing below is PEDAGOGICAL, not
// `topic_order` — lessons are looked up by slug, not by array index.
const a12 = getTopicsForLevel('a1.2');
const bySlug = (slug) => a12.find((t) => t.slug === slug);

const A12_LESSON_SLUGS_IN_ORDER = [
  'basic-sentence-structure',
  'question-words',
  'nominative-case',
  'accusative-intro',
  'negation',
  'stem-changing-verbs',
  'numbers-counting',
  'modal-verbs-intro',
  'prepositions-accusative',
  'imperative',
  'dative-prepositions-intro',
  'perfekt-intro',
];

const missingA12Slugs = A12_LESSON_SLUGS_IN_ORDER.filter((slug) => !bySlug(slug));
if (missingA12Slugs.length > 0) {
  throw new Error(
    `a12Phase.js requires all 12 a1.2 grammar topics to exist in grammarTopics.js — ` +
      `missing: ${missingA12Slugs.join(', ')}. This program is not importable until they land.`
  );
}

// Grammar lessons are served by the Astro build (trailing-slash class) — see
// the three-place route rule and CLAUDE.md's trailing-slash case 1. `external`
// makes the course page render a full-load <a>, since the SPA carries no
// lesson route of its own. titleDe is used (not titleEn) — this plan's copy
// is German end to end. Minutes come from `topic.estimatedTime` — a real
// topic's real time is used automatically, never guessed here (the four
// pending slugs' minutes are therefore also whatever grammarTopics.js gives
// them once they land, not the placeholder this module's own verify.mjs
// stubs in the meantime — see notes.md).
const gLesson = (slug) => {
  const topic = bySlug(slug);
  return {
    id: `a1.2-${topic.slug}`,
    type: 'lesson',
    title: topic.titleDe,
    minutes: topic.estimatedTime || 20,
    href: `/grammar/a1.2/${topic.slug}/`,
    external: true,
  };
};

// Spaced review: re-links the SAME lesson 1–2 days after it was introduced.
// Distinct item id (`review-<slug>`) from the lesson's own id, so a learner
// can tick both independently and progress accounting never collides.
const gReview = (slug, minutes = 20) => {
  const topic = bySlug(slug);
  return {
    id: `review-${topic.slug}`,
    type: 'review',
    title: `Wiederholen — ${topic.titleDe}`,
    minutes,
    href: `/grammar/a1.2/${topic.slug}/`,
    external: true,
  };
};

// A single non-topic-specific review, for consolidation days that aren't
// reviewing one just-taught lesson but pointing back at the whole set — same
// hub-link pattern a11Phase.js's `hubReview` uses. No slug to resolve, so no
// throw risk. Tag 13's "die Themen dieser Woche" is fine as the only such
// item in its week; Tag 6 and Tag 7 are both in Woche 1, so round 1's shared
// phrase there made two checkboxes on consecutive days read identically —
// each now names its own scope instead (Tag 6: the two already-taught
// topics; Tag 7: all three). Tag 20's and Tag 21's items keep their own
// wider-scope wording ("deine zwei schwächsten Themen", "die neun
// bisherigen Themen") because they genuinely cover more than one week.
const hubReview = (id, title, minutes) => ({ id, type: 'review', title, minutes, href: '/grammar/a1.2/', external: true });

// -----------------------------------------------------------------------
// Speaking — the 12 REAL published A1.2 missions
// -----------------------------------------------------------------------
// Sourced from scratchpad/source/speaking-missions-a1.json (read 2026-09-05):
// filtering that file for level === "A1.2" gives exactly 12 rows
// (mission_order 1–12), matching the brief's count including the two rows
// created today (2026-09-05) at mission_order 9 and 12. title_de is copied
// verbatim (derived, never retyped from memory). `targetStructures` is a
// short, condensed label derived from each row's real `target_structures`
// column (queried live 2026-09-05) — carried here, not just in a comment, so
// the grammar dependency that decides placement in WEEKS is visible at the
// call site instead of only inferred from day numbers. Missions 9 and 12
// have no single grammar prerequisite (Teil 1 is a general self-intro
// rehearsal; Teil 3's target IS a grammar item — the imperative — captured
// below).
//
// Review round 1 found four missions scheduled before the very lesson their
// target_structures names (M3/M4/M7/M8 all landed too early). The table
// below fixes that: every mission's `prereqSlug` is a real slug from
// A12_LESSON_SLUGS_IN_ORDER (or null), and WEEKS places `speaking(id, order)`
// on or after the day that slug's `gLesson()` call appears — verify.mjs
// checks this directly rather than trusting the ordering by eye.
const A12_SPEAKING_MISSIONS = [
  { order: 1, titleDe: 'Anmeldung beim Hausarzt', targetStructures: 'Verb an Position 2 (Aussagesätze)', prereqSlug: 'basic-sentence-structure' },
  { order: 2, titleDe: 'Meine Familie', targetStructures: 'Nominativ (Subjektformen)', prereqSlug: 'nominative-case' },
  { order: 3, titleDe: 'Einkaufen im Supermarkt', targetStructures: 'Akkusativ-Objekt (einen/eine/ein)', prereqSlug: 'accusative-intro' },
  { order: 4, titleDe: 'Zugzeiten am Bahnhof', targetStructures: 'Zahlen bis 100, Uhrzeiten, Preise', prereqSlug: 'numbers-counting' },
  { order: 5, titleDe: 'Nach dem Weg fragen', targetStructures: 'Fragewörter (wo, wie, wohin, wie lange, wie weit)', prereqSlug: 'question-words' },
  { order: 6, titleDe: 'Eine Einladung absagen', targetStructures: 'Verneinung (nicht/kein)', prereqSlug: 'negation' },
  { order: 7, titleDe: 'Die Hausordnung', targetStructures: 'Modalverben (können, dürfen, müssen)', prereqSlug: 'modal-verbs-intro' },
  { order: 8, titleDe: 'Kaffee für das Team', targetStructures: 'Akkusativpräpositionen (für, ohne, um)', prereqSlug: 'prepositions-accusative' },
  { order: 9, titleDe: 'Sprechen Teil 1: Sich komplett vorstellen', targetStructures: 'Wiederholung: Selbstvorstellung (kein neues Thema)', prereqSlug: null },
  { order: 10, titleDe: 'Sprechen Teil 2: Fragen mit Wortkarten (Thema Essen & Trinken)', targetStructures: 'W-Fragen / Ja-Nein-Fragen (Wortstellung, kein neues Thema)', prereqSlug: null },
  { order: 11, titleDe: 'Sprechen Teil 2: Fragen mit Wortkarten (Thema Wohnen & Alltag)', targetStructures: 'W-Fragen / Ja-Nein-Fragen (Wortstellung, kein neues Thema)', prereqSlug: null },
  { order: 12, titleDe: 'Sprechen Teil 3: Bitten formulieren', targetStructures: 'Bitte + Imperativ (Sie-Form) / Können Sie bitte…?', prereqSlug: 'imperative' },
];
const missionByOrder = (order) => {
  const m = A12_SPEAKING_MISSIONS.find((x) => x.order === order);
  if (!m) throw new Error(`a12Phase.js: no A1.2 speaking mission with order ${order}`);
  return m;
};

// Speaking missions have no per-mission SPA route (App.jsx: a single
// "/speaking" route with no :level or :missionId param) — same generic hub
// href a11Phase.js and startDeutsch1.js use ("/speaking/", trailing slash:
// case 2 of the trailing-slash rule, a prerendered hub). Missions 9–12's
// title_de already reads "Sprechen Teil N: …", so wrapping it in the generic
// "Sprechen: Mission „…“" frame used for missions 1–8 would say "Sprechen"
// twice and nest a colon inside quotes — `label()` below branches on that
// instead of applying one frame to all twelve.
const label = (titleDe) => (titleDe.startsWith('Sprechen Teil') ? titleDe : `Sprechen: Mission „${titleDe}“`);

const speaking = (id, order, minutes = 15) => ({
  id,
  type: 'speaking',
  title: label(missionByOrder(order).titleDe),
  minutes,
  href: '/speaking/',
});

// The one repeat: mission 12 (Bitten formulieren, Teil 3) again, at least
// three days after its first attempt (Tag 22 → Tag 25 below), framed as
// rehearsal rather than a first attempt — true now that the two are actually
// spaced, unlike round 1's same-day pairing.
const speakingRepeat = (id, order, minutes = 15) => {
  const t = missionByOrder(order).titleDe;
  return {
    id,
    type: 'speaking',
    title: t.startsWith('Sprechen Teil') ? `${t} — noch einmal üben` : `${label(t)} noch einmal üben`,
    minutes,
    href: '/speaking/',
  };
};

// -----------------------------------------------------------------------
// Listening — first pass (weeks 1–2), then a reuse/dictation pass (weeks 3–4)
// -----------------------------------------------------------------------
// A1.2 has 6 listening exercises (docs/research/audit-a1-content-2026-09-03.md
// §3: "12 listening exercises A1.1 #1-6 + A1.2 #1-6") and deep-links via the
// real SPA route /listening/:level/:exerciseNumber — no trailing slash, case
// 3 of the trailing-slash rule (a dynamic route with params).
const listening = (id, n, minutes = 15) => ({
  id,
  type: 'listening',
  title: `Hören: A1.2-Dialoge, Übung ${n}`,
  minutes,
  href: `/listening/a1.2/${n}`,
});

// The six exercises' real titles (queried live from `listening_exercises`,
// level=A1.2, 2026-09-05 — all status=completed). Round 1 found the fixed
// "Zahlen, Preise, Wege" suffix true only of exercises 1–2 and false of 3–6
// ("Im Büro", "Freizeitaktivitäten", "Wohnung und Haus", "Wetter und
// Jahreszeiten"); `listeningReuse` below names the real exercise instead of
// a guessed theme, and that also makes the six second-pass titles distinct
// from one another.
const A12_LISTENING_TITLES = {
  1: 'Beim Einkaufen',
  2: 'Wegbeschreibungen',
  3: 'Im Büro',
  4: 'Freizeitaktivitäten',
  5: 'Wohnung und Haus',
  6: 'Wetter und Jahreszeiten',
};
const listeningReuse = (id, n, minutes = 15) => {
  const title = A12_LISTENING_TITLES[n];
  if (!title) throw new Error(`a12Phase.js: no A1.2 listening exercise title for exercise ${n}`);
  return {
    id,
    type: 'listening',
    title: `Hören: Übung ${n} noch einmal — Diktat zu „${title}“`,
    minutes,
    href: `/listening/a1.2/${n}`,
  };
};

// -----------------------------------------------------------------------
// Reading — exactly 10 items: 8 generic + 2 exam-format (added this wave)
// -----------------------------------------------------------------------
// Reading lessons are addressed by a hub link (/reading/a1.2, no trailing
// slash, case 3) rather than a per-lesson id — not because the ids can't be
// found offline (wave3/source/reading-a1.2.json carries all eight, verified
// against the live `reading_lessons` table row for row) but because the hub
// rotates content and a per-lesson id would pin this plan to rows that can
// be re-ordered or replaced later; the hub reference stays correct either
// way. `n` is out of a fixed 10 so the title can say "Text N von 10" without
// the count ever drifting from what this file actually contains.
const READING_TOTAL = 10;
const reading = (id, n, minutes = 15) => ({
  id,
  type: 'reading',
  title: `Lesen: Text ${n} von ${READING_TOTAL}`,
  minutes,
  href: '/reading/a1.2',
});

// Reading lessons 9 and 10 — the two exam-format Lesen tasks named in the
// brief (order_index 9/10) — ship in this same wave, added to the A1.2 hub.
// Numbered against the same READING_TOTAL as items 1–8 (round 1 flagged that
// "Text N von 10" only ever reached 8 before this fix — items 9/10 switched
// prefix entirely and the denominator promised a count the titles then
// abandoned). Both land in Woche 4 before Tag 26, never on or after it.
const readingLesen9 = (id, minutes = 20) => ({
  id,
  type: 'reading',
  title: `Lesen: Text 9 von ${READING_TOTAL} — Teil 1: Zwei kurze E-Mails`,
  minutes,
  href: '/reading/a1.2',
});
const readingLesen10 = (id, minutes = 20) => ({
  id,
  type: 'reading',
  title: `Lesen: Text 10 von ${READING_TOTAL} — Teil 2: Anzeigen zu Wohnen und Arbeit`,
  minutes,
  href: '/reading/a1.2',
});

// The spaced-repetition trainer lives at the dedicated /vocabulary route
// (VocabularySectionPage.jsx renders SrsTrainer there — same route
// a11Phase.js's own `srsReview` uses). Used once per week (4 total), per the
// brief — unlike a11Phase.js this plan does not also browse per-category
// vocabulary lists day to day (that item family, `vocab()`, is an a11Phase.js
// invention not requested here; see notes.md for the deliberate omission).
const srsReview = (id, weekLabel, minutes = 25) => ({
  id,
  type: 'review',
  title: `Wortschatz-Wiederholung: deine Karteikarten aus ${weekLabel}`,
  minutes,
  href: '/vocabulary',
});

const xray = (id, minutes = 20, title = 'X-Ray: fünf Sätze aus dieser Woche') => ({
  id,
  type: 'xray',
  title,
  minutes,
  href: '/analyze/',
});

// Exam-format orientation, day 1 only — reused verbatim from a11Phase.js
// (same guide, same route: astro-site/src/data/guides/start-deutsch-1.js,
// external:true, trailing slash — case 1/2). A learner arriving at A1.2
// fresh (without having done A1.1's Tag 1) still gets the orientation once.
const orientation = (id, minutes = 20) => ({
  id,
  type: 'exam',
  title: 'Prüfungsüberblick: Ablauf und Punkteregel von Start Deutsch 1',
  minutes,
  href: '/leitfaden/start-deutsch-1/',
  external: true,
});

// -----------------------------------------------------------------------
// Writing — the Mitteilung task (A1.2 owns it; A1.1 owns Formular)
// -----------------------------------------------------------------------
// src/data/writingTasks.js carries six goethe_a1 tasks with taskKey starting
// "mitteilung-" (Teil 2 of the same exam whose Teil-1 Formular tasks
// a11Phase.js links). MITTEILUNG_TASKS/-TOTAL are derived from that array,
// never retyped. Same route a11Phase.js's `schreiben` uses
// (/schreiben/start-deutsch-1, netlify.toml wildcards "/schreiben/*", no
// trailing slash — case 3) — SchreibenPage.jsx lists all twelve goethe_a1
// tasks by title, unnumbered, so round 1 correctly flagged "Aufgabe N von 6"
// as a number the learner can never find there; the real task title (also
// derived from the same array, never retyped) replaces it instead. Every
// bank title already begins "Mitteilung: " (it's the taskKey family's own
// naming, not this module's) — round 1's fix reintroduced the very stutter
// it had just removed from the speaking titles ("… (Teil 2) — Mitteilung:
// Termin absagen"), so the leading "Mitteilung: " the frame already supplies
// is stripped before appending the real title.
const MITTEILUNG_TASKS = writingTasksForExam('goethe_a1').filter((t) => t.taskKey.startsWith('mitteilung-'));
const MITTEILUNG_TOTAL = MITTEILUNG_TASKS.length;
const schreiben = (id, taskNumber, minutes = 25) => {
  if (taskNumber < 1 || taskNumber > MITTEILUNG_TOTAL) {
    throw new Error(`a12Phase.js: Mitteilung task number ${taskNumber} out of range (1-${MITTEILUNG_TOTAL})`);
  }
  const shortTitle = MITTEILUNG_TASKS[taskNumber - 1].title.replace(/^Mitteilung:\s*/, '');
  return {
    id,
    type: 'exam',
    title: `Schreiben: kurze Mitteilung (Teil 2) — ${shortTitle}`,
    minutes,
    href: '/schreiben/start-deutsch-1',
  };
};

// The rehearsal (ungraded) and the final (graded) half-length mock. UNVERIFIED
// DEPENDENCY, same forward-reference pattern a11Phase.js used for
// /modelltest/abschlusstest-a1-1: the route /modelltest/abschlusstest-a1-2
// names a mock-exam module + EXAM_TRACKS entry that does not exist in this
// repo as of 2026-09-05 (grepped: no "abschlusstest-a1-2" hit anywhere). The
// generic SPA route /modelltest/:examSlug already exists and netlify.toml
// already wildcards "/modelltest/*" (no trailing slash, case 3), so the URL
// SHAPE is safe; only the exam DATA behind the slug is pending. See notes.md.
const modelltest = (id, title, minutes) => ({
  id,
  type: 'exam',
  title,
  minutes,
  href: '/modelltest/abschlusstest-a1-2',
});

// Hand-off to the next course, Tag 28 only — a real, clickable exit rather
// than only plain-text prose (the Woche-4 `intro` renders inside a bare
// `<p>` and cannot itself carry an href). Route confirmed live: App.jsx:176
// mounts StartDeutsch1KursPage at this exact path and netlify.toml:266
// redirects it to /app.html — an exact-match SPA route, no trailing slash
// (case 3), so `external` is correctly omitted (a normal in-app <Link>).
const nextCourse = (id, minutes = 5) => ({
  id,
  type: 'exam',
  title: 'Weiter: die 30-Tage-Prüfungsphase zu Start Deutsch 1',
  minutes,
  href: '/start-deutsch-1-kurs',
});

// -----------------------------------------------------------------------
// The plan
// -----------------------------------------------------------------------
// 28 days, 4 weeks of 7. 55–75 minutes/day, except two lighter "Puffertage"
// (Tag 14 and Tag 27, ≤40 min, review + vocabulary only — no new content).
//
// The 12 grammar lessons run in PEDAGOGICAL order (not topic_order), 3 per
// week across all four weeks (unlike a11Phase.js's 4/4/4/0 split — A1.2's
// Woche 4 still carries new grammar because there is no exam-format-only
// week here; the two exam-format Lesen tasks and the Mitteilung finale share
// Woche 4 with imperative/dative-prepositions-intro/perfekt-intro instead):
//   Woche 1 (Tag 1–7):   basic-sentence-structure (Tag 1), question-words
//                        (Tag 2), nominative-case (Tag 4)
//   Woche 2 (Tag 8–14):  accusative-intro (Tag 8), negation (Tag 9),
//                        stem-changing-verbs (Tag 11)
//   Woche 3 (Tag 15–21): numbers-counting (Tag 15), modal-verbs-intro
//                        (Tag 16), prepositions-accusative (Tag 18)
//   Woche 4 (Tag 22–28): imperative (Tag 22), dative-prepositions-intro
//                        (Tag 23), perfekt-intro (Tag 24)
// Each lesson's review lands 1–2 days after its own introduction (verified
// programmatically in verify.mjs; see notes.md for the per-lesson table).
//
// The 8 non-exam-format speaking missions are placed on or after the day
// above that teaches their `prereqSlug` (round-1 fix — see the table's own
// comment): M1→Tag 2, M2→Tag 4, M5→Tag 5, M3→Tag 8, M6→Tag 11, M10→Tag 13
// (no grammar prereq — only needs question-words + word order, both done by
// Tag 4), M9→Tag 15 (Teil 1, no prereq), M4→Tag 16, M8→Tag 18, M7→Tag 19,
// M12→Tag 22 (right after `imperative`, its actual target), M11→Tag 23,
// M12 repeat→Tag 25 (3 days after its first attempt — a real repeat, not a
// same-day double-booking).
//
// Tag 1 gives a first win inside 25 minutes: item 1 is the first grammar
// lesson (basic-sentence-structure, 20 min), item 2 is a 5-minute X-Ray
// pass — instant AI feedback — before the day continues into orientation
// and reading.
//
// Week-intro length decision (round-2 delta finding 19): the register doc's
// "≤12 words/sentence" and the coordinator's "≤2 sentences per intro" pull
// against each other once an intro has to name several distinct things
// (lesson list, Mitteilung, a speaking mission, Hörübungen, the readiness
// bar). The coordinator's ≤2-sentence cap wins for this plan-chrome prose —
// each intro below is exactly 2 sentences, using semicolons/parentheses to
// keep individual clauses short rather than adding a third sentence or a
// Nebensatz. verify.mjs checks sentence COUNT (≤2), not per-sentence word
// count, for these intros.
const WEEKS = [
  {
    title: 'Woche 1 — Satzbau, Fragen und der erste Fall',
    intro:
      'Diese Woche: Satzbau, Fragewörter, Nominativ — jedes Thema mit Wiederholung nach 1–2 Tagen. ' +
      'Danach bist du bereit für Woche 2.',
    days: [
      {
        label: 'Tag 1',
        items: [
          gLesson('basic-sentence-structure'),
          xray('d1-xray', 5, 'X-Ray: dein erster Satz — sofortige Analyse durch das X-Ray-Tool'),
          orientation('d1-orientation'),
          reading('d1-reading', 1),
        ],
      },
      {
        label: 'Tag 2',
        items: [gLesson('question-words'), listening('d2-listening', 1), speaking('d2-speaking', 1), xray('d2-xray', 20)],
      },
      {
        label: 'Tag 3',
        items: [gReview('basic-sentence-structure'), gReview('question-words'), reading('d3-reading', 2)],
      },
      {
        label: 'Tag 4',
        items: [gLesson('nominative-case'), listening('d4-listening', 2), speaking('d4-speaking', 2), reading('d4-reading', 3)],
      },
      {
        label: 'Tag 5',
        items: [listening('d5-listening', 3), speaking('d5-speaking', 5), reading('d5-reading', 4), xray('d5-xray', 20)],
      },
      {
        label: 'Tag 6',
        items: [gReview('nominative-case'), xray('d6-xray', 25), hubReview('d6-review', 'Wiederholen: Satzbau und Fragewörter', 15)],
      },
      {
        label: 'Tag 7',
        items: [srsReview('d7-srs', 'Woche 1', 25), xray('d7-xray', 20), hubReview('d7-review', 'Wiederholen: alle drei Themen der Woche', 20)],
      },
    ],
  },
  {
    title: 'Woche 2 — Akkusativ, Verneinung und die erste Mitteilung',
    intro:
      'Diese Woche: Akkusativ, Verneinung, erste unregelmäßige Verben — damit sind sechs von zwölf Themen ' +
      'behandelt, dazu deine erste Mitteilung und eine Sprechmission im Prüfungsformat Teil 2. ' +
      'Danach bist du bereit für Woche 3.',
    days: [
      {
        label: 'Tag 8',
        items: [gLesson('accusative-intro'), listening('d8-listening', 4), speaking('d8-speaking', 3)],
      },
      {
        label: 'Tag 9',
        items: [gLesson('negation'), reading('d9-reading', 5), xray('d9-xray')],
      },
      {
        label: 'Tag 10',
        items: [gReview('accusative-intro'), gReview('negation'), listening('d10-listening', 5)],
      },
      {
        label: 'Tag 11',
        items: [gLesson('stem-changing-verbs'), schreiben('d11-schreiben', 1), speaking('d11-speaking', 6)],
      },
      {
        label: 'Tag 12',
        items: [gReview('stem-changing-verbs'), listening('d12-listening', 6), reading('d12-reading', 6), xray('d12-xray', 20)],
      },
      {
        label: 'Tag 13',
        items: [speaking('d13-speaking', 10), xray('d13-xray', 20), hubReview('d13-review', 'Wiederholen: die Themen dieser Woche', 20)],
      },
      {
        label: 'Tag 14 — Puffertag',
        items: [srsReview('d14-srs', 'Woche 2', 25), hubReview('d14-review2', 'Wiederholen: deine zwei schwächsten Themen', 15)],
      },
    ],
  },
  {
    title: 'Woche 3 — Modalverben, Präpositionen und Sprechen im Prüfungsformat',
    intro:
      'Diese Woche: Zahlen, Modalverben, Präpositionen mit Akkusativ — neun von zwölf Themen behandelt, ' +
      'deine zweite Mitteilung, die Hörübungen 1–3 als Diktat; in drei Sprechmissionen übst du diese Themen, ' +
      'dazu eine Mission im Prüfungsformat Teil 1. Danach bist du bereit für Woche 4.',
    days: [
      {
        label: 'Tag 15',
        items: [gLesson('numbers-counting'), listeningReuse('d15-listening', 1), speaking('d15-speaking', 9), xray('d15-xray')],
      },
      {
        label: 'Tag 16',
        items: [gLesson('modal-verbs-intro'), reading('d16-reading', 7), xray('d16-xray', 20), speaking('d16-speaking', 4)],
      },
      {
        label: 'Tag 17',
        items: [gReview('numbers-counting'), gReview('modal-verbs-intro'), listeningReuse('d17-listening', 2)],
      },
      {
        label: 'Tag 18',
        items: [gLesson('prepositions-accusative'), speaking('d18-speaking', 8), reading('d18-reading', 8), xray('d18-xray', 20)],
      },
      {
        label: 'Tag 19',
        items: [gReview('prepositions-accusative'), schreiben('d19-schreiben', 3), listeningReuse('d19-listening', 3), speaking('d19-speaking', 7)],
      },
      {
        label: 'Tag 20',
        items: [srsReview('d20-srs', 'Woche 3', 25), hubReview('d20-review', 'Wiederholen: deine zwei schwächsten Themen aus Woche 3', 20), xray('d20-xray', 25)],
      },
      {
        label: 'Tag 21',
        items: [hubReview('d21-review', 'Wiederholen: die neun bisherigen Themen', 45), xray('d21-xray', 20)],
      },
    ],
  },
  {
    title: 'Woche 4 — Die letzten Themen, dann der Abschlusstest',
    intro:
      'Diese Woche: Imperativ, Dativpräpositionen, Perfekt — alle zwölf Themen behandelt, dazu zwei der drei ' +
      'Lesen-Aufgabenformate der echten Prüfung (kurze E-Mails, Anzeigen; Schilder kennst du aus A1.1), deine ' +
      'dritte Mitteilung, deine letzten beiden Sprechmissionen (Teil 2 und Teil 3, Teil 3 danach noch einmal) ' +
      'und die Hörübungen 4–6 als Diktat. Nach dem Probe- und dem gewerteten Abschlusstest A1.2 zeigt dir dein ' +
      'Ergebnis die nächsten Themen — danach startet die 30-Tage-Prüfungsphase zu Start Deutsch 1.',
    days: [
      {
        label: 'Tag 22',
        items: [gLesson('imperative'), readingLesen9('d22-reading'), listeningReuse('d22-listening', 4), speaking('d22-speaking', 12)],
      },
      {
        label: 'Tag 23',
        items: [gLesson('dative-prepositions-intro'), speaking('d23-speaking', 11), listeningReuse('d23-listening', 5), xray('d23-xray', 20)],
      },
      {
        label: 'Tag 24',
        items: [gLesson('perfekt-intro'), gReview('imperative'), gReview('dative-prepositions-intro')],
      },
      {
        label: 'Tag 25',
        items: [readingLesen10('d25-reading'), schreiben('d25-schreiben', 5), speakingRepeat('d25-speaking-repeat', 12)],
      },
      {
        label: 'Tag 26',
        items: [gReview('perfekt-intro'), listeningReuse('d26-listening', 6), modelltest('d26-probe', 'Probe-Abschlusstest A1.2 (ungewertet, halbe Länge)', 40)],
      },
      {
        label: 'Tag 27 — Puffertag',
        items: [srsReview('d27-srs', 'Woche 4', 25), hubReview('d27-review', 'Wiederholen: deine letzten drei Themen', 15)],
      },
      {
        label: 'Tag 28',
        items: [
          xray('d28-xray', 20, 'X-Ray: letztes Aufwärmen vor der Prüfung'),
          modelltest('d28-abschlusstest', 'Abschlusstest A1.2 (gewertet, halbe Länge, Start-Deutsch-1-Format)', 50),
          nextCourse('d28-next'),
        ],
      },
    ],
  },
];

// Derived, never retyped: the sum of every item's minutes across all 28
// days, computed from WEEKS directly so PROGRAM.subtitle can quote the same
// number it derives — read PROGRAM_MINUTES itself for the current, always-
// accurate figure rather than trusting a number retyped into this comment.
// Last checked 2026-09-05 (round 2, after the speaking re-map) against the
// real grammarTopics.js (8 of 12 a1.2 slugs live) with the four pending slugs
// stubbed by verify.mjs at 20/20/25/20 minutes (imperative/stem-changing-
// verbs/perfekt-intro/dative-prepositions-intro — placeholders only; the
// real figure will come from grammarTopics.js once those land, and may shift
// PROGRAM_MINUTES slightly): see verify.mjs's own console output for the
// exact current total (it prints PROGRAM_MINUTES and its hour equivalent on
// every run) — every day is 55–75 min except the two Puffertage (Tag 14,
// Tag 27, both ≤40) and the total sits inside the requested 1700–1900-minute
// range; see a12Phase.notes.md for the per-day transcript.
export const PROGRAM_MINUTES = WEEKS.reduce(
  (sum, w) => sum + w.days.reduce((daySum, d) => daySum + d.items.reduce((s, i) => s + i.minutes, 0), 0),
  0
);

// Round to a whole hour — no false precision (a plan built from single-digit
// minute estimates cannot honestly claim tenths of an hour).
export const PROGRAM_HOURS = Math.round(PROGRAM_MINUTES / 60);

export const PROGRAM = {
  key: PROGRAM_KEY,
  title: PROGRAM_TITLE,
  subtitle:
    `Ca. ${PROGRAM_HOURS} Stunden in 28 Tagen, 55–75 Minuten pro Tag — die zweite Phase auf dem Weg zu Start ` +
    'Deutsch 1, mit dem Abschlusstest A1.2 als Etappenziel. Danach folgt die 30-Tage-Prüfungsphase zu Start Deutsch 1.',
  weeks: WEEKS,
};

/** Flat list of every item id, for progress accounting. */
export const allItemIds = () =>
  PROGRAM.weeks.flatMap((w) => w.days.flatMap((d) => d.items.map((i) => i.id)));
