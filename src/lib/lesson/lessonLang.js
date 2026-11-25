import { useCallback, useSyncExternalStore } from 'react';
import { safeGet, safeSet } from '../../utils/safeStorage.js';

export const LESSON_LANG_KEY = 'dm_lesson_lang';
export const DEFAULT_LESSON_LANG = 'en';
export const LESSON_LANGS = ['en', 'de'];

/** 'en' or 'de'; anything else (a stale or tampered flag) is the default. */
export const normalizeLessonLang = (value) => (LESSON_LANGS.includes(value) ? value : DEFAULT_LESSON_LANG);

// ── the persisted flag, shared by every screen that mounts the hook ──────────
//
// A module-level store rather than a context provider: the player, the
// checkpoint and the review page are three separate routes, none wrapped by a
// common course provider, and the toggle in one header must be reflected in
// every stage component below it on the next render. useSyncExternalStore is
// the React 18 way to subscribe to exactly that.

const listeners = new Set();
let current = null; // null = not read yet

/** `?lang=de` / `?lang=en` on the URL wins once and is persisted from then on. */
function fromQuery() {
  try {
    const v = new URLSearchParams(window.location.search).get('lang');
    return LESSON_LANGS.includes(v) ? v : null;
  } catch {
    return null;
  }
}

export function readLessonLang() {
  if (current !== null) return current;
  if (typeof window === 'undefined') return DEFAULT_LESSON_LANG;
  const q = fromQuery();
  if (q) {
    safeSet(LESSON_LANG_KEY, q);
    current = q;
  } else {
    current = normalizeLessonLang(safeGet(LESSON_LANG_KEY));
  }
  return current;
}

export function writeLessonLang(next) {
  const lang = normalizeLessonLang(next);
  current = lang;
  safeSet(LESSON_LANG_KEY, lang);
  listeners.forEach((fn) => fn());
  return lang;
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const getServerSnapshot = () => DEFAULT_LESSON_LANG;

/**
 * [lang, setLang] — the chrome language of the lesson screens, persisted in
 * `dm_lesson_lang` through safeStorage (a blocked localStorage means "English
 * this session", never a crash). Default English (docs/language-strategy.md).
 */
export function useLessonLang() {
  const lang = useSyncExternalStore(subscribe, readLessonLang, getServerSnapshot);
  const setLang = useCallback((next) => writeLessonLang(next), []);
  return [lang, setLang];
}
