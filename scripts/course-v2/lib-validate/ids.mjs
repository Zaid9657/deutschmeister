// Identifier patterns for the validator (SCHEMA §2).
//
// The one place an id pattern is WRITTEN is `scripts/course-v2/lib/ids.mjs` (E0-1). This module
// imports it at run time and only falls back to the transcription below when that file is absent
// or lacks a name — so the validator never disagrees with the schema checker about an id, and it
// still runs on a checkout where the E0-1 library has not landed yet.

const LANES_FALLBACK = ['sd1', 'ga2', 'ta2', 'tb1', 'dtz', 'gb1', 'tb2', 'gb2', 'oza1', 'dtb2'];
const MODULES_FALLBACK = ['hoeren', 'lesen', 'sprachbausteine', 'schreiben', 'sprechen'];
const LEVELS_FALLBACK = ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2'];

const LV = '(?:a1|a2|b1|b2)\\.[12]';
const LN = `(?:${LANES_FALLBACK.join('|')})`;
const UN = `${LV}-u(?:0[1-9]|1[0-2])`;
const ST = `${UN}-ls[1-8]`;
const PL = `${LV}-p[1-3]`;
const HT = `${LV}-ht-${LN}`;
const DX = `${LV}-dx-${LN}`;
const MT = `${LV}-m[abc]-${LN}(?:-(?:${MODULES_FALLBACK.join('|')}))?`;
const BL = `(?:${ST}-${LN}|${PL}-${LN}|${HT}|${DX}|${MT})-[a-z0-9]+`;
const whole = (src) => new RegExp(`^(?:${src})$`);

const BANK_KEY_RE_FALLBACK =
  /^(a1[12]|a2[12]|b1[12]|b2[12])-(u(?:0[1-9]|1[0-2])|p[1-3]|ht|dx|m[abc])-(w|s|mo)([1-8])?(?:-(sd1|ga2|ta2|tb1|dtz|gb1|tb2|gb2|oza1|dtb2))?$/;
const LEGACY_RE_FALLBACK = /^(a\d\d)-l\d\d$/;

const PATTERNS_FALLBACK = {
  LEVEL: whole(LV),
  PREFIX: /^(a1[12]|a2[12]|b1[12]|b2[12])$/,
  UNIT: whole(UN),
  STEP: whole(ST),
  item: whole(`${ST}-[ispx]\\d{2}|${UN}-start-i01|${UN}-[cq]\\d{2}|${BL}-\\d{2}|${ST}-g\\d{2}|${PL}-(?:lm|hm)-\\d{2}`),
  line: whole(`(?:${ST}|${UN}-start|${BL}-t\\d+|${PL}-(?:lm|hm|sc))-l\\d{2}`),
  block: whole(BL),
  mo: whole(`${ST}-mo|${UN}-start-mo|${PL}-mo`),
  rm: whole(`${UN}-rm\\d{2}`),
  fact: whole(`${UN}-f\\d{2}`),
  fokus: whole(`${UN}-fk\\d`),
  plateau: whole(PL),
  halbtest: whole(HT),
  diagnose: whole(DX),
  modelltest: whole(MT),
  cando: /^cd\.(a1|a2|b1|b2)\.[a-z0-9-]+$/,
  spine: /^g\.[a-z0-9-]+$/,
  rulecard: /^rc\.[a-z0-9-]+$/,
  detector: /^det\.[a-z0-9-]+$/,
  texttype: /^tt\.[a-z0-9-]+$/,
  family: /^fam\.[a-z0-9-]+$/,
  lexicon: /^lx\.[a-z0-9-]+$/,
  lane: whole(LN),
  template: whole(`${LN}\\.[a-z0-9]+`),
  rubric: whole(`${LN}-[a-z0-9]+|course-micro|course-micro-sp`),
  cast: /^cast\.[a-z0-9-]+$/,
  BANK_KEY: BANK_KEY_RE_FALLBACK,
  LIST_REF: /^(?:A1|A2|B1|B2|derived:.+|compound:.+\+.+|off-list:.+|freq:.+)$/,
};

const LANE_EXAM_KEY_FALLBACK = {
  sd1: 'goethe_a1', ga2: 'goethe_a2', ta2: 'telc_a2', tb1: 'telc_b1', dtz: 'dtz',
  gb1: 'goethe_b1', tb2: 'telc_b2', gb2: 'goethe_b2', oza1: 'osd_za1', dtb2: 'dtb_b2',
};

let shared = {};
let sharedSource = 'fallback (scripts/course-v2/lib/ids.mjs not found)';
try {
  shared = await import('../lib/ids.mjs');
  sharedSource = 'scripts/course-v2/lib/ids.mjs';
} catch {
  shared = {};
}

/** Where the patterns came from — printed by the CLI so a reader knows which transcription ran. */
export const ID_SOURCE = sharedSource;

export const LANES = Array.isArray(shared.LANES) ? shared.LANES : LANES_FALLBACK;
export const MODULES = Array.isArray(shared.MODULES) ? shared.MODULES : MODULES_FALLBACK;
export const LEVELS = Array.isArray(shared.LEVELS) ? shared.LEVELS : LEVELS_FALLBACK;
export const BANK_KEY_RE = shared.BANK_KEY_RE instanceof RegExp ? shared.BANK_KEY_RE : BANK_KEY_RE_FALLBACK;
export const LEGACY_COURSE_TASK_KEY_RE =
  shared.LEGACY_COURSE_TASK_KEY_RE instanceof RegExp ? shared.LEGACY_COURSE_TASK_KEY_RE : LEGACY_RE_FALLBACK;
export const LANE_EXAM_KEY = shared.LANE_EXAM_KEY && typeof shared.LANE_EXAM_KEY === 'object'
  ? { ...LANE_EXAM_KEY_FALLBACK, ...shared.LANE_EXAM_KEY }
  : LANE_EXAM_KEY_FALLBACK;

/** Named patterns: E0-1's where it defines them, the fallback transcription otherwise. */
export const PATTERNS = { ...PATTERNS_FALLBACK };
if (shared.PATTERNS && typeof shared.PATTERNS === 'object') {
  for (const [k, v] of Object.entries(shared.PATTERNS)) if (v instanceof RegExp) PATTERNS[k] = v;
}

/**
 * SCHEMA §2 as revised on 2026-09-27 (reserve items rNN, exam texts STEP(-LANE)-tN and ASSESS(-LANE)-tN,
 * lines TEXT-lNN, assets, assessment containers). ID-01 checks shapes against this transcription so a
 * lagging shared library cannot reject ids the binding schema allows; the draft shape's BLOCK-tN-lNN
 * lines stay accepted.
 */
const AS = `${LV}-(?:p[1-3]|ht-${LN}|dx-${LN}|m[abc]-${LN})`;
const TX = `(?:${ST}|${AS})(?:-${LN})?-t\\d{1,2}`;
const BL2 = `(?:${ST}-${LN}|${LV}-p[1-3]-${LN}|${LV}-(?:ht|dx)-${LN}|${LV}-m[abc]-${LN})-[a-z0-9]+`;
export const SCHEMA_PATTERNS = {
  item: whole(`${ST}-[isprx]\\d{2}|${UN}-start-i01|${UN}-[cq]\\d{2}|${BL2}-\\d{2}|${ST}-g\\d{2}|${AS}-(?:lm|hm)-\\d{2}`),
  text: whole(TX),
  line: whole(`(?:${ST}|${UN}-start|${TX}|${BL2}-t\\d+|${AS}-(?:lm|hm|sc))-l\\d{2}`),
  block: whole(BL2),
  asset: whole(`(?:${UN}|${AS})-a\\d{2}`),
  mo: whole(`${ST}-mo|${UN}-start-mo|${LV}-p[1-3]-mo`),
  rm: whole(`${UN}-rm\\d{2}`),
  fact: whole(`${UN}-f\\d{2}`),
  fokus: whole(`${UN}-fk\\d`),
  STEP: whole(ST),
  extra: /^x\.[a-z0-9-]+$/,
};

/** 'a2.1' → 'a21'. */
export const prefixOfLevel = (level) => (PATTERNS.LEVEL.test(String(level)) ? String(level).replace('.', '') : null);

/** 'a2.1-u07' → { level: 'a2.1', nr: 7 } or null. */
export function parseUnitId(id) {
  const m = typeof id === 'string' ? id.match(/^((?:a1|a2|b1|b2)\.[12])-u(0[1-9]|1[0-2])$/) : null;
  return m ? { level: m[1], nr: Number(m[2]) } : null;
}

/** 'a2.1-u07-ls3…' → the unit id prefix 'a2.1-u07', or null. */
export function unitOfId(id) {
  const m = typeof id === 'string' ? id.match(/^((?:a1|a2|b1|b2)\.[12]-u(?:0[1-9]|1[0-2]))(?:-|$)/) : null;
  return m ? m[1] : null;
}

/** The band of a level: 'a2.1' → 'a2'. */
export const bandOfLevel = (level) => String(level || '').slice(0, 2);

/** 'a2-1' | 'A2.1' | 'a2.1' → 'a2.1' (or null). */
export function normalizeLevel(raw) {
  const s = String(raw || '').trim().toLowerCase().replace('-', '.');
  return PATTERNS.LEVEL.test(s) ? s : null;
}

/**
 * A total order over course positions, across levels: a1.1-u01 < … < a1.1-u12 < a1.1 closing <
 * a1.2-u01 … Plateaus sit after their unit (P1 after U3, P2 after U6, P3 after U9).
 */
export function positionOf(level, nr) {
  const li = LEVELS.indexOf(level);
  if (li < 0 || typeof nr !== 'number') return null;
  return li * 100 + nr;
}

/** Position of a unit id ('a2.1-u07' → 207), or null. */
export function unitPosition(unitId) {
  const p = parseUnitId(unitId);
  return p ? positionOf(p.level, p.nr) : null;
}

/** Human form of a position (207 → 'a2.1-u07', 203.5 → 'a2.1 after u03'). */
export function describePosition(pos) {
  if (typeof pos !== 'number') return String(pos);
  const level = LEVELS[Math.floor(pos / 100)];
  const nr = pos % 100;
  if (Number.isInteger(nr)) return `${level}-u${String(nr).padStart(2, '0')}`;
  return `${level} after u${String(Math.floor(nr)).padStart(2, '0')}`;
}
