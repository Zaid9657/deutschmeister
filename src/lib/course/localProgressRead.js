// Read-only half of guest course progress. Kept separate from localProgress.js
// so route access checks do not pull the write/merge service graph into every
// checkpoint bundle.
import { safeGetJSON } from '../../utils/safeStorage.js';

export const LOCAL_KEY = 'dm_course_local';

export const emptyLocalProgress = (level = null) => ({ level, lektionen: {}, attempts: [] });

/** The stored progress, shape-checked so a hand-edited blob cannot crash navigation. */
export function readLocalProgress() {
  const raw = safeGetJSON(LOCAL_KEY, null);
  if (!raw || typeof raw !== 'object') return emptyLocalProgress();
  return {
    level: typeof raw.level === 'string' ? raw.level : null,
    lektionen: raw.lektionen && typeof raw.lektionen === 'object' ? raw.lektionen : {},
    attempts: Array.isArray(raw.attempts) ? raw.attempts : [],
  };
}

/** Lektion ids finished locally for `level` — what navigation treats as done. */
export function localDoneIds(level) {
  const store = readLocalProgress();
  const lvl = String(level || '').toLowerCase();
  if (!store.level || store.level !== lvl) return new Set();
  return new Set(Object.keys(store.lektionen).filter((id) => store.lektionen[id]?.status));
}

export const hasLocalProgress = (level) => localDoneIds(level).size > 0;
