// "A1.1-Phase: 28 Tage bis zum Abschlusstest" — a dated, backward-planned study
// plan over the first half of the A1 band. Same shape, item factories, comments
// discipline and derive-never-retype rule as startDeutsch1.js (30-day SD1
// plan) and telcB1Komplett.js — see startDeutsch1.js's header for the full
// rationale; not repeated here.
//
// Product framing (docs/course-research-2026-09-03.md §2 + the A1.1/A1.2 split
// in the parent brief): this plan is the FIRST of two courses on the road to
// Start Deutsch 1. It ends at a half-length, half-content mock — the
// "Abschlusstest A1.1" — not at the real exam. The A1.2 course (not this file)
// picks up from there, and only the FULL Start Deutsch 1 plan
// (startDeutsch1.js) sits in front of the real Goethe exam. Per the brief,
// A1.1 owns the Formular writing task; the Mitteilung task belongs to A1.2 —
// this plan links only Formular practice.
//
// Same-wave forward references this module depends on but does not itself
// ship: the two exam-format reading lessons (Text 9/10 — Anzeigen, Schilder),
// the Diktat-flavoured listening titles for exercises 1–6, and the
// /modelltest/abschlusstest-a1-1 exam data all land in PRs C and D before
// this module is merged — see the per-item comments below and
// a11Phase.notes.md for what's verified today vs. still pending.
//
// Item `type` values drive the icon/label on the course page (mirrors
// StartDeutsch1KursPage's TYPE_ICON map — the only types the runner styles):
//   lesson | listening | reading | speaking | xray | exam | review
// There is no dedicated "writing" or "vocabulary" type; the Formular task and
// both mock-exam items use 'exam', and vocabulary-tab browsing reuses
// 'reading' (closest styled types) — distinguished by title, same convention
// as startDeutsch1.js.

import { getTopicsForLevel } from '../grammarTopics.js';

export const PROGRAM_KEY = 'a11_phase';

export const PROGRAM_TITLE = 'A1.1-Phase: 28 Tage bis zum Abschlusstest';

// -----------------------------------------------------------------------
// Grammar topics — all 12 REQUIRED at load time
// -----------------------------------------------------------------------
// This module ships once all 12 a1.1 slugs exist in grammarTopics.js (8
// today + 4 landing in this same wave: possessive-articles,
// separable-verbs-intro, yes-no-questions, time-and-dates). Unlike an
// earlier draft, there is NO silent-drop guard here: a missing slug throws
// at import time with the exact slug names, so a CI run (or any test that
// imports this module) fails loudly instead of quietly shipping a course
// with fewer than 12 lessons. Sequencing below is PEDAGOGICAL, not
// `topic_order` — lessons are looked up by slug, not by array index.
const a11 = getTopicsForLevel('a1.1');
const bySlug = (slug) => a11.find((t) => t.slug === slug);

const A11_LESSON_SLUGS_IN_ORDER = [
  'nouns-gender',
  'definite-articles',
  'personal-pronouns',
  'verb-sein',
  'alphabet-pronunciation',
  'yes-no-questions',
  'verb-haben',
  'indefinite-articles',
  'possessive-articles',
  'present-tense-regular',
  'separable-verbs-intro',
  'time-and-dates',
];

const missingA11Slugs = A11_LESSON_SLUGS_IN_ORDER.filter((slug) => !bySlug(slug));
if (missingA11Slugs.length > 0) {
  throw new Error(
    `a11Phase.js requires all 12 a1.1 grammar topics to exist in grammarTopics.js — ` +
      `missing: ${missingA11Slugs.join(', ')}. This program is not importable until they land.`
  );
}

// Grammar lessons are served by the Astro build (trailing-slash class) — see
// the three-place route rule and CLAUDE.md's trailing-slash case 1. `external`
// makes the course page render a full-load <a>, since the SPA carries no
// lesson route of its own. titleDe is used (not titleEn): this plan's copy is
// German end to end, and grammarTopics.js already carries a titleDe field —
// still derived, never retyped. Minutes come from `topic.estimatedTime` — a
// real topic's real time is used automatically, never guessed here.
const gLesson = (slug) => {
  const topic = bySlug(slug);
  return {
    id: `a1.1-${topic.slug}`,
    type: 'lesson',
    title: topic.titleDe,
    minutes: topic.estimatedTime || 20,
    href: `/grammar/a1.1/${topic.slug}/`,
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
    href: `/grammar/a1.1/${topic.slug}/`,
    external: true,
  };
};

// A single non-topic-specific review, for the one consolidation day (Tag 25)
// that isn't reviewing a particular just-taught lesson but pointing back at
// the whole set — same hub-link pattern startDeutsch1.js's and
// telcB1Komplett.js's `review`/`w4-review` items use. No slug to resolve, so
// no throw risk.
const hubReview = (id, title, minutes) => ({ id, type: 'review', title, minutes, href: '/grammar/a1.1/', external: true });

// -----------------------------------------------------------------------
// Speaking — the 8 REAL published A1.1 missions
// -----------------------------------------------------------------------
// Sourced from scratchpad/source/speaking-missions-a1.json (read 2026-09-05):
// filtering that file for level === "A1.1" gives 8 rows (mission_order 1–8),
// not the 9 the brief mentioned — this table is the real, verified count.
// title_de is copied verbatim (derived, never retyped from memory).
const A11_SPEAKING_MISSIONS = [
  { order: 1, titleDe: 'Ankunft im Hostel' },
  { order: 2, titleDe: 'Auf dem Flohmarkt' },
  { order: 3, titleDe: 'Im Klassenzimmer' },
  { order: 4, titleDe: 'Einkaufen für die Wohnung' },
  { order: 5, titleDe: 'Über Leute sprechen' },
  { order: 6, titleDe: 'Neue Nachbarn' },
  { order: 7, titleDe: 'Im Café' },
  { order: 8, titleDe: 'Ein ganz normaler Tag' },
];
const missionByOrder = (order) => {
  const m = A11_SPEAKING_MISSIONS.find((x) => x.order === order);
  if (!m) throw new Error(`a11Phase.js: no A1.1 speaking mission with order ${order}`);
  return m;
};

// Speaking missions have no per-mission SPA route (App.jsx: a single
// "/speaking" route with no :level or :missionId param) — same generic hub
// href startDeutsch1.js and telcB1Komplett.js use ("/speaking/", trailing
// slash: case 2 of the trailing-slash rule, a prerendered hub). Each of the 8
// real missions is used at most once by title.
const speaking = (id, order, minutes = 15) => ({
  id,
  type: 'speaking',
  title: `Sprechen: Mission „${missionByOrder(order).titleDe}“ (A1.1)`,
  minutes,
  href: '/speaking/',
});

// Week-4 repeats: the same mission again, framed as Teil-1 (self-introduction
// / spelling) rehearsal rather than a first attempt.
const speakingRepeat = (id, order, minutes = 15) => ({
  id,
  type: 'speaking',
  title: `Sprechen: Mission „${missionByOrder(order).titleDe}“ noch einmal — Teil 1 üben`,
  minutes,
  href: '/speaking/',
});

// -----------------------------------------------------------------------
// Listening — first pass (weeks 1–2), then a reuse/dictation pass (weeks 3–4)
// -----------------------------------------------------------------------
// A1.1 has 6 listening exercises (docs/research/audit-a1-content-2026-09-03.md
// §3) and deep-links via the real SPA route /listening/:level/:exerciseNumber
// — no trailing slash, case 3 of the trailing-slash rule (a dynamic route
// with params).
const listening = (id, n, minutes = 15) => ({
  id,
  type: 'listening',
  title: `Hören: A1.1-Dialoge, Übung ${n}`,
  minutes,
  href: `/listening/a1.1/${n}`,
});

// The same 6 exercises are getting extra questions and number/time dictation
// items in this same wave — the brief's "getting extra questions and
// number/time dictation items in this wave" note. This second pass links the
// identical route (the content behind it changes, not the URL) with a title
// that says what's new.
const listeningReuse = (id, n, minutes = 15) => ({
  id,
  type: 'listening',
  title: `Hören: Übung ${n} noch einmal — Zahlen, Uhrzeiten, Termine (Diktat)`,
  minutes,
  href: `/listening/a1.1/${n}`,
});

// -----------------------------------------------------------------------
// Reading — exactly 10 items: 8 generic + 2 exam-format (added this wave)
// -----------------------------------------------------------------------
// Reading lessons are addressed by a DB-issued lessonId that cannot be
// verified offline, so — exactly like startDeutsch1.js and
// telcB1Komplett.js — this links the level hub (/reading/a1.1, no trailing
// slash, case 3) rather than a fabricated per-lesson id. Reused across many
// days on purpose: the hub itself rotates content. `n` is out of a fixed 10
// so the title can say "Text N von 10" without the count ever drifting from
// what this file actually contains.
const READING_TOTAL = 10;
const reading = (id, n, minutes = 15) => ({
  id,
  type: 'reading',
  title: `Lesen: Text ${n} von ${READING_TOTAL}`,
  minutes,
  href: '/reading/a1.1',
});

// Reading lessons 9 and 10 — Anzeigen and Schilder/Aushänge, the two Lesen
// task formats the real exam actually uses (Teil 2 and Teil 3) — ship in
// this same wave, added to the A1.1 hub. Same hub href; the title alone
// carries the exam-format framing.
const readingAnzeigen = (id, minutes = 20) => ({
  id,
  type: 'reading',
  title: 'Lesen: Anzeigen (wie in der Prüfung, Teil 2)',
  minutes,
  href: '/reading/a1.1',
});
const readingSchilder = (id, minutes = 20) => ({
  id,
  type: 'reading',
  title: 'Lesen: Schilder und Aushänge (wie in der Prüfung, Teil 3)',
  minutes,
  href: '/reading/a1.1',
});

// Vocabulary categories, sourced from scratchpad/source/words-a1.1.json (read
// 2026-09-05): that file currently carries 10 distinct `category` values —
// Basic Questions, Basic Verbs (sein haben), Classroom Objects, Colors, Days
// of the Week, Family (immediate), Greetings & Farewells, Numbers 1-20,
// Personal Pronouns, Yes No Maybe — not the 20 the brief mentioned, same
// "fewer rows than claimed" situation as the speaking missions above,
// disclosed rather than papered over. 5 more are landing in this same wave
// (also named in the brief: Countries & Languages, Jobs & Work, Forms &
// Registration, Drinks, Time & Appointments). 15 known category names total.
// The 18 vocab() calls below spell out the category explicitly at each call
// site (never inferred from call order) and cycle through all 15 once, the
// most exam-relevant first, then repeat the 3 highest-priority categories
// for the last 3 slots as a second exam-focused pass rather than inventing 3
// more unverified category names.
const A11_VOCAB_CATEGORIES = {
  FORMS: 'Forms & Registration', // landing this wave
  COUNTRIES: 'Countries & Languages', // landing this wave
  TIME: 'Time & Appointments', // landing this wave
  JOBS: 'Jobs & Work', // landing this wave
  DRINKS: 'Drinks', // landing this wave
  NUMBERS: 'Numbers 1-20',
  FAMILY: 'Family (immediate)',
  GREETINGS: 'Greetings & Farewells',
  QUESTIONS: 'Basic Questions',
  VERBS: 'Basic Verbs (sein haben)',
  CLASSROOM: 'Classroom Objects',
  COLORS: 'Colors',
  DAYS: 'Days of the Week',
  PRONOUNS: 'Personal Pronouns',
  YESNO: 'Yes No Maybe',
};

// The A1.1 vocabulary tab: LevelPage.jsx's TAB_IDS defaults to 'vocabulary'
// when no ?tab= is present, so the bare hub link already lands there — no
// query string needed (case 3, dynamic route, no trailing slash).
const vocab = (id, category, minutes = 15) => ({
  id,
  type: 'reading',
  title: `Wortschatz: ${category} — in den Trainer`,
  minutes,
  href: '/level/a1.1',
});

// The spaced-repetition trainer lives at the dedicated /vocabulary route
// (VocabularySectionPage.jsx renders SrsTrainer there — confirmed by grep:
// src/pages/VocabularySectionPage.jsx:11,223) — a normal SPA route with no
// :param, no trailing slash (case 3). Used once, on the second Puffertag.
const srsReview = (id, minutes) => ({
  id,
  type: 'review',
  title: 'Wortschatz-Wiederholung: deine Karteikarten aus den vier Wochen',
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

// Exam-format orientation, day 1 only. The Leitfaden ships in the same wave
// at slug 'start-deutsch-1' (astro-site/src/data/guides/start-deutsch-1.js,
// already present and read for this plan's own hour budget) — static Astro
// page, external:true, trailing slash (case 1/2). Same link
// startDeutsch1.js's `orientation()` uses — reused verbatim.
const orientation = (id, minutes = 20) => ({
  id,
  type: 'exam',
  title: 'Prüfungsüberblick: Ablauf und Punkteregel von Start Deutsch 1',
  minutes,
  href: '/leitfaden/start-deutsch-1/',
  external: true,
});

// The A1 Formular task, on three separate days (Tag 12, 20, 26). Same route
// startDeutsch1.js's `schreiben` helper uses (/schreiben/start-deutsch-1,
// netlify.toml wildcards "/schreiben/*", no trailing slash — case 3) — this
// plan links only the Formular half of that exam's writing tasks per the
// brief (A1.1 owns Formular; A1.2 owns Mitteilung). SchreibenPage.jsx renders
// by examSlug + task type, so the generic exam-slug route is correct; it
// cannot be narrowed to "Formular only" at the URL level, hence the title
// says so instead. "Aufgabe N von 6" numbers this against the 6-task
// Formular bank (task 1, then 3, then 5 — every other task, spread across
// the three writing days).
const schreiben = (id, taskNumber, minutes = 25) => ({
  id,
  type: 'exam',
  title: `Schreiben: Formular ausfüllen (Aufgabe ${taskNumber} von 6)`,
  minutes,
  href: '/schreiben/start-deutsch-1',
});

// The rehearsal (ungraded) and the final (graded) half-length mock. UNVERIFIED
// DEPENDENCY: the route /modelltest/abschlusstest-a1-1 names a mock-exam
// module + EXAM_TRACKS entry that does not exist in this repo as of
// 2026-09-05 (grepped: no "abschlusstest" hit anywhere). The brief states it
// "is being built in the same wave." The generic SPA route
// /modelltest/:examSlug already exists and netlify.toml already wildcards
// "/modelltest/*" (no trailing slash, case 3), so the URL SHAPE is safe;
// only the exam DATA behind the slug is pending — same forward-reference
// pattern startDeutsch1.js used for /schreiben/start-deutsch-1 and
// /modelltest/start-deutsch-1 before those existed. See notes.md.
const modelltest = (id, title, minutes) => ({
  id,
  type: 'exam',
  title,
  minutes,
  href: '/modelltest/abschlusstest-a1-1',
});

// Hand-off to the next course, Tag 28 only — a real, clickable exit rather
// than only plain-text prose (the Woche-4 `intro` renders inside a bare
// `<p>` and cannot itself carry an href). Points at the A1.2-Phase plan
// (/a1-2-phase, A12PhasePage.jsx via App.jsx + the netlify.toml allow-list —
// an exact-match SPA route, no trailing slash, case 3, so `external` is
// correctly omitted), not straight at the 30-day Start-Deutsch-1 plan: that
// one starts where A1.2 ends (see a12Phase.js's own `nextCourse`).
const nextCourse = (id, minutes = 5) => ({
  id,
  type: 'exam',
  title: 'Weiter mit A1.2: die zweite Phase bis zum Abschlusstest A1.2',
  minutes,
  href: '/a1-2-phase',
});

// -----------------------------------------------------------------------
// The plan
// -----------------------------------------------------------------------
// 28 days, 4 weeks of 7. 55–75 minutes/day, except two lighter "Puffertage"
// (Tag 14 and Tag 27, ≤40 min, review + vocabulary only — no new content).
//
// The 12 grammar lessons run in PEDAGOGICAL order (not topic_order), 4 per
// week across weeks 1–3 (week 4 has none — it's the exam-format/consolidation
// week):
//   Woche 1: nouns-gender, definite-articles, personal-pronouns, verb-sein
//   Woche 2: alphabet-pronunciation, yes-no-questions, verb-haben, indefinite-articles
//   Woche 3: possessive-articles, present-tense-regular, separable-verbs-intro, time-and-dates
// Each lesson's review lands 1–2 days after its own introduction — most pairs
// share a "review both" day (Tag 3, 6, 10, 17, 20); two reviews land on days
// that already carry other content instead (Tag 12 alongside the first
// Formular task, Tag 14 as that week's Puffertag) so no lesson ever waits
// more than 2 days for its review.
//
// Tag 1 gives a first win inside 25 minutes: item 1 is the first grammar
// lesson (nouns-gender, already lesson 1 of A1.1, 20 min), item 2 is a
// 5-minute X-Ray pass — instant AI feedback — before the day continues into
// orientation and reading.
const WEEKS = [
  {
    title: 'Woche 1 — Die ersten vier Themen',
    intro:
      'Nomen und Genus, bestimmte Artikel, Personalpronomen, das Verb "sein" — vier Themen, jedes mit ' +
      'Wiederholung 1–2 Tage später. Du bist bereit für Woche 2, wenn dir alle vier Themen vertraut vorkommen.',
    days: [
      {
        label: 'Tag 1',
        items: [
          gLesson('nouns-gender'),
          xray('d1-xray', 5, 'X-Ray: dein erster Satz — sofortige Analyse durch das X-Ray-Tool'),
          orientation('d1-orientation'),
          reading('d1-reading', 1),
        ],
      },
      {
        label: 'Tag 2',
        items: [gLesson('definite-articles'), listening('d2-listening', 1), vocab('d2-vocab', A11_VOCAB_CATEGORIES.FORMS), xray('d2-xray')],
      },
      {
        label: 'Tag 3',
        items: [gReview('nouns-gender'), gReview('definite-articles'), reading('d3-reading', 2), speaking('d3-speaking', 1)],
      },
      {
        label: 'Tag 4',
        items: [gLesson('personal-pronouns'), listening('d4-listening', 2), vocab('d4-vocab', A11_VOCAB_CATEGORIES.COUNTRIES), xray('d4-xray')],
      },
      {
        label: 'Tag 5',
        items: [gLesson('verb-sein'), listening('d5-listening', 3), speaking('d5-speaking', 2), vocab('d5-vocab', A11_VOCAB_CATEGORIES.TIME)],
      },
      {
        label: 'Tag 6',
        items: [gReview('personal-pronouns'), gReview('verb-sein'), reading('d6-reading', 3), xray('d6-xray')],
      },
      {
        label: 'Tag 7',
        items: [speaking('d7-speaking', 3, 15), vocab('d7-vocab', A11_VOCAB_CATEGORIES.JOBS, 20), xray('d7-xray', 20)],
      },
    ],
  },
  {
    title: 'Woche 2 — Vier weitere Themen, dazu das Formular',
    intro:
      'Aussprache, Ja/Nein-Fragen, das Verb "haben", unbestimmte Artikel — nach dieser Woche sind alle acht ' +
      'ersten A1.1-Themen behandelt, dazu deine erste Schreibaufgabe (Formular ausfüllen). Du bist bereit für ' +
      'Woche 3, wenn dir alle acht Themen bisher vertraut vorkommen.',
    days: [
      {
        label: 'Tag 8',
        items: [gLesson('alphabet-pronunciation'), listening('d8-listening', 4), reading('d8-reading', 4), vocab('d8-vocab', A11_VOCAB_CATEGORIES.DRINKS)],
      },
      {
        label: 'Tag 9',
        items: [gLesson('yes-no-questions'), listening('d9-listening', 5), speaking('d9-speaking', 4), xray('d9-xray')],
      },
      {
        label: 'Tag 10',
        items: [gReview('alphabet-pronunciation'), gReview('yes-no-questions'), reading('d10-reading', 5), listening('d10-listening', 6)],
      },
      {
        label: 'Tag 11',
        items: [gLesson('verb-haben'), speaking('d11-speaking', 5), vocab('d11-vocab', A11_VOCAB_CATEGORIES.NUMBERS), xray('d11-xray')],
      },
      {
        label: 'Tag 12',
        items: [schreiben('d12-schreiben', 1), gReview('verb-haben'), reading('d12-reading', 6)],
      },
      {
        label: 'Tag 13',
        items: [gLesson('indefinite-articles'), speaking('d13-speaking', 6), vocab('d13-vocab', A11_VOCAB_CATEGORIES.FAMILY), xray('d13-xray')],
      },
      {
        label: 'Tag 14 — Puffertag',
        items: [gReview('indefinite-articles'), vocab('d14-vocab', A11_VOCAB_CATEGORIES.GREETINGS)],
      },
    ],
  },
  {
    title: 'Woche 3 — Die letzten vier Themen, dann Sprechen fertig',
    intro:
      'Possessivartikel, Präsens regelmäßiger Verben, trennbare Verben, Zeit und Datum — die letzten vier ' +
      'Grammatikthemen; damit sind alle zwölf A1.1-Themen behandelt. Dazu die zweite Schreibaufgabe, deine ' +
      'letzten beiden der acht Sprechmissionen, und die Hörübungen 1–3 kommen mit neuen Diktat-Aufgaben (Zahlen, ' +
      'Uhrzeiten, Termine) zurück. Du bist bereit für Woche 4, wenn alle zwölf Themen einmal wiederholt sind.',
    days: [
      {
        label: 'Tag 15',
        items: [gLesson('possessive-articles'), speaking('d15-speaking', 7), vocab('d15-vocab', A11_VOCAB_CATEGORIES.QUESTIONS), xray('d15-xray')],
      },
      {
        label: 'Tag 16',
        items: [gLesson('present-tense-regular'), reading('d16-reading', 7), vocab('d16-vocab', A11_VOCAB_CATEGORIES.VERBS)],
      },
      {
        label: 'Tag 17',
        items: [gReview('possessive-articles'), gReview('present-tense-regular'), listeningReuse('d17-listening', 1), speaking('d17-speaking', 8)],
      },
      {
        label: 'Tag 18',
        items: [gLesson('separable-verbs-intro'), reading('d18-reading', 8), vocab('d18-vocab', A11_VOCAB_CATEGORIES.CLASSROOM), xray('d18-xray')],
      },
      {
        label: 'Tag 19',
        items: [gLesson('time-and-dates'), listeningReuse('d19-listening', 2), vocab('d19-vocab', A11_VOCAB_CATEGORIES.COLORS), xray('d19-xray')],
      },
      {
        label: 'Tag 20',
        items: [schreiben('d20-schreiben', 3), gReview('separable-verbs-intro'), gReview('time-and-dates')],
      },
      {
        label: 'Tag 21',
        items: [listeningReuse('d21-listening', 3, 20), vocab('d21-vocab', A11_VOCAB_CATEGORIES.DAYS, 20), xray('d21-xray', 20)],
      },
    ],
  },
  {
    title: 'Woche 4 — Prüfungsformat, dann der Abschlusstest',
    intro:
      'Kein neues Grammatikthema mehr — stattdessen die zwei Lesen-Aufgabenformate, die die echte Prüfung ' +
      'tatsächlich stellt (Anzeigen, Schilder), die Hörübungen 4–6 noch einmal mit Zahlen und Uhrzeiten, zwei ' +
      'deiner Sprechmissionen noch einmal, deine dritte Schreibaufgabe, ein Probe-Abschlusstest und zuletzt der ' +
      'gewertete Abschlusstest A1.1. Fertig, wenn der Abschlusstest absolviert ist. Dein Ergebnis zeigt dir, ' +
      'welche Themen du vor A1.2 noch einmal ansehen solltest. Weiter geht es mit der A1.2-Phase.',
    days: [
      {
        label: 'Tag 22',
        items: [listeningReuse('d22-listening', 4), vocab('d22-vocab', A11_VOCAB_CATEGORIES.PRONOUNS), xray('d22-xray'), speakingRepeat('d22-speaking', 1)],
      },
      {
        label: 'Tag 23',
        items: [readingAnzeigen('d23-reading'), listeningReuse('d23-listening', 5), vocab('d23-vocab', A11_VOCAB_CATEGORIES.YESNO), xray('d23-xray')],
      },
      {
        label: 'Tag 24',
        items: [readingSchilder('d24-reading'), listeningReuse('d24-listening', 6), vocab('d24-vocab', A11_VOCAB_CATEGORIES.FORMS), speakingRepeat('d24-speaking', 6)],
      },
      {
        label: 'Tag 25',
        items: [vocab('d25-vocab', A11_VOCAB_CATEGORIES.COUNTRIES, 20), xray('d25-xray', 20), hubReview('d25-review', 'Wiederholen: deine zwei schwächsten Themen', 25)],
      },
      {
        label: 'Tag 26',
        items: [schreiben('d26-schreiben', 5), modelltest('d26-probe', 'Probe-Abschlusstest A1.1 (ungewertet, halbe Länge)', 40)],
      },
      {
        label: 'Tag 27 — Puffertag',
        items: [srsReview('d27-srs', 25), vocab('d27-vocab', A11_VOCAB_CATEGORIES.TIME)],
      },
      {
        label: 'Tag 28',
        items: [
          xray('d28-xray', 20, 'X-Ray: letztes Aufwärmen vor der Prüfung'),
          modelltest('d28-abschlusstest', 'Abschlusstest A1.1 (gewertet, halbe Länge, Start-Deutsch-1-Format)', 50),
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
// Last checked 2026-09-05 against the real, complete grammarTopics.js (all
// 12 a1.1 slugs live): 1795 minutes = 29.92 h, plus the 5-minute Tag-28
// hand-off item added in Wave 3 PR D = 1800 → rounds to "ca. 30 Stunden",
// inside the 28–32 h band and the 30–40 h A1.1 budget the A1-guide's
// 60–80-h-to-A1 total implies. Every day is 55–75 min except the two
// Puffertage (Tag 14: 35 min, Tag 27: 40 min) — see a11Phase.notes.md for the
// full per-day verification transcript.
export const PROGRAM_MINUTES = WEEKS.reduce(
  (sum, w) => sum + w.days.reduce((daySum, d) => daySum + d.items.reduce((s, i) => s + i.minutes, 0), 0),
  0
);

// Round to a whole hour — no false precision (a plan built from single-digit
// minute estimates cannot honestly claim tenths of an hour).
const PROGRAM_HOURS = Math.round(PROGRAM_MINUTES / 60);

export const PROGRAM = {
  key: PROGRAM_KEY,
  title: PROGRAM_TITLE,
  subtitle:
    `Ca. ${PROGRAM_HOURS} Stunden in 28 Tagen, 55–75 Minuten pro Tag — die erste Phase auf dem Weg zu Start ` +
    'Deutsch 1, mit dem Abschlusstest A1.1 als Etappenziel. Danach folgen die A1.2-Phase und die echte Prüfung.',
  weeks: WEEKS,
};

/** Flat list of every item id, for progress accounting. */
export const allItemIds = () =>
  PROGRAM.weeks.flatMap((w) => w.days.flatMap((d) => d.items.map((i) => i.id)));
