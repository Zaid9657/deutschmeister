import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { reserveUsage } from '../netlify/functions/_shared/aiReservation.mjs';

const userId = '12345678-1234-1234-1234-123456789abc';
const missingCodes = ['PGRST202', 'PGRST204', 'PGRST205', '42883', '42P01', '42703'];
const quiet = { log() {}, warn() {}, error() {} };
const bodies = {
  'explain-answer': { itemId: 'item-1', topic: 'articles', questionDe: 'Guten ...', expected: 'Tag', level: 'a1.1', lektionId: 'a1.1-l01' },
  'score-readaloud': { audioBase64: 'YWJj', expected: 'Guten Tag', lektionId: 'a1.1-l01', lineKey: 'line-1' },
};

function database({ code = 'PGRST202', used = 2, countError = null, insertError = null, insertThrows = false, noId = false } = {}) {
  const state = { events: [], counts: [], inserts: [], updates: [], providerCalls: 0 };
  return {
    state,
    async rpc(name) {
      state.events.push('rpc');
      assert.equal(name, 'reserve_lesson_ai_usage');
      return { error: { code, message: 'Reservation unavailable' } };
    },
    from(table) {
      assert.equal(table, 'lesson_attempts');
      let inserted = false;
      let updating = false;
      const filters = [];
      const query = {
        select(_columns, options) {
          if (options?.head) state.counts.push({ table, filters });
          return query;
        },
        eq(column, value) { filters.push([column, value]); return query; },
        gte(column, value) { filters.push([column, value]); return query; },
        insert(row) {
          state.events.push('insert');
          state.inserts.push(row);
          inserted = true;
          if (insertThrows) throw new Error('Legacy write unavailable');
          return query;
        },
        update(row) {
          state.events.push('update');
          state.updates.push({ row, filters });
          updating = true;
          return query;
        },
        async single() {
          assert.equal(inserted, true);
          return { data: noId || insertError ? null : { id: 'legacy-attempt-1' }, error: insertError };
        },
        then(resolve, reject) {
          if (!updating && !inserted) state.events.push('count');
          return Promise.resolve(updating ? { error: null } : { count: used, error: countError }).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

function handler(name, db) {
  const provider = () => {
    assert.equal(db.state.inserts.length, 1, 'legacy usage must be written before a provider call');
    db.state.events.push('provider');
    db.state.providerCalls++;
  };
  const context = vm.createContext({
    supabase: db, supabaseKey: 'test-service-key',
    process: { env: { ANTHROPIC_API_KEY: 'test-key', OPENAI_API_KEY: 'test-key' } },
    console: quiet, reserveUsage,
    getAuthenticatedUserId: async () => userId,
    unauthorizedResponse: () => ({ statusCode: 401 }),
    ruleCard: () => ({}), ruleCardText: () => 'Die Regel dieses Kurses.',
    AIError: class extends Error {},
    transcribeAudio: async () => { provider(); return 'Guten Tag'; },
    alignTranscript: () => ({ words: [], pct: 1, extra: 0 }),
    fetch: async (_url, options) => {
      provider();
      assert.match(JSON.parse(options.body).system, /Die Regel dieses Kurses/);
      return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'Eine Erklärung.' }] }) };
    },
  });
  const source = readFileSync(new URL(`../netlify/functions/${name}.mjs`, import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/\bexport /g, '');
  return vm.runInContext(`${source}\nhandler;`, context);
}

const event = (name) => ({ httpMethod: 'POST', headers: {}, body: JSON.stringify(bodies[name]) });

for (const name of Object.keys(bodies)) {
  const stage = name === 'explain-answer' ? 'explain' : 'readaloud';
  const limit = stage === 'explain' ? 40 : 60;

  test(`${name}: missing migration uses the old ledger before calling a provider`, async () => {
    for (const code of missingCodes) {
      const db = database({ code });
      const response = await handler(name, db)(event(name));
      assert.equal(response.statusCode, 200, `${code}: ${response.body}`);
      assert.equal(JSON.parse(response.body).used, 3);
      assert.equal(db.state.providerCalls, 1);
      assert.deepEqual(db.state.events.slice(0, 4), ['count', 'rpc', 'insert', 'provider']);
      const row = db.state.inserts[0];
      assert.deepEqual(Object.keys(row).sort(), ['correct', 'error_tag', 'item_id', 'lektion_id', 'level', 'stage', 'user_id']);
      assert.equal(row.user_id, userId);
      assert.equal(row.stage, stage);
      assert.equal(row.level, 'a1.1');
      assert.equal(row.lektion_id, 'a1.1-l01');
      assert.equal(row.correct, false);
      assert.equal(row.error_tag, stage === 'explain' ? 'Erklärung' : null);
      assert.equal(db.state.counts.length, 1);
      const filters = db.state.counts[0].filters;
      assert.deepEqual(filters.slice(0, 2), [['user_id', userId], ['stage', stage]]);
      assert.equal(filters[2][0], 'created_at');
      assert.match(filters[2][1], /T00:00:00\.000Z$/);
    }
  });

  test(`${name}: missing migration and failed legacy write skip the provider`, async () => {
    for (const options of [{ insertError: { message: 'write failed' } }, { insertThrows: true }, { noId: true }]) {
      const db = database(options);
      const response = await handler(name, db)(event(name));
      assert.equal(response.statusCode, 503);
      assert.equal(JSON.parse(response.body).stage, 'usage');
      assert.equal(db.state.providerCalls, 0);
      assert.equal(db.state.inserts.length, 1);
    }
  });

  test(`${name}: other reservation errors fail closed without the old ledger write`, async () => {
    for (const code of ['42501', 'PGRST301', undefined]) {
      const db = database({ code: code || 'UNKNOWN' });
      const response = await handler(name, db)(event(name));
      assert.equal(response.statusCode, 503);
      assert.equal(db.state.providerCalls, 0);
      assert.equal(db.state.inserts.length, 0);
    }
  });

  test(`${name}: legacy count failure blocks both reservation and provider`, async () => {
    const db = database({ countError: { message: 'count failed' } });
    const response = await handler(name, db)(event(name));
    assert.equal(response.statusCode, 500);
    assert.equal(db.state.providerCalls, 0);
    assert.deepEqual(db.state.events, ['count']);
  });

  test(`${name}: the existing daily limit blocks spending before migration`, async () => {
    const db = database({ used: limit });
    const response = await handler(name, db)(event(name));
    assert.equal(response.statusCode, 429);
    assert.equal(JSON.parse(response.body).limit, limit);
    assert.equal(db.state.providerCalls, 0);
    assert.deepEqual(db.state.events, ['count']);
  });
}

test('score-readaloud: fallback updates the exact legacy placeholder after transcription', async () => {
  const db = database();
  const response = await handler('score-readaloud', db)(event('score-readaloud'));
  assert.equal(response.statusCode, 200);
  assert.equal(db.state.updates.length, 1);
  assert.deepEqual(db.state.updates[0].filters, [['id', 'legacy-attempt-1'], ['user_id', userId], ['stage', 'readaloud']]);
  assert.equal(db.state.updates[0].row.correct, true);
  assert.equal(db.state.updates[0].row.error_tag, null);
  assert.deepEqual(db.state.events, ['count', 'rpc', 'insert', 'provider', 'update']);
});
