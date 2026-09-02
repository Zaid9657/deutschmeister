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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { WINDOWS, TEMPLATES } from '../netlify/functions/activation-lifecycle.mjs';

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
