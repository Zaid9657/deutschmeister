// Speaking telemetry allowlist — plan Task 4 (speaking-live-quality).
// The forbidden set is the point: audio, transcript, reference phrase,
// client secret, API key and free-form provider errors can never be emitted.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  sanitizeSpeakingEvent, latencyBucket, normalizeErrorCode,
  SPEAKING_EVENTS, ALLOWED_PROPERTIES,
} from '../netlify/functions/_shared/speakingMetrics.mjs';

test('only allowlisted properties survive a mixed payload', () => {
  const event = sanitizeSpeakingEvent('speaking_turn_completed', {
    mode: 'guided',
    missionOrder: 3,
    latencyBucket: 1800,
    entitlement: 'included-mission',
    // everything below is forbidden
    transcript: 'Ich möchte einen Kaffee',
    audioBase64: 'UklGRiQ',
    referenceText: 'Ich möchte einen Kaffee, bitte.',
    clientSecret: 'ek_secret',
    apiKey: 'sk-live',
    providerError: 'model said: "Ich möchte einen Kaffee"',
    email: 'a@b.de',
  });
  assert.deepEqual(event, {
    name: 'speaking_turn_completed',
    properties: { mode: 'guided', missionOrder: 3, latencyBucket: '1-2.5s', entitlement: 'included-mission' },
  });
  for (const key of Object.keys(event.properties)) {
    assert.ok(ALLOWED_PROPERTIES.includes(key), `${key} is not allowlisted`);
  }
});

test('an unknown event name is refused outright', () => {
  assert.equal(sanitizeSpeakingEvent('speaking_transcript_captured', { mode: 'guided' }), null);
  for (const name of SPEAKING_EVENTS) {
    assert.ok(sanitizeSpeakingEvent(name, {}), `${name} must be emittable`);
  }
});

test('error codes are normalized to the closed set', () => {
  assert.equal(normalizeErrorCode('provider said: rate limited for user ana@x.de'), 'UNKNOWN');
  assert.equal(normalizeErrorCode('microphone_denied'), 'MICROPHONE_DENIED');
  const event = sanitizeSpeakingEvent('speaking_failed', { errorCode: 'Error: connect ETIMEDOUT 10.0.0.1:443' });
  assert.equal(event.properties.errorCode, 'UNKNOWN', 'a raw provider message never survives');
});

test('latency is bucketed, never recorded per-utterance', () => {
  assert.equal(latencyBucket(400), '<1s');
  assert.equal(latencyBucket(1800), '1-2.5s');
  assert.equal(latencyBucket(3000), '2.5-5s');
  assert.equal(latencyBucket(9000), '>5s');
  assert.equal(latencyBucket(-1), null);
  assert.equal(latencyBucket('soon'), null);
});

test('mission order is validated, not echoed', () => {
  assert.equal(sanitizeSpeakingEvent('speaking_started', { missionOrder: 99 }).properties.missionOrder, undefined);
  assert.equal(sanitizeSpeakingEvent('speaking_started', { missionOrder: '4' }).properties.missionOrder, 4);
});

test('string properties are bounded so nothing long can ride along', () => {
  const event = sanitizeSpeakingEvent('speaking_ended', { completion: 'x'.repeat(500) });
  assert.equal(event.properties.completion.length, 40);
});

// ── latency gate (plan Task 4 Step 3) ────────────────────────────────────

test('the latency gate fails above the documented thresholds', async () => {
  const { evaluateLatency, percentile, THRESHOLDS_MS } = await import('../scripts/check-speaking-latency.mjs');
  assert.deepEqual(THRESHOLDS_MS, { guided: 2500, live: 1500 });
  assert.equal(percentile([100, 200, 300, 400], 50), 200);
  assert.equal(percentile([100, 200, 300, 400], 95), 400);

  const good = evaluateLatency({ guided: Array(30).fill(1200), live: Array(30).fill(800) });
  assert.equal(good.passed, true);

  // p95 is the 95th percentile, not the max: a single outlier in 30 runs
  // must NOT fail the gate (that is the point of using p95).
  const oneOutlier = evaluateLatency({ guided: [...Array(29).fill(1200), 9000], live: Array(30).fill(800) });
  assert.equal(oneOutlier.passed, true, 'one slow run must not fail a p95 gate');

  const slowGuided = evaluateLatency({ guided: [...Array(20).fill(1200), ...Array(10).fill(4000)], live: Array(30).fill(800) });
  assert.equal(slowGuided.passed, false, 'a p95 above 2.5s must fail the gate');
  assert.equal(slowGuided.report.guided.passed, false);
  assert.equal(slowGuided.report.live.passed, true);

  const slowLive = evaluateLatency({ guided: Array(30).fill(1200), live: Array(30).fill(2000) });
  assert.equal(slowLive.passed, false, 'live above 1.5s must fail the gate');
});

test('the latency report records aggregates and case ids only', () => {
  const src = readFileSync(new URL('../scripts/check-speaking-latency.mjs', import.meta.url), 'utf8');
  const outBlock = src.slice(src.indexOf('const out = {'), src.lastIndexOf('mkdirSync'));
  assert.doesNotMatch(outBlock, /transcript|audio|utterance|text/i, 'the report may carry no content');
  assert.match(outBlock, /caseIds/);
  assert.match(src, /FIXTURE MODE/, 'fixture mode must announce it is not evidence');
});
