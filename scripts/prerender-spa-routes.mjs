#!/usr/bin/env node
// Prerender the public SPA feature routes as static HTML for crawlers.
//
// /pricing is served statically via a hand-built Astro page copied into
// dist/pricing/. The routes below are the interactive app itself (speaking
// trainer, level test, X-Ray analyzer, hubs), so they can't be replaced by
// pure static pages. Instead this script takes the built SPA shell
// (dist/app.html — it already references the hashed JS/CSS bundles), swaps in
// each route's own <title>, meta description, canonical, OG/Twitter tags and
// JSON-LD (mirrored 1:1 from the <SEO> props in src/pages/*), and injects the
// page's real visible copy into <div id="root">. Netlify serves the file at
// dist/<route>/index.html before the /route → /app.html rewrite (same as
// /pricing), and when the JS bundle loads React mounts into #root and replaces
// the prerendered markup with the live app — user behaviour is unchanged.
//
// All copy below is mirrored verbatim from the React components
// (src/pages/SpeakingPage.jsx, LevelTest.jsx + LevelTestLanding.jsx,
// SentenceXRay.jsx, PodcastsPage.jsx, Listening/ListeningHome.jsx,
// ReadingSectionPage.jsx) with the default English locale — keep them in sync.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
// Counts come from the claims data layer, never retyped here. The ramp that used
// to live in this file was invented — see rule 2 in src/data/marketing.js.
import {
  READING_LESSON_COUNT,
  READING_LESSON_COUNTS_BY_LEVEL,
  LEVEL_COUNT,
  TRIAL_SPEAKING_SESSIONS,
} from '../src/data/marketing.js';
// Head fields come from the one registry both this script and the <SEO> calls
// consume — src/data/seoRoutes.js. The route objects below carry only what is
// genuinely per-surface: the JSON-LD (deliberately diverged from the client
// blocks) and the static #root copy.
import { SEO_ROUTES, fullTitle } from '../src/data/seoRoutes.js';
import { ORG_REF, ORGANIZATION_FULL } from '../src/data/organization.js';
import { FAQ_CATEGORIES, faqPageJsonLd } from '../src/data/faqContent.js';

const head = (route) => {
  const e = SEO_ROUTES[route];
  return {
    title: fullTitle(e.title),
    description: e.description,
    ...(e.keywords ? { keywords: e.keywords } : {}),
    ...(e.lang === 'de' ? { ogLocale: 'de_DE', htmlLang: 'de' } : {}),
  };
};

const DIST = process.argv[2] || 'dist';
const SHELL = join(DIST, 'app.html');
const BASE = 'https://deutsch-meister.de';

if (!existsSync(SHELL)) {
  console.error(`prerender-spa-routes: ${SHELL} not found — run after the SPA shell is moved to app.html`);
  process.exit(1);
}
const shell = readFileSync(SHELL, 'utf8');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ─── the class vocabulary ────────────────────────────────────────────────────
//
// DESIGN TOKENS ONLY (docs/design/playbook.md §1). Every string below is a
// playbook role, not an improvisation, and every class in it must survive the
// built CSS — which it now does because tailwind.config.js scans THIS FILE.
// It did not before, and the markup here styled itself only by accident: each
// class it used happened to be used by some component under src/ too. The
// design sweep moved those components onto tokens, the accidental coupling
// broke, and all eight prerendered pages started serving raw document flow to
// their first paint and to every crawler. Naming the roles here is what keeps
// the next sweep from doing it again: a class that goes out of system in the
// app goes out of system here, visibly, in one place.
//
// No JS runs on this markup — React replaces it on hydrate — so nothing here
// may use `reveal`/`hero-line` (their resting state is hidden until a script
// lifts it) or Atropos scaffolding. Static, styled, immediately visible.
const H_PAGE = 'font-display text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.022em] text-ink sm:text-[3rem]';
const H_HERO = 'font-display text-[2.25rem] font-semibold leading-[1.02] tracking-[-0.025em] text-ink sm:text-[3.5rem]';
const H_SECTION = 'font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink sm:text-[2.125rem]';
// The section role at its mobile step — for sub-sections inside a page.
const H_SUB = 'font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink';
const H_CARD = 'font-display text-[1.0625rem] font-semibold leading-snug tracking-[-0.005em] text-ink sm:text-[1.125rem]';
const EYEBROW = 'font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em]';
const LEAD = 'text-[1.0625rem] leading-relaxed text-graphite sm:text-[1.1875rem]';
const BODY = 'text-[0.9375rem] leading-relaxed text-graphite sm:text-base';
const SMALL = 'text-[0.875rem] leading-relaxed text-graphite';
const DATA_NOTE = 'font-data text-[0.8125rem] text-graphite';

// Cards: pressable things rest raised, reference material stays flat (rule 3).
const CARD_FLAT = 'rounded-clay border border-rule bg-white';
const CARD_SUNK = 'rounded-clay border border-rule bg-paper-sunk';
const CARD_RAISED = 'rounded-clay border border-rule bg-white shadow-raise';

// Buttons: one interactive colour (rule 2). The press/hover halves of the
// playbook string are dropped — this markup is gone the moment React mounts,
// and a hover state on a placeholder is a promise it cannot keep.
const BTN = 'inline-flex items-center justify-center gap-2 rounded-clay px-7 py-3.5 text-base font-bold';
const BTN_PRIMARY = `${BTN} bg-siegel text-white shadow-raise-siegel`;
const BTN_SECONDARY = `${BTN} border border-rule bg-white text-ink shadow-raise`;

const CHIP = `inline-flex items-center rounded-pill px-2.5 py-1 ${EYEBROW} font-bold`;
const CHIP_LABEL = `${CHIP} bg-siegel-wash text-siegel-deep`;
const CHIP_QUIET = `${CHIP} border border-rule bg-white text-graphite`;

// Rule 1: the four case colours may appear ONLY where a case is named. They are
// used once below, on /analyze, where every chip is labelled with its case.
const KASUS_CHIP = {
  nominativ: 'border-kasus-nominativ bg-kasus-nominativ-wash text-kasus-nominativ-ink',
  akkusativ: 'border-kasus-akkusativ bg-kasus-akkusativ-wash text-kasus-akkusativ-ink',
  dativ: 'border-kasus-dativ bg-kasus-dativ-wash text-kasus-dativ-ink',
  genitiv: 'border-kasus-genitiv bg-kasus-genitiv-wash text-kasus-genitiv-ink',
  plain: 'border-rule bg-paper-sunk text-graphite',
};

const LEVELS = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2'];
// src/utils/listeningHelpers.js subtitles (en)
const LEVEL_SUBTITLES = {
  'A1.1': 'Beginner I', 'A1.2': 'Beginner II',
  'A2.1': 'Elementary I', 'A2.2': 'Elementary II',
  'B1.1': 'Intermediate I', 'B1.2': 'Intermediate II',
  'B2.1': 'Upper Intermediate I', 'B2.2': 'Upper Intermediate II',
};
// Both grids are links, so their cards rest raised (rule 3) and their level
// codes take the data face — a level is a figure, not prose.
const listeningCards = LEVELS.map((lvl) => `
      <a href="/listening/${lvl.toLowerCase()}" class="block ${CARD_RAISED} p-5">
        <h3 class="font-data text-[1.25rem] font-bold text-ink">${lvl}</h3>
        <p class="mt-1 ${SMALL}">${LEVEL_SUBTITLES[lvl]}</p>
      </a>`).join('');

const readingCards = Object.entries(READING_LESSON_COUNTS_BY_LEVEL).map(([lvl, count]) => `
      <a href="/reading/${lvl}" class="block ${CARD_RAISED} p-4">
        <h3 class="font-data text-[1.0625rem] font-bold text-ink">${lvl.toUpperCase()}</h3>
        <p class="mt-1 font-data text-[0.75rem] text-graphite">${count} reading lessons</p>
      </a>`).join('');

// FAQ content is defined once and used for BOTH the FAQPage JSON-LD and the
// visible <section> injected into #root — Google requires that structured-data
// questions/answers are visible on the page, so the two must never diverge.
const LEVEL_TEST_FAQS = [
  { q: 'How long does the German level test take?', a: 'The complete test takes approximately 15-20 minutes, including written, listening, and speaking sections.' },
  { q: 'Is the German level test free?', a: "Yes, the German level test is completely free. You'll receive instant results showing your CEFR level from A1 to B2." },
  { q: 'What does the German level test include?', a: 'The test includes three sections: written comprehension (grammar and vocabulary), listening comprehension with native speaker audio, and speaking assessment with AI feedback.' },
  { q: 'What CEFR levels does the test cover?', a: 'The test assesses levels from complete beginner (A1) to upper intermediate (B2), following the Common European Framework of Reference for Languages.' },
];

const PODCAST_FAQS = [
  { q: 'What level are the German podcasts?', a: 'We have 24 podcast episodes covering all levels from A1 (complete beginner) to B2 (upper intermediate). Each episode is labeled with its CEFR level so you can find content that matches your skills.' },
  { q: 'Are the German podcasts free?', a: 'Yes, all podcasts are free to listen to. A1.1 content is available without signup, while other levels require a free account.' },
  // NOTE: do not reinstate a transcript claim here. All 24 episodes in the
  // database have empty transcripts. The 2026-08-16 audit (B-04) removed this
  // claim from src/pages/PodcastsPage.jsx but missed this second, hardcoded
  // copy, so the indexed FAQPage rich result kept promising transcripts.
  { q: 'How many podcast episodes are there?', a: 'We have 24 episodes total — 3 episodes for each of the 8 CEFR levels (A1.1, A1.2, A2.1, A2.2, B1.1, B1.2, B2.1, B2.2). New episodes are added regularly.' },
];

const faqPageSchema = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
});

/**
 * Visible FAQ markup.
 *
 * There used to be two of these — `faqSectionTailwind` for /podcasts/ and
 * `faqSectionPlain` for /level-test/, the latter borrowing the level-test
 * page's own hand-written `.test-structure`/`.structure-step` rules so it
 * matched the sections around it. That stylesheet is gone and both pages now
 * speak the same token vocabulary, so the two helpers converted to identical
 * markup and are one helper again.
 *
 * An FAQ is reference material, so the card is FLAT (rule 3) — no shadow.
 */
const faqSection = (faqs) => `
  <section class="mt-12 ${CARD_FLAT} p-6 sm:p-8">
    <h2 class="${H_SUB}">Frequently Asked Questions</h2>
    <div class="mt-6 flex flex-col gap-5">${faqs.map(({ q, a }) => `
      <div class="border-t border-rule pt-5 first:border-t-0 first:pt-0">
        <h3 class="${H_CARD}">${q}</h3>
        <p class="mt-2 ${BODY}">${a}</p>
      </div>`).join('')}
    </div>
  </section>`;

const xrayExamples = [
  'Die Mutter gibt dem Kind einen Apfel.',
  'Wegen des Wetters bleiben wir heute zu Hause.',
  'Er hat das Buch seinem Freund gegeben.',
  'Trotz des Regens ging sie spazieren.',
  'Ich kaufe meiner Schwester ein Geschenk.',
].map((ex) => `<span class="inline-flex items-center rounded-md border border-rule bg-white px-3 py-1.5 text-[0.875rem] text-graphite">${ex}</span>`).join('\n          ');

const ROUTES = [
  {
    path: '/speaking',
    dir: 'speaking',
    ...head('/speaking'),
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deutsch-meister.de/' },
          { '@type': 'ListItem', position: 2, name: 'Speaking Practice', item: 'https://deutsch-meister.de/speaking/' },
        ],
      },
    ],
    // Mirrors the guest branch of src/pages/SpeakingPage.jsx — the page an
    // anonymous visitor actually gets. The old mirror showed the logged-in
    // setup screen, which no anonymous user could ever reach.
    content: `
<div class="min-h-screen bg-paper px-4 pt-24 pb-16"><div class="mx-auto max-w-2xl text-center">
  <h1 class="${H_PAGE}">German Speaking Practice</h1>
  <p class="mx-auto mt-4 max-w-xl ${LEAD}">Speak German out loud with an AI conversation partner that listens, answers at your level, and tells you afterwards what was right, what to fix, and what a native speaker would have said instead.</p>
  <div class="mt-10 grid gap-4 text-left sm:grid-cols-3">
    <div class="${CARD_FLAT} p-5">
      <h2 class="${H_CARD}">Every level, A1 to B2</h2>
      <p class="mt-2 ${SMALL}">The partner adapts its vocabulary and pace to your CEFR level — from first sentences at A1.1 to open discussion at B2.2.</p>
    </div>
    <div class="${CARD_FLAT} p-5">
      <h2 class="${H_CARD}">Missions or free talk</h2>
      <p class="mt-2 ${SMALL}">Guided scenarios — ordering, appointments, small talk — or open conversation. Sessions run 5, 10 or 15 minutes.</p>
    </div>
    <div class="${CARD_FLAT} p-5">
      <h2 class="${H_CARD}">Feedback you can use</h2>
      <p class="mt-2 ${SMALL}">After each session: grammar, vocabulary and pronunciation, with concrete corrections — like a patient tutor with unlimited time.</p>
    </div>
  </div>
  <p class="mt-10"><a href="/signup" class="${BTN_PRIMARY}">Sign up free</a></p>
  <p class="mt-4 ${DATA_NOTE}">A free account includes ${TRIAL_SPEAKING_SESSIONS} AI speaking sessions — no card needed. Levels: ${LEVELS.join(', ')}.</p>
</div></div>`,
  },
  {
    path: '/level-test',
    dir: 'level-test',
    ...head('/level-test'),
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Quiz',
        name: 'German CEFR Level Test',
        description: 'Free online German proficiency test covering reading, listening, and speaking. Discover your level from A1 to B2.',
        educationalLevel: ['A1', 'A2', 'B1', 'B2'],
        learningResourceType: 'Assessment',
        inLanguage: ['en', 'de'],
        isAccessibleForFree: true,
        provider: ORG_REF,
      },
      faqPageSchema(LEVEL_TEST_FAQS),
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deutsch-meister.de/' },
          { '@type': 'ListItem', position: 2, name: 'Level Test', item: 'https://deutsch-meister.de/level-test/' },
        ],
      },
    ],
    // The static twin of src/components/LevelTest/LevelTestLanding.jsx — same
    // rhythm and the same depth reading (the three steps are what you are about
    // to DO, so they rest on accent edges; "what you'll receive" is reference
    // material and stays flat; the pro tip is a caution and says so in words as
    // well as colour), minus everything that needs JS to become visible.
    content: `
<div class="min-h-screen bg-paper"><div class="mx-auto max-w-2xl px-4 pt-24 pb-16">
  <div class="text-center">
    <div class="${CHIP_LABEL}">Free Assessment</div>
    <h1 class="mt-3 ${H_PAGE}">Discover Your German Level</h1>
    <p class="mx-auto mt-4 max-w-prose ${LEAD}">Take our comprehensive placement test and get personalized recommendations for your learning journey</p>
  </div>
  <div class="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
    <div class="${CARD_SUNK} px-4 py-3 text-center"><div><span class="block font-display text-[1.125rem] font-semibold leading-tight text-ink">15-20</span> <span class="block ${EYEBROW} text-graphite">Minutes</span></div></div>
    <div class="${CARD_SUNK} px-4 py-3 text-center"><div><span class="block font-display text-[1.125rem] font-semibold leading-tight text-ink">3</span> <span class="block ${EYEBROW} text-graphite">Sections</span></div></div>
    <div class="${CARD_SUNK} px-4 py-3 text-center"><div><span class="block font-display text-[1.125rem] font-semibold leading-tight text-ink">A1-B2</span> <span class="block ${EYEBROW} text-graphite">Levels</span></div></div>
  </div>
  <div class="mt-12">
    <h2 class="text-center ${H_SECTION}">How it works</h2>
    <div class="mt-5 flex flex-col gap-3">
      <div class="rounded-clay border border-rule bg-white p-4 shadow-raise-limette flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4"><div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-pill bg-accent-limette-wash font-data text-[0.8125rem] font-bold text-accent-limette-ink">1</div><div class="min-w-0 flex-1"><h3 class="${H_CARD}">Written Test</h3><p class="mt-1 ${SMALL}">40 multiple choice questions on grammar, vocabulary &amp; reading</p></div><div class="ml-auto flex-shrink-0 ${CHIP_QUIET}">~12 min</div></div>
      <div class="rounded-clay border border-rule bg-white p-4 shadow-raise-aprikose flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4"><div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-pill bg-accent-aprikose-wash font-data text-[0.8125rem] font-bold text-accent-aprikose-ink">2</div><div class="min-w-0 flex-1"><h3 class="${H_CARD}">Listening</h3><p class="mt-1 ${SMALL}">Audio exercises with comprehension questions at your level</p></div><div class="ml-auto flex-shrink-0 ${CHIP_QUIET}">~5 min</div></div>
      <div class="rounded-clay border border-rule bg-white p-4 shadow-raise-himbeer flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4"><div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-pill bg-accent-himbeer-wash font-data text-[0.8125rem] font-bold text-accent-himbeer-ink">3</div><div class="min-w-0 flex-1"><h3 class="${H_CARD}">Speaking</h3><p class="mt-1 ${SMALL}">Short AI conversation to assess your speaking skills</p></div><div class="ml-auto flex-shrink-0 ${CHIP_QUIET}">~3 min</div></div>
    </div>
  </div>
  <div class="mt-12">
    <h2 class="text-center ${H_SECTION}">What you'll receive</h2>
    <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="${CARD_FLAT} p-4 text-left sm:text-center"><div><strong class="block text-[0.9375rem] font-bold leading-tight text-ink">Your CEFR Level</strong> <span class="mt-1 block text-[0.8125rem] leading-snug text-graphite">Precise placement from A1.1 to B2.2</span></div></div>
      <div class="${CARD_FLAT} p-4 text-left sm:text-center"><div><strong class="block text-[0.9375rem] font-bold leading-tight text-ink">Skill Breakdown</strong> <span class="mt-1 block text-[0.8125rem] leading-snug text-graphite">See strengths &amp; weaknesses</span></div></div>
      <div class="${CARD_FLAT} p-4 text-left sm:text-center"><div><strong class="block text-[0.9375rem] font-bold leading-tight text-ink">Personalized Path</strong> <span class="mt-1 block text-[0.8125rem] leading-snug text-graphite">Topics to focus on first</span></div></div>
    </div>
  </div>
  <div class="mt-8 rounded-clay border border-rule border-l-4 border-l-accent-aprikose bg-accent-aprikose-wash p-4"><div class="text-[0.9375rem] leading-relaxed text-accent-aprikose-ink"><strong>Pro tip:</strong> Answer honestly and skip questions you're unsure about. This helps us place you accurately — guessing can lead to content that's too difficult.</div></div>
  <div class="mt-8 text-center">
    <p class="${BTN_PRIMARY}">Start the Test</p>
    <p class="mt-4 font-data text-[0.75rem] text-graphite">No account required • Results are instant • 100% free</p>
  </div>
${faqSection(LEVEL_TEST_FAQS)}
</div></div>`,
  },
  {
    path: '/analyze',
    dir: 'analyze',
    ...head('/analyze'),
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Sentence X-Ray',
        description: 'Analyze any German sentence to see grammatical cases, word roles, and explanations.',
        url: 'https://deutsch-meister.de/analyze/',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Any',
        // No `offers`: X-Ray is metered at ANON_DAILY_LIMIT/day, so a bare price:0
        // is the same 'unlimited beside a price' shape marketing.js exists to stop.
        // WebApplication earns no rich result without an aggregateRating anyway.
        provider: ORG_REF,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deutsch-meister.de/' },
          { '@type': 'ListItem', position: 2, name: 'Sentence X-Ray', item: 'https://deutsch-meister.de/analyze/' },
        ],
      },
    ],
    content: `
<div class="min-h-screen bg-paper pt-24 pb-16"><div class="mx-auto max-w-3xl px-4 sm:px-6">
  <div class="mb-10 text-center">
    <h1 class="${H_PAGE}">Sentence X-Ray</h1>
    <p class="mx-auto mt-4 max-w-lg ${LEAD}">Paste any German sentence and see exactly how it works — cases, roles, and why.</p>
  </div>
  <div class="mb-4 ${CARD_FLAT} p-4">
    <p class="text-[1rem] leading-relaxed text-graphite">Type or paste a German sentence… e.g. Die Mutter gibt dem Kind einen Apfel.</p>
  </div>
  <div class="mb-6 flex flex-col gap-4">
    <div class="${CARD_FLAT} px-4 py-4">
      <p class="${SMALL}"><span class="font-bold text-ink">1.</span> Paste any German sentence <span class="font-bold text-ink">2.</span> AI analyzes grammar instantly <span class="font-bold text-ink">3.</span> See cases, roles, and why</p>
    </div>
    <div class="rounded-clay border border-dashed border-rule bg-paper-sunk p-4">
      <p class="mb-3 ${EYEBROW} text-siegel">Example result</p>
      <p class="mb-3 text-[0.875rem] font-medium italic text-graphite">"Ich gebe dir das Buch." — <span class="not-italic">I give you the book.</span></p>
      <!-- The word-by-word breakdown IS the product; mirrored from PreviewExample
           in src/pages/SentenceXRay.jsx, case colours from the kasus tokens.
           Rule 1 holds here because every chip below names its own case. -->
      <ul class="flex list-none flex-wrap gap-2">
        <li class="flex flex-col items-center gap-1"><span class="rounded-md border px-3 py-1.5 text-[0.875rem] font-semibold ${KASUS_CHIP.nominativ}">Ich</span><span class="text-[0.75rem] italic text-graphite">I — subject, Nominative</span></li>
        <li class="flex flex-col items-center gap-1"><span class="rounded-md border px-3 py-1.5 text-[0.875rem] font-semibold ${KASUS_CHIP.plain}">gebe</span><span class="text-[0.75rem] italic text-graphite">give — verb</span></li>
        <li class="flex flex-col items-center gap-1"><span class="rounded-md border px-3 py-1.5 text-[0.875rem] font-semibold ${KASUS_CHIP.dativ}">dir</span><span class="text-[0.75rem] italic text-graphite">to you — indirect object, Dative</span></li>
        <li class="flex flex-col items-center gap-1"><span class="rounded-md border px-3 py-1.5 text-[0.875rem] font-semibold ${KASUS_CHIP.akkusativ}">das Buch</span><span class="text-[0.75rem] italic text-graphite">the book — direct object, Accusative</span></li>
      </ul>
      <p class="mt-3 ${BODY}"><span class="font-bold text-ink">Why "dir" and not "dich"?</span> "geben" takes the thing given in the Accusative (das Buch) and the receiver in the Dative (dir). The X-Ray labels every word with its case, its role in the sentence, and the reason — for any sentence you paste.</p>
    </div>
    <div>
      <p class="mb-2 px-1 ${EYEBROW} text-siegel">Or try an example</p>
      <div class="flex flex-wrap gap-2">
          ${xrayExamples}
      </div>
    </div>
  </div>
</div></div>`,
  },
  {
    path: '/podcasts',
    dir: 'podcasts',
    ...head('/podcasts'),
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'PodcastSeries',
        name: 'DeutschMeister German Learning Podcast',
        description: 'German learning podcast: 24 episodes from A1 to B2, each a natural native-speaker conversation graded to a CEFR level.',
        url: 'https://deutsch-meister.de/podcasts/',
        // webFeed must be an RSS/Atom feed, not the HTML page. The feed is served
        // by netlify/functions/podcast-feed.js via the netlify.toml rewrite.
        webFeed: 'https://deutsch-meister.de/podcast-feed.xml',
        inLanguage: ['de', 'en'],
        numberOfEpisodes: 24,
        genre: ['Education', 'Language Learning'],
        author: ORG_REF,
        isAccessibleForFree: true,
      },
      faqPageSchema(PODCAST_FAQS),
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deutsch-meister.de/' },
          { '@type': 'ListItem', position: 2, name: 'Podcasts', item: 'https://deutsch-meister.de/podcasts/' },
        ],
      },
    ],
    content: `
<div class="min-h-screen bg-paper pt-24 pb-16"><div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
  <div class="mb-12 text-center">
    <div class="${CHIP} bg-accent-aprikose-wash text-accent-aprikose-ink">24 Episodes Available</div>
    <h1 class="mt-4 ${H_PAGE}">German Podcasts for Learners</h1>
    <p class="mx-auto mt-4 max-w-2xl ${LEAD}">Native speaker audio, graded by CEFR level • A1 to B2</p>
    <p class="mx-auto mt-2 max-w-xl ${BODY}">Listen to authentic German conversations designed for language learners. Every episode is graded by CEFR level, from A1 to B2.</p>
  </div>
  <div class="${CARD_FLAT} p-6 sm:p-8">
    <h2 class="${H_SUB}">Learn German with Podcasts</h2>
    <p class="mt-6 ${BODY}">Our German podcasts are designed specifically for language learners. Each episode features native speakers in natural conversations, graded by CEFR level so you can find one that matches where you are.</p>
    <h3 class="mt-8 ${H_CARD}">Why learn with podcasts?</h3>
    <ul class="mt-3 flex list-none flex-col gap-2 ${BODY}">
      <li class="border-l-2 border-siegel pl-3">Improve listening comprehension with native speaker audio</li>
      <li class="border-l-2 border-siegel pl-3">Learn natural speech patterns and pronunciation</li>
      <li class="border-l-2 border-siegel pl-3">Study anywhere — while commuting, exercising, or relaxing</li>
      <li class="border-l-2 border-siegel pl-3">Vocabulary highlights teach you new words in context</li>
    </ul>
    <h3 class="mt-8 ${H_CARD}">Podcasts for every level</h3>
    <p class="mt-3 ${BODY}">Whether you're just starting with German (A1) or working toward fluency (B2), we have 24 episodes across all 8 CEFR levels. Each podcast is labeled with its level so you always know it's right for you.</p>
    <div class="mt-8 flex flex-col gap-4 sm:flex-row">
      <a href="/level/a1.1?tab=podcasts" class="${BTN_PRIMARY}">Start Listening</a>
      <a href="/signup" class="${BTN_SECONDARY}">Sign Up Free</a>
    </div>
  </div>
${faqSection(PODCAST_FAQS)}
</div></div>`,
  },
  {
    path: '/listening',
    dir: 'listening',
    ...head('/listening'),
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deutsch-meister.de/' },
          { '@type': 'ListItem', position: 2, name: 'Listening', item: 'https://deutsch-meister.de/listening/' },
        ],
      },
    ],
    content: `
<div class="min-h-screen bg-paper px-4 pt-24 pb-12 sm:px-6 lg:px-8"><div class="mx-auto max-w-4xl">
  <div class="mb-10 text-center">
    <h1 class="${H_PAGE}">Listening Comprehension</h1>
    <p class="mx-auto mt-4 max-w-lg ${LEAD}">Improve your listening skills with authentic dialogues and exercises.</p>
  </div>
  <div class="grid gap-4 sm:grid-cols-2">${listeningCards}
  </div>
</div></div>`,
  },
  {
    path: '/reading',
    dir: 'reading',
    ...head('/reading'),
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deutsch-meister.de/' },
          { '@type': 'ListItem', position: 2, name: 'Reading', item: 'https://deutsch-meister.de/reading/' },
        ],
      },
    ],
    content: `
<div class="min-h-screen bg-paper pt-24 pb-12"><div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
  <div class="mb-8">
    <h1 class="${H_PAGE}">Reading</h1>
    <p class="mt-4 ${LEAD}">Improve your reading comprehension step by step</p>
  </div>
  <div class="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
    <div class="${CARD_SUNK} p-4"><p class="font-data text-[1.5rem] font-bold leading-none text-ink">${READING_LESSON_COUNT}</p><p class="mt-2 ${EYEBROW} text-graphite">Total Lessons</p></div>
    <div class="${CARD_SUNK} p-4"><p class="font-data text-[1.5rem] font-bold leading-none text-ink">${LEVEL_COUNT}</p><p class="mt-2 ${EYEBROW} text-graphite">Levels</p></div>
  </div>
  <h2 class="mb-5 ${H_SUB}">Overall Reading Progress</h2>
  <div class="grid gap-4 sm:grid-cols-2">${readingCards}
  </div>
</div></div>`,
  },
  {
    // German content page. Was a bare SPA rewrite serving the empty shell —
    // footer-linked from every static page, invisible to every crawler, while
    // its FAQPage JSON-LD promised 21 answers the accordion only shows on
    // click. The answers here come from the same src/data/faqContent.js the
    // React page renders, so the two cannot drift.
    path: '/faq',
    dir: 'faq',
    ...head('/faq'),
    jsonLd: [
      faqPageJsonLd(),
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Start', item: 'https://deutsch-meister.de/' },
          { '@type': 'ListItem', position: 2, name: 'Häufige Fragen', item: 'https://deutsch-meister.de/faq/' },
        ],
      },
    ],
    content: `
<div class="min-h-screen bg-paper"><div class="mx-auto max-w-3xl px-4 pt-24 pb-20 sm:px-6">
  <div class="mb-16 text-center">
    <h1 class="${H_HERO}">Häufige Fragen</h1>
    <p class="mx-auto mt-4 max-w-xl ${LEAD}">Alles, was du über Deutschmeister wissen musst — kurz und ehrlich.</p>
  </div>
  <div class="flex flex-col gap-12">${FAQ_CATEGORIES.map((cat) => `
    <section>
      <h2 class="${H_SUB}">${cat.title}</h2>
      <div class="mt-5 flex flex-col gap-3">${cat.items.map((item) => `
        <div class="${CARD_FLAT} px-5 py-4">
          <h3 class="${H_CARD}">${item.q}</h3>
          <p class="mt-2 ${SMALL}">${item.a}</p>
        </div>`).join('')}
      </div>
    </section>`).join('')}
  </div>
  <div class="mt-16 text-center">
    <p class="mb-6 ${BODY}">Noch Fragen? Einfach loslegen — A1.1 ist komplett kostenlos.</p>
    <a href="/signup" class="${BTN_PRIMARY}">Kostenlos starten</a>
  </div>
</div></div>`,
  },
  {
    // Mirrored from src/pages/UeberUnsPage.jsx — keep in sync. The site's one
    // E-E-A-T page (founder, team, mission) was invisible to crawlers.
    path: '/ueber-uns',
    dir: 'ueber-uns',
    ...head('/ueber-uns'),
    jsonLd: [
      // organization.js says the entity is introduced on the homepage and here,
      // so emit the shared node verbatim rather than a near-copy: UeberUnsPage
      // renders the same constant, which keeps the prerendered node and the
      // hydrated one one entity instead of two descriptions of one org.
      { '@context': 'https://schema.org', ...ORGANIZATION_FULL },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Start', item: 'https://deutsch-meister.de/' },
          { '@type': 'ListItem', position: 2, name: 'Über uns', item: 'https://deutsch-meister.de/ueber-uns/' },
        ],
      },
    ],
    content: `
<div class="min-h-screen bg-paper">
  <section class="pt-28 pb-20"><div class="mx-auto max-w-3xl px-4 text-center sm:px-6">
    <h1 class="${H_HERO}">Deutsch lernen sollte nicht dein Albtraum sein.</h1>
    <p class="mx-auto mt-6 mb-10 max-w-2xl ${LEAD}">Die meisten Apps machen Sprachenlernen zum Spiel — und umgehen dabei das Schwere: echtes Sprechen, echte Grammatik, echte Prüfungsvorbereitung. Deutschmeister macht das Gegenteil.</p>
    <ul class="flex list-none flex-wrap justify-center gap-3">
      <li class="inline-flex items-center rounded-pill border border-rule bg-white px-4 py-2 text-[0.875rem] font-bold text-ink shadow-raise">Von Ärzten in Deutschland entwickelt</li>
      <li class="inline-flex items-center rounded-pill border border-rule bg-white px-4 py-2 text-[0.875rem] font-bold text-ink shadow-raise">Für ernsthafte Lerner</li>
      <li class="inline-flex items-center rounded-pill border border-rule bg-white px-4 py-2 text-[0.875rem] font-bold text-ink shadow-raise">DSGVO-konform – Server in der EU</li>
    </ul>
  </div></section>
  <section class="border-y border-rule bg-white py-20"><div class="mx-auto max-w-2xl px-4 sm:px-6">
    <h2 class="${H_SECTION}">Wer steckt dahinter</h2>
    <div class="mt-6 flex flex-col gap-4 ${BODY}">
      <p>Ich bin Zaid. Arzt, Blue Card, Deutschland. Ich bin von außen gekommen und habe mich durch die Sprachbarriere gekämpft — jeden Tag, jede Prüfung, jedes Gespräch, bei dem mir die Worte fehlten.</p>
      <p>Ich habe Kollegen scheitern sehen. Nicht, weil sie dumm waren. Sondern weil ihr Deutsch nicht gut genug war. Brillante Ärzte, die an der Fachsprachprüfung hängengeblieben sind. Das hat mich nicht losgelassen.</p>
      <p>Zuerst habe ich MedMeister gebaut — eine Plattform speziell für Ärzte, die sich auf die Kenntnisprüfung vorbereiten. Dann habe ich gemerkt: Das gleiche Problem trifft jeden, der Deutsch unter Druck lernt. Nicht nur Mediziner. Pflegekräfte, Ingenieure, Studenten, Familien.</p>
      <p>Heute steht hinter Deutschmeister ein Team von Ärzten in Deutschland — Leute, die den Weg durch die deutschen Sprachprüfungen selbst gegangen sind und die Plattform weiterentwickeln.</p>
      <p class="font-bold text-ink">Deutschmeister ist diese Idee — für alle geöffnet.</p>
    </div>
  </div></section>
  <section class="bg-paper-sunk py-20"><div class="mx-auto max-w-2xl px-4 sm:px-6">
    <h2 class="${H_SECTION}">Wie wir mit Fakten umgehen</h2>
    <div class="mt-6 flex flex-col gap-4 ${BODY}">
      <p>Prüfungsfakten tragen bei uns ein sichtbares Prüfdatum und ihre Quellen — auf der Seite selbst, nicht im Kleingedruckten. Ändert ein Prüfungsanbieter etwas, siehst du, wann wir zuletzt nachgesehen haben.</p>
      <p>Jede Zahl über unsere Inhalte ist gegen die Datenbank gemessen, nie geschätzt. Wo wir nicht gemessen haben, steht keine Zahl.</p>
      <p>Und keine erfundenen Bewertungen: Erfahrungsberichte erscheinen hier erst, wenn echte Lernende sie uns schreiben.</p>
    </div>
  </div></section>
  <section class="py-20"><div class="mx-auto max-w-4xl px-4 sm:px-6">
    <h2 class="text-center ${H_SECTION}">Warum Deutschmeister anders ist</h2>
    <div class="mt-12 grid gap-6 sm:grid-cols-3">
      <div class="${CARD_FLAT} p-6"><h3 class="${H_CARD}">Echtes Sprechen, nicht nur Klicken</h3><p class="mt-2 ${SMALL}">KI bewertet deine Aussprache, Grammatik und Wortschatz wie ein echter Prüfer. Keine Multiple-Choice-Show.</p></div>
      <div class="${CARD_FLAT} p-6"><h3 class="${H_CARD}">Grammatik, die haftet</h3><p class="mt-2 ${SMALL}">Sentence X-Ray seziert echte Sätze. Du verstehst das Wieso, nicht nur das Was.</p></div>
      <div class="${CARD_FLAT} p-6"><h3 class="${H_CARD}">Gebaut von Leuten, die’s selbst durchgemacht haben</h3><p class="mt-2 ${SMALL}">Kein Konzern. Ein Team von Ärzten in Deutschland, das weiß, wie es ist, wenn die Sprache zwischen dir und deinem Leben steht.</p></div>
    </div>
  </div></section>
  <section class="bg-ink py-20"><div class="mx-auto max-w-2xl px-4 text-center sm:px-6">
    <h2 class="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-white sm:text-[2.125rem]">Unsere Mission</h2>
    <p class="mt-6 text-[1.0625rem] leading-relaxed text-rule sm:text-[1.1875rem]">Den Menschen, die wirklich Deutsch brauchen — Migranten, Ärzte, Pflegekräfte, Studenten — das Werkzeug geben, das sie verdienen. Nicht das günstigste. Das beste. Weil ihre Zukunft davon abhängt, ob sie verstanden werden.</p>
  </div></section>
  <section class="py-20"><div class="mx-auto max-w-2xl px-4 sm:px-6">
    <h2 class="text-center ${H_SECTION}">Was kommt als Nächstes</h2>
    <ul class="mt-8 flex list-none flex-col gap-4">
      <li class="${CARD_FLAT} p-4 text-[0.9375rem] font-bold text-ink">Mehr Sprachstufen — C1 und darüber hinaus</li>
      <li class="${CARD_FLAT} p-4 text-[0.9375rem] font-bold text-ink">Live-Prüfungssimulationen für Goethe / telc / TestDaF</li>
      <li class="${CARD_FLAT} p-4 text-[0.9375rem] font-bold text-ink">Spezialisierte Module: Pflegedeutsch, Wirtschaftsdeutsch</li>
      <li class="${CARD_FLAT} p-4 text-[0.9375rem] font-bold text-ink">Community — lerne mit anderen, nicht allein</li>
    </ul>
  </div></section>
  <section class="bg-ink py-24"><div class="mx-auto max-w-3xl px-4 text-center sm:px-6">
    <h2 class="font-display text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.022em] text-white sm:text-[3rem]">Bereit anzufangen?</h2>
    <p class="mt-8 flex flex-wrap justify-center gap-4"><a href="/signup" class="${BTN} bg-white text-ink shadow-raise">Kostenlos testen</a>
    <a href="/pricing/" class="${BTN} border border-white/40 text-white">Preise ansehen</a></p>
  </div></section>
</div>`,
  },
];

function mustReplace(html, pattern, replacement, label, route) {
  // Assert on the MARKER, not on the diff. Comparing before/after treats a
  // no-op replacement as a missing marker, which breaks the moment the shell
  // already holds the target value (e.g. og:locale=en_US in index.html).
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  if (!re.test(html)) {
    throw new Error(`prerender-spa-routes: marker "${label}" not found in shell for ${route}`);
  }
  return html.replace(pattern, replacement);
}

let summary = [];
for (const route of ROUTES) {
  // These routes are served at the trailing-slash URL (/route 301s to /route/),
  // so canonical/og:url/JSON-LD must use the slash form.
  const url = `${BASE}${route.path}/`;
  let html = shell;
  html = mustReplace(html, /<title>[\s\S]*?<\/title>/, `<title>${route.title}</title>`, 'title', route.path);
  // The shell ships noindex (it is a duplicate on every rewrite URL); the
  // prerendered routes are the indexable ones, so the tag must come out here.
  html = mustReplace(html, /\s*<meta name="robots" content="noindex">/, '', 'robots removal', route.path);
  if (route.htmlLang && route.htmlLang !== 'en') {
    // German pages (/faq/, /ueber-uns/) must not ship the shell's lang="en".
    html = mustReplace(html, /(<html[^>]*\blang=")[^"]*(")/, `$1${route.htmlLang}$2`, 'html lang', route.path);
  }
  html = mustReplace(html, /(<meta name="description" content=")[^"]*(")/, `$1${esc(route.description)}$2`, 'description', route.path);
  if (route.keywords) {
    html = mustReplace(html, /(<meta name="keywords" content=")[^"]*(")/, `$1${esc(route.keywords)}$2`, 'keywords', route.path);
  }
  html = mustReplace(html, /(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`, 'og:url', route.path);
  html = mustReplace(html, /(<meta property="og:title" content=")[^"]*(")/, `$1${esc(route.title)}$2`, 'og:title', route.path);
  html = mustReplace(html, /(<meta property="og:description" content=")[^"]*(")/, `$1${esc(route.description)}$2`, 'og:description', route.path);
  html = mustReplace(html, /(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(route.title)}$2`, 'twitter:title', route.path);
  html = mustReplace(html, /(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(route.description)}$2`, 'twitter:description', route.path);
  html = mustReplace(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, 'canonical', route.path);
  // The shell inherits og:locale=de_DE from index.html, but every prerendered
  // route is <html lang="en"> with English copy — set the locale per route.
  const locale = route.ogLocale ?? 'en_US';
  const localeAlt = locale === 'de_DE' ? 'en_US' : 'de_DE';
  html = mustReplace(html, /(<meta property="og:locale" content=")[^"]*(")/, `$1${locale}$2`, 'og:locale', route.path);
  html = mustReplace(html, /(<meta property="og:locale:alternate" content=")[^"]*(")/, `$1${localeAlt}$2`, 'og:locale:alternate', route.path);

  // Drop head JSON-LD blocks that are homepage-specific (the FAQPage about the
  // homepage). WebSite/Organization schemas stay — they are site-wide.
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (m, body) =>
    /"@type":\s*"FAQPage"/.test(body) ? '' : m
  );

  // Route-specific JSON-LD (mirrored from the page's <SEO structuredData>).
  if (route.jsonLd.length > 0) {
    const ld = route.jsonLd
      .map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`)
      .join('\n    ');
    html = mustReplace(html, '</head>', `  ${ld}\n  </head>`, 'head end', route.path);
  }

  // The homepage <noscript> fallback is wrong on these routes and #root now
  // carries real content, so remove it.
  html = html.replace(/<noscript>\s*<div style="max-width:960px[\s\S]*?<\/noscript>/, '');

  // The shell carries a visually-hidden site-identity <h1> ("Learn German with
  // DeutschMeister") as a fallback for the routes that render client-side only.
  // Each route below injects its OWN real <h1>, so leaving the shell's in place
  // gave every prerendered page two — a hidden site-wide heading competing with
  // the page's actual subject, which is worse than having none. Strip it here;
  // app.html keeps it, because the non-prerendered routes still need it.
  html = mustReplace(
    html,
    /\s*<h1 style="position:absolute;[^"]*">[\s\S]*?<\/h1>/,
    '',
    'shell identity h1',
    route.path,
  );

  html = mustReplace(html, '<div id="root"></div>', `<div id="root">${route.content}\n    </div>`, 'root div', route.path);

  const outDir = join(DIST, route.dir);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);

  const words = route.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  summary.push(`  ${route.path.padEnd(12)} → ${route.dir}/index.html (${words} visible words in #root)`);
}

// The SPA shell itself (dist/app.html, served for every non-prerendered app
// route) is <html lang="en"> with English copy but inherits og:locale=de_DE
// from the source index.html — correct it in the built artifact too.
let shellOut = mustReplace(shell, /(<meta property="og:locale" content=")[^"]*(")/, '$1en_US$2', 'og:locale', 'app.html');
shellOut = mustReplace(shellOut, /(<meta property="og:locale:alternate" content=")[^"]*(")/, '$1de_DE$2', 'og:locale:alternate', 'app.html');

// index.html hard-codes canonical=https://deutsch-meister.de/ so that the
// replace above (and the per-route one) has something to target. That is right
// for the six prerendered routes, which overwrite it — but app.html is also
// served verbatim for every OTHER SPA route (/faq, /ueber-uns, /vocabulary…),
// and there it claims each of those pages is the homepage until React hydrates
// and Helmet corrects it. No canonical at all is strictly better than a wrong
// one: Google then falls back to the requested URL, and Helmet still supplies
// the right tag once rendered.
shellOut = mustReplace(
  shellOut,
  /\s*<link rel="canonical" href="[^"]*"(?: data-rh="true")?>/,
  '',
  'canonical removal',
  'app.html',
);

writeFileSync(SHELL, shellOut);
summary.push('  app.html      → og:locale=en_US, canonical removed');

console.log(`prerender-spa-routes: wrote ${ROUTES.length} routes:\n${summary.join('\n')}`);
