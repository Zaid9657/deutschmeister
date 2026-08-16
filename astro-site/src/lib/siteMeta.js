// Shared publication metadata for structured data across the static site.
//
// SITE_PUBLISHED is a fixed launch date (a stable datePublished matters to
// search engines — it must not drift with each build). BUILD_DATE is
// evaluated once per build and used for dateModified / sitemap lastmod, so
// crawlers see an accurate freshness signal after every deploy.
export const SITE_PUBLISHED = '2026-01-21';
export const BUILD_DATE = new Date().toISOString().slice(0, 10);

export const ORGANIZATION = {
  '@type': 'Organization',
  name: 'DeutschMeister',
  url: 'https://deutsch-meister.de',
  logo: 'https://deutsch-meister.de/logo.png',
};
