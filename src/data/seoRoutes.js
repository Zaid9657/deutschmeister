// One head registry for the prerendered SPA routes.
//
// Before this file, scripts/prerender-spa-routes.mjs and the <SEO> calls in
// src/pages/*.jsx each owned a copy of the same titles and descriptions, with
// nothing comparing them. All six titles had drifted (fixed 2026-08-24), and
// when the guard for titles landed, four descriptions were STILL drifting
// underneath it — the crawler read one description from the prerendered HTML
// and Google's renderer read another from Helmet. A guard can only detect the
// drift; a single source removes it.
//
// Rules of this file (same regime as marketing.js):
//   - Plain ESM, no JSX, no React, no import.meta.env — it is imported by both
//     the Vite app and node scripts (scripts/prerender-spa-routes.mjs), exactly
//     like marketing.js already is.
//   - Counts and prices are DERIVED from marketing.js / pricing.js, never
//     retyped. That is why /podcasts, /listening and /reading interpolate.
//   - Titles are stored BARE (no " | DeutschMeister"). SEO.jsx appends the
//     brand idempotently; the prerender script appends it via fullTitle().
//   - JSON-LD stays with each consumer: the prerendered blocks and the
//     client-side blocks have diverged deliberately (webFeed, offers) and
//     unifying them here would re-couple decisions that were separated on
//     purpose. This registry owns title / description / keywords / locale.
//
// tests/claims.test.mjs asserts both consumers actually read from here.

import {
  PODCAST_EPISODE_COUNT,
  LISTENING_EXERCISE_COUNT,
  LISTENING_DIALOGUE_COUNT,
  READING_LESSON_COUNT,
} from './marketing.js';

export const SITE_TITLE = 'DeutschMeister';

/** "<bare title> | DeutschMeister", idempotent — mirrors SEO.jsx's rule. */
export const fullTitle = (title) =>
  title.trim().endsWith(SITE_TITLE) ? title.trim() : `${title} | ${SITE_TITLE}`;

/**
 * Keyed by the slash-less route; every one of these canonicalises to the
 * trailing-slash form (CLAUDE.md trailing-slash case 2). `url` carries the
 * canonical form so neither consumer retypes the rule.
 */
export const SEO_ROUTES = {
  '/speaking': {
    title: 'German Speaking Practice with AI',
    description:
      'Practice speaking German with an AI conversation partner: guided missions or free conversation, with instant feedback. Levels A1 to B2.',
    keywords:
      'German speaking practice, speak German with AI, German conversation practice, German pronunciation feedback, practice German online',
  },
  '/level-test': {
    title: 'Free German Level Test (A1–B2)',
    description:
      'Free German level test: find your CEFR level in 15 minutes. Reading, listening and speaking, with instant results and a personalised next step.',
    keywords:
      'German level test, CEFR test, German placement test, what level is my German, German proficiency test, free German test',
  },
  '/analyze': {
    title: 'Sentence X-Ray — Analyze German Sentences',
    description:
      'Paste any German sentence and instantly see the grammatical breakdown. Color-coded cases, word roles, and explanations for why each word works the way it does.',
    keywords:
      'German grammar analyzer, German sentence analysis, German cases, nominative accusative dative genitive, learn German grammar',
  },
  '/podcasts': {
    title: 'German Podcasts for Learners A1–B2',
    description: `Free German podcasts for learners: ${PODCAST_EPISODE_COUNT} episodes of native-speaker audio graded A1 to B2. Build listening skills while you commute or relax.`,
    keywords:
      'German podcast for beginners, learn German podcast, German listening practice, German audio lessons, German podcast by CEFR level',
  },
  '/listening': {
    // "48 exercises built from 480 dialogue lines", not "480 dialogues" — the
    // flat form overstated the count by an order of magnitude (lines ≠ dialogues).
    description: `Improve your German listening comprehension with ${LISTENING_EXERCISE_COUNT} exercises built from ${LISTENING_DIALOGUE_COUNT} native-speaker dialogue lines, across all CEFR levels. Questions and instant feedback.`,
    title: 'German Listening Practice A1–B2',
    keywords:
      'German listening practice, German audio exercises, German listening comprehension, learn German listening, German dialogues',
  },
  '/reading': {
    title: 'German Reading Practice A1–B2',
    description: `Improve your German reading comprehension with ${READING_LESSON_COUNT} leveled reading passages. Authentic texts with comprehension questions for all CEFR levels from A1 to B2.`,
    keywords:
      'German reading practice, German reading comprehension, learn German reading, German texts for learners, CEFR reading exercises',
  },
  '/faq': {
    title: 'Häufige Fragen',
    description:
      'Häufige Fragen zu Deutschmeister: Preise, Prüfungsvorbereitung (Goethe, telc, TestDaF, DTZ), KI-Sprechtraining und Sentence X-Ray. Deutsch lernen von A1 bis B2.',
    keywords:
      'Deutschmeister FAQ, Deutsch lernen, Goethe Prüfung, telc Prüfung, TestDaF, DTZ, KI Sprechtraining, Sentence X-Ray, Deutsch Grammatik',
    lang: 'de',
  },
  '/ueber-uns': {
    title: 'Über uns',
    description:
      'Gegründet von Zaid, Arzt mit Blue Card in Deutschland, entwickelt von Ärzten: KI-Sprechtraining, Sentence X-Ray und Prüfungsvorbereitung von A1 bis B2.',
    keywords:
      'Deutschmeister, Über uns, Deutsch lernen, Ärzte, Blue Card, KI Sprechtraining, Goethe Prüfung, telc, TestDaF',
    lang: 'de',
  },
};

/**
 * Props for a page's <SEO> call: title/description/keywords from the registry,
 * plus the canonical trailing-slash path and (for German pages) lang.
 */
export const seoProps = (route) => {
  const entry = SEO_ROUTES[route];
  return {
    title: entry.title,
    description: entry.description,
    ...(entry.keywords ? { keywords: entry.keywords } : {}),
    ...(entry.lang ? { lang: entry.lang } : {}),
    path: `${route}/`,
  };
};
