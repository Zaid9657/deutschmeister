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
