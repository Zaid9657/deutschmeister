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
// src/pages/ReadingSectionPage.jsx LESSON_COUNTS
const READING_LESSON_COUNTS = {
  'a1.1': 3, 'a1.2': 4, 'a2.1': 5, 'a2.2': 6,
  'b1.1': 7, 'b1.2': 8, 'b2.1': 9, 'b2.2': 10,
};

const listeningCards = LEVELS.map((lvl) => `
      <a href="/listening/${lvl.toLowerCase()}" class="block relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-hidden">
        <h3 class="font-display font-semibold text-lg text-slate-800">${lvl}</h3>
        <p class="text-sm text-slate-500">${LEVEL_SUBTITLES[lvl]}</p>
      </a>`).join('');

const readingCards = Object.entries(READING_LESSON_COUNTS).map(([lvl, count]) => `
      <a href="/reading/${lvl}" class="block bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <h3 class="font-semibold text-slate-800">${lvl.toUpperCase()}</h3>
        <p class="text-xs text-slate-500">${count} reading lessons</p>
      </a>`).join('');

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
    title: 'German Speaking Practice with an AI Partner | DeutschMeister',
    description: 'Practice speaking German with an AI conversation partner: guided missions or free conversation, with instant feedback. Levels A1 to B2.',
    jsonLd: [],
    content: `
<div class="min-h-screen bg-slate-50 pt-16"><div class="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-10">
  <div class="mb-6">
    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100/80 text-teal-700 text-[11px] font-semibold mb-2 tracking-wide uppercase">AI Speaking Practice</div>
    <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">German Speaking Practice</h1>
  </div>
  <p class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Level</p>
  <div class="flex gap-2 overflow-x-auto pb-2 mb-1">
    ${LEVELS.map((l) => `<span class="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold bg-white text-slate-600 border border-slate-200">${l}</span>`).join('\n    ')}
  </div>
  <p class="text-sm text-slate-500 mb-6">Beginner 1</p>
  <p class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Duration</p>
  <p class="text-slate-800 font-medium mb-6">5, 10 or 15 minutes</p>
  <p class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Mission (optional)</p>
  <p class="text-slate-600 text-sm mb-6">Free conversation or guided missions with instant feedback — levels A1 to B2.</p>
  <p class="flex items-center justify-center gap-2 w-full py-4 bg-teal-500 text-white font-bold rounded-2xl shadow-md shadow-teal-200 text-center">Start</p>
  <p class="text-center text-xs text-slate-400 mt-3">Free conversation · 5 minutes</p>
</div></div>`,
  },
  {
    path: '/level-test',
    dir: 'level-test',
    title: 'Free German Level Test | Find Your CEFR Level (A1-B2) | DeutschMeister',
    description: 'Take our free German level test to discover your CEFR level. Test your reading, listening, and speaking skills in 15 minutes. Instant results with personalized learning recommendations.',
    keywords: 'German level test, CEFR test, German placement test, what level is my German, German proficiency test, free German test',
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
        provider: { '@type': 'Organization', name: 'DeutschMeister', url: 'https://deutsch-meister.de' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'How long does the German level test take?', acceptedAnswer: { '@type': 'Answer', text: 'The complete test takes approximately 15-20 minutes, including written, listening, and speaking sections.' } },
          { '@type': 'Question', name: 'Is the German level test free?', acceptedAnswer: { '@type': 'Answer', text: "Yes, the German level test is completely free. You'll receive instant results showing your CEFR level from A1 to B2." } },
          { '@type': 'Question', name: 'What does the German level test include?', acceptedAnswer: { '@type': 'Answer', text: 'The test includes three sections: written comprehension (grammar and vocabulary), listening comprehension with native speaker audio, and speaking assessment with AI feedback.' } },
          { '@type': 'Question', name: 'What CEFR levels does the test cover?', acceptedAnswer: { '@type': 'Answer', text: 'The test assesses levels from complete beginner (A1) to upper intermediate (B2), following the Common European Framework of Reference for Languages.' } },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deutsch-meister.de' },
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
</div></div></div>`,
  },
  {
    path: '/analyze',
    dir: 'analyze',
    title: 'Sentence X-Ray — Analyze Any German Sentence | DeutschMeister',
    description: 'Paste any German sentence and instantly see the grammatical breakdown. Color-coded cases, word roles, and explanations for why each word works the way it does.',
    keywords: 'German grammar analyzer, German sentence analysis, German cases, nominative accusative dative genitive, learn German grammar',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Sentence X-Ray',
        description: 'Analyze any German sentence to see grammatical cases, word roles, and explanations.',
        url: 'https://deutsch-meister.de/analyze/',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Any',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        provider: { '@type': 'Organization', name: 'DeutschMeister', url: 'https://deutsch-meister.de' },
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
    title: 'German Podcasts for Beginners | Learn German A1-B2 | DeutschMeister',
    description: 'Free German podcasts designed for learners. 24 episodes with native speaker audio and transcripts for levels A1 to B2. Improve your German listening skills while commuting or relaxing.',
    keywords: 'German podcast for beginners, learn German podcast, German listening practice, German audio lessons, German podcast with transcript',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'PodcastSeries',
        name: 'DeutschMeister German Learning Podcast',
        description: 'German language learning podcast with 24 episodes covering levels A1 to B2. Each episode features native speaker conversations with transcripts and vocabulary explanations.',
        webFeed: 'https://deutsch-meister.de/podcasts/',
        inLanguage: ['de', 'en'],
        numberOfEpisodes: 24,
        genre: ['Education', 'Language Learning'],
        author: { '@type': 'Organization', name: 'DeutschMeister', url: 'https://deutsch-meister.de' },
        isAccessibleForFree: true,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'What level are the German podcasts?', acceptedAnswer: { '@type': 'Answer', text: 'We have 24 podcast episodes covering all levels from A1 (complete beginner) to B2 (upper intermediate). Each episode is labeled with its CEFR level so you can find content that matches your skills.' } },
          { '@type': 'Question', name: 'Are the German podcasts free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, all podcasts are free to listen to. A1.1 content is available without signup, while other levels require a free account.' } },
          { '@type': 'Question', name: 'Do the podcasts have transcripts?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, every podcast episode includes a full transcript in German with translations. This helps you follow along and learn new vocabulary in context.' } },
          { '@type': 'Question', name: 'How many podcast episodes are there?', acceptedAnswer: { '@type': 'Answer', text: 'We have 24 episodes total — 3 episodes for each of the 8 CEFR levels (A1.1, A1.2, A2.1, A2.2, B1.1, B1.2, B2.1, B2.2). New episodes are added regularly.' } },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deutsch-meister.de' },
          { '@type': 'ListItem', position: 2, name: 'Podcasts', item: 'https://deutsch-meister.de/podcasts/' },
        ],
      },
    ],
    content: `
<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-16"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <div class="text-center mb-12">
    <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-sm font-medium mb-4">24 Episodes Available</div>
    <h1 class="font-display text-4xl sm:text-5xl font-bold text-slate-800 mb-4">German Podcasts for Learners</h1>
    <p class="text-lg text-slate-600 max-w-2xl mx-auto mb-2">Native speaker audio with transcripts • Levels A1 to B2</p>
    <p class="text-slate-500 max-w-xl mx-auto">Listen to authentic German conversations designed for language learners. Each episode comes with full transcripts and vocabulary explanations.</p>
  </div>
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 mb-12">
    <h2 class="font-display text-2xl sm:text-3xl font-bold text-slate-800 mb-6">Learn German with Podcasts</h2>
    <p class="text-slate-600 leading-relaxed mb-4">Our German podcasts are designed specifically for language learners. Each episode features native speakers in natural conversations, with full transcripts and vocabulary explanations to help you follow along.</p>
    <h3 class="text-xl font-bold text-slate-800 mt-6 mb-3">Why learn with podcasts?</h3>
    <ul class="space-y-2 text-slate-600">
      <li>Improve listening comprehension with native speaker audio</li>
      <li>Learn natural speech patterns and pronunciation</li>
      <li>Study anywhere — while commuting, exercising, or relaxing</li>
      <li>Full transcripts help you catch every word</li>
      <li>Vocabulary highlights teach you new words in context</li>
    </ul>
    <h3 class="text-xl font-bold text-slate-800 mt-6 mb-3">Podcasts for every level</h3>
    <p class="text-slate-600 leading-relaxed">Whether you're just starting with German (A1) or working toward fluency (B2), we have 24 episodes across all 8 CEFR levels. Each podcast is labeled with its level so you always know it's right for you.</p>
    <div class="mt-8 flex flex-col sm:flex-row gap-4">
      <a href="/level/a1.1?tab=podcasts" class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-2xl">Start Listening</a>
      <a href="/signup" class="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl">Sign Up Free</a>
    </div>
  </div>
</div></div>`,
  },
  {
    path: '/listening',
    dir: 'listening',
    title: 'German Listening Practice | 480 Audio Exercises A1-B2 | DeutschMeister',
    description: 'Improve your German listening comprehension with 480 native speaker dialogues across all CEFR levels. Interactive exercises with questions and instant feedback.',
    keywords: 'German listening practice, German audio exercises, German listening comprehension, learn German listening, German dialogues',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deutsch-meister.de' },
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
    title: 'German Reading Practice | 52 Lessons A1-B2 | DeutschMeister',
    description: 'Improve your German reading comprehension with 52 leveled reading passages. Authentic texts with comprehension questions for all CEFR levels from A1 to B2.',
    keywords: 'German reading practice, German reading comprehension, learn German reading, German texts for learners, CEFR reading exercises',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deutsch-meister.de' },
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
    <div class="bg-white rounded-xl p-4 shadow-sm border border-slate-100"><p class="text-2xl font-bold text-slate-800">52</p><p class="text-sm text-slate-500">Total Lessons</p></div>
    <div class="bg-white rounded-xl p-4 shadow-sm border border-slate-100"><p class="text-2xl font-bold text-slate-800">8</p><p class="text-sm text-slate-500">Levels</p></div>
  </div>
  <h2 class="font-semibold text-slate-800 mb-3">Overall Reading Progress</h2>
  <div class="grid gap-4 sm:grid-cols-2">${readingCards}
  </div>
</div></div>`,
  },
];

function mustReplace(html, pattern, replacement, label, route) {
  const out = html.replace(pattern, replacement);
  if (out === html) throw new Error(`prerender-spa-routes: marker "${label}" not found in shell for ${route}`);
  return out;
}

let summary = [];
for (const route of ROUTES) {
  // These routes are served at the trailing-slash URL (/route 301s to /route/),
  // so canonical/og:url/JSON-LD must use the slash form.
  const url = `${BASE}${route.path}/`;
  let html = shell;
  html = mustReplace(html, /<title>[\s\S]*?<\/title>/, `<title>${route.title}</title>`, 'title', route.path);
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

  html = mustReplace(html, '<div id="root"></div>', `<div id="root">${route.content}\n    </div>`, 'root div', route.path);

  const outDir = join(DIST, route.dir);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);

  const words = route.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  summary.push(`  ${route.path.padEnd(12)} → ${route.dir}/index.html (${words} visible words in #root)`);
}

console.log(`prerender-spa-routes: wrote ${ROUTES.length} routes:\n${summary.join('\n')}`);
