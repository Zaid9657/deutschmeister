import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { releaseMicrophone } from '../src/components/speaking/mediaSupport.js';

const entries = [
  ['practice', 'src/pages/SpeakingPage.jsx', 'handleStart'],
  ['placement', 'src/components/LevelTest/LevelTestSpeaking.jsx', 'startSession'],
];

function deferred() {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}

function startup(path, name, { delayMic = false, delayAuth = false } = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const start = source.indexOf(`const ${name} = async`);
  assert.ok(start >= 0);
  const action = source.slice(start, source.indexOf('\n  };', start) + 5);
  assert.match(source, /useEffect\(\(\) => \(\) => pendingStartRef\.current\?\.\(\), \[\]\)/, 'unmount must cancel the pending startup');
  const mic = deferred();
  const auth = deferred();
  const response = deferred();
  let stops = 0;
  const stream = { getTracks: () => [{ stop: () => { stops++; } }] };
  const pendingStartRef = { current: null };
  const calls = [];
  const updates = [];
  const context = {
    startDisabled: false, pendingStartRef, user: { id: 'user' },
    selectedLevel: 'A1.1', selectedMinutes: 5, selectedMissionId: null,
    courseTaskActive: false, activeMission: null, walletCents: 0, selectedCost: 0,
    acquireMicrophone: async () => delayMic ? mic.promise : stream,
    getAuthHeaders: async () => delayAuth ? auth.promise : { Authorization: 'Bearer jwt' },
    releaseMicrophone, micErrorMessage: (err) => err.message,
    fetch: async (url, init) => {
      const body = JSON.parse(init.body);
      calls.push({ url, init, body });
      return body.action === 'end' ? { ok: true } : response.promise;
    },
    console: { error() {}, warn() {} }, loadMeta() {},
  };
  for (const key of ['setStarting', 'setStartError', 'setSession', 'setPhase', 'setStage', 'setError', 'setEvaluation']) {
    context[key] = (value) => updates.push({ key, value });
  }
  const run = vm.runInNewContext(`${action}; ${name}`, context);
  return {
    run, calls, updates, pendingStartRef, stops: () => stops,
    grantMic: () => mic.resolve(stream),
    authorize: () => auth.resolve({ Authorization: 'Bearer jwt' }),
    reply: () => response.resolve({ ok: true, status: 200, json: async () => ({ session_token: 'created-session', planned_minutes: 5 }) }),
  };
}

const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

for (const [label, path, name] of entries) {
  test(`${label}: leaving while microphone permission is pending stops a late stream without starting a session`, async () => {
    const h = startup(path, name, { delayMic: true });
    const running = h.run();
    h.pendingStartRef.current();
    const updatesBefore = h.updates.length;
    h.grantMic();
    await running;
    assert.ok(h.stops() >= 1);
    assert.equal(h.calls.length, 0);
    assert.equal(h.updates.length, updatesBefore);
  });

  test(`${label}: leaving during authentication releases the microphone without reserving a session`, async () => {
    const h = startup(path, name, { delayAuth: true });
    const running = h.run();
    await flush();
    h.pendingStartRef.current();
    assert.ok(h.stops() >= 1);
    h.authorize();
    await running;
    assert.equal(h.calls.length, 0);
  });

  test(`${label}: leaving during session creation stops the mic immediately and closes the late session`, async () => {
    const h = startup(path, name);
    const running = h.run();
    await flush();
    assert.equal(h.calls[0].body.action, 'start');
    h.pendingStartRef.current();
    assert.ok(h.stops() >= 1);
    const updatesBefore = h.updates.length;
    h.reply();
    await running;
    assert.deepEqual(h.calls.map((call) => call.body.action), ['start', 'end']);
    assert.equal(h.calls[1].body.session_token, 'created-session');
    assert.equal(h.calls[1].init.keepalive, true);
    assert.equal(h.updates.length, updatesBefore);
  });

  test(`${label}: a live startup hands the microphone to the session and rejects duplicate starts`, async () => {
    const h = startup(path, name);
    const running = h.run();
    await h.run();
    await flush();
    assert.equal(h.calls.length, 1);
    h.reply();
    await running;
    assert.equal(h.stops(), 0);
    assert.equal(h.updates.find((u) => u.key === 'setSession').value.sessionToken, 'created-session');
  });
}
