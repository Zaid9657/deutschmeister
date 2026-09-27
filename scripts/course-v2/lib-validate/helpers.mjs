// Shared helpers for the course-v2 rules: findings, item classes, level defaults.

import { bandOfLevel } from './ids.mjs';
import { levelProfile } from './context.mjs';
import { norm } from './text.mjs';

export const arr = (x) => (Array.isArray(x) ? x : []);
export const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

/** A finding. severity: blocker (hard rule) · ratchet · advisory. */
export function finding(severity, doc, path, message, id = null) {
  return { severity, file: doc?.file ?? null, path: path ?? null, id: id ?? null, message };
}
export const blocker = (doc, path, message, id) => finding('blocker', doc, path, message, id);
export const advisory = (doc, path, message, id) => finding('advisory', doc, path, message, id);
export const ratchet = (doc, path, message, id) => finding('ratchet', doc, path, message, id);

/** Item types by what the learner does (BLUEPRINT §3.4). */
export const CHOICE_TYPES = new Set(['multiple_choice', 'abc', 'richtig_falsch', 'ja_nein', 'listen_select', 'match', 'zuordnen']);
export const TYPED_TYPES = new Set(['fill_blank', 'dictation', 'cloze', 'notes', 'form_fill']);
export const TWO_OPTION_TYPES = new Set(['richtig_falsch', 'ja_nein', 'listen_select']);
export const THREE_OPTION_TYPES = new Set(['multiple_choice', 'abc']);

/** Options count an item type must carry (ITM-02), or null when the type has none. */
export function expectedOptions(type) {
  if (THREE_OPTION_TYPES.has(type)) return 3;
  if (TWO_OPTION_TYPES.has(type)) return 2;
  return null;
}

/** The index of the key among the options (normalised), or -1. */
export function keyIndex(item) {
  const opts = arr(item?.options).map(norm);
  return opts.indexOf(norm(item?.answer));
}

/**
 * The item in the live `lessonPools` shape (SCHEMA §3.1, what the compiler emits), so the
 * `quality.js` predicates can read it unchanged.
 */
export function compiledItem(item) {
  const promptDe = String(item?.promptDe ?? '');
  const questionDe = item?.type === 'sentence_building' && arr(item.tiles).length
    ? `${promptDe.replace(/\.$/, ':')} [${item.tiles.join(' / ')}]`
    : promptDe;
  return {
    id: item?.id,
    topic: item?.topic,
    type: item?.type,
    questionDe,
    questionEn: item?.promptEn ?? '',
    options: Array.isArray(item?.options) ? item.options : null,
    answer: item?.answer,
    accepted: arr(item?.accepted),
    caseSensitive: Boolean(item?.caseSensitive),
    explanationDe: item?.explanation?.de ?? '',
    explanationEn: item?.explanation?.en ?? '',
    hint: item?.hint ?? null,
  };
}

/** BLUEPRINT §3.4 / §2.6 defaults per band, used when level-profiles.json lacks the level. */
const BAND_DEFAULTS = {
  a1: { typed: [0.45, 0.55], sbMin: 0.25, ecMax: 0.10, choiceMax: 0.20, generatedMax: 0.40, newPerUnit: [26, 29], productiveShare: 0.5, offListMax: 0.15, dialogLines: [8, 14], coverageMin: 0.95 },
  a2: { typed: [0.45, 0.55], sbMin: 0.20, ecMax: 0.12, choiceMax: 0.20, generatedMax: 0.40, newPerUnit: [28, 30], productiveShare: 0.5, offListMax: 0.15, dialogLines: [8, 14], coverageMin: 0.95 },
  b1: { typed: [0.40, 0.50], sbMin: 0.15, ecMax: 0.15, choiceMax: 0.20, generatedMax: 0.30, newPerUnit: [43, 48], productiveShare: 0.45, offListMax: 0.25, dialogLines: null, coverageMin: 0.95 },
  b2: { typed: [0.40, 0.50], sbMin: 0.10, ecMax: 0.15, choiceMax: 0.25, generatedMax: 0.25, newPerUnit: [60, 70], productiveShare: 0.375, offListMax: null, dialogLines: null, coverageMin: 0.95 },
};

/**
 * The numbers a rule needs for a level: from level-profiles.json when present, BLUEPRINT defaults
 * otherwise. `source` says which, so a rule can print it.
 */
export function levelNumbers(ctx, level) {
  const band = bandOfLevel(level);
  const d = BAND_DEFAULTS[band] || BAND_DEFAULTS.a2;
  const p = levelProfile(ctx, level);
  const mix = p?.pool?.mix || {};
  const out = {
    source: p ? 'level-profiles.json' : 'BLUEPRINT §2.6/§3.4 defaults (level profile missing)',
    skeleton: p?.skeleton || (band.startsWith('a') ? 'A' : 'B'),
    poolSize: p?.pool?.size || 16,
    served: p?.pool?.served || 12,
    generatedMax: typeof p?.pool?.generatedMax === 'number' ? p.pool.generatedMax : d.generatedMax,
    typed: Array.isArray(mix.typedGapDictation) ? mix.typedGapDictation : d.typed,
    sbMin: typeof mix.sentenceBuildingMin === 'number' ? mix.sentenceBuildingMin : d.sbMin,
    ecMax: typeof mix.errorCorrectionMax === 'number' ? mix.errorCorrectionMax : d.ecMax,
    choiceMax: typeof mix.choiceMax === 'number' ? mix.choiceMax : d.choiceMax,
    newPerUnit: Array.isArray(p?.lexis?.newPerUnit) ? p.lexis.newPerUnit : d.newPerUnit,
    productiveShare: typeof p?.lexis?.productiveShare === 'number' ? p.lexis.productiveShare : d.productiveShare,
    offListMax: typeof p?.lexis?.offListMax === 'number' ? p.lexis.offListMax : d.offListMax,
    coverageMin: typeof p?.lexis?.coverageMin === 'number' ? p.lexis.coverageMin : d.coverageMin,
    dialogLines: level === 'a1.1' ? [6, 10] : d.dialogLines,
    ruleCardMaxWords: p?.ruleCardMaxWords || (band === 'a1' ? 60 : 80),
    sentence: p?.sentence || null,
    microOutput: p?.microOutput || null,
  };
  return out;
}

/** Docs of the target that are units. */
export const unitDocs = (docs) => docs.filter((d) => d.kind === 'unit');

/** Pretty list for messages. */
export const list = (xs, max = 8) => {
  const a = [...xs];
  return a.length > max ? `${a.slice(0, max).join(', ')} … (+${a.length - max})` : a.join(', ');
};

/** Round to 2 decimals for messages. */
export const pct = (x) => `${Math.round(x * 1000) / 10} %`;
