// "A2.2-Phase: 28 Tage bis zum Abschlusstest" — a dated, backward-planned study
// plan over the SECOND half of the A2 band. Same shape, item factories,
// comment discipline and derive-never-retype rule as a21Phase.js / a12Phase.js
// / a11Phase.js — see a11Phase.js's header for the full rationale; not
// repeated here.
//
// Product framing: A2.2 is sold as a standalone paid course, the second half
// of the €49 A2 course (a2.1 + a2.2 together). Unlike a21Phase.js — which had
// no A2.2 plan to hand off to and pointed Tag 28 at the bare level page — this
// plan is the LAST teaching leg of the whole A1→A2 chain: it ends at its own
// half-length "Abschlusstest A2.2" and then hands the learner to the exam
// rehearsal — since Course Factory Wave 6 PR B the 30-day Goethe-A2 plan at
// /goethe-a2-kurs (goetheA2Kurs.js), which itself contains the Kurzversion
// mock (/modelltest/goethe-a2) on its Tage 26 and 30. There is no A2.3.
//
// Same-wave forward references this module depends on but does not itself
// ship (see notes.md for what is verified today vs. still pending):
//   - (LIVE) all 12 a2.2 grammar slugs already exist in grammarTopics.js —
//     the 8 old ones plus konjunktiv-ii-polite, verbs-with-prepositions-intro,
//     indirect-questions-intro and infinitive-with-zu-intro (topic_order
//     9–12) — so this module's slug guard passes against the real file today;
//   - (LIVE) the goethe_a2 exam track + its Leitfaden /leitfaden/goethe-a2/
//     (PR D1 of this wave) — confirmed present at
//     astro-site/src/data/guides/goethe-a2.js, so `orientation()` below is
//     NOT a forward reference, unlike the equivalent item in a21Phase.js;
//   - (LIVE) all four goethe_a2 writing tasks in writingTasks.js (2×
//     'sms-…' Teil 1, 2× 'email-…' Teil 2) — writingTasksForExam('goethe_a2')
//     returns 4 rows today;
//   - (PENDING, PR D2a of this wave) the course test module + registry entry
//     at /modelltest/abschlusstest-a2-2 (Probe on Tag 26, final on Tag 28,
//     type 'exam') — same URL-shape-safe, data-pending pattern
//     a11Phase.js/a12Phase.js/a21Phase.js used for their own Abschlusstests
//     before those modules landed. The generic SPA route
//     /modelltest/:examSlug exists and netlify.toml wildcards "/modelltest/*"
//     (no trailing slash, case 3), so only the exam DATA behind the slug is
//     pending;
//   - (SHIPPED, Wave 5 PR D1, #97) MOCK_EXAMS.goethe_a2 — the Kurzversion
//     mock exam content behind /modelltest/goethe-a2 (`hasMock: true`).
//   - (SHIPPED, Wave 6 PR B) /goethe-a2-kurs — the 30-day exam plan the
//     Tag-28 hand-off below now points at.
//
// Speaking coverage decision (fixed by the wave brief, confirmed against the
// live `speaking_missions` table): A2.2 has 8 published missions, one per OLD
// topic (mission_order 1–8, level 'A2.2'). The four NEW topics
// (konjunktiv-ii-polite, verbs-with-prepositions-intro,
// indirect-questions-intro, infinitive-with-zu-intro) get NO mission — same
// situation a21Phase.js had for its own four new topics. Their production
// day — always the day after their lesson, exactly like a mission day —
// pairs the lesson's own exercise block (`uebung()`, the "Practice Exercises"
// section at the foot of the Astro lesson page; the brief calls it stage 5)
// with a written X-Ray item, so every topic is still produced, not only read.
//
// Item `type` values drive the icon/label on the course page (mirrors
// A21PhasePage's TYPE_ICON map — the only types the runner styles):
//   lesson | listening | reading | speaking | xray | exam | review
// There is no dedicated "writing" or "vocabulary" type; the SMS/E-Mail tasks,
// the "Weiter" hand-off item, the Prüfungsüberblick and both course-test items
// use 'exam', and the weekly SRS item plus the lesson-exercise item reuse
// 'review' (closest styled type) — distinguished by title, same convention as
// a21Phase.js.

// NOTE (scratchpad staging only): this file is authored as the drop-in
// destination src/data/programs/a22Phase.js — same relative imports
// a21Phase.js/a12Phase.js use from that location. plan/verify.mjs stages a
// copy under a temp src/data/programs/ tree next to symlinks to the repo's
// REAL grammarTopics.js and writingTasks.js so these two imports resolve
// exactly as they will once this file is moved into the repo.
import { getTopicsForLevel } from '../grammarTopics.js';
import { writingTasksForExam } from '../writingTasks.js';

export const PROGRAM_KEY = 'a22_phase';

export const PROGRAM_TITLE = 'A2.2-Phase: 28 Tage bis zum Abschlusstest';

// -----------------------------------------------------------------------
// Grammar topics — all 12 REQUIRED at load time
// -----------------------------------------------------------------------
// All 12 a2.2 slugs exist in grammarTopics.js today (topic_order 1–12).
// Exactly like a21Phase.js there is NO silent-drop guard — a missing slug
// throws at import time with the exact slug names, so CI fails loudly
// instead of quietly shipping a course with fewer than 12 lessons. The order
// below is PEDAGOGICAL (the wave brief's fixed sequence), not `topic_order` —
// lessons are looked up by slug, not by array index. Read as topic_order it
// runs 1, 10, 2, 3, 4, 5, 11, 12, 6, 7, 9, 8: verbs-with-prepositions-intro
// (10) follows reflexive-verbs immediately because it "builds on it" (per
// the brief — reflexive verbs like sich freuen and sich interessieren are the
// worked examples for the fixed-preposition verbs); indirect-questions-intro
// (11) and infinitive-with-zu-intro (12) sit together after the three
// clause-order topics (dass/ob and weil both already train verb-final word
// order); konjunktiv-ii-polite (9) — politeness forms — closes the plan
// together with future-tense (8), so the course ends on "plans after the
// course" exactly as the brief specifies.
const a22 = getTopicsForLevel('a2.2');
const bySlug = (slug) => a22.find((t) => t.slug === slug);

const A22_LESSON_SLUGS_IN_ORDER = [
  'reflexive-verbs',
  'verbs-with-prepositions-intro',
  'simple-past-sein-haben',
  'coordinating-conjunctions',
  'subordinating-conjunctions',
  'subordinate-word-order',
  'indirect-questions-intro',
  'infinitive-with-zu-intro',
  'comparative',
  'superlative',
  'konjunktiv-ii-polite',
  'future-tense',
];

const missingA22Slugs = A22_LESSON_SLUGS_IN_ORDER.filter((slug) => !bySlug(slug));
if (missingA22Slugs.length > 0) {
  throw new Error(
    `a22Phase.js requires all 12 a2.2 grammar topics to exist in grammarTopics.js — ` +
      `missing: ${missingA22Slugs.join(', ')}. This program is not importable until they land.`
  );
}

// Grammar lessons are served by the Astro build (trailing-slash class) — see
// the three-place route rule and CLAUDE.md's trailing-slash case 1. `external`
// makes the course page render a full-load <a>, since the SPA carries no
// lesson route of its own. titleDe is used (not titleEn) — this plan's copy is
// German end to end. Minutes come from `topic.estimatedTime`, never guessed
// here.
const gLesson = (slug) => {
  const topic = bySlug(slug);
  return {
    id: `a2.2-${topic.slug}`,
    type: 'lesson',
    title: topic.titleDe,
    minutes: topic.estimatedTime || 20,
    href: `/grammar/a2.2/${topic.slug}/`,
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
    href: `/grammar/a2.2/${topic.slug}/`,
    external: true,
  };
};

// The production half of a NEW topic's mission-less day: the lesson's own
// exercise block. Same page, third distinct id family (`uebung-<slug>`), so
// lesson / Wiederholung / Übungen never collide in progress accounting. Only
// the four new topics use it — the eight old ones produce through their
// mission instead. The frame carries the word "Übungen" exactly once and adds
// no colon of its own, same anti-stutter rule a21Phase.js pins. WEEKS also
// never places this item on the same day as the same topic's `gReview()` —
// verified below in this file's own layout, mirrored by verify.mjs.
const uebung = (slug, minutes = 20) => {
  const topic = bySlug(slug);
  return {
    id: `uebung-${topic.slug}`,
    type: 'review',
    title: `Übungen zur Lektion — ${topic.titleDe}`,
    minutes,
    href: `/grammar/a2.2/${topic.slug}/`,
    external: true,
  };
};

// A single non-topic-specific review pointing back at the whole level hub —
// same pattern a21Phase.js/a12Phase.js use. No slug to resolve, so no throw
// risk. Every call below names its own scope, so no two hub reviews read
// identically.
const hubReview = (id, title, minutes) => ({ id, type: 'review', title, minutes, href: '/grammar/a2.2/', external: true });

// -----------------------------------------------------------------------
// Speaking — the 8 published A2.2 missions, one per OLD topic
// -----------------------------------------------------------------------
// mission_order 1–8 and titleDe are pulled 2026-09-06 via execute_sql
// (read-only) from speaking_missions where level = 'A2.2' — see
// plan/source/missions-a2.2.json for the raw rows; `prereqSlug` is the lesson
// it needs — carried here, not only in a comment, so the constraint that
// decides placement is visible at the call site. WEEKS places every mission
// on its prereq lesson's day + 1; verify.mjs checks that directly instead of
// trusting the eye.
//
// ROUND 3: `titleDe` is derived from the live row, unparaphrased, same rule
// this module applies to grammar-topic and writing-task titles — EXCEPT
// mission 2's row ("Der Urlaub, der schiefging") is retitled to
// "Ein Urlaub mit Problemen" (title_en "A holiday with problems") by a
// guarded UPDATE, keyed on the old title, in this same PR's migration
// (PR D2), because the live title carried a relative clause and a full-verb
// Präteritum, both banned at A2.2; the string below already reflects the
// post-migration title, so this module and the DB agree once that migration
// lands. (Round 2 used an interim retitle, "Mein Urlaub: Nichts hat
// geklappt", which the orchestrator has since superseded with this
// colon-free, plainly-A2 one — see notes.md's Round 3 section.)
// `targetStructures` (round 1: raw English DB labels, unrendered dead
// metadata) is a condensed GERMAN label, matching a21Phase.js's own style,
// and is likewise not retyped from nothing — each is a translation of the
// same row's `target_structures` array. Mission 5's row is ALSO carried by
// PR D2's migration: `seitdem` (a B1 subordinator banned outright at A2.2,
// level-a2.2.md's BANNED list) becomes `wenn` there, so the label below
// already reflects that fix too.
const A22_SPEAKING_MISSIONS = [
  { order: 1, titleDe: 'Anmeldung an der Volkshochschule', targetStructures: 'Reflexive Verben (sich anmelden, sich interessieren für, sich freuen auf), Reflexivpronomen im Akkusativ', prereqSlug: 'reflexive-verbs' },
  { order: 2, titleDe: 'Ein Urlaub mit Problemen', targetStructures: 'Präteritum von sein und haben (war, hatte)', prereqSlug: 'simple-past-sein-haben' },
  { order: 3, titleDe: 'Einen Handytarif wählen', targetStructures: 'Konjunktionen und, aber, oder, denn, sondern', prereqSlug: 'coordinating-conjunctions' },
  { order: 4, titleDe: 'Sich krankmelden', targetStructures: 'Konjunktionen weil, dass, wenn, ob; Verb am Ende', prereqSlug: 'subordinating-conjunctions' },
  { order: 5, titleDe: 'Die Heizung ist kaputt', targetStructures: 'Wortstellung im Nebensatz; Nebensatz am Satzanfang; weil, dass, wenn kombinieren', prereqSlug: 'subordinate-word-order' },
  { order: 6, titleDe: 'Zwei Wohnungen im Vergleich', targetStructures: 'Komparativ mit -er, als im Vergleich', prereqSlug: 'comparative' },
  { order: 7, titleDe: 'Einen Wochenendtrip planen', targetStructures: 'Superlativ mit am -sten, am besten/liebsten/meisten', prereqSlug: 'superlative' },
  { order: 8, titleDe: 'Pläne für nächstes Jahr', targetStructures: 'Futur I mit werden + Infinitiv', prereqSlug: 'future-tense' },
];
const missionByOrder = (order) => {
  const m = A22_SPEAKING_MISSIONS.find((x) => x.order === order);
  if (!m) throw new Error(`a22Phase.js: no A2.2 speaking mission with order ${order}`);
  return m;
};

// Speaking missions have no per-mission SPA route (App.jsx: a single
// "/speaking" route with no :level or :missionId param) — same generic hub
// href a21Phase.js/a12Phase.js/a11Phase.js use ("/speaking/", trailing slash:
// case 2 of the trailing-slash rule, a prerendered hub). None of the eight
// A2.2 titles carries its own "Sprechen Teil N" framing, so one frame fits
// all eight.
//
// Frame matches a21Phase.js's own convention (`Sprechen: Mission „…“`).
// Round 2 briefly used an em dash here because the interim mission-2 retitle
// ("Mein Urlaub: Nichts hat geklappt") carried its own colon, which would
// have stacked two colons in one title; Round 3's retitle ("Ein Urlaub mit
// Problemen") is colon-free, so none of the eight mission titles carries a
// colon and the shipped a21Phase.js frame is safe to restore as-is.
// verify.mjs still enforces "at most one colon per title" file-wide.
const speaking = (id, order, minutes = 15) => ({
  id,
  type: 'speaking',
  title: `Sprechen: Mission „${missionByOrder(order).titleDe}“`,
  minutes,
  href: '/speaking/',
});

// -----------------------------------------------------------------------
// Listening — 6 exercises, spread across all four weeks (brief: "listening
// spread across the weeks" — unlike a21Phase.js, which ran a first pass then
// a dictation pass, this plan uses each of the 6 exactly once)
// -----------------------------------------------------------------------
// A2.2 has 6 listening exercises, deep-linked via the real SPA route
// /listening/:level/:exerciseNumber — no trailing slash, case 3 of the
// trailing-slash rule. Titles pulled 2026-09-06 via execute_sql (read-only)
// from listening_exercises where upper(level) = 'A2.2' — see
// plan/source/listening-a2.2.json. The lookup throws on an unknown number,
// like missionByOrder.
const A22_LISTENING_TITLES = {
  1: 'Arbeit und Beruf',
  2: 'Gesundheit und Fitness',
  3: 'Kultur und Veranstaltungen',
  4: 'Bank und Finanzen',
  5: 'Behörden und Ämter',
  6: 'Umwelt und Nachhaltigkeit',
};
const listeningTitle = (n) => {
  const title = A22_LISTENING_TITLES[n];
  if (!title) throw new Error(`a22Phase.js: no A2.2 listening exercise title for exercise ${n}`);
  return title;
};
const listening = (id, n, minutes = 15) => ({
  id,
  type: 'listening',
  title: `Hören: Übung ${n} — „${listeningTitle(n)}“`,
  minutes,
  href: `/listening/a2.2/${n}`,
});

// -----------------------------------------------------------------------
// Reading — exactly 10 items: 8 live + 2 exam-format (added this wave)
// -----------------------------------------------------------------------
// Reading lessons are addressed by the level hub (/reading/a2.2, no trailing
// slash, case 3) rather than a per-lesson id: the ids are known offline
// (execute_sql, order_index 1–8, see plan/source/reading-a2.2-titles.json —
// the brief's "if S/reading/rewrites-a2.2.json exists" clause does not apply,
// no such file exists in this scratchpad, and a live re-read confirms the
// titles are unchanged from that cache) but the hub rotates content and a
// pinned id would break when a row is re-ordered or replaced; the hub
// reference stays correct either way. The titles ARE carried, so the ten
// items read distinctly. `n` is out of a fixed 10, so "Text N von 10" can
// never drift from what this file contains. Items 9/10 are the two
// exam-format lessons PR C of this wave adds ("Lesen Teil 2: Eine
// Informationstafel" and "Lesen Teil 4: Anzeigen zuordnen", both "wie in der
// Prüfung") — titles fixed verbatim by the plan brief. Same branch-on-the-
// data rule a21Phase.js used for its own two exam-format titles: they carry
// their own "Lesen Teil N: …" framing, so the generic "Lesen: … — <Titel>"
// frame would repeat the word Lesen AND nest a second colon; they take the
// numbering as a suffix instead, which keeps every source title verbatim and
// every title at one colon.
const READING_TOTAL = 10;
const A22_READING_TITLES = {
  1: 'Ein unvergessliches Erlebnis',
  2: 'Meine Pläne für die Zukunft',
  3: 'Wahre Freundschaft',
  4: 'Wohnungssuche in Deutschland',
  5: 'Medien und Nachrichten',
  6: 'Deutsche Kultur und Traditionen',
  7: 'Feste und Feiertage in Deutschland',
  8: 'Gesund leben',
  9: 'Lesen Teil 2: Eine Informationstafel (wie in der Prüfung)',
  10: 'Lesen Teil 4: Anzeigen zuordnen (wie in der Prüfung)',
};
const reading = (id, n, minutes = 15) => {
  const title = A22_READING_TITLES[n];
  if (!title) throw new Error(`a22Phase.js: no A2.2 reading lesson title for text ${n}`);
  return {
    id,
    type: 'reading',
    title: title.startsWith('Lesen')
      ? `${title} — Text ${n} von ${READING_TOTAL}`
      : `Lesen: Text ${n} von ${READING_TOTAL} — ${title}`,
    minutes,
    href: '/reading/a2.2',
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
// file — same discipline a21Phase.js pins after round 1 let generic X-Ray
// defaults collide. Every call below names the structure the learner should
// produce that day, and verify.mjs checks the titles are distinct.
const xray = (id, minutes, title) => {
  if (!title) throw new Error(`a22Phase.js: X-Ray item ${id} needs its own title — there is no generic default`);
  return {
    id,
    type: 'xray',
    title,
    minutes,
    href: '/analyze/',
  };
};

// Exam-format orientation, Tag 1 only — the Goethe-A2 Leitfaden (Astro,
// trailing slash, external:true). LIVE today (astro-site/src/data/guides/
// goethe-a2.js, PR D1 of this wave) — unlike the equivalent item in
// a21Phase.js, this is not a forward reference.
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
// LIVE today (all four goethe_a2 tasks exist), but the guard below still
// throws at import time naming the dependency — same defensive shape
// a21Phase.js used while its own bank was pending, kept here so a future
// rename/removal of a task fails loudly instead of silently shipping a plan
// with missing writing days. Route: /schreiben/goethe-a2 — SchreibenPage
// reads :examSlug and resolves it through examTrackBySlug, and netlify.toml
// wildcards "/schreiben/*" (no trailing slash, case 3). Bank titles start
// "SMS: " / "E-Mail: " in the goethe_a1 house style, so the frame's own word
// is stripped from the appended title (anti-stutter).
const A2_SMS_TASKS = writingTasksForExam('goethe_a2').filter((t) => t.taskKey.startsWith('sms-'));
const A2_EMAIL_TASKS = writingTasksForExam('goethe_a2').filter((t) => t.taskKey.startsWith('email-'));
if (A2_SMS_TASKS.length < 2 || A2_EMAIL_TASKS.length < 2) {
  throw new Error(
    `a22Phase.js requires 2 'sms-' and 2 'email-' goethe_a2 writing tasks in writingTasks.js — ` +
      `found ${A2_SMS_TASKS.length} SMS and ${A2_EMAIL_TASKS.length} E-Mail. ` +
      `This program is not importable until they land.`
  );
}
const schreiben = (id, kind, taskNumber, minutes) => {
  const tasks = kind === 'sms' ? A2_SMS_TASKS : A2_EMAIL_TASKS;
  if (taskNumber < 1 || taskNumber > tasks.length) {
    throw new Error(`a22Phase.js: ${kind} task number ${taskNumber} out of range (1-${tasks.length})`);
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
// UNVERIFIED DEPENDENCY, same forward-reference pattern the A1/A2.1 plans
// used: /modelltest/abschlusstest-a2-2 names a course-test module + registry
// entry that lands in PR D2a of this wave. The generic SPA route
// /modelltest/:examSlug exists and netlify.toml wildcards "/modelltest/*"
// (no trailing slash, case 3), so the URL SHAPE is safe; only the exam DATA
// behind the slug is pending. Both items are budgeted at the test's real
// length (55 min, ≈ half the real Goethe-A2 exam) — see notes.md.
const modelltest = (id, title, minutes) => ({
  id,
  type: 'exam',
  title,
  minutes,
  href: '/modelltest/abschlusstest-a2-2',
});

// Hand-off on Tag 28 — a real, clickable exit rather than prose alone (the
// week `intro` renders inside a bare <p> and cannot carry an href). Unlike
// a21Phase.js's Tag 28, which pointed at the bare LEVEL page because no A2.2
// plan existed yet, this is the END of the A2 teaching chain: it hands the
// learner to the 30-day Goethe-A2 exam plan at /goethe-a2-kurs (Wave 6 PR B,
// goetheA2Kurs.js), which sequences the Kurzversion mock, the official
// Modellsatz/Übungssatz and the Schreiben/Sprechen rehearsal — the same
// shape as the A1.2 → /start-deutsch-1-kurs hand-off. tests/purchases.test.mjs
// pins this href.
const nextStep = (id, minutes = 5) => ({
  id,
  type: 'exam',
  title: 'Weiter: 30-Tage-Prüfungsplan Goethe A2',
  minutes,
  href: '/goethe-a2-kurs',
});

// -----------------------------------------------------------------------
// The plan
// -----------------------------------------------------------------------
// 28 days, 4 weeks of 7. 55–75 minutes/day, except two lighter "Puffertage"
// (Tag 14 and Tag 27, ≤40 min, review only — no new content). 2–4 items/day.
//
// The 12 grammar lessons run 3 per week in PEDAGOGICAL order (the brief's
// fixed sequence):
//   Woche 1 (Tag 1–7):   reflexive-verbs (Tag 1),
//                        verbs-with-prepositions-intro (Tag 3),
//                        simple-past-sein-haben (Tag 5)
//   Woche 2 (Tag 8–14):  coordinating-conjunctions (Tag 8),
//                        subordinating-conjunctions (Tag 10),
//                        subordinate-word-order (Tag 12)
//   Woche 3 (Tag 15–21): indirect-questions-intro (Tag 15),
//                        infinitive-with-zu-intro (Tag 17), comparative (Tag 19)
//   Woche 4 (Tag 22–28): superlative (Tag 22), konjunktiv-ii-polite (Tag 23),
//                        future-tense (Tag 25)
// Every lesson's Wiederholung lands 1–2 days after its own introduction —
// eleven of the twelve at 2 days, one (superlative, Tag 22→23) at 1, where
// Woche 4's fixed test days leave no room for a second — same trade-off
// a21Phase.js made for imperative-mood. No day carries a topic's Übungen and
// its Wiederholung together — verify.mjs checks this directly.
//
// Every day after a lesson is that lesson's production day: the eight OLD
// topics get their mission (M1→Tag 2, M2→Tag 6, M3→Tag 9, M4→Tag 11,
// M5→Tag 13, M6→Tag 20, M7→Tag 23, M8→Tag 26), the four NEW topics get
// `uebung()` + a written X-Ray item instead (Tag 4, Tag 16, Tag 18, Tag 24).
//
// Writing: SMS practice in Woche 2 and Woche 3 (Tag 9, Tag 16), E-Mail in
// Woche 3 and Woche 4 (Tag 18, Tag 22) — the brief's split.
// Listening: all 6 exercises once each, spread across all four weeks
// (Tag 2, Tag 3, Tag 8, Tag 9, Tag 15, Tag 24) rather than bunched early.
// Reading: texts 1–8 in order across Woche 1–3, the two exam-format texts (9,
// 10) on Tag 22 and Tag 25 — both before the Probe on Tag 26, per the brief.
//
// Tag 1 gives a first win fast: item 1 is the first grammar lesson, item 2 a
// 5-minute X-Ray pass — instant AI analysis — before the day continues into
// the Prüfungsüberblick and the first reading text.
//
// Register note: the copy AUTHORED here obeys the A2.2 level file — no
// Präteritum of full verbs, no Genitiv beyond the name-s, no relative clauses,
// no un-taught Konjunktiv II forms, every Nebensatz and zu-Gruppe comma'd.
// Two classes of DERIVED string are outside that reach and are accepted
// knowingly, same as a21Phase.js: the grammar topics' own names
// (grammarTopics.js `titleDe`) and the writing bank's task titles
// (writingTasks.js). Both are derive-never-retype sources; fixing them means
// fixing them upstream, not paraphrasing them here.
//
// Week-intro length: each intro below is EXACTLY 2 sentences and every
// sentence stays ≤16 words (the A2.2 register rule), so the two caps hold at
// once — no semicolon-stuffed clauses. verify.mjs checks both.
const WEEKS = [
  {
    title: 'Woche 1 — Reflexive Verben und Präpositionen',
    intro:
      'Diese Woche lernst du reflexive Verben und Verben mit Präpositionen. ' +
      'Dazu kommen war und hatte, zwei Sprechmissionen und die ersten Hörtexte.',
    days: [
      {
        label: 'Tag 1',
        items: [
          gLesson('reflexive-verbs'),
          xray('d1-xray', 5, 'X-Ray: ein Satz mit einem reflexiven Verb — sofort geprüft'),
          orientation('d1-orientation'),
          reading('d1-reading', 1),
        ],
      },
      {
        label: 'Tag 2',
        items: [
          speaking('d2-speaking', 1),
          listening('d2-listening', 1),
          reading('d2-reading', 2),
          xray('d2-xray', 20, 'X-Ray: fünf Sätze mit mich, dich und sich'),
        ],
      },
      {
        label: 'Tag 3',
        items: [gLesson('verbs-with-prepositions-intro'), gReview('reflexive-verbs'), listening('d3-listening', 2)],
      },
      {
        label: 'Tag 4',
        items: [
          uebung('verbs-with-prepositions-intro'),
          xray('d4-xray', 20, 'X-Ray: fünf Sätze mit warten auf und sich freuen über'),
          reading('d4-reading', 3),
        ],
      },
      {
        label: 'Tag 5',
        items: [gLesson('simple-past-sein-haben'), gReview('verbs-with-prepositions-intro', 22), xray('d5-xray', 20, 'X-Ray: fünf Sätze mit war und hatte')],
      },
      {
        label: 'Tag 6',
        items: [
          speaking('d6-speaking', 2),
          hubReview('d6-review', 'Wiederholen: reflexive Verben und Verben mit Präpositionen', 20),
          xray('d6-xray', 25, 'X-Ray: fünf Sätze über dein letztes Wochenende'),
        ],
      },
      {
        label: 'Tag 7',
        items: [
          srsReview('d7-srs', 'Woche 1', 25),
          gReview('simple-past-sein-haben'),
          hubReview('d7-review', 'Wiederholen: die drei Themen aus Woche 1', 15),
        ],
      },
    ],
  },
  {
    title: 'Woche 2 — Sätze verbinden',
    intro:
      'Diese Woche verbindest du Sätze mit und, aber, oder, denn, weil, dass und wenn. ' +
      'Dazu kommt deine erste SMS-Aufgabe.',
    days: [
      {
        label: 'Tag 8',
        items: [
          gLesson('coordinating-conjunctions'),
          listening('d8-listening', 3),
          reading('d8-reading', 4),
          xray('d8-xray', 20, 'X-Ray: fünf Sätze mit und, aber und denn'),
        ],
      },
      {
        label: 'Tag 9',
        items: [
          speaking('d9-speaking', 3),
          schreiben('d9-schreiben', 'sms', 1, 20),
          reading('d9-reading', 5),
          listening('d9-listening', 4),
        ],
      },
      {
        label: 'Tag 10',
        items: [gLesson('subordinating-conjunctions'), gReview('coordinating-conjunctions', 15), reading('d10-reading', 6)],
      },
      {
        label: 'Tag 11',
        items: [
          speaking('d11-speaking', 4),
          xray('d11-xray', 20, 'X-Ray: fünf Sätze mit weil und dass'),
          hubReview('d11-review', 'Wiederholen: weil, dass und die Konjunktionen', 20),
        ],
      },
      {
        label: 'Tag 12',
        items: [
          gLesson('subordinate-word-order'),
          gReview('subordinating-conjunctions'),
          xray('d12-xray', 20, 'X-Ray: fünf Sätze mit Verb am Ende im Nebensatz'),
        ],
      },
      {
        label: 'Tag 13',
        items: [
          speaking('d13-speaking', 5),
          hubReview('d13-review', 'Wiederholen: die drei Themen aus Woche 2', 20),
          xray('d13-xray', 20, 'X-Ray: fünf Sätze mit weil, dass und wenn zusammen'),
        ],
      },
      {
        label: 'Tag 14 — Puffertag',
        items: [srsReview('d14-srs', 'Woche 2', 25), gReview('subordinate-word-order', 15)],
      },
    ],
  },
  {
    title: 'Woche 3 — Indirekte Fragen, Infinitiv mit zu, Komparativ',
    intro:
      'Diese Woche stellst du indirekte Fragen und lernst den Infinitiv mit zu. ' +
      'Dazu kommen der Komparativ und deine erste E-Mail-Aufgabe.',
    days: [
      {
        label: 'Tag 15',
        items: [
          gLesson('indirect-questions-intro'),
          listening('d15-listening', 5),
          reading('d15-reading', 7),
          xray('d15-xray', 20, 'X-Ray: fünf indirekte Fragen mit ob'),
        ],
      },
      {
        label: 'Tag 16',
        items: [
          uebung('indirect-questions-intro'),
          xray('d16-xray', 20, 'X-Ray: fünf indirekte Fragen mit einem W-Wort'),
          schreiben('d16-schreiben', 'sms', 2, 20),
        ],
      },
      {
        label: 'Tag 17',
        items: [gLesson('infinitive-with-zu-intro'), gReview('indirect-questions-intro', 22), reading('d17-reading', 8)],
      },
      {
        label: 'Tag 18',
        items: [
          uebung('infinitive-with-zu-intro'),
          xray('d18-xray', 20, 'X-Ray: fünf Sätze mit einer zu-Gruppe'),
          schreiben('d18-schreiben', 'email', 1, 25),
        ],
      },
      {
        label: 'Tag 19',
        items: [gLesson('comparative'), gReview('infinitive-with-zu-intro', 23), xray('d19-xray', 20, 'X-Ray: fünf Sätze im Komparativ')],
      },
      {
        label: 'Tag 20',
        items: [
          speaking('d20-speaking', 6),
          hubReview('d20-review', 'Wiederholen: indirekte Fragen und Infinitiv mit zu', 20),
          xray('d20-xray', 20, 'X-Ray: fünf Vergleiche mit als'),
        ],
      },
      {
        label: 'Tag 21',
        items: [
          srsReview('d21-srs', 'Woche 3', 25),
          gReview('comparative'),
          hubReview('d21-review', 'Wiederholen: alle Themen aus Woche 1 bis Woche 3', 20),
        ],
      },
    ],
  },
  {
    title: 'Woche 4 — Superlativ, Höflichkeit und Futur, dann der Abschlusstest',
    intro:
      'Diese Woche kommen der Superlativ, höfliche Bitten und das Futur I. ' +
      'Danach folgen der Probe-Abschlusstest und der Abschlusstest A2.2.',
    days: [
      {
        label: 'Tag 22',
        items: [gLesson('superlative'), schreiben('d22-schreiben', 'email', 2, 25), reading('d22-reading', 9, 20)],
      },
      {
        label: 'Tag 23',
        items: [
          gLesson('konjunktiv-ii-polite'),
          speaking('d23-speaking', 7),
          gReview('superlative', 20),
          xray('d23-xray', 15, 'X-Ray: fünf Sätze im Superlativ'),
        ],
      },
      {
        label: 'Tag 24',
        items: [
          uebung('konjunktiv-ii-polite'),
          xray('d24-xray', 20, 'X-Ray: fünf höfliche Bitten mit würde und könnte'),
          listening('d24-listening', 6),
        ],
      },
      {
        label: 'Tag 25',
        items: [gLesson('future-tense'), gReview('konjunktiv-ii-polite', 22), reading('d25-reading', 10, 20)],
      },
      {
        label: 'Tag 26',
        items: [
          speaking('d26-speaking', 8),
          modelltest('d26-probe', 'Probe-Abschlusstest A2.2 (ungewertet, Kurzversion)', 55),
        ],
      },
      {
        label: 'Tag 27 — Puffertag',
        items: [srsReview('d27-srs', 'Woche 4', 25), gReview('future-tense', 15)],
      },
      {
        label: 'Tag 28',
        items: [
          xray('d28-xray', 15, 'X-Ray: Aufwärmen vor dem Abschlusstest'),
          modelltest('d28-abschlusstest', 'Abschlusstest A2.2 (gewertet, Kurzversion, Goethe-A2-Format)', 55),
          nextStep('d28-next'),
        ],
      },
    ],
  },
];

// Derived, never retyped: the sum of every item's minutes across all 28 days,
// computed from WEEKS directly so PROGRAM.subtitle quotes the number it
// derives. Read PROGRAM_MINUTES itself for the current figure rather than
// trusting a number retyped into this comment; verify.mjs prints it on every
// run.
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
    'Teil 2 von A2, mit dem Abschlusstest A2.2 als Ziel. ' +
    'Danach kommt der Goethe A2 Übungstest.',
  weeks: WEEKS,
};

/** Flat list of every item id, for progress accounting. */
export const allItemIds = () =>
  PROGRAM.weeks.flatMap((w) => w.days.flatMap((d) => d.items.map((i) => i.id)));
