// Signed, stateless task-state for guided missions — the privacy/integrity
// hinge of the City Map (plan Tasks 3+5, speaking-guided-city-map):
//
//   * transcripts are NOT persisted on the guided path, so the server cannot
//     re-derive what happened from a table;
//   * the browser is NOT trusted to say which criteria are complete;
//   * so every turn's outcome travels as an HMAC-signed token the browser
//     holds and returns — it can drop it (progress lost, its own loss) but
//     cannot forge or edit it.
//
// Two token kinds share the mechanics:
//   task-state token   — {sessionToken, missionOrder, completedCriteria, turn}
//   mission result     — {userId, missionOrder, passed, sessionToken} — what
//                        the Abschlusstest handoff verifies server-side.
//
// Secret: SPEAKING_STATE_SECRET (functions scope). Fails closed like
// CAMPAIGN_SECRET — without it, structured guided turns refuse to run.
import crypto from 'node:crypto';

const TASK_STATE_TTL_MS = 45 * 60 * 1000;
const RESULT_TTL_MS = 30 * 60 * 1000;

export function stateSecret() {
  return process.env.SPEAKING_STATE_SECRET || '';
}

const sign = (payload, secret) => crypto.createHmac('sha256', secret).update(payload).digest('base64url');

function encode(obj, secret, ttlMs) {
  const body = Buffer.from(JSON.stringify({ ...obj, exp: Date.now() + ttlMs }), 'utf8').toString('base64url');
  return `${body}.${sign(body, secret)}`;
}

function decode(token, secret) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const expected = sign(body, secret);
  const a = Buffer.from(mac || '', 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!obj.exp || Date.now() > obj.exp) return null;
    return obj;
  } catch {
    return null;
  }
}

export function signTaskState({ sessionToken, missionOrder, completedCriteria, turn }, secret) {
  return encode({
    kind: 'task-state',
    sessionToken,
    missionOrder,
    completedCriteria: [...new Set(completedCriteria || [])].slice(0, 20),
    turn: Number(turn) || 0,
  }, secret, TASK_STATE_TTL_MS);
}

/** Returns the state or null; the caller must also match sessionToken. */
export function verifyTaskState(token, { sessionToken, secret }) {
  const obj = decode(token, secret);
  if (!obj || obj.kind !== 'task-state' || obj.sessionToken !== sessionToken) return null;
  return { completedCriteria: obj.completedCriteria || [], turn: obj.turn || 0, missionOrder: obj.missionOrder };
}

export function signMissionResult({ userId, missionOrder, passed, sessionToken }, secret) {
  return encode({ kind: 'mission-result', userId, missionOrder, passed: passed === true, sessionToken }, secret, RESULT_TTL_MS);
}

export function verifyMissionResult(token, { userId, secret }) {
  const obj = decode(token, secret);
  if (!obj || obj.kind !== 'mission-result' || obj.userId !== userId) return null;
  return { missionOrder: obj.missionOrder, passed: obj.passed === true, sessionToken: obj.sessionToken };
}
