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
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { PROGRAM, PROGRAM_KEY, allItemIds } from '../src/data/programs/telcB1Komplett.js';
import { getTopicsForLevel } from '../src/data/grammarTopics.js';

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
