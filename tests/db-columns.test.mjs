// Every supabase-js query names only columns the LIVE table has.
//
// What this defends (measured 2026-09-28, Supabase edge + Postgres logs):
//   The SPA asked user_listening_progress for a `completed` column and
//   user_reading_progress for a `completed_at` column. Neither exists — each
//   table has the OTHER one's column. PostgREST answered all of it with 400:
//   in the 7 days to 09-28 10:00 UTC, 4 of 4 listening completions were
//   rejected on save and 823 progress reads failed (734 listening, 89 reading;
//   "column user_listening_progress.completed does not exist" 178 times in the
//   last 24 h alone). supabase-js resolves instead of throwing,
//   and every caller was fail-soft, so nothing surfaced: both tables held 0
//   rows ever, the listening level cards and the dashboard streak never
//   counted a finished exercise or reading lesson, and the activation mailer's
//   `has_listening_activity` could never be true.
//
//   The 2026-08-17 migration had already fixed this table once, for two other
//   columns (`answers`, `plays_used`). Its CREATE TABLE listed `completed`,
//   but the table already existed, so that line was a no-op and nobody saw
//   the third column was missing. A list of fixed columns does not close the
//   class; this rule does: every table and column a query names in src/ or
//   netlify/functions/ must be in tests/fixtures/db-schema.json, a snapshot of
//   what production HAS (not what a migration file intends).
//
// When this fails:
//   - on your new query: the column is not in production. Fix the name, or
//     write the migration, have it applied, THEN refresh the snapshot (the
//     SQL is in the fixture's "refresh" key).
//   - after a migration was applied: refresh the snapshot from the live DB.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  scanSource,
  parseSelect,
  listSourceFiles,
  scanFiles,
  findViolations,
} from './helpers/supabaseQueries.mjs';
import { isListeningDone } from '../src/lib/listeningProgress.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT = JSON.parse(readFileSync(path.join(ROOT, 'tests/fixtures/db-schema.json'), 'utf8'));
const LIVE = SNAPSHOT.tables;

// Migrations committed but NOT yet applied by hand (migrations/README.md). Code
// may query what they create only because its caller is fail-soft until then
// and the feature it serves is off (course v2: COURSE_V2_LIVE is empty). The
// columns are read from the migration file itself, never typed here, so a query
// that names something the migration does not create still fails. Once the
// owner applies one: refresh the snapshot and delete its line — the test below
// fails until you do.
const PENDING_MIGRATIONS = ['migrations/2026-10-01-course-v2.sql'];

const COLUMN_LINE = /^\s+([a-z_][a-z0-9_]*)\s+(?:uuid|text|bigserial|serial|bigint|integer|int|smallint|numeric|real|double|boolean|date|timestamptz|time|jsonb)\b/i;
function pendingSchema(sql) {
  const code = sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  const created = {};
  for (const m of code.matchAll(/CREATE TABLE IF NOT EXISTS public\.(\w+) \(([\s\S]*?)\n\);/g)) {
    created[m[1]] = m[2].split('\n').map((l) => l.match(COLUMN_LINE)?.[1]).filter(Boolean).sort();
  }
  const added = {};
  for (const m of code.matchAll(/ALTER TABLE public\.(\w+) ADD COLUMN IF NOT EXISTS (\w+)/g)) {
    (added[m[1]] ||= []).push(m[2]);
  }
  return { created, added };
}
const PENDING = PENDING_MIGRATIONS.map((f) => ({ file: f, ...pendingSchema(readFileSync(path.join(ROOT, f), 'utf8')) }));
const TABLES = { ...LIVE };
for (const { created, added } of PENDING) {
  Object.assign(TABLES, created);
  for (const [t, cols] of Object.entries(added)) if (TABLES[t]) TABLES[t] = [...new Set([...TABLES[t], ...cols])];
}

const scanRepo = () => scanFiles(listSourceFiles(['src', 'netlify/functions'], ROOT), ROOT);
const violationsIn = (source) => findViolations(scanSource(source, 'fixture.js').refs, TABLES);
const problems = (source) => violationsIn(source).map((v) => v.problem).sort();

// ── the snapshot ─────────────────────────────────────────────────────────

test('the schema snapshot is dated, complete and says how to refresh it', () => {
  assert.match(SNAPSHOT.dumpedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(SNAPSHOT.refresh, /information_schema\.columns/);
  // PostgREST reported "Schema cache loaded 61 Relations" on 2026-09-28.
  assert.ok(Object.keys(TABLES).length >= 55, `only ${Object.keys(TABLES).length} tables in the snapshot`);
  for (const [t, cols] of Object.entries(TABLES)) {
    assert.ok(Array.isArray(cols) && cols.length > 0, `${t} has no columns`);
    assert.deepEqual([...cols].sort(), cols, `${t}: keep columns sorted so a refresh diffs cleanly`);
  }
});

test('the two progress tables are shaped as the 2026-09-28 fix assumes', () => {
  const listening = TABLES.user_listening_progress;
  const reading = TABLES.user_reading_progress;
  assert.ok(listening.includes('completed_at') && !listening.includes('completed'));
  assert.ok(reading.includes('completed') && reading.includes('last_read_at') && !reading.includes('completed_at'));
});

test('a pending migration is really pending, and is read as a schema', () => {
  for (const { file, created } of PENDING) {
    const tables = Object.keys(created);
    assert.ok(tables.length > 0, `${file}: no CREATE TABLE read — the parser no longer matches the file`);
    for (const t of tables) assert.ok(created[t].length >= 3, `${file}: ${t} read with only ${created[t].length} columns`);
    const live = tables.filter((t) => t in LIVE);
    assert.deepEqual(live, [], `${file} is applied (${live.join(', ')} in the snapshot): delete it from PENDING_MIGRATIONS`);
  }
  // The course v2 migration, read: the columns its queries depend on.
  const v2 = PENDING.find((p) => p.file.endsWith('2026-10-01-course-v2.sql'));
  assert.ok(v2.created.learner_goals.includes('band'), 'learner_goals is keyed by band (progress.js reads it by band)');
  assert.ok(v2.created.course_ai_usage.includes('slot_key'));
  assert.ok(v2.created.course_events.includes('props'));
});

// ── the rule ─────────────────────────────────────────────────────────────

test('every query in src/ and netlify/functions/ names only live tables and columns', () => {
  const { refs } = scanRepo();
  const bad = findViolations(refs, TABLES);
  assert.deepEqual(
    bad.map((v) => `${v.file}:${v.line} .${v.method}() → ${v.problem}`),
    [],
    'a query names something production does not have; PostgREST will answer 400 and supabase-js will not throw',
  );
});

// Coverage, so a scanner regression cannot pass green by finding nothing.
// Measured 2026-09-28: 351 files, 323 chains, 1,352 column references.
const MIN_CHAINS = 300;
const MIN_COLUMN_REFS = 1200;
// Chains whose table, select or row the scanner cannot resolve statically
// (admin tables chosen at runtime, rows built by helpers). A ratchet: it must
// equal the measurement. Lower it when you make one static; raise it only
// with a reason, since every one of these is a query this rule cannot see.
const UNRESOLVED = 15;

test('the scanner still sees the repo (coverage floor and unresolved ratchet)', () => {
  const { refs, chains, skipped } = scanRepo();
  assert.ok(chains >= MIN_CHAINS, `only ${chains} .from() chains found`);
  const columnRefs = refs.filter((r) => r.column !== null).length;
  assert.ok(columnRefs >= MIN_COLUMN_REFS, `only ${columnRefs} column references found`);
  assert.equal(skipped.length, UNRESOLVED, `unresolved query parts:\n${skipped.join('\n')}`);
});

// ── it would have caught it: the exact pre-fix code ──────────────────────

test('the pre-2026-09-28 listening and reading queries all fail the rule', () => {
  const before = `
    // src/contexts/ProgressContext.jsx
    supabase.from('user_listening_progress').select('exercise_id').eq('user_id', userId).eq('completed', true);
    // src/hooks/useListening.js
    await supabase.from('user_listening_progress').select('exercise_id, completed, score').eq('user_id', user.id);
    await supabase.from('user_listening_progress').upsert(
      { user_id: user.id, exercise_id: exerciseId, completed: true, score, answers, plays_used: playsUsed,
        completed_at: new Date().toISOString() },
      { onConflict: 'user_id,exercise_id' });
    // src/services/dashboardStats.js
    supabase.from('user_reading_progress').select('completed_at').eq('user_id', userId).eq('completed', true);
    supabase.from('user_listening_progress').select('completed_at').eq('user_id', userId).eq('completed', true);
    // src/services/readingService.js
    await supabase.from('user_reading_progress').upsert(
      { user_id: userId, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() },
      { onConflict: 'user_id,lesson_id' });
  `;
  assert.deepEqual(problems(before), [
    'user_listening_progress.completed does not exist', // ProgressContext .eq
    'user_listening_progress.completed does not exist', // useListening .select
    'user_listening_progress.completed does not exist', // useListening .upsert
    'user_listening_progress.completed does not exist', // dashboardStats .eq
    'user_reading_progress.completed_at does not exist', // dashboardStats .select
    'user_reading_progress.completed_at does not exist', // readingService .upsert
  ]);
});

// ── every path through the scanner catches a wrong column ────────────────

test('the scanner checks every place a query names a column', () => {
  const cases = {
    select: "sb.from('profiles').select('id, nope')",
    'select alias/cast/json': "sb.from('weekly_metrics').select('m:metrics->course, nope::text')",
    embed: "sb.from('listening_exercises').select('id, listening_questions(id, nope)')",
    eq: "sb.from('profiles').select('id').eq('nope', 1)",
    not: "sb.from('profiles').select('id').not('nope', 'is', null)",
    in: "sb.from('profiles').select('id').in('nope', [1])",
    order: "sb.from('profiles').select('id').order('nope', { ascending: false })",
    or: "sb.from('profiles').select('id').or('email.eq.a,nope.is.null')",
    match: "sb.from('profiles').select('id').match({ nope: 1 })",
    insert: "sb.from('profiles').insert({ id: 1, nope: 2 })",
    'insert rows[]': "sb.from('profiles').insert([{ id: 1 }, { nope: 2 }])",
    update: "sb.from('profiles').update({ nope: 2 }).eq('id', 1)",
    'upsert onConflict': "sb.from('profiles').upsert({ id: 1 }, { onConflict: 'id,nope' })",
    'row bound to a const': "const row = { id: 1, nope: 2 }; sb.from('profiles').insert(row)",
    'row via map + spread + ternary': `
      const base = items.map((a) => ({ id: a.id }));
      const rows = stamp ? base.map((r) => ({ ...r, nope: stamp })) : base;
      sb.from('profiles').insert(rows);`,
    'spread of a const': "const extra = { nope: 1 }; sb.from('profiles').update({ ...extra, email: 'x' })",
    'table from a const': "const TABLE = 'profiles'; sb.from(TABLE).select('nope')",
    'awaited, multi-line': `
      const { data } = await client
        .from('profiles')
        .select('id')
        .eq('user_id', id);`,
  };
  for (const [name, source] of Object.entries(cases)) {
    const got = problems(source);
    const want = name === 'awaited, multi-line' ? 'profiles.user_id does not exist' : 'profiles.nope does not exist';
    if (name === 'select alias/cast/json') {
      assert.deepEqual(got, ['weekly_metrics.nope does not exist'], name);
    } else if (name === 'embed') {
      assert.deepEqual(got, ['listening_questions.nope does not exist'], name);
    } else {
      assert.deepEqual(got, [want], name);
    }
  }
});

test('the scanner flags an unknown table and leaves non-tables alone', () => {
  assert.deepEqual(problems("sb.from('level_test_results').select('*')"), ['unknown table level_test_results']);
  const clean = `
    supabase.storage.from('audio').getPublicUrl('x.mp3');
    Array.from('abc'); Buffer.from('x', 'base64');
    supabase.schema('auth').from('users').select('nope');
    sb.from('profiles').select('id, email, count').order('created_at', { referencedTable: 'x' });
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('id', 1);
    sb.from('profiles').select('id').eq('subscriptions.status', 'active');`;
  assert.deepEqual(problems(clean), []);
});

test('parseSelect reads PostgREST select syntax', () => {
  assert.deepEqual(parseSelect('*'), { columns: [], embeds: [] });
  assert.deepEqual(parseSelect(' id ,\n name '), { columns: ['id', 'name'], embeds: [] });
  assert.deepEqual(parseSelect('alias:col, col2::text, meta->a->>b, id.count(), count()').columns, ['col', 'col2', 'meta', 'id']);
  assert.deepEqual(parseSelect('id, topic:grammar_topics!inner(slug, title_en)'), {
    columns: ['id'],
    embeds: [{ name: 'grammar_topics', inner: 'slug,title_en' }],
  });
});

// ── the one definition the fixed readers share ───────────────────────────

test('a listening row counts as done by completed_at, the only stamp the table has', () => {
  assert.equal(isListeningDone(null), false);
  assert.equal(isListeningDone(undefined), false);
  assert.equal(isListeningDone({ score: 80 }), false);
  assert.equal(isListeningDone({ completed: true }), false, 'the table has no `completed` column to trust');
  assert.equal(isListeningDone({ completed_at: '2026-09-28T08:00:00Z', score: 80 }), true);
});

test('the listening save and the level/card readers use the shared rule', () => {
  const hook = readFileSync(path.join(ROOT, 'src/hooks/useListening.js'), 'utf8');
  const card = readFileSync(path.join(ROOT, 'src/components/listening/ExerciseCard.jsx'), 'utf8');
  assert.match(hook, /isListeningDone\(progressMap\[ex\.id\]\)/);
  assert.match(card, /isListeningDone\(exercise\.progress\)/);
  // The save must surface a REST error; supabase-js does not throw on one.
  assert.match(hook, /if \(error\) console\.error\('\[useListening\] saveProgress:/);
});
