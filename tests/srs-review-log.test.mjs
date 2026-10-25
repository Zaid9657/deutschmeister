// A vocabulary-trainer day stays in both streaks after its cards are reviewed
// again (cross-check 2026-10-25, AI-25 / C-188).
//
// vocab_srs_cards keeps ONE stamp per card, its latest review, and the streaks
// were built from it: Monday's trainer-only session vanished the moment the
// same cards were reviewed on Tuesday. migrations/2026-10-25-vocab-srs-review-
// log.sql adds an append-only review log filled by a trigger, and
// dashboardStats.js reads it next to the card stamps (failing soft until the
// owner applies the file).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { computeStreak, computeStreakForgiving, computeActivitiesToday, dayKey, srsReviewStamps } from '../src/services/dashboardStats.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

/** An ISO stamp `days` days ago, at local noon (streak days are local). */
const ago = (days, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(12, minute, 0, 0);
  return d.toISOString();
};
const WORDS = Array.from({ length: 20 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`);

test('a trainer-only day survives its cards being reviewed again (the C-188 probe)', () => {
  // Day −2: only a trainer session (20 cards). Day −1: a lesson. Today: activity.
  const monday = WORDS.map((word_id, i) => ({ word_id, reviewed_at: ago(2, i) }));
  const lesson = [ago(1)];
  const todayLesson = [ago(0)];
  const before = [...srsReviewStamps(monday.map((r) => ({ word_id: r.word_id, last_reviewed_at: r.reviewed_at })), []), ...lesson, ...todayLesson];
  assert.equal(computeStreak(before), 3);

  // Today the same 20 cards are reviewed again: each card row now holds today.
  const cardsNow = WORDS.map((word_id, i) => ({ word_id, last_reviewed_at: ago(0, 30 + i) }));
  const cardsOnly = [...srsReviewStamps(cardsNow, null), ...lesson, ...todayLesson];
  assert.equal(computeStreak(cardsOnly), 2, 'the defect: the card stamps alone lost day −2');

  // The log holds Monday's reviews and today's (the trigger copies each new stamp).
  const log = [...monday, ...cardsNow.map((c) => ({ word_id: c.word_id, reviewed_at: c.last_reviewed_at }))];
  const withLog = [...srsReviewStamps(cardsNow, log), ...lesson, ...todayLesson];
  assert.equal(computeStreak(withLog), 3, 'the trainer-only day must stay counted');
  assert.equal(computeStreakForgiving(new Set(withLog.map(dayKey))), 3);
});

test('a review held by both the card and the log counts once; a missing log changes nothing', () => {
  const cards = [{ word_id: WORDS[0], last_reviewed_at: ago(0) }, { word_id: WORDS[1], last_reviewed_at: ago(0, 5) }];
  // PostgREST may format the same instant differently; it is still one review.
  const log = [
    { word_id: WORDS[0], reviewed_at: new Date(ago(0)).toISOString().replace('Z', '+00:00') },
    { word_id: WORDS[1], reviewed_at: ago(0, 5) },
    { word_id: WORDS[1], reviewed_at: ago(3) },
  ];
  const stamps = srsReviewStamps(cards, log);
  assert.equal(stamps.length, 3);
  assert.equal(computeActivitiesToday(stamps), 2, 'one card review must not fill two daily-goal slots');
  for (const missing of [null, undefined, []]) {
    assert.deepEqual(srsReviewStamps(cards, missing), cards.map((c) => c.last_reviewed_at));
  }
  assert.deepEqual(srsReviewStamps(null, null), []);
  assert.deepEqual(srsReviewStamps([{ word_id: WORDS[0], last_reviewed_at: null }], [{ word_id: WORDS[0], reviewed_at: 'garbage' }]), []);
  // The same instant for two different words is two reviews.
  assert.equal(srsReviewStamps([], [{ word_id: WORDS[0], reviewed_at: ago(1) }, { word_id: WORDS[1], reviewed_at: ago(1) }]).length, 2);
});

/** loadDashboardStats against an in-memory database; `log` null = the table is missing. */
function dashboard({ cards, log }) {
  const reads = [];
  const supabase = { from(table) {
    let ordered = null;
    const query = {
      select(columns, options) { this.columns = columns; this.head = options?.head; return this; },
      eq() { return this; }, not() { return this; }, is() { return this; },
      order(column, options) { ordered = [column, options?.ascending]; return this; },
      then(resolve) {
        reads.push({ table, columns: this.columns, ordered });
        if (table === 'vocab_srs_reviews' && log === null) {
          return Promise.resolve({ data: null, error: { code: 'PGRST205', message: 'relation not found' } }).then(resolve);
        }
        const rows = table === 'vocab_srs_cards' ? cards : table === 'vocab_srs_reviews' ? log : [];
        return Promise.resolve({ data: this.head ? null : rows, count: rows.length, error: null }).then(resolve);
      },
    };
    return query;
  } };
  const source = read('src/services/dashboardStats.js').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  const load = vm.runInContext(`${source}\nloadDashboardStats;`, vm.createContext({ supabase, console, Date }));
  return { load, reads };
}

test('the dashboard reads the log next to the cards and survives its absence', async () => {
  const cards = [{ word_id: WORDS[0], last_reviewed_at: ago(0) }];
  const log = [{ word_id: WORDS[0], reviewed_at: ago(0) }, { word_id: WORDS[0], reviewed_at: ago(1) }];
  const live = dashboard({ cards, log });
  const stats = await live.load('learner');
  assert.equal(stats.streak, 2, 'yesterday is only in the log');
  assert.equal(stats.activitiesToday, 1, 'today\'s review is in both and counts once');
  const logRead = live.reads.find((r) => r.table === 'vocab_srs_reviews');
  assert.deepEqual(logRead, { table: 'vocab_srs_reviews', columns: 'word_id, reviewed_at', ordered: ['reviewed_at', false] });
  assert.equal(live.reads.find((r) => r.table === 'vocab_srs_cards').columns, 'word_id, last_reviewed_at');

  const pending = await dashboard({ cards, log: null }).load('learner');
  assert.equal(pending.streak, 1, 'before the migration the card stamps count alone');
  assert.equal(pending.activitiesToday, 1);
});

test('the migration: append-only log, own-row reads, a locked SECURITY DEFINER trigger, ledger row and fixture', () => {
  const sql = read('migrations/2026-10-25-vocab-srs-review-log.sql').replace(/--[^\n]*/g, ' ');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.vocab_srs_reviews \(/);
  assert.match(sql, /ALTER TABLE public\.vocab_srs_reviews ENABLE ROW LEVEL SECURITY;/);
  assert.match(sql, /FOR SELECT TO authenticated USING \(auth\.uid\(\) = user_id\);/);
  assert.equal((sql.match(/CREATE POLICY/g) || []).length, 1, 'learners read their rows and write none');
  assert.match(sql, /REVOKE ALL ON TABLE public\.vocab_srs_reviews FROM PUBLIC, anon, authenticated;/);
  assert.match(sql, /GRANT SELECT ON TABLE public\.vocab_srs_reviews TO authenticated;/);
  assert.doesNotMatch(sql, /GRANT (?:INSERT|UPDATE|DELETE|ALL)[^;]*TO (?:anon|authenticated)/);
  assert.match(sql, /RETURNS trigger\s+LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp/);
  assert.match(sql, /NEW\.last_reviewed_at IS NOT DISTINCT FROM OLD\.last_reviewed_at/, 'an unchanged stamp is not a review');
  assert.match(sql, /EXCEPTION WHEN OTHERS THEN\s+RAISE WARNING/, 'a logging failure must never undo the review');
  assert.match(sql, /REVOKE EXECUTE ON FUNCTION public\.log_vocab_srs_review\(\) FROM PUBLIC, anon, authenticated;/);
  assert.match(sql, /DROP TRIGGER IF EXISTS vocab_srs_review_log ON public\.vocab_srs_cards;/);
  assert.match(sql, /AFTER INSERT OR UPDATE OF last_reviewed_at ON public\.vocab_srs_cards\s+FOR EACH ROW EXECUTE FUNCTION public\.log_vocab_srs_review\(\);/);
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS vocab_srs_reviews_user_time_word_idx/);
  assert.match(sql, /AND NOT EXISTS \(/, 'the backfill is idempotent');
  assert.doesNotMatch(sql, /^\s*DO\b/m);
  const row = read('migrations/README.md').split('\n').find((l) => l.includes('`2026-10-25-vocab-srs-review-log.sql`'));
  assert.match(row, /not yet applied/i);
  const fixture = JSON.parse(read('tests/fixtures/db-schema.json'));
  assert.deepEqual(fixture.pendingApply.tables.vocab_srs_reviews.columns, ['id', 'reviewed_at', 'user_id', 'word_id']);
  // The trainer's write path is untouched: the trigger does the logging.
  assert.doesNotMatch(read('src/services/srsService.js'), /vocab_srs_reviews/);
});
