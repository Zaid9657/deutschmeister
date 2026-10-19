import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { performance } from 'node:perf_hooks';
import { readFileSync } from 'node:fs';
import { recordAiUsage, usageFromAnthropic, usageFromOpenAI } from '../netlify/functions/_shared/aiUsage.mjs';
import { writingTaskByKey } from '../netlify/functions/_shared/writingTasks.mjs';

const empty = { input_tokens: null, output_tokens: null, thinking_tokens: null };
test('Anthropic usage preserves reported thinking and total output tokens', () => {
  assert.deepEqual(usageFromAnthropic({ usage: { input_tokens: 123, output_tokens: 80, thinking_tokens: 50 } }),
    { input_tokens: 123, output_tokens: 80, thinking_tokens: 50 });
  assert.deepEqual(usageFromAnthropic({ usage: { input_tokens: 0, output_tokens: 0, output_tokens_details: { thinking_tokens: 0 } } }),
    { input_tokens: 0, output_tokens: 0, thinking_tokens: 0 });
  assert.equal(usageFromAnthropic({ usage: { output_tokens: 80 }, content: [{ type: 'thinking', thinking: 'private' }] }).thinking_tokens, null);
});
test('OpenAI maps Chat Completions and Responses reasoning tokens', () => {
  assert.deepEqual(usageFromOpenAI({ usage: { prompt_tokens: 123, completion_tokens: 80, completion_tokens_details: { reasoning_tokens: 50 } } }),
    { input_tokens: 123, output_tokens: 80, thinking_tokens: 50 });
  assert.deepEqual(usageFromOpenAI({ usage: { input_tokens: 123, output_tokens: 80, output_tokens_details: { reasoning_tokens: 50 } } }),
    { input_tokens: 123, output_tokens: 80, thinking_tokens: 50 });
  assert.deepEqual(usageFromOpenAI({ usage: { input_tokens: 0, output_tokens: 0, reasoning_tokens: 0 } }),
    { input_tokens: 0, output_tokens: 0, thinking_tokens: 0 });
});
test('missing usage fields are null, never invented zeroes', () => {
  for (const mapper of [usageFromAnthropic, usageFromOpenAI]) {
    for (const response of [undefined, null, {}, { usage: {} }]) assert.deepEqual(mapper(response), empty);
    assert.equal(mapper({ usage: { input_tokens: 7 } }).output_tokens, null);
  }
});
test('recordAiUsage inserts exactly one metadata-only row', async () => {
  const rows = [];
  const db = { from(table) { assert.equal(table, 'ai_usage'); return { insert(row) { rows.push(row); return Promise.resolve({ error: null }); } }; } };
  await recordAiUsage(db, { user_id: null, feature: 'xray', provider: 'anthropic', model: 'test', input_tokens: 0,
    prompt: 'private', answer: 'private', email: 'private', anonymousId: 'private' });
  assert.deepEqual(rows, [{ user_id: null, anon: true, feature: 'xray', provider: 'anthropic', model: 'test', input_tokens: 0,
    output_tokens: null, thinking_tokens: null, audio_seconds: null, retries: 0, failed: false }]);
});
test('recordAiUsage never throws for rejection, returned error, or synchronous failure', async (t) => {
  const log = t.mock.method(console, 'error', () => {});
  for (const insert of [() => Promise.reject(new Error('private')), () => ({ error: { message: 'private' } }), () => { throw new Error('private'); }]) {
    assert.equal(await recordAiUsage({ from: () => ({ insert }) }, { feature: 'xray' }), undefined);
  }
  assert.equal(await recordAiUsage(null, { feature: 'xray' }), undefined);
  assert.equal(log.mock.calls.length, 4);
  assert.ok(log.mock.calls.every(({ arguments: args }) => args.length === 1 && !args[0].includes('private') && !args[0].includes('\n')));
});
test('recordAiUsage times out a hung insert and aborts it, even when abort is ignored', async (t) => {
  const log = t.mock.method(console, 'error', () => {});
  let signal;
  let rejectLate;
  const hung = new Promise((_, reject) => { rejectLate = reject; });
  const db = { from: () => ({ insert: () => ({ abortSignal(s) { signal = s; return hung; } }) }) };
  const start = performance.now();
  assert.equal(await recordAiUsage(db, { feature: 'xray' }), undefined);
  assert.ok(performance.now() - start < 2200, 'the insert must have a short upper bound');
  assert.equal(signal.aborted, true);
  assert.equal(log.mock.calls.length, 1);
  rejectLate(new Error('late insert failure'));
  await new Promise((resolve) => setImmediate(resolve)); // no unhandled rejection
});

// Run the actual handlers offline. Only the Supabase constructor is replaced;
// authentication, feature gates, shared speech helpers and provider parsing run normally.
const USER = '11111111-1111-4111-8111-111111111111';
let state;
const db = {
  auth: { getUser: async () => ({ data: { user: state.anonymous ? null : { id: USER } }, error: null }) },
  from: (table) => new Query(table),
};
class Query {
  constructor(table) { this.table = table; this.filters = []; this.singleRow = false; this.op = 'select'; this.max = Infinity; }
  select(_columns, options) { this.head = options?.head; return this; }
  insert(rows) { this.op = 'insert'; this.rows = [].concat(rows); return this; }
  update(patch) { this.op = 'update'; this.patch = patch; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(k, v) { this.filters.push((r) => r[k] === v); return this; }
  neq(k, v) { this.filters.push((r) => r[k] !== v); return this; }
  is(k, v) { this.filters.push((r) => r[k] == v); return this; }
  in(k, vs) { this.filters.push((r) => vs.includes(r[k])); return this; }
  gte(k, v) { this.filters.push((r) => r[k] >= v); return this; }
  lt(k, v) { this.filters.push((r) => r[k] < v); return this; }
  like(k, v) { const re = new RegExp('^' + v.replace(/%/g, '.*').replace(/_/g, '.') + '$'); this.filters.push((r) => re.test(r[k])); return this; }
  not(k, _op, v) { const values = v.slice(1, -1).split(','); this.filters.push((r) => !values.every((x) => (r[k] || []).includes(x))); return this; }
  order() { return this; }
  limit(max) { this.max = max; return this; }
  range(a, b) { this.offset = a; this.max = b - a + 1; return this; }
  maybeSingle() { this.singleRow = true; return this; }
  single() { this.singleRow = true; return this; }
  then(resolve, reject) { return Promise.resolve().then(() => this.run()).then(resolve, reject); }
  run() {
    if (this.table === 'ai_usage') {
      assert.equal(this.op, 'insert');
      state.events.push('usage');
      state.ledger.push(...this.rows);
      if (state.insertMode === 'reject') throw new Error('ledger unavailable');
      if (state.insertMode === 'error') return { error: { message: 'ledger unavailable' } };
      return { error: null };
    }
    let rows = (state.tables[this.table] || []).filter((r) => this.filters.every((f) => f(r)));
    if (this.op === 'insert') {
      rows = this.rows.map((r) => ({ id: 'saved-id', ...r }));
      (state.tables[this.table] ||= []).push(...rows);
    } else if (this.op === 'update') rows.forEach((r) => Object.assign(r, this.patch));
    else if (this.op === 'delete') state.tables[this.table] = (state.tables[this.table] || []).filter((r) => !rows.includes(r));
    const count = rows.length;
    rows = rows.slice(this.offset || 0, (this.offset || 0) + this.max);
    return { data: this.head ? null : this.singleRow ? rows[0] ?? null : rows, count, error: null };
  }
}
const modules = {};
const savedEnv = {};
let hooks;
let originalFetch;
before(async () => {
  globalThis[Symbol.for('ai-usage-test-db')] = db;
  hooks = registerHooks({ resolve(specifier, context, nextResolve) {
    let code;
    if (specifier === '@supabase/supabase-js') code = "export const createClient = () => globalThis[Symbol.for('ai-usage-test-db')];";
    if (specifier === 'node:crypto' && context.parentURL?.endsWith('/speaking-session.mjs')) code = "export const randomUUID = () => '22222222-2222-4222-8222-222222222222';";
    if (code) return { url: 'data:text/javascript,' + encodeURIComponent(code), shortCircuit: true };
    return nextResolve(specifier, context);
  } });
  for (const key of ['SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY']) {
    savedEnv[key] = process.env[key];
    process.env[key] = 'offline-test-key';
  }
  originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.ok(url.startsWith('https://api.anthropic.com/') || url.startsWith('https://api.openai.com/'), 'unexpected network request');
    state.events.push('provider');
    state.calls.push({ url, options });
    const outcome = state.providerReplies.shift();
    assert.ok(outcome, 'a provider response must be explicitly stubbed');
    if (outcome instanceof Error) throw outcome;
    if (outcome.raw) return outcome.raw;
    if (outcome.httpError) return new Response('upstream failure', { status: 503 });
    if (outcome.audio) return new Response(Buffer.from('test-audio'));
    return Response.json(outcome);
  };
  for (const name of ['analyze-sentence', 'explain-answer', 'evaluate-speaking', 'evaluate-writing', 'score-readaloud', 'speaking-session', 'speaking-turn', 'support-agent']) {
    modules[name] = await import(`../netlify/functions/${name}.mjs`);
  }
});
after(() => {
  hooks?.deregister();
  globalThis.fetch = originalFetch;
  delete globalThis[Symbol.for('ai-usage-test-db')];
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
function reset(insertMode = 'ok') {
  state = { insertMode, ledger: [], calls: [], events: [], providerReplies: [], tables: {
    profiles: [{ id: USER, subscription_tier: 'pro', is_subscribed: true }],
    speaking_messages: [{ session_token: 'session', user_id: USER, role: 'user', content: 'Hallo!' }],
    speaking_sessions: [{ session_token: 'session', user_id: USER, mode: 'placement', level: 'A1.1', status: 'active', planned_minutes: 5, started_at: new Date().toISOString() }],
  } };
}
const event = (body) => ({ httpMethod: 'POST', headers: { authorization: 'Bearer offline-token', origin: 'https://deutsch-meister.de' }, body: JSON.stringify(body) });
const anthropic = (text = 'Hallo!') => ({ content: [{ type: 'text', text }], usage: { input_tokens: 17, output_tokens: 9, thinking_tokens: 3 } });
const stt = () => ({ text: 'Hallo!', usage: { input_tokens: 11, output_tokens: 3 }, duration: 2.5 });
const writingTask = writingTaskByKey('telc_b1', 'beschwerde-lieferung');
const writingEvaluation = { scores: { task: 4, structure: 4, accuracy: 4, vocabulary: 4 }, total_score: 16,
  leitpunkt_check: writingTask.leitpunkte.map(() => true), feedback: 'Gut.', corrections: [], strengths: [], improvements: [] };
const cases = [
  { name: 'analyze-sentence', feature: 'xray', body: { sentence: 'Hallo!' }, replies: () => [anthropic('{"fullTranslation":"Hello!"}')] },
  { name: 'explain-answer', feature: 'explain-answer', body: { itemId: 'test', topic: 'verb-sein', questionDe: 'Ich ... Anna.', expected: 'bin' }, replies: () => [anthropic()] },
  { name: 'evaluate-speaking', feature: 'speaking', body: { session_token: 'session', mode: 'placement', messages: [{ role: 'user', content: 'Hallo!' }] }, replies: () => [anthropic('{"total_score":50,"recommendation":"GLEICH"}')] },
  { name: 'evaluate-writing', feature: 'writing', body: { exam_key: 'telc_b1', task_key: 'beschwerde-lieferung', text: 'Guten Tag, ich habe gestern etwas bei Ihnen bestellt, aber es kam nichts an. Bitte helfen Sie mir.' }, replies: () => [anthropic(JSON.stringify(writingEvaluation))] },
  { name: 'score-readaloud', feature: 'readaloud', body: { audioBase64: 'YQ==', mimeType: 'audio/webm', expected: 'Hallo!' }, replies: () => [stt()] },
  { name: 'speaking-session', feature: 'speaking', body: { action: 'start', mode: 'placement', level: 'A1.1', minutes: 5 }, replies: () => [anthropic(), { audio: true }] },
  { name: 'speaking-turn', feature: 'speaking', body: { sessionToken: 'session', audioBase64: 'YQ==', mimeType: 'audio/webm', history: [] }, replies: () => [stt(), anthropic(), { audio: true }] },
];
for (const scenario of cases) {
  test(`${scenario.name}: a failing usage insert leaves the complete response unchanged`, async (t) => {
    t.mock.method(console, 'error', () => {});
    let baseline;
    for (const mode of ['ok', 'reject', 'error']) {
      reset(mode);
      state.providerReplies = scenario.replies();
      const result = await modules[scenario.name].handler(event(scenario.body));
      assert.equal(result.statusCode, 200, result.body);
      if (baseline) assert.deepEqual(result, baseline); else baseline = result;
      assert.equal(state.providerReplies.length, 0);
      assert.equal(state.ledger.length, state.calls.length, 'one row per provider call');
      assert.deepEqual(state.events, state.calls.flatMap(() => ['provider', 'usage']), 'ledger writes are awaited after each call');
      for (const row of state.ledger) {
        assert.equal(row.user_id, USER);
        assert.equal(row.feature, scenario.feature);
        assert.equal(row.failed, false);
        assert.equal(row.anon, false);
      }
      const transcription = state.ledger.find((r) => r.model === 'gpt-4o-mini-transcribe');
      if (transcription) { assert.equal(transcription.audio_seconds, 2.5); assert.equal(transcription.input_tokens, 11); }
      const tts = state.ledger.find((r) => r.model === 'gpt-4o-mini-tts');
      if (tts) assert.deepEqual([tts.input_tokens, tts.output_tokens, tts.thinking_tokens, tts.audio_seconds], [null, null, null, null]);
    }
  });
}
test('support-agent: a failing usage insert leaves the complete response unchanged', async (t) => {
  t.mock.method(console, 'error', () => {});
  let baseline;
  for (const mode of ['ok', 'reject', 'error']) {
    reset(mode);
    state.tables.support_tickets = [{ id: 't1', reference: 'DM-TEST00001', status: 'new', priority: 'normal', category: 'content', subject: 'Frage zum Dativ', user_id: USER,
      user_email: 'offline@example.test', tags: [], context: {}, assignee_id: null, created_at: '2026-10-19T00:00:00Z', first_response_at: null }];
    state.tables.support_ticket_messages = [{ id: 'm1', ticket_id: 't1', author_type: 'user', author_id: USER, visibility: 'public', body: 'Wo finde ich die Grammatik zum Dativ?', created_at: '2026-10-19T01:00:00Z' }];
    state.tables.grammar_topics = [{ slug: 'dative-case', sub_level: 'A2.1', title_de: 'Dativ', title_en: 'Dative case', topic_order: 1 }];
    state.providerReplies = [anthropic(JSON.stringify({ language: 'de', escalate: null, content_request: null,
      body: 'Guten Tag,\n\ndie Lektion zum Dativ finden Sie unter https://deutsch-meister.de/grammar/a2.1/dative-case/.' }))];
    const result = await modules['support-agent'].runSupportAgent({ db, fetchImpl: globalThis.fetch,
      env: { SUPPORT_AGENT_MODE: 'draft', ANTHROPIC_API_KEY: 'offline', SUPABASE_SERVICE_ROLE_KEY: 'offline', OWNER_ALERT_EMAIL: 'owner@example.test', RESEND_API_KEY: 'offline' },
      event: { body: '{"next_run":"2026-10-19T03:00:00Z"}', queryStringParameters: { dry: '1', preview: '1' } }, now: new Date('2026-10-19T03:00:00Z'), clock: () => 0 });
    assert.equal(result.statusCode, 200, result.body);
    assert.equal(state.calls.length, 1, result.body);
    assert.equal(state.ledger.length, 1);
    assert.equal(state.ledger[0].user_id, USER);
    assert.equal(state.ledger[0].feature, 'support');
    if (baseline) assert.deepEqual(result, baseline); else baseline = result;
  }
});
test('anonymous X-Ray rows contain no anonymous identifier or sentence', async () => {
  reset(); state.anonymous = true;
  state.providerReplies = [anthropic('{}')];
  const result = await modules['analyze-sentence'].handler(event({ sentence: 'Hallo!', anonymousId: 'anonymous-test-id' }));
  assert.equal(result.statusCode, 200);
  assert.equal(state.ledger[0].user_id, null);
  assert.equal(state.ledger[0].anon, true);
  assert.ok(!JSON.stringify(state.ledger).includes('anonymous-test-id'));
  assert.ok(!JSON.stringify(state.ledger).includes('Hallo!'));
});
for (const scenario of cases) {
  test(`${scenario.name}: HTTP and transport failures still record exactly one failed call`, async (t) => {
    t.mock.method(console, 'error', () => {});
    t.mock.method(console, 'warn', () => {});
    for (const outcome of [{ httpError: true }, new Error('provider offline')]) {
      let baseline;
      for (const mode of ['ok', 'reject']) {
        reset(mode);
        // Evaluators retry HTTP failures; transport failures retain their existing early exit.
        state.providerReplies = [outcome, outcome];
        const result = await modules[scenario.name].handler(event(scenario.body));
        const evaluator = scenario.name.startsWith('evaluate-');
        const speech = ['score-readaloud', 'speaking-session', 'speaking-turn'].includes(scenario.name);
        assert.equal(result.statusCode, outcome.httpError ? (evaluator ? 200 : 502) : (speech ? 502 : 500));
        if (baseline) assert.deepEqual(result, baseline); else baseline = result;
        assert.equal(state.calls.length, evaluator && outcome.httpError ? 2 : 1);
        assert.equal(state.calls.length, state.ledger.length);
        assert.ok(state.ledger.every((r) => r.failed));
        assert.deepEqual(state.ledger.map((r) => r.retries), state.calls.map((_, i) => i));
      }
    }
  });
}
for (const name of ['evaluate-speaking', 'evaluate-writing']) {
  test(`${name}: a malformed result records billed tokens before a separately recorded retry`, async () => {
    reset();
    const scenario = cases.find((c) => c.name === name);
    state.providerReplies = [anthropic('unparseable'), ...scenario.replies()];
    const result = await modules[name].handler(event(scenario.body));
    assert.equal(result.statusCode, 200, result.body);
    assert.equal(JSON.parse(result.body).evaluation_failed, undefined);
    assert.deepEqual(state.ledger.map((r) => r.retries), [0, 1]);
    assert.deepEqual(state.ledger.map((r) => r.input_tokens), [17, 17]);
  });
}
test('support model failures are logged while preserving its error response', async (t) => {
  t.mock.method(console, 'error', () => {});
  for (const outcome of [{ httpError: true }, new Error('provider offline')]) {
    reset('reject'); state.providerReplies = [outcome];
    const result = await modules['support-agent'].callModel(globalThis.fetch, { ANTHROPIC_API_KEY: 'offline' }, { system: '', user: '' }, { db, user_id: USER });
    assert.ok(result.error);
    assert.equal(state.ledger.length, 1);
    assert.equal(state.ledger[0].failed, true);
  }
});
test('migration keeps the ledger private and includes rollback and lookup indexes', () => {
  const sql = readFileSync(new URL('../migrations/2026-10-19-ai-usage.sql', import.meta.url), 'utf8');
  assert.match(sql, /ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY/);
  assert.doesNotMatch(sql, /CREATE POLICY/i);
  assert.match(sql, /REVOKE ALL ON TABLE public.ai_usage FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /ON public.ai_usage \(created_at\)/);
  assert.match(sql, /ON public.ai_usage \(user_id, created_at\)/);
  assert.match(sql, /-- ROLLBACK[\s\S]*DROP TABLE IF EXISTS public.ai_usage/);
});

test('speaking-turn: a TTS failure keeps its text reply and logs the failed third hop', async (t) => {
  t.mock.method(console, 'error', () => {});
  t.mock.method(console, 'warn', () => {});
  let baseline;
  for (const mode of ['ok', 'reject']) {
    reset(mode); state.providerReplies = [stt(), anthropic(), { httpError: true }];
    const result = await modules['speaking-turn'].handler(event(cases.find((c) => c.name === 'speaking-turn').body));
    assert.equal(result.statusCode, 200);
    assert.equal(JSON.parse(result.body).warning, 'tts_unavailable');
    assert.equal(JSON.parse(result.body).replyText, 'Hallo!');
    assert.deepEqual(state.ledger.map((r) => r.failed), [false, false, true]);
    if (baseline) assert.deepEqual(result, baseline); else baseline = result;
  }
});
test('speech helpers log malformed provider JSON as failed without changing their fallback', async () => {
  const { transcribeAudio, teacherReply } = await import('../netlify/functions/_shared/speakingAI.mjs');
  for (const call of [() => transcribeAudio({ audioBase64: 'YQ==', usageContext: { db, user_id: USER } }),
    () => teacherReply({ system: '', usageContext: { db, user_id: USER } })]) {
    reset(); state.providerReplies = [{ raw: new Response('invalid JSON') }];
    assert.equal(await call(), '');
    assert.equal(state.ledger.length, 1);
    assert.equal(state.ledger[0].failed, true);
  }
});
test('a support model refusal retains reported usage and marks the call failed', async () => {
  reset(); state.providerReplies = [{ ...anthropic(), stop_reason: 'refusal' }];
  assert.deepEqual(await modules['support-agent'].callModel(globalThis.fetch, {}, { system: '', user: '' }, { db, user_id: USER }), { error: 'the model declined' });
  assert.equal(state.ledger.length, 1);
  assert.equal(state.ledger[0].input_tokens, 17);
  assert.equal(state.ledger[0].failed, true);
});
