// Guard suite for Sentence X-Ray acquisition (docs/SCORECARD.md work order #3).
//
// Measured 2026-09-27: anonymous analyses went from 5–13/day to 150–350/day on
// 2026-09-14 with one anonymous id per analysis. Not an id-reset bug — 98% of
// them were our own grammar examples, rendered by a crawler through the
// /analyze/?s=… links added that day. This suite pins what came out of that:
//
//   1. the anonymous id persists (one per browser, not per call), and a
//      storage-blocked browser still gets an id the function accepts;
//   2. crawlers never auto-run an analysis and are refused server-side, with
//      ONE crawler pattern on both sides;
//   3. the coarse source is PII-free, survives the server's sanitiser, and is
//      logged/stored by the function;
//   4. a signed-out visitor sees one conversion offer under the result and at
//      the daily limit, whose links attribute to ?ref=xray.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

import {
  ANON_ID_KEY, getOrCreateAnonId, CRAWLER_UA as CLIENT_CRAWLER_UA, isLikelyCrawler,
  referrerLabel, xraySource, XRAY_OFFER,
} from '../src/lib/xray.js';
import {
  CRAWLER_UA as SERVER_CRAWLER_UA, isCrawlerUA, uaClass, cleanSource,
} from '../netlify/functions/_shared/xraySource.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const page = read('src/pages/SentenceXRay.jsx');

const memoryStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m };
};

const UA = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  safari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  cubot: 'Mozilla/5.0 (Linux; Android 11; CUBOT X50) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  googlebotRender: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bingbot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36',
  ahrefsAudit: 'Mozilla/5.0 (compatible; AhrefsSiteAudit/6.1; +http://ahrefs.com/robot/site-audit)',
  headless: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/128.0.0.0 Safari/537.36',
  lighthouse: 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
  inspection: 'Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)',
};

// ---------------------------------------------------------------------------
// 1. Anonymous id
// ---------------------------------------------------------------------------

test('the anonymous id is created once and read back on every later call and visit', () => {
  const storage = memoryStorage();
  const first = getOrCreateAnonId(storage);
  assert.ok(first.length >= 8, 'the function rejects ids shorter than 8 characters');
  assert.equal(storage.map.get(ANON_ID_KEY), first, 'stored under dm_xray_anon_id');
  for (let i = 0; i < 5; i++) assert.equal(getOrCreateAnonId(storage), first, 'a second call minted a new id');
  // An id already in storage (yesterday's visit) is reused, not replaced.
  const returning = memoryStorage();
  returning.setItem(ANON_ID_KEY, 'existing-anon-id-123');
  assert.equal(getOrCreateAnonId(returning), 'existing-anon-id-123');
});

test('blocked storage still yields one stable, server-acceptable id per tab (never "unknown")', () => {
  const blocked = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('SecurityError'); } };
  const a = getOrCreateAnonId(blocked);
  const b = getOrCreateAnonId(null);
  assert.notEqual(a, 'unknown');
  assert.ok(a.length >= 8, `"${a}" would fail the function's identity gate (length >= 8)`);
  assert.equal(a, b, 'the in-memory fallback must be stable within the tab');
});

test('the page takes its id from the shared helper, once per mount', () => {
  assert.match(page, /import \{[^}]*getOrCreateAnonId[^}]*\} from '\.\.\/lib\/xray\.js'/);
  assert.match(page, /const \[anonId\] = useState\(\(\) => getOrCreateAnonId\(\)\)/);
  assert.ok(!/localStorage\.(get|set)Item\(/.test(page), 'the page re-implements anon-id storage');
  assert.ok(!/'unknown'/.test(page));
  assert.match(page, /anonymousId: user\?\.id \? null : anonId/);
});

// ---------------------------------------------------------------------------
// 2. Crawlers
// ---------------------------------------------------------------------------

test('one crawler pattern on both sides of the wire', () => {
  assert.equal(CLIENT_CRAWLER_UA.source, SERVER_CRAWLER_UA.source);
  assert.equal(CLIENT_CRAWLER_UA.flags, SERVER_CRAWLER_UA.flags);
  // Lookbehind would be a SyntaxError in older Safari and take the chunk down.
  assert.ok(!/\(\?<[=!]/.test(CLIENT_CRAWLER_UA.source));
});

test('crawlers and headless renderers are recognised; real browsers are not', () => {
  for (const k of ['googlebotRender', 'bingbot', 'ahrefsAudit', 'headless', 'lighthouse', 'inspection']) {
    assert.equal(isCrawlerUA(UA[k]), true, k);
    assert.equal(uaClass(UA[k]), 'crawler', k);
    assert.equal(isLikelyCrawler({ userAgent: UA[k] }), true, k);
  }
  for (const k of ['chrome', 'safari', 'cubot']) {
    assert.equal(isCrawlerUA(UA[k]), false, k);
    assert.equal(uaClass(UA[k]), 'browser', k);
    assert.equal(isLikelyCrawler({ userAgent: UA[k] }), false, k);
  }
  assert.equal(isLikelyCrawler({ userAgent: UA.chrome, webdriver: true }), true, 'automation-driven browser');
  assert.equal(isLikelyCrawler(undefined), false);
  assert.equal(uaClass('curl/8.5.0'), 'script');
  assert.equal(uaClass('python-requests/2.32'), 'script');
  assert.equal(uaClass(''), 'none');
  assert.equal(uaClass(undefined), 'none');
});

test('the ?s= auto-analysis never runs for a crawler, and is labelled as link traffic', () => {
  assert.match(page, /if \(prefill\?\.trim\(\) && !isLikelyCrawler\(\)\) analyze\(prefill\.trim\(\), 'link'\)/);
  assert.match(page, /analyze\(ex, 'example'\)/);
});

test('robots.txt keeps rendering crawlers off the paid endpoint', () => {
  const robots = read('public/robots.txt');
  assert.match(robots, /^Disallow: \/\.netlify\/functions\/analyze-sentence$/m);
});

// ---------------------------------------------------------------------------
// 3. Coarse source
// ---------------------------------------------------------------------------

test('the referrer is reduced to a host or a site section — never a URL or query', () => {
  assert.equal(referrerLabel(''), 'none');
  assert.equal(referrerLabel('not a url'), 'none');
  assert.equal(referrerLabel('https://www.google.com/search?q=dativ+erkl%C3%A4rung'), 'google.com');
  assert.equal(referrerLabel('https://deutsch-meister.de/grammar/a1.1/dative-case/?x=1#ex'), 'site:/grammar');
  assert.equal(referrerLabel('https://www.deutsch-meister.de/'), 'site:/');
  assert.equal(referrerLabel('https://t.me/deutschmeister'), 't.me');
});

test('the client source passes the server sanitiser unchanged; junk does not', () => {
  const src = xraySource({
    referrer: 'https://deutsch-meister.de/grammar/b1.1/relative-clauses/',
    attribution: { first: { source: 'google' }, last: { source: 'Telegram' } },
    entry: 'link',
  });
  assert.deepEqual(src, { ref: 'site:/grammar', first: 'google', last: 'telegram', entry: 'link' });
  assert.deepEqual(cleanSource(src), src);
  assert.deepEqual(xraySource(), { ref: 'none', first: null, last: null, entry: 'typed' });
  assert.equal(xraySource({ entry: 'bogus' }).entry, 'typed');

  assert.equal(cleanSource(null), null);
  assert.equal(cleanSource('ref=google'), null);
  assert.equal(cleanSource([]), null);
  const hostile = cleanSource({ ref: 'https://evil.example/?email=a@b.c', first: 'x'.repeat(61), last: '<script>', entry: 'admin' });
  assert.equal(hostile, null, 'nothing usable must come back as null, not as an empty-ish object');
});

test('the page sends the coarse source with every request', () => {
  assert.match(page, /source:\s+xraySource\(\{ referrer: document\.referrer, attribution: getAttribution\(\), entry \}\)/);
});

// ---------------------------------------------------------------------------
// 3b. The function: crawler refusal, source logging (behavioural)
// ---------------------------------------------------------------------------

// The handler reads its env at import. Scrub the live-service keys first so a
// shell with secrets loaded can never reach Supabase from this test (node
// --test runs each file in its own process, so nothing else sees this).
for (const k of ['SUPABASE_SERVICE_ROLE_KEY', 'IP_HASH_SALT', 'UNSUB_SECRET', 'CAMPAIGN_SECRET']) delete process.env[k];

async function callFunction({ ua, body }) {
  const saved = { key: process.env.ANTHROPIC_API_KEY, fetch: globalThis.fetch, log: console.log };
  process.env.ANTHROPIC_API_KEY = 'test-key';
  const fetchCalls = [];
  const logs = [];
  globalThis.fetch = async (url, init) => {
    fetchCalls.push({ url, init });
    return new Response(JSON.stringify({ content: [{ type: 'text', text: '{"words":[],"insight":null,"fullTranslation":"x"}' }] }), { status: 200 });
  };
  console.log = (...args) => logs.push(args.join(' '));
  try {
    const { handler } = await import('../netlify/functions/analyze-sentence.mjs');
    const res = await handler({
      httpMethod: 'POST',
      headers: { origin: 'https://deutsch-meister.de', 'user-agent': ua },
      body: JSON.stringify(body),
    });
    return { res, fetchCalls, logs };
  } finally {
    globalThis.fetch = saved.fetch;
    console.log = saved.log;
    if (saved.key === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = saved.key;
  }
}

test('an anonymous crawler is refused before any model call', async () => {
  const { res, fetchCalls, logs } = await callFunction({
    ua: UA.googlebotRender,
    body: { sentence: 'Ich helfe dem Kollegen.', anonymousId: 'a-fresh-uuid-per-render', source: { ref: 'none', entry: 'link' } },
  });
  assert.equal(res.statusCode, 403);
  assert.equal(JSON.parse(res.body).code, 'crawler');
  assert.equal(fetchCalls.length, 0, 'the model was called for a crawler');
  assert.ok(logs.some((l) => l.includes('[xray] crawler refused')));
});

test('a browser analysis still runs and logs its coarse source', async () => {
  const { res, fetchCalls, logs } = await callFunction({
    ua: UA.chrome,
    body: { sentence: 'Ich helfe dem Kollegen.', anonymousId: 'browser-anon-id-1', source: { ref: 'site:/grammar', first: 'google', entry: 'link' } },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(fetchCalls.length, 1);
  const line = logs.find((l) => l.startsWith('[xray] analysis'));
  assert.ok(line, 'no per-analysis source log line');
  const logged = JSON.parse(line.slice('[xray] analysis '.length));
  assert.deepEqual(logged, { tier: 'anonymous', ref: 'site:/grammar', first: 'google', last: null, entry: 'link', ua: 'browser' });
});

test('the usage row carries the source, and the meter survives a database without the column', () => {
  const fn = read('netlify/functions/analyze-sentence.mjs');
  assert.match(fn, /insert\(source \? \{ \.\.\.row, source \} : row\)/);
  assert.match(fn, /if \(error && source\) \(\{ data, error \} = await insert\(row\)\);/);
  const migration = read('migrations/2026-09-27-xray-usage-source.sql');
  assert.match(migration, /ADD COLUMN IF NOT EXISTS source jsonb/);
});

// ---------------------------------------------------------------------------
// 4. The conversion offer
// ---------------------------------------------------------------------------

/** Run public/attribution.js as-is (the one classifier) on a landing. */
function land(href, stored = null) {
  const url = new URL(href, 'https://deutsch-meister.de');
  const store = new Map();
  if (stored) store.set('dm_attribution', JSON.stringify(stored));
  const window = {
    localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) },
    location: { search: url.search, pathname: url.pathname },
  };
  const ctx = { window, document: { referrer: 'https://deutsch-meister.de/analyze/' }, URL, URLSearchParams, Date, JSON };
  vm.createContext(ctx);
  vm.runInContext(read('public/attribution.js'), ctx);
  return JSON.parse(store.get('dm_attribution') || 'null');
}

test('offer links attribute to xray, on-site, without overwriting an earlier first touch', () => {
  assert.equal(new URL(XRAY_OFFER.signupHref, 'https://x.test').pathname, '/signup', 'SPA route: no trailing slash');
  assert.equal(new URL(XRAY_OFFER.courseHref, 'https://x.test').pathname, '/course/a1.1', 'the free course home');
  for (const href of [XRAY_OFFER.signupHref, XRAY_OFFER.courseHref]) {
    const fresh = land(href);
    assert.equal(fresh.first.source, 'xray', href);
    assert.equal(fresh.first.medium, 'onsite', `${href} must not fall back to the "social" default of a bare ?ref=`);
    assert.equal(fresh.first.referrer, null, 'our own host is never a referrer');
    const googler = land(href, { first: { source: 'google', medium: 'organic' }, last: { source: 'google', medium: 'organic' } });
    assert.equal(googler.first.source, 'google', 'first touch is never overwritten');
    assert.equal(googler.last.source, 'xray');
  }
});

test('signed-out visitors get the offer under every result and at the daily limit', () => {
  assert.match(page, /\{!user && \(\s*<div className="mb-6">\s*<XRayOffer \/>\s*<\/div>\s*\)\}/, 'offer missing under the result');
  // It sits inside the result block, after the insight, before "Analyze another".
  const resultBlock = page.slice(page.indexOf('{/* Results */}'));
  assert.ok(resultBlock.indexOf('<XRayOffer />') > resultBlock.indexOf('Key Insight'), 'offer must follow the result');
  assert.ok(resultBlock.indexOf('<XRayOffer />') < resultBlock.indexOf('Analyze another sentence'));
  assert.match(page, /\{user \? \(\s*<LimitReachedBanner limit=\{limitReached\.limit\} \/>\s*\) : \(\s*<XRayOffer atLimit \/>\s*\)\}/, 'offer missing at the anonymous limit');
});

test('the offer is one card built from ui/Button and ui/Card, with attributed page-load links', () => {
  const offer = page.slice(page.indexOf('function XRayOffer'), page.indexOf('// ─── main page'));
  assert.ok(offer.length > 0, 'XRayOffer not found');
  assert.equal((offer.match(/<Card\b/g) || []).length, 1, 'exactly one card');
  assert.match(offer, /<Button href=\{XRAY_OFFER\.signupHref\}>/);
  assert.match(offer, /<Button variant="secondary" href=\{XRAY_OFFER\.courseHref\}>/);
  assert.ok(!/\bto=/.test(offer), 'a router <Link> would drop ?ref=xray (attribution.js runs on page load)');
  assert.ok(!/\b(modal|dialog|popup|fixed inset)\b/i.test(offer), 'no popup');
  assert.match(offer, /Create a free account/);
  assert.match(offer, /Start the free \{FREE_LEVEL_LABEL\} course/);
  // Figures come from marketing.js, never typed.
  assert.match(offer, /\{TRIAL_DAILY_LIMIT\}/);
  assert.match(offer, /\{TRIAL_DAYS\}/);
  assert.ok(!/\b\d+ (Sentence X-Ray )?analyses\b/.test(offer), 'a retyped limit figure');
  assert.match(page, /import Button from '\.\.\/components\/ui\/Button\.jsx'/);
  assert.match(page, /import Card from '\.\.\/components\/ui\/Card\.jsx'/);
});
