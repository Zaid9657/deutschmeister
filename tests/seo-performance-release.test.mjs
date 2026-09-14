import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the shared build merge discovers every Astro directory', async () => {
  const [merge, netlify, ci] = await Promise.all([
    read('scripts/merge-site-builds.mjs'),
    read('netlify.toml'),
    read('.github/workflows/ci.yml'),
  ]);

  assert.match(merge, /readdirSync\(astroDist/);
  assert.match(merge, /entry\.isDirectory\(\)/);
  assert.match(netlify, /node scripts\/merge-site-builds\.mjs/);
  assert.match(ci, /node scripts\/merge-site-builds\.mjs/);
  assert.doesNotMatch(netlify, /cp -r astro-site\/dist\/grammar/);
});

test('Netlify builds Astro deterministically from the committed grammar cache', async () => {
  const [netlify, grammar, supabase] = await Promise.all([
    read('netlify.toml'),
    read('astro-site/src/lib/grammar.js'),
    read('astro-site/src/lib/supabase.js'),
  ]);

  assert.match(netlify, /cd astro-site && npm ci && npm run build/);
  assert.match(netlify, /\[build\.environment\][\s\S]*GRAMMAR_CONTENT_CACHE = "\.\.\/grammar-content-cache\.json"/);
  assert.match(grammar, /const FETCH_TIMEOUT_MS = 12_000/);
  assert.match(grammar, /AbortSignal\.timeout\(FETCH_TIMEOUT_MS\)/);
  assert.ok((grammar.match(/withRequestTimeout\(/g) ?? []).length >= 8);
  assert.match(supabase, /!supabaseKey && !process\.env\.GRAMMAR_CONTENT_CACHE/);
});

test('batch Lighthouse uses current headless Chrome without disabling sandboxing', async () => {
  const batch = await read('scripts/lighthouse-batch.mjs');
  assert.match(batch, /--headless=new/);
  assert.doesNotMatch(batch, /['"]--no-sandbox['"]/);
});

test('long grammar source titles receive a compact SEO-only fallback', async () => {
  const topicPage = await read('astro-site/src/pages/grammar/[level]/[slug].astro');

  assert.match(topicPage, /brandedTitle\.length <= 60/);
  assert.match(topicPage, /titleCore\.length <= 60/);
  assert.match(topicPage, /compactTitleCore/);
  assert.match(topicPage, /replace\(\/\\s\*\\\(\[\^\)\]\*\\\)\/g/);
});

test('the homepage defers below-fold rendering without blur filters', async () => {
  const [home, motion, showtime] = await Promise.all([
    read('astro-site/src/pages/index.astro'),
    read('astro-site/src/styles/showtime.css'),
    read('astro-site/src/components/Showtime.astro'),
  ]);

  assert.ok((home.match(/class="dm-defer/g) ?? []).length >= 5);
  assert.match(motion, /content-visibility:\s*auto/);
  assert.match(motion, /contain-intrinsic-size:\s*auto 720px/);
  assert.doesNotMatch(motion, /filter:\s*blur\((4|5)px\)/);
  assert.doesNotMatch(home, /class="hero-line/);
  assert.match(showtime, /\(hover: hover\) and \(pointer: fine\)/);
});

test('long grammar lessons defer their below-fold sections', async () => {
  const topicPage = await read('astro-site/src/pages/grammar/[level]/[slug].astro');
  assert.ok((topicPage.match(/class="dm-defer/g) ?? []).length >= 7);
  assert.match(topicPage, /id="rules" class="dm-defer/);
  assert.match(topicPage, /id="examples" class="dm-defer/);
  assert.match(topicPage, /id="practice" class="dm-defer/);
  assert.doesNotMatch(topicPage, /class="hero-line/);
  assert.ok((topicPage.match(/dm-defer-card/g) ?? []).length >= 3);
});
