// Guard suite for the social pack the daily Routine posts. Run with `npm test`.
//
// drafts/instagram-100/posts.csv is read from main by the daily post Routine
// (drafts/instagram-100/ROUTINE.md) and copied byte-for-byte to Instagram and
// Facebook, one row a day until 2026-11-16. Nothing else reviews it before it goes
// out, so a claim in it reaches the channels unchanged.
//
// Until 2026-10-07, 17 of the 50 rows said "Die ganze Regel mit Übungen, kostenlos"
// under a link to a grammar page above A1.1 (004, 005, 010 had already gone out).
// On those pages the rule text is public, but the exercises are locked without a
// trial, Pro or a bought course (astro-site/src/components/ExercisePlayer.jsx since
// #58, 2026-09-03: "The rules are free. The practice is part of A2.1."). A reader
// who followed the post found the practice it called free behind a signup.
//
// The class is closed with a rule over every row, not a list of post ids:
//   1. a caption line that calls something free (kostenlos, gratis, umsonst, free)
//      names exercises (Übung…) only when the linked grammar page is at the free
//      level, FREE_LEVEL_LABEL in src/data/marketing.js;
//   2. the generator's own copy of that level (FREE_LEVEL in content.py, which
//      cannot import JS) equals FREE_LEVEL_LABEL;
//   3. posts.csv is what captions.mjs writes from posts.json: every row carries the
//      CTA that posts.json holds for it, so an edit to one file alone is caught.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FREE_LEVEL_LABEL } from '../src/data/marketing.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const packDir = join(root, 'drafts/instagram-100');
const FREE_LEVEL = FREE_LEVEL_LABEL.toLowerCase();

// RFC 4180: quoted fields, "" for a quote, newlines inside quotes.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows;
  return body.map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i]])));
}

const posts = parseCsv(readFileSync(join(packDir, 'posts.csv'), 'utf8'));
const postsJson = JSON.parse(readFileSync(join(packDir, 'posts.json'), 'utf8'));
const CHANNELS = ['caption_instagram', 'caption_facebook', 'caption_telegram'];

// The page a row links to. Instagram captions say "Link in Bio", so the row's
// Facebook link stands for all three channels.
function linkedPath(row) {
  const m = row.caption_facebook.match(/https:\/\/deutsch-meister\.de(\/[^?\s]*)/);
  return m ? m[1] : null;
}

const FREE_WORD = /\b(kostenlos|gratis|umsonst|free)\b/i;
const EXERCISE_WORD = /Übung/i;

/** Rule 1: the lines of `text` that call exercises free under a link to `path`. */
function freeExerciseProblems(path, text) {
  const level = (path || '').match(/^\/grammar\/([^/]+)\//)?.[1];
  if (!level || level === FREE_LEVEL) return [];
  return text.split('\n').filter((line) => FREE_WORD.test(line) && EXERCISE_WORD.test(line));
}

test('the pack parses: 50 rows, each with three captions and a site link', () => {
  assert.equal(posts.length, 50);
  for (const row of posts) {
    for (const ch of CHANNELS) assert.ok(row[ch], `${row.post_id} has no ${ch}`);
    assert.ok(linkedPath(row), `${row.post_id} has no deutsch-meister.de link`);
    assert.ok(row.caption_telegram.includes(`https://deutsch-meister.de${linkedPath(row)}?`),
      `${row.post_id}: the Telegram link differs from the Facebook link`);
  }
});

test('rule 1 catches the pre-2026-10-07 caption and allows it at the free level', () => {
  const old = 'Die ganze Regel mit Übungen, kostenlos: https://deutsch-meister.de/grammar/a2.1/dative-case/?utm_source=facebook';
  assert.equal(freeExerciseProblems('/grammar/a2.1/dative-case/', old).length, 1);
  assert.equal(freeExerciseProblems('/grammar/b1.2/verbs-with-prepositions/', 'Die ganze Regel mit Übungen, kostenlos: Link in Bio.').length, 1);
  assert.deepEqual(freeExerciseProblems(`/grammar/${FREE_LEVEL}/nouns-gender/`, old), []);
  assert.deepEqual(freeExerciseProblems('/grammar/a2.1/dative-case/', 'Die ganze Regel, kostenlos: Link in Bio.'), []);
  assert.deepEqual(freeExerciseProblems('/speaking/', 'Sprechen üben ohne Partner: Link in Bio.'), []);
});

test('rule 1: no caption calls exercises free above the free level', () => {
  const problems = [];
  for (const row of posts) {
    for (const ch of CHANNELS) {
      for (const line of freeExerciseProblems(linkedPath(row), row[ch])) problems.push(`${row.post_id} ${ch}: ${line}`);
    }
  }
  assert.deepEqual(problems, [], 'above the free level only the rule text is free (ExercisePlayer.jsx locks the practice)');
});

test('rule 2: content.py names the same free level as marketing.js', () => {
  const py = readFileSync(join(packDir, 'content.py'), 'utf8');
  const m = py.match(/^FREE_LEVEL = '([^']+)'$/m);
  assert.ok(m, 'content.py defines FREE_LEVEL');
  assert.equal(m[1], FREE_LEVEL);
});

test('rule 3: posts.csv carries the CTA posts.json holds for each row', () => {
  assert.equal(postsJson.length, posts.length);
  for (const [i, p] of postsJson.entries()) {
    const row = posts[i];
    assert.equal(row.post_id, p.id);
    assert.ok(row.caption_instagram.includes(`\n\n${p.cta_ig}\n\n`), `${p.id}: Instagram CTA differs from posts.json`);
    assert.ok(row.caption_facebook.includes(`\n\n${p.cta_web} https://deutsch-meister.de${p.link_path}?`), `${p.id}: Facebook CTA differs from posts.json`);
    assert.ok(row.caption_telegram.includes(`\n\n${p.cta_web} https://deutsch-meister.de${p.link_path}?`), `${p.id}: Telegram CTA differs from posts.json`);
  }
});
