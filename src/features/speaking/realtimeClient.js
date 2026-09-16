// WebRTC client for Live Conversation — plan Task 2 (speaking-live-quality).
//
// Isolated from React on purpose: the connection lifecycle is the part that
// leaks microphones and peer connections when it is entangled with render.
// Every exit path — success, failure, timeout, close — runs the same
// teardown, so no track, channel or peer object survives a session.
//
// The credential is the EPHEMERAL client secret minted by
// netlify/functions/realtime-client-secret.mjs. The provider's permanent
// key is server-only and never reaches the browser — the leak pin in
// tests/realtime-client.test.mjs holds that this file cannot even name it.

const CALLS_URL = 'https://api.openai.com/v1/realtime/calls';
const CONNECT_TIMEOUT_MS = 10_000;

/** Events the data channel is allowed to surface; anything else is ignored. */
export const KNOWN_EVENT_TYPES = Object.freeze([
  'session.created',
  'session.updated',
  'input_audio_buffer.speech_started',
  'input_audio_buffer.speech_stopped',
  'conversation.item.input_audio_transcription.completed',
  'response.output_audio_transcript.delta',
  'response.output_audio_transcript.done',
  'response.done',
  'error',
]);

export class RealtimeError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = 'RealtimeError';
    this.code = code; // 'CONNECTION_FAILED' | 'PROVIDER_UNAVAILABLE' | 'MICROPHONE_DENIED'
  }
}

/** Pure: keep only events we understand, so an unknown payload cannot render. */
export function parseRealtimeEvent(raw) {
  let event;
  try {
    event = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
  if (!event || typeof event.type !== 'string') return null;
  if (!KNOWN_EVENT_TYPES.includes(event.type)) return null;
  return event;
}

/**
 * connectRealtime({ clientSecret, model, mediaStream, onEvent, onStateChange })
 *   → { send, mute, close, state }
 *
 * Caller owns getUserMedia (so the mic can be probed before any allowance is
 * spent) and hands the stream in; close() still stops its tracks, because the
 * session ending is the moment the microphone must go quiet.
 */
export async function connectRealtime({ clientSecret, model, mediaStream, onEvent, onStateChange, audioElement }) {
  if (!clientSecret) throw new RealtimeError('PROVIDER_UNAVAILABLE', 'missing client secret');
  if (!mediaStream) throw new RealtimeError('MICROPHONE_DENIED', 'no media stream');

  const pc = new RTCPeerConnection();
  let channel = null;
  let closed = false;
  let state = 'connecting';
  let connectTimer = null;

  const setState = (next) => {
    if (closed && next !== 'closed') return;
    state = next;
    onStateChange?.(next);
  };

  const teardown = () => {
    if (closed) return;
    closed = true;
    // The connect watchdog must die with the session: an exit BEFORE the
    // connection is awaited (a failed SDP exchange, say) would otherwise
    // leave a live timer and an unhandled rejection behind it.
    if (connectTimer) { clearTimeout(connectTimer); connectTimer = null; }
    try { channel?.close(); } catch { /* already gone */ }
    try { mediaStream.getTracks().forEach((t) => t.stop()); } catch { /* already gone */ }
    try { pc.getSenders().forEach((s) => s.track && s.track.stop()); } catch { /* already gone */ }
    try { pc.close(); } catch { /* already gone */ }
    setState('closed');
  };

  try {
    // Remote audio: the coach's voice.
    pc.ontrack = (e) => {
      if (audioElement && e.streams?.[0]) {
        audioElement.srcObject = e.streams[0];
        audioElement.play?.().catch(() => {});
      }
    };
    pc.onconnectionstatechange = () => {
      if (['failed', 'disconnected'].includes(pc.connectionState)) {
        setState('failed');
      } else if (pc.connectionState === 'connected') {
        setState('connected');
      }
    };

    for (const track of mediaStream.getAudioTracks()) pc.addTrack(track, mediaStream);

    channel = pc.createDataChannel('oai-events');
    channel.onmessage = (e) => {
      const event = parseRealtimeEvent(e.data);
      if (event) onEvent?.(event);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const connected = new Promise((resolve, reject) => {
      connectTimer = setTimeout(() => reject(new RealtimeError('CONNECTION_FAILED', 'timed out')), CONNECT_TIMEOUT_MS);
      const check = () => {
        if (pc.connectionState === 'connected') { clearTimeout(connectTimer); connectTimer = null; resolve(); }
        if (['failed', 'closed'].includes(pc.connectionState)) {
          clearTimeout(connectTimer);
          connectTimer = null;
          reject(new RealtimeError('CONNECTION_FAILED', pc.connectionState));
        }
      };
      pc.addEventListener('connectionstatechange', check);
      check();
    });
    // Whoever exits first wins; this keeps the loser from surfacing as an
    // unhandled rejection when we never get to await it.
    connected.catch(() => {});

    const res = await fetch(`${CALLS_URL}?model=${encodeURIComponent(model)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${clientSecret}`, 'Content-Type': 'application/sdp' },
      body: offer.sdp,
    });
    if (!res.ok) throw new RealtimeError('PROVIDER_UNAVAILABLE', `SDP exchange failed (${res.status})`);
    await pc.setRemoteDescription({ type: 'answer', sdp: await res.text() });

    await connected;
    setState('connected');
  } catch (err) {
    teardown();
    throw err instanceof RealtimeError ? err : new RealtimeError('CONNECTION_FAILED', err.message);
  }

  return {
    get state() { return state; },
    send(event) {
      if (closed || channel?.readyState !== 'open') return false;
      channel.send(JSON.stringify(event));
      return true;
    },
    mute(muted) {
      for (const track of mediaStream.getAudioTracks()) track.enabled = !muted;
      return muted;
    },
    close: teardown,
  };
}
