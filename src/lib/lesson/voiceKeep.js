// The learner's first and latest recording of a Lektion, for the end screen (founder, 2026-11-18:
// "Yes, phone only"). Kept ONLY in this browser's localStorage, never sent anywhere by this file:
// score-readaloud receives each take to transcribe it and stores only right/wrong. Signed-in owners
// only (only they record), one key per owner and Lektion, so a shared browser's next account never
// hears them. A take older than RUN_MAX_AGE_MS is not shown, and sweepVoices() deletes it on the
// next app load.
// ponytail: localStorage holds the takes as data URLs (two 8-second clips, a few hundred KB at most);
// a refused write just means no recording on the end screen. Move to IndexedDB if quota bites.
import { safeGetJSON, safeRemove, safeSetJSON } from '../../utils/safeStorage.js';
import { RUN_MAX_AGE_MS } from './runState.js';

export const VOICE_KEY_PREFIX = 'dm_lesson_voice:';
export const voiceKey = (lektionId, owner) => `${VOICE_KEY_PREFIX}${lektionId}:${owner}`;

const fresh = (take, now) => (take && typeof take.src === 'string' && take.src.startsWith('data:audio/')
  && Number.isFinite(take.at) && now - take.at <= RUN_MAX_AGE_MS && take.at - now <= 60 * 1000 ? take : null);

/** { first, latest } for this owner and Lektion; latest is null until a second take. */
export function readVoices(lektionId, owner, now = Date.now()) {
  if (!owner || !lektionId) return { first: null, latest: null };
  const raw = safeGetJSON(voiceKey(lektionId, owner), null) || {};
  const first = fresh(raw.first, now);
  return { first, latest: first ? fresh(raw.latest, now) : null };
}

/** Keep one take: the first one stays until it expires, every later one replaces the latest. */
export function keepTake(lektionId, owner, { text = '', src = '' } = {}, now = Date.now()) {
  if (!owner || !lektionId || !String(src).startsWith('data:audio/')) return false;
  const take = { at: now, text: String(text).slice(0, 200), src };
  const { first } = readVoices(lektionId, owner, now);
  return safeSetJSON(voiceKey(lektionId, owner), first ? { first, latest: take } : { first: take, latest: null });
}

export const clearVoices = (lektionId, owner) => Boolean(owner && lektionId) && safeRemove(voiceKey(lektionId, owner));

/** Delete every kept take whose first recording is past its 7 days (run on app load). */
export function sweepVoices(now = Date.now(), store = (() => { try { return window.localStorage; } catch { return null; } })()) {
  if (!store) return;
  try {
    const keys = Array.from({ length: store.length }, (_, i) => store.key(i)).filter((k) => k?.startsWith(VOICE_KEY_PREFIX));
    for (const key of keys) {
      let raw = null;
      try { raw = JSON.parse(store.getItem(key)); } catch { /* malformed: delete */ }
      if (!fresh(raw?.first, now)) store.removeItem(key);
    }
  } catch { /* storage blocked: nothing kept to delete */ }
}
