import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { closeOutSession, reserveTurn, settleTurn } from '../netlify/functions/_shared/speakingCloseout.mjs';
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
    unauthorizedResponse: () => ({ statusCode: 401 }), AIError, buildTeacherSystemPrompt: () => 'system',
    courseTaskColumns: () => ({}), parseCourseTask: () => null,
    teacherReply: async () => { calls.push('teacher'); return 'Hallo!'; },
    synthesizeSpeech: async () => { calls.push('tts'); return 'audio'; }, ...overrides,
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
    randomUUID, supabaseKey: 'configured', supabase: db,
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
  assert.ok(turnSource.indexOf('await settleTurn(supabase, sessionToken, user_id, turnId, true)') < turnSource.indexOf("supabase.from('speaking_messages').insert(rows)"), 'delivery is fenced before readable messages are persisted');
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
