// Guard: the trial the database grants at signup is the trial the site claims.
//
// Found 2026-10-01 (supervisor handoff to security, routed from the
// orchestrator): the repo did not record how the signup trial is granted. It is
// not handle_new_user() and not any file in migrations/. Live, it is the
// BEFORE INSERT trigger trigger_set_trial_dates on public.profiles, calling
// public.set_trial_dates_on_profile_insert(), which sets
// trial_ends_at = trial_started_at + INTERVAL '7 days'. Both were created by
// hand before migrations/ existed, and the repo's only mention was one
// `ALTER FUNCTION … SET search_path` line. So the one number that decides how
// long every new account gets every level was typed in the database, and
// nothing compared it with TRIAL_DAYS in src/data/marketing.js, the constant
// every trial claim on the site renders (tests/claims.test.mjs bans retyping it
// in the copy). Change either alone and the site promises one length while the
// database grants another, silently.
//
// tests/fixtures/db-trial-grant.json records the live definitions verbatim
// (RECORD ONLY, already live, never applied). This file holds it to three rules:
//
//   1. The record is the live text, byte for byte (md5 recorded at dump time).
//   2. The interval the database grants equals TRIAL_DAYS.
//   3. A migration that (re)defines the grant must grant TRIAL_DAYS too, and
//      the record must be re-dumped on or after that migration's date.
//
// When this fails:
//   - after an owner-approved change to the trial length: change TRIAL_DAYS,
//     apply the migration, then refresh the record with its "refresh" query;
//   - on a new migration: make its interval TRIAL_DAYS days, or do not ship it.
// Trial length is an owner decision (money, docs/agents/PROTOCOL.md rule 3).
// Nothing here changes it; this only makes the two places disagree loudly.
//
// Known gap, deliberately NOT pinned here (owner-only to fix, proposal
// p-sec-02 in the team artifact): the function fills the trial columns only
// when they are NULL, and protect_profile_privileged_columns resets
// is_subscribed, subscription_tier and role on INSERT but not trial_*. A
// client INSERT under "Users can insert own profile" (auth.uid() = id) could
// therefore keep a self-chosen trial_ends_at. It is unreachable today:
// handle_new_user() creates every profile inside the signup transaction, there
// is no DELETE policy, and 0 auth.users rows lack a profile (2026-10-02). Rule
// 2 reads the interval, not the NULL guard, so hardening the function later
// does not break this test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { TRIAL_DAYS } from '../src/data/marketing.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const RECORD = JSON.parse(readFileSync(path.join(ROOT, 'tests/fixtures/db-trial-grant.json'), 'utf8'));
const SCHEMA = JSON.parse(readFileSync(path.join(ROOT, 'tests/fixtures/db-schema.json'), 'utf8'));
const MIGRATIONS = path.join(ROOT, 'migrations');
const FILES = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();
const readMigration = (f) => readFileSync(path.join(MIGRATIONS, f), 'utf8');

const FN = 'set_trial_dates_on_profile_insert';

/** SQL without -- line comments and block comments (rollback notes, prose). */
const stripComments = (sql) => sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');

/** Every INTERVAL '<n> <unit>' literal in a SQL text, as {n, unit, text}. */
const intervals = (sql) =>
  [...stripComments(sql).matchAll(/\bINTERVAL\s+'\s*(\d+)\s*([a-z]+)\s*'/gi)].map((m) => ({
    n: Number(m[1]),
    unit: m[2].toLowerCase(),
    text: m[0],
  }));

/**
 * The intervals assigned to trial_ends_at in a plpgsql body
 * (`NEW.trial_ends_at := <expr> + INTERVAL '<n> days';`); empty when none.
 */
const trialEndsIntervals = (sql) =>
  [...stripComments(sql).matchAll(/\btrial_ends_at\s*:=\s*([^;]*)/gi)].flatMap((m) => intervals(m[1]));

test('the record is the live definition, byte for byte', () => {
  assert.match(RECORD.dumpedAt, /^\d{4}-\d{2}-\d{2}$/, 'dumpedAt must be an ISO date');
  assert.equal(RECORD.project, SCHEMA.project, 'the record must come from the same project as the schema snapshot');
  assert.match(RECORD.status, /^RECORD ONLY/, 'the record must say it is a record, not a migration');
  const md5 = createHash('md5').update(RECORD.function, 'utf8').digest('hex');
  assert.equal(
    md5,
    RECORD.functionMd5,
    'tests/fixtures/db-trial-grant.json "function" was edited by hand: it no longer hashes to the md5 the live ' +
      'database reported. Re-dump it with its "refresh" query instead.',
  );
});

test('the trial is granted by a BEFORE INSERT trigger on public.profiles', () => {
  assert.match(
    RECORD.trigger,
    new RegExp(`^CREATE TRIGGER trigger_set_trial_dates BEFORE INSERT ON public\\.profiles FOR EACH ROW EXECUTE FUNCTION ${FN}\\(\\)$`),
  );
  assert.match(RECORD.function, new RegExp(`^CREATE OR REPLACE FUNCTION public\\.${FN}\\(\\)\\n RETURNS trigger\\n`));
});

test('the database grants exactly TRIAL_DAYS days', () => {
  assert.ok(Number.isInteger(TRIAL_DAYS) && TRIAL_DAYS > 0, `TRIAL_DAYS must be a positive integer, got ${TRIAL_DAYS}`);
  const all = intervals(RECORD.function);
  assert.equal(all.length, 1, `expected one INTERVAL literal in the trial grant, found ${all.map((i) => i.text).join(', ') || 'none'}`);
  const granted = trialEndsIntervals(RECORD.function);
  assert.equal(granted.length, 1, 'the INTERVAL literal must be the one assigned to trial_ends_at');
  const [{ n, unit, text }] = granted;
  assert.match(unit, /^days?$/, `the trial grant must be written in days (${text})`);
  assert.equal(
    n,
    TRIAL_DAYS,
    `the database grants a ${n}-day trial (${text}) but src/data/marketing.js TRIAL_DAYS = ${TRIAL_DAYS}, ` +
      'which is what every trial claim on the site says. Trial length is an owner decision: change both together.',
  );
});

test('the grant runs as the inserting role with a pinned search_path', () => {
  // SECURITY INVOKER: the function only writes NEW, so it needs no privilege
  // of its own. A DEFINER version would be a new privileged path on profiles.
  assert.equal(RECORD.securityDefiner, false);
  assert.doesNotMatch(RECORD.function, /\bSECURITY\s+DEFINER\b/i);
  assert.match(RECORD.function, /\n SET search_path TO 'public', 'pg_temp'\n/);
  // The repo's one earlier mention pins the same function's search_path.
  const pin = stripComments(readMigration('2026-08-16-enable-rls-on-unprotected-tables.sql'));
  assert.match(pin, new RegExp(`ALTER FUNCTION public\\.${FN}\\(\\)\\s+SET search_path = public, pg_temp;`));
});

test('no migration redefines the trial grant without TRIAL_DAYS and a fresh record', () => {
  assert.ok(FILES.length > 50, `only ${FILES.length} migration files were read`);
  const defines = new RegExp(
    `\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?(?:FUNCTION\\s+(?:public\\.)?"?${FN}"?\\s*\\(|TRIGGER\\s+[^;]*?\\bON\\s+(?:public\\.)?"?profiles"?\\b[^;]*\\b${FN}\\b)`,
    'i',
  );
  const failures = [];
  for (const file of FILES) {
    const sql = readMigration(file);
    // Any plpgsql assignment of an interval to trial_ends_at is a trial grant,
    // whatever the function is called.
    for (const { n, unit, text } of trialEndsIntervals(sql)) {
      if (!/^days?$/.test(unit) || n !== TRIAL_DAYS) failures.push(`${file}: grants ${text}, TRIAL_DAYS is ${TRIAL_DAYS}`);
    }
    if (defines.test(stripComments(sql))) {
      const date = file.slice(0, 10);
      if (date > RECORD.dumpedAt) {
        failures.push(
          `${file}: redefines ${FN} or its trigger after the record was dumped (${RECORD.dumpedAt}). ` +
            'The trial grant is owner-only: the owner applies the file, then refresh ' +
            'tests/fixtures/db-trial-grant.json from the live database in the same PR',
        );
      }
    }
  }
  assert.deepEqual(failures, [], `trial grant drift:\n  ${failures.join('\n  ')}`);
});
