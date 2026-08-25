#!/usr/bin/env node
// Verify the BUILT HTML in dist/ — not the source that produced it.
//
// WHY THIS READS dist/ AND NOT src/. Every head, heading and body defect this
// repo has shipped was invisible in review and obvious in the output: the
// prerendered SPA routes get their <title>, canonical and visible copy injected
// by scripts/prerender-spa-routes.mjs at build time, so a source review tells
// you what the injector INTENDS, never what a crawler receives. If the shell's
// markup shifts, a mustReplace() in that script throws — but a page that is
// merely thin, duplicated, or missing its canonical fails silently and ranks
// like a broken page for months. So: build, then read the artifact.
//
// MODES
//   default    every page in the manifest must exist (Netlify build, local full build)
//   --spa-only only the SPA-produced pages are required; Astro pages are skipped
//              with a notice. CI runs this mode, because the Astro half needs
//              Supabase credentials and network egress at build time (see
//              .github/workflows/ci.yml). It is a reduced check, not a passing
//              grade for the whole site — the notice says so on every run.
//
// Usage: node scripts/check-built-html.mjs [dist] [--spa-only]

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const SPA_ONLY = args.includes('--spa-only');
const DIST = args.find((a) => !a.startsWith('--')) || 'dist';

const TITLE_SOFT_MAX = 60; // Google truncates around here.
const TITLE_HARD_MAX = 70; // Above this it is certainly cut.
const MIN_BODY_CHARS = 250; // Below this a page has no reason to be indexed.

/**
 * Pages the build is expected to produce, and how they are produced.
 *
 * `spa` pages come from scripts/prerender-spa-routes.mjs and need no external
 * data. `astro` pages come from the Astro build, which fetches grammar content
 * from Supabase. Adding a route to the site means adding it here too — a
 * missing entry is how a page ships unverified, and a missing FILE is how a
 * broken build step ships silently, which is the failure this list catches.
 */
// The six prerendered SPA routes. Everything else built by Astro is discovered.
const SPA_ROUTES = ['speaking', 'level-test', 'analyze', 'podcasts', 'listening', 'reading', 'faq', 'ueber-uns'];

/**
 * Every built page, discovered rather than hand-listed.
 *
 * This used to be a 16-entry hand-list, which left the 64 grammar topic pages,
 * the 8 level hubs and the 3 comparison pages — 75 of the 90 indexable URLs, and
 * the entire SEO core — unchecked. A hand-list also fails open: forget to add a
 * route and it ships unverified, silently, which is the opposite of what this
 * file is for.
 *
 * Discovery inverts that. A new page is checked the moment it is built, and the
 * uniqueness checks below now see the whole site, so two grammar topics can no
 * longer ship the same <title>.
 */
// Discovery alone would fail OPEN: a broken Astro build produces no pages, and a
// check that only looks at what exists would pass. These must be present in full
// mode, so a missing build step still fails loudly — the property the old
// hand-list had and the reason it is kept alongside discovery.
const REQUIRED = [
  'app.html',
  'index.html',
  'pricing/index.html',
  'grammar/index.html',
  'vergleich/index.html',
  'leitfaden/index.html',
  'leitfaden/telc-b1/index.html',
  'leitfaden/goethe-b1/index.html',
  'leitfaden/telc-b2/index.html',
  'leitfaden/dtz/index.html',
  ...SPA_ROUTES.map((r) => `${r}/index.html`),
];

function buildManifest() {
  const entries = [];
  if (existsSync(join(DIST, 'app.html'))) {
    entries.push({ path: 'app.html', kind: 'spa', shell: true });
  }
  const walk = (dir) => {
    for (const item of readdirSync(join(DIST, dir), { withFileTypes: true })) {
      const rel = dir ? `${dir}/${item.name}` : item.name;
      if (item.isDirectory()) {
        // _astro/ and assets/ hold build output, not pages
        if (rel === '_astro' || rel === 'assets') continue;
        walk(rel);
      } else if (item.name === 'index.html') {
        const route = dir.split('/')[0];
        entries.push({ path: rel, kind: SPA_ROUTES.includes(route) ? 'spa' : 'astro' });
      }
    }
  };
  walk('');
  return entries;
}

const MANIFEST = buildManifest();

/**
 * Strings that must appear on NO page, including noindexed ones.
 *
 * These are claims that were true once, or never, and must not come back. A
 * literal can reach the HTML from a data file or a hand-maintained .txt without
 * appearing in any component, which is why this check lives against the output
 * and duplicates the source-level ban in tests/claims.test.mjs rather than
 * replacing it.
 */
const BANNED_LITERALS = [
  // Pro speaking is 30/month and X-Ray 50/day — metered, not unlimited. A
  // blanket "unlimited" beside a price shipped on the Lingoda comparison and in
  // the SPA landing comparison table until 2026-08-22.
  'unbegrenzter Zugang zu allem',
  '9,99 €/Monat (Pro) — unbegrenzt',
  // Understated the speaking allowance six-fold on the checkout config.
  '5 speaking sessions per month',
  // Every podcast transcript in the database is empty; an indexed FAQPage rich
  // result claimed otherwise until the 2026-08-16 audit.
  'full transcript',
  // The same claim in its other shapes — 'full transcript' alone missed all three
  // occurrences that shipped on /podcasts/.
  'with transcript',
  'audio with transcripts',
];

const fail = [];
const warn = [];
const note = (list, page, msg) => list.push(`${page}: ${msg}`);

/**
 * Remove HTML comments before any structural check.
 *
 * index.html carries a comment that explains the lang handling and quotes
 * `<html lang="en">` inside it — which made the duplicate-lang check fire on
 * every page on its first run. Same lesson as rendered() in
 * tests/claims.test.mjs: a file that documents the rule contains the string the
 * rule bans, so strip the prose before matching.
 */
const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, ' ');

/**
 * Remove the crawler <noscript> block. It legitimately contains its own
 * headings and link map, which are for no-JS crawlers and must not count
 * towards the page's own heading structure or body length.
 */
const stripNoscript = (html) => html.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

const stripTags = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ') // crawler block, not page content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const titles = new Map();
const descriptions = new Map();
let checked = 0;
let skipped = 0;

const found = new Set(MANIFEST.map((e) => e.path));
for (const path of REQUIRED) {
  if (found.has(path)) continue;
  // In --spa-only the Astro half is genuinely absent; everything else is a real gap.
  const isAstro = !path.endsWith('app.html') && !SPA_ROUTES.some((r) => path.startsWith(`${r}/`));
  if (SPA_ONLY && isAstro) continue;
  note(fail, path, 'required page is missing from the build');
}

for (const entry of MANIFEST) {
  const file = join(DIST, entry.path);
  const page = entry.path;

  if (!existsSync(file)) {
    if (SPA_ONLY && entry.kind === 'astro') {
      skipped += 1;
      continue;
    }
    note(fail, page, 'expected page is missing from the build');
    continue;
  }

  const html = readFileSync(file, 'utf8');
  checked += 1;
  // Structural checks run on the page proper: no comments, no crawler block.
  const structural = stripNoscript(stripComments(html));

  // --- <html lang> : exactly one, non-empty ---------------------------------
  const langs = [...structural.matchAll(/<html[^>]*\slang="([^"]*)"/gi)].map((m) => m[1]);
  if (langs.length !== 1) note(fail, page, `expected exactly one <html lang>, found ${langs.length}`);
  else if (!langs[0].trim()) note(fail, page, 'empty <html lang>');

  // --- <title> --------------------------------------------------------------
  const titleMatch = structural.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decode(titleMatch[1]).trim() : '';
  if (!title) {
    note(fail, page, 'empty or missing <title>');
  } else {
    if (title.length > TITLE_HARD_MAX) note(fail, page, `<title> is ${title.length} chars (hard max ${TITLE_HARD_MAX})`);
    else if (title.length > TITLE_SOFT_MAX) note(warn, page, `<title> is ${title.length} chars (soft max ${TITLE_SOFT_MAX})`);
    if (titles.has(title)) note(fail, page, `duplicate <title>, same as ${titles.get(title)}`);
    else titles.set(title, page);
  }

  // --- meta description -----------------------------------------------------
  const descMatch = structural.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i);
  const desc = descMatch ? decode(descMatch[1]).trim() : '';
  if (!desc) {
    note(fail, page, 'empty or missing meta description');
  } else if (descriptions.has(desc)) {
    note(fail, page, `duplicate meta description, same as ${descriptions.get(desc)}`);
  } else {
    descriptions.set(desc, page);
  }

  // --- canonical ------------------------------------------------------------
  // The app shell is never served at a URL of its own (netlify.toml rewrites
  // routes onto it), so it is the one page with nothing to be canonical to.
  if (!entry.shell) {
    const canonical = structural.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i);
    if (!canonical || !canonical[1].trim()) note(fail, page, 'missing canonical link');
    else if (!canonical[1].startsWith('https://')) note(fail, page, `canonical is not absolute: ${canonical[1]}`);
  }

  // --- one visible <h1> -----------------------------------------------------
  // The shell legitimately has none: React renders its heading at runtime.
  if (!entry.shell) {
    const h1s = [...structural.matchAll(/<h1[\s>]/gi)];
    if (h1s.length === 0) note(fail, page, 'no <h1>');
    else if (h1s.length > 1) note(fail, page, `${h1s.length} <h1> elements, expected 1`);
  }

  // --- body substance -------------------------------------------------------
  // Measured with <noscript> excluded: the crawler block in the shell would
  // otherwise make an empty page look full.
  if (!entry.shell) {
    const bodyMatch = structural.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const text = stripTags(bodyMatch ? bodyMatch[1] : html);
    if (text.length < MIN_BODY_CHARS) note(fail, page, `body has ${text.length} chars of text (min ${MIN_BODY_CHARS})`);
  }

  // --- banned literals ------------------------------------------------------
  for (const literal of BANNED_LITERALS) {
    // Case-insensitive: the page said "Full transcripts" while the ban listed
    // 'full transcript', so the claim walked straight back in under a comment
    // forbidding it. A claim is a claim whatever its capitalisation.
    if (html.toLowerCase().includes(literal.toLowerCase())) note(fail, page, `contains banned literal "${literal}"`);
  }
}

// --- sitemap integrity ------------------------------------------------------
// Every URL we advertise must be a real, indexable file. A sitemap entry for a
// noindexed or missing URL contradicts itself and spends crawl budget.
const SITEMAP = join(DIST, 'sitemap-spa.xml');
const sitemapSource = existsSync(SITEMAP) ? SITEMAP : join('public', 'sitemap-spa.xml');
if (existsSync(sitemapSource)) {
  const xml = readFileSync(sitemapSource, 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const loc of locs) {
    const route = loc.replace(/^https?:\/\/[^/]+/, '').replace(/^\/|\/$/g, '');
    const file = join(DIST, route, 'index.html');
    if (!existsSync(file)) {
      if (SPA_ONLY) continue; // may be an Astro page, not built in this mode
      note(fail, 'sitemap-spa.xml', `${loc} has no built page at ${route}/index.html`);
      continue;
    }
    const html = readFileSync(file, 'utf8');
    if (/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(html)) {
      note(fail, 'sitemap-spa.xml', `${loc} is noindex but listed in the sitemap`);
    }
  }
} else {
  note(warn, 'sitemap-spa.xml', 'not found — sitemap integrity not checked');
}

// --- report -----------------------------------------------------------------
if (checked === 0) {
  console.error('check-built-html: no pages were checked — is the build output missing?');
  process.exit(1);
}

for (const w of warn) console.warn(`WARN  ${w}`);
for (const f of fail) console.error(`FAIL  ${f}`);

if (SPA_ONLY) {
  console.log(
    `\nNOTE: --spa-only. ${skipped} Astro page(s) were skipped because this mode does not build them.\n` +
      '      The static/SEO half of the site is NOT verified by this run. Netlify\'s deploy build\n' +
      '      produces them; add PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY to the repo secrets\n' +
      '      to build and check them in CI too.',
  );
}

console.log(`\nchecked ${checked} page(s) — ${fail.length} failure(s), ${warn.length} warning(s)`);
process.exit(fail.length ? 1 : 0);
