// Crawl and index guard for the BUILT site: can Google reach and index every URL
// we advertise?
//
// WHY THIS EXISTS. scripts/check-built-html.mjs checks that each page HAS a
// title, a description and an absolute canonical. It never checked that a page
// stays INDEXABLE. Any one of these would have shipped green until 2026-10-04:
//   - a noindex meta on the 125 sitemap-0.xml pages (only sitemap-spa.xml's 8
//     URLs were checked for noindex);
//   - every canonical pointing at "/" (a canonical only had to exist and start
//     with https://), which hands every deep page's ranking to the homepage;
//   - "Disallow: /" in robots.txt, or a Sitemap: line that names a missing file;
//   - an X-Robots-Tag: noindex header rule in netlify.toml matching real pages
//     (the one that exists, on /app.html, is correct: the shell is a duplicate).
// Each is a deindexing regression that no reviewer sees in a diff and no user
// sees on the page. The question was asked by hand on 2026-10-04 after signups
// went quiet ("did a release add a noindex, change a canonical, break robots.txt
// or the sitemap?"); the answer was no, and this module makes it a CI answer.
//
// The rule it enforces: every URL in every sitemap the robots.txt points at
// (1) is a built page, (2) carries no robots noindex, (3) names itself as its
// canonical, (4) is not disallowed for Googlebot or Bingbot, and (5) is not
// matched by a noindex header rule. tests/crawl-guard.test.mjs pins each case.
//
// Pure functions plus one entry point, checkCrawlability(), which
// check-built-html.mjs calls; nothing here writes to disk.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const SITE = 'https://deutsch-meister.de';

/** The crawlers whose robots.txt group is evaluated for every sitemap URL. */
export const CRAWLERS = ['Googlebot', 'Bingbot'];

const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, ' ');

/** All <loc> values of a sitemap or sitemap index. */
export function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

/**
 * Parse robots.txt into groups (RFC 9309): consecutive user-agent lines open a
 * group, the allow/disallow lines after them belong to it. Sitemap lines are
 * global and collected separately.
 */
export function parseRobots(txt) {
  const groups = [];
  const sitemaps = [];
  let current = null;
  let lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'sitemap') {
      sitemaps.push(value);
      continue;
    }
    if (key === 'user-agent') {
      if (!lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (current && (key === 'allow' || key === 'disallow')) current.rules.push({ allow: key === 'allow', path: value });
  }
  return { groups, sitemaps };
}

function robotsPatternToRegExp(pattern) {
  const anchored = pattern.endsWith('$');
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split('*')
    .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
}

/**
 * RFC 9309 evaluation: the crawler obeys the group naming it (product token,
 * case-insensitive), else the "*" group. Within the group the longest matching
 * rule wins and Allow wins a tie. An empty Disallow matches nothing.
 */
export function isDisallowed(robots, crawler, path) {
  const token = crawler.toLowerCase();
  const group =
    robots.groups.find((g) => g.agents.includes(token)) || robots.groups.find((g) => g.agents.includes('*'));
  if (!group) return false;
  let best = null;
  for (const rule of group.rules) {
    if (!rule.path) continue;
    if (!robotsPatternToRegExp(rule.path).test(path)) continue;
    const len = rule.path.length;
    if (!best || len > best.len || (len === best.len && rule.allow)) best = { len, allow: rule.allow };
  }
  return best ? !best.allow : false;
}

/**
 * Header rules (netlify.toml [[headers]] blocks and a dist/_headers file) that
 * send X-Robots-Tag with noindex or none, as { for, value } pairs.
 */
export function noindexHeaderRules(tomlText = '', headersFile = '') {
  const rules = [];
  for (const block of tomlText.split(/^\s*\[\[headers\]\]\s*$/m).slice(1)) {
    const body = block.split(/^\s*\[\[/m)[0];
    const forMatch = body.match(/^\s*for\s*=\s*"([^"]+)"/m);
    const tag = body.match(/^\s*X-Robots-Tag\s*=\s*"([^"]*)"/im);
    if (forMatch && tag && /noindex|none/i.test(tag[1])) rules.push({ for: forMatch[1], value: tag[1] });
  }
  let path = null;
  for (const raw of headersFile.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    if (!/^\s/.test(raw)) {
      path = raw.trim();
      continue;
    }
    const m = raw.trim().match(/^X-Robots-Tag\s*:\s*(.*)$/i);
    if (path && m && /noindex|none/i.test(m[1])) rules.push({ for: path, value: m[1].trim() });
  }
  return rules;
}

/** Netlify path matching for header rules: "*" is a splat, ":name" one segment. */
export function headerPathMatches(pattern, path) {
  const body = pattern
    .split('*')
    .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/:[A-Za-z_]\w*/g, '[^/]+'))
    .join('.*');
  return new RegExp(`^${body}$`).test(path);
}

/** The canonical hrefs and robots directives in a page's <head>. */
export function headSignals(html) {
  const head = stripComments(html).split(/<\/head>/i)[0];
  const tags = [...head.matchAll(/<(meta|link)\b[^>]*>/gi)].map((m) => m[0]);
  const attr = (tag, name) => {
    const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
    return m ? (m[2] ?? m[3]) : null;
  };
  const canonicals = tags
    .filter((t) => /^<link/i.test(t) && (attr(t, 'rel') || '').toLowerCase() === 'canonical')
    .map((t) => attr(t, 'href') || '');
  const robots = tags
    .filter((t) => /^<meta/i.test(t) && /^(robots|googlebot|bingbot)$/i.test(attr(t, 'name') || ''))
    .map((t) => attr(t, 'content') || '');
  return { canonicals, robots };
}

/** dist file for a same-site URL ("/a/" -> a/index.html, "/" -> index.html). */
export function fileForUrl(dist, url) {
  const path = url.slice(SITE.length) || '/';
  if (path.endsWith('/')) return join(dist, path, 'index.html');
  return join(dist, path);
}

/**
 * Check a built dist. Returns { fail: string[], checked: number }, where
 * `checked` is the number of sitemap URLs evaluated.
 */
export function checkCrawlability(dist, { tomlText = '' } = {}) {
  const fail = [];
  const note = (where, msg) => fail.push(`${where}: ${msg}`);

  const robotsFile = join(dist, 'robots.txt');
  if (!existsSync(robotsFile)) {
    note('robots.txt', 'missing from the build');
    return { fail, checked: 0 };
  }
  const robots = parseRobots(readFileSync(robotsFile, 'utf8'));
  if (robots.sitemaps.length === 0) note('robots.txt', 'names no Sitemap:');

  const headersFile = existsSync(join(dist, '_headers')) ? readFileSync(join(dist, '_headers'), 'utf8') : '';
  const headerRules = noindexHeaderRules(tomlText, headersFile);

  // Expand sitemap indexes into their child sitemaps; every file must be built.
  const urlsets = [];
  const queue = robots.sitemaps.map((s) => ({ loc: s, from: 'robots.txt' }));
  const seen = new Set();
  while (queue.length) {
    const { loc, from } = queue.shift();
    if (seen.has(loc)) continue;
    seen.add(loc);
    if (!loc.startsWith(`${SITE}/`)) {
      note(from, `sitemap ${loc} is not on ${SITE}`);
      continue;
    }
    const file = fileForUrl(dist, loc);
    if (!existsSync(file)) {
      note(from, `sitemap ${loc} is not in the build`);
      continue;
    }
    const xml = readFileSync(file, 'utf8');
    const name = loc.slice(SITE.length + 1);
    if (/<sitemapindex[\s>]/i.test(xml)) {
      for (const child of sitemapLocs(xml)) queue.push({ loc: child, from: name });
    } else {
      urlsets.push({ name, locs: sitemapLocs(xml) });
    }
  }

  let checked = 0;
  for (const { name, locs } of urlsets) {
    for (const loc of locs) {
      checked += 1;
      if (!loc.startsWith(SITE)) {
        note(name, `${loc} is not on ${SITE}`);
        continue;
      }
      const path = loc.slice(SITE.length) || '/';
      for (const crawler of CRAWLERS) {
        if (isDisallowed(robots, crawler, path)) note(name, `${loc} is disallowed for ${crawler} by robots.txt`);
      }
      for (const rule of headerRules) {
        if (headerPathMatches(rule.for, path)) note(name, `${loc} gets X-Robots-Tag "${rule.value}" from the header rule for ${rule.for}`);
      }
      const file = fileForUrl(dist, loc);
      if (!existsSync(file)) {
        note(name, `${loc} has no built page`);
        continue;
      }
      const { canonicals, robots: directives } = headSignals(readFileSync(file, 'utf8'));
      const blocking = directives.find((d) => /noindex|none/i.test(d));
      if (blocking) note(name, `${loc} is listed but its robots meta says "${blocking}"`);
      if (canonicals.length !== 1) note(name, `${loc} has ${canonicals.length} canonical links, expected 1`);
      else if (canonicals[0] !== loc) note(name, `${loc} names ${canonicals[0]} as its canonical, expected itself`);
    }
  }
  if (urlsets.length && checked === 0) note('sitemaps', 'list no URLs');
  return { fail, checked };
}
