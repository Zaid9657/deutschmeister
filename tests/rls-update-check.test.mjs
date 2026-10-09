// Guard: every UPDATE (and ALL) row-level-security policy states its
// WITH CHECK, and that check keeps every owner column its USING names.
//
// Found 2026-09-28 (scorecard §3 #17): five own-row UPDATE policies in the
// live public schema had USING (auth.uid() = user_id) and with_check NULL.
// Postgres reuses USING as the check when WITH CHECK is absent, so none of
// them let a user move a row to another user_id (verified in Postgres 17.5:
// "new row violates row-level security policy"). The invariant held by
// fallback, which is two problems:
//   - it is invisible: pg_policies shows NULL, which every audit reads as
//     "no check" (that is how #17 was logged);
//   - it is coupled: widen USING and the write check widens with it.
// The migrations that wrote UPDATE policies all had the check; the gap came
// from the dashboard and the legacy root SQL. So the rule runs twice:
//
//   1. over migrations/*.sql: a CREATE POLICY for UPDATE or ALL (ALL is the
//      default when FOR is omitted) must carry WITH CHECK, and the check must
//      name every owner column USING names (auth.uid() = <col>). A check of
//      (true) under an own-row USING is weaker, and it is the shape that does
//      open the hole: permissive policies are OR-combined, so one such sibling
//      lets every row on the table be moved.
//   2. over tests/fixtures/db-policies.json, a snapshot of what production
//      HAS: every UPDATE/ALL policy a client role (public, anon,
//      authenticated) can use is held to the same rule. The known exceptions
//      are listed below and must equal the measurement exactly, so the list
//      only shrinks and cannot go stale.
//
// When this fails:
//   - on a new migration: add WITH CHECK (<the owner predicate>) to it.
//   - after a migration was applied: refresh the snapshot (its "refresh" key)
//     and remove the policies it fixed from PENDING_APPLY.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { stripComments, parsePolicies, parseDrops, ownerColumns, problem, key } from './helpers/rlsPolicies.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const MIGRATIONS = path.join(ROOT, 'migrations');
const FILES = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();
const read = (f) => readFileSync(path.join(MIGRATIONS, f), 'utf8');
const SNAPSHOT = JSON.parse(readFileSync(path.join(ROOT, 'tests/fixtures/db-policies.json'), 'utf8'));

// The five own-row UPDATE policies that had no WITH CHECK in production until
// OWN_ROW_MIGRATION recreated them (applied 2026-09-28). A fixed list, not
// derived from PENDING_APPLY, so the scanner and the own-row tests below keep
// checking that file after it left the pending list.
const OWN_ROW_MIGRATION = '2026-09-28-update-policies-with-check.sql';
const OWN_ROW_POLICIES = [
  'user_grammar_notes.Users can update own grammar notes',
  'user_grammar_progress.Users can update own grammar progress',
  'user_progress.Users can update own progress',
  'user_reading_progress.Users can update own reading progress',
  'user_script_progress.Users can update own script progress',
];
// Live violations that a written, NOT yet applied migration fixes, and the
// file that fixes each. Remove an entry (and refresh the snapshot) once the
// owner has applied its file. Empty since 2026-10-01: the own-row file and
// 2026-09-28-video-library-admin-writes.sql are both applied (migrations/README.md)
// and the refreshed snapshot holds no client UPDATE/ALL policy without its check.
const PENDING_APPLY = {};
// Live violations with no migration yet, each tracked in docs/SCORECARD.md §3.
const OPEN_ELSEWHERE = {};

const CLIENT_ROLES = new Set(['public', 'anon', 'authenticated']);

const migrationViolations = (files) =>
  files.flatMap(([f, sql]) => parsePolicies(sql).filter((p) => problem(p)).map((p) => `${f}: ${key(p)} (${problem(p)})`));
const liveViolations = (policies) =>
  policies.filter((p) => p.roles.some((r) => CLIENT_ROLES.has(r)) && problem(p)).map(key).sort();

// ---------------------------------------------------------------------------
// the scanner itself — a guard that matches nothing passes everything
// ---------------------------------------------------------------------------

test('the scanner flags a USING-only UPDATE policy, in every spelling of UPDATE/ALL', () => {
  for (const bad of [
    'CREATE POLICY "Users can update own reading progress" ON public.user_reading_progress FOR UPDATE USING (auth.uid() = user_id);',
    'create policy p on t for all to authenticated using (auth.uid() = user_id);',
    'CREATE POLICY p ON public.t USING (auth.uid() = user_id);', // no FOR: ALL
    'CREATE POLICY p ON public.t AS PERMISSIVE FOR UPDATE TO authenticated\n  USING (\n    auth.uid() = user_id\n  );',
  ]) {
    assert.equal(migrationViolations([['x.sql', bad]]).length, 1, bad);
    assert.match(migrationViolations([['x.sql', bad]])[0], /no WITH CHECK/);
  }
});

test('the scanner flags a check weaker than USING and accepts an equal or stronger one', () => {
  const weaker = 'CREATE POLICY p ON t FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (true);';
  assert.match(migrationViolations([['w.sql', weaker]])[0], /drops owner column user_id/);

  const otherCol = 'CREATE POLICY p ON t FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = user_id);';
  assert.match(migrationViolations([['o.sql', otherCol]])[0], /drops owner column owner_id/);

  for (const good of [
    'CREATE POLICY p ON public.t FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);',
    'CREATE POLICY p ON t FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK (user_id = auth.uid());',
    'CREATE POLICY "p q" ON "public"."t" FOR ALL USING (auth.uid() = t.id) WITH CHECK (auth.uid() = id AND locked = false);',
    'CREATE POLICY p ON t FOR ALL TO service_role USING (true) WITH CHECK (true);',
  ]) {
    assert.deepEqual(migrationViolations([['g.sql', good]]), [], good);
  }
});

test('the scanner ignores comments and the commands that have no row to move', () => {
  const sql = [
    '-- CREATE POLICY a ON t FOR UPDATE USING (auth.uid() = user_id);',
    '/* CREATE POLICY b ON t FOR UPDATE USING (auth.uid() = user_id); */',
    'CREATE POLICY c ON t FOR SELECT USING (auth.uid() = user_id);',
    'CREATE POLICY d ON t FOR DELETE TO authenticated USING (auth.uid() = user_id);',
    'CREATE POLICY e ON t FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);',
  ].join('\n');
  assert.equal(parsePolicies(sql).length, 3, 'commented-out statements are rollback notes, not policies');
  assert.deepEqual(migrationViolations([['c.sql', sql]]), []);
});

test('the scanner reads names, tables, roles and pg_policies renderings exactly', () => {
  const [p] = parsePolicies('CREATE POLICY "Say ""hi""" ON "public"."my t" AS PERMISSIVE FOR UPDATE TO anon, "authenticated" USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);');
  assert.deepEqual(
    { table: p.table, policy: p.policy, cmd: p.cmd, roles: p.roles, using: p.using, check: p.check },
    { table: 'my t', policy: 'Say "hi"', cmd: 'UPDATE', roles: ['anon', 'authenticated'], using: 'auth.uid() = user_id', check: 'auth.uid() = user_id' },
  );
  assert.deepEqual([...ownerColumns('( SELECT auth.uid() AS uid) = user_id')], ['user_id']);
  assert.deepEqual([...ownerColumns('(auth.uid() = id)')], ['id']);
  assert.deepEqual([...ownerColumns('true')], []);
});

// ---------------------------------------------------------------------------
// rule 1: migrations/
// ---------------------------------------------------------------------------

const REAL = FILES.map((f) => [f, read(f)]);

test('the scanner sees the real UPDATE policies in migrations/', () => {
  const updates = REAL.flatMap(([f, sql]) => parsePolicies(sql).filter((p) => p.cmd === 'UPDATE').map((p) => `${f}: ${key(p)}`));
  // lesson-engine (2), exam-attempts, vocab-srs, lifecycle-and-listening, and the five below.
  assert.ok(updates.length >= 10, `expected at least 10 UPDATE policies, saw ${updates.length}`);
  for (const k of ['review_cards.review_cards_update_own', 'user_listening_progress.Users can update own listening progress', ...OWN_ROW_POLICIES]) {
    assert.ok(updates.some((u) => u.endsWith(`: ${k}`)), `the scanner should see ${k}`);
  }
});

test('no migration defines an UPDATE/ALL policy without a WITH CHECK that keeps its owner columns', () => {
  assert.deepEqual(
    migrationViolations(REAL),
    [],
    'Add WITH CHECK (<the USING owner predicate>) to the policy. Postgres would reuse USING, but pg_policies then shows '
      + 'with_check NULL, and the write check silently follows any later change to USING.',
  );
});

test('migrations/ never uses ALTER POLICY, which this scanner does not read', () => {
  // ALTER POLICY can change USING and keep an old check, or the reverse. If a
  // migration needs it, teach parsePolicies() to apply it first.
  const withAlter = REAL.filter(([, sql]) => /\bALTER\s+POLICY\b/i.test(stripComments(sql))).map(([f]) => f);
  assert.deepEqual(withAlter, []);
});

// ---------------------------------------------------------------------------
// rule 2: the live snapshot
// ---------------------------------------------------------------------------

test('the policy snapshot is dated, says how to refresh it, and holds only UPDATE/ALL policies', () => {
  assert.match(SNAPSHOT.dumpedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(SNAPSHOT.refresh, /from pg_policies where schemaname = 'public' and cmd in \('UPDATE', 'ALL'\)/);
  assert.ok(SNAPSHOT.policies.length >= 10, `only ${SNAPSHOT.policies.length} policies in the snapshot`);
  const keys = SNAPSHOT.policies.map(key);
  assert.equal(new Set(keys).size, keys.length, 'one line per (table, policy)');
  for (const p of SNAPSHOT.policies) {
    assert.ok(['UPDATE', 'ALL'].includes(p.cmd), `${key(p)}: ${p.cmd}`);
    assert.ok(Array.isArray(p.roles) && p.roles.length, `${key(p)}: roles`);
    assert.ok('check' in p && 'using' in p, `${key(p)}: using/check`);
  }
});

test('every live client UPDATE/ALL policy keeps its owner in WITH CHECK, except the listed, tracked ones', () => {
  const expected = [...Object.keys(PENDING_APPLY), ...Object.keys(OPEN_ELSEWHERE)].sort();
  assert.deepEqual(
    liveViolations(SNAPSHOT.policies),
    expected,
    'The live violations must equal PENDING_APPLY + OPEN_ELSEWHERE exactly. A new one: fix it in a migration '
      + '(or track it in SCORECARD §3). One gone after an apply: remove it from the list, so the list only shrinks.',
  );
});

test('each pending migration fixes its policies (recreated with a check, or dropped) and is marked not applied', () => {
  const readme = readFileSync(path.join(MIGRATIONS, 'README.md'), 'utf8').split('\n');
  for (const [k, file] of Object.entries(PENDING_APPLY)) {
    assert.ok(FILES.includes(file), `${k}: ${file} exists in migrations/`);
    const sql = read(file);
    const recreated = parsePolicies(sql).find((p) => key(p) === k);
    if (recreated) {
      assert.equal(problem(recreated), null, `${file} recreates ${k} with a check that keeps its owner`);
    } else {
      assert.ok(parseDrops(sql).has(k), `${file} must recreate or drop ${k}`);
    }
    const row = readme.find((l) => l.includes(`\`${file}\``));
    assert.ok(row, `migrations/README.md lists ${file}`);
    assert.match(row, /not yet applied/i, `the README says ${file} is not applied while it is in PENDING_APPLY`);
  }
});

test('the own-row migration recreates exactly its policies, TO authenticated, in one guarded transaction', () => {
  const mine = OWN_ROW_POLICIES;
  const sql = read(OWN_ROW_MIGRATION);
  const created = new Map(parsePolicies(sql).map((p) => [key(p), p]));
  for (const k of mine) {
    const p = created.get(k);
    assert.ok(p, `${OWN_ROW_MIGRATION} must recreate ${k}`);
    assert.equal(p.cmd, 'UPDATE', k);
    assert.deepEqual(p.roles, ['authenticated'], `${k}: TO authenticated (anon never owns a row)`);
    const live = SNAPSHOT.policies.find((l) => key(l) === k);
    assert.deepEqual([...ownerColumns(p.using)], [...ownerColumns(live.using)], `${k}: USING keeps the live owner predicate`);
    assert.equal(problem(p), null, k);
  }
  assert.deepEqual([...created.keys()].sort(), [...mine].sort(), 'the file touches no other policy');

  const body = stripComments(sql);
  assert.match(body, /^\s*BEGIN;/, 'one transaction');
  assert.match(body, /COMMIT;\s*$/, 'one transaction');
  assert.match(body, /with_check IS NULL[\s\S]*RAISE EXCEPTION/, 'the guard aborts the file if any own-row policy is still unchecked');
  assert.doesNotMatch(body, /\b(DISABLE\s+ROW\s+LEVEL\s+SECURITY|GRANT\b)/i, 'never widens access');
});
