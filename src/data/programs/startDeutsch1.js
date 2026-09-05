// "Start Deutsch 1: die 30-Tage-Prüfungsphase" — a dated, backward-planned Prüfungsfahrplan over
// EXISTING A1 content (16 grammar topics, 12 listening exercises, 16 reading
// lessons, 16 speaking missions) plus the writing strand and A1 mock exam that
// ship in the same wave. Mirrors the shape and derive-never-retype discipline
// of telcB1Komplett.js exactly — see that file's header comment for the
// rationale; not repeated here.
//
// Item `type` values drive the icon/label on the course page (TelcB1KursPage's
// TYPE_ICON map — the only types the runner styles):
//   lesson | listening | reading | speaking | xray | exam | review
// There is no dedicated "writing" type; writing-task and mock-exam items both
// use 'exam' (the closest styled type, per TYPE_ICON), distinguished by title.

import { getTopicsForLevel } from '../grammarTopics.js';

export const PROGRAM_KEY = 'sd1_30_tage';

// Grammar lessons are served by the Astro build (trailing-slash class) — see
// the three-place route rule and CLAUDE.md's trailing-slash case 1. `external`
// makes the course page render a full-load <a>, since the SPA carries no
// lesson route of its own.
//
// titleDe (not titleEn) is used here, not in telcB1Komplett.js: this program's
// copy is German end to end per its brief, and grammarTopics.js already carries
// a titleDe field per topic — still derived, never retyped.
const lesson = (level, topic) => ({
  id: `${level}-${topic.slug}`,
  type: 'lesson',
  title: topic.titleDe,
  minutes: topic.estimatedTime || 20,
  href: `/grammar/${level}/${topic.slug}/`,
  external: true,
});

const a11 = getTopicsForLevel('a1.1');
const a12 = getTopicsForLevel('a1.2');

// Listening exercises are numbered 1–6 per sub-level (docs/research/audit-a1-content-2026-09-03.md
// §3: "12 listening exercises A1.1 #1-6 + A1.2 #1-6") and deep-link via the
// real SPA route /listening/:level/:exerciseNumber (src/hooks/useListening.js
// reads exercise_number as an integer) — no trailing slash, case 3 of the
// trailing-slash rule (a dynamic route with params).
const listening = (level, n, minutes = 15) => ({
  id: `listening-${level}-${n}`,
  type: 'listening',
  title: `Hören: ${level.toUpperCase()}-Dialoge, Übung ${n}`,
  minutes,
  href: `/listening/${level}/${n}`,
});

// Reading lessons are addressed by a DB-issued lessonId (ReadingLessonPage.jsx
// fetches it from Supabase) that cannot be verified offline, so — exactly like
// telcB1Komplett.js — this links the level hub (/reading/:level, no trailing
// slash) rather than a fabricated per-lesson id. The hub lists all 8 lessons
// per sub-level; reusing the same hub href across several days is the
// established pattern (telcB1Komplett.js does the same for /listening/b1.1).
const reading = (id, level, minutes = 15) => ({
  id,
  type: 'reading',
  title: `Lesen: ein Text auf ${level.toUpperCase()}-Niveau`,
  minutes,
  href: `/reading/${level}`,
});

// Speaking missions have no per-mission SPA route (App.jsx: a single
// "/speaking" route with no :level or :missionId param) — same generic hub
// href telcB1Komplett.js uses ("/speaking/", trailing slash: case 2 of the
// trailing-slash rule, a prerendered hub).
const speaking = (id, title, minutes = 15) => ({ id, type: 'speaking', title, minutes, href: '/speaking/' });

const xray = (id, minutes = 10) => ({
  id,
  type: 'xray',
  title: 'X-Ray: fünf Sätze aus dieser Woche analysieren',
  minutes,
  href: '/analyze/',
});

// The A1 writing strand (Formular ausfüllen / kurze Mitteilung) ships in the
// same wave under the exam key that src/data/writingTasks.js will register
// for the new EXAM_TRACKS entry — see the accompanying notes.md for the exact
// dependency. Route is the existing generic /schreiben/:examSlug (netlify.toml
// already wildcards "/schreiben/*"; no new redirect needed), so no trailing
// slash (case 3). Typed 'exam' — no dedicated 'writing' type exists.
const schreiben = (id, title, minutes = 25) => ({
  id,
  type: 'exam',
  title,
  minutes,
  href: '/schreiben/start-deutsch-1',
});

// The graded in-app mock exam, same dependency as `schreiben` above (a new
// EXAM_TRACKS entry with slug 'start-deutsch-1' + a mockExams module
// registered in src/data/mockExams/index.js). Route is the existing generic
// /modelltest/:examSlug (netlify.toml already wildcards "/modelltest/*").
const modelltest = (id, title, minutes) => ({
  id,
  type: 'exam',
  title,
  minutes,
  href: '/modelltest/start-deutsch-1',
});

// Three genuinely distinct, live Goethe-Institut PDFs — external:true.
// Verified 2026-09-05 via curl -sI (unrestricted egress, not the sandbox's
// default blocked path): all three return HTTP 200, content-type
// application/pdf, under the SAME single-/prf/ directory (no duplicated
// segment). See notes.md for the exact verification transcript.
const GOETHE_A1_MATERIALS = [
  { title: 'Offizieller Modellsatz (Goethe-Institut, Start Deutsch 1)', url: 'https://www.goethe.de/pro/relaunch/prf/materialien/A1_sd1/sd_1_modellsatz.pdf' },
  { title: 'Offizieller Übungssatz 1 (Goethe-Institut, Start Deutsch 1)', url: 'https://www.goethe.de/pro/relaunch/prf/materialien/A1_sd1/sd_1_uebungssatz01.pdf' },
  { title: 'Offizieller Übungssatz 2 (Goethe-Institut, Start Deutsch 1)', url: 'https://www.goethe.de/pro/relaunch/prf/materialien/A1_sd1/sd_1_uebungssatz02.pdf' },
];
const goetheModellsatz = (id, n, minutes = 50) => ({
  id,
  type: 'exam',
  title: GOETHE_A1_MATERIALS[n - 1].title,
  minutes,
  href: GOETHE_A1_MATERIALS[n - 1].url,
  external: true,
});

const review = (id, title, href, minutes = 30) => ({ id, type: 'review', title, minutes, href });

// Exam-format orientation — the static Leitfaden that ships in this same wave
// at slug 'start-deutsch-1' (astro-site/src/data/guides — confirmed by the
// sibling scratchpad deliverable start-deutsch-1-guide.js already present in
// this session's scratchpad; see notes.md). Same pattern as
// telcB1Komplett.js's own w4-modelltest orientation item: static Astro page,
// external:true, type 'exam' (no dedicated 'guide' type).
const orientation = (id, minutes = 20) => ({
  id,
  type: 'exam',
  title: 'Prüfungsüberblick: Ablauf und Punkteregel von Start Deutsch 1',
  minutes,
  href: '/leitfaden/start-deutsch-1/',
  external: true,
});

// 4 weeks + 2 buffer days = 30 days. Weeks 1–2 work through all 16 A1 grammar
// topics (a1.1 then a1.2, in the sequence grammarTopics.js already carries)
// interleaved with listening, reading and the first speaking missions. Week 3
// shifts to exam TASK formats: the two writing tasks, more speaking under
// time pressure, and the last of the 12 listening exercises. Week 4 is the
// Modelltest phase: self-study on the three real Goethe practice sets, a
// review day, and the first graded attempt at the in-app mock. The two
// buffer days hold the final polish and the SECOND graded mock attempt, so
// "your last two Modelltests" (the readiness bar every week's intro repeats)
// always means two comparable, graded /modelltest/start-deutsch-1 attempts —
// never the ungraded external PDFs.
export const PROGRAM = {
  key: PROGRAM_KEY,
  title: 'Start Deutsch 1: die 30-Tage-Prüfungsphase',
  subtitle:
    'Ca. 25–30 Stunden in 30 Tagen — die letzte Phase auf dem Weg zu Start Deutsch 1. Vorausgesetzt: A1.1+A1.2-Grundwissen. ' +
    'Startest du bei null, liegen davor realistisch noch ca. 60–80 Stunden Fundamentarbeit.',
  weeks: [
    {
      title: 'Woche 1 — Fundament',
      intro:
        'Die ersten acht A1.1-Grammatikthemen, dazu deine ersten Hör- und Leseübungen. Du bist bereit für Woche 2, ' +
        'wenn dir alle acht Themen vertraut vorkommen — nicht perfekt, nur vertraut.',
      days: [
        { label: 'Tag 1', items: [lesson('a1.1', a11[0]), listening('a1.1', 1), reading('d1-reading', 'a1.1')] },
        { label: 'Tag 2', items: [lesson('a1.1', a11[1]), listening('a1.1', 2), xray('d2-xray')] },
        { label: 'Tag 3', items: [lesson('a1.1', a11[2]), listening('a1.1', 3), reading('d3-reading', 'a1.1')] },
        { label: 'Tag 4', items: [lesson('a1.1', a11[3]), reading('d4-reading', 'a1.1', 25)] },
        { label: 'Tag 5', items: [lesson('a1.1', a11[4]), listening('a1.1', 4), speaking('d5-speaking', 'Sprechen: erste Mission auf A1.1-Niveau', 20)] },
        { label: 'Tag 6', items: [lesson('a1.1', a11[5]), reading('d6-reading', 'a1.1', 20), xray('d6-xray')] },
        { label: 'Tag 7', items: [lesson('a1.1', a11[6]), lesson('a1.1', a11[7]), listening('a1.1', 5)] },
      ],
    },
    {
      title: 'Woche 2 — Struktur und Wortschatz',
      intro:
        'Die acht A1.2-Themen — Satzbau, Akkusativ, Verneinung, Modalverben. Du bist bereit für Woche 3, ' +
        'wenn du alle 16 A1-Themen einmal durchgearbeitet hast.',
      days: [
        { label: 'Tag 8', items: [lesson('a1.2', a12[0]), listening('a1.1', 6), reading('d8-reading', 'a1.2')] },
        { label: 'Tag 9', items: [lesson('a1.2', a12[1]), listening('a1.2', 1), xray('d9-xray', 15)] },
        { label: 'Tag 10', items: [lesson('a1.2', a12[2]), reading('d10-reading', 'a1.2', 25)] },
        { label: 'Tag 11', items: [lesson('a1.2', a12[3]), listening('a1.2', 2), speaking('d11-speaking', 'Sprechen: zweite Mission auf A1.1-Niveau', 15)] },
        { label: 'Tag 12', items: [lesson('a1.2', a12[4]), reading('d12-reading', 'a1.2', 20), listening('a1.2', 3)] },
        { label: 'Tag 13', items: [lesson('a1.2', a12[5]), listening('a1.2', 4), speaking('d13-speaking', 'Sprechen: dritte Mission auf A1.2-Niveau', 15)] },
        { label: 'Tag 14', items: [lesson('a1.2', a12[6]), lesson('a1.2', a12[7]), xray('d14-xray')] },
      ],
    },
    {
      title: 'Woche 3 — Prüfungsformate',
      intro:
        'Die Formate, die Start Deutsch 1 tatsächlich verlangt: Formular ausfüllen, kurze Mitteilung schreiben, ' +
        'Sprechen ohne Vorbereitungszeit. Du bist bereit für Woche 4, wenn beide Schreibaufgaben fertig sind.',
      days: [
        { label: 'Tag 15', items: [schreiben('d15-schreiben', 'Schreiben: Formular ausfüllen (Teil 1)'), listening('a1.2', 5), orientation('d15-orientation')] },
        { label: 'Tag 16', items: [speaking('d16-speaking', 'Sprechen: Mission 9 — Sich komplett vorstellen (Teil 1)', 20), reading('d16-reading', 'a1.1', 20), xray('d16-xray')] },
        { label: 'Tag 17', items: [listening('a1.2', 6), reading('d17-reading', 'a1.2', 20), xray('d17-xray', 15)] },
        { label: 'Tag 18', items: [schreiben('d18-schreiben', 'Schreiben: kurze Mitteilung mit Leitpunkten (Teil 2)'), reading('d18-reading', 'a1.1', 25)] },
        { label: 'Tag 19', items: [speaking('d19-speaking', 'Sprechen: Mission 10 — Wortkarten Essen & Trinken (Teil 2)', 20), reading('d19-reading', 'a1.2', 20), xray('d19-xray')] },
        { label: 'Tag 20', items: [reading('d20-reading-1', 'a1.1', 20), reading('d20-reading-2', 'a1.2', 20), xray('d20-xray')] },
        { label: 'Tag 21', items: [speaking('d21-speaking', 'Sprechen: Mission 11 — Wortkarten Wohnen & Alltag (Teil 2)', 20), reading('d21-reading', 'a1.1', 20), xray('d21-xray')] },
      ],
    },
    {
      title: 'Woche 4 — Modelltest-Woche',
      intro:
        'Die drei offiziellen Übungsmaterialien des Goethe-Instituts im Selbststudium, dann dein erster gewerteter ' +
        'Modelltest-Versuch in der App. Du bist bereit für die Pufferzeit, wenn dieser erste Versuch ' +
        'mindestens in der Nähe von 70 % liegt.',
      days: [
        { label: 'Tag 22', items: [goetheModellsatz('d22-modellsatz', 1)] },
        { label: 'Tag 23', items: [goetheModellsatz('d23-modellsatz', 2)] },
        { label: 'Tag 24', items: [goetheModellsatz('d24-modellsatz', 3)] },
        { label: 'Tag 25', items: [review('d25-review', 'Wiederhole deine zwei schwächsten Grammatikthemen', '/grammar/a1.2/'), reading('d25-reading', 'a1.2', 20)] },
        { label: 'Tag 26', items: [modelltest('d26-modelltest-1', 'Modelltest Start Deutsch 1 — Versuch 1 (gewertet)', 55)] },
        { label: 'Tag 27', items: [speaking('d27-speaking', 'Sprechen: Mission 12 — Bitten formulieren (Teil 3)', 20), reading('d27-reading', 'a1.1'), xray('d27-xray')] },
        { label: 'Tag 28', items: [xray('d28-xray', 15), reading('d28-reading-1', 'a1.1'), reading('d28-reading-2', 'a1.2')] },
      ],
    },
    {
      title: 'Pufferzeit',
      intro:
        'Zwei Tage Reserve — falls ein Tag ausgefallen ist, du krank warst oder einfach mehr Übung brauchst. ' +
        'Du bist bereit, wenn deine letzten zwei Modelltests ≥ 70 % sind.',
      days: [
        { label: 'Tag 29', items: [speaking('d29-speaking', 'Sprechen: letzte volle Mission vor der Prüfung', 20), xray('d29-xray', 15), reading('d29-reading', 'a1.2')] },
        { label: 'Tag 30', items: [modelltest('d30-modelltest-2', 'Modelltest Start Deutsch 1 — Versuch 2 (gewertet, finaler Check)', 60)] },
      ],
    },
  ],
};

/** Flat list of every item id, for progress accounting. */
export const allItemIds = () =>
  PROGRAM.weeks.flatMap((w) => w.days.flatMap((d) => d.items.map((i) => i.id)));
