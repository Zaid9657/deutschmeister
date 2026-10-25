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
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  MONTHLY_PRICE_EUR,
  YEARLY_PRICE_EUR,
  YEARLY_AS_MONTHLY_EUR,
  MONTHLY_PER_DAY_EUR,
  YEARLY_PER_DAY_EUR,
  YEARLY_SAVING_PERCENT,
  COURSE_TELC_B1_PRICE_EUR,
  COURSE_PRO_DAYS,
  COURSES,
  SUBLEVEL_PRICES_EUR,
  COMING_SOON_LEVELS,
  SELLABLE_LEVELS,
  COURSE_FROM_PRICE_EUR,
  LEGACY_LEVEL_COURSES,
  courseForProduct,
  productKeyForLevel,
  LEVEL_COURSES,
  ALL_LEVELS,
  levelsForProduct,
  bandCourseForLevel,
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
  PRO_INCLUDED_SESSION_MINUTES,
  TRIAL_SPEAKING_SESSIONS,
  PRO_WRITING_EVALUATIONS_PER_MONTH,
  TRIAL_WRITING_EVALUATIONS,
  COURSE_WRITING_FREE_LIFETIME,
  COURSE_WRITING_FREE_TOTAL_A11,
  READALOUD_DAILY_LIMIT,
  READING_LESSON_COUNT,
  TRIAL_DAYS,
  PLACEMENT_TEST_MINUTES,
} from '../src/data/marketing.js';
import { FAQ_CATEGORIES } from '../src/data/faqContent.js';
import { SEO_ROUTES } from '../src/data/seoRoutes.js';
import { EXAM_TRACKS } from '../src/data/examTracks.js';
import { EXAM_HUBS } from '../astro-site/src/data/exams/index.js';

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

test('level courses cover every paid sub-level exactly once, at its own price', () => {
  // Every level except the free one is a product; the free one never is —
  // a gap here is a level nobody can buy, an overlap is a level sold twice.
  const paid = ALL_LEVELS.slice(1);
  assert.deepEqual(Object.keys(SUBLEVEL_PRICES_EUR), paid);
  const covered = Object.values(LEVEL_COURSES).flatMap((c) => c.levels);
  assert.deepEqual(covered, paid);
  assert.equal(new Set(covered).size, paid.length);
  for (const c of Object.values(LEVEL_COURSES)) {
    assert.equal(c.levels.length, 1, `${c.key} must be one sub-level`);
    assert.equal(c.key, productKeyForLevel(c.levels[0]));
    assert.equal(c.price, SUBLEVEL_PRICES_EUR[c.levels[0]]);
    assert.equal(c.comingSoon, COMING_SOON_LEVELS.includes(c.levels[0]));
    assert.equal(c.proDays, COURSE_PRO_DAYS, 'every course grants the Pro window the webhook grants');
  }
  // Prices rise up the ladder, never fall (the owner's 40 / 50 / 60 / 65 map).
  const prices = paid.map((l) => SUBLEVEL_PRICES_EUR[l]);
  for (let i = 1; i < prices.length; i += 1) assert.ok(prices[i] >= prices[i - 1], 'a higher level must not be cheaper');
  assert.equal(COURSE_FROM_PRICE_EUR, Math.min(...SELLABLE_LEVELS.map((l) => SUBLEVEL_PRICES_EUR[l])));
  assert.ok(SELLABLE_LEVELS.every((l) => !COMING_SOON_LEVELS.includes(l)));
  assert.ok(SELLABLE_LEVELS.length > 0, 'nothing would be buyable');

  // Resolution helpers are what the level guard reads — current AND retired keys.
  assert.deepEqual(levelsForProduct('course_a2_1'), ['a2.1']);
  assert.deepEqual(levelsForProduct('course_b1'), ['b1.1', 'b1.2'], 'a retired band row keeps its access');
  assert.deepEqual(levelsForProduct('course_alle'), ALL_LEVELS, 'a retired bundle row keeps its access');
  assert.deepEqual(levelsForProduct('telc_b1_komplett'), [], 'the telc plan is not a level entitlement');
  assert.deepEqual(levelsForProduct('nope'), []);
  assert.equal(courseForProduct('course_a1').legacy, true);
  assert.equal(bandCourseForLevel('B2.1').key, 'course_b2_1', 'case-insensitive: the DB is uppercase');
  assert.equal(bandCourseForLevel('B2.1').comingSoon, true);
  assert.equal(bandCourseForLevel('a1.1'), null, 'the free level is not a product');
  assert.equal(bandCourseForLevel('zz'), null);
  // Retired keys never reappear as live products.
  for (const k of Object.keys(LEGACY_LEVEL_COURSES)) assert.ok(!(k in LEVEL_COURSES), `${k} is retired`);
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

test('comparison pages and offers FAQ agree on the placement-test duration', async () => {
  for (const root of ['src/data', 'astro-site/src/data']) {
    const { default: comparisons } = await import(`../${root}/competitorComparisons.js`);
    const { OFFER_FAQ } = await import(`../${root}/offers.js`);
    for (const [name, data, minimum] of [
      ['competitorComparisons.js', comparisons, 3],
      ['offers.js OFFER_FAQ', OFFER_FAQ, 1],
    ]) {
      let seen = 0;
      for (const line of JSON.stringify(data, null, 2).split('\n')) {
        if (!/Einstufungstest|level test/i.test(line)) continue;
        for (const match of line.matchAll(/(\d+)(?:-|\s+)(?:Minuten|minute)\b/g)) {
          seen += 1;
          assert.equal(Number(match[1]), PLACEMENT_TEST_MINUTES, `${root}/${name}: ${line.trim()}`);
        }
      }
      assert.ok(seen >= minimum, `${root}/${name}: expected at least ${minimum} placement-test durations, found ${seen}`);
    }
  }
});

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
  'astro-site/src/pages/courses/index.astro',
  'astro-site/src/pages/courses/[level].astro',
  'astro-site/src/data/courseContents.js',
  'astro-site/src/pages/index.astro',
  // The day-6 trial email carried a hardcoded €9.99 twice; it now derives from
  // the functions' synced pricing copy (guarded below), so a retyped digit here
  // is a regression.
  'netlify/functions/trial-lifecycle.mjs',
  // Course surfaces (docs/revenue-plan-2026-08-31.md Lane 2): the sales page
  // and the in-app course area must derive the course price like everything
  // else.
  'astro-site/src/pages/telc-b1-komplettvorbereitung.astro',
  'src/pages/TelcB1KursPage.jsx',
  // The exercise paywall quotes the course and Pro prices on every gated lesson.
  'astro-site/src/components/ExercisePlayer.jsx',
  // Sentence X-Ray carries the signed-out conversion offer and the Pro upsell
  // at the daily limit (docs/SCORECARD.md work order #3, 2026-09-27).
  'src/pages/SentenceXRay.jsx',
  // The offer at the free-speaking limit quotes the level course and Pro
  // (docs/SCORECARD.md work order #7b, 2026-09-28).
  'src/components/speaking/SpeakingLimitOffer.jsx',
  // The /pricing/ Pro button's label and note (conversion agent, 2026-09-30).
  'astro-site/src/lib/proCta.js',
  // The support agent quotes prices to customers: only through the synced
  // pricing copy (_shared/pricing.mjs), never typed (2026-09-30).
  'netlify/functions/support-agent.mjs',
  'netlify/functions/_shared/supportAgentLib.mjs',
  'netlify/functions/_shared/supportCatalog.mjs',
  // v4 "Die Linie" (2026-10-04): the offer layer and every surface that renders it.
  'src/data/offers.js',
  'astro-site/src/data/offers.js',
  'astro-site/src/data/homepage.js',
  'astro-site/src/components/linie/LineSection.astro',
  'astro-site/src/components/linie/FitChooser.astro',
  'astro-site/src/components/linie/Ticket.astro',
  'astro-site/src/components/linie/Progression.astro',
  'astro-site/src/components/linie/OfferFaq.astro',
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
    num(COURSE_TELC_B1_PRICE_EUR), // 89.00
    deNum(COURSE_TELC_B1_PRICE_EUR), // 89,00
    ...Object.values(SUBLEVEL_PRICES_EUR).flatMap((p) => [num(p), deNum(p)]), // 40.00, 50.00, 60.00, 65.00 and the German forms
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

test('no surface says the paid plans include a free trial', () => {
  // The free trial belongs to the ACCOUNT: signup grants it, and it ends on its
  // own. The plans carry no trial of their own; Lemon Squeezy charges a plan the
  // moment it is bought (12 of 12 subscription_created webhooks were 'active'
  // with no trial_ends_at, measured 2026-10-01). /subscription told every
  // visitor, including those whose trial had already ended, that "all plans
  // include" one — a buyer who believed it would be charged on day one of
  // what they took for a free week. Say what the trial is (an account trial,
  // TRIAL_DAYS from marketing.js), never that a plan comes with one.
  const banned = [
    /\b(all|every|each|both)\s+(of\s+the\s+|our\s+)?(paid\s+)?plans?\s+(include|includes|come\s+with|comes\s+with|start\s+with|starts\s+with)\b[^\n]{0,40}\btrial/i,
    /\b(alle|jeder|jede|beide)\s+(unsere\s+)?(Pläne|Plan|Tarife|Tarif|Abos|Abo)\s+(beinhalten|beinhaltet|enthalten|enthält|umfassen|umfasst|starten|startet|beginnen|beginnt)\b[^\n]{0,40}\b(Testphase|Probezeit|Test)/i,
  ];
  const failures = [];
  let seen = 0;
  for (const file of PRICE_FREE_SURFACES) {
    seen += 1;
    const body = rendered(read(file));
    for (const line of body.split('\n')) {
      if (banned.some((re) => re.test(line))) failures.push(`${file}: ${line.trim().slice(0, 120)}`);
    }
  }
  assert.ok(seen === PRICE_FREE_SURFACES.length && seen > 0, 'no surfaces were checked');
  assert.deepEqual(failures, [], `plan-trial claims:\n  ${failures.join('\n  ')}`);
});

// ---------------------------------------------------------------------------
// 2b. The account trial: what it opens, and for how long
// ---------------------------------------------------------------------------
//
// Signup grants every level for TRIAL_DAYS; after that only FREE_LEVELS
// (src/config/freeTier.js) stay open. Measured 2026-10-01: 152 of 152 signups
// in 30 days got a trial of exactly 7.000 days, stamped at the signup instant
// (including the 50 who never signed in), so the trial is the account's, it is
// server-granted, and it ends on its own.
//
// Until 2026-10-01 the signed-out level lock (LockedContentOverlay) said
// "Create a free account to unlock all levels beyond A1.1" over a retyped
// "7-day free trial": a permanent unlock on one line, a seven-day one on the
// next, and the seven typed by hand. These rules walk the source trees rather
// than a file list, so a new screen is covered the day it is written.

const COPY_ROOTS = ['src', 'astro-site/src', 'netlify/functions'];
const copyFiles = () => {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (/\.(jsx?|mjs|astro)$/.test(entry.name)) out.push(rel);
    }
  };
  COPY_ROOTS.forEach(walk);
  return out;
};
/** rendered(), plus the HTML comments an .astro template can carry. */
const renderedCopy = (src) => rendered(src.replace(/<!--[\s\S]*?-->/g, ' '));

/** The trial length typed as a figure or a word ("7-day", "7 Tage", "sieben Tage"). */
const SPELLED = {
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen'],
  de: ['null', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn'],
};
const spelledTrial = [SPELLED.en[TRIAL_DAYS], SPELLED.de[TRIAL_DAYS]].filter(Boolean);
const RETYPED_TRIAL_LENGTH = new RegExp(
  `(?:(?<![\\w.,$€])${TRIAL_DAYS}${spelledTrial.length ? `|\\b(?:${spelledTrial.join('|')})` : ''})` +
    '[\\s\\u00a0-]*(?:days?|Tag(?:e|en)?|tägig\\w*)\\b',
  'i',
);
/**
 * A line that is about the trial or the free offer, not "the last 7 days".
 * No bare "pro": in German it is "per" ("Anmeldungen pro Tag, rollierend 7 Tage").
 */
const TRIAL_CONTEXT = /\b(trial|test\w*|probe\w*|kostenlos\w*|free|gratis)\b/i;

test('no surface says a free account opens every level without saying for how long', () => {
  // The free account opens every level for TRIAL_DAYS, not for good. A line
  // that ties the account to all levels must carry its time bound on the same
  // line: the derived TRIAL_DAYS, or the word trial / Testphase.
  const ACCOUNT = /\b(free\s+account|sign(ing)?[\s-]?up|register(ing)?|registrier(en|e|st|t)|create\s+an?\s+account|kostenlos\w*\s+Konto|Konto\s+(erstellen|anlegen))\b/i;
  const ALL_LEVELS = /\b((all|every)\s+(\$\{\w+\}\s+|\d+\s+|of\s+the\s+)?(CEFR\s+)?levels?|alle\s+(\$\{\w+\}\s+|\d+\s+)?(Stufen|Level|Niveaus?|Niveaustufen)|jede\s+Stufe|jedes\s+(Level|Niveau))\b/i;
  const BOUND = /TRIAL_DAYS|\btrial\b|Testphase|Probezeit/i;
  const files = copyFiles();
  const failures = [];
  for (const file of files) {
    for (const line of renderedCopy(read(file)).split('\n')) {
      if (ACCOUNT.test(line) && ALL_LEVELS.test(line) && !BOUND.test(line)) {
        failures.push(`${file}: ${line.trim().slice(0, 120)}`);
      }
    }
  }
  assert.ok(files.length > 100, `only ${files.length} source files were walked`);
  assert.deepEqual(failures, [], `free-account claims with no time bound:\n  ${failures.join('\n  ')}`);
});

test('no paywall retypes the trial length', () => {
  // A paywall is any surface that reports itself as one (calls
  // trackPaywallShown). It is the moment of intent, and the place a stale
  // "7" would cost the most: it must say ${TRIAL_DAYS}, never the digit.
  const paywalls = copyFiles().filter((f) => /\btrackPaywallShown\(/.test(renderedCopy(read(f))));
  const failures = [];
  for (const file of paywalls) {
    for (const line of renderedCopy(read(file)).split('\n')) {
      // Trial lines only: a "7-day money-back guarantee" is not a trial length.
      if (RETYPED_TRIAL_LENGTH.test(line) && TRIAL_CONTEXT.test(line)) failures.push(`${file}: ${line.trim().slice(0, 120)}`);
    }
  }
  assert.ok(paywalls.length > 0, 'no paywall surfaces were found — did trackPaywallShown get renamed?');
  assert.deepEqual(failures, [], `retyped trial length on a paywall:\n  ${failures.join('\n  ')}`);
});

/**
 * Files anywhere that still type the trial length into trial copy. May only go
 * down. 2026-10-01: 4. 2026-10-02: 0 — the nav's trial button in both front
 * ends (Navbar.jsx, Layout.astro, #177) and the "Pro-Testphase" rows in both
 * twins of competitorComparisons.js now derive the length from TRIAL_DAYS.
 * At 0 any retyped trial length anywhere fails the suite.
 */
const MAX_RETYPED_TRIAL_LENGTH_FILES = 0;

test('retyped trial lengths are receding, never spreading', () => {
  const files = copyFiles().filter((f) =>
    renderedCopy(read(f))
      .split('\n')
      .some((line) => RETYPED_TRIAL_LENGTH.test(line) && TRIAL_CONTEXT.test(line)),
  );
  // A ratchet equals its measurement (CLAUDE.md): above it the retype spread,
  // below it a fix landed and the ceiling must come down in the same commit.
  assert.equal(
    files.length,
    MAX_RETYPED_TRIAL_LENGTH_FILES,
    `${files.length} files retype the trial length; MAX_RETYPED_TRIAL_LENGTH_FILES is ${MAX_RETYPED_TRIAL_LENGTH_FILES} — ` +
      `above it the retype spread, below it lower the ceiling:\n  ${files.join('\n  ')}`,
  );
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

test('the course copy claims the Pro window the webhook actually grants', () => {
  // "X Monate Pro-Zugang inklusive" derives from COURSE_PRO_DAYS; the webhook
  // grants proDays from its own courseForVariant map. If they diverge, the
  // sales page promises a window the server does not grant.
  const webhook = read('netlify/functions/lemonsqueezy-webhook.mjs');
  const granted = webhook.match(/proDays:\s*(\d+)/);
  assert.ok(granted, 'courseForVariant proDays not found in the webhook');
  assert.equal(
    Number(granted[1]),
    COURSE_PRO_DAYS,
    'the webhook grants a different Pro window than the pricing data claims',
  );
  assert.equal(COURSES.telc_b1_komplett.proMonths, Math.floor(COURSE_PRO_DAYS / 30));
});

test('the functions\' synced pricing copy matches the data layer', async () => {
  // netlify/functions/_shared/pricing.mjs is a SYNCED COPY (same doctrine as
  // _shared/brand.mjs): the functions bundle cannot reliably import src/, so
  // the literal lives there and this comparison is what keeps it honest.
  const shared = await import('../netlify/functions/_shared/pricing.mjs');
  assert.equal(shared.MONTHLY_PRICE_EUR, MONTHLY_PRICE_EUR, 'functions pricing copy drifted from src/data/pricing.js');
  assert.equal(shared.eur(shared.MONTHLY_PRICE_EUR), eur(MONTHLY_PRICE_EUR), 'functions eur() formats differently than the data layer');

  // The catalogue the support agent may quote (and its reply validator allows).
  assert.equal(shared.YEARLY_PRICE_EUR, YEARLY_PRICE_EUR);
  assert.equal(shared.COURSE_TELC_B1_PRICE_EUR, COURSE_TELC_B1_PRICE_EUR);
  assert.equal(shared.COURSE_PRO_DAYS, COURSE_PRO_DAYS);
  assert.deepEqual({ ...shared.SUBLEVEL_PRICES_EUR }, SUBLEVEL_PRICES_EUR);
  assert.deepEqual([...shared.COMING_SOON_LEVELS], COMING_SOON_LEVELS);
  assert.deepEqual([...shared.ALL_LEVELS], ALL_LEVELS);
  assert.equal(shared.YEARLY_AS_MONTHLY_EUR, YEARLY_AS_MONTHLY_EUR);
  assert.equal(shared.MONTHLY_PER_DAY_EUR, MONTHLY_PER_DAY_EUR);
  assert.equal(shared.YEARLY_PER_DAY_EUR, YEARLY_PER_DAY_EUR);
  for (const p of [MONTHLY_PRICE_EUR, YEARLY_PRICE_EUR, COURSE_TELC_B1_PRICE_EUR, 40]) {
    assert.equal(shared.deEur(p), deEur(p), `functions deEur(${p}) formats differently than the data layer`);
  }
  // Every product key a purchases row can carry resolves to the same levels.
  const keys = [...Object.keys(COURSES), ...Object.keys(LEVEL_COURSES), ...Object.keys(LEGACY_LEVEL_COURSES)];
  for (const key of keys) {
    assert.deepEqual(shared.productInfo(key)?.levels, levelsForProduct(key), `productInfo(${key}).levels drifted`);
    assert.equal(shared.productKeyForLevel(key.replace(/^course_/, '').replace('_', '.')), productKeyForLevel(key.replace(/^course_/, '').replace('_', '.')));
  }
  assert.equal(shared.productInfo('nope'), null);
  // The allow-list holds every figure a page may state, and nothing else.
  const pagePrices = [MONTHLY_PRICE_EUR, YEARLY_PRICE_EUR, YEARLY_AS_MONTHLY_EUR, MONTHLY_PER_DAY_EUR, YEARLY_PER_DAY_EUR, COURSE_TELC_B1_PRICE_EUR, ...Object.values(SUBLEVEL_PRICES_EUR)];
  assert.deepEqual([...shared.CATALOGUE_EURO_AMOUNTS].sort((a, b) => a - b), pagePrices.sort((a, b) => a - b));
});

test('writing limits match the server that enforces them', () => {
  const src = read('netlify/functions/evaluate-writing.mjs');
  const block = src.match(/const WRITING_LIMITS\s*=\s*\{([\s\S]*?)\}/);
  assert.ok(block, 'WRITING_LIMITS not found in evaluate-writing.mjs');
  const tier = (name) => {
    const m = block[1].match(new RegExp(`${name}\\s*:\\s*(\\d+)`));
    assert.ok(m, `tier ${name} missing from WRITING_LIMITS`);
    return Number(m[1]);
  };
  assert.equal(PRO_WRITING_EVALUATIONS_PER_MONTH, tier('pro'));
  assert.equal(TRIAL_WRITING_EVALUATIONS, tier('free_trial'));
  assert.equal(tier('free_expired'), 0, 'expired users must get zero AI-cost evaluations');
});

test('the free course writing allowance matches the server that enforces it', () => {
  // The course tasks of A1.1 are billed against their own lifetime allowance
  // (owner decision 2026-09-12: 12). If marketing and the function disagree,
  // a learner is told they get twelve graded texts inside a course the site
  // calls free and meets a 429 earlier.
  const src = read('netlify/functions/evaluate-writing.mjs');
  assert.equal(
    COURSE_WRITING_FREE_LIFETIME,
    serverConst(src, 'COURSE_WRITING_FREE_LIFETIME'),
    'marketing claims a different free course writing allowance than the server grants',
  );
});

test('the whole free course writing allowance matches courseAllowanceFor()', async () => {
  // COURSE_WRITING_FREE_TOTAL_A11 claims the WHOLE A1.1 allowance (Lektionen +
  // checkpoints), not just the per-Lektion half above. courseAllowanceFor() in
  // evaluate-writing.mjs is the actual gate a submission is checked against, so
  // import it directly rather than re-deriving the arithmetic here.
  const { courseAllowanceFor, CHECKPOINTS_PER_COURSE } = await import('../netlify/functions/evaluate-writing.mjs');
  const gate = courseAllowanceFor('a11-l01');
  assert.equal(
    COURSE_WRITING_FREE_LIFETIME + CHECKPOINTS_PER_COURSE,
    gate,
    'per-Lektion allowance + checkpoints per course no longer sums to the server gate',
  );
  assert.equal(
    COURSE_WRITING_FREE_TOTAL_A11,
    gate,
    'marketing claims a different whole-course writing allowance than the server grants',
  );
});

test('the read-aloud daily cap matches the server that enforces it', () => {
  // score-readaloud.mjs is built in plan phase P3. Until it lands there is
  // nothing to compare against — skip loudly rather than pass silently, so
  // this check starts biting the moment the function exists.
  let src;
  try {
    src = read('netlify/functions/score-readaloud.mjs');
  } catch {
    console.warn(
      'SKIP: netlify/functions/score-readaloud.mjs does not exist yet — ' +
      `READALOUD_DAILY_LIMIT (${READALOUD_DAILY_LIMIT}) is unverified until it does.`,
    );
    return;
  }
  assert.equal(
    READALOUD_DAILY_LIMIT,
    serverConst(src, 'READALOUD_DAILY_LIMIT'),
    'marketing claims a different daily read-aloud cap than the server grants',
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
  // Generated by scripts/build-llms.mjs from the data (tests/llms.test.mjs pins
  // that); kept as a second, independent check because an AI-search answer built
  // from a stale llms.txt is exactly the claim we would never see ourselves.
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
  for (const route of ['level-test', 'speaking', 'analyze', 'podcasts', 'listening', 'reading', 'faq', 'ueber-uns']) {
    assert.ok(
      !new RegExp(`https://deutsch-meister\\.de/${route}(?![/\\w-])`).test(body),
      `llms.txt links /${route} without the trailing slash, which 301s`,
    );
  }
});


// ---------------------------------------------------------------------------
// 5. The two head registries must not drift
// ---------------------------------------------------------------------------

test('both head consumers read from the one registry', () => {
  // src/data/seoRoutes.js is the single source for per-route titles and
  // descriptions. Before it existed the prerender script and the <SEO> calls
  // each held a copy: all six titles drifted, and when a title guard landed,
  // four descriptions were still drifting underneath it. This asserts the
  // pattern, not the strings: each consumer must reference the registry and
  // must not re-declare the fields it covers.
  const COMPONENTS = {
    '/speaking': 'src/pages/SpeakingPage.jsx',
    '/level-test': 'src/pages/LevelTest.jsx',
    '/analyze': 'src/pages/SentenceXRay.jsx',
    '/podcasts': 'src/pages/PodcastsPage.jsx',
    '/listening': 'src/pages/Listening/ListeningHome.jsx',
    '/reading': 'src/pages/ReadingSectionPage.jsx',
    '/faq': 'src/pages/FAQPage.jsx',
    '/ueber-uns': 'src/pages/UeberUnsPage.jsx',
  };
  const failures = [];
  for (const [route, file] of Object.entries(COMPONENTS)) {
    const src = read(file);
    if (!src.includes(`seoProps('${route}')`)) failures.push(`${file}: does not spread seoProps('${route}')`);
    if (/<SEO[^>]*\stitle="/.test(src)) failures.push(`${file}: re-declares a literal title on <SEO>`);
    if (/<SEO[\s\S]{0,400}?\sdescription="/.test(src)) failures.push(`${file}: re-declares a literal description on <SEO>`);
  }
  const prerender = read('scripts/prerender-spa-routes.mjs');
  for (const route of Object.keys(COMPONENTS)) {
    if (!prerender.includes(`...head('${route}')`)) failures.push(`prerender-spa-routes.mjs: route ${route} does not spread head()`);
  }
  if (/\n\s{4}title: '/.test(prerender)) failures.push('prerender-spa-routes.mjs: a route re-declares a literal title');
  assert.deepEqual(failures, []);
});

// ---------------------------------------------------------------------------
// 6. What we say the product does (2026-10-25)
// ---------------------------------------------------------------------------
//
// The /vergleich/ pages, /faq/ and the head registry sold TestDaF preparation,
// exam-tuned AI speaking "auf jedem Niveau" and "real-time" feedback, put the
// trial's speaking sessions in the no-account tier, and promised grammar
// examples "with audio". None of it was true, and the comparison pages name
// three competitors (UWG §5/§6). These rules hold the class, not the sentences.

/** Every string value in a nested object or array. */
const stringsIn = (value, out = []) => {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => stringsIn(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => stringsIn(v, out));
  return out;
};

/**
 * Clauses — a claim and the negation that takes it back must share one. A dash
 * ends a clause ("auf Goethe, telc und TestDaF abgestimmt — nicht auf
 * allgemeines Sprachgefühl" is a claim followed by a contrast), a comma does
 * not ("TestDaF, DSH, ÖSD, and C1 or C2 exams are not offered" is one).
 */
const clausesOf = (text) => String(text).split(/[.;:!?—–]+\s*/).map((c) => c.trim()).filter(Boolean);
const NEGATED = /\b(not|no|never|none|neither|nor|without|nicht|kein\w*|nie|niemals|ohne)\b/i;
const sentencesOf = (text) => String(text).split(/(?<=[.!?])\s+/).filter(Boolean);

const FAQ_ITEMS = FAQ_CATEGORIES.flatMap((c) => c.items);
const comparisonTwins = () =>
  Promise.all(['src/data', 'astro-site/src/data'].map(async (root) => [root, (await import(`../${root}/competitorComparisons.js`)).default]));

test('our claims name only the exams the product has a track for (the support agent\'s rule)', async () => {
  // detectContentRequests() is how the production support agent recognises a
  // request for content we do not have (TestDaF, DSH, ÖSD, C1/C2, an exam
  // family + level without a track). Run over our own copy, a hit is a claim
  // that we offer it — allowed only inside a clause that negates it.
  const { detectContentRequests } = await import('../netlify/functions/_shared/supportAgentLib.mjs');
  const old = 'Die Inhalte sind auf Goethe, telc und TestDaF abgestimmt — nicht auf allgemeines Sprachgefühl.';
  const oldHits = clausesOf(old).filter((c) => detectContentRequests(c).length && !NEGATED.test(c));
  assert.equal(oldHits.length, 1, 'the rule must catch the sentence that shipped (the dash ends the claim)');

  const surfaces = [
    ...(await comparisonTwins()).map(([root, data]) => [`${root}/competitorComparisons.js`, data]),
    ['src/data/faqContent.js', FAQ_CATEGORIES],
    ['src/data/seoRoutes.js', SEO_ROUTES],
  ];
  const failures = [];
  let negated = 0;
  for (const [name, data] of surfaces) {
    for (const text of stringsIn(data)) {
      for (const clause of clausesOf(text)) {
        const hits = detectContentRequests(clause);
        if (!hits.length) continue;
        if (NEGATED.test(clause)) negated += 1;
        else failures.push(`${name}: "${clause}" → ${hits.join(', ')}`);
      }
    }
  }
  assert.ok(negated >= 1, 'the FAQ says which exams are not offered; the scan must see that clause');
  assert.deepEqual(failures, [], `claims about exams the product has no track for:\n  ${failures.join('\n  ')}`);
});

test('the FAQ lists exactly the exam tracks and what the support agent says is not offered', async () => {
  const { buildFacts } = await import('../netlify/functions/_shared/supportAgentLib.mjs');
  const facts = buildFacts({ ticket: { reference: 'T-1', subject: '', category: 'other', created_at: '2026-10-25T00:00:00Z' } });
  const item = FAQ_ITEMS.find((i) => /which exams/i.test(i.q));
  assert.ok(item, 'the FAQ answers which exams Deutschmeister prepares for');
  for (const track of EXAM_TRACKS) assert.ok(item.a.includes(track.nameDe), `the exam answer must name ${track.nameDe}`);
  for (const missing of facts.library.not_offered) {
    assert.ok(item.a.includes(missing), `the exam answer must say ${missing} is not offered, as the support agent does`);
  }
});

test('/ueber-uns/ names only exams with a track, and its crawlable copy says what the page says', async () => {
  // "What comes next" promised "Live exam simulations for Goethe, telc, and
  // TestDaF" — TestDaF has no track, and the FAQ and the support agent say it is
  // not offered. The prerendered mirror had drifted from the page as well (it
  // promised feedback on pronunciation, which the evaluator never judges): a
  // mirror that says more than the page is a claim only crawlers read.
  const { detectContentRequests } = await import('../netlify/functions/_shared/supportAgentLib.mjs');
  const jsx = read('src/pages/UeberUnsPage.jsx');
  const prerender = read('scripts/prerender-spa-routes.mjs');
  const html = prerender.slice(prerender.indexOf("path: '/ueber-uns'")).match(/content: `([\s\S]*?)`,\n/)[1];
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const array = (name) => {
    const body = jsx.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\n\\];`));
    assert.ok(body, `const ${name} not found in UeberUnsPage.jsx`);
    return [...body[1].matchAll(/\b(?:label|title|body|text): '((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]);
  };
  const roadmap = array('ROADMAP');
  const mirrored = [...html.split('What comes next')[1].split('</ul>')[0].matchAll(/<li[^>]*>([^<]+)<\/li>/g)].map((m) => m[1]);
  assert.ok(roadmap.length >= 3, 'the ROADMAP list was not read');
  assert.deepEqual(mirrored, roadmap, 'the crawlable "What comes next" list must be the page\'s ROADMAP, item for item');
  const htmlTexts = [...html.matchAll(/>([^<>]+)</g)].map((m) => norm(m[1])).filter(Boolean);
  const paragraphs = [...jsx.matchAll(/<Reveal as="p"[^>]*>\s*([\s\S]*?)\s*<\/Reveal>/g)].map((m) => norm(m[1]));
  assert.ok(paragraphs.length >= 8, 'the page\'s paragraphs were not read');
  for (const text of [...array('BADGES'), ...array('DIFFERENTIATORS'), ...paragraphs]) {
    assert.ok(htmlTexts.includes(norm(text)), `the prerendered /ueber-uns/ does not say what the page says: "${text.slice(0, 100)}"`);
  }
  for (const text of new Set([...roadmap, ...htmlTexts])) {
    const exams = detectContentRequests(text).filter((t) => t.startsWith('exam-'));
    assert.deepEqual(exams, [], `/ueber-uns/ names an exam the product has no track for: "${text}"`);
  }
});

test('speaking is described as the code runs it: evaluated after the conversation, never exam-tuned', async () => {
  // The feedback arrives after "Finish & get feedback" (SpeakingSession.jsx →
  // evaluate-speaking.mjs); CONVERSATION_RULES hold no correction step, and the
  // evaluation takes no exam input and no audio ("Du hast KEIN Audio –
  // beurteile NICHT die akustische Aussprache"). So: no "real-time"/"instant"/
  // "sofort"/"korrigiert", no feedback on pronunciation, and no speaking clause
  // "abgestimmt auf" an exam unless it negates it. Until 2026-10-25 seven Leitfäden
  // and the level-test result promised "sofortiges Feedback"/"instant feedback",
  // and the crawlable /speaking/ and /ueber-uns/ copies promised pronunciation.
  const SPEAKING = /spr[ei]ch|gespräch|speaking|conversation/i;
  const REAL_TIME = /echtzeit|live-feedback|sofort\w*\s+feedback|instant\s+feedback|real[- ]time|\bkorrigiert\b/i;
  const PRONUNCIATION = /pronunciation|aussprache/i;
  const FEEDBACK = /feedback|after each session|rückmeldung|auswertung|korrektur|corrections/i;
  const EXAM_TUNED = /\b(abgestimmt|ausgerichtet|tuned|tailored)\b/i;
  const EXAM = /prüfung|exam|goethe|telc|testdaf|dtz/i;
  /** A real-time claim is held per string ("sprich … — mit Feedback in Echtzeit" spans clauses); exam tuning per clause. */
  const speakingProblems = (text) => [
    ...(SPEAKING.test(text) && REAL_TIME.test(text) ? [`real-time claim — "${text.slice(0, 110)}"`] : []),
    ...(PRONUNCIATION.test(text) && FEEDBACK.test(text) ? [`pronunciation feedback — "${text.slice(0, 110)}"`] : []),
    ...clausesOf(text)
      .filter((c) => SPEAKING.test(c) && EXAM_TUNED.test(c) && EXAM.test(c) && !NEGATED.test(c))
      .map((c) => `exam-tuned speaking — "${c.slice(0, 110)}"`),
  ];
  for (const [sample, bad] of [
    ['Aber nur eine lässt dich wirklich sprechen üben — mit KI-Feedback in Echtzeit.', true],
    ['Deutschmeisters KI-Sprechtraining ist auf Goethe, telc und TestDaF abgestimmt', true],
    ['Bei Deutschmeister sprichst du — und die KI hört zu, analysiert und korrigiert.', true],
    ['Sprechen · KI-Sprechtraining · Vorstellen und buchstabieren — jeden Tag laut üben, mit sofortigem Feedback.', true],
    ['Have a real conversation at your A2.1 level and get instant feedback on grammar.', true],
    ['After each session: grammar, vocabulary and pronunciation, with concrete corrections.', true],
    ['Es ist spielerisch angelegt, nicht auf Prüfungen ausgerichtet.', false],
    ['Practice speaking German with an AI conversation partner, and feedback after each session.', false],
    ['Freies Gespräch zu Prüfungsthemen, danach eine Auswertung zu Grammatik, Wortschatz und Ausdruck.', false],
    ['Speech recognition understood 80 % of your words — a rough clarity check, not a pronunciation grade', false],
  ]) {
    assert.equal(speakingProblems(sample).length > 0, bad, `rule self-check: "${sample}"`);
  }
  /** Every string, plus each object's own strings read together: a guide card's eyebrow ("Sprechen") and body. */
  const cardTextsIn = (value, out = []) => {
    if (typeof value === 'string') out.push(value);
    else if (Array.isArray(value)) value.forEach((v) => cardTextsIn(v, out));
    else if (value && typeof value === 'object') {
      const own = Object.values(value).filter((v) => typeof v === 'string');
      if (own.length > 1) out.push(own.join(' · '));
      Object.values(value).forEach((v) => cardTextsIn(v, out));
    }
    return out;
  };
  const { GUIDES } = await import('../astro-site/src/data/guides/index.js');
  const hubCopy = EXAM_HUBS.map(({ title, description, intro, focus, path }) => ({ title, description, intro, focus, path }));
  const surfaces = [
    ...(await comparisonTwins()).map(([root, data]) => [`${root}/competitorComparisons.js`, data]),
    ['src/data/faqContent.js', FAQ_CATEGORIES],
    ['src/data/seoRoutes.js', SEO_ROUTES],
    ['astro-site/src/data/exams/index.js', hubCopy],
    ...GUIDES.map((g) => [`guide ${g.slug}`, g]),
  ];
  const failures = [];
  for (const [name, data] of surfaces) {
    for (const text of cardTextsIn(data)) failures.push(...speakingProblems(text).map((p) => `${name}: ${p}`));
  }
  // The pages and components themselves, line by line (copy sits on one line
  // of JSX/HTML), including the crawlable mirrors the prerender writes.
  const walk = (dir) => readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${dir}/${e.name}`) : /\.(jsx?|astro)$/.test(e.name) ? [`${dir}/${e.name}`] : []);
  const pages = [
    ...['src/pages', 'src/components', 'astro-site/src/pages', 'astro-site/src/components'].flatMap(walk),
    'scripts/prerender-spa-routes.mjs',
    'index.html',
  ];
  assert.ok(pages.includes('src/components/LevelTest/LevelTestResults.jsx'), 'the scan must reach the level-test result');
  for (const file of pages) {
    read(file).split('\n').forEach((line, i) => {
      if (/^\s*(\/\/|\/?\*)/.test(line)) return; // comments describe the rule, they do not ship
      failures.push(...speakingProblems(line).map((p) => `${file}:${i + 1}: ${p}`));
    });
  }
  assert.deepEqual(failures, [], `speaking claims the code does not back:\n  ${failures.join('\n  ')}`);
});

test('the included speaking-session length matches the server, and every comparison states it', async () => {
  // Only a 5-minute session is free inside the allowance; 10 and 15 minutes are
  // paid from credit (speaking-session.mjs). The Lingoda page weighed "30
  // Gespräche im Monat" against hour-long lessons without saying so.
  const src = read('netlify/functions/speaking-session.mjs');
  const rule = src.match(/plannedMinutes\s*===\s*(\d+)\s*&&\s*usage\.allowed/);
  assert.ok(rule, 'the free-session rule (`plannedMinutes === N && usage.allowed`) not found in speaking-session.mjs');
  assert.equal(PRO_INCLUDED_SESSION_MINUTES, Number(rule[1]), 'marketing.js states a different included session length than the server charges for');

  const ALLOWANCE = new RegExp(`\\b${PRO_SPEAKING_SESSIONS_PER_MONTH}\\b[^.]{0,40}(Gespräch|Sprech)`);
  const LENGTH = new RegExp(`à ${PRO_INCLUDED_SESSION_MINUTES} Minuten`);
  for (const [root, data] of await comparisonTwins()) {
    let seen = 0;
    for (const text of stringsIn(data)) {
      assert.doesNotMatch(text, /eine Stunde Sprechtraining/, `${root}: weighs the allowance against an hour of teaching`);
      if (!ALLOWANCE.test(text)) continue;
      seen += 1;
      assert.match(text, LENGTH, `${root}: the monthly allowance without its session length — "${text.slice(0, 110)}"`);
    }
    assert.ok(seen >= 5, `${root}: expected the allowance on every comparison, found ${seen}`);
  }
});

test('the FAQ never puts the trial\'s allowances in the no-account tier', () => {
  // Speaking needs a signed-in user (speaking-session.mjs → 401), and the two
  // sessions are the trial's lifetime total. The free-version answer said
  // "free without registration. You also get 2 free AI speaking sessions…".
  for (const { q, a } of FAQ_ITEMS) {
    for (const s of sentencesOf(a)) {
      if (/without (?:an )?(?:account|registration|signup)|no account/i.test(s)) {
        assert.doesNotMatch(s, /speaking/i, `${q}: "${s}" offers speaking without an account`);
      }
      if (/speaking sessions/i.test(s)) assert.match(s, /trial|account/i, `${q}: "${s}" states speaking sessions without the account trial they belong to`);
    }
  }
  const free = FAQ_ITEMS.find((i) => /free version/i.test(i.q));
  assert.ok(free.a.includes(`${ANON_DAILY_LIMIT} Sentence X-Ray analysis`), 'the no-account X-Ray allowance');
  assert.ok(free.a.includes(`${TRIAL_DAYS}-day Pro trial with ${TRIAL_SPEAKING_SESSIONS} AI speaking sessions`), 'the trial speaking allowance, inside the trial');
  assert.ok(free.a.includes(`${TRIAL_DAILY_LIMIT} X-Ray analyses a day`), 'the trial X-Ray allowance (it said 1)');
});

test('no surface promises audio for grammar examples', () => {
  // 0 of 933 grammar examples carry an audio_url, and llms-full.txt says
  // "text-only"; the course pages and the SPA shell's three description tags
  // said "worked examples with audio" / "audio examples" until 2026-10-25.
  const GRAMMAR_AUDIO = /\b(?:audio examples|examples with audio)\b/i;
  const failures = [];
  for (const file of [...copyFiles(), 'index.html']) {
    for (const line of renderedCopy(read(file)).split('\n')) {
      if (GRAMMAR_AUDIO.test(line)) failures.push(`${file}: ${line.trim().slice(0, 120)}`);
    }
  }
  assert.deepEqual(failures, [], `grammar audio claims:\n  ${failures.join('\n  ')}`);
  // The built-HTML gate bans both shapes too, so a data file cannot bring them back.
  const block = read('scripts/check-built-html.mjs').match(/const BANNED_LITERALS = \[([\s\S]*?)\n\];/);
  for (const literal of ['examples with audio', 'audio examples']) assert.ok(block[1].includes(`'${literal}'`), `BANNED_LITERALS lacks '${literal}'`);
});

test('the head registry and the exam hubs derive the placement-test duration', () => {
  // The /level-test snippet said "in 15 minutes" against PLACEMENT_TEST_MINUTES;
  // the hubs typed "~20" and "20". A retyped figure rots without failing anything.
  const minutes = (text) => [...String(text).matchAll(/(\d+)(?:-|–|\s+)(?:minutes?|Minuten)\b/gi)].map((m) => Number(m[1]));
  assert.deepEqual(minutes(SEO_ROUTES['/level-test'].description), [PLACEMENT_TEST_MINUTES], 'the /level-test description');
  let seen = 0;
  for (const hub of EXAM_HUBS) {
    for (const text of stringsIn({ intro: hub.intro, focus: hub.focus, path: hub.path })) {
      if (!/Einstufungstest/.test(text)) continue;
      for (const value of minutes(text)) {
        seen += 1;
        assert.equal(value, PLACEMENT_TEST_MINUTES, `${hub.slug}: "${text.slice(0, 100)}"`);
      }
    }
  }
  assert.ok(seen >= EXAM_HUBS.length, `expected the duration on every hub's level-test step, found ${seen}`);
  assert.doesNotMatch(rendered(read('astro-site/src/data/exams/index.js')), /\d+\s+Minuten/, 'exams/index.js retypes a duration');
});

test('the social card states the measured counts (public/og-image.png carries the line it draws)', async () => {
  // scripts/generate-og-image.mjs draws the card from marketing.js, but the
  // committed PNG was generated at 64 grammar topics and still said so at 84:
  // nothing re-ran it. The generator now stamps the line it draws into the PNG
  // (tEXt), so a count change without a regeneration fails here, as an
  // llms.txt change without one fails tests/llms.test.mjs.
  const { OG_CLAIM, OG_CLAIM_KEYWORD, pngTextChunks, withTextChunk } = await import('../scripts/generate-og-image.mjs');
  const { GRAMMAR_TOPIC_COUNT, LEVEL_COUNT, FREE_LEVEL_LABEL } = await import('../src/data/marketing.js');
  for (const value of [`${GRAMMAR_TOPIC_COUNT} grammar topics`, `${LEVEL_COUNT} levels`, `${FREE_LEVEL_LABEL} free`]) {
    assert.ok(OG_CLAIM.includes(value), `the card's line does not derive "${value}" from marketing.js: "${OG_CLAIM}"`);
  }
  const png = readFileSync(join(ROOT, 'public/og-image.png'));
  assert.equal(png.toString('latin1', 12, 16), 'IHDR');
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630], 'the card is 1200×630');
  assert.equal(pngTextChunks(png)[OG_CLAIM_KEYWORD], OG_CLAIM, 'public/og-image.png states other figures than marketing.js — run: node scripts/generate-og-image.mjs');
  // The stamp round-trips, and an unstamped card (the one that shipped) has none.
  const bare = Buffer.concat([png.subarray(0, 33), Buffer.from('0000000049454e44ae426082', 'hex')]);
  assert.deepEqual(pngTextChunks(bare), {});
  assert.equal(pngTextChunks(withTextChunk(bare, OG_CLAIM_KEYWORD, OG_CLAIM))[OG_CLAIM_KEYWORD], OG_CLAIM);
});
