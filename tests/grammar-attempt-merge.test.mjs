// A weaker grammar re-run never undoes a better one (C-194).
//
// astro-site/src/lib/grammarProgress.js recorded each practice run by upserting
// is_completed and score as THAT run had them, and PostgREST's merge-duplicates
// overwrites every column named. One 50% "Practice again" after an 85% pass
// marked the topic not completed and lowered its score: the Astro hub pointed
// "Continue" back at it, the level page took its tick, and the dashboard walk
// went back a level. CLAUDE.md: better runs survive weaker repeats.
//
// The module imports the browser Supabase client (import.meta.env), so this
// suite runs its source with the client stubbed by an in-memory table that
// behaves like the upsert: named columns overwrite, ignoreDuplicates inserts only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = readFileSync(join(ROOT, 'astro-site/src/lib/grammarProgress.js'), 'utf8');

function load({ readFails = () => false } = {}) {
  const table = new Map();
  const writes = [];
  const supabase = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }) },
    from: (name) => {
      assert.equal(name, 'user_grammar_progress');
      const filters = {};
      const query = {
        select: (cols) => { query.cols = cols; return query; },
        eq: (col, value) => { filters[col] = value; return query; },
        maybeSingle: async () => {
          if (readFails()) return { data: null, error: { message: 'network' } };
          const row = table.get(`${filters.user_id}:${filters.topic_id}`) || null;
          return { data: row && Object.fromEntries(query.cols.split(',').map((c) => [c.trim(), row[c.trim()] ?? null])), error: null };
        },
        upsert: async (row, opts) => {
          writes.push({ row, opts });
          assert.equal(opts.onConflict, 'user_id,topic_id');
          const k = `${row.user_id}:${row.topic_id}`;
          if (table.has(k) && opts.ignoreDuplicates) return { error: null };
          table.set(k, { ...(table.get(k) || {}), ...row });
          return { error: null };
        },
      };
      return query;
    },
  };
  const body = SOURCE
    .replace(/^import \{ supabase \} from '\.\/supabase\.js';\n/m, '')
    .replace(/^export (async )?function /gm, (_, a) => `${a || ''}function `);
  assert.ok(!/^import /m.test(body), 'the module imports only the client');
  const mod = new Function('supabase', 'console', `${body}\nreturn { mergeGrammarAttempt, recordAttempt };`)(supabase, { warn: () => {} });
  return { ...mod, table, writes, row: (topic) => table.get(`u1:${topic}`) };
}

const T1 = '2026-10-01T10:00:00.000Z';
const T2 = '2026-10-05T10:00:00.000Z';

test('mergeGrammarAttempt: completion and the best score only go up; the first pass keeps its date', () => {
  const { mergeGrammarAttempt } = load();
  assert.deepEqual(mergeGrammarAttempt(null, 85, T1), { is_completed: true, score: 85, last_accessed: T1, completed_at: T1 });
  assert.deepEqual(mergeGrammarAttempt(null, 50, T1), { is_completed: false, score: 50, last_accessed: T1 });
  const passed = { is_completed: true, score: 85, completed_at: T1 };
  assert.deepEqual(mergeGrammarAttempt(passed, 50, T2), { is_completed: true, score: 85, last_accessed: T2, completed_at: T1 }, '85 then 50');
  assert.deepEqual(mergeGrammarAttempt(passed, 95, T2), { is_completed: true, score: 95, last_accessed: T2, completed_at: T1 }, 'a better pass keeps the first date');
  assert.deepEqual(mergeGrammarAttempt({ is_completed: false, score: 50, completed_at: null }, 85, T2), { is_completed: true, score: 85, last_accessed: T2, completed_at: T2 }, '50 then 85');
  assert.deepEqual(mergeGrammarAttempt({ is_completed: false, score: null, completed_at: null }, 40, T2), { is_completed: false, score: 40, last_accessed: T2 });
  assert.equal(mergeGrammarAttempt(null, 70, T1).is_completed, true, '70% passes, as before');
  assert.equal(mergeGrammarAttempt(null, 69, T1).is_completed, false);
});

test('recordAttempt: 85 then 50 stays completed at 85 with the first date; 50 then 85 completes', async () => {
  const m = load();
  await m.recordAttempt('topic-a', 85);
  const first = m.row('topic-a');
  assert.equal(first.is_completed, true);
  await m.recordAttempt('topic-a', 50);
  const after = m.row('topic-a');
  assert.equal(after.is_completed, true, 'one weaker re-run does not un-complete');
  assert.equal(after.score, 85);
  assert.equal(after.completed_at, first.completed_at, 'the completion day stays on the streak');
  assert.equal(after.current_stage, 1);

  await m.recordAttempt('topic-b', 50);
  assert.equal(m.row('topic-b').is_completed, false);
  assert.equal(m.row('topic-b').completed_at, undefined);
  await m.recordAttempt('topic-b', 85);
  assert.equal(m.row('topic-b').is_completed, true);
  assert.equal(m.row('topic-b').score, 85);
  assert.ok(m.row('topic-b').completed_at);
  assert.ok(m.writes.every((w) => !w.opts.ignoreDuplicates), 'a read that worked writes the merge');
});

test('when the read fails the write is insert-only: a first run is kept, a stored pass is never overwritten unread', async () => {
  let failing = false;
  const m = load({ readFails: () => failing });
  await m.recordAttempt('topic-c', 90);
  failing = true;
  await m.recordAttempt('topic-c', 40);
  assert.equal(m.row('topic-c').is_completed, true);
  assert.equal(m.row('topic-c').score, 90);
  assert.equal(m.writes.at(-1).opts.ignoreDuplicates, true);
  await m.recordAttempt('topic-d', 75);
  assert.equal(m.row('topic-d').is_completed, true, 'nothing stored yet: the run is inserted');
});

test('the stale "only the columns provided" promise and the dead GrammarLessonPage reference are gone', () => {
  assert.doesNotMatch(SOURCE, /GrammarLessonPage/);
  assert.doesNotMatch(SOURCE, /Only the\s+columns provided are written/);
  assert.match(SOURCE, /\.maybeSingle\(\)/, 'the stored row is read before the write');
});
