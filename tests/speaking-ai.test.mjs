// Guided-turn teacher contract + signed task-state chain — plan Task 3
// (speaking-guided-city-map).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { guidedTurnFeedback } from '../netlify/functions/_shared/speakingAI.mjs';
import {
  signTaskState, verifyTaskState, signMissionResult, verifyMissionResult,
} from '../netlify/functions/_shared/speakingState.mjs';
import { downsampleTo16k, encodeWav } from '../src/features/speaking/pcmRecorder.js';

const mission = { pass_criteria: ['gives_name', 'gives_origin', 'spells_name'] };

test('guidedTurnFeedback parses the judge JSON and only ticks genuinely open criteria', async () => {
  const fb = await guidedTurnFeedback({
    system: 'ROLLE', userText: 'Ich heiße Ana.', mission,
    completedCriteria: ['gives_name'],
    callTeacher: async () => JSON.stringify({
      reply: 'Schön! Und woher kommen Sie?',
      completedNow: ['gives_origin', 'gives_name', 'not_a_real_criterion'],
      bestVersion: null,
      tip: 'Sehr gut.',
    }),
  });
  assert.equal(fb.reply, 'Schön! Und woher kommen Sie?');
  assert.deepEqual(fb.completedNow, ['gives_origin'], 'already-complete and invented criteria are dropped');
  assert.equal(fb.tip, 'Sehr gut.');
});

test('unparseable judge output degrades to null instead of throwing the turn away', async () => {
  const fb = await guidedTurnFeedback({
    system: 'ROLLE', userText: 'Hallo.', mission, completedCriteria: [],
    callTeacher: async () => 'Tut mir leid, hier ist kein JSON.',
  });
  assert.equal(fb, null);
});

test('provider model IDs are environment-configurable', () => {
  const src = readFileSync(new URL('../netlify/functions/_shared/speakingAI.mjs', import.meta.url), 'utf8');
  for (const envVar of ['SPEAKING_TEACHER_MODEL', 'SPEAKING_STT_MODEL', 'SPEAKING_TTS_MODEL']) {
    assert.match(src, new RegExp(`process\\.env\\.${envVar}`), `${envVar} not configurable`);
  }
});

test('the task-state chain is tamper-proof and session-bound', () => {
  const secret = 'test-secret';
  const token = signTaskState({ sessionToken: 's1', missionOrder: 3, completedCriteria: ['a'], turn: 2 }, secret);
  const ok = verifyTaskState(token, { sessionToken: 's1', secret });
  assert.deepEqual(ok, { completedCriteria: ['a'], turn: 2, missionOrder: 3 });

  assert.equal(verifyTaskState(token, { sessionToken: 'other', secret }), null, 'token is bound to its session');
  assert.equal(verifyTaskState(token, { sessionToken: 's1', secret: 'wrong' }), null, 'wrong secret fails');
  const [body] = token.split('.');
  const forgedBody = Buffer.from(JSON.stringify({ kind: 'task-state', sessionToken: 's1', missionOrder: 3, completedCriteria: ['a', 'b', 'c'], turn: 3, exp: Date.now() + 60000 }), 'utf8').toString('base64url');
  assert.equal(verifyTaskState(`${forgedBody}.${token.split('.')[1]}`, { sessionToken: 's1', secret }), null, 'edited body fails the MAC');
  assert.notEqual(body, forgedBody);
});

test('mission-result tokens are user-bound and pass-only in effect', () => {
  const secret = 'test-secret';
  const token = signMissionResult({ userId: 'u1', missionOrder: 12, passed: true, sessionToken: 's1' }, secret);
  assert.deepEqual(verifyMissionResult(token, { userId: 'u1', secret }), { missionOrder: 12, passed: true, sessionToken: 's1' });
  assert.equal(verifyMissionResult(token, { userId: 'u2', secret }), null, 'another user cannot redeem the token');
});

test('the structured turn path persists no transcript and fails closed without the secret', () => {
  const src = readFileSync(new URL('../netlify/functions/speaking-turn.mjs', import.meta.url), 'utf8');
  const structuredBlock = src.slice(src.indexOf('// 4a.'), src.indexOf('// 4b.'));
  assert.ok(structuredBlock.length > 100, 'structured block missing');
  assert.doesNotMatch(structuredBlock, /speaking_messages/, 'structured path writes a transcript');
  assert.match(src, /SPEAKING_STATE_SECRET is not set/, 'missing secret must fail closed');
  // The verify endpoint exists and cross-checks the session row.
  const verify = readFileSync(new URL('../netlify/functions/speaking-mission-result.mjs', import.meta.url), 'utf8');
  assert.match(verify, /verifyMissionResult/);
  assert.match(verify, /session\.passed !== true/);
});

test('the PCM pipeline produces a 16 kHz mono WAV with a correct header', () => {
  const input = new Float32Array(48000); // one second at 48 kHz
  for (let i = 0; i < input.length; i += 1) input[i] = Math.sin(i / 20) * 0.5;
  const samples = downsampleTo16k(input, 48000);
  assert.equal(samples.length, 16000, 'one second stays one second');
  const wav = encodeWav(samples);
  const view = new DataView(wav);
  assert.equal(String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)), 'RIFF');
  assert.equal(view.getUint32(24, true), 16000, 'sample rate header');
  assert.equal(view.getUint16(22, true), 1, 'mono');
  assert.equal(view.getUint16(34, true), 16, '16-bit');
  assert.equal(wav.byteLength, 44 + samples.length * 2);
});
