// The /app.html shell (index.html) states no content count.
//
// Every user-facing count is a measured constant in src/data/marketing.js (see
// its rule 2, and CLAUDE.md "User-facing counts are content counts"). React
// pages and Astro pages import those constants. The shell cannot: Vite copies
// index.html through untouched apart from its asset tags, and nothing in the
// build substitutes a value into it. So a number typed into the shell is a
// retyped claim, and it rots without failing anything.
//
// It did. The shell's description, og:description, twitter:description,
// og:title and twitter:title said "64 topics". That was true until
// GRAMMAR_TOPIC_COUNT went 64 -> 84 between 2026-09-05 and 2026-09-07; the
// shell kept the old figure for four weeks, until 2026-10-03.
// dist/app.html is the raw HTML of every SPA route that is not prerendered
// (/login, /signup, /dashboard, /course/*, /level/* and others) until Helmet
// runs, so link-preview bots and non-JS crawlers read the stale figure.
// Found by the seo agent on 2026-10-03; the five tags now carry no count.
//
// The rule closes the class rather than the one number: no "<number> <content
// noun>" anywhere in the shell, head or <noscript> body. A count belongs on a
// page that can import marketing.js.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const shell = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const NOUNS = [
  'topics?', 'lessons?', 'levels?', 'episodes?', 'exercises?', 'dialogues?', 'lines?',
  'words?', 'rules?', 'examples?', 'guides?', 'courses?', 'tests?', 'sessions?',
  'learners?', 'users?', 'students?', 'members?', 'reviews?',
  'Themen', 'Lektionen', 'Übungen', 'Folgen', 'Lernende', 'Wörter', 'Kurse',
];

/** A number (1,614 / 1.614 / 84+), optionally one qualifier word, then a content noun. */
const COUNT = new RegExp(
  String.raw`(?<![\w.])\d[\d.,]*\s*\+?\s+(?:[\p{L}-]+\s+)?(?:${NOUNS.join('|')})(?![\p{L}])`,
  'giu',
);

test('the count pattern catches the figures that actually rotted here', () => {
  // Not vacuous: the strings the shell shipped until 2026-10-03, and the shapes
  // the other surfaces use, all match.
  for (const sample of [
    'Master German grammar across 64 topics, A1.1 to B2.2.',
    'DeutschMeister - Learn German Grammar from A1 to B2 | 64 Topics',
    '84 grammar topics',
    '1,614 interactive exercises',
    '24 podcast episodes',
    '480 native-speaker dialogue lines',
    '8 Levels',
    '84 Themen',
  ]) {
    assert.match(sample, new RegExp(COUNT.source, 'iu'), `the pattern misses "${sample}"`);
  }
  // CEFR level names and CSS lengths are not counts.
  for (const sample of ['A1.1 to B2.2', 'from A1 to B2', 'padding:2rem 1rem', 'max-width:960px']) {
    assert.doesNotMatch(sample, new RegExp(COUNT.source, 'iu'), `the pattern flags "${sample}"`);
  }
});

test('index.html carries no content-count literal', () => {
  const hits = [];
  shell.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(COUNT)) hits.push(`index.html:${i + 1}: "${m[0]}"`);
  });
  assert.deepEqual(
    hits,
    [],
    'the app shell cannot import src/data/marketing.js, so a count typed into it drifts; '
      + `drop it (or move the claim to a page that imports the constant):\n  ${hits.join('\n  ')}`,
  );
});

test('the shell still describes itself in every preview tag', () => {
  // Dropping a count must not leave a preview tag empty: these five are what a
  // link preview of /login or /signup shows before Helmet runs.
  for (const [attr, key] of [
    ['name', 'description'],
    ['property', 'og:title'],
    ['property', 'og:description'],
    ['name', 'twitter:title'],
    ['name', 'twitter:description'],
  ]) {
    const m = shell.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`));
    assert.ok(m, `index.html lost <meta ${attr}="${key}">`);
    assert.ok(m[1].trim().length >= 30, `index.html <meta ${key}> is empty or a stub: "${m[1]}"`);
  }
});
