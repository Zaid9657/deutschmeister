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
import { ORG_REF, ORG_ID } from '../src/data/organization.js';
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

const LEVELS = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2'];
// src/utils/listeningHelpers.js subtitles (en)
const LEVEL_SUBTITLES = {
  'A1.1': 'Beginner I', 'A1.2': 'Beginner II',
  'A2.1': 'Elementary I', 'A2.2': 'Elementary II',
  'B1.1': 'Intermediate I', 'B1.2': 'Intermediate II',
  'B2.1': 'Upper Intermediate I', 'B2.2': 'Upper Intermediate II',
};
const listeningCards = LEVELS.map((lvl) => `
      <a href="/listening/${lvl.toLowerCase()}" class="block relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-hidden">
        <h3 class="font-display font-semibold text-lg text-slate-800">${lvl}</h3>
        <p class="text-sm text-slate-500">${LEVEL_SUBTITLES[lvl]}</p>
      </a>`).join('');

const readingCards = Object.entries(READING_LESSON_COUNTS_BY_LEVEL).map(([lvl, count]) => `
      <a href="/reading/${lvl}" class="block bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <h3 class="font-semibold text-slate-800">${lvl.toUpperCase()}</h3>
        <p class="text-xs text-slate-500">${count} reading lessons</p>
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

// Visible FAQ markup, in each page's own visual language.
const faqSectionTailwind = (faqs) => `
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 mb-12">
    <h2 class="font-display text-2xl sm:text-3xl font-bold text-slate-800 mb-6">Frequently Asked Questions</h2>
    <div class="space-y-6">${faqs.map(({ q, a }) => `
      <div>
        <h3 class="text-lg font-bold text-slate-800 mb-2">${q}</h3>
        <p class="text-slate-600 leading-relaxed">${a}</p>
      </div>`).join('')}
    </div>
  </div>`;

// Reuses the level-test page's own .test-structure / .structure-step classes
// (src/styles/LevelTest.css) so the FAQ block matches the sections around it.
const faqSectionPlain = (faqs) => `
  <div class="test-structure">
    <h2>Frequently Asked Questions</h2>
    <div class="structure-steps">${faqs.map(({ q, a }) => `
      <div class="structure-step"><div class="step-content"><h3>${q}</h3><p>${a}</p></div></div>`).join('')}
    </div>
  </div>`;

const xrayExamples = [
  'Die Mutter gibt dem Kind einen Apfel.',
  'Wegen des Wetters bleiben wir heute zu Hause.',
  'Er hat das Buch seinem Freund gegeben.',
  'Trotz des Regens ging sie spazieren.',
  'Ich kaufe meiner Schwester ein Geschenk.',
].map((ex) => `<span class="text-sm px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600">${ex}</span>`).join('\n          ');

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
<div class="min-h-screen bg-paper px-4 pt-24 pb-16"><div class="max-w-2xl mx-auto text-center">
  <h1 class="text-3xl sm:text-4xl font-bold text-ink mb-3">German Speaking Practice</h1>
  <p class="text-lg text-graphite mb-8 max-w-xl mx-auto">Speak German out loud with an AI conversation partner that listens, answers at your level, and tells you afterwards what was right, what to fix, and what a native speaker would have said instead.</p>
  <div class="grid sm:grid-cols-3 gap-4 text-left mb-8">
    <div class="bg-white rounded-xl border border-rule p-5">
      <h2 class="font-semibold text-ink text-sm mb-1.5">Every level, A1 to B2</h2>
      <p class="text-sm text-graphite leading-relaxed">The partner adapts its vocabulary and pace to your CEFR level — from first sentences at A1.1 to open discussion at B2.2.</p>
    </div>
    <div class="bg-white rounded-xl border border-rule p-5">
      <h2 class="font-semibold text-ink text-sm mb-1.5">Missions or free talk</h2>
      <p class="text-sm text-graphite leading-relaxed">Guided scenarios — ordering, appointments, small talk — or open conversation. Sessions run 5, 10 or 15 minutes.</p>
    </div>
    <div class="bg-white rounded-xl border border-rule p-5">
      <h2 class="font-semibold text-ink text-sm mb-1.5">Feedback you can use</h2>
      <p class="text-sm text-graphite leading-relaxed">After each session: grammar, vocabulary and pronunciation, with concrete corrections — like a patient tutor with unlimited time.</p>
    </div>
  </div>
  <p><a href="/signup" class="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-semibold bg-siegel text-white">Sign up free</a></p>
  <p class="text-sm text-graphite mt-4">A free account includes ${TRIAL_SPEAKING_SESSIONS} AI speaking sessions — no card needed. Levels: ${LEVELS.join(', ')}.</p>
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
    content: `
<div class="level-test-page"><div class="level-test-container"><div class="level-test-landing enhanced">
  <div class="landing-hero">
    <div class="hero-badge">Free Assessment</div>
    <h1>Discover Your German Level</h1>
    <p class="hero-subtitle">Take our comprehensive placement test and get personalized recommendations for your learning journey</p>
  </div>
  <div class="landing-stats enhanced">
    <div class="stat-item"><div class="stat-content"><span class="stat-value">15-20</span> <span class="stat-label">Minutes</span></div></div>
    <div class="stat-item"><div class="stat-content"><span class="stat-value">3</span> <span class="stat-label">Sections</span></div></div>
    <div class="stat-item"><div class="stat-content"><span class="stat-value">A1-B2</span> <span class="stat-label">Levels</span></div></div>
  </div>
  <div class="test-structure">
    <h2>How it works</h2>
    <div class="structure-steps">
      <div class="structure-step"><div class="step-number">1</div><div class="step-content"><h3>Written Test</h3><p>40 multiple choice questions on grammar, vocabulary &amp; reading</p></div><div class="step-time">~12 min</div></div>
      <div class="structure-step"><div class="step-number">2</div><div class="step-content"><h3>Listening</h3><p>Audio exercises with comprehension questions at your level</p></div><div class="step-time">~5 min</div></div>
      <div class="structure-step"><div class="step-number">3</div><div class="step-content"><h3>Speaking</h3><p>Short AI conversation to assess your speaking skills</p></div><div class="step-time">~3 min</div></div>
    </div>
  </div>
  <div class="what-you-get">
    <h2>What you'll receive</h2>
    <div class="benefits-grid">
      <div class="benefit-item"><div class="benefit-text"><strong>Your CEFR Level</strong> <span>Precise placement from A1.1 to B2.2</span></div></div>
      <div class="benefit-item"><div class="benefit-text"><strong>Skill Breakdown</strong> <span>See strengths &amp; weaknesses</span></div></div>
      <div class="benefit-item"><div class="benefit-text"><strong>Personalized Path</strong> <span>Topics to focus on first</span></div></div>
    </div>
  </div>
  <div class="landing-tip enhanced"><div><strong>Pro tip:</strong> Answer honestly and skip questions you're unsure about. This helps us place you accurately — guessing can lead to content that's too difficult.</div></div>
  <div class="cta-section">
    <p class="start-test-btn enhanced">Start the Test</p>
    <p class="cta-note">No account required • Results are instant • 100% free</p>
  </div>
${faqSectionPlain(LEVEL_TEST_FAQS)}
</div></div></div>`,
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
<div class="min-h-screen bg-slate-50 pt-20 pb-16"><div class="max-w-3xl mx-auto px-4 sm:px-6">
  <div class="text-center mb-10">
    <h1 class="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Sentence X-Ray</h1>
    <p class="text-slate-600 text-lg max-w-lg mx-auto">Paste any German sentence and see exactly how it works — cases, roles, and why.</p>
  </div>
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
    <p class="text-slate-400 text-base leading-relaxed">Type or paste a German sentence… e.g. Die Mutter gibt dem Kind einen Apfel.</p>
  </div>
  <div class="mb-6 space-y-4">
    <div class="bg-white rounded-2xl border border-slate-200 px-4 py-4">
      <p class="text-sm text-slate-500"><span class="font-semibold text-slate-600">1.</span> Paste any German sentence <span class="font-semibold text-slate-600">2.</span> AI analyzes grammar instantly <span class="font-semibold text-slate-600">3.</span> See cases, roles, and why</p>
    </div>
    <div class="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Example result</p>
      <p class="text-sm font-medium text-slate-500 italic mb-3">"Ich gebe dir das Buch." — <span class="not-italic">I give you the book.</span></p>
      <!-- The word-by-word breakdown IS the product; mirrored from PreviewExample
           in src/pages/SentenceXRay.jsx, case colours from the kasus tokens. -->
      <ul class="flex flex-wrap gap-2 list-none">
        <li class="flex flex-col items-center gap-1"><span class="px-3 py-1.5 rounded-lg text-sm font-semibold border bg-[#E6F1FB] border-[#378ADD] text-[#0C447C]">Ich</span><span class="text-xs text-slate-400 italic">I — subject, Nominative</span></li>
        <li class="flex flex-col items-center gap-1"><span class="px-3 py-1.5 rounded-lg text-sm font-semibold border bg-slate-100 border-slate-300 text-slate-700">gebe</span><span class="text-xs text-slate-400 italic">give — verb</span></li>
        <li class="flex flex-col items-center gap-1"><span class="px-3 py-1.5 rounded-lg text-sm font-semibold border bg-[#E1F5EE] border-[#1D9E75] text-[#085041]">dir</span><span class="text-xs text-slate-400 italic">to you — indirect object, Dative</span></li>
        <li class="flex flex-col items-center gap-1"><span class="px-3 py-1.5 rounded-lg text-sm font-semibold border bg-[#FAECE7] border-[#D85A30] text-[#712B13]">das Buch</span><span class="text-xs text-slate-400 italic">the book — direct object, Accusative</span></li>
      </ul>
      <p class="text-sm text-slate-600 mt-3 leading-relaxed"><span class="font-semibold">Why "dir" and not "dich"?</span> "geben" takes the thing given in the Accusative (das Buch) and the receiver in the Dative (dir). The X-Ray labels every word with its case, its role in the sentence, and the reason — for any sentence you paste.</p>
    </div>
    <div>
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Or try an example</p>
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
<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-16"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <div class="text-center mb-12">
    <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-sm font-medium mb-4">24 Episodes Available</div>
    <h1 class="font-display text-4xl sm:text-5xl font-bold text-slate-800 mb-4">German Podcasts for Learners</h1>
    <p class="text-lg text-slate-600 max-w-2xl mx-auto mb-2">Native speaker audio, graded by CEFR level • A1 to B2</p>
    <p class="text-slate-500 max-w-xl mx-auto">Listen to authentic German conversations designed for language learners. Every episode is graded by CEFR level, from A1 to B2.</p>
  </div>
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 mb-12">
    <h2 class="font-display text-2xl sm:text-3xl font-bold text-slate-800 mb-6">Learn German with Podcasts</h2>
    <p class="text-slate-600 leading-relaxed mb-4">Our German podcasts are designed specifically for language learners. Each episode features native speakers in natural conversations, graded by CEFR level so you can find one that matches where you are.</p>
    <h3 class="text-xl font-bold text-slate-800 mt-6 mb-3">Why learn with podcasts?</h3>
    <ul class="space-y-2 text-slate-600">
      <li>Improve listening comprehension with native speaker audio</li>
      <li>Learn natural speech patterns and pronunciation</li>
      <li>Study anywhere — while commuting, exercising, or relaxing</li>
      <li>Vocabulary highlights teach you new words in context</li>
    </ul>
    <h3 class="text-xl font-bold text-slate-800 mt-6 mb-3">Podcasts for every level</h3>
    <p class="text-slate-600 leading-relaxed">Whether you're just starting with German (A1) or working toward fluency (B2), we have 24 episodes across all 8 CEFR levels. Each podcast is labeled with its level so you always know it's right for you.</p>
    <div class="mt-8 flex flex-col sm:flex-row gap-4">
      <a href="/level/a1.1?tab=podcasts" class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-2xl">Start Listening</a>
      <a href="/signup" class="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl">Sign Up Free</a>
    </div>
  </div>
${faqSectionTailwind(PODCAST_FAQS)}
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
<div class="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8"><div class="max-w-4xl mx-auto">
  <div class="text-center mb-10">
    <h1 class="text-3xl font-display font-bold text-slate-800 mb-2">Listening Comprehension</h1>
    <p class="text-slate-500 max-w-lg mx-auto">Improve your listening skills with authentic dialogues and exercises.</p>
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
<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-12"><div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
  <div class="mb-8">
    <h1 class="font-display text-3xl sm:text-4xl font-bold text-slate-800">Reading</h1>
    <p class="text-slate-600">Improve your reading comprehension step by step</p>
  </div>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
    <div class="bg-white rounded-xl p-4 shadow-sm border border-slate-100"><p class="text-2xl font-bold text-slate-800">${READING_LESSON_COUNT}</p><p class="text-sm text-slate-500">Total Lessons</p></div>
    <div class="bg-white rounded-xl p-4 shadow-sm border border-slate-100"><p class="text-2xl font-bold text-slate-800">${LEVEL_COUNT}</p><p class="text-sm text-slate-500">Levels</p></div>
  </div>
  <h2 class="font-semibold text-slate-800 mb-3">Overall Reading Progress</h2>
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
<div class="min-h-screen bg-paper"><div class="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">
  <div class="text-center mb-16">
    <h1 class="font-display text-4xl sm:text-5xl font-bold text-ink mb-4">Häufige Fragen</h1>
    <p class="text-lg text-graphite max-w-xl mx-auto">Alles, was du über Deutschmeister wissen musst — kurz und ehrlich.</p>
  </div>
  <div class="space-y-12">${FAQ_CATEGORIES.map((cat) => `
    <section>
      <h2 class="font-display text-xl font-bold text-ink mb-5">${cat.title}</h2>
      <div class="space-y-3">${cat.items.map((item) => `
        <div class="border border-rule rounded-xl px-5 py-4">
          <h3 class="font-medium text-ink mb-2">${item.q}</h3>
          <p class="text-graphite text-sm leading-relaxed">${item.a}</p>
        </div>`).join('')}
      </div>
    </section>`).join('')}
  </div>
  <div class="mt-16 text-center">
    <p class="text-graphite mb-4">Noch Fragen? Einfach loslegen — A1.1 ist komplett kostenlos.</p>
    <a href="/signup" class="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-semibold bg-siegel text-white">Kostenlos starten</a>
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
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': ORG_ID,
        name: 'DeutschMeister',
        url: 'https://deutsch-meister.de',
        founder: { '@type': 'Person', name: 'Zaid', jobTitle: 'Arzt & Gründer' },
        foundingDate: '2024',
        description: 'KI-gestützte Plattform zum Deutschlernen — Sprechtraining, Grammatik und Prüfungsvorbereitung von A1 bis B2. Entwickelt von einem Team von Ärzten in Deutschland.',
      },
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
  <section class="pt-28 pb-20"><div class="max-w-3xl mx-auto px-4 sm:px-6 text-center">
    <h1 class="font-display text-4xl sm:text-5xl font-bold text-ink mb-6 leading-tight">Deutsch lernen sollte nicht dein Albtraum sein.</h1>
    <p class="text-lg sm:text-xl text-graphite max-w-2xl mx-auto mb-10 leading-relaxed">Die meisten Apps machen Sprachenlernen zum Spiel — und umgehen dabei das Schwere: echtes Sprechen, echte Grammatik, echte Prüfungsvorbereitung. Deutschmeister macht das Gegenteil.</p>
    <ul class="flex flex-wrap justify-center gap-3 list-none">
      <li class="inline-flex items-center px-4 py-2 rounded-full bg-white border border-rule text-sm text-ink font-medium">Von Ärzten in Deutschland entwickelt</li>
      <li class="inline-flex items-center px-4 py-2 rounded-full bg-white border border-rule text-sm text-ink font-medium">Für ernsthafte Lerner</li>
      <li class="inline-flex items-center px-4 py-2 rounded-full bg-white border border-rule text-sm text-ink font-medium">DSGVO-konform – Server in der EU</li>
    </ul>
  </div></section>
  <section class="py-20 bg-white border-y border-rule"><div class="max-w-2xl mx-auto px-4 sm:px-6">
    <h2 class="font-display text-2xl sm:text-3xl font-bold text-ink mb-6">Wer steckt dahinter</h2>
    <div class="text-graphite leading-relaxed space-y-4">
      <p>Ich bin Zaid. Arzt, Blue Card, Deutschland. Ich bin von außen gekommen und habe mich durch die Sprachbarriere gekämpft — jeden Tag, jede Prüfung, jedes Gespräch, bei dem mir die Worte fehlten.</p>
      <p>Ich habe Kollegen scheitern sehen. Nicht, weil sie dumm waren. Sondern weil ihr Deutsch nicht gut genug war. Brillante Ärzte, die an der Fachsprachprüfung hängengeblieben sind. Das hat mich nicht losgelassen.</p>
      <p>Zuerst habe ich MedMeister gebaut — eine Plattform speziell für Ärzte, die sich auf die Kenntnisprüfung vorbereiten. Dann habe ich gemerkt: Das gleiche Problem trifft jeden, der Deutsch unter Druck lernt. Nicht nur Mediziner. Pflegekräfte, Ingenieure, Studenten, Familien.</p>
      <p>Heute steht hinter Deutschmeister ein Team von Ärzten in Deutschland — Leute, die den Weg durch die deutschen Sprachprüfungen selbst gegangen sind und die Plattform weiterentwickeln.</p>
      <p class="font-medium text-ink">Deutschmeister ist diese Idee — für alle geöffnet.</p>
    </div>
  </div></section>
  <section class="py-20"><div class="max-w-4xl mx-auto px-4 sm:px-6">
    <h2 class="font-display text-2xl sm:text-3xl font-bold text-ink text-center mb-12">Warum Deutschmeister anders ist</h2>
    <div class="grid sm:grid-cols-3 gap-6">
      <div class="bg-white rounded-2xl border border-rule p-6"><h3 class="font-bold text-ink mb-2">Echtes Sprechen, nicht nur Klicken</h3><p class="text-sm text-graphite leading-relaxed">KI bewertet deine Aussprache, Grammatik und Wortschatz wie ein echter Prüfer. Keine Multiple-Choice-Show.</p></div>
      <div class="bg-white rounded-2xl border border-rule p-6"><h3 class="font-bold text-ink mb-2">Grammatik, die haftet</h3><p class="text-sm text-graphite leading-relaxed">Sentence X-Ray seziert echte Sätze. Du verstehst das Wieso, nicht nur das Was.</p></div>
      <div class="bg-white rounded-2xl border border-rule p-6"><h3 class="font-bold text-ink mb-2">Gebaut von Leuten, die’s selbst durchgemacht haben</h3><p class="text-sm text-graphite leading-relaxed">Kein Konzern. Ein Team von Ärzten in Deutschland, das weiß, wie es ist, wenn die Sprache zwischen dir und deinem Leben steht.</p></div>
    </div>
  </div></section>
  <section class="py-20 bg-ink"><div class="max-w-2xl mx-auto px-4 sm:px-6 text-center">
    <h2 class="font-display text-2xl sm:text-3xl font-bold text-white mb-6">Unsere Mission</h2>
    <p class="text-lg text-rule leading-relaxed">Den Menschen, die wirklich Deutsch brauchen — Migranten, Ärzte, Pflegekräfte, Studenten — das Werkzeug geben, das sie verdienen. Nicht das günstigste. Das beste. Weil ihre Zukunft davon abhängt, ob sie verstanden werden.</p>
  </div></section>
  <section class="py-20"><div class="max-w-2xl mx-auto px-4 sm:px-6">
    <h2 class="font-display text-2xl sm:text-3xl font-bold text-ink mb-8 text-center">Was kommt als Nächstes</h2>
    <ul class="space-y-4 list-none">
      <li class="p-4 bg-white rounded-xl border border-rule text-ink font-medium">Mehr Sprachstufen — C1 und darüber hinaus</li>
      <li class="p-4 bg-white rounded-xl border border-rule text-ink font-medium">Live-Prüfungssimulationen für Goethe / telc / TestDaF</li>
      <li class="p-4 bg-white rounded-xl border border-rule text-ink font-medium">Spezialisierte Module: Pflegedeutsch, Wirtschaftsdeutsch</li>
      <li class="p-4 bg-white rounded-xl border border-rule text-ink font-medium">Community — lerne mit anderen, nicht allein</li>
    </ul>
  </div></section>
  <section class="py-24 bg-ink"><div class="max-w-3xl mx-auto px-4 sm:px-6 text-center">
    <h2 class="font-display text-3xl sm:text-4xl font-bold text-white mb-8">Bereit anzufangen?</h2>
    <p><a href="/signup" class="inline-flex items-center justify-center px-8 py-4 bg-paper text-ink font-semibold rounded-md">Kostenlos testen</a>
    <a href="/pricing/" class="inline-flex items-center justify-center px-8 py-4 border-2 border-white/40 text-white font-semibold rounded-2xl">Preise ansehen</a></p>
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
  /\s*<link rel="canonical" href="[^"]*">/,
  '',
  'canonical removal',
  'app.html',
);

writeFileSync(SHELL, shellOut);
summary.push('  app.html      → og:locale=en_US, canonical removed');

console.log(`prerender-spa-routes: wrote ${ROUTES.length} routes:\n${summary.join('\n')}`);
