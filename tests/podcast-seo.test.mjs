import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
