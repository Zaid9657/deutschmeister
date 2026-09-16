// Privacy-safe speaking telemetry — plan Task 4 (speaking-live-quality).
//
// ONE allowlist, shared by the browser (src/lib/funnelTracking.js) and the
// server's aggregate logs, so a property that must never be measured cannot
// slip in on either side. Everything not on the list is DROPPED, not
// sanitized in place: audio, transcripts, reference phrases, client secrets,
// API keys and free-form provider errors have no representation here.
//
// Free-form provider errors are the subtle one: a raw provider message can
// quote the learner's own words back. Error codes are normalized to a small
// closed set instead.

export const SPEAKING_EVENTS = Object.freeze([
  'speaking_started',
  'speaking_connected',
  'speaking_turn_completed',
  'speaking_failed',
  'speaking_ended',
  'speaking_fallback_used',
]);

export const ALLOWED_PROPERTIES = Object.freeze([
  'mode',            // 'guided' | 'live' | 'lab' | 'placement'
  'missionOrder',    // 1–12
  'durationBucket',  // '5m' | '10m' | '15m'
  'providerStage',   // 'stt' | 'llm' | 'tts' | 'acoustic' | 'realtime'
  'errorCode',       // normalized, see ERROR_CODES
  'latencyBucket',   // '<1s' | '1-2.5s' | '2.5-5s' | '>5s'
  'entitlement',     // 'included-mission' | 'monthly' | 'permanent'
  'completion',      // 'passed' | 'not-passed' | 'abandoned'
]);

export const ERROR_CODES = Object.freeze([
  'AUTH_REQUIRED', 'INSUFFICIENT_ALLOWANCE', 'MICROPHONE_DENIED',
  'PROVIDER_UNAVAILABLE', 'INVALID_RESPONSE', 'CONNECTION_FAILED', 'UNKNOWN',
]);

/** Bucket a latency in ms — raw timings are aggregates, never per-utterance. */
export function latencyBucket(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n < 1000) return '<1s';
  if (n < 2500) return '1-2.5s';
  if (n < 5000) return '2.5-5s';
  return '>5s';
}

/** Normalize any error to the closed code set — never a provider message. */
export function normalizeErrorCode(code) {
  const upper = String(code || '').toUpperCase();
  return ERROR_CODES.includes(upper) ? upper : 'UNKNOWN';
}

/**
 * sanitizeSpeakingEvent(name, props) → { name, properties } or null when the
 * event name is not one of ours. Only allowlisted properties survive.
 */
export function sanitizeSpeakingEvent(name, props = {}) {
  if (!SPEAKING_EVENTS.includes(name)) return null;
  const properties = {};
  for (const key of ALLOWED_PROPERTIES) {
    if (props[key] === undefined || props[key] === null) continue;
    if (key === 'errorCode') {
      properties.errorCode = normalizeErrorCode(props.errorCode);
    } else if (key === 'latencyBucket') {
      // Accept a raw ms number OR an already-bucketed string.
      properties.latencyBucket = typeof props.latencyBucket === 'number'
        ? latencyBucket(props.latencyBucket)
        : String(props.latencyBucket);
    } else if (key === 'missionOrder') {
      const n = Number(props.missionOrder);
      if (Number.isInteger(n) && n >= 1 && n <= 12) properties.missionOrder = n;
    } else {
      properties[key] = String(props[key]).slice(0, 40);
    }
  }
  if (properties.latencyBucket == null) delete properties.latencyBucket;
  return { name, properties };
}

/** Server-side: one structured aggregate log line, already sanitized. */
export function logSpeakingEvent(name, props) {
  const event = sanitizeSpeakingEvent(name, props);
  if (!event) return null;
  console.log('[speaking-metric]', JSON.stringify(event));
  return event;
}
