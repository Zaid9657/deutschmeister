// What the copy CLAIMS — every user-facing number and limit statement.
//
// DUPLICATED between the SPA and the Astro site (byte-identical, enforced by
// scripts/check-duplicates.mjs). Companion: ./pricing.js — what the checkout
// charges. Never state a claim from memory; import it from here.
//
// EVERY VALUE CARRIES ITS PROVENANCE INLINE — the file it was verified against
// and when. A claim that disagrees with the server that enforces it is
// irreführende Werbung under UWG §5, not a typo, so "where did this number come
// from" has to be answerable without archaeology. When you change one, re-verify
// it against the named source and update the date.
//
// Two rules learned the hard way here:
//
//   1. NEVER STATE A PRICE WITH A BLANKET "UNLIMITED" BESIDE IT. Pro is
//      unlimited in *content* (all 8 levels, every lesson) and metered in *AI*
//      (X-Ray 50/day, speaking 30/month). "9,99 €/Monat (Pro) — unbegrenzt"
//      shipped on the Lingoda comparison and was false about the AI features
//      the page was selling. Use UNLIMITED_CONTENT_LINE, which says what is
//      actually unlimited, or name the metered figure.
//
//   2. A COUNT THAT READS PLAUSIBLE IS THE ONE THAT ROTS. Only counts verified
//      against a live table appear below. Reading-lesson totals used to be
//      deliberately ABSENT here because the three audit documents disagreed
//      (52 / 66 / 74) while the per-level figures hardcoded in
//      scripts/prerender-spa-routes.mjs and src/pages/ReadingSectionPage.jsx were
//      a smooth 3,4,5,6,7,8,9,10 ramp matching no measurement. That re-count has
//      now been done (2026-08-24, see READING_LESSON_COUNT): the true total is 66
//      and the true shape is flat — 8 per level, 10 at B2.2. Every one of the
//      three audited totals was wrong, and so was the ramp; /reading/ had been
//      publishing "52 Total Lessons" and "3 reading lessons" for A1.1, which
//      actually holds 8.

import { MONTHLY_PRICE_EUR, YEARLY_PRICE_EUR, deEur, eur } from './pricing.js';

// ---------------------------------------------------------------------------
// Limits — these MUST match the server-side gates, which are the real
// enforcement. The client cannot grant what the server refuses.
// ---------------------------------------------------------------------------

/** Anonymous visitor, per UTC day. Source: DAILY_LIMITS.anonymous, netlify/functions/analyze-sentence.mjs (2026-08-22). */
export const ANON_DAILY_LIMIT = 1;

/** Signed-up account during the trial, per UTC day. Source: DAILY_LIMITS.free_trial (2026-08-22). */
export const TRIAL_DAILY_LIMIT = 10;

/** Signed-up account after the trial ends, per UTC day. Source: DAILY_LIMITS.free_expired (2026-08-22). */
export const FREE_DAILY_LIMIT = 1;

/** Pro subscriber, per UTC day. Source: DAILY_LIMITS.pro (2026-08-22). */
export const PRO_DAILY_LIMIT = 50;

/** Speaking sessions included with Pro, per month. Source: PRO_MONTHLY_LIMIT, netlify/functions/_shared/speakingUsage.mjs:8 (2026-08-22). */
export const PRO_SPEAKING_SESSIONS_PER_MONTH = 30;

/** Free speaking sessions during the trial, in TOTAL (not per month). Source: TRIAL_TOTAL_LIMIT, speakingUsage.mjs:9 (2026-08-22). */
export const TRIAL_SPEAKING_SESSIONS = 2;

/** AI writing evaluations included with Pro, per month. Source: WRITING_LIMITS.pro, netlify/functions/evaluate-writing.mjs (2026-08-31). */
export const PRO_WRITING_EVALUATIONS_PER_MONTH = 20;

/** Free writing evaluations during the trial, in TOTAL (not per month). Source: WRITING_LIMITS.free_trial, evaluate-writing.mjs (2026-08-31). */
export const TRIAL_WRITING_EVALUATIONS = 2;

/** Length of the free trial. Source: src/config/limits.js, unchanged since launch. */
export const TRIAL_DAYS = 7;

// ---------------------------------------------------------------------------
// Content — counted against live tables. See rule 2 above before adding.
// ---------------------------------------------------------------------------

/** CEFR sub-levels shipped, a1.1 through b2.2. Source: grammar_topics distinct level (2026-08-16 audit). */
export const LEVEL_COUNT = 8;

/** Grammar topics (A1.1 and A1.2 have 12; every other level has 8). Source: counted against grammar-content-cache.json on 2026-09-05. */
export const GRAMMAR_TOPIC_COUNT = 72;

/** Native-speaker listening dialogue lines, audio confirmed in Storage. Source: EVALUATION.md content audit (2026-08-16). */
export const LISTENING_DIALOGUE_COUNT = 480;

/** Podcast episodes, all with audio. Source: EVALUATION.md content audit (2026-08-16). NOTE: transcripts are empty — never claim transcripts. */
export const PODCAST_EPISODE_COUNT = 24;

/** Grammar rule explanations across all 72 topics. Source: counted against grammar-content-cache.json on 2026-09-05. */
export const GRAMMAR_RULE_COUNT = 522;

/** Worked examples across all 72 topics. Source: counted against grammar-content-cache.json on 2026-09-05. */
export const GRAMMAR_EXAMPLE_COUNT = 757;

/** Interactive exercises across all 72 topics. Source: counted against grammar-content-cache.json on 2026-09-05. */
export const GRAMMAR_EXERCISE_COUNT = 1045;

/** Listening exercises, 6 per CEFR level. Source: listening_exercises count via Supabase (2026-08-24). */
export const LISTENING_EXERCISE_COUNT = 48;

/** Vocabulary words, every one carrying a level. Source: the live per-level counts checked
 *  on 2026-09-05 (225+247+248+247+234+250+238+246 = 1935) matched the standing constant
 *  exactly, so that value plus the 114 rows of migrations/2026-09-05-a1-1-wortliste.sql
 *  (A1.1 Wortliste, Course Factory Wave 2 PR B) gave 2049. Counted: live 2049 + 166 A1.2
 *  additions in migrations/2026-09-05-a1-2-wortliste.sql (A1.2 Wortliste, Course Factory
 *  Wave 3 PR B) = 2215 (2026-09-05).
 *  NOTE: llms.txt and llms-full.txt claimed 1,982 until 2026-08-24 — overstated by 47. */
export const VOCAB_WORD_COUNT = 2215;

/** Vocabulary example sentences. Source: sentences count via Supabase (2026-08-24). */
export const VOCAB_SENTENCE_COUNT = 945;

/**
 * Reading lessons per level, and the total. Source: reading_lessons count via
 * Supabase (2026-08-24) — `select level, count(*) group by level`.
 *
 * This replaces the 3,4,5,6,7,8,9,10 ramp that rule 2 above disowned. The real
 * distribution is flat, so a rising ramp was never a rounding error — it was
 * invented. Re-measure before changing; do not interpolate.
 */
export const READING_LESSON_COUNTS_BY_LEVEL = {
  'a1.1': 10, 'a1.2': 8, 'a2.1': 8, 'a2.2': 8,
  'b1.1': 8, 'b1.2': 8, 'b2.1': 8, 'b2.2': 10,
};
/** a1.1 went 8 → 10 with the exam-format lessons added 2026-09-05 (Course
 *  Factory Wave 2, PR C: migrations/2026-09-05-a1-1-reading.sql). */
export const READING_LESSON_COUNT = 68;

/** Levels readable without paying, and without an account. Source: FREE_LEVELS, src/config/freeTier.js. */
export const FREE_LEVEL_LABEL = 'A1.1';

/**
 * The CEFR ladder the product is built on, in order. Codes match the DB's
 * uppercase `sub_level` values; URLs use the lowercase form (see CLAUDE.md).
 * Subtitles are the ones already shipped in src/utils/listeningHelpers.js and
 * scripts/prerender-spa-routes.mjs — one wording, three places.
 *
 * Deliberately carries NO exam-requirement or study-duration claims. "B1 is
 * required for X" is a statement about German law, and "≈8 months at 3h/week"
 * is a number the product has never measured. The ladder's job is to show
 * DISTANCE — how much of the product a learner needs — which is true by
 * construction.
 */
export const LEVELS = [
  { code: 'A1.1', band: 'A1', subtitle: 'Beginner I' },
  { code: 'A1.2', band: 'A1', subtitle: 'Beginner II' },
  { code: 'A2.1', band: 'A2', subtitle: 'Elementary I' },
  { code: 'A2.2', band: 'A2', subtitle: 'Elementary II' },
  { code: 'B1.1', band: 'B1', subtitle: 'Intermediate I' },
  { code: 'B1.2', band: 'B1', subtitle: 'Intermediate II' },
  { code: 'B2.1', band: 'B2', subtitle: 'Upper Intermediate I' },
  { code: 'B2.2', band: 'B2', subtitle: 'Upper Intermediate II' },
];

// ---------------------------------------------------------------------------
// Claim lines — the sanctioned phrasings. Rendering these instead of prose is
// what keeps a price change from silently falsifying the copy.
// ---------------------------------------------------------------------------

/** The only sanctioned blanket-access claim. Says what is actually unlimited. */
export const UNLIMITED_CONTENT_LINE = `Unlimited access to all ${LEVEL_COUNT} levels`;

/** German equivalent. Compounds take the singular: "8-Level-Zugang", not "8-Levels". */
export const UNLIMITED_CONTENT_LINE_DE = `Unbegrenzter Zugang zu allen ${LEVEL_COUNT} Leveln`;

/** Pro's AI speaking allowance, stated with its period. Never as "unlimited". */
export const SPEAKING_LINE = `${PRO_SPEAKING_SESSIONS_PER_MONTH} AI speaking sessions per month`;
export const SPEAKING_LINE_DE = `${PRO_SPEAKING_SESSIONS_PER_MONTH} KI-Sprechübungen pro Monat`;

/** Pro's X-Ray allowance, stated with its period. */
export const XRAY_LINE = `${PRO_DAILY_LIMIT} Sentence X-Ray analyses per day`;
export const XRAY_LINE_DE = `${PRO_DAILY_LIMIT} Satz-Röntgen-Analysen pro Tag`;

/** The free offer, stated with what it actually includes. */
export const FREE_OFFER_LINE = `${FREE_LEVEL_LABEL} free, no account needed`;
export const FREE_OFFER_LINE_DE = `${FREE_LEVEL_LABEL} komplett kostenlos, ohne Konto`;

/**
 * The founder-experience line — the site's "Who", told anonymously. It asserts
 * facts about a real person, so ONLY this sanctioned wording may render (the
 * full first-person story lives on /ueber-uns/, which the line should link to).
 * Shipped on /vergleich/babbel/ and /leitfaden/telc-b1/ since launch
 * (drafts/eeat-author-identity.md measured it present on 2 of 92 pages);
 * exported here so every guide, exam hub and comparison renders it identically.
 * Owner decision 2026-09-02: stays anonymous — no name, no Person schema.
 */
export const FOUNDER_LINE_DE =
  'Gegründet von einem Arzt in Deutschland — kennt den Lernweg aus eigener Erfahrung.';

/**
 * Price + what it buys, in one string, so the two can never be separated by a
 * later edit. This is the MedMeister `priceLine()` pattern: quoting the price
 * alone is not something an edit can do by accident.
 */
export const monthlyPriceLine = () => `${eur(MONTHLY_PRICE_EUR)}/month — ${UNLIMITED_CONTENT_LINE}, ${SPEAKING_LINE}`;
export const monthlyPriceLineDe = () =>
  `${deEur(MONTHLY_PRICE_EUR)}/Monat — ${UNLIMITED_CONTENT_LINE_DE}, ${SPEAKING_LINE_DE}`;
export const yearlyPriceLine = () => `${eur(YEARLY_PRICE_EUR)}/year — ${UNLIMITED_CONTENT_LINE}, ${SPEAKING_LINE}`;
