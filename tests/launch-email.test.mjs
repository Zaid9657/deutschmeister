// The staged sub-level launch email (drafts/launch-sublevel-1.mjs, sent only by
// the owner through drafts/send-launch-sublevel-1.sh). Pins the four things the
// 2026-09-27 launch audit found or asked for:
//   1. prices derive from src/data/pricing.js — the copy carries no literal;
//   2. the audience excludes subscribers and anyone who already owns a level
//      the email sells;
//   3. the copy-claim classes the audit found stay closed in every email body
//      of the draft (customer quotes without a source, "Goethe exam format",
//      a weekday in a sequenced email);
//   4. the send script cannot go live by accident, and the retired START49
//      script cannot run at all.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildLaunchEmail, TEMPLATE } from '../drafts/launch-sublevel-1.mjs';
import {
  SELLABLE_LEVELS,
  COMING_SOON_LEVELS,
  LEGACY_LEVEL_COURSES,
  courseForLevel,
  productKeyForLevel,
} from '../src/data/pricing.js';

const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
const email = buildLaunchEmail();

// Every email body in the sequence draft: from "## Email 1" to the Telegram
// section (the header quotes the old wording on purpose, as the audit record).
const draft = read('drafts/launch-sublevel-courses-2026-09.md');
const emailBodies = draft.slice(draft.indexOf('## Email 1'), draft.indexOf('## Telegram'));

test('every sellable level is priced from pricing.js, and nothing coming soon is priced', () => {
  for (const level of SELLABLE_LEVELS) {
    const c = courseForLevel(level);
    assert.ok(
      email.body.includes(`${c.code} &mdash; <strong>&euro;${c.price}</strong>`),
      `${c.code} should be priced at ${c.price} in the email`,
    );
  }
  for (const level of COMING_SOON_LEVELS) {
    assert.ok(!email.body.includes(`${level.toUpperCase()} &mdash;`), `${level} is coming soon and must not be priced`);
  }
  assert.doesNotMatch(email.body, /\{\{|\}\}/, 'no unfilled token');
});

test('the launch copy carries no price literal (derive, never retype)', () => {
  const priceLiteral = /(?:€|&euro;)\s?\d|\d\s?€/;
  assert.doesNotMatch(TEMPLATE, priceLiteral);
  assert.doesNotMatch(read('drafts/launch-sublevel-1.mjs'), priceLiteral);
  assert.doesNotMatch(emailBodies, priceLiteral, 'email bodies in the draft use {{…}} placeholders for prices');
});

test('the audience excludes subscribers and every product that owns a level the email sells', () => {
  assert.ok(email.exclude.includes('subscribed'));
  const sold = new Set(SELLABLE_LEVELS);
  const mustExclude = [
    ...SELLABLE_LEVELS.map(productKeyForLevel),
    ...Object.values(LEGACY_LEVEL_COURSES).filter((c) => c.levels.some((l) => sold.has(l))).map((c) => c.key),
  ];
  for (const key of ['course_a1_2', 'course_a2_1', 'course_a2_2']) assert.ok(mustExclude.includes(key), key);
  for (const key of mustExclude) assert.ok(email.exclude.includes(`purchased:${key}`), `exclude purchased:${key}`);
});

test('the audit finding classes stay closed in every email body', () => {
  for (const [name, text] of [['launch-sublevel-1.mjs', TEMPLATE], ['draft email bodies', emailBodies]]) {
    // A customer quote needs a source; there are no tickets or survey answers to quote.
    assert.doesNotMatch(text, /\b(told us|you told|asked us|wrote to us|(users|learners|customers) (say|tell))\b/i, name);
    // Our final tests are Goethe-style practice tests, never "the Goethe format".
    assert.doesNotMatch(text, /format of the goethe|goethe(?:[- ]exam)?[- ]format/i, name);
    // A sequenced email cannot know the weekday it lands on.
    assert.doesNotMatch(text, /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/, name);
  }
});

test('the send script guards the live send; the retired START49 script cannot run', () => {
  const sh = read('drafts/send-launch-sublevel-1.sh');
  const curlAt = sh.indexOf('curl -sS');
  assert.ok(curlAt > 0);
  assert.match(sh, /TEST_MODE=true\n\[\[ "\$MODE" == "live" \]\] && TEST_MODE=false/, 'test mode is the default');
  assert.ok(sh.indexOf('"${LAUNCH_PRECONDITION_VERIFIED:-}" != "yes"') < curlAt, 'precondition flag checked before any request');
  assert.ok(sh.indexOf('> "$LIVE_STAMP"') < curlAt, 'the live stamp is claimed before the request');
  assert.ok(sh.indexOf('head -n1 "$TESTED_STAMP"') < curlAt, 'live needs a test of the same copy');

  const retired = read('drafts/send-launch-email-1.sh');
  const firstCommand = retired.split('\n').slice(1).find((l) => l.trim() && !l.trim().startsWith('#'));
  assert.match(firstCommand, /^echo "RETIRED/);
  assert.ok(retired.indexOf('\nexit 1\n') < retired.indexOf('curl '), 'exits before any request');
});
