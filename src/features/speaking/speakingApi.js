// Network adapter for the speaking feature — every call the City Map makes
// goes through here, so error typing and idempotency live in ONE place.
// Errors are typed (never raw fetch errors) so the UI can render honest,
// specific states: AUTH_REQUIRED, INSUFFICIENT_ALLOWANCE, MICROPHONE_DENIED,
// PROVIDER_UNAVAILABLE, INVALID_RESPONSE.
import { getAuthHeaders } from '../../utils/supabase';
import { normalizeGuidedFeedback, FeedbackContractError } from './feedbackModel.js';

export class SpeakingApiError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = 'SpeakingApiError';
    this.code = code;
  }
}

const CODES_BY_STATUS = {
  401: 'AUTH_REQUIRED',
  402: 'INSUFFICIENT_ALLOWANCE',
  502: 'PROVIDER_UNAVAILABLE',
  503: 'PROVIDER_UNAVAILABLE',
};

async function post(path, body) {
  let res;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new SpeakingApiError('PROVIDER_UNAVAILABLE', 'Network error');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new SpeakingApiError(CODES_BY_STATUS[res.status] || 'INVALID_RESPONSE', data.error);
  }
  return data;
}

/** Start a session. Guided missions pass missionId; the server owns the cap. */
export async function startSpeakingSession({ level, missionId, mode }) {
  const data = await post('/api/speaking/speaking-session', {
    action: 'start',
    level,
    ...(missionId ? { missionId } : {}),
    ...(mode ? { mode } : {}),
    idempotencyKey: crypto.randomUUID(),
  });
  if (!data.sessionToken) throw new SpeakingApiError('INVALID_RESPONSE', 'start returned no session');
  return data;
}

/**
 * Submit one guided turn (audio + short browser-held context) and get the
 * normalized three-signal feedback back. A contract violation surfaces as
 * INVALID_RESPONSE — the UI never renders an unvalidated payload.
 */
export async function submitGuidedTurn({ sessionToken, audioBase64, mimeType, referenceText, history }) {
  const data = await post('/api/speaking/speaking-turn', {
    session_token: sessionToken,
    audioBase64,
    mimeType,
    ...(referenceText ? { referenceText } : {}),
    ...(Array.isArray(history) ? { history } : {}),
  });
  try {
    return normalizeGuidedFeedback(data);
  } catch (err) {
    if (err instanceof FeedbackContractError) {
      throw new SpeakingApiError('INVALID_RESPONSE', err.message);
    }
    throw err;
  }
}

/** Finish (or cancel/fail) a session; settles the reservation server-side. */
export async function finishSpeakingSession({ sessionToken, usedSeconds, outcome = 'completed', userTurns }) {
  return post('/api/speaking/speaking-session', {
    action: 'end',
    sessionToken,
    usedSeconds,
    outcome,
    ...(Number.isFinite(userTurns) ? { user_turns: userTurns } : {}),
    idempotencyKey: `${sessionToken}:end`,
  });
}

/** The balance read-model (seconds + included attempts). Display only. */
export async function fetchSpeakingBalance() {
  return post('/api/speaking/check-speaking-usage', {});
}
