// Feature flags for the speaking rebuild's controlled rollout (spec §11.3).
// Both default OFF and fail closed: an unset variable is `false`.
//
//   SPEAKING_LIVE_BETA_ENABLED — the WebRTC live conversation mode. Off means
//     live starts are refused server-side (503) before any reservation.
//   AI_COACH_PUBLIC_ENABLED — the public AI Coach subscription offer. Stays
//     off until Plans 2–4 pass their full gates (plan index, delivery gate
//     rule 5). Nothing may read a truthy default for it anywhere.

const isOn = (value) => String(value || '').toLowerCase() === 'true';

export function liveBetaEnabled() {
  return isOn(process.env.SPEAKING_LIVE_BETA_ENABLED);
}

export function aiCoachPublicEnabled() {
  return isOn(process.env.AI_COACH_PUBLIC_ENABLED);
}
