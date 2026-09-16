// Realtime credential endpoint — plan Task 1 (speaking-live-quality).
// Source-level authorization/ordering pins plus pure instruction-builder
// tests: the permanent key never travels, the reservation always precedes
// the credential, and a provider failure refunds before it reports.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildRealtimeInstructions } from '../netlify/functions/realtime-client-secret.mjs';

const src = readFileSync(new URL('../netlify/functions/realtime-client-secret.mjs', import.meta.url), 'utf8');

test('the endpoint authenticates, then flag-checks, then validates the session', () => {
  const authAt = src.indexOf('getAuthenticatedUserId');
  const flagAt = src.indexOf('liveBetaEnabled()');
  const sessionAt = src.indexOf("from('speaking_sessions')");
  const secretAt = src.indexOf('REALTIME_SECRETS_URL, {');
  assert.ok(authAt > 0 && flagAt > authAt, 'flag check must follow authentication');
  assert.ok(sessionAt > flagAt, 'session validation must follow the flag check');
  assert.ok(secretAt > sessionAt, 'the provider call must come last');
});

test('every refusal has its documented status', () => {
  assert.match(src, /unauthorizedResponse\(headers\)/); // 401
  assert.match(src, /statusCode: 403[\s\S]{0,80}Not your session/);
  assert.match(src, /statusCode: 404[\s\S]{0,80}Session not found/);
  assert.match(src, /statusCode: 409[\s\S]{0,120}NOT_LIVE_ACTIVE/);
  assert.match(src, /statusCode: 409[\s\S]{0,120}NOT_RESERVED/);
  assert.match(src, /statusCode: 503[\s\S]{0,120}LIVE_BETA_OFF/);
});

test('a credential is only minted when an active reservation exists', () => {
  const reservationAt = src.indexOf("from('speaking_session_reservations')");
  const secretAt = src.indexOf('REALTIME_SECRETS_URL, {');
  assert.ok(reservationAt > 0 && reservationAt < secretAt, 'reservation check must precede the provider call');
  assert.match(src, /NOT_RESERVED/);
});

test('the permanent API key never reaches the response and the secret is never logged', () => {
  const returns = [...src.matchAll(/body: JSON\.stringify\(\{[^}]*\}\)/g)].map((m) => m[0]);
  for (const body of returns) {
    assert.doesNotMatch(body, /OPENAI_API_KEY|apiKey/, `response body carries the permanent key: ${body}`);
  }
  const logs = [...src.matchAll(/console\.\w+\([^)]*\)/g)].map((m) => m[0]);
  for (const call of logs) {
    assert.doesNotMatch(call, /clientSecret|secretPayload|apiKey/, `log carries a credential: ${call}`);
  }
  assert.match(src, /'Cache-Control': 'no-store'/);
});

test('a provider failure refunds the reservation before reporting', () => {
  const block = src.slice(src.indexOf('} catch (providerErr) {'), src.indexOf('const clientSecret'));
  const refundAt = block.indexOf('refund_speaking_session');
  const returnAt = block.indexOf('return {');
  assert.ok(refundAt > 0 && refundAt < returnAt, 'refund must precede the error response');
  assert.match(block, /realtime-secret:\$\{sessionToken\}/, 'refund needs its documented idempotency key');
  assert.match(block, /PROVIDER_UNAVAILABLE/);
});

test('model and voice are environment configuration', () => {
  assert.match(src, /process\.env\.OPENAI_REALTIME_MODEL \|\| 'gpt-realtime-2\.1-mini'/);
  assert.match(src, /process\.env\.OPENAI_REALTIME_VOICE \|\| 'marin'/);
});

test('instructions stay bounded, German and A1-safe', () => {
  const instructions = buildRealtimeInstructions({
    scenario_de: 'x'.repeat(1000),
    ai_role: 'y'.repeat(1000),
  });
  assert.ok(instructions.includes('Sprich NUR Deutsch'));
  assert.ok(instructions.includes('A1'));
  assert.ok(/Keine medizinische, rechtliche oder Einwanderungsberatung/.test(instructions));
  assert.ok(instructions.length < 1600, 'mission text must be truncated');
  const withoutMission = buildRealtimeInstructions(null);
  assert.ok(withoutMission.includes('Sprich NUR Deutsch'));
  assert.ok(!withoutMission.includes('SZENARIO'));
});

test('both rollout flags default off and fail closed', async () => {
  const flags = await import('../netlify/functions/_shared/speakingFlags.mjs');
  const prevLive = process.env.SPEAKING_LIVE_BETA_ENABLED;
  const prevCoach = process.env.AI_COACH_PUBLIC_ENABLED;
  delete process.env.SPEAKING_LIVE_BETA_ENABLED;
  delete process.env.AI_COACH_PUBLIC_ENABLED;
  assert.equal(flags.liveBetaEnabled(), false);
  assert.equal(flags.aiCoachPublicEnabled(), false);
  process.env.SPEAKING_LIVE_BETA_ENABLED = 'yes';
  assert.equal(flags.liveBetaEnabled(), false, 'only the exact string "true" enables a flag');
  process.env.SPEAKING_LIVE_BETA_ENABLED = 'true';
  assert.equal(flags.liveBetaEnabled(), true);
  if (prevLive === undefined) delete process.env.SPEAKING_LIVE_BETA_ENABLED; else process.env.SPEAKING_LIVE_BETA_ENABLED = prevLive;
  if (prevCoach === undefined) delete process.env.AI_COACH_PUBLIC_ENABLED; else process.env.AI_COACH_PUBLIC_ENABLED = prevCoach;
});

test('the function is routed in netlify.toml', () => {
  const toml = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
  assert.match(toml, /from = "\/api\/speaking\/realtime-client-secret"/);
  assert.match(toml, /from = "\/api\/speaking\/speaking-mission-result"/);
});
