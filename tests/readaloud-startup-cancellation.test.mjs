import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { alignTranscript, selfConfirmedResult } from '../src/lib/lesson/readaloud.js';
import { canRetryReadAloud, canSelfConfirmReadAloud } from '../src/lib/lesson/readAloudControls.js';

function deferred() {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}

// Run the component's actual hooks and callbacks without rendering its JSX.
function readAloud({ delayMic = false, delayBlob = false, delayAuth = false, delayResponse = false } = {}) {
  const source = readFileSync(new URL('../src/components/lesson/ReadAloudLine.jsx', import.meta.url), 'utf8');
  const start = source.indexOf('\n  const { user }');
  const end = source.indexOf('\n  return (', start);
  assert.ok(start >= 0 && end > start);
  const mic = deferred();
  const blob = deferred();
  const auth = deferred();
  const response = deferred();
  const cleanups = [];
  const updates = [];
  const calls = [];
  const recorders = [];
  const timers = new Map();
  const results = [];
  let stops = 0;
  let authCalls = 0;
  let timerId = 0;
  const stream = { getTracks: () => [{ stop: () => { stops++; } }] };
  const reply = { ok: true, status: 200, json: async () => ({ transcript: 'Guten Tag', pct: 1 }) };
  const context = {
    MAX_ATTEMPTS: 3, MAX_RECORD_MS: 8000,
    useAuth: () => ({ user: { id: 'learner' } }),
    useLessonLang: () => ['de'], checkSpeakingSupport: () => ({ supported: true }),
    useState: (value) => [typeof value === 'function' ? value() : value, (next) => updates.push(next)],
    useRef: (current) => ({ current }), useCallback: (callback) => callback,
    useEffect: (effect) => { cleanups.push(effect()); },
    navigator: { mediaDevices: { getUserMedia: async () => delayMic ? mic.promise : stream } },
    MediaRecorder: class {
      constructor() { this.mimeType = 'audio/webm'; this.state = 'inactive'; recorders.push(this); }
      start() { this.state = 'recording'; }
      stop() { this.state = 'inactive'; this.onstop?.(); }
    },
    pickAudioMimeType: () => 'audio/webm', micErrorMessage: (err) => err.message,
    blobToBase64: async () => delayBlob ? blob.promise : 'audio',
    getAuthHeaders: async () => { authCalls++; return delayAuth ? auth.promise : { Authorization: 'Bearer jwt' }; },
    fetch: async (url, init) => { calls.push({ url, init }); return delayResponse ? response.promise : reply; },
    setTimeout: (callback) => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: (id) => timers.delete(id),
    alignTranscript, selfConfirmedResult, canRetryReadAloud, canSelfConfirmReadAloud, Blob,
    console: { error() {} },
  };
  const component = vm.runInNewContext(`
    function ReadAloudLine({ lektionId, lineKey, text, onResult }) {
      ${source.slice(start, end)}
      return { startRecording, stopRecording, handleStopped };
    }
    ReadAloudLine;
  `, context)({ lektionId: 'lektion', lineKey: 'line', text: 'Guten Tag', onResult: (result) => results.push(result) });
  return {
    component, calls, recorders, timers, updates, results,
    stops: () => stops, authCalls: () => authCalls,
    unmount: () => cleanups.forEach((cleanup) => cleanup?.()),
    grantMic: () => mic.resolve(stream),
    convertBlob: () => blob.resolve('audio'),
    authorize: () => auth.resolve({ Authorization: 'Bearer jwt' }),
    reply: () => response.resolve(reply),
    audioChunk: () => recorders[0].ondataavailable({ data: new Blob(['audio']) }),
  };
}

const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

test('read-aloud: unmount during microphone permission stops the late stream without recording or uploading', async () => {
  const h = readAloud({ delayMic: true });
  const running = h.component.startRecording();
  h.unmount();
  const updatesBefore = h.updates.length;
  h.grantMic();
  await running;
  assert.equal(h.stops(), 1);
  assert.equal(h.recorders.length, 0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.calls.length, 0);
  assert.equal(h.updates.length, updatesBefore);
});

test('read-aloud: unmount disconnects an active recorder and ignores a queued stop event', async () => {
  const h = readAloud();
  await h.component.startRecording();
  h.audioChunk();
  const stopped = h.recorders[0].onstop;
  h.unmount();
  const updatesBefore = h.updates.length;
  await stopped();
  await flush();
  assert.equal(h.stops(), 1);
  assert.equal(h.recorders[0].state, 'inactive');
  assert.equal(h.recorders[0].onstop, null);
  assert.equal(h.timers.size, 0);
  assert.equal(h.calls.length, 0);
  assert.equal(h.updates.length, updatesBefore);
});

test('read-aloud: unmount during blob conversion never authenticates or uploads the clip', async () => {
  const h = readAloud({ delayBlob: true });
  await h.component.startRecording();
  h.audioChunk();
  const stopped = h.component.handleStopped();
  h.unmount();
  const updatesBefore = h.updates.length;
  h.convertBlob();
  await stopped;
  await flush();
  assert.equal(h.authCalls(), 0);
  assert.equal(h.calls.length, 0);
  assert.equal(h.updates.length, updatesBefore);
});

test('read-aloud: unmount during authentication never uploads the clip', async () => {
  const h = readAloud({ delayAuth: true });
  await h.component.startRecording();
  h.audioChunk();
  await h.component.handleStopped();
  assert.equal(h.authCalls(), 1);
  h.unmount();
  const updatesBefore = h.updates.length;
  h.authorize();
  await flush();
  assert.equal(h.calls.length, 0);
  assert.equal(h.updates.length, updatesBefore);
});

test('read-aloud: a scoring response after unmount cannot report a result', async () => {
  const h = readAloud({ delayResponse: true });
  await h.component.startRecording();
  h.audioChunk();
  await h.component.handleStopped();
  await flush();
  assert.equal(h.calls.length, 1);
  h.unmount();
  const updatesBefore = h.updates.length;
  h.reply();
  await flush();
  assert.equal(h.results.length, 0);
  assert.equal(h.updates.length, updatesBefore);
});

test('read-aloud: a mounted line records and scores once while duplicate microphone starts are ignored', async () => {
  const h = readAloud({ delayMic: true });
  const running = h.component.startRecording();
  const duplicate = h.component.startRecording();
  h.grantMic();
  await Promise.all([running, duplicate]);
  assert.equal(h.recorders.length, 1);
  assert.equal(h.recorders[0].state, 'recording');
  h.audioChunk();
  await h.component.handleStopped();
  await flush();
  assert.equal(h.stops(), 1);
  assert.equal(h.calls.length, 1);
  assert.equal(h.results[0].pct, 1);
  assert.equal(h.results[0].usedMic, true);
});
