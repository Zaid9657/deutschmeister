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
import { redirectRules, redirectMatches, linkPaths, resolveLink, checkInternalLinks } from '../scripts/crawl-guard.mjs';

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

// --- internal links (2026-10-07) ---------------------------------------------------------------
// Every same-site <a href> on every built page must reach a page without a hop: CLAUDE.md's
// trailing-slash cases (a slashless link to a built page 301-hops) and the three-place route rule
// (a SPA route missing from netlify.toml is a hard 404). Measured on the built dist of 772a91d3:
// 13,872 same-site links on 140 pages, 0 failures, so the class is at zero and each case below is
// a rule, not a list of known links.

const LINK_TOML = `[[redirects]]
  from = "https://www.deutsch-meister.de/*"
  to = "https://deutsch-meister.de/:splat"
  status = 301
  force = true
[[redirects]]
  from = "/grammar/A1.1"
  to = "/grammar/a1.1/"
  status = 301
[[redirects]]
  from = "/signup"
  to = "/app.html"
  status = 200
[[redirects]]
  from = "/course/*"
  to = "/app.html"
  status = 200
[[redirects]]
  from = "/vocabulary/:level"
  to = "/app.html"
  status = 200
[[redirects]]
  from = "/podcast-feed.xml"
  to = "/.netlify/functions/podcast-feed"
  status = 200
[[headers]]
  for = "/app.html"
  [headers.values]
    X-Robots-Tag = "noindex"
[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404
`;

/** Write a tiny built site; `files` maps dist paths to HTML. Returns checkInternalLinks' result. */
function linkSite(files, tomlText = LINK_TOML) {
  const dir = mkdtempSync(join(tmpdir(), 'link-guard-'));
  try {
    for (const [rel, body] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, rel)), { recursive: true });
      writeFileSync(join(dir, rel), body);
    }
    return checkInternalLinks(dir, { tomlText });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** A built site whose home page carries `links`, beside a few real pages. */
const linkFixture = (links, tomlText) =>
  linkSite(
    {
      'index.html': `<!doctype html><html><head><title>home</title></head><body>${links}</body></html>`,
      'grammar/a1.1/index.html': '<!doctype html><title>grammar</title><a href="articles/">relative</a>',
      'grammar/a1.1/articles/index.html': '<!doctype html><title>articles</title><a href="../">up</a>',
      'analyze/index.html': '<!doctype html><title>analyze</title>',
      'robots.txt': 'User-agent: *\nAllow: /\n',
      '404.html': '<!doctype html><title>404</title><a href="/">home</a>',
    },
    tomlText,
  );

test('links that Netlify serves without a hop pass: built pages, files, rewrites, splats, placeholders, off-site, relative', () => {
  const r = linkFixture([
    '<a href="/">home</a>',
    '<a href="/grammar/a1.1/">page</a>',
    '<a href="https://deutsch-meister.de/grammar/a1.1/articles/#top">absolute</a>',
    '<a href="/analyze/?s=Ich%20bin">query</a>',
    '<a href="/robots.txt">file</a>',
    '<a href="/signup?ref=grammar&amp;utm_medium=onsite">rewrite</a>',
    '<a href="/course/a1.1">splat</a>',
    '<a href="/course/a1.1/l/1">deep splat</a>',
    '<a href="/vocabulary/b1">placeholder</a>',
    '<a href="/podcast-feed.xml">feed</a>',
    '<a href="https://www.youtube.com/@deutschmeister_de">off-site</a>',
    '<a href="mailto:kontakt@deutsch-meister.de">mail</a><a href="#main">anchor</a><a href="tel:+49">tel</a>',
  ].join(''));
  assert.deepEqual(r.fail, []);
  assert.equal(r.pages, 5);
  assert.equal(r.links, 13, 'ten same-site links on the home page, plus relative, up and the 404 page home link');
});

test('a slashless link to a built page fails: it 301-hops (CLAUDE.md trailing-slash cases 1 and 2)', () => {
  const r = linkFixture('<a href="/grammar/a1.1">astro</a><a href="https://deutsch-meister.de/analyze">prerendered</a>');
  assert.equal(r.fail.length, 2);
  assert.match(r.fail[0], /^internal link \/grammar\/a1\.1 301-hops to \/grammar\/a1\.1\/ .*linked from \/$/);
  assert.match(r.fail[1], /^internal link \/analyze 301-hops to \/analyze\//);
});

test('a link that only a 301 rule serves fails, and names the rule', () => {
  const r = linkFixture('<a href="/grammar/A1.1">old case</a>');
  assert.deepEqual(r.fail, ['internal link /grammar/A1.1 301-hops to /grammar/a1.1/ (netlify.toml /grammar/A1.1); linked from /']);
});

test('a link to a route nothing serves fails: the 404 catch-all, or no rule at all (three-place route rule)', () => {
  const r = linkFixture('<a href="/dashboard">SPA route missing from netlify.toml</a><a href="/leitfaden/none/">gone</a>');
  assert.equal(r.fail.length, 2);
  assert.match(r.fail[0], /^internal link \/dashboard is a 404 \(netlify\.toml \/\* -> \/404\.html\)/);
  assert.match(r.fail[1], /^internal link \/leitfaden\/none\/ is a 404/);
  const withoutCatchAll = LINK_TOML.split('[[redirects]]\n  from = "/*"')[0];
  const bare = linkFixture('<a href="/dashboard">x</a>', withoutCatchAll);
  assert.deepEqual(bare.fail, ['internal link /dashboard is served by nothing (no built page, no netlify.toml rule); linked from /']);
});

test('relative links resolve against the page that carries them; commented-out links do not count', () => {
  const ok = linkFixture('<!-- <a href="/nowhere">old</a> -->');
  assert.deepEqual(ok.fail, [], 'grammar/a1.1 links articles/ and articles links ../, both built');
  const r = linkFixture('<a href="grammar/a1.1/missing/">relative from /</a>');
  assert.deepEqual(r.fail, ['internal link /grammar/a1.1/missing/ is a 404 (netlify.toml /* -> /404.html); linked from /']);
});

test('one failure per broken target, naming at most three of the pages that carry it', () => {
  const files = {};
  for (const p of ['a', 'b', 'c', 'd', 'e']) files[`${p}/index.html`] = '<a href="/gone/">x</a><a href="/gone/">again</a>';
  const r = linkSite(files);
  assert.equal(r.fail.length, 1);
  assert.match(r.fail[0], /^internal link \/gone\/ is a 404 .*linked from \/a\/, \/b\/, \/c\/ and 2 more$/);
  assert.equal(r.links, 10);
});

test('redirect matching follows Netlify: trailing slash optional, * the rest, :name one segment', () => {
  assert.equal(redirectMatches('/signup', '/signup'), true);
  assert.equal(redirectMatches('/signup', '/signup/'), true);
  assert.equal(redirectMatches('/signup', '/signup/x'), false);
  assert.equal(redirectMatches('/course/*', '/course/a1.1/l/1'), true);
  assert.equal(redirectMatches('/course/*', '/course'), true);
  assert.equal(redirectMatches('/course/*', '/courses/a1-1/'), false);
  assert.equal(redirectMatches('/vocabulary/:level', '/vocabulary/b1'), true);
  assert.equal(redirectMatches('/vocabulary/:level', '/vocabulary/b1/words'), false);
  assert.equal(redirectMatches('/podcast-feed.xml', '/podcast-feedxxml'), false, 'the dot is literal');
  const rules = redirectRules(LINK_TOML);
  assert.equal(rules.length, 6, 'the host-qualified www rule is not a path rule');
  assert.deepEqual(rules[0], { from: '/grammar/A1.1', to: '/grammar/a1.1/', status: 301 });
  assert.deepEqual(rules.at(-1), { from: '/*', to: '/404.html', status: 404 });
});

test('link extraction reads both quote styles, decodes &amp;, keeps the www host and drops other hosts', () => {
  assert.deepEqual(
    linkPaths(`<a class="x" href='/pricing/'>p</a><A HREF="/signup?a=1&amp;b=2">s</A><a href="//example.com/x">o</a><a href="http://www.deutsch-meister.de/faq/">w</a>`, '/grammar/'),
    ['/pricing/', '/signup', '/faq/'],
  );
  assert.deepEqual(resolveLink('/nonexistent-dist', redirectRules(LINK_TOML), '/course/a1.1'), { ok: true, via: 'rewrite /course/*' });
});

test('the crawl guard runs the link check, so check-built-html fails a release on a hopping link', () => {
  const r = fixture(({ write }) => {
    write('index.html', page(`${SITE}/`).replace('</body>', '<a href="/grammar/a1.1/articles">no slash</a></body>'));
    return TOML_OK;
  });
  assert.equal(r.checked, 3);
  assert.deepEqual(r.fail, ['internal link /grammar/a1.1/articles 301-hops to /grammar/a1.1/articles/ (a built page needs its trailing slash); linked from /']);
});
