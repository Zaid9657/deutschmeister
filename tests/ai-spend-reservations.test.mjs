import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { reserveUsage, validAnonymousId, validExamAttemptId } from '../netlify/functions/_shared/aiReservation.mjs';
import { isMissingSchema, logMigrationPending } from '../netlify/functions/_shared/migrationPending.mjs';
import { uaClass, cleanSource } from '../netlify/functions/_shared/xraySource.mjs';
import { writingTaskByKey, courseWritingTasks, MAX_WRITING_POINTS } from '../netlify/functions/_shared/writingTasks.mjs';
import { a2WritingFormat } from '../netlify/functions/_shared/examFormats.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const userId = '12345678-1234-1234-1234-123456789abc';
const attemptId = '22345678-1234-1234-1234-123456789abc';
const quiet = { log() {}, warn() {}, error() {} };

function database({ reservationError = null, allowed = true, attempt = null, saveError = null, countError = null } = {}) {
  const state = { reservations: [], providerCalls: 0, reserved: [], updates: [] };
  return {
    state,
    async rpc(name, args) {
      state.reservations.push({ name, args });
      if (reservationError) return { error: reservationError };
      if (!allowed) return { data: { allowed: false, used: 60 } };
      const row = { id: 'reservation-1', allowed: true, used: 0, before: 0, revision: false };
      state.reserved.push(row);
      return { data: row };
    },
    from(table) {
      let updating = false;
      let deleting = false;
      const query = {
        select() { return query; }, eq() { return query; }, like() { return query; },
        gte() { return query; }, is() { return query; }, order() { return query; },
        update(value) { updating = true; state.updates.push({ table, value }); return query; },
        insert() { return query; }, delete() { deleting = true; return query; },
        maybeSingle() { return Promise.resolve({ data: attempt }); },
        single() { return Promise.resolve({ data: saveError ? null : { id: 'reservation-1' }, error: saveError }); },
        then(resolve, reject) {
          if (deleting) state.reserved.length = 0;
          return Promise.resolve(updating ? { error: saveError } : { data: [], count: 0, error: countError }).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

function handler(name, db, { anonymous = false, failProvider = false, badEvaluation = false } = {}) {
  const context = vm.createContext({
    createClient: () => db, supabase: db, supabaseKey: 'test-service-key',
    process: { env: { SUPABASE_SERVICE_ROLE_KEY: 'test-service-key', ANTHROPIC_API_KEY: 'test-key', OPENAI_API_KEY: 'test-key' } },
    console: quiet, createHash, reserveUsage, validAnonymousId, validExamAttemptId, uaClass, cleanSource,
    isMissingSchema, logMigrationPending,
    getAuthenticatedUserId: async () => anonymous ? null : userId,
    unauthorizedResponse: () => ({ statusCode: 401 }), getTier: async () => 'free_expired',
    writingTaskByKey, courseWritingTasks, MAX_WRITING_POINTS, a2WritingFormat,
    ruleCard: () => null, ruleCardText: () => null,
    AIError: class extends Error {},
    transcribeAudio: async () => {
      assert.equal(db.state.reserved.length, 1, 'transcription must have a committed reservation');
      db.state.providerCalls++;
      return 'Guten Tag';
    },
    alignTranscript: () => ({ words: [], pct: 1, extra: 0 }),
    fetch: async () => {
      assert.equal(db.state.reserved.length, 1, 'the model must have a committed reservation');
      db.state.providerCalls++;
      if (failProvider) throw new Error('provider unavailable');
      const text = badEvaluation ? '{}' : name === 'evaluate-writing'
        ? JSON.stringify({ scores: { task: 3, structure: 3, accuracy: 3, vocabulary: 3 }, total_score: 12,
          feedback: 'Gut', leitpunkt_check: [true, true, true, true, true], corrections: [], strengths: [], improvements: [] })
        : name === 'analyze-sentence' ? '{"words":[],"insight":null,"fullTranslation":"Hello"}' : 'Eine Erklärung.';
      return { ok: true, json: async () => ({ content: [{ type: 'text', text }] }) };
    },
  });
  let source = read(`netlify/functions/${name}.mjs`).replace(/^import .*;\r?\n/gm, '');
  if (name === 'analyze-sentence' || name === 'evaluate-writing') {
    source = source.replace(/^const supabaseKey = .*;$/m, '');
    // These two handlers initialise their own client; the others import it.
    delete context.supabase;
  }
  source = source.replace(/\bexport /g, '');
  return vm.runInContext(`${source}\nhandler;`, context);
}

const bodies = {
  'analyze-sentence': { sentence: 'Guten Tag.', anonymousId: 'browser-anon-123' },
  'explain-answer': { itemId: 'item-1', questionDe: 'Guten ...', expected: 'Tag' },
  'score-readaloud': { audioBase64: 'YWJj', expected: 'Guten Tag', lektionId: 'a1.1-l01', lineKey: 'line-1' },
  'evaluate-writing': { exam_key: 'goethe_a1', task_key: 'a11-l01', text: 'Anna Keller, Berlin, Deutschland, Deutsch' },
};
const event = (body) => ({ httpMethod: 'POST', headers: {}, body: JSON.stringify(body) });

test('anonymous IDs reject NUL, control characters, whitespace and excessive length', async () => {
  for (const value of ['anonymous\0bad', 'anonymous\nbad', ' anonymous-id ', 'x'.repeat(129), [], 'short']) {
    assert.equal(validAnonymousId(value), false);
    const db = database();
    const response = await handler('analyze-sentence', db, { anonymous: true })(event({ ...bodies['analyze-sentence'], anonymousId: value }));
    assert.equal(response.statusCode, 400);
    assert.equal(db.state.providerCalls, 0);
    assert.equal(db.state.reservations.length, 0);
  }
  assert.equal(validAnonymousId('anonymous_browser-123'), true);
});

for (const name of Object.keys(bodies)) {
  test(`${name}: reservation errors never spend without a committed usage row`, async () => {
    for (const failure of [{ message: 'database unavailable' }, { code: 'PGRST202', message: 'RPC not applied' }]) {
      const db = database({ reservationError: failure, saveError: { message: 'legacy usage insert failed' } });
      const response = await handler(name, db, { anonymous: name === 'analyze-sentence' })(event(bodies[name]));
      assert.equal(response.statusCode, 503);
      assert.equal(db.state.providerCalls, 0);
    }
  });

  test(`${name}: an atomic quota refusal never calls a provider`, async () => {
    const db = database({ allowed: false });
    const response = await handler(name, db, { anonymous: name === 'analyze-sentence' })(event(bodies[name]));
    assert.equal(response.statusCode, 429);
    assert.equal(db.state.providerCalls, 0);
  });

  test(`${name}: provider work starts after the usage row is reserved`, async () => {
    const db = database({ saveError: { message: 'result save failed' } });
    const response = await handler(name, db, { anonymous: name === 'analyze-sentence' })(event(bodies[name]));
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(db.state.providerCalls, 1);
    assert.equal(db.state.reserved.length, 1, 'result-save failure must not erase usage');
    if (name === 'evaluate-writing') assert.equal(JSON.parse(response.body).saved, false);
    if (name === 'score-readaloud') assert.equal(db.state.reservations[0].args.p_error_tag, null, 'reserve usage without labelling an unscored clip a pronunciation error');
  });
}

test('writing rejects malformed and unowned exam attempts before reservation or evaluation', async () => {
  for (const value of ['not-a-uuid', '', 123, [attemptId], attemptId]) {
    const db = database();
    const response = await handler('evaluate-writing', db)(event({ ...bodies['evaluate-writing'], exam_attempt_id: value }));
    assert.equal(response.statusCode, 400);
    assert.equal(db.state.providerCalls, 0);
    assert.equal(db.state.reservations.length, 0);
  }
});

test('writing verifies an owned exam attempt before reserving its evaluation', async () => {
  const db = database({ attempt: { id: attemptId } });
  const response = await handler('evaluate-writing', db)(event({ ...bodies['evaluate-writing'], exam_attempt_id: attemptId }));
  assert.equal(response.statusCode, 200, response.body);
  assert.equal(db.state.reservations[0].args.p_exam_attempt_id, attemptId);
  assert.equal(db.state.providerCalls, 1);
});

test('writing releases unusable provider results without consuming the improved version', async () => {
  for (const options of [{ failProvider: true }, { badEvaluation: true }]) {
    const db = database();
    const response = await handler('evaluate-writing', db, options)(event(bodies['evaluate-writing']));
    assert.equal(response.statusCode, options.failProvider ? 500 : 200);
    if (options.badEvaluation) assert.equal(JSON.parse(response.body).evaluation_failed, true);
    assert.equal(db.state.reserved.length, 0, 'undelivered feedback must leave no empty letter or used revision');
  }
});

test('usage reservation rejects empty, malformed and unsuccessful insert results', async () => {
  for (const data of [null, {}, { allowed: true, used: 0 }, { allowed: true, id: 'x', used: -1 }]) {
    await assert.rejects(() => reserveUsage({ rpc: async () => ({ data }) }, 'reserve_test', {}));
  }
  await assert.rejects(() => reserveUsage(null, 'reserve_test', {}));
});

test('AI SQL serializes check-and-insert and protects metered stages from learner deletion', () => {
  const sql = read('migrations/2026-10-22-ai-usage-reservations.sql');
  assert.match(sql, /AS RESTRICTIVE FOR DELETE TO authenticated\s+USING \(stage IS NULL OR stage NOT IN \('explain', 'readaloud'\)\)/);
  for (const table of ['lesson_attempts', 'xray_usage', 'writing_submissions']) {
    const insert = sql.indexOf(`INSERT INTO public.${table}`);
    const start = sql.lastIndexOf('CREATE OR REPLACE FUNCTION', insert);
    const body = sql.slice(start, insert);
    assert.ok(body.indexOf('pg_advisory_xact_lock') < body.indexOf('SELECT count('), table);
    assert.match(body, /v_used >= p_limit/, table);
  }
  for (const fn of ['reserve_lesson_ai_usage', 'reserve_xray_usage', 'reserve_writing_usage']) {
    assert.match(sql, new RegExp(`REVOKE ALL ON FUNCTION public\\.${fn}\\([^;]+FROM PUBLIC, anon, authenticated;`));
  }
  assert.match(sql, /p_exam_attempt_id IS NOT NULL AND NOT EXISTS/);
  assert.match(sql, /AND user_id = p_user_id AND exam_key = p_exam_key/);
});
