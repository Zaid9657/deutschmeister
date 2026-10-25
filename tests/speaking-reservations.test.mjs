import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { closeOutSession, reserveTurn, settleTurn } from '../netlify/functions/_shared/speakingCloseout.mjs';
import { SPEAKING_LEVELS, HISTORY_MESSAGES } from '../netlify/functions/_shared/speakingAI.mjs';
import { PRO_SPEAKING_SESSIONS_PER_MONTH } from '../src/data/marketing.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const sql = read('migrations/2026-10-22-speaking-reservations.sql');
const stripImports = (source) => source.replace(/^import[\s\S]*?from ['"][^'"]+['"];\s*/gm, '');
class AIError extends Error {}
const userId = '11111111-1111-4111-8111-111111111111';
const token = 'sp_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const headers = { authorization: 'Bearer verified' };

function loadSession(overrides = {}) {
  const calls = [];
  const mocks = {
    randomUUID, supabase: { from() { throw new Error('Unexpected database write'); } }, supabaseKey: 'configured',
    checkUsage: async () => ({ allowed: false, tier: 'free_expired' }),
    reserveSession: async () => ({ ok: false, code: 'insufficient_funds' }),
    CLOSEOUT_COLUMNS: '', closeOutSession: async () => { calls.push('refund'); return { closed: true }; },
    closeOutStaleSessions: async () => ({}), getAuthenticatedUserId: async () => userId,
    unauthorizedResponse: () => ({ statusCode: 401 }), AIError, SPEAKING_LEVELS, buildTeacherSystemPrompt: () => 'system',
    courseTaskColumns: () => ({}), parseCourseTask: () => null,
    teacherReply: async () => { calls.push('teacher'); return 'Hallo!'; },
    synthesizeSpeech: async () => { calls.push('tts'); return 'audio'; },
    synthesizeFixedLine: async () => { calls.push('tts-fixed'); return 'audio'; }, ...overrides,
  };
  const source = stripImports(read('netlify/functions/speaking-session.mjs')).replace('export const handler', 'const handler');
  return { handler: new Function(...Object.keys(mocks), `${source}; return handler;`)(...Object.values(mocks)), calls };
}
const startEvent = (minutes = 15) => ({ httpMethod: 'POST', headers, body: JSON.stringify({ action: 'start', level: 'A1.1', minutes }) });

test('an empty wallet or failed session reservation makes zero opening provider calls', async () => {
  const empty = loadSession();
  assert.equal((await empty.handler(startEvent())).statusCode, 402);
  assert.deepEqual(empty.calls, []);
  const failed = loadSession({ reserveSession: async () => { throw new Error('RPC missing before migration'); } });
  assert.equal((await failed.handler(startEvent())).statusCode, 500);
  assert.deepEqual(failed.calls, []);
});

test('Pro session starts use the monthly allowance and reserve before teacher and TTS', async () => {
  for (const used of [2, PRO_SPEAKING_SESSIONS_PER_MONTH - 1, PRO_SPEAKING_SESSIONS_PER_MONTH]) {
    const sequence = [];
    let quoted;
    const db = { from: () => ({ insert: async () => ({ error: null }) }) };
    const { handler } = loadSession({
      supabase: db,
      checkUsage: async () => ({ allowed: used < PRO_SPEAKING_SESSIONS_PER_MONTH, used, tier: 'pro' }),
      reserveSession: async (_client, session, tier) => { assert.equal(tier, 'pro'); quoted = session.cost_cents; sequence.push('reserved'); return { ok: true }; },
      teacherReply: async () => { sequence.push('teacher'); return 'Hallo!'; },
      synthesizeSpeech: async () => { sequence.push('tts'); return 'audio'; },
    });
    assert.equal((await handler(startEvent(5))).statusCode, 200);
    assert.equal(quoted === 0, used < PRO_SPEAKING_SESSIONS_PER_MONTH);
    assert.deepEqual(sequence, ['reserved', 'teacher', 'tts']);
  }
  const page = read('src/pages/SpeakingPage.jsx');
  assert.ok(page.includes('PRO_SPEAKING_SESSIONS_PER_MONTH'));
  assert.ok(!page.includes('free today'));
});

test('a failed opening releases its persisted reservation through transactional close-out', async () => {
  const attempt = loadSession({
    reserveSession: async () => ({ ok: true }),
    teacherReply: async () => { throw new AIError('provider unavailable'); },
  });
  assert.equal((await attempt.handler(startEvent())).statusCode, 502);
  assert.deepEqual(attempt.calls, ['refund']);
});

test('ending during transcription waits for the accepted turn and cannot refund its delivered reply', async () => {
  const sequence = [];
  const state = { status: 'active', pending: false, delivered: false, closing: false, wallet: 0 };
  const db = {
    from: (table) => table === 'speaking_sessions' ? { select: () => ({ eq() { return this; }, maybeSingle: async () => ({ data: { status: state.status, level: 'A1.1', mode: 'free', planned_minutes: 5, started_at: new Date().toISOString() } }) }) } : { insert: async () => ({ error: null }) },
    rpc: async (name, args) => {
      if (name === 'reserve_speaking_turn') {
        if (state.status !== 'active' || state.closing) return { data: { ok: false, code: 'session_closed' } };
        state.pending = true;
        sequence.push('accepted');
        return { data: { ok: true } };
      }
      if (name === 'settle_speaking_turn') {
        state.pending = false;
        state.delivered = args.p_delivered;
        sequence.push('delivered');
        if (state.closing) state.status = 'completed';
        return { data: true };
      }
      assert.equal(name, 'settle_speaking_session');
      state.closing = true;
      if (state.pending) return { data: { closed: false, pending: true, released: false, refundCents: 0 } };
      state.status = state.delivered ? 'completed' : 'cancelled';
      if (!state.delivered) state.wallet += 200;
      return { data: { closed: true, released: !state.delivered, refundCents: state.delivered ? 0 : 200 } };
    },
  };
  const mocks = {
    randomUUID, supabaseKey: 'configured', supabase: db, HISTORY_MESSAGES,
    getAuthenticatedUserId: async () => userId, unauthorizedResponse: () => ({}), AIError,
    buildTeacherSystemPrompt: () => 'system', taskFromSession: () => null, SESSION_GRACE_MINUTES: 2,
    reserveTurn, settleTurn,
    transcribeAudio: async () => {
      sequence.push('stt');
      const end = await closeOutSession(db, { session_token: token, user_id: userId });
      assert.equal(end.released, false, 'ending during the accepted turn must defer the refund');
      assert.equal(end.pending, true);
      sequence.push('end-deferred');
      return 'Guten Tag';
    },
    teacherReply: async () => { sequence.push('teacher'); return 'Hallo!'; },
    synthesizeSpeech: async () => { sequence.push('tts'); return 'audio'; },
  };
  const turnSource = read('netlify/functions/speaking-turn.mjs');
  assert.ok(turnSource.indexOf('await settleTurn(supabase, sessionToken, user_id, turnId, true, reservation.legacy)') < turnSource.indexOf("supabase.from('speaking_messages').insert(rows)"), 'delivery is fenced before readable messages are persisted');
  const source = stripImports(read('netlify/functions/speaking-turn.mjs')).replace('export const handler', 'const handler');
  const handler = new Function(...Object.keys(mocks), `${source}; return handler;`)(...Object.values(mocks));
  const event = { httpMethod: 'POST', headers, body: JSON.stringify({ sessionToken: token, audioBase64: 'audio' }) };
  const response = await handler(event);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(sequence, ['accepted', 'stt', 'end-deferred', 'teacher', 'tts', 'delivered']);
  assert.equal(state.status, 'completed');
  assert.equal(state.wallet, 0, 'delivered turn retained its charge');
  sequence.length = 0;
  assert.equal((await handler(event)).statusCode, 409);
  assert.deepEqual(sequence, [], 'a closed session makes no further provider call');
});

// ---------------------------------------------------------------------------
// The placement check is a test, not a tutor (cross-check AI-01)
// ---------------------------------------------------------------------------

const HOUR = 60 * 60 * 1000;
const ago = (ms) => new Date(Date.now() - ms).toISOString();
const placementEvent = (extra = {}) => ({ httpMethod: 'POST', headers, body: JSON.stringify({ action: 'start', mode: 'placement', ...extra }) });

/** The caller's recent non-cancelled placement starts, as speaking-session counts them. */
function placementDb(startedAts, { error = null } = {}) {
  const queries = [];
  return {
    queries,
    from(table) {
      if (table === 'speaking_messages') return { insert: async () => ({ error: null }) };
      assert.equal(table, 'speaking_sessions');
      const filters = [];
      const query = {
        select(columns) { filters.push(['select', columns]); return query; },
        eq(key, value) { filters.push(['eq', key, value]); return query; },
        neq(key, value) { filters.push(['neq', key, value]); return query; },
        gte(key, value) { filters.push(['gte', key, value]); return query; },
        then(resolve, reject) {
          queries.push(filters);
          return Promise.resolve(error ? { data: null, error } : { data: startedAts.map((started_at) => ({ started_at })), error: null })
            .then(resolve, reject);
        },
      };
      return query;
    },
  };
}

test('a placement start always runs 5 minutes, whatever duration the body asks for', async () => {
  for (const minutes of [15, 10, 5, undefined]) {
    let planned;
    const { handler, calls } = loadSession({
      supabase: placementDb([]),
      checkUsage: async () => ({ allowed: false, tier: 'free_expired', reason: 'subscription_required' }),
      reserveSession: async (_client, session) => { planned = session.planned_minutes; assert.equal(session.cost_cents, 0); return { ok: true }; },
    });
    const response = await handler(placementEvent(minutes === undefined ? {} : { minutes }));
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(planned, 5, `minutes: ${minutes}`);
    assert.equal(JSON.parse(response.body).planned_minutes, 5);
    assert.deepEqual(calls, ['teacher', 'tts']);
  }
});

test('the placement start past the daily or 30-day cap is refused with 429 before any reservation or provider call', async () => {
  const refused = [
    { starts: [ago(2 * HOUR)], window: 'day' }, // one today
    { starts: [ago(3 * 24 * HOUR), ago(10 * 24 * HOUR), ago(29 * 24 * HOUR)], window: 'month' }, // three in 30 days
  ];
  for (const { starts, window } of refused) {
    let reserved = false;
    const db = placementDb(starts);
    const { handler, calls } = loadSession({ supabase: db, reserveSession: async () => { reserved = true; return { ok: true }; } });
    const response = await handler(placementEvent());
    assert.equal(response.statusCode, 429, response.body);
    const body = JSON.parse(response.body);
    assert.equal(body.error, 'placement_limit');
    assert.equal(body.window, window);
    assert.ok(Date.parse(body.retry_after) > Date.now(), 'the learner is told when the test opens again');
    assert.equal(reserved, false);
    assert.deepEqual(calls, []);
    const filters = db.queries[0];
    assert.deepEqual(filters.filter(([op]) => op !== 'select' && op !== 'gte'), [
      ['eq', 'user_id', userId], ['eq', 'mode', 'placement'], ['neq', 'status', 'cancelled'],
    ], 'counted per user, placement only, cancelled starts excluded');
    const since = Date.parse(filters.find(([op]) => op === 'gte')[2]);
    assert.ok(Math.abs(Date.now() - 30 * 24 * HOUR - since) < 60000, 'the count looks back 30 days');
  }
  // Below both caps: two starts in the month, none in the last 24 hours.
  const { handler } = loadSession({
    supabase: placementDb([ago(26 * HOUR), ago(20 * 24 * HOUR)]),
    reserveSession: async () => ({ ok: true }),
  });
  assert.equal((await handler(placementEvent())).statusCode, 200);
  // An unreadable count fails closed.
  const broken = loadSession({ supabase: placementDb([], { error: { message: 'down' } }), reserveSession: async () => assert.fail('no reservation') });
  assert.equal((await broken.handler(placementEvent())).statusCode, 503);
  assert.deepEqual(broken.calls, []);
});

test('the locked recount (SQL applied) refusing a placement start answers 429 placement_limit', async () => {
  const { handler, calls } = loadSession({ supabase: placementDb([]), reserveSession: async () => ({ ok: false, code: 'placement_limit' }) });
  const response = await handler(placementEvent());
  assert.equal(response.statusCode, 429);
  assert.equal(JSON.parse(response.body).error, 'placement_limit');
  assert.deepEqual(calls, []);
});

test('the placement cap SQL repeats the handler numbers under the reservation lock and stays service-role only', () => {
  const fn = read('netlify/functions/speaking-session.mjs');
  const jsConst = (name) => Number(fn.match(new RegExp(`const ${name} = (\\d+);`))[1]);
  const capSql = read('migrations/2026-10-25-placement-speaking-cap.sql');
  const sqlConst = (name) => Number(capSql.match(new RegExp(`${name} CONSTANT integer := (\\d+);`))[1]);
  assert.equal(sqlConst('v_placement_minutes'), jsConst('PLACEMENT_MINUTES'));
  assert.equal(sqlConst('v_placement_per_day'), jsConst('PLACEMENT_SESSIONS_PER_DAY'));
  assert.equal(sqlConst('v_placement_per_30_days'), jsConst('PLACEMENT_SESSIONS_PER_30_DAYS'));
  assert.ok(capSql.indexOf('pg_advisory_xact_lock') < capSql.indexOf("'code', 'placement_limit'"), 'the cap is counted under the lock');
  assert.match(capSql, /interval '24 hours'\) >= v_placement_per_day/);
  assert.match(capSql, /interval '30 days'\) >= v_placement_per_30_days/);
  assert.match(capSql, /v_mode = 'placement' AND v_minutes <> v_placement_minutes/, 'a longer placement session is invalid');
  assert.match(capSql, /status <> 'cancelled'/);
  assert.match(capSql, /CREATE OR REPLACE FUNCTION public\.reserve_speaking_session\(\s*p_session jsonb, p_tier text, p_pro_limit integer, p_trial_limit integer\s*\)/,
    'same signature as the applied function');
  assert.match(capSql, /REVOKE ALL ON FUNCTION public\.reserve_speaking_session\(jsonb,text,integer,integer\) FROM PUBLIC, anon, authenticated;/);
  assert.match(capSql, /GRANT EXECUTE ON FUNCTION public\.reserve_speaking_session\(jsonb,text,integer,integer\) TO service_role;/);
});

/** speaking-turn with a session row, the stored transcript and provider mocks. */
function loadTurn(db, overrides = {}) {
  const calls = [];
  const mocks = {
    randomUUID, supabaseKey: 'configured', supabase: db, HISTORY_MESSAGES,
    getAuthenticatedUserId: async () => userId, unauthorizedResponse: () => ({ statusCode: 401 }), AIError,
    buildTeacherSystemPrompt: () => 'system', taskFromSession: () => null, SESSION_GRACE_MINUTES: 2,
    reserveTurn: async () => { calls.push('reserve'); return { ok: true }; },
    settleTurn: async () => { calls.push('settle'); return true; },
    transcribeAudio: async () => { calls.push('stt'); return 'Guten Tag'; },
    teacherReply: async () => { calls.push('teacher'); return 'Hallo!'; },
    synthesizeSpeech: async () => { calls.push('tts'); return 'audio'; },
    ...overrides,
  };
  const source = stripImports(read('netlify/functions/speaking-turn.mjs')).replace('export const handler', 'const handler');
  return { handler: new Function(...Object.keys(mocks), `${source}; return handler;`)(...Object.values(mocks)), calls };
}

test('turn audio above the per-clip ceiling is refused with 413 before any database read or provider call', async () => {
  const noDatabase = { from() { throw new Error('an oversized turn must not reach the database'); } };
  const oversized = loadTurn(noDatabase);
  const big = 'A'.repeat(2_000_004); // 1,500,003 bytes decoded
  const response = await oversized.handler({ httpMethod: 'POST', headers, body: JSON.stringify({ sessionToken: token, audioBase64: big }) });
  assert.equal(response.statusCode, 413);
  assert.equal(JSON.parse(response.body).code, 'audio_too_large');
  assert.deepEqual(oversized.calls, []);

  // At the ceiling a turn still goes through.
  const session = { level: 'A1.1', mode: 'free', status: 'active', started_at: new Date().toISOString(), planned_minutes: 5 };
  const db = { from: (table) => (table === 'speaking_sessions'
    ? { select: () => ({ eq() { return this; }, maybeSingle: async () => ({ data: session, error: null }) }) }
    : { select: () => { throw new Error('history read unavailable'); }, insert: async () => ({ error: null }) }) };
  const atLimit = loadTurn(db);
  const ok = await atLimit.handler({ httpMethod: 'POST', headers, body: JSON.stringify({ sessionToken: token, audioBase64: 'A'.repeat(2_000_000) }) });
  assert.equal(ok.statusCode, 200, ok.body);
  assert.deepEqual(atLimit.calls, ['reserve', 'stt', 'teacher', 'tts', 'settle'], 'a failed history read degrades to no context, never to a lost turn');
});

test('reservation RPC errors fail closed and refund settlement can be retried after failure', async () => {
  await assert.rejects(reserveTurn({ rpc: async () => ({ error: { message: 'unavailable' } }) }, token, userId, randomUUID()));
  await assert.rejects(settleTurn({ rpc: async () => ({ error: { message: 'unavailable' } }) }, token, userId, randomUUID(), true));
  let attempts = 0;
  const db = { rpc: async () => ++attempts === 1 ? { error: { message: 'wallet temporarily unavailable' } } : { data: { closed: true, status: 'cancelled', released: true, refundCents: 200 } } };
  const row = { session_token: token, user_id: userId };
  assert.equal((await closeOutSession(db, row)).error, 'settlement_failed');
  assert.equal((await closeOutSession(db, row)).refundCents, 200);
  const settlement = sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.settle_speaking_session'), sql.indexOf('CREATE OR REPLACE FUNCTION public.settle_speaking_turn'));
  assert.ok(settlement.includes('FOR UPDATE'), 'close-out serializes with turn acceptance');
  assert.ok(settlement.indexOf("status = 'pending'") < settlement.indexOf('INSERT INTO public.speaking_wallet'), 'accepted turns defer any refund');
  assert.ok(settlement.indexOf('INSERT INTO public.speaking_wallet') < settlement.indexOf('SET status = v_status'), 'a failed refund cannot commit cancellation');
  assert.ok(sql.includes("created_at < now() - interval '15 minutes'"), 'crashed requests eventually release pending reservations');
  assert.ok(sql.includes("created_at >= now() - interval '15 minutes'"), 'late provider replies cannot commit delivery after the reservation lease');
  assert.ok(sql.includes("status = 'delivered'"), 'delivered replies consume allowance even if message persistence fails');
  assert.ok(sql.includes("pg_advisory_xact_lock(hashtextextended('speaking:'"), 'starts reserve quota under one database lock per user');
  assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.reserve_speaking_turn'));
});
