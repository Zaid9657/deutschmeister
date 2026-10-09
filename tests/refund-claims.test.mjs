// No page promises a money-back guarantee or a refund period.
//
// WHY. /faq/ said "Deutschmeister advertises a 7-day money-back guarantee" — in
// the visible answer and in the FAQPage JSON-LD that search engines show — while
// src/data/offers.js states that refunds are deliberately absent until the owner
// confirms a policy's wording. A refund promise is a money decision; a page must
// never make one the owner has not made (found 2026-10-04, agent report card).
//
// RULE. No source under src/ or astro-site/src/ claims a money-back guarantee, a
// "Geld-zurück-Garantie" or an N-day refund window. If the owner adopts a policy,
// it gets one constant with its provenance in src/data/marketing.js, and this test
// changes in the same commit to allow exactly that constant.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ROOTS = ['src', 'astro-site/src'];
const EXT = /\.(js|jsx|mjs|astro|md|json)$/;

// Hyphens and spaces vary in shipped copy (U+2010-2011 included), so every
// separator is written as SEP.
const SEP = '[\\s\\u2010\\u2011-]*';
const NUM = '(\\d+|one|seven|fourteen|thirty|sieben|vierzehn|dreißig)';
const REFUND_PROMISE = [
  new RegExp(`money${SEP}back(?!ed)`, 'i'),
  new RegExp(`geld${SEP}zur(ü|ue)ck${SEP}(garantie|innerhalb)`, 'i'),
  new RegExp(`(r(ü|ue)ck)?erstattungs${SEP}garantie|zufriedenheits${SEP}garantie`, 'i'),
  new RegExp(`\\b${NUM}${SEP}(day|days|tage|tagen)${SEP}(full${SEP})?(refund|r(ü|ue)ckerstattung|r(ü|ue)ckgaberecht|money)`, 'i'),
  new RegExp(`full${SEP}refund${SEP}(within|in)${SEP}\\d+`, 'i'),
  /refund guarantee|satisfaction guarantee/i,
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (EXT.test(name)) yield p;
  }
}

test('no page source promises a money-back guarantee or a refund window', () => {
  const hits = [];
  for (const root of ROOTS) {
    for (const file of walk(join(ROOT, root))) {
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (REFUND_PROMISE.some((re) => re.test(line))) hits.push(`${relative(ROOT, file)}:${i + 1}: ${line.trim().slice(0, 120)}`);
      });
    }
  }
  assert.deepEqual(hits, [], `refund promise without an owner-confirmed policy:\n${hits.join('\n')}`);
});

test('the guard catches the sentence that shipped and its common variants', () => {
  const caught = [
    'Deutschmeister advertises a 7-day money-back guarantee.',
    '14-Tage-Geld-zurück-Garantie',
    '30 days money back',
    'Money\u2011back guarantee',
    'Rückerstattungsgarantie',
    'Erstattungsgarantie',
    'Full refund within 14 days',
    '7 day full refund',
    'Geld zurück innerhalb von 14 Tagen',
    '30 Tage Rückgaberecht',
    '14 Tagen Rückerstattung',
    'seven-day refund',
  ];
  for (const s of caught) assert.ok(REFUND_PROMISE.some((re) => re.test(s)), s);
  const fine = [
    'Write to support with the email address you paid with.',
    'oder zahlen Sie das Geld zurück.',
    'A 7-day Pro trial starts when you create an account.',
    'money-backed securities',
  ];
  for (const s of fine) assert.ok(!REFUND_PROMISE.some((re) => re.test(s)), s);
});
