// The Leitfaden (guide) registry — the SEO content engine.
//
// WHY THIS EXISTS. `/leitfaden/telc-b1/` measured Lighthouse SEO 100 and is the
// site's best top-of-funnel asset, but it shipped as ~274 lines of hardcoded
// consts in a single .astro file. Writing a second guide meant copying all of
// it, so nobody did, and the pattern sat unreplicated for months. Here a guide
// is DATA: one module per guide, rendered by `pages/leitfaden/[slug].astro`.
// Adding a guide is a data file plus one line in scripts/check-built-html.mjs.
//
// NOT duplicated into src/data/. The SPA does not render guides — Netlify
// serves the static Astro page at these URLs, and `src/pages/leitfaden/
// TelcB1Page.jsx` is dead code reachable only on the Vite dev server. New
// guides deliberately get no SPA twin; the `/leitfaden/*` rewrite in
// netlify.toml still catches unknown slugs.
//
// ROUTING NOTE: everything lives under `/leitfaden/`, which netlify.toml
// already copies wholesale and the sitemap filter already whitelists. A new
// TOP-LEVEL segment would need its own `cp -r` step in the build command —
// staying under /leitfaden/ is what keeps this zero-config.
//
// FACT DISCIPLINE. Exam facts change. Every guide carries `factsCheckedOn` and
// a `sources` list, both rendered on the page, so a reader (and an AI answer
// engine) can see when the numbers were last checked and against whom. Rules:
//   - No pass-rate, outcome or "you will pass" promises. Same rule as pricing.
//   - Fees are NOT stated: they vary by centre and change without notice. Point
//     at the exam body instead.
//   - Anything about our own product comes from ../marketing.js, never typed.

import { telcB1 } from './telc-b1.js';
import { goetheB1 } from './goethe-b1.js';
import { dtz } from './dtz.js';
import { telcB2 } from './telc-b2.js';
import { briefSchreibenB1 } from './brief-schreiben-b1.js';
import { modelltestDeutschB1 } from './modelltest-deutsch-b1.js';
import { startDeutsch1 } from './start-deutsch-1.js';

/**
 * @typedef {{type:'p', text:string}} BlockP            paragraph; may carry inline <a>/<strong>
 * @typedef {{type:'h3', text:string}} BlockH3
 * @typedef {{type:'list', items:string[]}} BlockList
 * @typedef {{type:'callout', text:string}} BlockCallout
 * @typedef {{type:'table', head:string[], rows:string[][]}} BlockTable
 * @typedef {{type:'steps', items:{label:string,title:string,tasks:string[],tip?:string}[]}} BlockSteps
 * @typedef {{type:'warnings', items:{title:string,body:string}[]}} BlockWarnings
 * @typedef {{type:'cards', items:{eyebrow:string,title:string,body:string}[]}} BlockCards
 * @typedef {BlockP|BlockH3|BlockList|BlockCallout|BlockTable|BlockSteps|BlockWarnings|BlockCards} Block
 *
 * @typedef {object} Guide
 * @property {string}  slug            URL segment under /leitfaden/
 * @property {string}  title           <title>; ≤60 chars (check-built-html soft cap)
 * @property {string}  h1              on-page heading; may be longer than the title
 * @property {string}  description     meta description, 50–160 chars
 * @property {string}  keywords
 * @property {string}  badge           small label above the h1
 * @property {string}  lead            hero paragraph
 * @property {string}  answer          definition-first answer, 45–120 words, rendered
 *                                     in the top third. Restates figures already in
 *                                     `sections` — it must never introduce a new fact.
 * @property {string}  datePublished   ISO date, used for Article schema
 * @property {string}  factsCheckedOn  ISO date the exam facts were last verified
 * @property {{label:string, url:string}[]} sources  official bodies the facts came from
 * @property {{id:string, heading:string, blocks:Block[]}[]} sections
 * @property {{q:string,a:string}[]} faq
 * @property {{heading:string, body:string}} cta
 */

/** Every guide, in the order the hub lists them. */
export const GUIDES = [telcB1, goetheB1, telcB2, dtz, startDeutsch1, briefSchreibenB1, modelltestDeutschB1];

export const getGuide = (slug) => GUIDES.find((g) => g.slug === slug);

/**
 * Table of contents, derived from the sections themselves plus the FAQ. Derived
 * rather than authored so an anchor can never point at a section that was
 * renamed or removed — the telc-b1 original kept them in two hand-synced lists.
 */
export const guideToc = (guide) => [
  ...guide.sections.map((s) => ({ href: `#${s.id}`, label: s.heading })),
  { href: '#faq', label: 'Häufige Fragen' },
];

/**
 * Reading time at 200 wpm over the rendered words, to the nearest minute.
 * Deliberately NOT rounded to 5-minute steps: that turned a 7-minute guide into
 * "ca. 5 Minuten", which understates the page to the reader it is trying to
 * keep.
 */
export const guideReadingMinutes = (guide) => {
  const text = [
    guide.lead,
    ...guide.sections.flatMap((s) => [s.heading, ...s.blocks.flatMap(blockText)]),
    ...guide.faq.flatMap((f) => [f.q, f.a]),
  ].join(' ');
  const words = text.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.round(words / 200));
};

function blockText(b) {
  switch (b.type) {
    case 'p':
    case 'h3':
    case 'callout':
      return [b.text];
    case 'list':
      return b.items;
    case 'table':
      return [...b.head, ...b.rows.flat()];
    case 'steps':
      return b.items.flatMap((i) => [i.title, ...i.tasks, i.tip || '']);
    case 'warnings':
      return b.items.flatMap((i) => [i.title, i.body]);
    case 'cards':
      return b.items.flatMap((i) => [i.title, i.body]);
    default:
      return [];
  }
}

const BASE = 'https://deutsch-meister.de';
export const guideUrl = (guide) => `${BASE}/leitfaden/${guide.slug}/`;

/**
 * Article + FAQPage + BreadcrumbList for one guide.
 *
 * The original telc-b1 page emitted Article + FAQPage but no breadcrumb and no
 * `inLanguage`/publisher object — the vergleich hub was richer than the guide.
 * One builder means every guide gets the better set.
 */
export const guideJsonLd = (guide, { organization, buildDate }) => [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.h1,
    description: guide.description,
    inLanguage: 'de',
    author: organization,
    publisher: organization,
    image: 'https://deutsch-meister.de/og-image.png',
    datePublished: guide.datePublished,
    // The checked date, not the build date: stamping every deploy claims a
    // freshness the content does not have, which teaches crawlers to discount
    // the field. sitemap-spa.xml makes the same argument about lastmod.
    dateModified: guide.factsCheckedOn ?? guide.datePublished,
    mainEntityOfPage: { '@type': 'WebPage', '@id': guideUrl(guide) },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: `${BASE}/` },
      { '@type': 'ListItem', position: 2, name: 'Leitfäden', item: `${BASE}/leitfaden/` },
      { '@type': 'ListItem', position: 3, name: guide.h1, item: guideUrl(guide) },
    ],
  },
];
