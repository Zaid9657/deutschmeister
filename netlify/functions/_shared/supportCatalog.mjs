// What DeutschMeister offers — the content library the support agent may
// state, and the only one it checks a customer's request against.
//
// THIS IS A SYNCED COPY, not a second opinion (same doctrine as
// _shared/pricing.mjs and _shared/brand.mjs): the functions bundle cannot
// reliably import src/ or astro-site/, so the identities live here and
// tests/support-agent.test.mjs compares every list below against its registry:
//   EXAM_TRACKS  ⟷ src/data/examTracks.js (key, slug, name, level, flags)
//   MOCK_EXAMS   ⟷ src/data/mockExams/index.js (the keys of MOCK_EXAMS)
//   GUIDES       ⟷ astro-site/src/data/guides/index.js (slug + h1, hub order)
//   PLAN_CLAIMS  ⟷ src/data/marketing.js (each constant by name)
//   FREE_LEVELS  ⟷ src/config/freeTier.js
//   PRACTICE_AREAS ⟷ src/data/seoRoutes.js (route + title; tests/support-areas.test.mjs)
// Grammar topics are NOT copied: the agent reads grammar_topics at run time,
// the same table the Astro build renders /grammar/ from.
//
// Only identity and product claims live here. No exam fees, no pass rates, no
// usage counts — the guides' fact discipline applies to anything the agent says.

import { BILLING_PORTAL_URL } from './dunningLink.mjs';

export const SITE = 'https://deutsch-meister.de';

export const FREE_LEVELS = Object.freeze(['a1.1']);

export const EXAM_TRACKS = Object.freeze([
  { key: 'goethe_a1', slug: 'start-deutsch-1', nameDe: 'Start Deutsch 1 (Goethe-Zertifikat A1)', level: 'A1', hasMock: true, hasWriting: true },
  { key: 'goethe_a2', slug: 'goethe-a2', nameDe: 'Goethe-Zertifikat A2', level: 'A2', hasMock: true, hasWriting: true },
  { key: 'telc_b1', slug: 'telc-b1', nameDe: 'telc Deutsch B1', level: 'B1', hasMock: true, hasWriting: true },
  { key: 'goethe_b1', slug: 'goethe-b1', nameDe: 'Goethe-Zertifikat B1', level: 'B1', hasMock: true, hasWriting: false },
  { key: 'dtz', slug: 'dtz', nameDe: 'DTZ (Deutsch-Test für Zuwanderer)', level: 'A2–B1', hasMock: true, hasWriting: false },
  { key: 'telc_b2', slug: 'telc-b2', nameDe: 'telc Deutsch B2', level: 'B2', hasMock: true, hasWriting: true },
]);

/** Keys of src/data/mockExams MOCK_EXAMS — one Kurzversion practice set each, at /modelltest. */
export const MOCK_EXAMS = Object.freeze(['telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1', 'goethe_a2']);

/** The Leitfaden registry, in hub order: slug + on-page heading. */
export const GUIDES = Object.freeze([
  { slug: 'telc-b1', title: 'telc Deutsch B1: Der komplette Leitfaden zur Vorbereitung' },
  { slug: 'goethe-b1', title: 'Goethe-Zertifikat B1: Module, Punkte und Vorbereitung' },
  { slug: 'telc-b2', title: 'telc Deutsch B2: Aufbau, Punkte und Vorbereitung' },
  { slug: 'dtz', title: 'Deutsch-Test für Zuwanderer (DTZ): Ablauf und Vorbereitung' },
  { slug: 'start-deutsch-1', title: 'Start Deutsch 1 / Goethe-Zertifikat A1: Ablauf, Punkte und Vorbereitung' },
  { slug: 'goethe-a2', title: 'Goethe-Zertifikat A2: Ablauf, Punkte und Vorbereitung' },
  { slug: 'brief-schreiben-b1', title: 'Brief schreiben auf B1: der Aufbau, der in jeder Prüfung funktioniert' },
  { slug: 'modelltest-deutsch-b1', title: 'Modelltest Deutsch B1: Wo du ihn findest — und wie du ihn richtig nutzt' },
]);

/**
 * The practice areas a learner can open, by their src/data/seoRoutes.js key and
 * page title. Without them the agent told a customer on 2026-10-04 that
 * DeutschMeister has no podcasts. Identity only: no episode or lesson counts,
 * and nothing about what is inside an area or who may open it.
 * `words` are the names a reply may use for the area (English, and the German
 * names the app itself uses); validateReply reads them, the model never sees them.
 */
export const PRACTICE_AREAS = Object.freeze([
  { route: '/speaking', title: 'German Speaking Practice with AI', words: ['speaking', 'KI-Sprechtraining', 'Sprechtraining'] },
  { route: '/level-test', title: 'Free German Level Test (A1–B2)', words: ['level test', 'level-test', 'Einstufungstest'] },
  { route: '/analyze', title: 'Sentence X-Ray — Analyze German Sentences', words: ['X-Ray', 'Satz-Röntgen'] },
  { route: '/podcasts', title: 'German Podcasts for Learners A1–B2', words: ['podcast'] },
  { route: '/listening', title: 'German Listening Practice A1–B2', words: ['listening', 'Hörverstehen', 'Hörtraining'] },
  { route: '/reading', title: 'German Reading Practice A1–B2', words: ['reading', 'Leseverstehen', 'Lesetraining'] },
]);

/** Product claims, by their marketing.js names. */
export const PLAN_CLAIMS = Object.freeze({
  TRIAL_DAYS: 7,
  LEVEL_COUNT: 8,
  GRAMMAR_TOPIC_COUNT: 84,
  PRO_SPEAKING_SESSIONS_PER_MONTH: 30,
  TRIAL_SPEAKING_SESSIONS: 2,
  PRO_WRITING_EVALUATIONS_PER_MONTH: 20,
  TRIAL_WRITING_EVALUATIONS: 2,
  PRO_DAILY_LIMIT: 50,
  TRIAL_DAILY_LIMIT: 10,
  FREE_DAILY_LIMIT: 1,
});

/**
 * Pages the agent may point to. Trailing slashes follow CLAUDE.md's three
 * cases: Astro pages and prerendered routes end in '/', plain SPA routes do not.
 */
export const SITE_LINKS = Object.freeze({
  pricing: `${SITE}/pricing/`,
  courses: `${SITE}/courses/`,
  grammar: `${SITE}/grammar/`,
  guides: `${SITE}/leitfaden/`,
  exams: `${SITE}/pruefung/`,
  levelTest: `${SITE}/level-test/`,
  faq: `${SITE}/faq/`,
  about: `${SITE}/ueber-uns/`,
  mockExams: `${SITE}/modelltest`,
  dashboard: `${SITE}/dashboard`,
  profile: `${SITE}/profile`,
  subscription: `${SITE}/subscription`,
  support: `${SITE}/support`,
  billingPortal: BILLING_PORTAL_URL,
});

export const grammarTopicUrl = (level, slug) => `${SITE}/grammar/${String(level).toLowerCase()}/${slug}/`;
/** Astro course pages use a hyphen for the dot: /courses/a1-2/ (courseContents.js levelToSlug). */
export const courseUrl = (level) => `${SITE}/courses/${String(level).toLowerCase().replace('.', '-')}/`;
export const guideUrl = (slug) => `${SITE}/leitfaden/${slug}/`;
export const examHubUrl = (slug) => `${SITE}/pruefung/${slug}/`;
/** Prerendered SPA routes canonicalise to the trailing-slash form (CLAUDE.md case 2). */
export const areaUrl = (route) => `${SITE}${route}/`;
