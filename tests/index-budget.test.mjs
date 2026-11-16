// Guard suite for the index budget (2026-11-15, plan "Stop the leaks", step 5).
//
// Search Console, read 2026-11-11: 33 pages indexed, 151 not (96 "discovered –
// currently not indexed", 27 "crawled – currently not indexed"). Three causes,
// each pinned here:
//   1. parameter copies of real pages — about 800 /analyze/?s=<sentence> links
//      from the grammar examples and ?ref=…&utm_* on every on-site door — are
//      disallowed in public/robots.txt, and the X-Ray sentence links are nofollow;
//   2. the six "Coming next" course pages are noindex and out of the sitemap,
//      both derived from COMING_SOON_LEVELS so a level that ships is indexable
//      again on its next build;
//   3. the first questions of each grammar topic are plain HTML in the page.
// The built output is held to all three by scripts/check-built-html.mjs (full
// mode, in CI after the offline Astro build) through checkIndexBudget(); the
// fixtures below pin that checker, the source rules pin what it reads.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE, CRAWLERS, parseRobots, isDisallowed, sitemapLocs, checkIndexBudget, PARAMETER_SAMPLES } from '../scripts/crawl-guard.mjs';
import { onsiteHref, DOORS, ONSITE_SOURCES } from '../astro-site/src/lib/onsiteLinks.js';
import { XRAY_OFFER } from '../src/lib/xray.js';
import { ALL_LEVELS, COMING_SOON_LEVELS, courseForLevel } from '../src/data/pricing.js';
import { sitemapFilter, makeSitemapFilter, courseUrls } from '../astro-site/src/lib/sitemapFilter.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const ROBOTS = read('public/robots.txt');
const robots = parseRobots(ROBOTS);
const blocked = (path) => CRAWLERS.every((c) => isDisallowed(robots, c, path));
const open = (path) => CRAWLERS.every((c) => !isDisallowed(robots, c, path));

// --- 1. robots.txt -----------------------------------------------------------

test('robots.txt disallows every parameter shape our own links emit', () => {
  const emitted = [
    ...PARAMETER_SAMPLES,
    ...Object.keys(DOORS).flatMap((door) => ONSITE_SOURCES.map((src) => onsiteHref(door, src, 'some-slug'))),
    onsiteHref('telcOffer', 'leitfaden', 'telc-b1', 'telc-b1-offer'),
    XRAY_OFFER.signupHref,
    XRAY_OFFER.courseHref,
    read('astro-site/src/pages/index.astro').match(/HOME_SIGNUP_HREF = '([^']+)'/)[1],
  ];
  for (const href of emitted) assert.ok(blocked(href), `${href} stays crawlable for ${CRAWLERS.join('/')}`);
});

test('robots.txt leaves every real page crawlable: no URL without a query string is blocked', () => {
  const pages = [
    '/', '/analyze/', '/pricing/', '/courses/', '/courses/a1-1/', '/courses/a1-2/', '/grammar/',
    '/grammar/a1.1/', '/grammar/b2.2/konjunktiv-ii/', '/leitfaden/telc-b1/', '/pruefung/dtz/',
    '/vergleich/', '/telc-b1-komplettvorbereitung/', '/level-test/', '/sitemap.xml', '/sitemap-0.xml',
    '/llms.txt', '/_astro/index.Bx1.css', '/favicon.svg', '/og-image.png',
  ];
  const spa = sitemapLocs(read('public/sitemap-spa.xml')).map((loc) => loc.slice(SITE.length) || '/');
  assert.ok(spa.length > 0);
  for (const path of [...pages, ...spa]) assert.ok(open(path), `${path} is blocked`);
  // A query string that is not ours stays open: only the shapes we emit are closed.
  assert.ok(open('/grammar/a1.1/?page=2'));
});

// --- 2. coming-soon course pages ---------------------------------------------

test('the sitemap lists a course page exactly when its level is not in COMING_SOON_LEVELS', () => {
  assert.ok(COMING_SOON_LEVELS.length > 0);
  for (const level of ALL_LEVELS) {
    const [url] = courseUrls([level]);
    assert.equal(sitemapFilter(url), !COMING_SOON_LEVELS.includes(level), url);
  }
  assert.equal(courseUrls(['a2.1'])[0], `${SITE}/courses/a2-1/`);
  // A level that leaves the list is listed again, with nothing else to edit.
  assert.equal(makeSitemapFilter(['b2.2'])(`${SITE}/courses/a2-1/`), true);
  assert.equal(makeSitemapFilter(['b2.2'])(`${SITE}/courses/b2-2/`), false);
  for (const url of ['/', '/pricing/', '/courses/', '/grammar/a1.1/articles/', '/leitfaden/dtz/', '/pruefung/telc-b1/', '/vergleich/']) {
    assert.equal(sitemapFilter(`${SITE}${url}`), true, url);
  }
  for (const url of ['/404/', '/impressum/', '/datenschutz/']) assert.equal(sitemapFilter(`${SITE}${url}`), false, url);
  assert.match(read('astro-site/astro.config.mjs'), /filter:\s*sitemapFilter\b/);
});

test('a coming-soon course page renders noindex, from the same list', () => {
  const page = read('astro-site/src/pages/courses/[level].astro');
  assert.match(page, /const coming = Boolean\(course\?\.comingSoon\);/);
  assert.match(page, /<Layout\b[^>]*\snoindex=\{coming\}/);
  for (const level of ALL_LEVELS) assert.equal(Boolean(courseForLevel(level)?.comingSoon), COMING_SOON_LEVELS.includes(level), level);
});

// --- 1 and 3 in the grammar template ------------------------------------------

test('every X-Ray sentence link in the grammar template is rel="nofollow"', () => {
  const page = read('astro-site/src/pages/grammar/[level]/[slug].astro');
  const tags = [...page.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]).filter((t) => /analyze\/\?s=|href=\{xrayHref\}/.test(t));
  assert.equal(tags.length, 3, 'the header link, the summary link and the per-example link');
  for (const tag of tags) assert.match(tag, /\srel=(?:"nofollow"|\{[^}]*'nofollow'[^}]*\})/, tag);
});

test('the grammar template previews the first questions as static HTML and keeps the island', () => {
  const page = read('astro-site/src/pages/grammar/[level]/[slug].astro');
  assert.match(page, /const PREVIEW_COUNT = 3;/);
  assert.match(page, /exercises\.slice\(0, PREVIEW_COUNT\)/);
  assert.match(page, /<li data-static-exercise>/);
  // Options in the island's dealt order, never the stored one; no answer field.
  assert.match(page, /exercise_type === 'multiple_choice' \? dealOptions\(ex\) : \[\]/);
  const preview = page.slice(page.indexOf('const previewExercises'), page.indexOf('const tocItems'));
  assert.doesNotMatch(preview, /correct_answer|acceptable_answers|explanation|why_correct/);
  assert.match(page, /<ExercisePlayer[\s\S]*?client:visible[\s\S]*?\/>/);
  const island = read('astro-site/src/components/ExercisePlayer.jsx');
  assert.match(island, /export function dealOptions\(exercise, run = 0\)/);
  assert.match(island, /useMemo\(\(\) => dealOptions\(exercise, run\), \[exercise, run\]\)/);
});

// --- the built-output checker ------------------------------------------------

const GRAMMAR = 'grammar/a1.1/articles/index.html';
const grammarPage = ({ rel = 'nofollow', preview = true } = {}) => `<!doctype html><html><head><title>g</title></head><body>
<a href="/analyze/?s=Der%20Tisch&amp;x=1"${rel ? ` rel="${rel}"` : ''}>X-Ray</a>
<script>const s = '<a href="/analyze/?s=Hallo">';</script>
<section id="practice"><astro-island></astro-island>${preview ? '<details><ol><li data-static-exercise><p>Das ist ___ Tisch.</p></li></ol></details>' : ''}</section>
</body></html>`;
const coursePage = ({ noindex = true } = {}) =>
  `<!doctype html><html><head>${noindex ? '<meta name="robots" content="noindex, nofollow">' : ''}<link rel="canonical" href="${SITE}/courses/a2-1/"></head><body><h1>A2.1</h1></body></html>`;
const urlset = (paths) => `<?xml version="1.0"?><urlset>${paths.map((p) => `<url><loc>${SITE}${p}</loc></url>`).join('')}</urlset>`;

function budget(overrides = {}) {
  const files = {
    'robots.txt': ROBOTS,
    'sitemap.xml': urlset(['/', '/grammar/a1.1/articles/']),
    'index.html': '<!doctype html><html><head></head><body><a href="/grammar/a1.1/articles/">x</a></body></html>',
    [GRAMMAR]: grammarPage(),
    'grammar/a1.1/index.html': '<!doctype html><html><head></head><body><section id="practice"></section></body></html>',
    'courses/a2-1/index.html': coursePage(),
    ...overrides,
  };
  const dist = mkdtempSync(join(tmpdir(), 'index-budget-'));
  try {
    for (const [rel, body] of Object.entries(files)) {
      if (body === null) continue; // null leaves the file out of the build
      mkdirSync(dirname(join(dist, rel)), { recursive: true });
      writeFileSync(join(dist, rel), body);
    }
    return checkIndexBudget(dist, { comingSoonCoursePaths: ['/courses/a2-1/'] });
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
}

test('checkIndexBudget passes a correct build, and counts what it saw', () => {
  const r = budget();
  assert.deepEqual(r.fail, []);
  assert.equal(r.xrayLinks, 1, 'the link inside <script> is not an anchor');
  assert.equal(r.grammarPages, 1, 'a level hub is not a topic page');
  assert.equal(r.previewed, 1);
});

test('checkIndexBudget names a robots.txt that lets parameter copies be crawled', () => {
  const r = budget({ 'robots.txt': `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n` });
  assert.equal(r.fail.length, PARAMETER_SAMPLES.length * CRAWLERS.length);
  assert.match(r.fail[0], /^robots\.txt: \/analyze\/\?s=.* is crawlable for Googlebot/);
});

test('checkIndexBudget names an X-Ray sentence link without nofollow', () => {
  for (const rel of [null, 'noopener', 'nofollowing']) {
    const r = budget({ [GRAMMAR]: grammarPage({ rel }) });
    assert.equal(r.fail.length, 1, String(rel));
    assert.match(r.fail[0], /^grammar\/a1\.1\/articles\/index\.html: links \/analyze\/\?s=Der%20Tisch&x=1 without rel="nofollow"$/);
  }
  assert.deepEqual(budget({ [GRAMMAR]: grammarPage({ rel: 'noopener nofollow' }) }).fail, []);
});

test('checkIndexBudget names a grammar topic page whose exercises exist only in the island', () => {
  const r = budget({ [GRAMMAR]: grammarPage({ preview: false }) });
  assert.deepEqual(r.fail, [`${GRAMMAR}: has practice exercises but none of them in the static HTML (data-static-exercise)`]);
});

test('checkIndexBudget names a coming-soon course page that is indexable, listed or missing', () => {
  assert.deepEqual(budget({ 'courses/a2-1/index.html': coursePage({ noindex: false }) }).fail, [
    '/courses/a2-1/: coming-soon course page is indexable; it must be noindex until the level leaves COMING_SOON_LEVELS',
  ]);
  assert.deepEqual(budget({ 'sitemap.xml': urlset(['/', '/courses/a2-1/']) }).fail, ['/courses/a2-1/: coming-soon course page is listed in a sitemap']);
  assert.deepEqual(budget({ 'courses/a2-1/index.html': null }).fail, ['/courses/a2-1/: coming-soon course page is missing from the build']);
});
