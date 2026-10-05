// The ONE interface locale of the product (docs/arabic/README.md §3).
//
// Before this module the app had two stores that could disagree: the i18next
// chrome language (`dm_lang`, src/utils/i18n.js) and the lesson player's chrome
// language (`dm_lesson_lang`, src/lib/lesson/strings.js). Arabic made a third
// unthinkable, so both now read this one value and are kept written in sync
// for older bundles and for the Astro shell that still reads `dm_lang`.
//
// The INTERFACE locale is the language of the chrome, the instructions and the
// explanations. It is never the LEARNING language — the dialogues, questions
// and answers are German in every locale, because that is what is learned.
//
// Precedence (pure, pinned by tests/locale.test.mjs):
//   1. a validated `?lang=` on the incoming link — an explicit choice, persisted;
//   2. the choice saved on this device (`dm_locale`, with the moment it was made);
//      legacy: `dm_lesson_lang` (only ever written by an explicit toggle), then
//      `dm_lang` when it says 'de' ('en' was written on every page load and
//      proves nothing);
//   3. the account's `user_metadata.ui_lang` — only fills a device with no
//      explicit choice; when both exist the NEWER explicit choice wins, so an old
//      account value never silently overrides a choice made a minute ago;
//   4. the default (English). A browser that asks for Arabic gets a dismissible
//      suggestion, never an automatic switch, and never anything IP-based.
//
// Supported values are a whitelist; anything else is ignored at every step.
import { useCallback, useSyncExternalStore } from 'react';
import { safeGet, safeSet } from '../utils/safeStorage.js';

export const SUPPORTED_LOCALES = ['en', 'de', 'ar'];
export const DEFAULT_LOCALE = 'en';
/** Display order and labels of the switcher: each language named in itself, no flags. */
export const LOCALE_SWITCH_ORDER = ['ar', 'en', 'de'];
export const LOCALE_NAMES = { ar: 'العربية', en: 'English', de: 'Deutsch' };

export const LOCALE_KEY = 'dm_locale';
export const LEGACY_LESSON_KEY = 'dm_lesson_lang';
export const LEGACY_APP_KEY = 'dm_lang';
export const SUGGESTION_DISMISSED_KEY = 'dm_locale_suggestion_dismissed';

export const isSupportedLocale = (value) => SUPPORTED_LOCALES.includes(value);
export const normalizeLocale = (value) => (isSupportedLocale(value) ? value : DEFAULT_LOCALE);
export const dirFor = (locale) => (locale === 'ar' ? 'rtl' : 'ltr');

/**
 * Routes whose screens are fully translated into Arabic for the pilot (A1.1
 * Lessons 1–3 and the account journey around them). Every other route shown
 * to an Arabic-locale visitor renders in English, left-to-right, under an
 * Arabic notice that says so — never a silent mix (LocaleFallbackNotice.jsx).
 * index.html's first-paint script carries the same pattern (test-pinned).
 */
export const AR_READY_PATTERN = /^\/(course\/a1\.1(\/(l\/\d+|review|checkpoint\/\d+))?|login|signup|reset-password|update-password|verify-email)\/?$/;

export const isArabicReadyRoute = (pathname) => AR_READY_PATTERN.test(String(pathname || '').split(/[?#]/)[0]);

/** The locale a route actually renders in: Arabic only where Arabic exists. */
export const effectiveLocale = (locale, pathname) => (locale === 'ar' && !isArabicReadyRoute(pathname) ? 'en' : normalizeLocale(locale));

/** `?lang=` from a query string, or null. Only whitelisted values count. */
export function parseQueryLocale(search) {
  try {
    const v = new URLSearchParams(String(search || '')).get('lang');
    return isSupportedLocale(v) ? v : null;
  } catch {
    return null;
  }
}

/** A stored choice `{ lang, at, source }`, or null. Tolerates a hand-edited blob. */
export function parseStoredChoice(raw) {
  if (!raw) return null;
  try {
    const v = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!v || !isSupportedLocale(v.lang)) return null;
    const at = Number(v.at);
    return { lang: v.lang, at: Number.isFinite(at) && at > 0 ? at : 0, source: v.source === 'account' ? 'account' : 'explicit' };
  } catch {
    // A bare 'ar' written by hand or an older build.
    return isSupportedLocale(raw) ? { lang: raw, at: 0, source: 'explicit' } : null;
  }
}

/** The account preference from Supabase user_metadata, or null. */
export function accountChoice(userMetadata) {
  const lang = userMetadata && userMetadata.ui_lang;
  if (!isSupportedLocale(lang)) return null;
  const at = Number(userMetadata.ui_lang_at);
  return { lang, at: Number.isFinite(at) && at > 0 ? at : 0, source: 'account' };
}

/** The legacy flags, read as a choice with no timestamp (older than any real one). */
export function legacyChoice({ lesson, app } = {}) {
  if (isSupportedLocale(lesson)) return { lang: lesson, at: 0, source: 'explicit' };
  if (app === 'de') return { lang: 'de', at: 0, source: 'explicit' };
  return null;
}

/** True when the browser asks for Arabic (used only to OFFER a switch). */
export const browserPrefersArabic = (languages) =>
  (Array.isArray(languages) ? languages : []).some((l) => /^ar\b/i.test(String(l || '')));

/**
 * resolveLocale({ query, stored, legacy, account, browserLanguages, now })
 *   → { locale, source, write, suggest }
 *
 * `write` is the choice to persist on this device (or null); `suggest` is true
 * when an Arabic-asking browser has made no choice yet.
 */
export function resolveLocale({ query = null, stored = null, legacy = null, account = null, browserLanguages = [], now = Date.now() } = {}) {
  if (isSupportedLocale(query)) {
    return { locale: query, source: 'query', write: { lang: query, at: now, source: 'explicit' }, suggest: false };
  }
  const local = stored || legacyChoice(legacy || {});
  if (local && account && account.lang !== local.lang && account.at > local.at) {
    return { locale: account.lang, source: 'account', write: { ...account }, suggest: false };
  }
  if (local) return { locale: local.lang, source: stored ? 'stored' : 'legacy', write: stored ? null : local, suggest: false };
  if (account) return { locale: account.lang, source: 'account', write: { ...account }, suggest: false };
  return { locale: DEFAULT_LOCALE, source: 'default', write: null, suggest: browserPrefersArabic(browserLanguages) };
}

/**
 * reconcileAccount(local, account) → 'pull' | 'push' | 'none'
 * after sign-in: pull the account's choice when it is newer (or the device has
 * none), push this device's explicit choice when the account is older or empty.
 */
export function reconcileAccount(local, account) {
  if (!local && !account) return 'none';
  if (!local) return 'pull';
  if (local.source !== 'explicit' && !account) return 'none';
  if (!account) return 'push';
  if (account.lang === local.lang) return 'none';
  return account.at > local.at ? 'pull' : 'push';
}

// ── the browser store ───────────────────────────────────────────────────────

const listeners = new Set();
let current = null; // null = not resolved yet
let lastResolution = null;

function readDeviceChoice() {
  return parseStoredChoice(safeGet(LOCALE_KEY));
}

function persist(choice) {
  safeSet(LOCALE_KEY, JSON.stringify(choice));
  // Older bundles and the Astro shell read these two.
  safeSet(LEGACY_LESSON_KEY, choice.lang);
  safeSet(LEGACY_APP_KEY, choice.lang);
}

/** Resolve once per page load (query → stored → legacy → default). */
export function getLocale() {
  if (current !== null) return current;
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const r = resolveLocale({
    query: parseQueryLocale(window.location.search),
    stored: readDeviceChoice(),
    legacy: { lesson: safeGet(LEGACY_LESSON_KEY), app: safeGet(LEGACY_APP_KEY) },
    browserLanguages: typeof navigator !== 'undefined' ? navigator.languages : [],
  });
  if (r.write) persist(r.write);
  lastResolution = r;
  current = r.locale;
  return current;
}

/** How the current locale was decided (for the suggestion banner and analytics). */
export const getLocaleResolution = () => {
  getLocale();
  return lastResolution;
};

/** The choice saved on this device, if any. */
export const getDeviceChoice = () => readDeviceChoice();

/**
 * Change the interface locale. An explicit change is persisted with its time;
 * every subscriber (the lesson chrome, i18next, the shell) re-renders, and a
 * `dm-locale-changed` event lets non-React code follow.
 */
export function setLocale(next, { source = 'explicit', at = Date.now(), surface = null } = {}) {
  if (!isSupportedLocale(next)) return getLocale();
  const prev = getLocale();
  const choice = { lang: next, at, source };
  persist(choice);
  current = next;
  listeners.forEach((fn) => fn());
  if (typeof window !== 'undefined' && prev !== next) {
    try {
      window.dispatchEvent(new CustomEvent('dm-locale-changed', { detail: { from: prev, to: next, source, surface } }));
    } catch { /* old browsers: the store still changed */ }
  }
  return next;
}

/** For tests: forget the resolved value so the next read resolves again. */
export function resetLocaleForTests(value = null) {
  current = value;
  lastResolution = null;
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const getServerSnapshot = () => DEFAULT_LOCALE;

/** [locale, setLocale] — the persisted interface locale ('en' | 'de' | 'ar'). */
export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getLocale, getServerSnapshot);
  const set = useCallback((next, opts) => setLocale(next, opts), []);
  return [locale, set];
}

/** `<html lang dir>` for the locale a route renders in. */
export function applyDocumentLocale(locale) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  const lang = normalizeLocale(locale);
  if (el.getAttribute('lang') !== lang) el.setAttribute('lang', lang);
  const dir = dirFor(lang);
  if (el.getAttribute('dir') !== dir) el.setAttribute('dir', dir);
}

/**
 * Number formatting for the chrome. Arabic keeps Latin digits (ar-u-nu-latn):
 * the learner is learning to read German numbers, and the prices, times and
 * counts they meet in the course are written that way.
 */
export const intlLocaleFor = (locale) => (locale === 'ar' ? 'ar-u-nu-latn' : locale === 'de' ? 'de-DE' : 'en-GB');
