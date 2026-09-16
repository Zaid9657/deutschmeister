// The contract between the guided speaking missions and every surface that
// consumes a mission result (today: the A1.1 Abschlusstest runner; Plan 3's
// City Conversation Map writes it). Pure and framework-free.
//
// Result shape (written by the mission flow, validated on read):
//   { passed, task, language, pronunciation, sessionToken, completedAt }
// passed is the only field a consumer may gate on; task/language/
// pronunciation stay separate signals and are never merged into one score.
//
// Storage: sessionStorage first (a mission completed in this tab), falling
// back to localStorage (completed in another tab of the same browser). The
// client copy is a CONVENIENCE for the handoff back into the runner — the
// server-side speaking session remains the authoritative record; a consumer
// that needs authority must verify the sessionToken server-side.

const key = (level, missionOrder) =>
  `dm_mission_result:${String(level || '').toLowerCase()}:${Number(missionOrder)}`;

/** The handoff URL the runner sends the learner to — pinned by tests/exams.test.mjs. */
export function missionHandoffUrl({ level, missionOrder, returnTo }) {
  const params = new URLSearchParams({
    level: String(level),
    mission: String(missionOrder),
    return: String(returnTo),
  });
  return `/speaking?${params.toString()}`;
}

/**
 * Whether the guided missions exist as a live surface.
 *
 * The City Map UI ships, but a mission is only real once
 * `migrations/2026-09-17-a11-speaking-route.sql` is APPLIED — before that the
 * live table holds 8 non-sequential A1.1 rows and mission 12 (the
 * Abschlusstest's handoff) does not exist. So this is owner-flipped with the
 * migration, via a build-time flag, and defaults OFF: until then the
 * Abschlusstest records its speaking floor as `required: false` rather than
 * deadlocking learners behind a trainer that is not there.
 */
export function speakingMissionsAvailable() {
  try {
    return import.meta.env?.VITE_SPEAKING_MISSIONS_LIVE === 'true';
  } catch {
    return false;
  }
}

function storageRead(storage, k) {
  try {
    const raw = storage?.getItem(k);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function validate(result) {
  if (!result || typeof result !== 'object') return null;
  if (typeof result.passed !== 'boolean') return null;
  return result;
}

/** Read (and validate) a stored mission result, or null. */
export function readMissionResult(level, missionOrder) {
  const k = key(level, missionOrder);
  if (typeof window === 'undefined') return null;
  return (
    validate(storageRead(window.sessionStorage, k)) ||
    validate(storageRead(window.localStorage, k))
  );
}

/** Written by the mission flow after a completed mission. */
export function writeMissionResult(level, missionOrder, result) {
  const validated = validate(result);
  if (!validated || typeof window === 'undefined') return;
  const raw = JSON.stringify({ ...validated, completedAt: validated.completedAt || new Date().toISOString() });
  try { window.sessionStorage.setItem(key(level, missionOrder), raw); } catch { /* storage may be unavailable */ }
  try { window.localStorage.setItem(key(level, missionOrder), raw); } catch { /* storage may be unavailable */ }
}
