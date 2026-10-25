import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { FREE_LEVEL_LABEL, LEVEL_COUNT, LEVELS, PODCAST_EPISODE_COUNT, TRIAL_DAYS } from '../src/data/marketing.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(ROOT, path), 'utf8');

function prerenderPodcast() {
  const dir = mkdtempSync(join(ROOT, '.podcast-seo-test-'));
  try {
    writeFileSync(join(dir, 'app.html'), read('index.html'));
    execFileSync(process.execPath, [join(ROOT, 'scripts/prerender-spa-routes.mjs'), dir], { stdio: 'ignore' });
    return readFileSync(join(dir, 'podcasts/index.html'), 'utf8');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const html = prerenderPodcast();
const prerenderSchemas = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const reactSource = read('src/pages/PodcastsPage.jsx');
const reactData = reactSource.match(/structuredData=\{([\s\S]*?)\}\s*\/>/);
assert.ok(reactData, 'expected the podcast page to pass structuredData to SEO');
const reactSchemas = runInNewContext(`(${reactData[1]})`, {
  FREE_LEVEL_LABEL, LEVEL_COUNT, LEVEL_ORDER: LEVELS.map((level) => level.code), PODCAST_EPISODE_COUNT, TRIAL_DAYS,
});

function checkAccessClaim(text) {
  assert.ok(text.includes(FREE_LEVEL_LABEL), 'identify the permanently free level');
  assert.match(text, /free.*without (?:an )?(?:account|signup)/i);
  assert.ok(text.includes(`${TRIAL_DAYS}-day trial`), 'derive the trial period from marketing.js');
  assert.match(text, /Pro/);
  assert.match(text, /course covering (?:that|the) level/);
  assert.doesNotMatch(text, /all podcasts are free|other levels require a free account/i);
}

test('podcast FAQ and metadata explain free and entitled access on both render paths', () => {
  for (const schemas of [prerenderSchemas, reactSchemas]) {
    const faq = schemas.find((schema) => schema['@type'] === 'FAQPage');
    const answer = faq.mainEntity.find((entry) => entry.name === 'Are the German podcasts free?').acceptedAnswer.text;
    checkAccessClaim(answer);
    const series = schemas.find((schema) => schema['@type'] === 'PodcastSeries');
    assert.equal(series.isAccessibleForFree, false, 'the whole catalogue is not free');
    assert.equal(series.numberOfEpisodes, PODCAST_EPISODE_COUNT);
    assert.ok(series.description.includes(`${FREE_LEVEL_LABEL} is free`));
    assert.match(series.description, /higher levels require trial, Pro or a course covering the level/);
  }
  const accessAnswer = prerenderSchemas.find((schema) => schema['@type'] === 'FAQPage')
    .mainEntity.find((entry) => entry.name === 'Are the German podcasts free?').acceptedAnswer.text;
  assert.ok(html.includes(accessAnswer), 'the prerendered visible FAQ must match its schema');
});

test('React and prerendered PodcastSeries identify the RSS feed', () => {
  for (const schemas of [reactSchemas, prerenderSchemas]) {
    const series = schemas.find((schema) => schema['@type'] === 'PodcastSeries');
    assert.equal(series.webFeed, 'https://deutsch-meister.de/podcast-feed.xml');
  }
});

// ── The RSS feed itself (netlify/functions/podcast-feed.js) ─────────────────
// Until 2026-10-25 its itunes:image and image/url pointed at /podcast-cover.svg,
// a file that never existed (the /* catch-all served the 404 page), so podcast
// directories rejected the feed: they need a square JPG/PNG of 1400–3000 px.
// The channel also claimed "24 episodes … A1 to B2" while listing the
// published episodes only, and linked the slash-less /podcasts (a 301 hop).

/** Run the CommonJS feed handler with a stub Supabase client (no network). */
async function renderFeed(rows) {
  const src = read('netlify/functions/podcast-feed.js');
  const query = { select: () => query, eq: () => query, order: () => query, then: (resolve) => resolve({ data: rows, error: null }) };
  const fakeRequire = (id) => {
    if (id === '@supabase/supabase-js') return { createClient: () => ({ from: () => query }) };
    throw new Error(`unexpected require: ${id}`);
  };
  const module = { exports: {} };
  const wrapped = runInNewContext(`(function (exports, require, module, process) {\n${src}\n})`, { Date, String, Math, console });
  wrapped(module.exports, fakeRequire, module, { env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon' } });
  return module.exports.handler({});
}

/** Width, height and colour type from a PNG's IHDR chunk. */
function pngHeader(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('latin1'), 'PNG', 'not a PNG file');
  assert.equal(buffer.subarray(12, 16).toString('latin1'), 'IHDR');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), colorType: buffer[25] };
}

test('the feed names a cover image that exists and that podcast directories accept', async () => {
  const res = await renderFeed([
    { id: 'e1', title_en: 'At the bakery', sub_level: 'A1.1', audio_url: 'podcasts/a1-1/e1.m4a', duration_seconds: 312, created_at: '2026-09-01T00:00:00Z' },
  ]);
  assert.equal(res.statusCode, 200);
  const covers = [
    res.body.match(/<itunes:image href="([^"]+)"\s*\/>/)?.[1],
    res.body.match(/<image>\s*<url>([^<]+)<\/url>/)?.[1],
  ];
  for (const url of covers) assert.equal(url, 'https://deutsch-meister.de/podcast-cover.png', 'itunes:image and image/url name the PNG cover');
  assert.doesNotMatch(res.body, /podcast-cover\.svg/);

  const { width, height, colorType } = pngHeader(readFileSync(join(ROOT, 'public/podcast-cover.png')));
  assert.equal(width, height, 'the cover must be square');
  assert.ok(width >= 1400 && width <= 3000, `the cover must be 1400–3000 px, is ${width}`);
  assert.ok([2, 6].includes(colorType), `the cover must be RGB truecolor (PNG colour type 2 or 6), is ${colorType}`);
});

test('the feed links the canonical /podcasts/ and states no episode count of its own', async () => {
  const res = await renderFeed([
    { id: 'e1', title_en: 'At the bakery', sub_level: 'A1.1', audio_url: 'podcasts/a1-1/e1.m4a', created_at: '2026-09-01T00:00:00Z' },
  ]);
  const links = [...res.body.matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1]);
  assert.ok(links.length >= 3, 'channel, image and item links');
  for (const link of links) assert.equal(link, 'https://deutsch-meister.de/podcasts/', 'the slash-less /podcasts 301s');
  const channel = res.body.slice(0, res.body.indexOf('<item>'));
  assert.doesNotMatch(channel, /\b\d+\s+episodes\b/i, 'the channel retypes an episode count (24 claimed, 14 published: an owner decision)');
  assert.doesNotMatch(channel, /\bA1 to B2\b/, 'the channel states a level range the published episodes do not cover');
});

test('every public PNG ships with its committed WebP twin, the cover included', () => {
  // npm run build (scripts/optimize-images.cjs) writes a .webp beside each
  // public image. The logo, icons and og-image have theirs committed; the
  // podcast cover's was left untracked by every build until 2026-10-25.
  const pngs = readdirSync(join(ROOT, 'public')).filter((f) => f.endsWith('.png'));
  assert.ok(pngs.includes('podcast-cover.png'), 'the cover is a public PNG');
  for (const png of pngs) {
    assert.ok(existsSync(join(ROOT, 'public', png.replace(/\.png$/, '.webp'))), `public/${png} has no WebP twin (node scripts/optimize-images.cjs)`);
  }
});
