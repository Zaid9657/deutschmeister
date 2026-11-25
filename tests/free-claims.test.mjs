// What is free is said as it is. Since the Lektion gate (src/config/freeTier.js, live from 2026-11-22) the
// guided A1.1 course is free up to Lektion 1; its grammar, listening and reading library is free whole.
// „Start A1.1 free“ is true, „the free A1.1 course“ is not (owner, 2026-11-25: "Yes, correct it").
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { FREE_LEKTIONEN, LEKTION_GATE_FROM, freeLektionen } from '../src/config/freeTier.js';
import { FREE_LEKTION_LABEL, FREE_OFFER_LINE, FREE_OFFER_LINE_DE } from '../src/data/marketing.js';

const ROOT = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');

/** Source without comments: the code may go on calling the A1.1 front door „the free course“. */
const said = (src) => src
  .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/\s\/\/ .*$/gm, '');

// A line that promises the whole A1.1 course for nothing.
const LEVEL = String.raw`(?:A1\.1|\$?\{[^}]*(?:FREE_LEVEL_LABEL|FREE_COURSE_LEVEL|STATIONS\[0\])[^}]*\})`;
const FALSE_CLAIMS = [
  new RegExp(String.raw`\bfree (?:guided )?${LEVEL} course\b`, 'i'),
  new RegExp(String.raw`\bfree guided ${LEVEL}`, 'i'),
  new RegExp(String.raw`\bwhole ${LEVEL} course, free\b`, 'i'),
  new RegExp(String.raw`(?:—|\bwhole|\ball of) the ${LEVEL} course is free\b`, 'i'),
  new RegExp(String.raw`${LEVEL} (?:komplett|ganz) kostenlos`, 'i'),
  new RegExp(String.raw`${LEVEL} (?:bleibt|stays) (?:es|free|kostenlos)`, 'i'),
  /\bfree first course\b/i,
  /\bTry the whole course\b/i,
  /\ball Lektionen unlocked\b/i,
  /\bevery Lektion is open, so\b/i,
  /\bkostenlosen Kurs\b/i,
  /\bin Reihenfolge, kostenlos\b/i,
];

const files = (dir, ext) => readdirSync(new URL(dir, ROOT), { recursive: true })
  .map((f) => dir + String(f).replaceAll('\\', '/')).filter((p) => ext.test(p));

const PAGES = [
  ...files('src/pages/', /\.jsx$/), ...files('src/components/', /\.jsx$/),
  ...files('astro-site/src/pages/', /\.astro$/), ...files('astro-site/src/components/', /\.(?:astro|jsx)$/), ...files('astro-site/src/layouts/', /\.astro$/),
  'src/data/marketing.js', 'src/data/offers.js', 'src/data/navigation.js', 'src/data/faqContent.js', 'src/lib/trialReturn.js',
  'scripts/build-llms.mjs', 'scripts/prerender-spa-routes.mjs', 'public/llms.txt', 'public/llms-full.txt', 'index.html',
];

test('the label of the free part is the gate of the config', () => {
  assert.ok(LEKTION_GATE_FROM, 'the gate is live');
  assert.equal(FREE_LEKTION_LABEL, `Lektion ${FREE_LEKTIONEN['a1.1']}`);
  assert.equal(freeLektionen('a1.1'), 1);
  for (const line of [FREE_OFFER_LINE, FREE_OFFER_LINE_DE]) assert.ok(line.startsWith(FREE_LEKTION_LABEL), line);
});

test('no page promises the whole A1.1 course for nothing', () => {
  assert.ok(PAGES.length > 150, `${PAGES.length} files read`);
  const found = [];
  for (const p of PAGES) {
    const text = /\.(?:txt|html)$/.test(p) ? read(p) : said(read(p));
    for (const re of FALSE_CLAIMS) { const m = re.exec(text); if (m) found.push(`${p}: ${m[0]}`); }
  }
  assert.deepEqual(found, []);
});

test('the lines that were wrong are caught, the true ones are not', () => {
  const caught = (t) => FALSE_CLAIMS.some((re) => re.test(t));
  for (const t of [
    '{FREE_LEVEL_LABEL} · the free first course', 'Try the whole course without an account.', 'Start with the free {FREE_LEVEL_LABEL} course — short',
    'Start the free {FREE_LEVEL_LABEL} course', '- Free guided ${FREE_LEVEL_LABEL} course: 12 lessons', 'a free guided A1.1 course, AI speaking',
    'start without signing up — the A1.1 course is free.', '### Free A1.1 Course', 'A1.1 bleibt es für immer', 'all Lektionen unlocked for you',
    'every Lektion is open, so begin', 'Beginnen Sie mit dem kostenlosen Kurs.', 'in Reihenfolge, kostenlos.', 'Lektion 1 of the free ${FREE_COURSE_LEVEL.toUpperCase()} course starts',
    '${FREE_LEVEL_LABEL} komplett kostenlos, ohne Konto', 'The whole ${STATIONS[0].code} course, free and with no account',
  ]) assert.ok(caught(t), t);
  for (const t of [
    'Start A1.1 free — no account', 'Start {FREE_LEVEL_LABEL} free', 'Lektion 1 of the A1.1 course is free', 'A1.1 podcasts are free', 'all A1.1 grammar topics free',
    'A1.1 course (Lektion 1 free)', 'Lektion 1 of A1.1 is free; AI Practice or any course purchase opens the rest.', 'Alle Lektionen',
  ]) assert.ok(!caught(t), t);
});

test('the course page does not tell search engines that the whole A1.1 course is free', () => {
  assert.doesNotMatch(said(read('astro-site/src/pages/courses/[level].astro')), /isAccessibleForFree:\s*true/);
});

test('the course home says „everything is open“ only to a learner whose course is open', () => {
  const src = read('src/pages/CurriculumHomePage.jsx');
  for (const line of src.split(/\r?\n/).filter((l) => /everything here is open|Every Lektion is open for you|Alle Schritte sind offen|Alle Lektionen sind für Sie offen/.test(l))) {
    assert.match(line, /payNotice \?/, line.trim().slice(0, 90));
  }
});
