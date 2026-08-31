// Guard suite for the exam-track layer (renovation Phase 3).
//
// What each pin defends:
//   1. REGISTRY INTEGRITY — every track's slug/level/sublevels/guideSlug must
//      resolve: the /pruefung/ hubs, the dashboard exam goal and the future
//      mock/writing keys all trust this registry blindly.
//   2. TRUTH BANS — the guides' outcome-promise ban applies here, plus an
//      official-material ban: practice content styled after an exam must never
//      claim to BE the exam (telc/Goethe are other people's trademarks).
//   3. DISCLAIMER — anywhere mock-style material is described, the disclaimer
//      module must be what renders (present, and carrying the key phrases).
//   4. THREE-PLACE RULE for the new segment — /pruefung must be copied into
//      dist/ by the netlify build command, whitelisted in the sitemap filter,
//      and required by check-built-html.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { EXAM_TRACKS, examTrackByKey, examTrackBySlug, MOCK_DISCLAIMER_DE } from '../src/data/examTracks.js';
import { levels as ALL_LEVELS } from '../src/data/content.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const netlifyToml = readFileSync(join(root, 'netlify.toml'), 'utf8');
const astroConfig = readFileSync(join(root, 'astro-site/astro.config.mjs'), 'utf8');
const checkBuiltHtml = readFileSync(join(root, 'scripts/check-built-html.mjs'), 'utf8');
const hubsSrc = readFileSync(join(root, 'astro-site/src/data/exams/index.js'), 'utf8');
const hubRenderer = readFileSync(join(root, 'astro-site/src/pages/pruefung/[slug].astro'), 'utf8');

// ── 1. registry integrity ────────────────────────────────────────────────

test('every exam track is well-formed and resolvable', () => {
  assert.ok(EXAM_TRACKS.length >= 4, 'the four launch tracks must exist');
  const keys = new Set();
  const slugs = new Set();
  for (const t of EXAM_TRACKS) {
    assert.match(t.key, /^[a-z0-9_]+$/, `key not machine-safe: ${t.key}`);
    assert.match(t.slug, /^[a-z0-9-]+$/, `slug not URL-safe: ${t.slug}`);
    assert.ok(!keys.has(t.key) && !slugs.has(t.slug), `duplicate track: ${t.key}`);
    keys.add(t.key);
    slugs.add(t.slug);
    assert.ok(t.nameDe && t.level, `name/level missing on ${t.key}`);
    for (const sub of t.sublevels) {
      assert.ok(ALL_LEVELS.includes(sub), `${t.key} references unknown sublevel ${sub}`);
    }
    assert.equal(examTrackByKey(t.key), t);
    assert.equal(examTrackBySlug(t.slug), t);
    // guideSlug must resolve to a real guide module
    assert.ok(
      readFileSync(join(root, `astro-site/src/data/guides/${t.guideSlug}.js`), 'utf8').length > 0,
      `${t.key} points at a guide that does not exist: ${t.guideSlug}`
    );
  }
});

test('every track has a hub copy entry in the exams data module', () => {
  for (const t of EXAM_TRACKS) {
    assert.ok(hubsSrc.includes(`${t.key}:`), `HUB_COPY missing for ${t.key}`);
  }
});

// ── 2. truth bans ────────────────────────────────────────────────────────

const OUTCOME = /\b(garantiert bestehst|bestehst du garantiert|Bestehensgarantie|100\s?% Erfolg|sicher bestehen)\b/i;
// Never claim official material or affiliation. "kein offizielles …" (the
// disclaimer's own phrasing) is explicitly allowed.
const OFFICIAL = /(offiziell(e|es)? (telc|goethe|dtz|prüfungs))(?!.*kein)|original[- ]?(telc|goethe)[- ]?(aufgaben|material|prüfung)|von (telc|goethe) zertifiziert/i;

test('exam surfaces carry no outcome promises and no official-material claims', () => {
  for (const [file, allowDisclaimer] of [
    ['src/data/examTracks.js', true],
    ['astro-site/src/data/exams/index.js', false],
    ['astro-site/src/pages/pruefung/[slug].astro', false],
    ['astro-site/src/pages/pruefung/index.astro', false],
  ]) {
    const body = readFileSync(join(root, file), 'utf8');
    assert.ok(!OUTCOME.test(body), `${file} contains an outcome promise`);
    const stripped = allowDisclaimer
      ? body.replace(/kein offizielles Prüfungsmaterial/g, '')
      : body;
    assert.ok(!OFFICIAL.test(stripped), `${file} claims official material or affiliation`);
  }
});

// ── 3. the disclaimer ────────────────────────────────────────────────────

test('the mock disclaimer says what it must', () => {
  assert.match(MOCK_DISCLAIMER_DE, /kein offizielles Prüfungsmaterial/);
  assert.match(MOCK_DISCLAIMER_DE, /keine offizielle Bewertung/);
  assert.match(MOCK_DISCLAIMER_DE, /keiner Verbindung/);
});

// ── 4. three-place rule for the new segment ──────────────────────────────

test('/pruefung is copied, sitemapped and required in the built-HTML check', () => {
  assert.ok(
    netlifyToml.includes('cp -r astro-site/dist/pruefung dist/pruefung'),
    'netlify.toml build command must copy the pruefung directory into dist/'
  );
  assert.ok(
    astroConfig.includes("page.includes('/pruefung/')"),
    'astro.config.mjs sitemap filter must whitelist /pruefung/'
  );
  for (const t of EXAM_TRACKS) {
    assert.ok(
      checkBuiltHtml.includes(`pruefung/${t.slug}/index.html`),
      `check-built-html REQUIRED list missing pruefung/${t.slug}`
    );
  }
});

// ── 5. hub provenance renders ────────────────────────────────────────────

test('the hub renderer shows factsCheckedOn, sources and the non-affiliation line', () => {
  assert.match(hubRenderer, /factsCheckedOn/);
  assert.match(hubRenderer, /sources\.map/);
  assert.match(hubRenderer, /kein Prüfungsanbieter/);
});
