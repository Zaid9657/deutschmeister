// Guard suite for the Leitfaden registry (astro-site/src/data/guides/).
//
// A guide is data now, which makes a whole class of mistakes cheap to make and
// invisible in review: a duplicated slug silently drops a page from the build, a
// title two characters too long gets truncated in every SERP, a link written
// without its trailing slash 301-hops on every click. None of that shows up in
// `astro build`, which happily renders all of it.
//
// The internal-link rule is the one worth explaining. CLAUDE.md documents three
// trailing-slash cases, and getting them wrong is called out there as the way
// "every link 301-hops". Guides link into all three kinds of route, so the check
// below encodes the rule rather than trusting the author to remember it.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  GUIDES,
  getGuide,
  guideToc,
  guideReadingMinutes,
  guideJsonLd,
  guideUrl,
} from '../astro-site/src/data/guides/index.js';

const TITLE_SOFT_MAX = 60; // matches scripts/check-built-html.mjs
const DESC_MIN = 50;
const DESC_MAX = 160;

test('the registry is not empty and every slug is unique', () => {
  assert.ok(GUIDES.length > 0, 'no guides registered');
  const slugs = GUIDES.map((g) => g.slug);
  assert.deepEqual([...new Set(slugs)].sort(), [...slugs].sort(), 'duplicate slug in the registry');
  for (const slug of slugs) {
    assert.match(slug, /^[a-z0-9-]+$/, `slug "${slug}" is not URL-safe lowercase`);
    assert.equal(getGuide(slug).slug, slug);
  }
});

test('titles and descriptions fit what a search result shows', () => {
  const failures = [];
  for (const g of GUIDES) {
    if (g.title.length > TITLE_SOFT_MAX) failures.push(`${g.slug}: title ${g.title.length} chars (max ${TITLE_SOFT_MAX})`);
    if (g.description.length < DESC_MIN) failures.push(`${g.slug}: description ${g.description.length} chars (min ${DESC_MIN})`);
    if (g.description.length > DESC_MAX) failures.push(`${g.slug}: description ${g.description.length} chars (max ${DESC_MAX})`);
  }
  assert.deepEqual(failures, [], `title/description length:\n  ${failures.join('\n  ')}`);
});

test('no two guides share a title or a description', () => {
  // check-built-html.mjs fails the build on duplicates in dist/; catching it
  // here names the guide instead of the output file.
  const titles = new Map();
  const descs = new Map();
  const failures = [];
  for (const g of GUIDES) {
    if (titles.has(g.title)) failures.push(`${g.slug} shares its title with ${titles.get(g.title)}`);
    else titles.set(g.title, g.slug);
    if (descs.has(g.description)) failures.push(`${g.slug} shares its description with ${descs.get(g.description)}`);
    else descs.set(g.description, g.slug);
  }
  assert.deepEqual(failures, []);
});

test('every guide has enough substance to be worth indexing', () => {
  const failures = [];
  for (const g of GUIDES) {
    if (g.sections.length < 4) failures.push(`${g.slug}: only ${g.sections.length} sections`);
    if (g.faq.length < 4) failures.push(`${g.slug}: only ${g.faq.length} FAQ entries`);
    // MIN_BODY_CHARS in check-built-html is 250; a guide should be far past it.
    if (guideReadingMinutes(g) < 5) failures.push(`${g.slug}: reads in under 5 minutes`);
    if (!g.lead || !g.cta?.heading) failures.push(`${g.slug}: missing lead or CTA`);
  }
  assert.deepEqual(failures, [], `thin guides:\n  ${failures.join('\n  ')}`);
});

test('every guide leads with a definition-first answer of citable length', () => {
  // GEO fix, geo-weekly.md fix type 2: an answer an engine can lift from the top
  // third. telc-b1 is the highest-volume page on the site and used to bury its
  // pass marks at 37% depth behind a lead containing no extractable fact.
  //
  // The band is a citation-shape constraint, not a style rule: below ~45 words an
  // answer omits the mechanism, above ~120 it stops being liftable as one passage.
  const failures = [];
  for (const g of GUIDES) {
    if (!g.answer) { failures.push(`${g.slug}: no answer block`); continue; }
    const words = g.answer.trim().split(/\s+/).length;
    if (words < 45 || words > 120) failures.push(`${g.slug}: answer is ${words} words (want 45-120)`);
    if (/<[a-z]/i.test(g.answer)) failures.push(`${g.slug}: answer contains markup; it is rendered as text`);
  }
  assert.deepEqual(failures, []);
});

test('section ids are unique within a guide and match their TOC anchors', () => {
  const failures = [];
  for (const g of GUIDES) {
    const ids = g.sections.map((s) => s.id);
    if (new Set(ids).size !== ids.length) failures.push(`${g.slug}: duplicate section id`);
    for (const id of ids) if (!/^[a-z0-9-]+$/.test(id)) failures.push(`${g.slug}: section id "${id}" is not anchor-safe`);
    // The TOC is derived, so this asserts the derivation rather than the author.
    const toc = guideToc(g);
    assert.equal(toc.length, g.sections.length + 1, `${g.slug}: TOC length should be sections + FAQ`);
    for (const [i, section] of g.sections.entries()) {
      if (toc[i].href !== `#${section.id}`) failures.push(`${g.slug}: TOC entry ${i} does not point at #${section.id}`);
    }
  }
  assert.deepEqual(failures, [], `anchors:\n  ${failures.join('\n  ')}`);
});

test('internal links follow the three trailing-slash cases', () => {
  // CLAUDE.md: Astro pages and the six prerendered SPA routes end in "/";
  // every other SPA route has no slash. A wrong one 301-hops on every click.
  const SLASHED_PREFIXES = [
    '/grammar/',
    '/vergleich/',
    '/leitfaden/',
    '/pricing/',
    '/privacy/',
    '/impressum/',
    '/analyze/',
    '/level-test/',
    '/speaking/',
    '/podcasts/',
    '/listening/',
    '/reading/',
  ];
  const NO_SLASH_ROUTES = ['/faq', '/ueber-uns', '/signup', '/login', '/dashboard'];

  const failures = [];
  let linksSeen = 0;
  for (const g of GUIDES) {
    const html = JSON.stringify(g);
    for (const [, href] of html.matchAll(/href=\\"([^"\\]+)\\"/g)) {
      linksSeen += 1;
      if (href.startsWith('http')) {
        // Absolute links to our own domain re-enter the site through a redirect
        // hop and lose the SPA's client-side navigation. The originals did this.
        if (href.includes('deutsch-meister.de')) failures.push(`${g.slug}: absolute self-link ${href}`);
        continue;
      }
      if (!href.startsWith('/')) {
        failures.push(`${g.slug}: link "${href}" is neither absolute nor root-relative`);
        continue;
      }
      const path = href.split('#')[0];
      if (NO_SLASH_ROUTES.includes(path.replace(/\/$/, ''))) {
        if (path.endsWith('/')) failures.push(`${g.slug}: ${href} must NOT end with a slash`);
        continue;
      }
      if (SLASHED_PREFIXES.some((p) => path.startsWith(p))) {
        if (!path.endsWith('/')) failures.push(`${g.slug}: ${href} must end with a slash`);
        continue;
      }
      failures.push(`${g.slug}: ${href} matches no known route shape — add it to this test or fix the link`);
    }
  }
  assert.ok(linksSeen > 0, 'no internal links were checked — did the matcher break?');
  assert.deepEqual(failures, [], `link shapes:\n  ${failures.join('\n  ')}`);
});

test('dates are ISO and not in the future', () => {
  const today = new Date().toISOString().slice(0, 10);
  const failures = [];
  for (const g of GUIDES) {
    for (const field of ['datePublished', 'factsCheckedOn']) {
      const value = g[field];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) failures.push(`${g.slug}: ${field} "${value}" is not YYYY-MM-DD`);
      else if (value > today) failures.push(`${g.slug}: ${field} "${value}" is in the future`);
    }
  }
  assert.deepEqual(failures, [], `dates:\n  ${failures.join('\n  ')}`);
});

test('every guide names at least one source for its exam facts', () => {
  // A guide states exam formats and pass marks. Where those came from, and when
  // they were checked, is rendered on the page — so it has to exist here.
  for (const g of GUIDES) {
    assert.ok(Array.isArray(g.sources) && g.sources.length > 0, `${g.slug}: no sources listed`);
    for (const s of g.sources) {
      assert.ok(s.label, `${g.slug}: a source has no label`);
      assert.match(s.url, /^https:\/\//, `${g.slug}: source url "${s.url}" is not https`);
    }
  }
});

test('no guide makes an outcome promise or states a fee', () => {
  // Same discipline as the pricing surfaces: the product records no pass
  // outcome, so it cannot claim one. Fees are set per exam centre and change
  // without notice, so a number here would be wrong somewhere by definition.
  const OUTCOME = /\b(garantiert bestehst|bestehst du garantiert|Bestehensgarantie|100\s?% Erfolg|sicher bestehen)\b/i;
  const FEE = /\b\d{2,3}\s?(?:–|-|bis)\s?\d{2,3}\s?(?:Euro|€)\b/i;
  const failures = [];
  for (const g of GUIDES) {
    const blob = JSON.stringify(g);
    if (OUTCOME.test(blob)) failures.push(`${g.slug}: contains an outcome promise`);
    if (FEE.test(blob)) failures.push(`${g.slug}: states an exam fee range`);
  }
  assert.deepEqual(failures, [], `claims:\n  ${failures.join('\n  ')}`);
});

test('the JSON-LD builder emits Article, FAQPage and BreadcrumbList', () => {
  const org = { '@type': 'Organization', name: 'DeutschMeister', url: 'https://deutsch-meister.de' };
  for (const g of GUIDES) {
    const blocks = guideJsonLd(g, { organization: org, buildDate: '2026-08-22' });
    const types = blocks.map((b) => b['@type']);
    assert.deepEqual(types, ['Article', 'FAQPage', 'BreadcrumbList'], `${g.slug}: wrong schema set`);

    const [article, faq, crumbs] = blocks;
    assert.equal(article.mainEntityOfPage['@id'], guideUrl(g));
    assert.equal(article.publisher, org);
    assert.equal(faq.mainEntity.length, g.faq.length, `${g.slug}: FAQPage does not cover every question`);
    // The breadcrumb's last item must be this guide, or the trail lies.
    assert.equal(crumbs.itemListElement.at(-1).item, guideUrl(g));
  }
});
