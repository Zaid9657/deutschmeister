// Live behavioral proof of the speaking allowance ledger — plan:
// docs/superpowers/plans/2026-09-15-speaking-entitlements-ledger.md Tasks 1+5.
//
// Applies migrations/2026-09-16-speaking-allowances.sql to a REAL throwaway
// Postgres cluster and proves: grants replay to one bucket, reservation
// consumes monthly before permanent, insufficiency mutates nothing, finalize
// caps and refunds, refund restores, replays are no-ops, and two truly
// concurrent reserves against one session's capacity admit exactly one.
//
// SKIPS (loudly) where Postgres server binaries are missing; everywhere they
// exist this suite is the billing-integrity release gate (spec §11.2 #5).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { startCluster, canRunCluster } from './helpers/pgharness.mjs';

const MIGRATION = fileURLToPath(new URL('../migrations/2026-09-16-speaking-allowances.sql', import.meta.url));
const skip = canRunCluster() ? false : 'Postgres server binaries (or a runnable unprivileged user) not found — ledger behavior not verifiable in this environment';

let db;
const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

before(() => {
  if (skip) return;
  db = startCluster();
  db.sqlFile(MIGRATION);
  db.sql(`insert into auth.users (id) values ('${USER}'), ('${OTHER}')`);
});
after(() => { if (db) db.stop(); });

const grant = (source, ref, seconds, key, expires = null) =>
  db.sql(`select public.grant_speaking_seconds('${USER}', '${source}', '${ref}', ${seconds}, '${key}'${expires ? `, now(), '${expires}'` : ''})`).out;
const reserve = (token, seconds, key, user = USER) =>
  db.sql(`select public.reserve_speaking_seconds('${user}', '${token}', ${seconds}, '${key}')`, { expectFail: true });
const balance = () =>
  JSON.parse(db.sql(`select public.speaking_session_summary('${USER}', gen_random_uuid())`).out).balance;
const ledgerSum = (kind) =>
  Number(db.sql(`select coalesce(sum(seconds),0) from public.speaking_minute_ledger where user_id='${USER}' and kind='${kind}'`).out);

const T1 = '33333333-3333-4333-8333-333333333333';
const T2 = '44444444-4444-4444-8444-444444444444';
const T3 = '55555555-5555-4555-8555-555555555555';

test('the migration applies cleanly and re-applies idempotently', { skip }, () => {
  // First application happened in before(); a second run must not error.
  db.sqlFile(MIGRATION);
});

test('a grant replays to the same single bucket', { skip }, () => {
  const first = JSON.parse(grant('course', 'order:1:course-a11', 3600, 'g1'));
  const replay = JSON.parse(grant('course', 'order:1:course-a11', 3600, 'g1-retry'));
  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.equal(replay.bucketId, first.bucketId);
  assert.equal(db.sql(`select count(*) from public.speaking_credit_buckets where user_id='${USER}'`).out, '1');
  assert.equal(balance().permanentSeconds, 3600);
});

test('reservation consumes expiring monthly seconds before permanent seconds', { skip }, () => {
  grant('subscription', 'sub:1:period:2026-09', 300, 'g2', '2036-01-01T00:00:00Z');
  const res = JSON.parse(reserve(T1, 420, 'r1').out);
  assert.equal(res.reservedSeconds, 420);
  const b = balance();
  assert.equal(b.monthlySeconds, 0, 'monthly bucket must be drained first');
  assert.equal(b.permanentSeconds, 3600 - 120);
});

test('an insufficient reservation fails without mutation', { skip }, () => {
  const before1 = balance();
  const res = reserve(T2, 999999, 'r2');
  assert.notEqual(res.status, 0);
  assert.match(res.err, /INSUFFICIENT_ALLOWANCE/);
  assert.deepEqual(balance(), before1, 'a failed reserve must not move a second');
});

test('a reserve replay returns the first reservation without a second spend', { skip }, () => {
  const before1 = balance();
  const replay = JSON.parse(reserve(T1, 420, 'r1').out);
  assert.equal(replay.reservedSeconds, 420);
  assert.deepEqual(balance(), before1);
});

test('a duplicate session token from another user is rejected', { skip }, () => {
  const res = reserve(T1, 60, 'r-other', OTHER);
  assert.notEqual(res.status, 0);
  assert.match(res.err, /DUPLICATE_SESSION/);
});

test('finalize caps at the reservation, refunds the remainder, and replays as a no-op', { skip }, () => {
  const fin = JSON.parse(db.sql(`select public.finalize_speaking_session('${USER}', '${T1}', 200, 'f1')`).out);
  assert.equal(fin.consumedSeconds, 200);
  assert.equal(fin.refundedSeconds, 220);
  assert.equal(fin.status, 'finalized');
  // 300 monthly consumed first at reserve time; consumption order on
  // finalize is monthly-first too, so the 200 used seconds are monthly and
  // the 100 monthly + 120 permanent flow back.
  const b = balance();
  assert.equal(b.monthlySeconds, 100);
  assert.equal(b.permanentSeconds, 3600);

  const replay = JSON.parse(db.sql(`select public.finalize_speaking_session('${USER}', '${T1}', 999, 'f1-retry')`).out);
  assert.equal(replay.consumedSeconds, 200, 'a finalize replay must not re-settle');
  assert.deepEqual(balance(), b);
});

test('refund returns the complete unfinalized reservation once', { skip }, () => {
  JSON.parse(reserve(T3, 240, 'r3').out);
  const before1 = balance();
  const ref = JSON.parse(db.sql(`select public.refund_speaking_session('${USER}', '${T3}', 'rf1')`).out);
  assert.equal(ref.refundedSeconds, 240);
  assert.equal(ref.status, 'refunded');
  const b = balance();
  assert.equal(b.totalSeconds, before1.totalSeconds + 240);
  const replay = JSON.parse(db.sql(`select public.refund_speaking_session('${USER}', '${T3}', 'rf1-retry')`).out);
  assert.equal(replay.refundedSeconds, 240);
  assert.deepEqual(balance(), b, 'a refund replay must not refund twice');
});

test('two truly concurrent reserves against one session of capacity admit exactly one', { skip }, async () => {
  const u = '66666666-6666-4666-8666-666666666666';
  db.sql(`insert into auth.users (id) values ('${u}')`);
  db.sql(`select public.grant_speaking_seconds('${u}', 'topup', 'order:9:topup', 300, 'g-conc')`);
  const q = (token, key) => `select public.reserve_speaking_seconds('${u}', '${token}', 300, '${key}')`;
  const [a, b] = await db.sqlParallel([
    q('77777777-7777-4777-8777-777777777777', 'c1'),
    q('88888888-8888-4888-8888-888888888888', 'c2'),
  ]);
  const successes = [a, b].filter((r) => r.status === 0);
  const failures = [a, b].filter((r) => r.status !== 0);
  assert.equal(successes.length, 1, `expected exactly one winner, got ${successes.length}`);
  assert.match(failures[0].err, /INSUFFICIENT_ALLOWANCE/);
  const remaining = db.sql(`select remaining_seconds from public.speaking_credit_buckets where user_id='${u}'`).out;
  assert.equal(remaining, '0', 'the parallel tabs may never overspend the bucket');
});

test('ledger invariant: grants − reserves + refunds = current balance + finalized consumption', { skip }, () => {
  const b = balance();
  const invariantBalance = ledgerSum('grant') - ledgerSum('reserve') + ledgerSum('refund') - ledgerSum('revoke');
  const outstanding = Number(db.sql(`select coalesce(sum(reserved_seconds - consumed_seconds - refunded_seconds),0) from public.speaking_session_reservations where user_id='${USER}' and status='reserved'`).out);
  assert.equal(invariantBalance, b.totalSeconds + outstanding, 'ledger does not reconcile with live balances');
});

test('mission entitlements grant once and consume atomically', { skip }, () => {
  const keys = Array.from({ length: 12 }, (_, i) => `'a11-m${i + 1}'`).join(',');
  assert.equal(db.sql(`select public.grant_mission_attempts('${USER}', 'order:1:course-a11', array[${keys}])`).out, '12');
  assert.equal(db.sql(`select public.grant_mission_attempts('${USER}', 'order:1:course-a11', array[${keys}])`).out, '0', 'replay must create nothing');
  assert.equal(db.sql(`select public.consume_mission_attempt('${USER}', 'a11-m1')`).out, 't');
  assert.equal(db.sql(`select public.consume_mission_attempt('${USER}', 'a11-m1')`).out, 'f', 'the included attempt is exactly one');
});

test('a revoked grant zeroes unspent seconds without touching history', { skip }, () => {
  const finalizedBefore = ledgerSum('finalize');
  const out = JSON.parse(db.sql(`select public.revoke_speaking_grant('${USER}', 'course', 'order:1:course-a11', 'rv1')`).out);
  assert.equal(out.revokedSeconds > 0, true);
  assert.equal(ledgerSum('finalize'), finalizedBefore, 'revoke must not rewrite consumption history');
  const replay = JSON.parse(db.sql(`select public.revoke_speaking_grant('${USER}', 'course', 'order:1:course-a11', 'rv1')`).out);
  assert.equal(replay.replayed, true);
  assert.equal(db.sql(`select count(*) from public.speaking_mission_entitlements where user_id='${USER}' and attempts_remaining>0`).out, '0');
});

test('no client role can execute the allowance RPCs', { skip }, () => {
  // These are SECURITY DEFINER and take p_user_id as an argument, so a default
  // PostgREST EXECUTE grant would let any signed-in user mint themselves
  // seconds for any account. Supabase's roles do not exist on this throwaway
  // cluster, so create them, re-apply, and read the live privileges back.
  for (const role of ['anon', 'authenticated', 'service_role']) {
    db.sql(`do $$ begin if not exists (select 1 from pg_roles where rolname='${role}') then execute 'create role ${role}'; end if; end $$`);
  }
  db.sqlFile(MIGRATION);
  const fns = [
    'grant_speaking_seconds', 'reserve_speaking_seconds', 'finalize_speaking_session',
    'refund_speaking_session', 'revoke_speaking_grant', 'grant_mission_attempts',
    'consume_mission_attempt', 'speaking_session_summary',
  ];
  const rows = db.sql(`select p.proname
      || ':' || has_function_privilege('anon', p.oid, 'EXECUTE')
      || ':' || has_function_privilege('authenticated', p.oid, 'EXECUTE')
      || ':' || has_function_privilege('service_role', p.oid, 'EXECUTE')
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (${fns.map((f) => `'${f}'`).join(',')})
    order by 1`).out.trim().split('\n').map((l) => l.trim());
  assert.equal(rows.length, fns.length, 'every allowance RPC must be present');
  for (const row of rows) {
    const [name, anon, authed, service] = row.split(':');
    assert.equal(anon, 'false', `${name} is executable by anon`);
    assert.equal(authed, 'false', `${name} is executable by authenticated`);
    assert.equal(service, 'true', `${name} is NOT executable by service_role — the functions would break`);
  }
});
