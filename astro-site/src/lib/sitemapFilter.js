// Which statically built pages sitemap-0.xml lists (astro.config.mjs).
//
// The statically rendered public routes: homepage, pricing, courses, grammar,
// comparison, guide and exam pages. SPA-only routes stay in
// public/sitemap-spa.xml; the 404 page and the noindex legal drafts are left out.
//
// The "Coming next" course pages are left out too (2026-11-15): six thin,
// near-identical pages for levels that are not built yet, noindex in
// pages/courses/[level].astro. Both follow COMING_SOON_LEVELS in pricing.js, so
// a level that leaves that list is listed and indexable again on the next build.

import { COMING_SOON_LEVELS } from '../data/pricing.js';
import { levelToSlug } from '../data/courseContents.js';

export const SITE = 'https://deutsch-meister.de';

/** The course page URL of every level in `levels`. */
export const courseUrls = (levels) => levels.map((level) => `${SITE}/courses/${levelToSlug(level)}/`);

/** A sitemap filter for @astrojs/sitemap; `comingSoon` defaults to the live list. */
export function makeSitemapFilter(comingSoon = COMING_SOON_LEVELS) {
  const unlisted = new Set(courseUrls(comingSoon));
  return (page) =>
    !unlisted.has(page) &&
    (page === `${SITE}/` ||
      page === `${SITE}/pricing/` ||
      page.includes('/courses/') ||
      page.includes('/grammar/') ||
      page.includes('/vergleich') ||
      page.includes('/leitfaden/') ||
      page.includes('/pruefung/') ||
      page.includes('/telc-b1-komplettvorbereitung'));
}

export const sitemapFilter = makeSitemapFilter();
