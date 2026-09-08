// Guard suite for the one-time purchase path (course entitlements).
//
// Same style as tests/lifecycle.test.mjs: structural assertions against the
// source of the code paths that keep money-handling honest, plus integrity
// checks on the program data module. What each pin defends:
//
//   1. IDEMPOTENCY — Lemon Squeezy retries webhooks; the purchases upsert must
//      key on the LS order id or a retry double-grants.
//   2. THE CHECK CONSTRAINT — the included-Pro-window row writes
//      plan_type 'course'; the migration must widen the constraint FIRST or the
//      webhook fails at runtime after money moved (the 'placement' bug class).
//   3. NO CLIENT WRITES — purchases rows are service-role only, like
//      subscriptions.
//   4. PROGRAM INTEGRITY — every grammar item in the course plan must point at
//      a real topic slug (they are derived, and this keeps it that way), and
//      item ids must be unique or progress checkboxes collide.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { PROGRAM, PROGRAM_KEY, allItemIds } from '../src/data/programs/telcB1Komplett.js';
import {
  PROGRAM as SD1_PROGRAM,
  PROGRAM_KEY as SD1_PROGRAM_KEY,
  allItemIds as sd1AllItemIds,
} from '../src/data/programs/startDeutsch1.js';
import {
  PROGRAM as A11_PROGRAM,
  PROGRAM_KEY as A11_PROGRAM_KEY,
  allItemIds as a11AllItemIds,
} from '../src/data/programs/a11Phase.js';
import {
  PROGRAM as A12_PROGRAM,
  PROGRAM_KEY as A12_PROGRAM_KEY,
  allItemIds as a12AllItemIds,
} from '../src/data/programs/a12Phase.js';
import {
  PROGRAM as A21_PROGRAM,
  PROGRAM_KEY as A21_PROGRAM_KEY,
  allItemIds as a21AllItemIds,
} from '../src/data/programs/a21Phase.js';
import {
  PROGRAM as A22_PROGRAM,
  PROGRAM_KEY as A22_PROGRAM_KEY,
  allItemIds as a22AllItemIds,
} from '../src/data/programs/a22Phase.js';
import {
  PROGRAM as GA2_PROGRAM,
  PROGRAM_KEY as GA2_PROGRAM_KEY,
  allItemIds as ga2AllItemIds,
} from '../src/data/programs/goetheA2Kurs.js';
import { getTopicsForLevel } from '../src/data/grammarTopics.js';
import { LEVEL_COURSES } from '../src/data/pricing.js';
import { FREE_LEVELS } from '../src/config/freeTier.js';
import { readinessFromAttempts } from '../src/services/readiness.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// ---------------------------------------------------------------------------
// 1. Webhook: course order handling
// ---------------------------------------------------------------------------

test('the webhook routes course orders idempotently and handles refunds', () => {
  const src = read('netlify/functions/lemonsqueezy-webhook.mjs');

  assert.ok(src.includes(`case 'order_refunded':`), 'order_refunded case missing — refunds would keep access');
  assert.ok(
    src.includes(`onConflict: 'lemonsqueezy_order_id'`),
    'purchases upsert must key on the LS order id — webhook retries would double-grant otherwise',
  );
  assert.ok(
    src.includes('LEMONSQUEEZY_TELC_B1_VARIANT_ID'),
    'course variant routing must be env-configured, never a hardcoded variant id',
  );
  // The subscription path must stay untouched: course routing returns before
  // the price_paid backfill, and only for a matched variant.
  assert.ok(src.includes('courseForVariant'), 'course routing helper missing');
  // A course order that cannot be attached to a user must fail loudly (500 →
  // LS retries and webhook_logs records it), never be silently dropped.
  assert.ok(
    /no resolvable user/.test(src),
    'unattachable course orders must throw, not warn — a paying customer would silently get nothing',
  );
});

test('every level course has a webhook route and the level surfaces read the entitlement', () => {
  // A product key in pricing.js with no env-var route in the webhook is a
  // product that can be bought and never delivered.
  const webhook = read('netlify/functions/lemonsqueezy-webhook.mjs');
  for (const key of Object.keys(LEVEL_COURSES)) {
    const env = `LEMONSQUEEZY_${key.toUpperCase()}_VARIANT_ID`;
    assert.ok(webhook.includes(`${env}: '${key}'`), `webhook does not route ${env} → ${key}`);
  }
  // The client config must read the matching VITE_ var per product (Vite only
  // inlines statically-named env reads, so this cannot be a loop there).
  const client = read('src/config/lemonsqueezy.js');
  for (const key of Object.keys(LEVEL_COURSES)) {
    assert.ok(client.includes(`VITE_LEMONSQUEEZY_${key.toUpperCase()}_VARIANT_ID`), `lemonsqueezy.js has no checkout id for ${key}`);
  }
  // Every surface that decides whether a level is locked must ask
  // hasLevelAccess(level); reading hasAccess alone shows a lock on a level
  // the user has paid for once its included Pro window lapses.
  for (const file of [
    'src/components/LevelSubscriptionGuard.jsx',
    'src/components/GrammarTopicCard.jsx',
    'src/components/listening/ListeningLevelCard.jsx',
    'src/pages/PodcastsPage.jsx',
    'src/pages/ReadingSectionPage.jsx',
    'src/pages/VocabularySectionPage.jsx',
  ]) {
    const src = read(file);
    assert.ok(src.includes('hasLevelAccess('), `${file} does not gate on hasLevelAccess(level)`);
    assert.ok(!/\bhasAccess\b/.test(src), `${file} still reads the subscription-only hasAccess`);
  }
});

test('a checkout interrupted by signup resumes, and a purchase lands on our success page', () => {
  // /pricing/ stores the clicked product before the signup detour; every
  // post-auth redirect consults it; /subscription opens it once.
  const pricing = read('astro-site/src/pages/pricing.astro');
  assert.ok(pricing.includes("localStorage.setItem('dm_buy_intent'"), 'pricing.astro must store the buy intent before redirecting to signup');
  assert.ok(pricing.includes("'Checkout.Success'"), 'pricing.astro must route the overlay success to /subscription/success');
  for (const file of ['src/pages/VerifyEmailPage.jsx', 'src/pages/LoginPage.jsx']) {
    assert.ok(read(file).includes('postAuthPath()'), `${file} must send authenticated users to the pending checkout`);
  }
  const sub = read('src/pages/SubscriptionPage.jsx');
  assert.ok(sub.includes("searchParams.get('buy')"), '/subscription must honour ?buy=<key>');
  assert.ok(sub.includes('clearBuyIntent()'), 'the intent must be cleared once consumed, or it re-opens forever');
  // The success page and dashboard must resolve a purchases row to a course —
  // via courseForProduct, so a retired band key (course_a2) still shows up.
  assert.ok(read('src/pages/SubscriptionSuccessPage.jsx').includes('courseForProduct('), 'success page is subscription-only');
  assert.ok(read('src/pages/DashboardPage.jsx').includes('courseForProduct('), 'dashboard has no way into a bought level');
});

test('grammar exercises above the free level are gated on the same three doors as the SPA', () => {
  // Decision 2026-09-03: rule text public, exercises need trial / Pro / course.
  const player = read('astro-site/src/components/ExercisePlayer.jsx');
  assert.ok(player.includes("import('../lib/levelAccess.js')"), 'ExercisePlayer must consult levelAccess');
  assert.ok(player.includes('FREE_LEVEL_LABEL'), 'the free level must derive from marketing.js, never a literal');
  assert.ok(!/['"]a1\.1['"]/.test(player), 'no hardcoded free level in the player');
  const access = read('astro-site/src/lib/levelAccess.js');
  for (const door of ['is_subscribed', 'trial_ends_at', 'levelsForProduct']) {
    assert.ok(access.includes(door), `levelAccess.js is missing the ${door} door`);
  }
  assert.ok(read('astro-site/src/pages/grammar/[level]/[slug].astro').includes('level={level}'), 'the lesson page must pass the level to the player');
});

test('the daily sweep expires only active course windows', () => {
  const src = read('netlify/functions/trial-lifecycle.mjs');
  assert.ok(src.includes('expireCourseWindows'), 'course-window sweep missing from the daily run');
  const fn = src.slice(src.indexOf('async function expireCourseWindows'));
  assert.ok(fn.includes(`.eq('plan_type', 'course')`), 'sweep must touch only course rows');
  assert.ok(fn.includes(`.eq('status', 'active')`), 'sweep must not re-expire rows');
  assert.ok(fn.includes(`.lt('subscription_end'`), 'sweep must only expire past-end windows');
});

// ---------------------------------------------------------------------------
// 2. Migration
// ---------------------------------------------------------------------------

test('the migration widens plan_type and keeps purchases client-read-only', () => {
  const sql = read('migrations/2026-08-31-purchases.sql');

  assert.ok(
    /plan_type IN \('monthly', 'yearly', 'quarterly', 'course'\)/.test(sql),
    `migration must admit plan_type 'course' — the webhook writes it for the included Pro window`,
  );
  assert.ok(/CREATE TABLE IF NOT EXISTS public\.purchases/.test(sql), 'purchases table missing');
  assert.ok(/lemonsqueezy_order_id text NOT NULL UNIQUE/.test(sql), 'order-id uniqueness is the idempotency key');

  // Policies on purchases: SELECT only. Any write policy would let a client
  // grant themselves a course.
  const purchasePolicies = [...sql.matchAll(/CREATE POLICY[^;]*ON public\.purchases[^;]*;/gs)].map((m) => m[0]);
  assert.ok(purchasePolicies.length >= 1, 'purchases needs its read-own policy');
  for (const policy of purchasePolicies) {
    assert.ok(/FOR SELECT/.test(policy), `purchases must have no client write policy, found: ${policy.slice(0, 80)}`);
  }

  // program_progress write paths must be scoped WITH CHECK.
  const progressInsert = sql.match(/CREATE POLICY[^;]*ON public\.program_progress\s*FOR INSERT[^;]*;/s);
  assert.ok(progressInsert && /WITH CHECK \(auth\.uid\(\) = user_id\)/.test(progressInsert[0]),
    'program_progress INSERT must carry WITH CHECK (auth.uid() = user_id)');
});

// ---------------------------------------------------------------------------
// 3. Program data integrity
// ---------------------------------------------------------------------------

test('program item ids are unique and grammar hrefs resolve to real topics', () => {
  const ids = allItemIds();
  assert.equal(new Set(ids).size, ids.length, 'duplicate item ids — progress checkboxes would collide');
  assert.ok(ids.length >= 20, 'the 4-week plan should carry at least one item per study day');

  const slugs = {
    'b1.1': new Set(getTopicsForLevel('b1.1').map((t) => t.slug)),
    'b1.2': new Set(getTopicsForLevel('b1.2').map((t) => t.slug)),
  };
  for (const week of PROGRAM.weeks) {
    for (const day of week.days) {
      for (const item of day.items) {
        assert.ok(item.id && item.title && item.href, `item missing fields in ${day.label}`);
        const m = item.href.match(/^\/grammar\/(b1\.[12])\/([a-z0-9-]+)$/);
        if (m) {
          assert.ok(slugs[m[1]].has(m[2]), `${item.href} does not match a real ${m[1]} topic slug`);
        }
      }
    }
  }
  assert.equal(PROGRAM.key, PROGRAM_KEY);
  assert.equal(PROGRAM.weeks.length, 4, 'the offer promises a 4-week plan');
});

// ---------------------------------------------------------------------------
// 4. The three-place route rule for the course area
// ---------------------------------------------------------------------------

test('the course route exists in both App.jsx and the netlify.toml allow-list', () => {
  assert.ok(read('src/App.jsx').includes('path="/telc-b1-kurs"'), 'SPA route missing');
  assert.ok(/from = "\/telc-b1-kurs"/.test(read('netlify.toml')),
    'netlify.toml allow-list entry missing — the route would 404 in production');
});

// ---------------------------------------------------------------------------
// 5. "Start Deutsch 1: die 30-Tage-Prüfungsphase" (sd1_30_tage) — same
//    program-integrity and route-rule pins as telc_b1_komplett above, for the
//    A1-band plan. Gated on LevelSubscriptionGuard (Pro/trial or the A1
//    course), not PurchaseGuard, so no webhook/product-key assertions apply.
// ---------------------------------------------------------------------------

test('sd1_30_tage program item ids are unique and grammar hrefs resolve to real topics', () => {
  const ids = sd1AllItemIds();
  assert.equal(new Set(ids).size, ids.length, 'duplicate item ids — progress checkboxes would collide');

  const slugs = {
    'a1.1': new Set(getTopicsForLevel('a1.1').map((t) => t.slug)),
    'a1.2': new Set(getTopicsForLevel('a1.2').map((t) => t.slug)),
  };
  for (const week of SD1_PROGRAM.weeks) {
    for (const day of week.days) {
      for (const item of day.items) {
        assert.ok(item.id && item.title && item.href, `item missing fields in ${day.label}`);
        // Per-topic lesson links only (`/grammar/<level>/<slug>/`) — the hub
        // link a review item uses (`/grammar/a1.2/`) is not a topic href.
        const m = item.href.match(/^\/grammar\/(a1\.[12])\/([a-z0-9-]+)\/$/);
        if (m) {
          assert.ok(slugs[m[1]].has(m[2]), `${item.href} does not match a real ${m[1]} topic slug`);
        }
      }
    }
  }
  assert.equal(SD1_PROGRAM.key, SD1_PROGRAM_KEY);
  assert.equal(SD1_PROGRAM.weeks.length, 5, 'the plan promises 4 study weeks + a buffer week (30 days)');
});

test('the sd1_30_tage course route exists in both App.jsx and the netlify.toml allow-list', () => {
  assert.ok(read('src/App.jsx').includes('path="/start-deutsch-1-kurs"'), 'SPA route missing');
  assert.ok(/from = "\/start-deutsch-1-kurs"/.test(read('netlify.toml')),
    'netlify.toml allow-list entry missing — the route would 404 in production');
  assert.ok(read('src/App.jsx').includes('<LevelSubscriptionGuard level="a1.2">'),
    'the A1 plan must gate on LevelSubscriptionGuard (Pro/trial or the A1 course), not PurchaseGuard');
});

// ---------------------------------------------------------------------------
// 6. "A1.1-Phase: 28 Tage bis zum Abschlusstest" (a11_phase) — Course Factory
//    Wave 2 PR D. Same program-integrity and route-rule pins as sd1_30_tage
//    above, for the FIRST half of the A1 band. Gated on LevelSubscriptionGuard
//    (level="a1.1", a FREE level, so open to every logged-in user) — still not
//    PurchaseGuard, so no webhook/product-key assertions apply here either.
// ---------------------------------------------------------------------------

test('a11_phase program item ids are unique and grammar hrefs resolve to real a1.1 topics', () => {
  const ids = a11AllItemIds();
  assert.equal(new Set(ids).size, ids.length, 'duplicate item ids — progress checkboxes would collide');

  const a11Slugs = new Set(getTopicsForLevel('a1.1').map((t) => t.slug));
  for (const week of A11_PROGRAM.weeks) {
    for (const day of week.days) {
      for (const item of day.items) {
        assert.ok(item.id && item.title && item.href, `item missing fields in ${day.label}`);
        const m = item.href.match(/^\/grammar\/(a1\.1)\/([a-z0-9-]+)\/$/);
        if (m) {
          assert.ok(a11Slugs.has(m[2]), `${item.href} does not match a real a1.1 topic slug`);
        }
      }
    }
  }
  assert.equal(A11_PROGRAM.key, A11_PROGRAM_KEY);
  assert.equal(A11_PROGRAM.weeks.length, 4, 'the plan promises 4 study weeks (28 days)');
});

test('the a11_phase course route exists in both App.jsx and the netlify.toml allow-list', () => {
  assert.ok(read('src/App.jsx').includes('path="/a1-1-phase"'), 'SPA route missing');
  assert.ok(/from = "\/a1-1-phase"/.test(read('netlify.toml')),
    'netlify.toml allow-list entry missing — the route would 404 in production');
  assert.ok(read('src/App.jsx').includes('<LevelSubscriptionGuard level="a1.1">'),
    'the A1.1 plan must gate on LevelSubscriptionGuard(level="a1.1"), the free-level branch');
});

test('the readiness service backs both the result screen and the dashboard exam goal card', () => {
  const resultSrc = read('src/pages/Modelltest/ModelltestResult.jsx');
  const dashboardSrc = read('src/pages/DashboardPage.jsx');
  assert.match(resultSrc, /readinessFromAttempts/, 'ModelltestResult must read readiness from the shared service');
  assert.match(dashboardSrc, /readinessFromAttempts/, 'DashboardPage exam goal card must read readiness from the shared service');
  // A quick end-to-end sanity check on the function both pages call.
  const ready = readinessFromAttempts([
    { status: 'completed', score: 80, max_score: 100, completed_at: '2026-09-01' },
    { status: 'completed', score: 75, max_score: 100, completed_at: '2026-09-03' },
  ]);
  assert.equal(ready.ready, true);
});

// ---------------------------------------------------------------------------
// 7. "A1.2-Phase: 28 Tage bis zum Abschlusstest" (a12_phase) — Course Factory
//    Wave 3 PR D. Same pins as the a11_phase block above, for the SECOND half
//    of the A1 band — with one difference that matters: a1.2 is NOT a free
//    level, so LevelSubscriptionGuard(level="a1.2") is a real paid gate
//    (Pro/trial or the A1 course, via hasLevelAccess), the same one
//    /level/a1.2 and /start-deutsch-1-kurs already use. Still not
//    PurchaseGuard, so no webhook/product-key assertions apply here either.
// ---------------------------------------------------------------------------

// Every internal href a plan item may carry, by route class — an item
// pointing anywhere else is a dead link on the course page.
const KNOWN_SPA_ROUTES = [
  /^\/vocabulary$/, /^\/level\/[ab][12]\.[12]$/, /^\/reading\/[ab][12]\.[12]$/,
  /^\/listening\/[ab][12]\.[12]\/[1-6]$/, /^\/schreiben\/[a-z0-9-]+$/, /^\/modelltest\/[a-z0-9-]+$/,
  /^\/start-deutsch-1-kurs$/, /^\/goethe-a2-kurs$/, /^\/a1-[12]-phase$/, /^\/a2-[12]-phase$/,
];
const KNOWN_SLASH_ROUTES = [/^\/speaking\/$/, /^\/analyze\/$/]; // prerendered SPA routes (case 2)
const KNOWN_ASTRO = [/^\/grammar\/[ab][12]\.[12]\/(?:[a-z0-9-]+\/)?$/, /^\/leitfaden\/[a-z0-9-]+\/$/]; // case 1

test('a12_phase program item ids are unique and grammar hrefs resolve to real a1.2 topics', () => {
  const ids = a12AllItemIds();
  assert.equal(new Set(ids).size, ids.length, 'duplicate item ids — progress checkboxes would collide');

  const a12Slugs = new Set(getTopicsForLevel('a1.2').map((t) => t.slug));
  for (const week of A12_PROGRAM.weeks) {
    for (const day of week.days) {
      for (const item of day.items) {
        assert.ok(item.id && item.title && item.href, `item missing fields in ${day.label}`);
        const m = item.href.match(/^\/grammar\/(a1\.2)\/([a-z0-9-]+)\/$/);
        if (m) {
          assert.ok(a12Slugs.has(m[2]), `${item.href} does not match a real a1.2 topic slug`);
        }
      }
    }
  }
  assert.equal(A12_PROGRAM.key, A12_PROGRAM_KEY);
  assert.equal(A12_PROGRAM.weeks.length, 4, 'the plan promises 4 study weeks (28 days)');
  assert.equal(A12_PROGRAM.weeks.reduce((n, w) => n + w.days.length, 0), 28);
});

test('every a11_phase, a12_phase and a21_phase href resolves to a known SPA route or Astro page', () => {
  const appSrc = read('src/App.jsx');
  const guideSlugs = readdirSync(join(ROOT, 'astro-site/src/data/guides')).map((f) => f.replace(/\.js$/, ''));
  for (const program of [A11_PROGRAM, A12_PROGRAM, A21_PROGRAM, A22_PROGRAM]) {
    for (const week of program.weeks) {
      for (const day of week.days) {
        for (const item of day.items) {
          const h = item.href;
          const astro = KNOWN_ASTRO.some((re) => re.test(h));
          const spa = KNOWN_SPA_ROUTES.some((re) => re.test(h));
          const slashSpa = KNOWN_SLASH_ROUTES.some((re) => re.test(h));
          assert.ok(astro || spa || slashSpa, `${program.key} ${day.label}: unknown href ${h}`);
          assert.equal(!!item.external, astro, `${program.key} ${h}: external must be set exactly for Astro-served pages`);
          const guide = h.match(/^\/leitfaden\/([a-z0-9-]+)\/$/);
          if (guide) assert.ok(guideSlugs.includes(guide[1]), `${h}: no such guide`);
          const exact = h.match(/^(\/[a-z0-9-]+)$/);
          if (exact) assert.ok(appSrc.includes(`path="${exact[1]}"`), `${h}: no exact SPA route in App.jsx`);
        }
      }
    }
  }
  // The A1.1 plan hands off to the A1.2 plan, the A1.2 plan to the 30-day SD1
  // plan, the A2.1 plan to the A2.2 plan and the A2.2 plan to the 30-day
  // Goethe-A2 plan — never an A1 learner into A2.1.
  const lastA11 = A11_PROGRAM.weeks.at(-1).days.at(-1).items.at(-1);
  const lastA12 = A12_PROGRAM.weeks.at(-1).days.at(-1).items.at(-1);
  const lastA21 = A21_PROGRAM.weeks.at(-1).days.at(-1).items.at(-1);
  const lastA22 = A22_PROGRAM.weeks.at(-1).days.at(-1).items.at(-1);
  assert.equal(lastA11.href, '/a1-2-phase');
  assert.equal(lastA12.href, '/start-deutsch-1-kurs');
  assert.equal(lastA21.href, '/a2-2-phase'); // flipped from /level/a2.2 in Wave 5 PR D2
  assert.equal(lastA22.href, '/goethe-a2-kurs'); // flipped from /modelltest/goethe-a2 in Wave 6 PR B
});

test('the a12_phase course route exists in both App.jsx and the netlify.toml allow-list, behind the paid a1.2 gate', () => {
  const appSrc = read('src/App.jsx');
  assert.ok(appSrc.includes('path="/a1-2-phase"'), 'SPA route missing');
  assert.ok(/from = "\/a1-2-phase"/.test(read('netlify.toml')),
    'netlify.toml allow-list entry missing — the route would 404 in production');
  const routeBlock = appSrc.slice(appSrc.indexOf('path="/a1-2-phase"'), appSrc.indexOf('path="/a1-2-phase"') + 400);
  assert.match(routeBlock, /<LevelSubscriptionGuard level="a1\.2">\s*<EmailVerificationGate>\s*<A12PhasePage \/>/,
    'the A1.2 plan must gate on LevelSubscriptionGuard(level="a1.2") — a paid level, unlike a1.1');
  assert.ok(!FREE_LEVELS.includes('a1.2'), 'a1.2 must stay a paid level for that gate to mean anything');
  const pageSrc = read('src/pages/A12PhasePage.jsx');
  assert.match(pageSrc, /programs\/a12Phase/);
  assert.match(pageSrc, /\/modelltest\/abschlusstest-a1-2/);
});

// ---------------------------------------------------------------------------
// 8. "A2.1-Phase: 28 Tage bis zum Abschlusstest" (a21_phase) — Course Factory
//    Wave 4 PR D2. Same pins as the a12_phase block: a2.1 is a paid level, so
//    LevelSubscriptionGuard(level="a2.1") is the real gate (Pro/trial or the
//    A2 course via hasLevelAccess). The plan ends at its own course test and
//    hands off to the A2.2 level page — there is no A2.2 plan yet.
// ---------------------------------------------------------------------------

test('a21_phase program item ids are unique and grammar hrefs resolve to real a2.1 topics', () => {
  const ids = a21AllItemIds();
  assert.equal(new Set(ids).size, ids.length, 'duplicate item ids — progress checkboxes would collide');

  const a21Slugs = new Set(getTopicsForLevel('a2.1').map((t) => t.slug));
  const lessonSlugs = new Set();
  for (const week of A21_PROGRAM.weeks) {
    for (const day of week.days) {
      for (const item of day.items) {
        assert.ok(item.id && item.title && item.href, `item missing fields in ${day.label}`);
        const m = item.href.match(/^\/grammar\/(a2\.1)\/([a-z0-9-]+)\/$/);
        if (m) {
          assert.ok(a21Slugs.has(m[2]), `${item.href} does not match a real a2.1 topic slug`);
          if (item.type === 'lesson') lessonSlugs.add(m[2]);
        }
      }
    }
  }
  assert.equal(lessonSlugs.size, 12, 'every one of the 12 a2.1 topics gets a lesson day');
  assert.equal(A21_PROGRAM.key, A21_PROGRAM_KEY);
  assert.equal(A21_PROGRAM.weeks.length, 4, 'the plan promises 4 study weeks (28 days)');
  assert.equal(A21_PROGRAM.weeks.reduce((n, w) => n + w.days.length, 0), 28);
});

test('the a21_phase course route exists in both App.jsx and the netlify.toml allow-list, behind the paid a2.1 gate', () => {
  const appSrc = read('src/App.jsx');
  assert.ok(appSrc.includes('path="/a2-1-phase"'), 'SPA route missing');
  assert.ok(/from = "\/a2-1-phase"/.test(read('netlify.toml')),
    'netlify.toml allow-list entry missing — the route would 404 in production');
  const routeBlock = appSrc.slice(appSrc.indexOf('path="/a2-1-phase"'), appSrc.indexOf('path="/a2-1-phase"') + 400);
  assert.match(routeBlock, /<LevelSubscriptionGuard level="a2\.1">\s*<EmailVerificationGate>\s*<A21PhasePage \/>/,
    'the A2.1 plan must gate on LevelSubscriptionGuard(level="a2.1") — a paid level');
  assert.ok(!FREE_LEVELS.includes('a2.1'), 'a2.1 must stay a paid level for that gate to mean anything');
  const pageSrc = read('src/pages/A21PhasePage.jsx');
  assert.match(pageSrc, /programs\/a21Phase/);
  assert.match(pageSrc, /\/modelltest\/abschlusstest-a2-1/);
  // The hub, the level page and the result screen all know the plan / the next level.
  assert.match(read('src/pages/Modelltest/ModelltestHub.jsx'), /'a2\.1': '\/a2-1-phase'/);
  assert.match(read('src/pages/LevelPage.jsx'), /'a2\.1': \{ href: '\/a2-1-phase'/);
  assert.match(read('src/pages/Modelltest/ModelltestResult.jsx'), /'a2\.1': \{[\s\S]*?to: '\/a2-2-phase'/);
});

// ---------------------------------------------------------------------------
// 9. "A2.2-Phase: 28 Tage bis zum Abschlusstest" (a22_phase) — Course Factory
//    Wave 5 PR D2. Same pins as the a21_phase block: a2.2 is a paid level, so
//    LevelSubscriptionGuard(level="a2.2") is the real gate (Pro/trial or the
//    A2 course via hasLevelAccess). The plan ends at its own course test and
//    hands off to the Goethe-A2 Übungstest (Kurzversion) — the band's mock.
// ---------------------------------------------------------------------------

test('a22_phase program item ids are unique and grammar hrefs resolve to real a2.2 topics', () => {
  const ids = a22AllItemIds();
  assert.equal(new Set(ids).size, ids.length, 'duplicate item ids — progress checkboxes would collide');

  const a22Slugs = new Set(getTopicsForLevel('a2.2').map((t) => t.slug));
  const lessonSlugs = new Set();
  for (const week of A22_PROGRAM.weeks) {
    for (const day of week.days) {
      for (const item of day.items) {
        assert.ok(item.id && item.title && item.href, `item missing fields in ${day.label}`);
        const m = item.href.match(/^\/grammar\/(a2\.2)\/([a-z0-9-]+)\/$/);
        if (m) {
          assert.ok(a22Slugs.has(m[2]), `${item.href} does not match a real a2.2 topic slug`);
          if (item.type === 'lesson') lessonSlugs.add(m[2]);
        }
      }
    }
  }
  assert.equal(lessonSlugs.size, 12, 'every one of the 12 a2.2 topics gets a lesson day');
  assert.equal(A22_PROGRAM.key, A22_PROGRAM_KEY);
  assert.equal(A22_PROGRAM.weeks.length, 4, 'the plan promises 4 study weeks (28 days)');
  assert.equal(A22_PROGRAM.weeks.reduce((n, w) => n + w.days.length, 0), 28);
});

test('the a22_phase course route exists in both App.jsx and the netlify.toml allow-list, behind the paid a2.2 gate', () => {
  const appSrc = read('src/App.jsx');
  assert.ok(appSrc.includes('path="/a2-2-phase"'), 'SPA route missing');
  assert.ok(/from = "\/a2-2-phase"/.test(read('netlify.toml')),
    'netlify.toml allow-list entry missing — the route would 404 in production');
  const routeBlock = appSrc.slice(appSrc.indexOf('path="/a2-2-phase"'), appSrc.indexOf('path="/a2-2-phase"') + 400);
  assert.match(routeBlock, /<LevelSubscriptionGuard level="a2\.2">\s*<EmailVerificationGate>\s*<A22PhasePage \/>/,
    'the A2.2 plan must gate on LevelSubscriptionGuard(level="a2.2") — a paid level');
  assert.ok(!FREE_LEVELS.includes('a2.2'), 'a2.2 must stay a paid level for that gate to mean anything');
  const pageSrc = read('src/pages/A22PhasePage.jsx');
  assert.match(pageSrc, /programs\/a22Phase/);
  assert.match(pageSrc, /\/modelltest\/abschlusstest-a2-2/);
  // The hub, the level page and the result screen all know the plan / the next step.
  assert.match(read('src/pages/Modelltest/ModelltestHub.jsx'), /'a2\.2': '\/a2-2-phase'/);
  assert.match(read('src/pages/LevelPage.jsx'), /'a2\.2': \{ href: '\/a2-2-phase'/);
  assert.match(read('src/pages/Modelltest/ModelltestResult.jsx'), /'a2\.2': \{[\s\S]*?to: '\/goethe-a2-kurs'/);
});

// ---------------------------------------------------------------------------
// 10. "Goethe-Zertifikat A2: 30 Tage bis zur Prüfung" (goethe_a2_30_tage) —
//     Course Factory Wave 6 PR B. The A2 band's twin of sd1_30_tage: an
//     exam-rehearsal plan over EXISTING A2.1 + A2.2 content (nothing new is
//     taught), gated on LevelSubscriptionGuard(level="a2.2") (Pro/trial or
//     the A2 course), not PurchaseGuard. Unlike the phase plans it links the
//     two official Goethe PDFs, so it is kept out of the href sweep above and
//     gets its own sweep that admits exactly those external URLs.
// ---------------------------------------------------------------------------

test('goethe_a2_30_tage program item ids are unique and grammar hrefs resolve to real a2.1/a2.2 topics', () => {
  const ids = ga2AllItemIds();
  assert.equal(new Set(ids).size, ids.length, 'duplicate item ids — progress checkboxes would collide');
  const slugs = {
    'a2.1': new Set(getTopicsForLevel('a2.1').map((t) => t.slug)),
    'a2.2': new Set(getTopicsForLevel('a2.2').map((t) => t.slug)),
  };
  for (const week of GA2_PROGRAM.weeks) {
    for (const day of week.days) {
      for (const item of day.items) {
        assert.ok(item.id && item.title && item.href, `item missing fields in ${day.label}`);
        const m = item.href.match(/^\/grammar\/(a2\.[12])\/([a-z0-9-]+)\/$/);
        if (m) assert.ok(slugs[m[1]].has(m[2]), `${item.href} does not match a real ${m[1]} topic slug`);
        assert.ok(!/^\/grammar\/(?:a1|b[12])\./.test(item.href), `${item.href}: the A2 exam plan must stay inside the A2 band`);
      }
    }
  }
  assert.equal(GA2_PROGRAM.key, GA2_PROGRAM_KEY);
  assert.equal(GA2_PROGRAM.weeks.length, 5, 'the plan promises 4 study weeks + a buffer week (30 days)');
  assert.equal(GA2_PROGRAM.weeks.reduce((n, w) => n + w.days.length, 0), 30);
});

test('every goethe_a2_30_tage href resolves to a known route, an Astro page or one of the two official Goethe PDFs', () => {
  const appSrc = read('src/App.jsx');
  const guideSlugs = readdirSync(join(ROOT, 'astro-site/src/data/guides')).map((f) => f.replace(/\.js$/, ''));
  const officialPdfs = new Set();
  for (const week of GA2_PROGRAM.weeks) {
    for (const day of week.days) {
      for (const item of day.items) {
        const h = item.href;
        if (/^https:\/\/www\.goethe\.de\//.test(h)) {
          assert.ok(item.external, `${h}: an off-site PDF must be a plain <a>, not a router Link`);
          officialPdfs.add(h);
          continue;
        }
        const astro = KNOWN_ASTRO.some((re) => re.test(h));
        const spa = KNOWN_SPA_ROUTES.some((re) => re.test(h));
        const slashSpa = KNOWN_SLASH_ROUTES.some((re) => re.test(h));
        assert.ok(astro || spa || slashSpa, `${GA2_PROGRAM.key} ${day.label}: unknown href ${h}`);
        assert.equal(!!item.external, astro, `${GA2_PROGRAM.key} ${h}: external must be set exactly for Astro-served pages`);
        const guide = h.match(/^\/leitfaden\/([a-z0-9-]+)\/$/);
        if (guide) assert.ok(guideSlugs.includes(guide[1]), `${h}: no such guide`);
        const exact = h.match(/^(\/[a-z0-9-]+)$/);
        if (exact) assert.ok(appSrc.includes(`path="${exact[1]}"`), `${h}: no exact SPA route in App.jsx`);
      }
    }
  }
  assert.equal(officialPdfs.size, 2, 'exactly the Modellsatz and the Übungssatz (Erwachsene) — never an invented third set');
  // The plan is built around the band's mock: it is gewertet twice, and it is
  // the very last item, so the plan ends on the real rehearsal.
  const mockItems = GA2_PROGRAM.weeks.flatMap((w) => w.days.flatMap((d) => d.items)).filter((i) => i.href === '/modelltest/goethe-a2');
  assert.ok(mockItems.length >= 2, 'the Kurzversion mock must be run at least twice');
  assert.equal(GA2_PROGRAM.weeks.at(-1).days.at(-1).items.at(-1).href, '/modelltest/goethe-a2');
});

test('the goethe_a2_30_tage course route exists in App.jsx and the netlify.toml allow-list, behind the a2.2 band gate', () => {
  const appSrc = read('src/App.jsx');
  assert.ok(appSrc.includes('path="/goethe-a2-kurs"'), 'SPA route missing');
  assert.ok(/from = "\/goethe-a2-kurs"/.test(read('netlify.toml')),
    'netlify.toml allow-list entry missing — the route would 404 in production');
  const routeBlock = appSrc.slice(appSrc.indexOf('path="/goethe-a2-kurs"'), appSrc.indexOf('path="/goethe-a2-kurs"') + 400);
  assert.match(routeBlock, /<LevelSubscriptionGuard level="a2\.2">\s*<EmailVerificationGate>\s*<GoetheA2KursPage \/>/,
    'the A2 exam plan must gate on LevelSubscriptionGuard(level="a2.2") — the band top, like sd1 on a1.2');
  const pageSrc = read('src/pages/GoetheA2KursPage.jsx');
  assert.match(pageSrc, /programs\/goetheA2Kurs/);
  assert.match(pageSrc, /\/modelltest\/goethe-a2/);
  // Both examTracks twins send the hub's course button to the plan (the
  // duplicate check keeps them byte-identical; this pins the value).
  assert.match(read('src/data/examTracks.js'), /guideSlug: 'goethe-a2',[\s\S]*?courseHref: '\/goethe-a2-kurs'/);
  assert.match(read('astro-site/src/data/examTracks.js'), /guideSlug: 'goethe-a2',[\s\S]*?courseHref: '\/goethe-a2-kurs'/);
});
