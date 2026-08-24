// The one Organization entity.
//
// Before this file the org was declared eight different ways across both build
// trees — index.html, the Astro homepage, siteMeta.js, a local const on the 64
// grammar pages, three inline literals in the prerender script, and per-page
// literals in the SPA — none carrying an @id, so search engines saw several
// similar-but-unequal organisations instead of one entity. Every declaration
// now either IS this node or references it by @id.
//
// Same regime as marketing.js: plain ESM, no JSX, importable by node scripts,
// Vite and Astro alike; byte-identical twin at astro-site/src/data/ guarded by
// scripts/check-duplicates.mjs.

export const ORG_ID = 'https://deutsch-meister.de/#organization';

/**
 * The full node. Emit this on the pages that introduce the entity — the
 * homepage and /ueber-uns/ — and reference it everywhere else.
 * Founder and team facts are the ones already shipped on /ueber-uns/
 * (founder: Zaid; developed by a team of doctors in Germany, owner-confirmed
 * 2026-08-24).
 */
export const ORGANIZATION_FULL = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'DeutschMeister',
  url: 'https://deutsch-meister.de',
  logo: 'https://deutsch-meister.de/logo.png',
  description: 'A German language learning platform covering CEFR levels A1.1 to B2.2',
  sameAs: ['https://www.youtube.com/@deutschmeister_de'],
  foundingDate: '2024',
  founder: { '@type': 'Person', name: 'Zaid', jobTitle: 'Arzt & Gründer' },
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'zaid@deutsch-meister.de',
    contactType: 'customer service',
    availableLanguage: ['en', 'de'],
  },
};

/**
 * The reference form for publisher / provider / author / seller slots.
 * Carries @id plus enough identity (name, url, logo) to stay meaningful for
 * parsers that do not resolve @id references across nodes.
 */
export const ORG_REF = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'DeutschMeister',
  url: 'https://deutsch-meister.de',
  logo: 'https://deutsch-meister.de/logo.png',
};
