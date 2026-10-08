// Guard suite for what the Pro cards on /subscription say Pro includes
// (revenue agent, 2026-10-06).
//
// The finding this closes: /subscription is where every in-app limit sends a
// learner, and its two Pro cards typed their own feature lists in April. They
// named none of the AI allowances Pro is sold on (speaking, writing
// correction, Sentence X-Ray) while /pricing/ leads with them, and the yearly
// card promised "Priority support" and "Early access to new content", which
// nothing delivers (every ticket is created priority 'normal'; 0 yearly
// subscriptions were ever sold, so no buyer was promised it at checkout).
//
// The rule, not a list of strings:
//   1. One offer on both purchase surfaces: the English cards render the
//      /pricing/ Pro lines themselves (src/data/offers.js PRO_OFFER, whose
//      figures tests/offers.test.mjs and tests/claims.test.mjs tie to the
//      functions), and the German cards say the same lines, figure for figure.
//   2. The page renders src/lib/proPlanLines.js on both cards and types no
//      feature list of its own; the checkout config carries no second,
//      unrendered copy to drift (the dead one is what the cards were copied from).
//   3. A purchase surface promises a support level only when the code that
//      files a ticket sets its priority from the plan; today it files every
//      ticket as 'normal'. And it promises no early release of content while
//      nothing releases content to one plan first.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { PLANS } from '../src/data/pricing.js';
import { PRO_OFFER } from '../src/data/offers.js';
import {
  LEVEL_COUNT,
  PRO_DAILY_LIMIT,
  PRO_SPEAKING_SESSIONS_PER_MONTH,
  PRO_WRITING_EVALUATIONS_PER_MONTH,
} from '../src/data/marketing.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const LIB = 'src/lib/proPlanLines.js';
const PAGE = 'src/pages/SubscriptionPage.jsx';
const CHECKOUT_CONFIG = 'src/config/lemonsqueezy.js';
const TICKET_FILER = 'netlify/functions/support-ticket-create.mjs';

/** Every surface that tells a buyer what Pro or a plan includes. */
const PURCHASE_SURFACES = [
  PAGE,
  'src/pages/SubscriptionSuccessPage.jsx',
  CHECKOUT_CONFIG,
  LIB,
  'src/data/offers.js',
  'astro-site/src/data/offers.js',
  'astro-site/src/pages/pricing.astro',
  'astro-site/src/lib/proCta.js',
  'src/components/speaking/SpeakingLimitOffer.jsx',
  'src/data/faqContent.js',
];

const loadLib = async () => {
  assert.ok(existsSync(join(ROOT, LIB)), `${LIB} holds what the Pro cards say`);
  return import('../src/lib/proPlanLines.js');
};

/** Comments out (JS, JSX and HTML), so the rules see what ships. */
const code = (src) =>
  src
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');

/** The figures a line states, in order ("30 AI speaking sessions" -> [30]). */
const figures = (line) => (line.match(/\d+(?:[.,]\d+)?/g) || []).map((n) => Number(n.replace(',', '.')));

test('the English Pro cards say exactly what /pricing/ says Pro includes', async () => {
  const { proPlanLines } = await loadLib();
  assert.deepEqual(proPlanLines(false), PRO_OFFER.lines);
});

test('the German Pro cards say the same lines, figure for figure, in Sie', async () => {
  const { proPlanLines } = await loadLib();
  const en = proPlanLines(false);
  const de = proPlanLines(true);
  assert.equal(de.length, en.length, 'one German line per English line');
  de.forEach((line, i) => {
    assert.deepEqual(figures(line), figures(en[i]), `line ${i + 1} states other figures in German: "${line}" vs "${en[i]}"`);
    assert.doesNotMatch(line, /\b(?:du|dich|dir|dein\w*)\b/i, `the course speaks Sie: "${line}"`);
  });
});

test('both languages name every Pro allowance the server enforces', async () => {
  const { proPlanLines } = await loadLib();
  for (const isGerman of [false, true]) {
    const stated = proPlanLines(isGerman).flatMap(figures);
    for (const [name, value] of Object.entries({
      LEVEL_COUNT,
      PRO_SPEAKING_SESSIONS_PER_MONTH,
      PRO_WRITING_EVALUATIONS_PER_MONTH,
      PRO_DAILY_LIMIT,
    })) {
      assert.ok(stated.includes(value), `isGerman=${isGerman}: no Pro card line states ${name} (${value})`);
    }
  }
});

test('proPlanLines hands out a copy, so a caller cannot rewrite the offer', async () => {
  const { proPlanLines } = await loadLib();
  const lines = proPlanLines(false);
  lines.push('mutated');
  assert.deepEqual(proPlanLines(false), PRO_OFFER.lines);
  assert.notEqual(proPlanLines(true), proPlanLines(true));
});

test('every plan card on /subscription renders the lines and types no feature list', () => {
  const page = code(read(PAGE));
  assert.match(page, /import \{ proPlanLines \} from '\.\.\/lib\/proPlanLines\.js'/);
  const rendered = page.match(/features:\s*proPlanLines\(isGerman\)/g) || [];
  assert.equal(rendered.length, Object.keys(PLANS).length, 'one proPlanLines() per plan the checkout sells');
  assert.doesNotMatch(page, /features:\s*(?:isGerman|\[)/, 'a plan card types its own feature list');
});

test('the checkout config carries no unrendered plan feature list', () => {
  assert.doesNotMatch(code(read(CHECKOUT_CONFIG)), /\bfeatures\s*:/);
});

test('no purchase surface promises a support level the ticket filer does not grant', () => {
  const filer = code(read(TICKET_FILER));
  // The day a ticket's priority follows the plan, this assertion fails and the
  // claim may be written, with the rule that grants it.
  assert.match(filer, /priority:\s*'normal'/, `${TICKET_FILER} no longer files every ticket as 'normal': revisit this rule`);
  const SUPPORT_LEVEL = /\b(?:priorit\w*[\s-]*support|support[\s-]*priorit\w*|prioritäts[\s-]*support|bevorzugte\w*\s+support|vorrangige\w*\s+support)\b/i;
  const EARLY_RELEASE = /\b(?:early\s+access|früh(?:zeitig)?e\w*\s+zugang|vorab[\s-]*zugang)\b/i;
  for (const file of PURCHASE_SURFACES) {
    const body = code(read(file));
    assert.doesNotMatch(body, SUPPORT_LEVEL, `${file} promises a support level`);
    assert.doesNotMatch(body, EARLY_RELEASE, `${file} promises early access to content`);
  }
});
