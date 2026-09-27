// Guard: a function lockdown must revoke EXECUTE from PUBLIC, not only from
// anon and authenticated.
//
// Postgres grants EXECUTE on every new function to PUBLIC, and this project's
// default privileges for schema public ALSO grant anon, authenticated and
// service_role explicitly. Every role inherits from PUBLIC, so
//
//     REVOKE ... ON FUNCTION f() FROM anon, authenticated;
//
// removes the explicit grants and leaves anon exactly as able to call f() via
// /rest/v1/rpc/f as before. That line reads like a lockdown and is a no-op. It
// shipped twice — notify_welcome_email() (2026-08-17) and
// course_reminder_candidates() (2026-09-13) — and both stayed callable by anon
// until the Supabase advisor flagged them on 2026-09-27
// (migrations/2026-09-27-revoke-public-execute.sql).
//
// THE RULE: every migration that revokes EXECUTE on a function from anon or
// authenticated also revokes it from PUBLIC — in the same file, or (for a file
// that is already an applied record) in a later migration that completes the
// lockdown. Applied records are history: they state what was run, so the fix
// for a no-op line is a new file, never an edit to the record. The escape
// hatch cannot excuse a new migration — the newest file has no later one.
//
// Scope: migrations/*.sql only (the legacy root *.sql files are history and
// are never re-run — migrations/README.md). Commented-out statements (rollback
// notes) are ignored. Functions are keyed by schema-qualified name, not full
// signature: public has no overloads, and name keying cannot be defeated by
// writing `int` in one statement and `integer` in the next.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const MIGRATIONS = fileURLToPath(new URL('../migrations/', import.meta.url));
const FILES = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();
const read = (f) => readFileSync(path.join(MIGRATIONS, f), 'utf8');

const LOCKDOWN_ROLES = new Set(['anon', 'authenticated']);

// REVOKE [GRANT OPTION FOR] {EXECUTE | ALL [PRIVILEGES]}
//   ON {FUNCTION|ROUTINE|PROCEDURE f(...)[, ...] | ALL FUNCTIONS IN SCHEMA s[, ...]}
//   FROM role[, ...] [GRANTED BY r] [CASCADE | RESTRICT];
const REVOKE_FN =
  /\bREVOKE\s+(GRANT\s+OPTION\s+FOR\s+)?(?:ALL(?:\s+PRIVILEGES)?|EXECUTE)\s+ON\s+((?:FUNCTION|ROUTINE|PROCEDURE)\s+[^;]+?|ALL\s+(?:FUNCTIONS|ROUTINES|PROCEDURES)\s+IN\s+SCHEMA\s+[^;]+?)\s+FROM\s+([^;]+?)\s*(?:\bCASCADE\b|\bRESTRICT\b)?\s*;/gi;

function stripComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');
}

/** Split on commas outside parentheses: `f(int, int), g()` → ['f(int, int)', 'g()']. */
function splitTopLevel(s) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

const unquote = (s) => s.replace(/"/g, '').trim().toLowerCase();

/** `public.f(int, int)` / `"f"()` / `f` → `public.f`. */
function fnKey(spec) {
  const name = unquote(spec.replace(/\([\s\S]*$/, ''));
  return name.includes('.') ? name : `public.${name}`;
}

function targetKeys(target) {
  const all = /^ALL\s+\w+\s+IN\s+SCHEMA\s+([\s\S]+)$/i.exec(target.trim());
  if (all) return splitTopLevel(all[1]).map((s) => `${unquote(s)}.*`);
  return splitTopLevel(target.replace(/^\s*(?:FUNCTION|ROUTINE|PROCEDURE)\s+/i, '')).map(fnKey);
}

/**
 * Per file: which functions it revokes from anon/authenticated (a lockdown),
 * and which it revokes from PUBLIC.
 */
function scan(sql) {
  const lockdowns = new Set();
  const publicRevoked = new Set();
  for (const m of stripComments(sql).matchAll(REVOKE_FN)) {
    if (m[1]) continue; // GRANT OPTION FOR revokes the option, not EXECUTE
    const roles = m[3]
      .replace(/\bGRANTED\s+BY\b[\s\S]*$/i, '')
      .split(',')
      .map(unquote);
    const keys = targetKeys(m[2]);
    if (roles.some((r) => LOCKDOWN_ROLES.has(r))) keys.forEach((k) => lockdowns.add(k));
    if (roles.includes('public')) keys.forEach((k) => publicRevoked.add(k));
  }
  return { lockdowns, publicRevoked };
}

/** Lockdowns missing their PUBLIC revoke, given every file in apply order. */
function violations(files) {
  const scans = files.map(([name, sql]) => ({ name, ...scan(sql) }));
  const out = [];
  scans.forEach(({ name, lockdowns, publicRevoked }, i) => {
    for (const fn of lockdowns) {
      if (publicRevoked.has(fn)) continue;
      const completedBy = scans.slice(i + 1).find((later) => later.publicRevoked.has(fn));
      if (!completedBy) out.push(`${name}: ${fn}`);
    }
  });
  return out;
}

// ---------------------------------------------------------------------------
// the scanner itself — a guard that matches nothing passes everything
// ---------------------------------------------------------------------------

test('the scanner flags an anon/authenticated-only revoke and accepts a complete one', () => {
  const bad = 'REVOKE ALL ON FUNCTION public.f(int, int, int) FROM anon, authenticated;';
  assert.deepEqual([...scan(bad).lockdowns], ['public.f']);
  assert.deepEqual(violations([['bad.sql', bad]]), ['bad.sql: public.f']);

  for (const good of [
    'REVOKE EXECUTE ON FUNCTION public.f() FROM PUBLIC, anon, authenticated;',
    'REVOKE ALL ON FUNCTION public.f() FROM PUBLIC;\nREVOKE ALL ON FUNCTION public.f() FROM anon, authenticated;',
    'REVOKE EXECUTE ON FUNCTION f(uuid, integer) FROM anon, authenticated, public;',
    'revoke all privileges on function "f"(text) from anon, public cascade;',
  ]) {
    assert.deepEqual(violations([['good.sql', good]]), [], good);
  }
});

test('the scanner reads multi-function lists, schema-wide revokes, and ignores comments and GRANT OPTION', () => {
  const multi = 'REVOKE EXECUTE ON FUNCTION public.a(int, text), public.b() FROM authenticated;';
  assert.deepEqual([...scan(multi).lockdowns].sort(), ['public.a', 'public.b']);

  const schemaWide = 'REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;';
  assert.deepEqual(violations([['s.sql', schemaWide]]), ['s.sql: public.*']);

  const commented = '-- REVOKE ALL ON FUNCTION public.f() FROM anon;\n/* REVOKE ALL ON FUNCTION public.g() FROM anon; */';
  assert.equal(scan(commented).lockdowns.size, 0, 'a rollback note is not a statement');

  const optionOnly = 'REVOKE GRANT OPTION FOR EXECUTE ON FUNCTION public.f() FROM anon;';
  assert.equal(scan(optionOnly).lockdowns.size, 0, 'GRANT OPTION FOR leaves EXECUTE in place');

  const tableRevoke = 'REVOKE UPDATE, DELETE ON public.t FROM anon;';
  assert.equal(scan(tableRevoke).lockdowns.size, 0, 'table privileges are out of scope');
});

test('only a LATER migration can complete a lockdown', () => {
  const noop = 'REVOKE ALL ON FUNCTION public.f() FROM anon, authenticated;';
  const fix = 'REVOKE EXECUTE ON FUNCTION public.f() FROM PUBLIC, anon, authenticated;';
  assert.deepEqual(violations([['1.sql', noop], ['2.sql', fix]]), [], 'an applied record is completed by a later file');
  assert.deepEqual(violations([['1.sql', fix], ['2.sql', noop]]), ['2.sql: public.f'], 'an earlier PUBLIC revoke does not excuse a new no-op line');
});

// ---------------------------------------------------------------------------
// the rule, over the real migrations
// ---------------------------------------------------------------------------

const REAL = FILES.map((f) => [f, read(f)]);

test('the scanner sees the real lockdowns, including the two no-op records', () => {
  const byFile = Object.fromEntries(REAL.map(([f, sql]) => [f, scan(sql)]));
  const total = Object.values(byFile).reduce((n, s) => n + s.lockdowns.size, 0);
  assert.ok(total >= 5, `expected the historical function lockdowns to be found, saw ${total}`);

  // The two statements the advisor finding traced back to: each is a lockdown
  // with no PUBLIC revoke in its own file. If the scanner stops seeing them it
  // has gone blind, and the rule test below would pass for the wrong reason.
  for (const [file, fn] of [
    ['2026-08-17-audit-remediation.sql', 'public.notify_welcome_email'],
    ['2026-09-13-course-reminder.sql', 'public.course_reminder_candidates'],
  ]) {
    assert.ok(byFile[file]?.lockdowns.has(fn), `${file} should lock down ${fn}`);
    assert.ok(!byFile[file].publicRevoked.has(fn), `${file} is the no-op record for ${fn}`);
  }
});

test('every function lockdown also revokes EXECUTE from PUBLIC', () => {
  assert.deepEqual(
    violations(REAL),
    [],
    'REVOKE ... FROM anon, authenticated is a no-op while PUBLIC holds EXECUTE (every role inherits from PUBLIC). '
      + 'Add PUBLIC to the FROM list: REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC, anon, authenticated;',
  );
});

test('2026-09-27 closes both advisor findings and keeps the service role', () => {
  const sql = stripComments(read('2026-09-27-revoke-public-execute.sql'));
  for (const sig of ['public\\.course_reminder_candidates\\(int, int, int\\)', 'public\\.notify_welcome_email\\(\\)']) {
    assert.ok(
      new RegExp(`REVOKE EXECUTE ON FUNCTION ${sig} FROM PUBLIC, anon, authenticated;`).test(sql),
      `${sig} must be revoked from PUBLIC, anon and authenticated`,
    );
    assert.ok(
      new RegExp(`GRANT EXECUTE ON FUNCTION ${sig} TO service_role;`).test(sql),
      `${sig} must stay callable by the service role (course-reminder.mjs)`,
    );
  }
});
