// Guard suite for the lifecycle email jobs. Run with `npm test`.
//
// What it pins, and why each pin exists:
//
//   1. WINDOW DISJOINTNESS. The trial sequence (trial-lifecycle.mjs) fires on
//      fixed days from signup; the activation sequence must not land on the
//      same day, or a stalled user gets two lifecycle mails in one morning.
//      The trial days are hardcoded here WITH their source locations — if you
//      move a trial window, update this table in the same commit or the test
//      will pin the old reality.
//
//   2. CLAIM DISCIPLINE. Activation copy asserts the reader has not started a
//      lesson, so the code path that keeps that true (the eligibility re-read
//      before the claim, the master switch, claim-before-send) is asserted
//      structurally against the source.
//
//   3. COPY BANS. Same bans as everywhere else: no price digits (the function
//      cannot import src/data, so the safe rule is no figures at all), no
//      "unlimited", and CTA links to prerendered routes must carry their
//      trailing slash (CLAUDE.md's three-slash-case rule).
//
//   6. THE TRIAL-END COURSE OFFER. The day-6 and trial-ended mails offer the
//      one-time course for the learner's level beside Pro (2026-09-27, after
//      0 of 180 ended trials converted on a Pro-only offer). Pinned: only a
//      buyable course is ever offered, its price and Pro window are the data
//      layer's, every site link carries utm_*=email/lifecycle/<kind> and the
//      unsubscribe link is untouched, and the trial windows plus
//      claim-before-send are what section 1's table says they are.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { WINDOWS, TEMPLATES } from '../netlify/functions/activation-lifecycle.mjs';
import * as trial from '../netlify/functions/trial-lifecycle.mjs';
import {
  ALL_LEVELS,
  SUBLEVEL_PRICES_EUR,
  SELLABLE_LEVELS,
  COMING_SOON_LEVELS,
  COURSE_PRO_MONTHS,
  MONTHLY_PRICE_EUR,
  eur,
  productKeyForLevel,
} from '../src/data/pricing.js';
import { levelToSlug } from '../astro-site/src/data/courseContents.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// ---------------------------------------------------------------------------
// 1. Windows
// ---------------------------------------------------------------------------

// Days-from-signup ranges the TRIAL sequence occupies, for a 7-day trial.
// Sources: netlify/functions/trial-lifecycle.mjs selectRecipients() —
//   trial_day3  selects trial_started_at in [3,4) days ago            → day 3
//   trial_day6  selects trial_ends_at within the next 24h             → day 6–7
//   trial_ended selects trial_ends_at 1–2 days ago                    → day 8–9
const TRIAL_OCCUPIED = [
  [3, 4],
  [6, 7],
  [8, 9],
];

const overlaps = ([a1, a2], [b1, b2]) => a1 < b2 && b1 < a2;

test('activation windows are pinned and sane', () => {
  assert.deepEqual(WINDOWS.activation_d1, { lowerDays: 1, upperDays: 2 });
  assert.deepEqual(WINDOWS.activation_d4, { lowerDays: 4, upperDays: 5 });
  for (const [kind, w] of Object.entries(WINDOWS)) {
    assert.ok(w.lowerDays >= 1, `${kind} would mail within 24h of signup — too soon after the welcome mail`);
    assert.ok(w.lowerDays < w.upperDays, `${kind} window is empty or inverted`);
  }
});

test('activation windows never land on a trial-mail day', () => {
  for (const [kind, w] of Object.entries(WINDOWS)) {
    for (const trial of TRIAL_OCCUPIED) {
      assert.ok(
        !overlaps([w.lowerDays, w.upperDays], trial),
        `${kind} [${w.lowerDays},${w.upperDays}) collides with a trial-sequence day [${trial}) — a stalled user would get two lifecycle mails in one day`,
      );
    }
  }
});

// ---------------------------------------------------------------------------
// 2. The code paths that keep the copy honest
// ---------------------------------------------------------------------------

test('the function ships off, re-checks eligibility, and claims before sending', () => {
  const src = read('netlify/functions/activation-lifecycle.mjs');

  // Master switch: exact-string gate, so a typo'd value stays off.
  assert.ok(
    src.includes(`process.env.LIFECYCLE_ACTIVATION_ENABLED !== 'true'`),
    'master switch gate missing — the job would run by default',
  );

  // The eligibility re-read must happen inside the send loop, before the claim.
  const loopBody = src.slice(src.indexOf('for (let i = 0; i < recipients.length'));
  const recheckAt = loopBody.indexOf('recheckStillNew(');
  const claimAt = loopBody.indexOf(".upsert(");
  assert.ok(recheckAt !== -1, 'eligibility re-read missing from the send loop');
  assert.ok(claimAt !== -1, 'claim upsert missing from the send loop');
  assert.ok(recheckAt < claimAt, 'eligibility must be re-read BEFORE the claim, not after');

  // Claim-before-send with the shared unique key.
  assert.ok(src.includes(`onConflict: 'user_id,kind'`), 'claim must use the lifecycle_emails unique key');

  // Selection reads the one shared definition of funnel status.
  assert.ok(src.includes(`from('lifecycle_customer_state')`), 'selection must read lifecycle_customer_state');
});

test('the migration admits the new kinds and defines the view', () => {
  const sql = read('migrations/2026-08-22-activation-lifecycle.sql');
  for (const kind of Object.keys(WINDOWS)) {
    assert.ok(sql.includes(`'${kind}'`), `migration does not admit kind ${kind} — the claim insert would fail`);
  }
  assert.ok(sql.includes('lifecycle_customer_state'), 'migration must create the funnel-state view');
  assert.ok(/REVOKE ALL ON public\.lifecycle_customer_state FROM anon, authenticated/.test(sql), 'view must not be client-readable');
});

// ---------------------------------------------------------------------------
// 3. Copy bans
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 4. Confirmation nudge (the third job — unconfirmed accounts only)
// ---------------------------------------------------------------------------
//
// Its audience is the mirror image of the other two: trial and activation
// mail ONLY confirmed users; the nudge mails ONLY unconfirmed ones. That
// disjointness replaces window arithmetic, and it is what these pins defend.

test('the nudge ships off, claims before sending, and mails only unconfirmed accounts', () => {
  const src = read('netlify/functions/confirmation-nudge.mjs');

  assert.ok(
    src.includes(`process.env.CONFIRM_NUDGE_ENABLED !== 'true'`),
    'master switch gate missing — the nudge would run by default',
  );

  // Audience disjointness: selection keeps only users WITHOUT a confirmation
  // timestamp, while both other jobs filter the opposite way.
  assert.ok(src.includes('!u.email_confirmed_at'), 'selection must keep only unconfirmed users');
  for (const other of ['netlify/functions/trial-lifecycle.mjs', 'netlify/functions/activation-lifecycle.mjs']) {
    assert.ok(
      read(other).includes('u.email_confirmed_at)'),
      `${other} no longer filters to confirmed users — the audiences would overlap`,
    );
  }

  // Claim-before-send with the shared unique key, and the claim precedes the
  // Resend call in source order.
  assert.ok(src.includes(`onConflict: 'user_id,kind'`), 'claim must use the lifecycle_emails unique key');
  assert.ok(src.indexOf('.upsert(') < src.indexOf('await sendBatch(resendKey'), 'claim must come BEFORE the send');

  // Hygiene: disposable domains and opted-out profiles are excluded, the
  // per-run cap exists, and the copy's "only reminder" promise is structural.
  assert.ok(src.includes('isBlockedEmail'), 'disposable-domain hygiene missing');
  assert.ok(src.includes(`eq('email_daily_sentence', false)`), 'opt-out exclusion missing');
  assert.ok(/PER_RUN\s*=\s*\d+/.test(src), 'per-run send cap missing');
});

test('nudge copy keeps its promises and carries no figures', async () => {
  const { bodyHtml, MIN_AGE_DAYS, MAX_AGE_DAYS, PER_RUN } = await import('../netlify/functions/confirmation-nudge.mjs');
  const html = bodyHtml('https://deutsch-meister.de/.netlify/functions/confirm-continue?uid=x&exp=1&token=y');
  // "It's the only reminder we'll send" is made true by the ledger; the copy
  // must keep saying it as long as the ledger enforces it (and vice versa).
  assert.ok(/only reminder/.test(html), 'the one-shot promise left the copy — re-check it against the ledger');
  assert.ok(!/€\s?\d|\d+[.,]\d\d\s?€/.test(html), 'price figure in nudge copy');
  assert.ok(!/\b(unbegrenzt\w*|unlimited)\b/i.test(html), 'unlimited claim in nudge copy');
  assert.ok(MIN_AGE_DAYS >= 1, 'nudging within a day of signup races the normal confirmation email');
  assert.ok(MAX_AGE_DAYS <= 90, 'mailing addresses older than 90 days is a deliverability risk');
  assert.ok(PER_RUN <= 100, 'per-run cap too high for a cold-ish list');
});

test('confirm-continue verifies an expiring token and never links confirmed accounts', () => {
  const src = read('netlify/functions/confirm-continue.mjs');
  // exp is part of the signed string AND checked against the clock.
  assert.ok(src.includes('`confirm:${userId}:${expEpochSeconds}`'), 'exp must be inside the HMAC input');
  assert.ok(src.includes('expNum * 1000 < Date.now()'), 'token expiry check missing');
  assert.ok(src.includes('timingSafeEqual'), 'token comparison must be constant-time');
  // Already-confirmed users get the login page, not a fresh session link.
  assert.ok(src.indexOf('email_confirmed_at) return redirect') !== -1, 'confirmed accounts must not be re-linked');
});

test('the nudge migration admits the confirm_nudge kind', () => {
  const sql = read('migrations/2026-09-02-confirmation-nudge.sql');
  assert.ok(sql.includes(`'confirm_nudge'`), 'migration does not admit confirm_nudge');
  // And it must keep admitting every kind the other jobs still use.
  for (const kind of ['trial_day3', 'trial_day6', 'trial_ended', 'activation_d1', 'activation_d4']) {
    assert.ok(sql.includes(`'${kind}'`), `migration dropped kind ${kind} — existing jobs would fail to claim`);
  }
});

// ---------------------------------------------------------------------------
// 5. Copy bans (activation)
// ---------------------------------------------------------------------------

test('activation copy carries no figures, no unlimited claims, and slashed CTAs', () => {
  assert.ok(Object.keys(TEMPLATES).length >= 2, 'templates missing');
  for (const [kind, tpl] of Object.entries(TEMPLATES)) {
    const text = `${tpl.subject} ${tpl.body}`;
    // No euro amounts or big counts: the function cannot import src/data, so
    // any figure here would be retyped and would rot. "10 minutes" is time,
    // not a product claim, and is allowed explicitly.
    assert.ok(!/€\s?\d|\d+[.,]\d\d\s?€/.test(text), `${kind}: price figure in copy`);
    assert.ok(!/\b(unbegrenzt\w*|unlimited)\b/i.test(text), `${kind}: unlimited claim`);
    // Prerendered SPA routes must be linked with the trailing slash.
    assert.ok(/\/$/.test(tpl.ctaHref), `${kind}: CTA "${tpl.ctaHref}" missing its trailing slash — 301 on every click`);
  }
});

// ---------------------------------------------------------------------------
// 6. The trial-end course offer (trial-lifecycle.mjs)
// ---------------------------------------------------------------------------

const SITE = 'https://deutsch-meister.de';
const UNSUB = `${SITE}/.netlify/functions/unsubscribe?uid=u1&token=t1`;
/** Every buyable course's webhook variant set — production once all of them are live. */
const ENV_ALL = Object.fromEntries(SELLABLE_LEVELS.map((l) => [trial.courseVariantEnv(l), 'variant-id']));
/** The first priced level on the ladder: the step after the free course. */
const FIRST_PAID = ALL_LEVELS.find((l) => SUBLEVEL_PRICES_EUR[l] !== undefined);
const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
const render = (kind, offer) => trial.renderEmail(kind, { offer, unsubUrl: UNSUB }).html;

test('the trial-end offer is the course for the learner\'s level, and only ever a buyable one', () => {
  for (const level of ALL_LEVELS) {
    for (const stored of [level.toUpperCase(), level]) {
      const offer = trial.courseOfferFor(stored, ENV_ALL);
      if (COMING_SOON_LEVELS.includes(level)) {
        // Never a coming-soon course, and never a course BELOW the placement.
        assert.equal(offer, null, `${stored}: a coming-soon level must get no course offer`);
      } else if (SUBLEVEL_PRICES_EUR[level] === undefined) {
        assert.equal(offer.level, FIRST_PAID, `${stored}: placed at the free level → the next paid level`);
        assert.equal(offer.placed, false);
      } else {
        assert.equal(offer.level, level, `${stored}: placed at a buyable level → that level's course`);
        assert.equal(offer.placed, true);
      }
    }
  }
  // Never placed: the column's 'a1' default is a band, not a placement.
  for (const unplaced of ['a1', 'A1', null, undefined, '', 'nonsense']) {
    const offer = trial.courseOfferFor(unplaced, ENV_ALL);
    assert.equal(offer?.level, FIRST_PAID, `${unplaced}: unplaced learners get the step after the free course`);
    assert.equal(offer.placed, false);
  }
  // Every offer is sellable, priced by the data layer, keyed like the webhook.
  for (const stored of [...ALL_LEVELS, 'a1', null]) {
    const offer = trial.courseOfferFor(stored, ENV_ALL);
    if (!offer) continue;
    assert.ok(SELLABLE_LEVELS.includes(offer.level), `${offer.level} is not for sale`);
    assert.equal(offer.price, SUBLEVEL_PRICES_EUR[offer.level]);
    assert.equal(offer.key, productKeyForLevel(offer.level));
  }
});

test('no webhook variant configured → no course offer (never a sale the webhook cannot fulfil)', () => {
  for (const stored of [...ALL_LEVELS, 'a1', null]) {
    assert.equal(trial.courseOfferFor(stored, {}), null, `${stored}: offered a course with no variant configured`);
  }
  // Only one course configured: an unplaced learner does NOT slide up to it.
  const only = { [trial.courseVariantEnv('a2.1')]: 'variant-id' };
  assert.equal(trial.courseOfferFor('a1', only), null);
  assert.equal(trial.courseOfferFor('A2.1', only)?.level, 'a2.1');
});

test('a coming-soon course is never offered, even once its variant env var exists', () => {
  // The owner may create a B1 variant before the course is rebuilt; the data
  // layer's coming-soon list, not the env, decides whether it is for sale.
  const every = Object.fromEntries(Object.keys(SUBLEVEL_PRICES_EUR).map((l) => [trial.courseVariantEnv(l), 'variant-id']));
  for (const level of COMING_SOON_LEVELS) {
    assert.equal(trial.courseOfferFor(level.toUpperCase(), every), null, `${level} offered while coming soon`);
  }
});

test('the env var the offer checks is the one the webhook maps to that product', () => {
  const webhook = read('netlify/functions/lemonsqueezy-webhook.mjs');
  for (const level of SELLABLE_LEVELS) {
    const line = `${trial.courseVariantEnv(level)}: '${productKeyForLevel(level)}'`;
    assert.ok(webhook.includes(line), `webhook has no "${line}" — a sale from the mail would grant nothing`);
  }
});

test('the course link is the level\'s real sales page, with its trailing slash', () => {
  for (const level of SELLABLE_LEVELS) {
    assert.equal(trial.coursePath(level), `/courses/${levelToSlug(level)}/`);
  }
  assert.ok(read('astro-site/src/pages/courses/[level].astro').includes('ALL_LEVELS.map'), 'the course pages no longer cover every level');
});

test('day 6 and trial-ended offer Pro AND the course, at the data layer\'s figures', () => {
  for (const stored of ['a1', ...SELLABLE_LEVELS.map((l) => l.toUpperCase())]) {
    const offer = trial.courseOfferFor(stored, ENV_ALL);
    for (const kind of ['trial_day6', 'trial_ended']) {
      assert.ok(trial.offersCourse(kind), `${kind} must carry the course offer`);
      const html = render(kind, offer);
      const paths = hrefs(html).map((h) => (h.startsWith(SITE) ? new URL(h).pathname : h));
      assert.ok(paths.includes('/pricing/'), `${kind}: the Pro offer is gone`);
      assert.ok(paths.includes(offer.path), `${kind}: no link to ${offer.path}`);
      assert.ok(html.includes(eur(SUBLEVEL_PRICES_EUR[offer.level])), `${kind}: course price is not the data layer's`);
      assert.ok(html.includes(`${COURSE_PRO_MONTHS} months`), `${kind}: the included Pro window is not the data layer's`);
      assert.ok(!/\b(unbegrenzt\w*|unlimited)\b/i.test(html), `${kind}: unlimited claim`);
      if (offer.placed) assert.ok(html.includes(`placement test put you at ${offer.code}`), `${kind}: placed learner not told why`);
    }
  }
  assert.ok(render('trial_day6', null).includes(eur(MONTHLY_PRICE_EUR)), 'day 6 no longer quotes the Pro price');
});

test('no buyable course → the Pro-only mail, and day 3 never sells a course', () => {
  const coursePrices = Object.values(SUBLEVEL_PRICES_EUR).map(eur);
  for (const kind of ['trial_day6', 'trial_ended']) {
    const html = render(kind, trial.courseOfferFor('B1.1', ENV_ALL));
    assert.ok(!hrefs(html).some((h) => h.includes('/courses/')), `${kind}: course link without a buyable course`);
    for (const p of coursePrices) assert.ok(!html.includes(p), `${kind}: quotes ${p} without a buyable course`);
  }
  assert.equal(trial.offersCourse('trial_day3'), false);
  const day3 = render('trial_day3', trial.courseOfferFor('a1', ENV_ALL));
  assert.ok(!hrefs(day3).some((h) => h.includes('/courses/')), 'day 3 must not carry the course offer');
});

test('every site link in every trial mail carries utm email/lifecycle/<kind>; unsubscribe is untouched', () => {
  assert.deepEqual(trial.KINDS, ['trial_day3', 'trial_day6', 'trial_ended']);
  for (const kind of trial.KINDS) {
    for (const offer of [null, trial.courseOfferFor('a1', ENV_ALL)]) {
      const links = hrefs(render(kind, offer));
      assert.ok(links.includes(UNSUB), `${kind}: the unsubscribe link changed`);
      const site = links.filter((h) => h !== UNSUB);
      assert.ok(site.length >= 2, `${kind}: expected a CTA and the footer link`);
      for (const href of site) {
        const url = new URL(href);
        assert.equal(url.origin, SITE, `${kind}: off-site link ${href}`);
        assert.equal(url.searchParams.get('utm_source'), 'email', `${kind}: ${href}`);
        assert.equal(url.searchParams.get('utm_medium'), 'lifecycle', `${kind}: ${href}`);
        assert.equal(url.searchParams.get('utm_campaign'), kind, `${kind}: ${href}`);
        // Every target is an Astro or prerendered route: slash, or a 301 per click.
        assert.ok(url.pathname.endsWith('/'), `${kind}: ${url.pathname} missing its trailing slash`);
      }
    }
  }
});

test('the trial windows and claim-before-send are what section 1 says they are', () => {
  const src = read('netlify/functions/trial-lifecycle.mjs');
  // TRIAL_OCCUPIED above is derived from these three lines; if one moves, the
  // table (and the activation disjointness it guards) must move with it.
  for (const line of [
    `trial_day3: { col: 'trial_started_at', lower: now - 4 * day, upper: now - 3 * day }`,
    `trial_day6: { col: 'trial_ends_at', lower: now, upper: now + day }`,
    `trial_ended: { col: 'trial_ends_at', lower: now - 2 * day, upper: now - day }`,
  ]) {
    assert.ok(src.includes(line), `trial window changed — update TRIAL_OCCUPIED: ${line}`);
  }
  assert.ok(src.includes(`onConflict: 'user_id,kind'`), 'claim must use the lifecycle_emails unique key');
  const loop = src.slice(src.indexOf('async function sendKind'));
  assert.ok(loop.indexOf('.upsert(') !== -1, 'claim missing from the send loop');
  assert.ok(loop.indexOf('.upsert(') < loop.indexOf('await sendBatch(resendKey'), 'claim must come BEFORE the send');
  assert.ok(loop.indexOf('continue;') < loop.indexOf('await sendBatch(resendKey'), 'a failed claim must skip the send');
});
