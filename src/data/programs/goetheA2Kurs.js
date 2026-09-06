// "Goethe-Zertifikat A2: 30 Tage bis zur Prüfung" — a dated, backward-planned
// EXAM-REHEARSAL phase for a learner who has already finished A2.1 and A2.2
// (both paid courses, both Abschlusstests exist). Unlike a11Phase.js /
// a12Phase.js / a21Phase.js / a22Phase.js — which teach NEW grammar in
// sequence — this plan teaches NOTHING new: every grammar review day revisits
// an already-taught A2.1 or A2.2 topic, chosen because a specific Goethe A2
// Prüfungsteil needs that form (see the per-topic comments below). The spine
// is the FOUR Prüfungsteile (Lesen, Hören, Schreiben, Sprechen), not the
// grammar list — same shape, item factories, comment discipline and
// derive-never-retype rule as startDeutsch1.js (the A1 exam-phase template)
// and a22Phase.js (the newer PROGRAM_MINUTES/PROGRAM_HOURS convention this
// module follows).
//
// Item `type` values drive the icon/label on the course page (same TYPE_ICON
// set every sibling program uses):
//   lesson | listening | reading | speaking | xray | exam | review
// There is no dedicated "writing" or "guide" type: the SMS/E-Mail tasks, both
// course-test Proben, the Leitfaden and both official PDFs use 'exam'; every
// grammar-review day and every SRS/hub day use 'review' (this plan has no
// `lesson` items at all — nothing here is a first exposure).
//
// Honesty (binding, per plan-brief.md "Product framing"): no outcome promise
// anywhere in this file. The in-app mock has NO Sprechen part — PROGRAM.subtitle
// says so — because Sprechen can only be rehearsed live, on /speaking/
// (missions) or with a real partner, never graded automatically. There are
// exactly TWO official Goethe A2 Erwachsene practice sets (Modellsatz +
// Übungssatz); their URLs are taken verbatim from
// astro-site/src/data/guides/goethe-a2.js `sources` (read 2026-09-06) — never
// a third, invented one.

import { getTopicsForLevel } from '../grammarTopics.js';
import { writingTasksForExam } from '../writingTasks.js';

export const PROGRAM_KEY = 'goethe_a2_30_tage';

export const PROGRAM_TITLE = 'Goethe-Zertifikat A2: 30 Tage bis zur Prüfung';

// -----------------------------------------------------------------------
// Grammar review — 9 already-taught topics (3 from A2.1, 6 from A2.2),
// picked because a Goethe A2 Prüfungsteil needs exactly that form. Nothing
// here is new; every slug is reviewed ONCE, on the day that Prüfungsteil is
// rehearsed. All 24 A2.1+A2.2 slugs exist in grammarTopics.js today — same
// import-time throw-on-missing-slug discipline as a22Phase.js, so a future
// slug rename/removal fails loudly instead of silently dropping a review day.
// -----------------------------------------------------------------------
const a21 = getTopicsForLevel('a2.1');
const a22 = getTopicsForLevel('a2.2');
const bySlug = (level, slug) => (level === 'a2.1' ? a21 : a22).find((t) => t.slug === slug);

// [level, slug] pairs in the order they are first used below — kept as one
// list so the import-time guard can name every missing slug at once.
const REVIEW_SLUGS = [
  ['a2.2', 'subordinating-conjunctions'],
  ['a2.1', 'pronouns-accusative-dative'],
  ['a2.1', 'modal-verbs-past'],
  ['a2.2', 'subordinate-word-order'],
  ['a2.2', 'konjunktiv-ii-polite'],
  ['a2.2', 'indirect-questions-intro'],
  ['a2.1', 'adjective-endings-intro'],
  ['a2.2', 'verbs-with-prepositions-intro'],
  ['a2.2', 'infinitive-with-zu-intro'],
];
const missingReviewSlugs = REVIEW_SLUGS.filter(([level, slug]) => !bySlug(level, slug)).map(
  ([level, slug]) => `${level}/${slug}`
);
if (missingReviewSlugs.length > 0) {
  throw new Error(
    `goetheA2Kurs.js requires these A2.1/A2.2 grammar topics to exist in grammarTopics.js — ` +
      `missing: ${missingReviewSlugs.join(', ')}. This program is not importable until they land.`
  );
}

// Grammar review pages are served by the Astro build (trailing-slash class) —
// see the three-place route rule and CLAUDE.md's trailing-slash case 1.
// `external` makes the course page render a full-load <a>, since the SPA
// carries no lesson route of its own. `examPart` is carried at the call site
// (not only in a comment) so the constraint that chose this topic is visible
// where it is used; verify.mjs does not check its wording, only that it is a
// non-empty string, but a reviewer reading the plan sees the "why" inline.
// Title shape (plan-brief item shape, ≤10 words): `<Prüfungsteil>: <topic.titleDe>`,
// where <Prüfungsteil> is only the FIRST exam part named in `examPart` (split
// on " und ") — a review day drills one topic for its primary Prüfungsteil,
// the full multi-part rationale still lives in the `examPart` argument at the
// call site. `topic.titleDe` is truncated at its own first colon where it has
// one (konjunktiv-ii-polite's titleDe carries a colon-led list of forms) —
// derive-never-retype still holds: this takes the topic's own name verbatim
// up to its own punctuation boundary, it does not paraphrase.
const gReview = (id, level, slug, examPart, minutes, round = 1) => {
  const topic = bySlug(level, slug);
  const shortTopicTitle = topic.titleDe.split(':')[0].trim();
  // `examPart` is the call-site rationale (which Prüfungsteil needs this form);
  // the learner-facing title says what the item IS — a review — and, on a
  // second pass, that it is one (m2/m3 of the round-2 review).
  void examPart;
  return {
    id,
    type: 'review',
    title: `Wiederholen: ${shortTopicTitle}${round === 2 ? ' (zweite Runde)' : ''}`,
    minutes: minutes || topic.estimatedTime || 20,
    href: `/grammar/${level}/${topic.slug}/`,
    external: true,
  };
};

// A single non-topic-specific review pointing back at a level's grammar hub —
// same pattern a22Phase.js's hubReview uses. No slug to resolve, so no throw
// risk.
const hubReview = (id, level, title, minutes) => ({
  id,
  type: 'review',
  title,
  minutes,
  href: `/grammar/${level}/`,
  external: true,
});

// The spaced-repetition trainer at the dedicated /vocabulary route
// (VocabularySectionPage.jsx renders SrsTrainer there) — same factory shape
// as a22Phase.js's srsReview.
const srsReview = (id, weekLabel, minutes = 25) => ({
  id,
  type: 'review',
  title: `Wortschatz-Wiederholung: deine Karteikarten aus ${weekLabel}`,
  minutes,
  href: '/vocabulary',
});

// -----------------------------------------------------------------------
// Reading — the two level hubs. Reading lessons are addressed by a DB-issued
// lessonId that cannot be verified offline (same reasoning as
// startDeutsch1.js's own `reading()`), so this links the level hub
// (/reading/:level, no trailing slash, case 3) rather than a fabricated
// per-lesson id; reusing the same hub href across several days is the
// established pattern. The two A2.2 EXAM-FORMAT lessons (order 9/10, added in
// Wave 5 PR C) carry their own fixed "Lesen Teil N" titles, taken verbatim —
// same source and same anti-stutter branch a22Phase.js uses for these two
// titles (they already start with "Lesen", so the generic frame is skipped).
// -----------------------------------------------------------------------
const reading = (id, level, minutes = 15) => ({
  id,
  type: 'reading',
  title: `Lesen: ein Text auf ${level.toUpperCase()}-Niveau`,
  minutes,
  href: `/reading/${level}`,
});

const A22_EXAM_READING_TITLES = {
  9: 'Lesen Teil 2: Eine Informationstafel (wie in der Prüfung)',
  10: 'Lesen Teil 4: Anzeigen zuordnen (wie in der Prüfung)',
};
const readingExamFormat = (id, n, minutes = 20) => {
  const title = A22_EXAM_READING_TITLES[n];
  if (!title) throw new Error(`goetheA2Kurs.js: no exam-format reading title for text ${n}`);
  return { id, type: 'reading', title, minutes, href: '/reading/a2.2' };
};

// -----------------------------------------------------------------------
// Listening — /listening/a2.2/1..6, deep-linked via the real SPA route
// /listening/:level/:exerciseNumber — no trailing slash, case 3. Titles
// cached from a22Phase.js (A22_LISTENING_TITLES, sourced there from
// listening_exercises where upper(level)='A2.2') rather than retyped from
// nothing; the lookup throws on an unknown exercise number, same discipline
// a22Phase.js applies.
//
// Overlap (deliberate, per plan-brief.md): exercise #1 and #6 are also drawn
// on by the mock (goetheA2Mock, Tag 26/30) and exercise #2 by the Abschlusstest
// A2.2 (Probe, Tag 12). This plan still schedules all three as ordinary
// listening practice (#1 on Tag 2 and again on Tag 25; #6 on Tag 16 and again
// on Tag 28; #2 on Tag 4) — re-hearing an exercise before it resurfaces inside
// a test is deliberate rehearsal, not a scheduling accident.
// -----------------------------------------------------------------------
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
  if (!title) throw new Error(`goetheA2Kurs.js: no A2.2 listening exercise title for exercise ${n}`);
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
// Speaking — no per-mission SPA route (App.jsx: a single "/speaking" route,
// no :level/:missionId param) — same generic hub href every sibling program
// uses ("/speaking/", trailing slash: case 2). Sprechen can only be rehearsed
// there or with a partner — never graded automatically — so every title
// below names the Prüfungsteil it drills, not a promised outcome.
// -----------------------------------------------------------------------
const speaking = (id, title, minutes = 20) => ({ id, type: 'speaking', title, minutes, href: '/speaking/' });

// -----------------------------------------------------------------------
// X-Ray — /analyze/, trailing slash (case 2), same factory shape every
// sibling program uses. `title` is REQUIRED (no generic default), matching
// a22Phase.js's discipline after its round 1 let generic defaults collide.
// -----------------------------------------------------------------------
const xray = (id, minutes, title) => {
  if (!title) throw new Error(`goetheA2Kurs.js: X-Ray item ${id} needs its own title — there is no generic default`);
  return { id, type: 'xray', title, minutes, href: '/analyze/' };
};

// -----------------------------------------------------------------------
// Writing — all four goethe_a2 tasks (2 SMS = Schreiben Teil 1, 2 E-Mail =
// Schreiben Teil 2), derived from writingTasks.js by taskKey prefix, never
// retyped — same pattern a22Phase.js uses. Route: /schreiben/goethe-a2
// (SchreibenPage reads :examSlug and resolves it through examTrackBySlug;
// netlify.toml wildcards "/schreiben/*", no trailing slash, case 3). Bank
// titles start "SMS: " / "E-Mail: " — that frame word is stripped from the
// appended title (anti-stutter), same regex a22Phase.js uses.
// -----------------------------------------------------------------------
const A2_SMS_TASKS = writingTasksForExam('goethe_a2').filter((t) => t.taskKey.startsWith('sms-'));
const A2_EMAIL_TASKS = writingTasksForExam('goethe_a2').filter((t) => t.taskKey.startsWith('email-'));
if (A2_SMS_TASKS.length < 2 || A2_EMAIL_TASKS.length < 2) {
  throw new Error(
    `goetheA2Kurs.js requires 2 'sms-' and 2 'email-' goethe_a2 writing tasks in writingTasks.js — ` +
      `found ${A2_SMS_TASKS.length} SMS and ${A2_EMAIL_TASKS.length} E-Mail. ` +
      `This program is not importable until they land.`
  );
}
const schreiben = (id, kind, taskNumber, minutes, round = 1) => {
  const tasks = kind === 'sms' ? A2_SMS_TASKS : A2_EMAIL_TASKS;
  if (taskNumber < 1 || taskNumber > tasks.length) {
    throw new Error(`goetheA2Kurs.js: ${kind} task number ${taskNumber} out of range (1-${tasks.length})`);
  }
  const frame = kind === 'sms' ? 'Schreiben Teil 1: SMS' : 'Schreiben Teil 2: E-Mail';
  const shortTitle = tasks[taskNumber - 1].title.replace(/^(SMS|E-Mail|Nachricht):\s*/, '');
  const marker = round === 2 ? ' (Wiederholung)' : ''; // one word: the 10-word title cap
  return { id, type: 'exam', title: `${frame} — ${shortTitle}${marker}`, minutes, href: '/schreiben/goethe-a2' };
};

// -----------------------------------------------------------------------
// Course-test Proben — ungraded re-attempts at the two Abschlusstests the
// learner already sat during A2.1/A2.2, used here as a diagnostic before the
// real mock. Route /modelltest/:examSlug is the existing generic SPA route
// (netlify.toml wildcards "/modelltest/*", no trailing slash, case 3); both
// slugs are LIVE (a21Phase.js / a22Phase.js already ship these Abschlusstests
// at the end of their own plans).
// -----------------------------------------------------------------------
const probeAbschlusstest = (id, level, minutes = 55) => ({
  id,
  type: 'exam',
  title: `Probe: Abschlusstest ${level.toUpperCase()} noch einmal machen`,
  minutes,
  href: `/modelltest/abschlusstest-a2-${level === 'a2.1' ? '1' : '2'}`,
});

// The GRADED mock, exactly twice (Tag 26 and Tag 30, per plan-brief). Minutes
// are DERIVED, never retyped: MOCK_EXAMS.goethe_a2 (src/data/mockExams/goetheA2.js)
// sums its three sections (Hören 20 + Lesen 20 + Schreiben 20) to 60 —
// verify.mjs imports that module directly and asserts both mock items match
// its sum. The title uses the artifact's own name, "Übungstest (Kurzversion)"
// (goetheA2Mock.title), not an invented "Modelltest" label, and says "ohne
// Sprechen" — the title itself is the honesty check, never implying the plan
// rehearses Sprechen through this route.
const mockExam = (id, attempt, minutes) => ({
  id,
  type: 'exam',
  title: `Übungstest Goethe A2 — Versuch ${attempt} (Kurzversion, ohne Sprechen)`,
  minutes,
  href: '/modelltest/goethe-a2',
});

// Exam-format orientation, Tag 1 and Tag 15 — the Goethe-A2 Leitfaden (Astro,
// trailing slash, external:true). LIVE today (astro-site/src/data/guides/
// goethe-a2.js).
const orientation = (id, minutes = 20) => ({
  id,
  type: 'exam',
  title: 'Prüfungsüberblick: Ablauf und Punkte beim Goethe-Zertifikat A2',
  minutes,
  href: '/leitfaden/goethe-a2/',
  external: true,
});

// The two, and only two, official Goethe A2 Erwachsene practice sets —
// external:true. URLs taken verbatim from astro-site/src/data/guides/
// goethe-a2.js `sources` (read 2026-09-06); never a third, invented one.
const GOETHE_A2_MATERIALS = [
  {
    title: 'Offizieller Modellsatz Erwachsene (Goethe-Institut, Goethe-Zertifikat A2)',
    url: 'https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Modellsatz_Erwachsene.pdf',
  },
  {
    title: 'Offizieller Übungssatz Erwachsene (Goethe-Institut, Goethe-Zertifikat A2)',
    url: 'https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf',
  },
];
const goetheMaterial = (id, n, minutes = 50) => ({
  id,
  type: 'exam',
  title: GOETHE_A2_MATERIALS[n - 1].title,
  minutes,
  href: GOETHE_A2_MATERIALS[n - 1].url,
  external: true,
});

// -----------------------------------------------------------------------
// The plan
// -----------------------------------------------------------------------
// 30 days, 5 weeks: 4 study weeks of 7 days + a 2-day Pufferzeit — same shape
// as startDeutsch1.js. 45–75 min/day, two lighter Puffertage (Tag 14, Tag 29).
// The spine is the four Prüfungsteile, not the grammar list:
//   Lesen    — reading() / readingExamFormat() every week, both level hubs
//   Hören    — all 6 A2.2 listening exercises, spread across weeks 1–3 plus
//              a final revisit in week 4
//   Schreiben — all 4 goethe_a2 tasks (2 SMS = Teil 1, 2 E-Mail = Teil 2)
//   Sprechen — /speaking/ rehearsal days naming the Prüfungsteil drilled;
//              honesty: never graded here, only in a live mission or with a
//              partner
// Grammar review is placed ONLY where a Prüfungsteil needs the form — each
// gReview() call below carries its own `examPart` argument, so the mapping is
// visible at the call site rather than duplicated here.
// Two Probe course tests (Tag 5 Abschlusstest A2.1, Tag 12 Abschlusstest
// A2.2), a Schreiben re-run in Woche 1 (Tag 6) and Woche 4 (Tag 27) so every
// study week rehearses all four Prüfungsteile, the two official Goethe PDFs
// on Tage 22–23, the graded mock (Übungstest Kurzversion) on Tag 26
// (Versuch 1) and Tag 30 (Versuch 2) — nothing after Tag 30; there is no
// A2.3.
const WEEKS = [
  {
    title: 'Woche 1 — Ankommen im Prüfungsformat',
    intro:
      'In dieser Woche wiederholst du dein A2-Wissen und lernst das Prüfungsformat kennen. ' +
      'An Tag 5 wiederholst du den Abschlusstest A2.1.',
    days: [
      {
        label: 'Tag 1',
        items: [orientation('d1-orientation'), reading('d1-reading', 'a2.1'), xray('d1-xray', 10, 'X-Ray: dein erster Satz zur Aufwärmung')],
      },
      {
        label: 'Tag 2',
        items: [
          gReview('d2-review', 'a2.2', 'subordinating-conjunctions', 'Lesen', 20),
          reading('d2-reading', 'a2.2'),
          listening('d2-listening', 1),
        ],
      },
      {
        label: 'Tag 3',
        items: [
          speaking('d3-speaking', 'Sprechen Teil 1: sich vorstellen üben'),
          reading('d3-reading', 'a2.1'),
          xray('d3-xray', 15, 'X-Ray: fünf Sätze zur eigenen Person'),
        ],
      },
      {
        label: 'Tag 4',
        items: [
          gReview('d4-review', 'a2.1', 'pronouns-accusative-dative', 'Schreiben Teil 1 und Sprechen Teil 3', 25),
          listening('d4-listening', 2),
          xray('d4-xray', 15, 'X-Ray: fünf Sätze mit mir, dir und ihm'),
        ],
      },
      { label: 'Tag 5', items: [probeAbschlusstest('d5-probe', 'a2.1')] },
      {
        label: 'Tag 6',
        items: [
          speaking('d6-speaking', 'Sprechen Teil 2: Wortkarten beschreiben'),
          // Woche 1's first Schreiben touch — a short re-run of the SMS task
          // already scheduled at full length on Tag 8, so this study week
          // also rehearses Schreiben (all four Prüfungsteile every week).
          schreiben('d6-schreiben', 'sms', 1, 15),
          reading('d6-reading', 'a2.2'),
          xray('d6-xray', 15, 'X-Ray: fünf Sätze zu einer Wortkarte'),
        ],
      },
      {
        label: 'Tag 7',
        items: [srsReview('d7-srs', 'Woche 1'), hubReview('d7-review', 'a2.1', 'Wiederholen: deine A2.1-Grammatik aus Woche 1', 20)],
      },
    ],
  },
  {
    title: 'Woche 2 — Schreiben Teil 1 und Wiederholung',
    intro:
      'Diese Woche übst du die erste Schreibaufgabe und wiederholst wichtige Grammatik. ' +
      'An Tag 12 wiederholst du den Abschlusstest A2.2.',
    days: [
      {
        label: 'Tag 8',
        items: [
          schreiben('d8-schreiben', 'sms', 1, 20, 2),
          gReview('d8-review', 'a2.1', 'modal-verbs-past', 'Schreiben Teil 1 und Sprechen Teil 2', 22),
          reading('d8-reading', 'a2.1'),
        ],
      },
      {
        label: 'Tag 9',
        items: [
          gReview('d9-review', 'a2.2', 'subordinate-word-order', 'Lesen und Schreiben Teil 2', 20),
          reading('d9-reading', 'a2.2'),
          listening('d9-listening', 3),
        ],
      },
      {
        label: 'Tag 10',
        items: [
          speaking('d10-speaking', 'Sprechen Teil 3: einen Vorschlag machen'),
          gReview('d10-review', 'a2.2', 'konjunktiv-ii-polite', 'Sprechen Teil 3', 22),
          xray('d10-xray', 15, 'X-Ray: fünf höfliche Vorschläge mit würde und könnte'),
        ],
      },
      {
        label: 'Tag 11',
        items: [schreiben('d11-schreiben', 'sms', 2, 20), listening('d11-listening', 4), xray('d11-xray', 15, 'X-Ray: fünf Sätze aus deiner zweiten SMS')],
      },
      { label: 'Tag 12', items: [probeAbschlusstest('d12-probe', 'a2.2')] },
      {
        label: 'Tag 13',
        items: [reading('d13-reading', 'a2.1'), listening('d13-listening', 5), xray('d13-xray', 20, 'X-Ray: fünf Sätze aus dem Hörtext')],
      },
      {
        label: 'Tag 14 — Puffertag',
        items: [srsReview('d14-srs', 'Woche 2', 25), hubReview('d14-review', 'a2.2', 'Wiederholen: deine A2.2-Grammatik aus Woche 2', 15)],
      },
    ],
  },
  {
    title: 'Woche 3 — Schreiben Teil 2, Hören und Sprechen',
    intro:
      'Diese Woche übst du die zweite Schreibaufgabe und trainierst dein Hörverstehen. ' +
      'Dazu kommen zwei weitere Sprechübungen.',
    days: [
      {
        label: 'Tag 15',
        items: [orientation('d15-orientation'), schreiben('d15-schreiben', 'email', 1, 25), gReview('d15-review', 'a2.2', 'indirect-questions-intro', 'Schreiben Teil 2 und Sprechen Teil 1', 20)],
      },
      {
        label: 'Tag 16',
        items: [reading('d16-reading', 'a2.1'), listening('d16-listening', 6), xray('d16-xray', 15, 'X-Ray: fünf indirekte Fragen aus deiner E-Mail')],
      },
      {
        label: 'Tag 17',
        items: [
          schreiben('d17-schreiben', 'email', 2, 25),
          gReview('d17-review', 'a2.1', 'adjective-endings-intro', 'Schreiben Teil 2 und Sprechen Teil 2', 25),
          reading('d17-reading', 'a2.2'),
        ],
      },
      {
        label: 'Tag 18',
        items: [
          speaking('d18-speaking', 'Sprechen Teil 1 und Teil 2 zusammen üben'),
          gReview('d18-review', 'a2.2', 'verbs-with-prepositions-intro', 'Sprechen Teil 1 bis 3 und Schreiben Teil 2', 22),
          reading('d18-reading', 'a2.1'),
        ],
      },
      {
        label: 'Tag 19',
        items: [
          gReview('d19-review', 'a2.2', 'infinitive-with-zu-intro', 'Schreiben Teil 1 und Sprechen Teil 2 bis 3', 23),
          reading('d19-reading', 'a2.2'),
          xray('d19-xray', 15, 'X-Ray: fünf Sätze mit einer zu-Gruppe'),
        ],
      },
      {
        label: 'Tag 20',
        items: [
          speaking('d20-speaking', 'Sprechen Teil 3: gemeinsam planen'),
          reading('d20-reading', 'a2.1'),
          xray('d20-xray', 20, 'X-Ray: fünf Sätze zu einem gemeinsamen Plan'),
        ],
      },
      {
        label: 'Tag 21',
        items: [srsReview('d21-srs', 'Woche 3'), hubReview('d21-review', 'a2.2', 'Wiederholen: alle Themen aus Woche 1 bis Woche 3', 20)],
      },
    ],
  },
  {
    title: 'Woche 4 — Übungstest-Woche',
    intro:
      'Diese Woche arbeitest du mit den offiziellen Übungsmaterialien vom Goethe-Institut. ' +
      'An Tag 26 machst du deinen ersten gewerteten Übungstest.',
    days: [
      {
        label: 'Tag 22',
        items: [
          goetheMaterial('d22-material', 1),
          // Second pass (M10): the hardest of the four NEW A2.2 topics gets a
          // spaced repeat inside the final week, on top of its single touch
          // in Woche 2/3.
          gReview('d22-review-2', 'a2.2', 'verbs-with-prepositions-intro', 'Sprechen Teil 1 bis 3 und Schreiben Teil 2', 20, 2),
        ],
      },
      {
        label: 'Tag 23',
        items: [
          goetheMaterial('d23-material', 2),
          gReview('d23-review-2', 'a2.2', 'konjunktiv-ii-polite', 'Sprechen Teil 3', 20, 2),
        ],
      },
      {
        label: 'Tag 24',
        items: [reading('d24-reading', 'a2.1'), readingExamFormat('d24-reading-exam', 9), xray('d24-xray', 15, 'X-Ray: fünf Sätze aus der Informationstafel')],
      },
      {
        label: 'Tag 25',
        items: [
          readingExamFormat('d25-reading-exam', 10),
          listening('d25-listening', 1),
          speaking('d25-speaking', 'Sprechen Teil 2: letzte Wortkarten-Runde'),
        ],
      },
      { label: 'Tag 26', items: [mockExam('d26-mock-1', 1, 60)] },
      {
        label: 'Tag 27',
        items: [
          // Weak spots after the first Übungstest can sit in EITHER level —
          // two hub items, not one A2.2-only review, so an A2.1 gap is not
          // silently skipped.
          hubReview('d27-review-a21', 'a2.1', 'Wiederholen: deine schwächsten Themen aus A2.1', 15),
          hubReview('d27-review-a22', 'a2.2', 'Wiederholen: deine schwächsten Themen aus A2.2', 15),
          // Woche 4's Schreiben touch (B2) — a re-run of the first E-Mail
          // task, which also lifts this day out of the sub-45-minute range.
          schreiben('d27-schreiben', 'email', 1, 20, 2),
        ],
      },
      {
        label: 'Tag 28',
        items: [
          reading('d28-reading', 'a2.2'),
          listening('d28-listening', 6),
          speaking('d28-speaking', 'Sprechen Teil 1 bis 3: letzte volle Runde'),
        ],
      },
    ],
  },
  {
    title: 'Pufferzeit',
    intro:
      'Zwei Tage Reserve für Wiederholung und Pause vor der Prüfung. ' +
      'Am Ende machst du deinen zweiten gewerteten Übungstest.',
    days: [
      { label: 'Tag 29 — Puffertag', items: [srsReview('d29-srs', 'Woche 4', 25), xray('d29-xray', 15, 'X-Ray: letzte Aufwärmübung vor der Prüfung')] },
      { label: 'Tag 30', items: [mockExam('d30-mock-2', 2, 60)] },
    ],
  },
];

// Derived, never retyped: the sum of every item's minutes across all 30 days,
// computed from WEEKS directly so PROGRAM.subtitle quotes the number it
// derives. verify.mjs prints it on every run.
export const PROGRAM_MINUTES = WEEKS.reduce(
  (sum, w) => sum + w.days.reduce((daySum, d) => daySum + d.items.reduce((s, i) => s + i.minutes, 0), 0),
  0
);

// Round to a whole hour — no false precision.
export const PROGRAM_HOURS = Math.round(PROGRAM_MINUTES / 60);

export const PROGRAM = {
  key: PROGRAM_KEY,
  title: PROGRAM_TITLE,
  subtitle:
    `Rund ${PROGRAM_HOURS} Stunden in 30 Tagen bis zur Goethe-Zertifikat-A2-Prüfung. ` +
    'Du hast A2.1 und A2.2 schon beendet. ' +
    'Der Übungstest prüft Lesen, Hören und Schreiben, aber nicht Sprechen. ' +
    'Sprechen übst du im Sprechen-Bereich oder mit einer Partnerin oder einem Partner.',
  weeks: WEEKS,
};

/** Flat list of every item id, for progress accounting. */
export const allItemIds = () => PROGRAM.weeks.flatMap((w) => w.days.flatMap((d) => d.items.map((i) => i.id)));
