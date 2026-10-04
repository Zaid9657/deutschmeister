// Guard suite for scripts/crawl-guard.mjs, the crawl and index check that
// scripts/check-built-html.mjs runs against the built dist/ in CI.
//
// Asked by hand on 2026-10-04, when signups went quiet: did a release add a
// noindex, change a canonical, break robots.txt or the sitemap? The answer was
// no (built-dist diff e4d2281 -> 4372e1a, 140 pages), but nothing in CI could
// have said so: check-built-html only required a canonical to EXIST, and only
// checked sitemap-spa.xml's 8 URLs for noindex, not sitemap-0.xml's 125.
//
// Each case below builds a tiny dist that is correct, breaks one thing, and
// asserts the guard names exactly that thing. The clean fixture must pass, so a
// guard that fails everything cannot hide behind a red build either.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SITE, parseRobots, isDisallowed, noindexHeaderRules, headerPathMatches, headSignals, checkCrawlability,
} from '../scripts/crawl-guard.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const ROBOTS = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /app.html

Sitemap: ${SITE}/sitemap.xml
`;

const page = (url, { canonical = url, robots = null, extraHead = '' } = {}) => `<!doctype html>
<html lang="en"><head>
<title>${url}</title>
<!-- a comment quoting <meta name="robots" content="noindex"> must not count -->
${robots ? `<meta name="robots" content="${robots}">` : ''}
${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
${extraHead}
</head><body><h1>${url}</h1></body></html>`;

const urlset = (urls) =>
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
    .map((u) => `<url><loc>${u}</loc></url>`)
    .join('')}</urlset>`;

const TOML_OK = `[[headers]]
  for = "/app.html"
  [headers.values]
    X-Robots-Tag = "noindex"

[[redirects]]
  from = "/intro"
  to = "/app.html"
  status = 200
`;

/** Write a correct three-page site; `mutate(dir)` then breaks one thing. */
function fixture(mutate = () => {}) {
  const dir = mkdtempSync(join(tmpdir(), 'crawl-guard-'));
  const write = (rel, body) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  };
  write('robots.txt', ROBOTS);
  write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
      `<sitemap><loc>${SITE}/sitemap-0.xml</loc></sitemap><sitemap><loc>${SITE}/sitemap-spa.xml</loc></sitemap></sitemapindex>`,
  );
  write('sitemap-0.xml', urlset([`${SITE}/`, `${SITE}/grammar/a1.1/articles/`]));
  write('sitemap-spa.xml', urlset([`${SITE}/analyze/`]));
  write('index.html', page(`${SITE}/`));
  write('grammar/a1.1/articles/index.html', page(`${SITE}/grammar/a1.1/articles/`));
  write('analyze/index.html', page(`${SITE}/analyze/`));
  write('app.html', page(`${SITE}/`, { canonical: null, robots: 'noindex' }));
  const toml = mutate({ dir, write }) ?? TOML_OK;
  try {
    return checkCrawlability(dir, { tomlText: toml });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('a correct site passes and every sitemap URL is checked', () => {
  const r = fixture();
  assert.deepEqual(r.fail, []);
  assert.equal(r.checked, 3);
});

test('a noindex on a sitemap-0 page fails (it used to be checked for sitemap-spa only)', () => {
  const r = fixture(({ write }) => write('grammar/a1.1/articles/index.html',
    page(`${SITE}/grammar/a1.1/articles/`, { robots: 'noindex, follow' })));
  assert.equal(r.fail.length, 1);
  assert.match(r.fail[0], /^sitemap-0\.xml: .*\/grammar\/a1\.1\/articles\/ is listed but its robots meta says "noindex, follow"$/);
});

test('a googlebot-specific noindex counts too', () => {
  const r = fixture(({ write }) => write('analyze/index.html',
    page(`${SITE}/analyze/`, { extraHead: '<meta name="googlebot" content="noindex">' })));
  assert.equal(r.fail.length, 1);
  assert.match(r.fail[0], /^sitemap-spa\.xml: .*\/analyze\/ is listed but its robots meta says "noindex"$/);
});

test('a canonical that points anywhere but the page itself fails', () => {
  const r = fixture(({ write }) => write('grammar/a1.1/articles/index.html',
    page(`${SITE}/grammar/a1.1/articles/`, { canonical: `${SITE}/` })));
  assert.equal(r.fail.length, 1);
  assert.match(r.fail[0], /names https:\/\/deutsch-meister\.de\/ as its canonical, expected itself$/);
});

test('the slash form is part of the canonical (CLAUDE.md trailing-slash cases 1 and 2)', () => {
  const r = fixture(({ write }) => write('analyze/index.html',
    page(`${SITE}/analyze/`, { canonical: `${SITE}/analyze` })));
  assert.equal(r.fail.length, 1);
  assert.match(r.fail[0], /\/analyze\/ names https:\/\/deutsch-meister\.de\/analyze as its canonical/);
});

test('a missing or doubled canonical fails', () => {
  const missing = fixture(({ write }) => write('index.html', page(`${SITE}/`, { canonical: null })));
  assert.match(missing.fail.join('\n'), /has 0 canonical links, expected 1/);
  const doubled = fixture(({ write }) => write('index.html',
    page(`${SITE}/`, { extraHead: `<link rel="canonical" href="${SITE}/pricing/">` })));
  assert.match(doubled.fail.join('\n'), /has 2 canonical links, expected 1/);
});

test('Disallow: / in robots.txt fails every URL for both crawlers', () => {
  const r = fixture(({ write }) => write('robots.txt', ROBOTS.replace('Allow: /\n', 'Disallow: /\n')));
  assert.equal(r.fail.length, 6);
  assert.ok(r.fail.every((f) => /is disallowed for (Googlebot|Bingbot) by robots\.txt$/.test(f)));
});

test('a crawler-specific group overrides * (RFC 9309), so a Googlebot block is caught', () => {
  const r = fixture(({ write }) => write('robots.txt', `${ROBOTS}\nUser-agent: Googlebot\nDisallow: /grammar/\n`));
  assert.deepEqual(r.fail, [`sitemap-0.xml: ${SITE}/grammar/a1.1/articles/ is disallowed for Googlebot by robots.txt`]);
});

test('robots.txt without a Sitemap line, or naming a missing sitemap, fails', () => {
  const none = fixture(({ write }) => write('robots.txt', ROBOTS.replace(/^Sitemap:.*$/m, '')));
  assert.deepEqual(none.fail, ['robots.txt: names no Sitemap:']);
  const gone = fixture(({ dir }) => rmSync(join(dir, 'sitemap-spa.xml')));
  assert.deepEqual(gone.fail, [`sitemap.xml: sitemap ${SITE}/sitemap-spa.xml is not in the build`]);
});

test('a sitemap URL with no built page fails', () => {
  const r = fixture(({ write }) => write('sitemap-0.xml', urlset([`${SITE}/`, `${SITE}/grammar/a1.1/gone/`])));
  assert.deepEqual(r.fail, [`sitemap-0.xml: ${SITE}/grammar/a1.1/gone/ has no built page`]);
});

test('an X-Robots-Tag noindex header rule over real pages fails; the /app.html one does not', () => {
  const r = fixture(() => `${TOML_OK}\n[[headers]]\n  for = "/grammar/*"\n  [headers.values]\n    X-Robots-Tag = "noindex, nofollow"\n`);
  assert.deepEqual(r.fail, [
    `sitemap-0.xml: ${SITE}/grammar/a1.1/articles/ gets X-Robots-Tag "noindex, nofollow" from the header rule for /grammar/*`,
  ]);
  const shell = fixture(({ write }) => {
    write('_headers', '/*\n  X-Robots-Tag: none\n');
  });
  assert.equal(shell.fail.length, 3, 'a dist/_headers rule is read as well');
});

test('robots matcher: longest match wins, Allow wins a tie, $ anchors, empty Disallow allows', () => {
  const r = parseRobots('User-agent: *\nDisallow: /a\nAllow: /a/b\nDisallow: /*.pdf$\nDisallow:\n');
  assert.equal(isDisallowed(r, 'Googlebot', '/a/x'), true);
  assert.equal(isDisallowed(r, 'Googlebot', '/a/b/c'), false);
  assert.equal(isDisallowed(r, 'Googlebot', '/doc.pdf'), true);
  assert.equal(isDisallowed(r, 'Googlebot', '/doc.pdf?x=1'), false);
  assert.equal(isDisallowed(parseRobots('User-agent: *\nDisallow: /p\nAllow: /p\n'), 'Bingbot', '/p'), false);
  assert.equal(isDisallowed(parseRobots('User-agent: *\nDisallow:\n'), 'Googlebot', '/'), false);
});

test('header globs follow Netlify: * is a splat, :name one segment', () => {
  assert.equal(headerPathMatches('/*', '/grammar/a1.1/'), true);
  assert.equal(headerPathMatches('/app.html', '/app.html'), true);
  assert.equal(headerPathMatches('/app.html', '/'), false);
  assert.equal(headerPathMatches('/grammar/:level/', '/grammar/a1.1/'), true);
  assert.equal(headerPathMatches('/grammar/:level/', '/grammar/a1.1/x/'), false);
  assert.deepEqual(noindexHeaderRules(TOML_OK), [{ for: '/app.html', value: 'noindex' }]);
});

test('head signals ignore comments and read only the <head>', () => {
  const s = headSignals(page(`${SITE}/x/`));
  assert.deepEqual(s, { canonicals: [`${SITE}/x/`], robots: [] });
});

test('the real robots.txt keeps every advertised section crawlable for Googlebot and Bingbot', () => {
  const robots = parseRobots(readFileSync(join(root, 'public/robots.txt'), 'utf8'));
  assert.ok(robots.sitemaps.includes(`${SITE}/sitemap.xml`), 'robots.txt must name the sitemap index');
  for (const path of ['/', '/pricing/', '/courses/a1-1/', '/grammar/a1.1/', '/leitfaden/telc-b1/', '/pruefung/dtz/',
    '/vergleich/', '/analyze/', '/level-test/', '/podcasts/', '/faq/']) {
    for (const crawler of ['Googlebot', 'Bingbot']) {
      assert.equal(isDisallowed(robots, crawler, path), false, `${path} must stay crawlable for ${crawler}`);
    }
  }
  assert.equal(isDisallowed(robots, 'Googlebot', '/app.html'), true, 'the raw shell stays out');
});

test('the real netlify.toml sends no noindex header to an advertised page', () => {
  const rules = noindexHeaderRules(readFileSync(join(root, 'netlify.toml'), 'utf8'));
  const sitemaps = ['public/sitemap-spa.xml'].map((f) => readFileSync(join(root, f), 'utf8'));
  const paths = ['/', '/pricing/', '/grammar/a1.1/', '/leitfaden/telc-b1/']
    .concat(sitemaps.flatMap((x) => [...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].slice(SITE.length))));
  for (const p of paths) {
    for (const rule of rules) assert.equal(headerPathMatches(rule.for, p), false, `${p} matched noindex rule ${rule.for}`);
  }
});

test('check-built-html runs the guard in full mode', () => {
  const src = readFileSync(join(root, 'scripts/check-built-html.mjs'), 'utf8');
  assert.match(src, /import \{ checkCrawlability \} from '\.\/crawl-guard\.mjs';/);
  assert.match(src, /if \(!SPA_ONLY\) \{\s*\n[^]*?checkCrawlability\(DIST/);
  assert.match(src, /for \(const msg of crawl\.fail\) fail\.push\(msg\);/);
});
