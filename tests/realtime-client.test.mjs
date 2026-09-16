// WebRTC live client lifecycle — plan Task 2 (speaking-live-quality).
//
// Mocks RTCPeerConnection, the data channel and fetch, then proves the parts
// that leak or overspend when they go wrong: tracks and channel registered,
// SDP sent with the EPHEMERAL credential, remote audio attached, every exit
// path tearing down, and no permanent key anywhere near this module.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { connectRealtime, parseRealtimeEvent, RealtimeError, KNOWN_EVENT_TYPES } from '../src/features/speaking/realtimeClient.js';

// ── mocks ────────────────────────────────────────────────────────────────

function makeTrack() {
  return { kind: 'audio', enabled: true, stopped: false, stop() { this.stopped = true; } };
}
function makeStream(tracks) {
  return { getAudioTracks: () => tracks, getTracks: () => tracks };
}

class MockChannel {
  constructor() { this.readyState = 'open'; this.sent = []; this.closed = false; }
  send(data) { this.sent.push(data); }
  close() { this.closed = true; this.readyState = 'closed'; }
}

class MockPeer {
  constructor() {
    this.connectionState = 'new';
    // Applying the SDP answer is what flips a real peer to connected; the
    // mock does the same so the tests never depend on timer ordering.
    this.connectOnAnswer = MockPeer.nextConnects;
    this.tracks = [];
    this.channels = [];
    this.listeners = {};
    this.closed = false;
    this.remote = null;
    MockPeer.last = this;
  }
  addTrack(track, stream) { this.tracks.push({ track, stream }); }
  createDataChannel(label) { const c = new MockChannel(); c.label = label; this.channels.push(c); return c; }
  async createOffer() { return { type: 'offer', sdp: 'v=0 mock-offer' }; }
  async setLocalDescription(d) { this.local = d; }
  async setRemoteDescription(d) { this.remote = d; this.transition(this.connectOnAnswer ? 'connected' : 'failed'); }
  getSenders() { return this.tracks.map(({ track }) => ({ track })); }
  addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
  close() { this.closed = true; this.connectionState = 'closed'; }
  /** Drive the state machine the way the browser would. */
  transition(state) {
    this.connectionState = state;
    this.onconnectionstatechange?.();
    for (const fn of this.listeners.connectionstatechange || []) fn();
  }
  emitTrack(stream) { this.ontrack?.({ streams: [stream] }); }
}

let originalPeer;
let originalFetch;

beforeEach(() => {
  originalPeer = globalThis.RTCPeerConnection;
  originalFetch = globalThis.fetch;
  globalThis.RTCPeerConnection = MockPeer;
  MockPeer.nextConnects = true;
  globalThis.fetch = async () => ({ ok: true, status: 200, text: async () => 'v=0 mock-answer' });
});
afterEach(() => {
  globalThis.RTCPeerConnection = originalPeer;
  globalThis.fetch = originalFetch;
});

MockPeer.nextConnects = true;
const connectAndSettle = (opts = {}) => connectRealtime(opts);

// ── tests ────────────────────────────────────────────────────────────────

test('a connection registers the mic track, the events channel and the remote audio', async () => {
  const track = makeTrack();
  const stream = makeStream([track]);
  const audioElement = {};
  const conn = await connectAndSettle({
    clientSecret: 'ek_ephemeral', model: 'gpt-realtime-2.1-mini', mediaStream: stream, audioElement,
  });
  const peer = MockPeer.last;
  assert.equal(peer.tracks.length, 1, 'the microphone track must be added');
  assert.equal(peer.channels[0].label, 'oai-events');
  assert.equal(peer.remote.type, 'answer', 'the SDP answer must be applied');
  assert.equal(conn.state, 'connected');

  const remote = makeStream([makeTrack()]);
  peer.emitTrack(remote);
  assert.equal(audioElement.srcObject, remote, 'remote audio must be attached');
  conn.close();
});

test('the SDP exchange uses the ephemeral credential and the configured model', async () => {
  let seen = null;
  globalThis.fetch = async (url, init) => {
    seen = { url, init };
    return { ok: true, status: 200, text: async () => 'v=0 mock-answer' };
  };
  const conn = await connectAndSettle({
    clientSecret: 'ek_ephemeral', model: 'gpt-realtime-2.1-mini', mediaStream: makeStream([makeTrack()]),
  });
  assert.match(seen.url, /^https:\/\/api\.openai\.com\/v1\/realtime\/calls\?model=gpt-realtime-2\.1-mini$/);
  assert.equal(seen.init.headers.Authorization, 'Bearer ek_ephemeral');
  assert.equal(seen.init.headers['Content-Type'], 'application/sdp');
  assert.equal(seen.init.body, 'v=0 mock-offer');
  conn.close();
});

test('close() stops every local track and closes the channel and peer', async () => {
  const track = makeTrack();
  const conn = await connectAndSettle({ clientSecret: 'ek', model: 'm', mediaStream: makeStream([track]) });
  const peer = MockPeer.last;
  conn.close();
  assert.equal(track.stopped, true, 'the microphone must be released');
  assert.equal(peer.channels[0].closed, true);
  assert.equal(peer.closed, true);
  assert.equal(conn.state, 'closed');
  conn.close(); // idempotent
  assert.equal(conn.state, 'closed');
});

test('a failed SDP exchange tears down and reports PROVIDER_UNAVAILABLE', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 500, text: async () => '' });
  const track = makeTrack();
  await assert.rejects(
    () => connectAndSettle({ clientSecret: 'ek', model: 'm', mediaStream: makeStream([track]) }),
    (err) => err instanceof RealtimeError && err.code === 'PROVIDER_UNAVAILABLE',
  );
  assert.equal(track.stopped, true, 'a failed connect must still release the microphone');
  assert.equal(MockPeer.last.closed, true);
});

test('a peer that fails to connect reports CONNECTION_FAILED and releases the mic', async () => {
  const track = makeTrack();
  MockPeer.nextConnects = false;
  await assert.rejects(
    () => connectRealtime({ clientSecret: 'ek', model: 'm', mediaStream: makeStream([track]) }),
    (err) => err instanceof RealtimeError && err.code === 'CONNECTION_FAILED',
  );
  assert.equal(track.stopped, true);
});

test('a missing credential or stream never opens a peer connection', async () => {
  await assert.rejects(
    () => connectRealtime({ model: 'm', mediaStream: makeStream([makeTrack()]) }),
    (err) => err.code === 'PROVIDER_UNAVAILABLE',
  );
  await assert.rejects(
    () => connectRealtime({ clientSecret: 'ek', model: 'm' }),
    (err) => err.code === 'MICROPHONE_DENIED',
  );
});

test('mute toggles the track without tearing the session down', async () => {
  const track = makeTrack();
  const conn = await connectAndSettle({ clientSecret: 'ek', model: 'm', mediaStream: makeStream([track]) });
  conn.mute(true);
  assert.equal(track.enabled, false);
  conn.mute(false);
  assert.equal(track.enabled, true);
  assert.equal(conn.state, 'connected');
  conn.close();
});

test('only known events surface; anything else is dropped', () => {
  assert.equal(parseRealtimeEvent('{"type":"response.done"}').type, 'response.done');
  assert.equal(parseRealtimeEvent('{"type":"totally.unknown"}'), null);
  assert.equal(parseRealtimeEvent('not json'), null);
  assert.equal(parseRealtimeEvent(null), null);
  assert.ok(KNOWN_EVENT_TYPES.includes('error'));
});

test('the module cannot leak a permanent API key', () => {
  const src = readFileSync(new URL('../src/features/speaking/realtimeClient.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /OPENAI_API_KEY|sk-[a-z]/i, 'a permanent key may never appear in browser code');
  assert.match(src, /clientSecret/, 'the client uses the ephemeral secret');
});
