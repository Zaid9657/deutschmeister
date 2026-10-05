// The LEARNING-SUPPORT layer of the interface locale (docs/arabic/README.md §4).
//
// Three layers, three homes:
//   1. interface  — button labels, eyebrows, errors: src/lib/lesson/strings.js
//                   and i18next (src/utils/i18n.js, src/locales/<lang>/);
//   2. learning support — meanings, explanations, instructions, hints that are
//                   attached to ONE piece of course content: this module;
//   3. public content — the Astro pages: astro-site/src/data/i18n/.
//
// The German source stays where it is (src/data/curricula/*, the pools) and is
// shared by every locale. English and German support text already sits on the
// source records (`en`, `bodyEn`, `questionEn`, `explanationEn` …); a further
// locale is a SIDECAR keyed by stable ids — word ids, dialogue-line ids, item
// ids, Lektion ids — never by array position or by display text. Each sidecar
// entry records a hash of the exact source it translates (`src`) and a status
// (`draft` until a named human reviewer signs it off); scripts/i18n-coverage.mjs
// reports missing / draft / reviewed / stale, and tests/arabic-coverage.test.mjs
// fails the build when the pilot scope has a missing or stale entry.
//
// Fallback policy: a key with no entry in the learner's locale returns the
// English (else German) source text with `fallback: true`, and <SupportText>
// renders it marked as English — `lang="en"` plus a visible „(بالإنجليزية)" —
// so an Arabic screen never silently mixes in an English instruction.
import { useSyncExternalStore } from 'react';

/** Locales whose support text lives in a sidecar (not on the source records). */
export const SIDECAR_LOCALES = ['ar'];

const registry = new Map(); // `${locale}:${level}` → Map(key → text)
const listeners = new Set();
let version = 0;

const LOADERS = {
  'ar:a1.1': () => import('../../data/curricula/a11.ar.js'),
};

/** Register a sidecar `{ entries: { key: { ar, src, status } } }` for (locale, level). */
export function registerSupport(locale, level, data) {
  const map = new Map();
  const entries = (data && data.entries) || {};
  for (const [key, entry] of Object.entries(entries)) {
    const text = entry && entry[locale];
    if (typeof text === 'string' && text.trim()) map.set(key, text);
  }
  registry.set(`${locale}:${String(level).toLowerCase()}`, map);
  version += 1;
  listeners.forEach((fn) => fn());
}

/** True when the (locale, level) sidecar is registered (or none is needed). */
export const supportLoaded = (locale, level) =>
  !SIDECAR_LOCALES.includes(locale) || registry.has(`${locale}:${String(level).toLowerCase()}`);

/** True when (locale, level) has a sidecar at all — false means "no support in that language yet". */
export const supportExists = (locale, level) =>
  !SIDECAR_LOCALES.includes(locale) || Boolean(LOADERS[`${locale}:${String(level).toLowerCase()}`]);

/**
 * Load the sidecar for (level, locale) once. Resolves true when there is
 * nothing to load or it registered; false when the level has no sidecar in
 * that locale (every key then falls back, marked) or the chunk failed.
 */
export function loadSupport(level, locale) {
  const lvl = String(level || '').toLowerCase();
  if (supportLoaded(locale, lvl)) return Promise.resolve(true);
  const load = LOADERS[`${locale}:${lvl}`];
  if (!load) return Promise.resolve(false);
  return load()
    .then((mod) => {
      registerSupport(locale, lvl, mod.default || mod);
      return true;
    })
    .catch((err) => {
      console.error(`[support] ${locale}/${lvl} failed to load:`, err);
      return false;
    });
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** Re-render when a sidecar registers (the value is a version counter). */
export function useSupportVersion() {
  return useSyncExternalStore(subscribe, () => version, () => 0);
}

function lookup(locale, level, key) {
  const map = registry.get(`${locale}:${String(level || '').toLowerCase()}`);
  return map ? map.get(key) : undefined;
}

/**
 * supportText(locale, level, key, { en, de }) → { text, lang, fallback }
 *
 *   'en' → the English source (German when a record has no English);
 *   'de' → the German source (English when there is none);
 *   'ar' → the sidecar entry; otherwise the English source, `fallback: true`.
 */
export function supportText(locale, level, key, { en = null, de = null } = {}) {
  const has = (v) => typeof v === 'string' && v.trim().length > 0;
  if (locale === 'de') {
    if (has(de)) return { text: de, lang: 'de', fallback: false };
    return { text: has(en) ? en : '', lang: 'en', fallback: false };
  }
  if (SIDECAR_LOCALES.includes(locale) && key) {
    const v = lookup(locale, level, key);
    if (has(v)) return { text: v, lang: locale, fallback: false };
    if (has(en)) return { text: en, lang: 'en', fallback: true };
    return { text: has(de) ? de : '', lang: 'de', fallback: true };
  }
  if (has(en)) return { text: en, lang: 'en', fallback: false };
  return { text: has(de) ? de : '', lang: 'de', fallback: false };
}

/** Same, but the sidecar text only (null when absent) — for match tiles and ambiguity checks. */
export const sidecarText = (locale, level, key) => {
  const v = lookup(locale, level, key);
  return typeof v === 'string' && v.trim() ? v : null;
};

// ── stable keys ─────────────────────────────────────────────────────────────
// One builder per kind of content, shared by the components, the coverage
// script and the tests, so a key is spelled in exactly one place.
export const supportKeys = {
  lektionTitle: (lektionId) => `lektion.${lektionId}.title`,
  situation: (lektionId) => `lektion.${lektionId}.situation`,
  canDo: (lektionId, n) => `lektion.${lektionId}.canDo.${n}`,
  dialogTitle: (lektionId) => `lektion.${lektionId}.dialog.title`,
  dialogSetting: (lektionId) => `lektion.${lektionId}.dialog.setting`,
  dialogLine: (lineId) => `dialog.${lineId}`,
  word: (wordId) => `word.${wordId}`,
  noticeTitle: (lektionId) => `notice.${lektionId}.title`,
  noticeBody: (lektionId) => `notice.${lektionId}.body`,
  pretest: (lektionId) => `pretest.${lektionId}.prompt`,
  phonetikFocus: (lektionId) => `phonetik.${lektionId}.focus`,
  speakingPrompt: (lektionId) => `sprechen.${lektionId}.prompt`,
  writingTask: (lektionId) => `schreiben.${lektionId}.task`,
  writingField: (lektionId, n) => `schreiben.${lektionId}.field.${n}`,
  writingPoint: (lektionId, n) => `schreiben.${lektionId}.leitpunkt.${n}`,
  itemQuestion: (itemId) => `item.${itemId}.question`,
  itemExplanation: (itemId) => `item.${itemId}.explanation`,
  itemHint: (itemId) => `item.${itemId}.hint`,
  introSituation: (lektionId) => `intro.${lektionId}.situation`,
  introCanDo: (lektionId, n) => `intro.${lektionId}.canDo.${n}`,
  character: (name) => `character.${name}`,
  chapterTitle: (n) => `chapter.${n}.title`,
  chapterStory: (n) => `chapter.${n}.story`,
  courseAbout: () => 'course.about',
  howStepLabel: (key) => `course.howStep.${key}.label`,
  howStepDescription: (key) => `course.howStep.${key}.description`,
  outcome: (n) => `course.outcome.${n}`,
};

/** `{name}` placeholders in a support text (figures are derived, never typed into a translation). */
export const fillVars = (text, vars = {}) =>
  String(text || '').replace(/\{(\w+)\}/g, (m, name) => (vars[name] === undefined || vars[name] === null ? m : String(vars[name])));

/** Which Lektionen of a level carry support in a sidecar locale (the pilot scope). */
export const SUPPORT_SCOPE = {
  'ar:a1.1': ['a1.1-l01', 'a1.1-l02', 'a1.1-l03'],
};

/** True when this Lektion is inside the translated scope for `locale`. */
export const lektionHasSupport = (locale, level, lektionId) => {
  if (!SIDECAR_LOCALES.includes(locale)) return true;
  const scope = SUPPORT_SCOPE[`${locale}:${String(level || '').toLowerCase()}`] || [];
  return scope.includes(lektionId);
};

/** 'a1.1-l03' → 'a1.1' (the level a Lektion id belongs to), or null. */
export const levelOfLektion = (lektionId) => {
  const m = /^([a-c]\d\.\d)-l\d+$/i.exec(String(lektionId || ''));
  return m ? m[1].toLowerCase() : null;
};
