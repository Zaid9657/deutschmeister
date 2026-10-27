// Fulfilment f2: the in-app exam-outcome question and its table.
//
// Two halves, both pinned here:
//   the due-date rule (src/lib/examOutcome.js): the card shows from
//     exam_date + 7 local days, never before, never once answered (a
//     'waiting' answer asks again after 14 days), never after "Not now";
//   the migration (migrations/2026-10-27-exam-results.sql): additive, RLS on,
//     own-row SELECT/INSERT/UPDATE only, no DELETE policy, no anon grant, a
//     rollback in its header, and the ledger says it is not applied.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EXAM_OUTCOMES,
  FOLLOW_UP_DAYS,
  WAITING_REASK_DAYS,
  UNSPECIFIED_EXAM,
  outcomeQuestionDue,
  examSlugFor,
  isMissingTable,
  dismissKey,
} from '../src/lib/examOutcome.js';
import { stripComments, parsePolicies } from './helpers/rlsPolicies.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = '2026-10-27-exam-results.sql';
const RAW = readFileSync(path.join(ROOT, 'migrations', FILE), 'utf8');
const SQL = stripComments(RAW);

const day = (y, m, d) => new Date(y, m - 1, d, 9, 30);

// ── the due-date rule ────────────────────────────────────────────────────

test('the follow-up waits a full week after the exam date', () => {
  assert.equal(FOLLOW_UP_DAYS, 7);
  const examDate = '2026-10-10';
  assert.equal(outcomeQuestionDue({ examDate, today: day(2026, 10, 1) }), false, 'before the exam');
  assert.equal(outcomeQuestionDue({ examDate, today: day(2026, 10, 10) }), false, 'exam day');
  assert.equal(outcomeQuestionDue({ examDate, today: day(2026, 10, 16) }), false, 'day 6');
  assert.equal(outcomeQuestionDue({ examDate, today: day(2026, 10, 17) }), true, 'day 7');
  assert.equal(outcomeQuestionDue({ examDate, today: day(2026, 12, 1) }), true, 'long after, still unanswered');
});

test('the date is a local calendar day, late evening included', () => {
  assert.equal(outcomeQuestionDue({ examDate: '2026-10-10', today: new Date(2026, 9, 16, 23, 59) }), false);
  assert.equal(outcomeQuestionDue({ examDate: '2026-10-10', today: new Date(2026, 9, 17, 0, 1) }), true);
  // Month and year boundaries.
  assert.equal(outcomeQuestionDue({ examDate: '2026-12-28', today: day(2027, 1, 4) }), true);
  assert.equal(outcomeQuestionDue({ examDate: '2026-12-28', today: day(2027, 1, 3) }), false);
});

test('an answer hides the card; only "waiting" asks again, after 14 days', () => {
  const examDate = '2026-10-01';
  const today = day(2026, 10, 20);
  for (const outcome of ['passed', 'failed', 'not_taken']) {
    assert.equal(outcomeQuestionDue({ examDate, today, result: { outcome, updated_at: '2026-10-08T10:00:00Z' } }), false, outcome);
    assert.equal(outcomeQuestionDue({ examDate, today: day(2027, 6, 1), result: { outcome, updated_at: '2026-10-08T10:00:00Z' } }), false, `${outcome} months later`);
  }
  assert.equal(WAITING_REASK_DAYS, 14);
  const waiting = { outcome: 'waiting', updated_at: new Date(2026, 9, 9, 12).toISOString() };
  assert.equal(outcomeQuestionDue({ examDate, today: day(2026, 10, 22), result: waiting }), false, '13 days after waiting');
  assert.equal(outcomeQuestionDue({ examDate, today: day(2026, 10, 23), result: waiting }), true, '14 days after waiting');
  assert.equal(outcomeQuestionDue({ examDate, today: day(2026, 10, 23), result: { outcome: 'waiting' } }), false, 'no stamp: do not nag');
});

test('"Not now" and a missing or broken date hide the card', () => {
  const today = day(2026, 10, 27);
  assert.equal(outcomeQuestionDue({ examDate: '2026-10-01', today, dismissed: true }), false);
  for (const examDate of [null, undefined, '', 'not-a-date']) {
    assert.equal(outcomeQuestionDue({ examDate, today }), false, String(examDate));
  }
  assert.notEqual(dismissKey('telc_b1', '2026-10-01'), dismissKey('telc_b1', '2026-11-01'), 'a new date asks again');
});

test('the exam slug: track first, then the course exam, never "none"', () => {
  assert.equal(examSlugFor({ examTrack: 'telc_b1', courseExamKey: 'goethe_a1' }), 'telc_b1');
  assert.equal(examSlugFor({ examTrack: 'none', courseExamKey: 'goethe_a1' }), 'goethe_a1');
  assert.equal(examSlugFor({ examTrack: null, courseExamKey: null }), UNSPECIFIED_EXAM);
  assert.equal(examSlugFor({ examTrack: 'Bad Slug!' }), UNSPECIFIED_EXAM);
  const check = /exam text NOT NULL CHECK \(exam ~ '([^']+)'\)/.exec(SQL);
  assert.ok(check, 'the migration constrains the exam slug');
  assert.match(UNSPECIFIED_EXAM, new RegExp(check[1]));
});

test('a missing table (migration not applied) is recognised, other errors are not', () => {
  assert.equal(isMissingTable({ code: '42P01', message: 'relation "public.exam_results" does not exist' }), true);
  assert.equal(isMissingTable({ code: 'PGRST205', message: "Could not find the table 'public.exam_results' in the schema cache" }), true);
  assert.equal(isMissingTable({ code: '42501', message: 'permission denied for table exam_results' }), false);
  assert.equal(isMissingTable(null), false);
});

test('the outcomes in the code are exactly the ones the table accepts', () => {
  const m = /outcome text NOT NULL CHECK \(outcome IN \(([^)]*)\)\)/.exec(SQL);
  assert.ok(m, 'the migration constrains outcome');
  const sqlOutcomes = m[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).sort();
  assert.deepEqual([...EXAM_OUTCOMES].sort(), sqlOutcomes);
});

// ── the migration ────────────────────────────────────────────────────────

test('the migration is additive: one new table, nothing dropped or altered elsewhere', () => {
  assert.match(SQL, /CREATE TABLE IF NOT EXISTS public\.exam_results \(/);
  assert.match(SQL, /user_id uuid NOT NULL REFERENCES auth\.users\(id\)/);
  assert.match(SQL, /exam_date date NOT NULL/);
  assert.match(SQL, /CREATE UNIQUE INDEX IF NOT EXISTS \w+\s+ON public\.exam_results \(user_id, exam, exam_date\)/);
  assert.doesNotMatch(SQL, /\bDROP\s+(TABLE|COLUMN|FUNCTION|TRIGGER)\b/i, 'no drops outside the commented rollback');
  for (const m of SQL.matchAll(/\bALTER\s+TABLE\s+([\w.]+)/gi)) assert.equal(m[1], 'public.exam_results');
  for (const m of SQL.matchAll(/\bON\s+(?:TABLE\s+)?(public\.\w+)/gi)) assert.equal(m[1], 'public.exam_results');
  assert.doesNotMatch(SQL, /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/i, 'no functions: plain own-row RLS');
});

test('RLS is on with own-row select/insert/update policies only, for authenticated', () => {
  assert.match(SQL, /ALTER TABLE public\.exam_results ENABLE ROW LEVEL SECURITY;/);
  const policies = parsePolicies(SQL).filter((p) => p.table === 'exam_results');
  const byCmd = Object.fromEntries(policies.map((p) => [p.cmd, p]));
  assert.deepEqual(policies.map((p) => p.cmd).sort(), ['INSERT', 'SELECT', 'UPDATE']);
  for (const p of policies) assert.deepEqual(p.roles, ['authenticated'], `${p.policy} roles`);
  const own = /^\(?\s*auth\.uid\(\)\s*=\s*user_id\s*\)?$/;
  assert.match(byCmd.SELECT.using, own);
  assert.match(byCmd.INSERT.check, own);
  assert.match(byCmd.UPDATE.using, own);
  assert.match(byCmd.UPDATE.check, own, 'UPDATE needs WITH CHECK so a row cannot be handed to another user');
  assert.doesNotMatch(SQL, /FOR\s+(DELETE|ALL)\b/i, 'no delete policy');
});

test('grants: nothing for anon or PUBLIC, no DELETE for authenticated', () => {
  assert.match(SQL, /REVOKE ALL ON TABLE public\.exam_results FROM PUBLIC, anon, authenticated;/);
  const grants = [...SQL.matchAll(/GRANT\s+([\w\s,]+?)\s+ON\s+TABLE\s+public\.exam_results\s+TO\s+(\w+)/gi)]
    .map((m) => ({ privs: m[1].toUpperCase().split(/\s*,\s*/), role: m[2] }));
  assert.ok(grants.length > 0);
  for (const g of grants) {
    assert.notEqual(g.role, 'anon');
    assert.notEqual(g.role.toLowerCase(), 'public');
    if (g.role === 'authenticated') assert.deepEqual(g.privs.sort(), ['INSERT', 'SELECT', 'UPDATE']);
  }
  assert.doesNotMatch(SQL, /GRANT[^;]*\bTO\s+anon\b/i);
});

test('the header carries a rollback and the ledger marks the file not applied', () => {
  assert.match(RAW, /^-- Rollback[\s\S]*?--\s+DROP TABLE IF EXISTS public\.exam_results;/m);
  const readme = readFileSync(path.join(ROOT, 'migrations/README.md'), 'utf8');
  const row = readme.split('\n').find((l) => l.includes(`\`${FILE}\``));
  assert.ok(row, 'migrations/README.md lists the file');
  assert.match(row, /not yet applied/i);
});
