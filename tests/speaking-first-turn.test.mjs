import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { rmsLevel, measureMicrophone } from '../src/components/speaking/microphoneLevel.js';
import { boundedSpeakingRequest } from '../src/lib/speakingRequest.js';
import { createFirstTurnTracker } from '../src/lib/speakingFirstTurn.js';
import { isFunnelEvent, sanitizeProps } from '../src/data/events.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the microphone level comes from samples: silence is zero, louder input is higher', async () => {
  assert.equal(rmsLevel(new Float32Array(8)), 0);
  assert.equal(rmsLevel(new Float32Array([0.5, -0.5])), 0.5);
  assert.equal(rmsLevel([]), 0);
  let frame, disconnected = 0, closed = 0, cancelled = 0, amplitude = 0;
  const levels = [];
  const analyser = { getFloatTimeDomainData: (samples) => samples.fill(amplitude) };
  const source = { connect: (target) => assert.equal(target, analyser), disconnect: () => disconnected++ };
  const context = { resume: async () => {}, close: async () => { closed++; }, createAnalyser: () => analyser, createMediaStreamSource: () => source };
  const runtime = { AudioContext: function () { return context; }, requestAnimationFrame: (cb) => { frame = cb; return 7; }, cancelAnimationFrame: (id) => { assert.equal(id, 7); cancelled++; }, setTimeout, clearTimeout };
  const stop = await measureMicrophone({}, (level) => levels.push(level), runtime);
  assert.deepEqual(levels, [0]);
  amplitude = 0.25;
  frame();
  assert.deepEqual(levels, [0, 0.25]);
  stop(); stop(); frame();
  assert.equal(disconnected, 1);
  assert.equal(closed, 1);
  assert.equal(cancelled, 1);
  assert.equal(levels.length, 2, 'no samples after cleanup');
});

test('a rejected audio context is closed and can be retried', async () => {
  let closed = 0;
  await assert.rejects(measureMicrophone({}, () => {}, {
    AudioContext: function () { return { resume: async () => { throw new Error('blocked'); }, close: async () => { closed++; } }; },
    setTimeout, clearTimeout,
  }), /blocked/);
  assert.equal(closed, 1);
});

test('a hanging operation aborts once and never retries automatically', async () => {
  let calls = 0, signal;
  await assert.rejects(boundedSpeakingRequest((s) => { signal = s; calls++; return new Promise(() => {}); }, 5), { name: 'TimeoutError' });
  assert.equal(signal.aborted, true);
  assert.equal(calls, 1);
  assert.equal(await boundedSpeakingRequest(async () => 'ok', 5), 'ok');
});

function session({ hang, status = 200, data = { userTranscript: 'Hallo', replyText: 'Guten Tag' } } = {}) {
  const source = read('src/components/speaking/SpeakingSession.jsx');
  const body = source.slice(source.indexOf('  const postTurn ='), source.indexOf('  const handleRecordingStopped ='));
  const retry = source.slice(source.indexOf('  const retryTurn ='), source.indexOf('  if (!micChecked)'));
  const state = { error: null, messages: [], events: [], requests: [] };
  const context = {
    useCallback: (fn) => fn, sessionToken: 'test-session', endSession() {}, playAudio() {},
    tracker: createFirstTurnTracker((event, props) => state.events.push({ event, ...props })),
    getAuthHeaders: async () => hang === 'headers' ? new Promise(() => {}) : {},
    boundedSpeakingRequest: (operation) => boundedSpeakingRequest(operation, 5),
    fetch: async (url, options) => {
      state.requests.push({ url, options });
      return hang === 'fetch' ? new Promise(() => {}) : { ok: status === 200, status,
        json: async () => hang === 'body' ? new Promise(() => {}) : data };
    },
    messagesRef: { current: [] }, lastReplyAudioRef: { current: null }, aliveRef: { current: true },
    endingRef: { current: false }, turnInFlightRef: { current: null }, lastRecordingRef: { current: { audioBase64: 'clip', mimeType: 'audio/webm' } },
    recordState: 'idle', setTurnError: (value) => { state.error = value; },
    setRecordState: (value) => { context.recordState = value; },
    setTtsWarning() {}, setNoSpeech() {}, setMessages: (value) => { state.messages = value; },
  };
  const methods = vm.runInNewContext(`${body}\n${retry}\n({ sendTurn, retryTurn });`, context);
  return { ...methods, state, context };
}

test('headers, fetch and body all time out to an actionable retained-recording retry', async () => {
  for (const hang of ['headers', 'fetch', 'body']) {
    const s = session({ hang });
    await s.sendTurn('clip', 'audio/webm');
    assert.equal(s.context.recordState, 'idle');
    assert.equal(s.state.error.retryable, true);
    assert.match(s.state.error.message, /erneut senden/);
    assert.equal(s.context.lastRecordingRef.current.audioBase64, 'clip');
    assert.equal(s.state.events.at(-1).result, 'timeout');
    const before = s.state.events.length;
    s.retryTurn(); s.retryTurn();
    await s.context.turnInFlightRef.current;
    assert.equal(s.state.events.slice(before).filter((e) => e.result === 'retry').length, 1, 'double retry cannot send concurrently');
  }
});

test('success is recorded once; silent and rejected turns do not count as success', async () => {
  const good = session();
  await good.sendTurn('clip', 'audio/webm');
  assert.equal(good.state.messages.length, 2);
  assert.equal(good.context.lastRecordingRef.current, null);
  good.context.tracker.stop();
  assert.equal(good.state.events.filter((e) => e.result === 'completed').length, 1);
  assert.equal(good.state.events.at(-1).result, 'completed');
  const silent = session({ data: { noSpeech: true } });
  await silent.sendTurn('clip', 'audio/webm');
  silent.context.tracker.stop();
  assert.equal(silent.state.events.at(-2).result, 'no_speech');
  assert.equal(silent.state.events.at(-1).step, 'request');
  const malformed = session({ data: {} });
  await malformed.sendTurn('clip', 'audio/webm');
  assert.equal(malformed.state.error.retryable, true);
  assert.equal(malformed.context.lastRecordingRef.current.audioBase64, 'clip');
  assert.equal(malformed.state.events.at(-1).result, 'failed');
  const tooLong = session({ status: 413 });
  await tooLong.sendTurn('clip', 'audio/webm');
  assert.equal(tooLong.state.error.retryable, false);
});

test('first-turn observations use the existing event registry and fixed nonpersonal labels', () => {
  assert.ok(isFunnelEvent('speaking_first_turn'));
  const events = [];
  const tracker = createFirstTurnTracker((_, props) => events.push(props), 'learner@example.test');
  tracker.mark('permission'); tracker.mark('learner@example.test', 'failed');
  tracker.mark('playback', 'failed'); tracker.stop(); tracker.stop(); tracker.mark('reply', 'completed');
  assert.equal(events.length, 3);
  assert.deepEqual(events.at(-1), { surface: 'speaking', step: 'playback', result: 'stopped' });
  events.forEach((event) => assert.deepEqual(sanitizeProps(event), event));
  const source = read('src/components/speaking/SpeakingSession.jsx');
  assert.match(source, /createFirstTurnTracker\(track,/);
  assert.doesNotMatch(source, /equalizer|EQ_BARS/);
  assert.match(source, /measureMicrophone\(streamRef\.current, setMicLevel\)/);
});

test('the test clip is local, bounded to three seconds, replayable, and cleaned up', async () => {
  const source = read('src/components/speaking/MicrophoneCheck.jsx');
  const start = source.indexOf('  const recordTest =');
  const body = source.slice(start, source.indexOf('\n  return (', start));
  const state = {}, stream = {}, resources = { current: { alive: true, stream } };
  let stopRecording, meterStopped = 0;
  class Recorder {
    constructor() { this.mimeType = 'audio/webm'; }
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; this.ondataavailable({ data: new Blob(['test']) }); this.onstop(); }
  }
  const record = vm.runInNewContext(`${body}; recordTest`, {
    resources, tracker: { mark() {} }, isLiveStream: () => true,
    measureMicrophone: async (_stream, onLevel) => { onLevel(0.5); return () => meterStopped++; },
    pickAudioMimeType: () => 'audio/webm', MediaRecorder: Recorder, Blob,
    URL: { createObjectURL: () => 'blob:local-test', revokeObjectURL() {} },
    setTimeout: (fn, duration) => { assert.equal(duration, 3000); stopRecording = fn; },
    setPhase: (v) => { state.phase = v; }, setError: (v) => { state.error = v; },
    setClip: (v) => { state.clip = v; }, setPlayed: (v) => { state.played = v; },
    setHeardInput: (v) => { state.heardInput = v; }, setLevel: (v) => { state.level = v; },
  });
  await record();
  assert.equal(state.phase, 'recording');
  assert.equal(state.heardInput, true);
  stopRecording();
  assert.equal(state.phase, 'playback');
  assert.equal(state.clip, 'blob:local-test');
  assert.equal(state.played, false);
  assert.equal(meterStopped, 1);
  assert.match(source, /<audio[^>]*controls[^>]*onEnded=/);
  assert.match(source, /disabled=\{!played\}/);
  assert.match(source, /URL\.revokeObjectURL\(r\.url\)/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|audioBase64/);
});
