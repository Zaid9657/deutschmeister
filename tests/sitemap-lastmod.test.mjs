// public/sitemap-spa.xml carries hand-maintained lastmod dates for the
// prerendered SPA routes (stamping the build date would claim a freshness the
// copy does not have). Until 2026-10-25 all eight still read 2026-08-24,
// although the /faq/ answers changed on 2026-10-02 and 2026-10-05 and the
// podcast copy on 2026-10-22: crawlers had no signal to refresh the old answers.
//
// The /faq/ copy lives in one file, src/data/faqContent.js, which exports the
// date of its last copy change. This test holds the sitemap to it without any
// repository history (CI may clone shallow): bumping FAQ_COPY_UPDATED is part
// of an FAQ copy change, and the lastmod may never fall behind it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { FAQ_COPY_UPDATED } from '../src/data/faqContent.js';
import { SEO_ROUTES } from '../src/data/seoRoutes.js';

const xml = readFileSync(new URL('../public/sitemap-spa.xml', import.meta.url), 'utf8');
const entries = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map((m) => ({ loc: m[1], lastmod: m[2] }));
const ISO = /^\d{4}-\d{2}-\d{2}$/;

test('every sitemap-spa.xml entry carries an ISO lastmod that is not in the future', () => {
  assert.ok(entries.length >= 8, `expected the prerendered routes, found ${entries.length}`);
  const today = new Date().toISOString().slice(0, 10);
  for (const { loc, lastmod } of entries) {
    assert.match(lastmod, ISO, `${loc}: lastmod "${lastmod}" is not YYYY-MM-DD`);
    assert.ok(lastmod <= today, `${loc}: lastmod ${lastmod} is in the future`);
  }
});

test('the /faq/ lastmod never falls behind the FAQ copy it describes', () => {
  assert.match(FAQ_COPY_UPDATED, ISO, 'FAQ_COPY_UPDATED must be YYYY-MM-DD');
  const faq = entries.find((e) => e.loc === 'https://deutsch-meister.de/faq/');
  assert.ok(faq, '/faq/ is listed in sitemap-spa.xml');
  assert.ok(
    faq.lastmod >= FAQ_COPY_UPDATED,
    `/faq/ lastmod ${faq.lastmod} is older than the FAQ copy (${FAQ_COPY_UPDATED}): bump it in public/sitemap-spa.xml`,
  );
});

test('the podcast copy change of 2026-10-22 is in the sitemap', () => {
  const podcasts = entries.find((e) => e.loc === 'https://deutsch-meister.de/podcasts/');
  assert.ok(podcasts && podcasts.lastmod >= '2026-10-22', '/podcasts/ lastmod predates the access FAQ and PodcastSeries copy change');
});

test('every prerendered route\'s lastmod keeps up with the copy change its registry entry records', () => {
  // The first pass bumped /faq/ and /podcasts/ but left /level-test/ and
  // /speaking/ at 2026-08-24 although their head descriptions changed on
  // 2026-10-25. Each SEO_ROUTES entry now records `updated`, the date its
  // prerendered copy last changed; the sitemap may never fall behind it.
  const today = new Date().toISOString().slice(0, 10);
  for (const [route, entry] of Object.entries(SEO_ROUTES)) {
    assert.match(entry.updated ?? '', ISO, `SEO_ROUTES['${route}'].updated must be YYYY-MM-DD`);
    assert.ok(entry.updated <= today, `SEO_ROUTES['${route}'].updated ${entry.updated} is in the future`);
    const listed = entries.find((e) => e.loc === `https://deutsch-meister.de${route}/`);
    assert.ok(listed, `${route}/ is prerendered but missing from sitemap-spa.xml`);
    assert.ok(
      listed.lastmod >= entry.updated,
      `${route}/ lastmod ${listed.lastmod} is older than its copy (SEO_ROUTES updated ${entry.updated}): bump it in public/sitemap-spa.xml`,
    );
  }
  // The head changes of 2026-10-25 themselves (the descriptions of these two routes).
  for (const route of ['/level-test', '/speaking']) assert.ok(SEO_ROUTES[route].updated >= '2026-10-25', `${route}: its 2026-10-25 head change is not recorded`);
});
