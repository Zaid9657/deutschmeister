// "A2.1-Phase: 28 Tage bis zum Abschlusstest" — a dated, backward-planned study
// plan over the FIRST half of the A2 band. Same shape, item factories, comment
// discipline and derive-never-retype rule as a12Phase.js / a11Phase.js — see
// a11Phase.js's header for the full rationale; not repeated here.
//
// Product framing: A2.1 is sold as a standalone paid course. This plan ends at
// its own half-length course test — the "Abschlusstest A2.1", in the style of
// Goethe-Zertifikat A2 — not at the real exam. Since Wave 5 PR D2 the A2.2
// plan exists (a22Phase.js, /a2-2-phase), so Tag 28's hand-off links it (the
// A1 chain's a12Phase.js keeps its own Start-Deutsch-1 hand-off; nothing here
// redirects A1 learners into A2.1).
//
// Same-wave forward references this module depends on but does not itself
// ship (see notes.md for what is verified today vs. still pending):
//   - (LANDED 2026-09-06, commit accecf9) the four a2.1 grammar slugs
//     adjective-endings-intro, pronouns-accusative-dative, modal-verbs-past
//     and temporal-prepositions — all 12 a2.1 topics are in grammarTopics.js
//     now, so this module's slug guard passes against the real file;
//   - the goethe_a2 exam track + its Leitfaden /leitfaden/goethe-a2/ (PR D1);
//   - four goethe_a2 writing tasks in writingTasks.js (2× 'sms-…' Teil 1,
//     2× 'email-…' Teil 2) — writingTasksForExam('goethe_a2') is empty today,
//     so this module throws at import until they land (PR D1);
//   - two exam-format reading lessons, "Lesen Teil 1: Ein Zeitungstext (wie in
//     der Prüfung)" and "Lesen Teil 3: Eine E-Mail (wie in der Prüfung)"
//     (order_index 9/10);
//   - the course test at /modelltest/abschlusstest-a2-1 (Probe on Tag 26,
//     final on Tag 28, type 'exam') — same URL-shape-safe, data-pending
//     pattern a11Phase.js/a12Phase.js used for their own Abschlusstests.
//
// Speaking coverage decision (fixed by the wave brief): A2.1 has 8 published
// missions, one per OLD topic (mission_order 1–8). The four NEW topics
// (pronouns-accusative-dative, modal-verbs-past, temporal-prepositions,
// adjective-endings-intro) get NO mission. Their production day — always the
// day after their lesson, exactly like a mission day — pairs the lesson's own
// exercise block (`uebung()`, the "Practice Exercises" section at the foot of
// the Astro lesson page; the brief calls it stage 5) with a written X-Ray item,
// so every topic is still produced, not only read.
//
// Item `type` values drive the icon/label on the course page (mirrors
// A12PhasePage's TYPE_ICON map — the only types the runner styles):
//   lesson | listening | reading | speaking | xray | exam | review
// There is no dedicated "writing" or "vocabulary" type; the SMS/E-Mail tasks,
// the "Weiter" hand-off item, the Prüfungsüberblick and both course-test items
// use 'exam', and the weekly SRS item plus the lesson-exercise item reuse
// 'review' (closest styled type) — distinguished by title, same convention as
// a12Phase.js.

import { getTopicsForLevel } from '../grammarTopics.js';
import { writingTasksForExam } from '../writingTasks.js';

export const PROGRAM_KEY = 'a21_phase';

export const PROGRAM_TITLE = 'A2.1-Phase: 28 Tage bis zum Abschlusstest';

// -----------------------------------------------------------------------
// Grammar topics — all 12 REQUIRED at load time
// -----------------------------------------------------------------------
// All 12 a2.1 slugs exist in grammarTopics.js as of commit accecf9 (8 older
// ones + the 4 this wave added). Exactly like a11Phase.js/a12Phase.js
// there is NO silent-drop guard — a missing slug throws at import time with
// the exact slug names, so CI fails loudly instead of quietly shipping a
// course with fewer than 12 lessons. The order below is PEDAGOGICAL, not
// `topic_order` — lessons are looked up by slug, not by array index. Read as
// topic_order it runs 1, 2, 3, 4, 10, 5, 6, 7, 11, 8, 12, 9: the four topics
// this wave adds are INTERLEAVED into the eight old ones rather than appended,
// so pronouns-accusative-dative (10) follows possessive-pronouns (both are
// object forms of one paradigm), modal-verbs-past (11) follows the two Perfekt
// lessons (past reference already established), temporal-prepositions (12)
// follows imperative-mood, and adjective-endings-intro (9) — the heaviest of
// the four — closes the plan. Round 2 replaced an earlier comment here that
// claimed a single deviation; four positions move, not one.
const a21 = getTopicsForLevel('a2.1');
const bySlug = (slug) => a21.find((t) => t.slug === slug);

const A21_LESSON_SLUGS_IN_ORDER = [
  'dative-case',
  'prepositions-dative',
  'two-way-prepositions',
  'possessive-pronouns',
  'pronouns-accusative-dative',
  'separable-verbs',
  'perfect-tense-haben',
  'perfect-tense-sein',
  'modal-verbs-past',
  'imperative-mood',
  'temporal-prepositions',
  'adjective-endings-intro',
];

const missingA21Slugs = A21_LESSON_SLUGS_IN_ORDER.filter((slug) => !bySlug(slug));
if (missingA21Slugs.length > 0) {
  throw new Error(
    `a21Phase.js requires all 12 a2.1 grammar topics to exist in grammarTopics.js — ` +
      `missing: ${missingA21Slugs.join(', ')}. This program is not importable until they land.`
  );
}

// Grammar lessons are served by the Astro build (trailing-slash class) — see
// the three-place route rule and CLAUDE.md's trailing-slash case 1. `external`
// makes the course page render a full-load <a>, since the SPA carries no
// lesson route of its own. titleDe is used (not titleEn) — this plan's copy is
// German end to end. Minutes come from `topic.estimatedTime`, never guessed
// here (the four pending slugs therefore contribute whatever grammarTopics.js
// gives them once they land, not the 25/25/20/20 verify.mjs stubs).
const gLesson = (slug) => {
  const topic = bySlug(slug);
  return {
    id: `a2.1-${topic.slug}`,
    type: 'lesson',
    title: topic.titleDe,
    minutes: topic.estimatedTime || 20,
    href: `/grammar/a2.1/${topic.slug}/`,
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
    href: `/grammar/a2.1/${topic.slug}/`,
    external: true,
  };
};

// The production half of a NEW topic's mission-less day: the lesson's own
// exercise block. Same page, third distinct id family (`uebung-<slug>`), so
// lesson / Wiederholung / Übungen never collide in progress accounting. Only
// the four new topics use it — the eight old ones produce through their
// mission instead. The frame carries the word "Übungen" exactly once and adds
// no colon of its own (round-2 fix: the first version read "Üben: X — die
// Übungen zur Lektion" and nested a second colon inside the topic name
// "Zeit-Präpositionen: wann und wie lange"); verify.mjs pins both rules for
// every title in the file, not only this family. WEEKS also never places this
// item on the same day as the same topic's `gReview()` — two checkboxes with
// one href and no spacing is not a Wiederholung, and verify.mjs rejects any
// day whose items share an href.
const uebung = (slug, minutes = 20) => {
  const topic = bySlug(slug);
  return {
    id: `uebung-${topic.slug}`,
    type: 'review',
    title: `Übungen zur Lektion — ${topic.titleDe}`,
    minutes,
    href: `/grammar/a2.1/${topic.slug}/`,
    external: true,
  };
};

// A single non-topic-specific review pointing back at the whole level hub —
// same pattern a11Phase.js/a12Phase.js use. No slug to resolve, so no throw
// risk. Every call below names its own scope, so no two hub reviews read
// identically.
const hubReview = (id, title, minutes) => ({ id, type: 'review', title, minutes, href: '/grammar/a2.1/', external: true });

// -----------------------------------------------------------------------
// Speaking — the 8 published A2.1 missions, one per OLD topic
// -----------------------------------------------------------------------
// mission_order 1–8 and title_de are fixed by the wave brief (they are the
// live A2.1 rows; the sandbox cannot reach Supabase to re-read them, see
// notes.md). `targetStructures` is the condensed grammar label each mission
// drills and `prereqSlug` the lesson it needs — carried here, not only in a
// comment, so the constraint that decides placement is visible at the call
// site. WEEKS places every mission on its prereq lesson's day + 1;
// verify.mjs checks that directly instead of trusting the eye.
const A21_SPEAKING_MISSIONS = [
  { order: 1, titleDe: 'Ein Paket verschicken', targetStructures: 'Dativobjekt (wem?), Dativpronomen', prereqSlug: 'dative-case' },
  { order: 2, titleDe: 'Der Weg zur Arbeit', targetStructures: 'Präpositionen mit Dativ (mit, zu, nach, von)', prereqSlug: 'prepositions-dative' },
  { order: 3, titleDe: 'Der Umzugstag', targetStructures: 'Wechselpräpositionen: wo? + Dativ, wohin? + Akkusativ', prereqSlug: 'two-way-prepositions' },
  { order: 4, titleDe: 'Im Fundbüro', targetStructures: 'Possessivpronomen in Nominativ, Akkusativ, Dativ', prereqSlug: 'possessive-pronouns' },
  { order: 5, titleDe: 'Mein Tagesablauf', targetStructures: 'Trennbare Verben mit Satzklammer', prereqSlug: 'separable-verbs' },
  { order: 6, titleDe: 'Mein Wochenende', targetStructures: 'Perfekt mit haben', prereqSlug: 'perfect-tense-haben' },
  { order: 7, titleDe: 'Zurück von der Reise', targetStructures: 'Perfekt mit sein', prereqSlug: 'perfect-tense-sein' },
  { order: 8, titleDe: 'Den Weg zur Wohnung erklären', targetStructures: 'Imperativ (du/Sie) für Wegbeschreibungen', prereqSlug: 'imperative-mood' },
];
const missionByOrder = (order) => {
  const m = A21_SPEAKING_MISSIONS.find((x) => x.order === order);
  if (!m) throw new Error(`a21Phase.js: no A2.1 speaking mission with order ${order}`);
  return m;
};

// Speaking missions have no per-mission SPA route (App.jsx: a single
// "/speaking" route with no :level or :missionId param) — same generic hub
// href a11Phase.js/a12Phase.js use ("/speaking/", trailing slash: case 2 of
// the trailing-slash rule, a prerendered hub). None of the eight A2.1 titles
// carries its own "Sprechen Teil N" framing, so one frame fits all eight and
// the a12Phase.js branch is not needed here.
const speaking = (id, order, minutes = 15) => ({
  id,
  type: 'speaking',
  title: `Sprechen: Mission „${missionByOrder(order).titleDe}“`,
  minutes,
  href: '/speaking/',
});

// -----------------------------------------------------------------------
// Listening — first pass (weeks 1–2), then a dictation pass (weeks 3–4)
// -----------------------------------------------------------------------
// A2.1 has 6 listening exercises, deep-linked via the real SPA route
// /listening/:level/:exerciseNumber — no trailing slash, case 3 of the
// trailing-slash rule. Titles are the live ones (scratchpad/wave4/source/
// listening-a2.1.json, exercise_number 1–6), so both passes name the real
// exercise and all twelve items read distinctly; the lookup throws on an
// unknown number, like missionByOrder.
const A21_LISTENING_TITLES = {
  1: 'Beim Arzt (erweitert)',
  2: 'Im Restaurant bestellen',
  3: 'Reisen und Verkehrsmittel',
  4: 'Termine und Verabredungen',
  5: 'Einkaufen im Alltag',
  6: 'Nachrichten und Durchsagen',
};
const listeningTitle = (n) => {
  const title = A21_LISTENING_TITLES[n];
  if (!title) throw new Error(`a21Phase.js: no A2.1 listening exercise title for exercise ${n}`);
  return title;
};
const listening = (id, n, minutes = 15) => ({
  id,
  type: 'listening',
  title: `Hören: Übung ${n} — „${listeningTitle(n)}“`,
  minutes,
  href: `/listening/a2.1/${n}`,
});
const listeningReuse = (id, n, minutes = 15) => ({
  id,
  type: 'listening',
  title: `Hören: Übung ${n} noch einmal — Diktat zu „${listeningTitle(n)}“`,
  minutes,
  href: `/listening/a2.1/${n}`,
});

// -----------------------------------------------------------------------
// Reading — exactly 10 items: 8 live + 2 exam-format (added this wave)
// -----------------------------------------------------------------------
// Reading lessons are addressed by the level hub (/reading/a2.1, no trailing
// slash, case 3) rather than a per-lesson id: the ids are known offline
// (wave4/source/reading-a2.1.json, order_index 1–8) but the hub rotates
// content and a pinned id would break when a row is re-ordered or replaced;
// the hub reference stays correct either way. The titles ARE carried, so the
// ten items read distinctly and a learner can find the right text on the hub.
// `n` is out of a fixed 10, so "Text N von 10" can never drift from what this
// file contains. Items 9/10 carry their own "Lesen Teil N: …" framing, so the
// generic "Lesen: … — <Titel>" frame would repeat the word Lesen AND nest a
// second colon; they take the numbering as a suffix instead (same branch-on-
// the-data rule a12Phase.js used for its "Sprechen Teil N" missions), which
// keeps every source title verbatim and every title at one colon.
const READING_TOTAL = 10;
const A21_READING_TITLES = {
  1: 'Meine Reise nach Wien',
  2: 'Beim Arzt',
  3: 'Mein Beruf als Softwareentwickler',
  4: 'Unterwegs in der Stadt',
  5: 'Ein Abend im Restaurant',
  6: 'Ein Umzug nach Hamburg',
  7: 'Der Sportverein',
  8: 'Ein Besuch auf dem Wochenmarkt',
  9: 'Lesen Teil 1: Ein Zeitungstext (wie in der Prüfung)',
  10: 'Lesen Teil 3: Eine E-Mail (wie in der Prüfung)',
};
const reading = (id, n, minutes = 15) => {
  const title = A21_READING_TITLES[n];
  if (!title) throw new Error(`a21Phase.js: no A2.1 reading lesson title for text ${n}`);
  return {
    id,
    type: 'reading',
    title: title.startsWith('Lesen')
      ? `${title} — Text ${n} von ${READING_TOTAL}`
      : `Lesen: Text ${n} von ${READING_TOTAL} — ${title}`,
    minutes,
    href: '/reading/a2.1',
  };
};

// The spaced-repetition trainer lives at the dedicated /vocabulary route
// (VocabularySectionPage.jsx renders SrsTrainer there). Used once per week
// (4 total), per the brief.
const srsReview = (id, weekLabel, minutes = 25) => ({
  id,
  type: 'review',
  title: `Wortschatz-Wiederholung: deine Karteikarten aus ${weekLabel}`,
  minutes,
  href: '/vocabulary',
});

// `title` is REQUIRED and its absence THROWS, like every other lookup in this
// file: round 1 let six of seventeen X-Ray items fall back to one generic
// default ("fünf Sätze aus dieser Woche"), twice inside one week. Every call
// now names the structure the learner should produce that day, and verify.mjs
// checks the seventeen titles are distinct.
const xray = (id, minutes, title) => {
  if (!title) throw new Error(`a21Phase.js: X-Ray item ${id} needs its own title — there is no generic default`);
  return {
    id,
    type: 'xray',
    title,
    minutes,
    href: '/analyze/',
  };
};

// Exam-format orientation, Tag 1 only — the Goethe-A2 Leitfaden (Astro,
// trailing slash, external:true). PENDING: astro-site/src/data/guides/
// goethe-a2.js lands in PR D1 of this same wave; the /leitfaden/<slug>/ URL
// shape is already served for every guide, so only the guide DATA is pending.
const orientation = (id, minutes = 20) => ({
  id,
  type: 'exam',
  title: 'Prüfungsüberblick: Ablauf und Punkte beim Goethe-Zertifikat A2',
  minutes,
  href: '/leitfaden/goethe-a2/',
  external: true,
});

// -----------------------------------------------------------------------
// Writing — 2 SMS (Teil 1) + 2 E-Mail (Teil 2), all four goethe_a2 tasks
// -----------------------------------------------------------------------
// Derived from writingTasks.js by taskKey prefix, never retyped. The bank is
// EMPTY today (PR D1 adds the four goethe_a2 tasks), so the guard below
// throws at import time naming the dependency rather than rendering a plan
// with silently missing writing days. Route: /schreiben/goethe-a2 —
// SchreibenPage reads :examSlug and resolves it through examTrackBySlug, and
// netlify.toml wildcards "/schreiben/*" (no trailing slash, case 3). Bank
// titles start "SMS: " / "E-Mail: " in the goethe_a1 house style, so the
// frame's own word is stripped from the appended title (anti-stutter).
const A2_SMS_TASKS = writingTasksForExam('goethe_a2').filter((t) => t.taskKey.startsWith('sms-'));
const A2_EMAIL_TASKS = writingTasksForExam('goethe_a2').filter((t) => t.taskKey.startsWith('email-'));
if (A2_SMS_TASKS.length < 2 || A2_EMAIL_TASKS.length < 2) {
  throw new Error(
    `a21Phase.js requires 2 'sms-' and 2 'email-' goethe_a2 writing tasks in writingTasks.js — ` +
      `found ${A2_SMS_TASKS.length} SMS and ${A2_EMAIL_TASKS.length} E-Mail. ` +
      `This program is not importable until they land.`
  );
}
const schreiben = (id, kind, taskNumber, minutes) => {
  const tasks = kind === 'sms' ? A2_SMS_TASKS : A2_EMAIL_TASKS;
  if (taskNumber < 1 || taskNumber > tasks.length) {
    throw new Error(`a21Phase.js: ${kind} task number ${taskNumber} out of range (1-${tasks.length})`);
  }
  const frame = kind === 'sms' ? 'Schreiben: SMS (Teil 1)' : 'Schreiben: E-Mail (Teil 2)';
  const shortTitle = tasks[taskNumber - 1].title.replace(/^(SMS|E-Mail|Nachricht):\s*/, '');
  return {
    id,
    type: 'exam',
    title: `${frame} — ${shortTitle}`,
    minutes,
    href: '/schreiben/goethe-a2',
  };
};

// The rehearsal (ungraded) and the final (graded) half-length course test.
// UNVERIFIED DEPENDENCY, same forward-reference pattern the A1 plans used:
// /modelltest/abschlusstest-a2-1 names a course-test module + registry entry
// that lands in PR D2a of this wave. The generic SPA route
// /modelltest/:examSlug exists and netlify.toml wildcards "/modelltest/*"
// (no trailing slash, case 3), so the URL SHAPE is safe; only the exam DATA
// behind the slug is pending. Both items are budgeted at the test's real
// length (55 min, ≈ half the real Goethe-A2 exam) — see notes.md.
const modelltest = (id, title, minutes) => ({
  id,
  type: 'exam',
  title,
  minutes,
  href: '/modelltest/abschlusstest-a2-1',
});

// Hand-off on Tag 28 — a real, clickable exit rather than prose alone (the
// week `intro` renders inside a bare <p> and cannot carry an href). Since
// Wave 5 PR D2 the A2.2 course plan exists, so this points at it: /a2-2-phase
// is an SPA route in the netlify.toml allow-list (no trailing slash, case 3),
// so `external` is correctly omitted. tests/purchases.test.mjs pins the href.
const nextLevel = (id, minutes = 5) => ({
  id,
  type: 'exam',
  title: 'Weiter: A2.2-Phase',
  minutes,
  href: '/a2-2-phase',
});

// -----------------------------------------------------------------------
// The plan
// -----------------------------------------------------------------------
// 28 days, 4 weeks of 7. 55–75 minutes/day, except two lighter "Puffertage"
// (Tag 14 and Tag 27, ≤40 min, review only — no new content). 2–4 items/day.
//
// The 12 grammar lessons run 3 per week in PEDAGOGICAL order:
//   Woche 1 (Tag 1–7):   dative-case (Tag 1), prepositions-dative (Tag 3),
//                        two-way-prepositions (Tag 5)
//   Woche 2 (Tag 8–14):  possessive-pronouns (Tag 8),
//                        pronouns-accusative-dative (Tag 10),
//                        separable-verbs (Tag 12)
//   Woche 3 (Tag 15–21): perfect-tense-haben (Tag 15),
//                        perfect-tense-sein (Tag 17), modal-verbs-past (Tag 19)
//   Woche 4 (Tag 22–28): imperative-mood (Tag 22), temporal-prepositions
//                        (Tag 23), adjective-endings-intro (Tag 24)
// Every lesson's Wiederholung lands 1–2 days after its own introduction —
// eleven of the twelve at 2 days, one (imperative-mood, Tag 22→23) at 1,
// where Woche 4's fixed test days leave no room for a second.
// verify.mjs checks the 1–2 band, and separately that no day carries a
// topic's Übungen and its Wiederholung together (round-2 blocking fix: Tag 24
// and Tag 25 used to do exactly that, two checkboxes on one href).
//
// Every day after a lesson is that lesson's production day: the eight OLD
// topics get their mission (M1→Tag 2, M2→Tag 4, M3→Tag 6, M4→Tag 9,
// M5→Tag 13, M6→Tag 16, M7→Tag 18, M8→Tag 23), the four NEW topics get
// `uebung()` + a written X-Ray item instead (Tag 11, Tag 20, Tag 24, Tag 25).
//
// Writing: SMS practice in Woche 2 and Woche 3 (Tag 9, Tag 16), E-Mail in
// Woche 3 and Woche 4 (Tag 18, Tag 22) — the brief's split.
// Listening: exercises 1–6 once each in Woche 1–2, then the same six as
// dictation in Woche 3–4; three per week, every week.
// Reading: texts 1–8 across Woche 1–3, the two exam-format texts on Tag 20
// and Tag 25 — both before the Probe on Tag 26.
//
// Tag 1 gives a first win fast: item 1 is the first grammar lesson, item 2 a
// 5-minute X-Ray pass — instant AI analysis — before the day continues into
// the Prüfungsüberblick and the first reading text.
//
// Register note: the copy AUTHORED here obeys the A2.1 level file — no
// superlative ("deine schwächsten Themen"), no Genitiv ("die Übungen der
// Lektion" → "zur Lektion"), no adjective ending before Tag 24, where
// adjective-endings-intro is taught. Two classes of DERIVED string are outside
// that reach and are accepted knowingly: the grammar topics' own names
// (grammarTopics.js `titleDe`, e.g. "Trennbare Verben" — metalanguage, and
// null-article at that) and the writing bank's task titles (writingTasks.js,
// e.g. "Einen neuen Tag vorschlagen" on Tag 16, a weak ending eight days
// before the topic is taught). Both are derive-never-retype sources; fixing
// them means fixing them upstream, not paraphrasing them here. verify.mjs
// pins the authored forms that were removed, so they cannot creep back in.
//
// Week-intro length: each intro below is EXACTLY 2 sentences and every
// sentence stays ≤14 words (the A2.1 register rule), so the two caps hold at
// once — no semicolon-stuffed clauses. verify.mjs checks both.
const WEEKS = [
  {
    title: 'Woche 1 — Dativ und Präpositionen',
    intro:
      'Diese Woche lernst du den Dativ und die Präpositionen mit Dativ. ' +
      'Dazu kommen die Wechselpräpositionen und drei Sprechmissionen.',
    days: [
      {
        label: 'Tag 1',
        items: [
          gLesson('dative-case'),
          xray('d1-xray', 5, 'X-Ray: ein Satz mit Dativ — sofort geprüft'),
          orientation('d1-orientation'),
          reading('d1-reading', 1),
        ],
      },
      {
        label: 'Tag 2',
        items: [speaking('d2-speaking', 1), listening('d2-listening', 1), reading('d2-reading', 2), xray('d2-xray', 20, 'X-Ray: fünf Sätze mit einem Dativobjekt')],
      },
      {
        label: 'Tag 3',
        items: [gLesson('prepositions-dative'), gReview('dative-case'), listening('d3-listening', 2)],
      },
      {
        label: 'Tag 4',
        items: [speaking('d4-speaking', 2), reading('d4-reading', 3), listening('d4-listening', 3), xray('d4-xray', 20, 'X-Ray: fünf Sätze mit aus, bei und nach')],
      },
      {
        label: 'Tag 5',
        items: [gLesson('two-way-prepositions'), gReview('prepositions-dative'), xray('d5-xray', 20, 'X-Ray: fünf Sätze mit wo? und wohin?')],
      },
      {
        label: 'Tag 6',
        items: [
          speaking('d6-speaking', 3),
          hubReview('d6-review', 'Wiederholen: Dativ und Präpositionen mit Dativ', 20),
          xray('d6-xray', 25, 'X-Ray: fünf Sätze mit stellen, stehen und legen'),
        ],
      },
      {
        label: 'Tag 7',
        items: [
          srsReview('d7-srs', 'Woche 1', 25),
          gReview('two-way-prepositions'),
          hubReview('d7-review', 'Wiederholen: die drei Themen dieser Woche', 15),
        ],
      },
    ],
  },
  {
    title: 'Woche 2 — Pronomen und trennbare Verben',
    intro:
      'Diese Woche: Possessivpronomen, Pronomen im Akkusativ und Dativ, trennbare Verben. ' +
      'Dazu kommen deine erste SMS-Aufgabe und zwei Sprechmissionen.',
    days: [
      {
        label: 'Tag 8',
        items: [gLesson('possessive-pronouns'), listening('d8-listening', 4), reading('d8-reading', 4), xray('d8-xray', 20, 'X-Ray: fünf Sätze mit den Possessivpronomen meinem, deiner und unserem')],
      },
      {
        label: 'Tag 9',
        items: [speaking('d9-speaking', 4), schreiben('d9-schreiben', 'sms', 1, 20), reading('d9-reading', 5), listening('d9-listening', 5)],
      },
      {
        label: 'Tag 10',
        items: [gLesson('pronouns-accusative-dative'), gReview('possessive-pronouns'), reading('d10-reading', 6)],
      },
      {
        label: 'Tag 11',
        items: [
          uebung('pronouns-accusative-dative'),
          xray('d11-xray', 20, 'X-Ray: fünf Sätze mit den Pronomen mich, dir und ihn'),
          listening('d11-listening', 6),
        ],
      },
      {
        label: 'Tag 12',
        items: [gLesson('separable-verbs'), gReview('pronouns-accusative-dative'), xray('d12-xray', 20, 'X-Ray: fünf Sätze mit Pronomen im Akkusativ')],
      },
      {
        label: 'Tag 13',
        items: [
          speaking('d13-speaking', 5),
          hubReview('d13-review', `Wiederholen: Possessivpronomen, ${bySlug('pronouns-accusative-dative').titleDe}`, 20),
          xray('d13-xray', 20, 'X-Ray: fünf Sätze mit aufstehen, einkaufen und anrufen'),
        ],
      },
      {
        label: 'Tag 14 — Puffertag',
        items: [srsReview('d14-srs', 'Woche 2', 25), gReview('separable-verbs', 15)],
      },
    ],
  },
  {
    title: 'Woche 3 — Perfekt und Modalverben im Präteritum',
    intro:
      'Diese Woche lernst du das Perfekt mit haben und mit sein. ' +
      'Dazu kommen die Modalverben im Präteritum und deine erste E-Mail.',
    days: [
      {
        label: 'Tag 15',
        items: [gLesson('perfect-tense-haben'), listeningReuse('d15-listening', 1), reading('d15-reading', 7)],
      },
      {
        label: 'Tag 16',
        items: [
          speaking('d16-speaking', 6),
          schreiben('d16-schreiben', 'sms', 2, 20),
          listeningReuse('d16-listening', 2),
          xray('d16-xray', 20, 'X-Ray: fünf Sätze im Perfekt mit haben'),
        ],
      },
      {
        label: 'Tag 17',
        items: [gLesson('perfect-tense-sein'), gReview('perfect-tense-haben'), reading('d17-reading', 8)],
      },
      {
        label: 'Tag 18',
        items: [
          speaking('d18-speaking', 7),
          schreiben('d18-schreiben', 'email', 1, 25),
          listeningReuse('d18-listening', 3),
          xray('d18-xray', 20, 'X-Ray: fünf Sätze im Perfekt mit sein'),
        ],
      },
      {
        label: 'Tag 19',
        items: [gLesson('modal-verbs-past'), gReview('perfect-tense-sein'), xray('d19-xray', 20, 'X-Ray: fünf Sätze über dein Wochenende im Perfekt')],
      },
      {
        label: 'Tag 20',
        items: [
          uebung('modal-verbs-past'),
          xray('d20-xray', 20, 'X-Ray: fünf Sätze mit konnte, musste und wollte'),
          reading('d20-reading', 9, 20),
          hubReview('d20-review', 'Wiederholen: zwei Themen aus Woche 3 nach deiner Wahl', 15),
        ],
      },
      {
        label: 'Tag 21',
        items: [
          srsReview('d21-srs', 'Woche 3', 25),
          gReview('modal-verbs-past'),
          hubReview('d21-review', 'Wiederholen: alle Themen aus Woche 1 bis Woche 3', 25),
        ],
      },
    ],
  },
  {
    title: 'Woche 4 — Imperativ, Zeit, Adjektive, dann der Abschlusstest',
    intro:
      'Diese Woche kommen der Imperativ, Zeitangaben und die Adjektivendungen. ' +
      'Danach folgen der Probe-Abschlusstest und der Abschlusstest A2.1.',
    days: [
      {
        label: 'Tag 22',
        items: [
          gLesson('imperative-mood'),
          schreiben('d22-schreiben', 'email', 2, 25),
          listeningReuse('d22-listening', 4),
          xray('d22-xray', 15, 'X-Ray: fünf Sätze im Imperativ'),
        ],
      },
      {
        label: 'Tag 23',
        items: [
          gLesson('temporal-prepositions'),
          speaking('d23-speaking', 8),
          gReview('imperative-mood', 15),
          listeningReuse('d23-listening', 5),
        ],
      },
      {
        label: 'Tag 24',
        items: [
          gLesson('adjective-endings-intro'),
          uebung('temporal-prepositions'),
          xray('d24-xray', 15, 'X-Ray: fünf Sätze mit seit, vor und ab'),
          listeningReuse('d24-listening', 6),
        ],
      },
      {
        label: 'Tag 25',
        items: [
          uebung('adjective-endings-intro'),
          xray('d25-xray', 15, 'X-Ray: fünf Sätze mit Adjektiven vor dem Nomen'),
          gReview('temporal-prepositions', 15),
          reading('d25-reading', 10, 20),
        ],
      },
      {
        label: 'Tag 26',
        items: [
          gReview('adjective-endings-intro', 15),
          modelltest('d26-probe', 'Probe-Abschlusstest A2.1 (ungewertet, Kurzversion)', 55),
        ],
      },
      {
        label: 'Tag 27 — Puffertag',
        items: [srsReview('d27-srs', 'Woche 4', 25), hubReview('d27-review', 'Wiederholen: drei Themen vor dem Abschlusstest', 15)],
      },
      {
        label: 'Tag 28',
        items: [
          xray('d28-xray', 15, 'X-Ray: Aufwärmen vor dem Abschlusstest'),
          modelltest('d28-abschlusstest', 'Abschlusstest A2.1 (gewertet, Kurzversion, Goethe-A2-Format)', 55),
          nextLevel('d28-next'),
        ],
      },
    ],
  },
];

// Derived, never retyped: the sum of every item's minutes across all 28 days,
// computed from WEEKS directly so PROGRAM.subtitle quotes the number it
// derives. Read PROGRAM_MINUTES itself for the current figure rather than
// trusting a number retyped into this comment; verify.mjs prints it on every
// run. Last measured 2026-09-06 against the REAL grammarTopics.js (all 12
// a2.1 topics live since accecf9, estimatedTime 25/20/25/20/20/25/25/20 for
// the eight old and 25/25/22/25 for adjective-endings-intro /
// pronouns-accusative-dative / modal-verbs-past / temporal-prepositions):
// 1782 minutes over 93 items, weeks 435 / 405 / 467 / 475, every day 55–75
// except Tag 14 and Tag 27 (both 40).
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
    `Rund ${PROGRAM_HOURS} Stunden in 28 Tagen, 55–75 Minuten pro Tag. ` +
    'Teil 1 von A2, mit dem Abschlusstest A2.1 als Ziel. ' +
    'Danach geht es weiter mit A2.2.',
  weeks: WEEKS,
};

/** Flat list of every item id, for progress accounting. */
export const allItemIds = () =>
  PROGRAM.weeks.flatMap((w) => w.days.flatMap((d) => d.items.map((i) => i.id)));
