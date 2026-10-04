// Course v2 — the client side of the AI grading endpoints (docs/course-v2/E1-server.md §1).
//
//   evaluate-writing   POST { taskKey, text }                → the v2 result (schema: 2)
//   speaking-session   POST { action: 'start', courseTaskKey, minutes } → { session_token, replyText, … }
//
// The task itself is always loaded on the server from the compiled bank by its key; the
// client never sends task text as instructions. Identity is the verified JWT.

import { getAuthHeaders } from '../../utils/supabase';

/** The chrome string key that explains a refusal (strings.js `ai.*`). */
export function refusalKey(status, data) {
  if (status === 401) return 'ai.signIn';
  if (status === 403 || data?.error === 'course_access_required') return 'ai.access';
  if (status === 429 || data?.error === 'limit_reached') return 'ai.limit';
  if (status === 503) return 'ai.unavailable';
  if (data?.evaluation_failed) return 'ai.failed';
  if (status === 0) return 'ai.offline';
  return 'ai.unavailable';
}

async function post(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn('[course-v2] request failed:', url, err?.message);
    return { ok: false, status: 0, data: null, errorKey: 'ai.offline' };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.evaluation_failed) {
    return { ok: false, status: res.status, data, errorKey: refusalKey(res.status, data) };
  }
  return { ok: true, status: res.status, data, errorKey: null };
}

/** Grade a written Aufgabe or a written micro-output by its bank key. */
export function evaluateWriting({ bankKey, text }) {
  return post('/.netlify/functions/evaluate-writing', { taskKey: bankKey, text });
}

/** Start a speaking session for a SpeakingTask or a spoken micro-output by its bank key. */
export function startSpeakingSession({ bankKey, minutes = 10 }) {
  return post('/api/speaking/speaking-session', { action: 'start', courseTaskKey: bankKey, minutes });
}
