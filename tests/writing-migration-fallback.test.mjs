import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { reserveUsage, validExamAttemptId } from '../netlify/functions/_shared/aiReservation.mjs';
import { writingTaskByKey, courseWritingTasks, MAX_WRITING_POINTS } from '../netlify/functions/_shared/writingTasks.mjs';

const source = readFileSync(new URL('../netlify/functions/evaluate-writing.mjs', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, '').replace(/\bexport /g, '');
const userId = '12345678-1234-1234-1234-123456789abc';
const attemptId = '22345678-1234-1234-1234-123456789abc';
const missingCodes = ['PGRST202', 'PGRST204', 'PGRST205', '42883', '42P01', '42703'];
const bodies = {
  course: { exam_key: 'goethe_a1', task_key: 'a11-l01', text: 'Anna Keller, Berlin, Deutschland, Deutsch' },
  exam: { exam_key: 'goethe_a1', task_key: 'formular-hotel-anmeldung', text: 'Anna Keller, Berlin, Deutschland, Deutsch' },
};

function database({ rpcError = { code: 'PGRST202', message: 'RPC not applied' }, insertError = null,
  count = 0, rows = [], saveError = null, attempt = null } = {}) {
  const state = { calls: [], inserts: [], updates: [], reserved: new Set(), providerCalls: 0 };
  return {
    state,
    async rpc(name, args) {
      state.calls.push({ method: 'rpc', name, args });
      return { error: rpcError };
    },
    from(table) {
      let operation = 'select';
      const filters = [];
      const query = {
        select() { return query; },
        eq(key, value) { filters.push([key, value]); return query; },
        like(key, value) { filters.push([key, value]); return query; },
        gte(key, value) { filters.push([key, value]); return query; },
        order() { return query; },
        insert(value) { operation = 'insert'; state.inserts.push({ table, value }); return query; },
        update(value) { operation = 'update'; state.updates.push({ table, value }); return query; },
        delete() { operation = 'delete'; return query; },
        maybeSingle() { return Promise.resolve({ data: attempt }); },
        single() {
          if (operation === 'insert') {
            state.calls.push({ method: 'insert', table, filters });
            if (insertError) return Promise.resolve({ error: insertError });
            state.reserved.add('legacy-submission');
            return Promise.resolve({ data: { id: 'legacy-submission' } });
          }
          state.calls.push({ method: 'update', table, filters });
          return Promise.resolve({ data: saveError ? null : { id: 'legacy-submission' }, error: saveError });
        },
        then(resolve, reject) {
          state.calls.push({ method: operation, table, filters });
          if (operation === 'delete') state.reserved.delete(filters.find(([key]) => key === 'id')?.[1]);
          return Promise.resolve({ data: rows, count }).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

function writingHandler(db, { tier = 'free_expired', badEvaluation = false, failProvider = false } = {}) {
  const context = vm.createContext({
    createClient: () => db,
    process: { env: { SUPABASE_SERVICE_ROLE_KEY: 'test-service-key', ANTHROPIC_API_KEY: 'test-key' } },
    console: { log() {}, warn() {}, error() {} },
    reserveUsage, validExamAttemptId, writingTaskByKey, courseWritingTasks, MAX_WRITING_POINTS,
    getAuthenticatedUserId: async () => userId,
    unauthorizedResponse: () => ({ statusCode: 401 }),
    getTier: async () => tier,
    fetch: async () => {
      assert.equal(db.state.reserved.size, 1, 'legacy submission must be committed before the model call');
      db.state.calls.push({ method: 'provider' });
      db.state.providerCalls++;
      if (failProvider) throw new Error('provider unavailable');
      const text = badEvaluation ? '{}' : JSON.stringify({
        scores: { task: 3, structure: 3, accuracy: 3, vocabulary: 3 }, total_score: 12,
        feedback: 'Gut', leitpunkt_check: [true, true, true, true, true], corrections: [], strengths: [], improvements: [],
      });
      return { ok: true, json: async () => ({ content: [{ text }] }) };
    },
  });
  return vm.runInContext(`${source}\nhandler;`, context);
}

const event = (body) => ({ httpMethod: 'POST', headers: {}, body: JSON.stringify(body) });

for (const [scope, body] of Object.entries(bodies)) {
  const options = { tier: scope === 'exam' ? 'pro' : 'free_expired' };

  test(`writing ${scope}: missing reservation schema uses the existing ledger before the provider`, async () => {
    for (const code of missingCodes) {
      const db = database({ rpcError: { code, message: 'migration pending' } });
      const response = await writingHandler(db, options)(event(body));
      assert.equal(response.statusCode, 200, response.body);
      assert.equal(db.state.providerCalls, 1);
      assert.equal(db.state.inserts.length, 1);
      const insert = db.state.inserts[0];
      assert.equal(insert.table, 'writing_submissions');
      assert.deepEqual({ ...insert.value }, {
        user_id: userId, exam_key: body.exam_key, task_key: body.task_key,
        exam_attempt_id: null, submission_text: body.text, word_count: 5, model: 'claude-sonnet-4-6',
      });
      const methods = db.state.calls.map((call) => call.method);
      assert.ok(methods.indexOf('select') < methods.indexOf('rpc'));
      assert.ok(methods.indexOf('insert') < methods.indexOf('provider'));
      assert.ok(methods.indexOf('provider') < methods.indexOf('update'));
      const result = JSON.parse(response.body);
      assert.equal(result.saved, true);
      assert.equal(result.submission_id, 'legacy-submission');
      assert.equal(result.used, 1);
    }
  });

  test(`writing ${scope}: missing RPC plus a failed legacy insert blocks the provider`, async () => {
    const db = database({ insertError: { code: '42501', message: 'insert denied' } });
    const response = await writingHandler(db, options)(event(body));
    assert.equal(response.statusCode, 503);
    assert.equal(db.state.inserts.length, 1);
    assert.equal(db.state.providerCalls, 0);
    assert.equal(db.state.reserved.size, 0);
  });

  test(`writing ${scope}: non-missing RPC errors fail closed without a legacy insert`, async () => {
    for (const error of [{ code: '42501', message: 'permission denied' }, { code: '57014', message: 'timeout' }, { message: 'database unavailable' }]) {
      const db = database({ rpcError: error });
      const response = await writingHandler(db, options)(event(body));
      assert.equal(response.statusCode, 503);
      assert.equal(db.state.inserts.length, 0);
      assert.equal(db.state.providerCalls, 0);
    }
  });
}

test('writing fallback preserves the quota and free revision gates before reservation', async () => {
  const db = database({ rows: [{ task_key: 'a11-l01' }, { task_key: 'a11-l01' }] });
  const response = await writingHandler(db)(event(bodies.course));
  assert.equal(response.statusCode, 429);
  assert.equal(db.state.inserts.length, 0);
  assert.equal(db.state.providerCalls, 0);
  assert.ok(db.state.calls.every((call) => call.method !== 'rpc'));

  const examDb = database({ count: 20 });
  const examResponse = await writingHandler(examDb, { tier: 'pro' })(event(bodies.exam));
  assert.equal(examResponse.statusCode, 429);
  assert.equal(examDb.state.providerCalls, 0);
  assert.equal(examDb.state.inserts.length, 0);

  const revisionDb = database({ rows: [{ task_key: 'a11-l01' }] });
  const revision = await writingHandler(revisionDb)(event(bodies.course));
  assert.equal(revision.statusCode, 200, revision.body);
  assert.equal(JSON.parse(revision.body).used, 1, 'one free revision must not charge another task');
  assert.equal(JSON.parse(revision.body).can_revise, false);
});

test('writing fallback keeps attempt validation and ownership checks ahead of spending', async () => {
  for (const value of ['invalid', attemptId]) {
    const db = database();
    const response = await writingHandler(db)(event({ ...bodies.course, exam_attempt_id: value }));
    assert.equal(response.statusCode, 400);
    assert.equal(db.state.inserts.length, 0);
    assert.equal(db.state.providerCalls, 0);
  }
  const db = database({ attempt: { id: attemptId } });
  const response = await writingHandler(db)(event({ ...bodies.course, exam_attempt_id: attemptId }));
  assert.equal(response.statusCode, 200, response.body);
  assert.equal(db.state.inserts[0].value.exam_attempt_id, attemptId);
});

test('writing fallback releases unusable feedback and keeps delivered feedback charged on a save failure', async () => {
  for (const options of [{ badEvaluation: true }, { failProvider: true }]) {
    const db = database();
    const response = await writingHandler(db, options)(event(bodies.course));
    assert.equal(response.statusCode, options.failProvider ? 500 : 200);
    assert.equal(db.state.reserved.size, 0);
    if (options.badEvaluation) assert.equal(JSON.parse(response.body).evaluation_failed, true);
  }
  const db = database({ saveError: { message: 'result save failed' } });
  const response = await writingHandler(db)(event(bodies.course));
  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).saved, false);
  assert.equal(db.state.reserved.size, 1);
});
