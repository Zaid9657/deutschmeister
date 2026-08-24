// Guard suite for user-facing claims. Run with `npm test` (node --test, Node 20+).
//
// This is the first test in the repo, and it guards the thing that is both
// cheapest to get wrong and most expensive to be wrong about: what we tell a
// buyer they get for their money. A claim that disagrees with the server that
// enforces it is irreführende Werbung under UWG §5, not a typo.
//
// Three kinds of assertion, in increasing order of value:
//
//   1. DERIVATION — the figures in src/data/pricing.js actually follow from the
//      prices, so a price change carries every derived claim with it.
//   2. NO RETYPED LITERALS — no page source may contain a price literal. The
//      data files are the only place the digits appear.
//   3. AGREEMENT WITH THE SERVER — the limits in src/data/marketing.js are
//      parsed out of the Netlify functions that enforce them and compared. This
//      is the one that earns its keep: src/config/lemonsqueezy.js advertised
//      "5 speaking sessions per month" against a server that has always allowed
//      30, understating the product six-fold on the checkout config, and no
//      amount of reading the client would have caught it.
//
// A NOTE ON THE COMMENT STRIPPER. Every file that was fixed quotes the banned
// wording in a comment explaining what it was caught doing. Matching raw source
// would therefore find the warning and fail forever. `rendered()` strips
// comments first, so the assertions see roughly what a user sees. Do not
// "simplify" it away.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  MONTHLY_PRICE_EUR,
  YEARLY_PRICE_EUR,
  YEARLY_AS_MONTHLY_EUR,
  MONTHLY_PER_DAY_EUR,
  YEARLY_PER_DAY_EUR,
  YEARLY_SAVING_PERCENT,
  num,
  deNum,
  eur,
  deEur,
} from '../src/data/pricing.js';
import {
  ANON_DAILY_LIMIT,
  TRIAL_DAILY_LIMIT,
  FREE_DAILY_LIMIT,
  PRO_DAILY_LIMIT,
  PRO_SPEAKING_SESSIONS_PER_MONTH,
  TRIAL_SPEAKING_SESSIONS,
  READING_LESSON_COUNT,
} from '../src/data/marketing.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/**
 * Strip comments and import statements so assertions see what ships, not what
 * the file says about itself. Deliberately crude: it does not need to be a JS
 * parser, it needs to not match a `//` line.
 */
const rendered = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|import\s|export\s+\{)/.test(line))
    .join('\n');

// ---------------------------------------------------------------------------
// 1. Derivation
// ---------------------------------------------------------------------------

test('derived figures follow from the prices', () => {
  assert.equal(num(YEARLY_AS_MONTHLY_EUR), num(YEARLY_PRICE_EUR / 12));
  assert.equal(num(MONTHLY_PER_DAY_EUR), num(MONTHLY_PRICE_EUR / 30));
  assert.equal(num(YEARLY_PER_DAY_EUR), num(YEARLY_PRICE_EUR / 365));

  // Never overstate a discount: the whole-percent saving must not exceed the
  // real one.
  const real = ((MONTHLY_PRICE_EUR * 12 - YEARLY_PRICE_EUR) / (MONTHLY_PRICE_EUR * 12)) * 100;
  assert.ok(YEARLY_SAVING_PERCENT <= real, `claimed ${YEARLY_SAVING_PERCENT}% > real ${real}%`);
  assert.ok(YEARLY_SAVING_PERCENT > real - 1, 'saving understated by more than a point');

  // The yearly plan must actually be cheaper per day than the monthly one, or
  // every "save with yearly" line on the site is backwards.
  assert.ok(YEARLY_PER_DAY_EUR < MONTHLY_PER_DAY_EUR);
});

test('formatters produce the German and English conventions', () => {
  assert.equal(eur(9.99), '€9.99');
  assert.equal(deEur(9.99), '9,99 €');
  assert.equal(deNum(6.666), '6,67');
  // German price format uses a regular space before the symbol, never U+00A0 —
  // a non-breaking space here has silently broken string comparisons before.
  assert.ok(!deEur(9.99).includes(' '));
});

// ---------------------------------------------------------------------------
// 2. No retyped literals
// ---------------------------------------------------------------------------

/**
 * Surfaces that render prices or plan claims. A price literal appearing in any
 * of these means someone typed a number instead of importing it — the failure
 * mode this whole layer exists to prevent.
 */
const PRICE_FREE_SURFACES = [
  // src/pages/LandingPage.jsx was deleted in the 2026-08-22 homepage rebuild —
  // the SPA no longer has a "/" route; Astro serves the homepage.
  'src/pages/SubscriptionPage.jsx',
  'src/pages/FAQPage.jsx',
  'src/config/lemonsqueezy.js',
  'src/data/competitorComparisons.js',
  'astro-site/src/data/competitorComparisons.js',
  'astro-site/src/pages/pricing.astro',
  'astro-site/src/pages/index.astro',
];

test('no page source retypes a price literal', () => {
  const forbidden = [
    num(MONTHLY_PRICE_EUR), // 9.99
    num(YEARLY_PRICE_EUR), // 79.99
    num(YEARLY_AS_MONTHLY_EUR), // 6.67
    deNum(MONTHLY_PRICE_EUR), // 9,99
    deNum(YEARLY_PRICE_EUR), // 79,99
    deNum(YEARLY_AS_MONTHLY_EUR), // 6,67
    num(MONTHLY_PER_DAY_EUR), // 0.33
    num(YEARLY_PER_DAY_EUR), // 0.22
    deNum(MONTHLY_PER_DAY_EUR), // 0,33
    deNum(YEARLY_PER_DAY_EUR), // 0,22
  ];

  const failures = [];
  let seen = 0;
  for (const file of PRICE_FREE_SURFACES) {
    const body = rendered(read(file));
    seen += 1;
    for (const literal of forbidden) {
      // Competitor prices are legitimately literal (they are somebody else's
      // numbers), so only flag a literal that is one of OUR figures AND is not
      // immediately preceded by a digit — which would make it part of a longer
      // number like a competitor's "12,99".
      const re = new RegExp(`(?<![\\d.,])${literal.replace('.', '\\.')}(?![\\d])`);
      if (re.test(body)) failures.push(`${file} contains the literal "${literal}"`);
    }
  }
  // Sentinel: if the file list or the stripper ever breaks, the loop would pass
  // vacuously. Fail instead.
  assert.ok(seen === PRICE_FREE_SURFACES.length && seen > 0, 'no surfaces were checked');
  assert.deepEqual(failures, [], `retyped price literals:\n  ${failures.join('\n  ')}`);
});

test('no surface claims unlimited AI usage', () => {
  // Pro is unlimited in CONTENT and metered in AI. A blanket "unlimited" beside
  // a price was live on the Lingoda comparison for months while speaking was
  // capped at 30/month. The sanctioned phrasings live in src/data/marketing.js
  // (UNLIMITED_CONTENT_LINE names what is actually unlimited).
  const banned = /\b(unbegrenzt\w*|unlimited)\b/i;
  const failures = [];
  let seen = 0;
  for (const file of PRICE_FREE_SURFACES) {
    seen += 1;
    const body = rendered(read(file));
    for (const line of body.split('\n')) {
      if (!banned.test(line)) continue;
      // Allowed only when it is the content claim, which names the levels.
      if (/UNLIMITED_CONTENT_LINE/.test(line)) continue;
      failures.push(`${file}: ${line.trim().slice(0, 120)}`);
    }
  }
  assert.ok(seen > 0, 'no surfaces were checked');
  assert.deepEqual(failures, [], `unlimited claims on metered surfaces:\n  ${failures.join('\n  ')}`);
});

// ---------------------------------------------------------------------------
// 3. Agreement with the servers that enforce the limits
// ---------------------------------------------------------------------------

/** Pull `const NAME = <int>` out of a function source. */
const serverConst = (src, name) => {
  const m = src.match(new RegExp(`const\\s+${name}\\s*=\\s*(\\d+)`));
  assert.ok(m, `could not find ${name} in the server source — did it get renamed?`);
  return Number(m[1]);
};

test('speaking limits match the server that enforces them', () => {
  const src = read('netlify/functions/_shared/speakingUsage.mjs');
  assert.equal(
    PRO_SPEAKING_SESSIONS_PER_MONTH,
    serverConst(src, 'PRO_MONTHLY_LIMIT'),
    'marketing claims a different monthly speaking allowance than the server grants',
  );
  assert.equal(
    TRIAL_SPEAKING_SESSIONS,
    serverConst(src, 'TRIAL_TOTAL_LIMIT'),
    'marketing claims a different trial speaking allowance than the server grants',
  );
});

test('X-Ray limits match the server that enforces them', () => {
  const src = read('netlify/functions/analyze-sentence.mjs');
  const block = src.match(/const DAILY_LIMITS\s*=\s*\{([\s\S]*?)\}/);
  assert.ok(block, 'DAILY_LIMITS not found in analyze-sentence.mjs');
  const tier = (name) => {
    const m = block[1].match(new RegExp(`${name}\\s*:\\s*(\\d+)`));
    assert.ok(m, `tier ${name} missing from DAILY_LIMITS`);
    return Number(m[1]);
  };
  assert.equal(ANON_DAILY_LIMIT, tier('anonymous'));
  assert.equal(FREE_DAILY_LIMIT, tier('free_expired'));
  assert.equal(TRIAL_DAILY_LIMIT, tier('free_trial'));
  assert.equal(PRO_DAILY_LIMIT, tier('pro'));
});

// ---------------------------------------------------------------------------
// 4. Static files that cannot import
// ---------------------------------------------------------------------------

test('llms.txt files quote the current prices and allowances', () => {
  // These are hand-maintained crawler/LLM catalogues, so they cannot import the
  // data. They are checked rather than banned: an AI-search answer built from a
  // stale llms.txt is exactly the claim we would never see ourselves.
  for (const file of ['public/llms.txt', 'public/llms-full.txt']) {
    const body = read(file);
    assert.ok(body.includes(eur(MONTHLY_PRICE_EUR)), `${file} does not quote ${eur(MONTHLY_PRICE_EUR)}`);
    assert.ok(body.includes(eur(YEARLY_PRICE_EUR)), `${file} does not quote ${eur(YEARLY_PRICE_EUR)}`);
    assert.ok(
      body.includes(String(PRO_SPEAKING_SESSIONS_PER_MONTH)),
      `${file} does not quote the ${PRO_SPEAKING_SESSIONS_PER_MONTH}-session monthly allowance`,
    );
    assert.ok(
      body.includes(String(PRO_DAILY_LIMIT)),
      `${file} does not quote the ${PRO_DAILY_LIMIT}/day X-Ray allowance`,
    );
  }
});

test('llms.txt files do not claim podcast transcripts', () => {
  // Every episode's transcript column is empty. This claim has now been removed
  // three times — from the homepage FAQPage (2026-08-16), from /podcasts/
  // (2026-08-24), and from these two files, which no guard covered until now.
  // They are the worst surface to leave it on: they exist to be quoted verbatim.
  for (const file of ['public/llms.txt', 'public/llms-full.txt']) {
    const body = read(file).toLowerCase();
    for (const banned of ['transcript', 'transkript']) {
      assert.ok(!body.includes(banned), `${file} claims podcast transcripts; every transcript is empty`);
    }
  }
});

test('llms.txt files quote the measured content counts', () => {
  // Counts here drifted unguarded: 1,982 vocabulary words against a real 1,935,
  // and 52 reading passages against a real 66. Both are now measured constants.
  for (const file of ['public/llms.txt', 'public/llms-full.txt']) {
    const body = read(file);
    for (const stale of ['1,982', '52 leveled']) {
      assert.ok(!body.includes(stale), `${file} still carries the stale count "${stale}"`);
    }
  }
  assert.ok(
    read('public/llms-full.txt').includes(String(READING_LESSON_COUNT)),
    `llms-full.txt does not quote the measured ${READING_LESSON_COUNT} reading lessons`,
  );
});

test('llms.txt links carry the trailing slash the prerendered routes canonicalise to', () => {
  // CLAUDE.md trailing-slash case 2. The slashless form 301s, so every AI crawler
  // following this file took a redirect on six of its product URLs.
  const body = read('public/llms.txt');
  for (const route of ['level-test', 'speaking', 'analyze', 'podcasts', 'listening', 'reading']) {
    assert.ok(
      !new RegExp(`https://deutsch-meister\\.de/${route}(?![/\\w-])`).test(body),
      `llms.txt links /${route} without the trailing slash, which 301s`,
    );
  }
});


// ---------------------------------------------------------------------------
// 5. The two head registries must not drift
// ---------------------------------------------------------------------------

test('prerendered titles match the titles React renders', () => {
  // scripts/prerender-spa-routes.mjs and src/pages/*.jsx each own a copy of the
  // same six titles. All six had drifted: the crawler got one title from the
  // prerendered HTML and Google's renderer got another from Helmet. Nothing
  // compared them, and check-built-html.mjs only ever sees the prerendered side.
  const SUFFIX = ' | DeutschMeister';
  const COMPONENTS = {
    '/speaking': 'src/pages/SpeakingPage.jsx',
    '/level-test': 'src/pages/LevelTest.jsx',
    '/analyze': 'src/pages/SentenceXRay.jsx',
    '/podcasts': 'src/pages/PodcastsPage.jsx',
    '/listening': 'src/pages/Listening/ListeningHome.jsx',
    '/reading': 'src/pages/ReadingSectionPage.jsx',
  };
  const prerender = read('scripts/prerender-spa-routes.mjs');
  const failures = [];
  for (const [route, file] of Object.entries(COMPONENTS)) {
    const block = prerender.slice(prerender.indexOf(`path: '${route}'`));
    const expected = block.match(/title: '([^']+)'/)[1].replace(SUFFIX, '');
    const actual = read(file).match(/title="([^"]+)"/)[1];
    if (actual !== expected) failures.push(`${route}: prerender "${expected}" vs component "${actual}"`);
  }
  assert.deepEqual(failures, []);
});
