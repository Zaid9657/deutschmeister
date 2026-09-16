// Client mirror of the server's SPEAKING_LIVE_BETA_ENABLED flag
// (netlify/functions/_shared/speakingFlags.mjs).
//
// The SERVER is the gate — realtime-client-secret.mjs returns 503 when live
// is off, so nothing here can open a session that the server refuses. This
// exists only so the UI does not offer a door it knows is locked. Defaults
// OFF, same as the server, and only the exact string 'true' enables it.
export function liveBetaEnabledClient() {
  try {
    return import.meta.env?.VITE_SPEAKING_LIVE_BETA === 'true';
  } catch {
    return false;
  }
}
