// Shared publication metadata for structured data across the static site.
//
// SITE_PUBLISHED is a fixed launch date (a stable datePublished matters to
// search engines — it must not drift with each build). BUILD_DATE is
// evaluated once per build and used for dateModified / sitemap lastmod, so
// crawlers see an accurate freshness signal after every deploy.
export const SITE_PUBLISHED = '2026-01-21';
export const BUILD_DATE = new Date().toISOString().slice(0, 10);

// The org node moved to src/data/organization.js (one entity, one @id, shared
// with the SPA tree and drift-guarded). This re-export keeps every publisher/
// provider/author slot in the Astro pages on the reference form.
export { ORG_REF as ORGANIZATION, ORGANIZATION_FULL, ORG_ID } from '../data/organization.js';
