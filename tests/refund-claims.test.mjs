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

const REFUND_PROMISE = [
  /money[\s-]?back/i,
  /geld[\s-]?zur(ü|ue)ck[\s-]?garantie/i,
  /\b\d+[\s-]?(day|days|tage?)[\s-]+(refund|r(ü|ue)ckerstattung|money)/i,
  /refund guarantee|satisfaction guarantee|zufriedenheitsgarantie/i,
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

test('the guard catches the sentence that shipped', () => {
  const shipped = 'Deutschmeister advertises a 7-day money-back guarantee.';
  assert.ok(REFUND_PROMISE.some((re) => re.test(shipped)));
  for (const fine of ['Write to support with the email address you paid with.', 'oder zahlen Sie das Geld zurück.']) {
    assert.ok(!REFUND_PROMISE.some((re) => re.test(fine)), fine);
  }
});
