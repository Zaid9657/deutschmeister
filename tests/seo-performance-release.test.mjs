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

test('the homepage keeps its sales content readable at rest and lazy-loads below-fold art', async () => {
  const home = await read('astro-site/src/pages/index.astro');
  const scene = await read('astro-site/src/components/concept/Scene.astro');
  const css = await read('astro-site/src/styles/concept4.css');
  assert.match(home, /data-c4-reveal/);
  assert.match(scene, /loading=\{hero \? 'eager' : 'lazy'\}/);
  assert.doesNotMatch(css, /\[data-c4-reveal\][^{]*\{[^}]*opacity:\s*0/);
  assert.doesNotMatch(css, /filter:\s*blur/);
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
