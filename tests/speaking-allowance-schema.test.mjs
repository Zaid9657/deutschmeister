// Schema contract for the speaking allowance ledger — plan:
// docs/superpowers/plans/2026-09-15-speaking-entitlements-ledger.md Task 1.
//
// Source-level pins only (they run everywhere, CI included). The LIVE
// behavior — atomicity, idempotent replay, concurrency — is proved by
// tests/speaking-ledger-concurrency.test.mjs against a real throwaway
// Postgres cluster when server binaries are available.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../migrations/2026-09-16-speaking-allowances.sql', import.meta.url), 'utf8');

test('speaking allowance migration is second-based, atomic and idempotent', () => {
  for (const name of ['speaking_credit_buckets', 'speaking_session_reservations', 'speaking_minute_ledger', 'speaking_mission_entitlements']) {
    assert.match(sql, new RegExp(`create table(?: if not exists)? public\\.${name}`, 'i'));
  }
  for (const fn of ['grant_speaking_seconds', 'reserve_speaking_seconds', 'finalize_speaking_session', 'refund_speaking_session']) {
    assert.match(sql, new RegExp(`create or replace function public\\.${fn}`, 'i'));
  }
  assert.match(sql, /for update/i);
  assert.match(sql, /idempotency_key text not null unique/i);
  assert.doesNotMatch(sql, /balance_cents|cost_cents/i);
});

test('every allowance table is RLS-locked: learners read their own rows, never write', () => {
  for (const name of ['speaking_credit_buckets', 'speaking_session_reservations', 'speaking_minute_ledger', 'speaking_mission_entitlements']) {
    assert.match(sql, new RegExp(`alter table public\\.${name} enable row level security`, 'i'), `${name}: RLS not enabled`);
    assert.match(sql, new RegExp(`on public\\.${name}[\\s\\S]{0,120}for select[\\s\\S]{0,120}auth\\.uid\\(\\) = user_id`, 'i'), `${name}: missing own-rows select policy`);
  }
  // No client-write policy may exist: writes go through the security-definer
  // RPCs (service role) only.
  assert.doesNotMatch(sql, /for (insert|update|delete)\s+to (anon|authenticated)/i, 'client write policy found');
});

test('the RPCs are security definer with a pinned search_path', () => {
  const fnBodies = sql.match(/create or replace function[\s\S]+?\$\$;/gi) || [];
  assert.ok(fnBodies.length >= 4, 'expected at least the four RPC bodies');
  for (const body of fnBodies) {
    assert.match(body, /security definer/i, 'RPC not security definer');
    assert.match(body, /set search_path/i, 'RPC without a pinned search_path');
  }
});

test('reservations cannot consume or refund more than they reserved', () => {
  assert.match(sql, /consumed_seconds \+ refunded_seconds <= reserved_seconds/i);
});
