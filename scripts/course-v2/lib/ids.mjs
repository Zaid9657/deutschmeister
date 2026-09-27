// Course v2 identifiers — SCHEMA §2 (revision of 2026-09-27), transcribed. The one place an id
// pattern is written.
//
// Every `re(NAME)` and `ref(kind)` in the schemas resolves to a pattern here. The SCHEMA
// patterns are reproduced exactly; where SCHEMA §2 names an id kind but gives it no owner
// (Plateau reward items and lines, the B-skeleton Auftakt micro-output, a Plateau's Projekt
// micro-output), the pattern is WIDENED by an owner-prefixed form marked `EXTENSION` below.
// Nothing SCHEMA accepts is rejected.

// ── building blocks ─────────────────────────────────────────────────────────────────────
export const LANES = ['sd1', 'ga2', 'ta2', 'tb1', 'dtz', 'gb1', 'tb2', 'gb2', 'oza1', 'dtb2'];
export const MODULES = ['hoeren', 'lesen', 'sprachbausteine', 'schreiben', 'sprechen'];

const LV = '(?:a1|a2|b1|b2)\\.[12]';
const LN = `(?:${LANES.join('|')})`;
const UN = `${LV}-u(?:0[1-9]|1[0-2])`;
const ST = `${UN}-ls[1-8]`;
const PL = `${LV}-p[1-3]`;
const HT = `${LV}-ht-${LN}`;
const DX = `${LV}-dx-${LN}`;
const MT = `${LV}-m[abc]-${LN}`; // a Modelltest form (the container of its module files)
// ASSESS: Plateau · Halbtest · Diagnose · Modelltest form
const AS = `(?:${PL}|${HT}|${DX}|${MT})`;
const MD = `${MT}-mod-(?:${MODULES.join('|')})`;
const SLUG = '[a-z0-9-]+';
// exam block: STEP-<lane>-<teil> · Plateau-<lane>-<teil> · (Halbtest|Diagnose|Modelltest)-<teil>
const BL = `(?:${ST}-${LN}|${PL}-${LN}|${HT}|${DX}|${MT})-[a-z0-9]+`;
// exam text: (STEP|ASSESS)(-LANE)?-tN
const TX = `(?:${ST}|${AS})(?:-${LN})?-t\\d{1,2}`;

const whole = (src) => new RegExp(`^(?:${src})$`);

// ── SCHEMA §2, bank keys (verbatim; KEY-01) ─────────────────────────────────────────────
export const BANK_KEY_RE =
  /^(a1[12]|a2[12]|b1[12]|b2[12])-(u(?:0[1-9]|1[0-2])|p[1-3]|ht|dx|m[abc])-(w|s|mo)([1-8])?(?:-(sd1|ga2|ta2|tb1|dtz|gb1|tb2|gb2|oza1|dtb2))?$/;
export const LEGACY_COURSE_TASK_KEY_RE = /^(a\d\d)-l\d\d$/;

/**
 * The allowance scope of a bank key: its first capture group + '-' ('a21-u07-w' → 'a21-').
 * Accepts v2 bank keys and the legacy live-course keys ('a11-l03' → 'a11-'); null otherwise.
 */
export function bankKeyScope(key) {
  if (typeof key !== 'string') return null;
  const m = key.match(BANK_KEY_RE) || key.match(LEGACY_COURSE_TASK_KEY_RE);
  return m ? `${m[1]}-` : null;
}

/** Parse a v2 bank key into its parts, or null. */
export function parseBankKey(key) {
  const m = typeof key === 'string' ? key.match(BANK_KEY_RE) : null;
  if (!m) return null;
  return { prefix: m[1], slot: m[2], kind: m[3], nr: m[4] ? Number(m[4]) : null, lane: m[5] || null };
}

// ── named patterns: re(NAME) ────────────────────────────────────────────────────────────
export const PATTERNS = {
  LEVEL: whole(LV),
  PREFIX: /^(a1[12]|a2[12]|b1[12]|b2[12])$/,
  UNIT: whole(UN),
  STEP: whole(ST),
  ASSESS: whole(AS),
  MODULE: whole(MD),
  // SCHEMA: STEP-(i|s|p|r|x)NN · UNIT-start-i01 · UNIT-(c|q)NN · BLOCK-NN · STEP-gNN
  // EXTENSION: Plateau reward items PLATEAU-(lm|hm)-NN (Lesemagazin / Hörmagazin)
  item: whole(`${ST}-[isprx]\\d{2}|${UN}-start-i01|${UN}-[cq]\\d{2}|${BL}-\\d{2}|${ST}-g\\d{2}|${PL}-(?:lm|hm)-\\d{2}`),
  // SCHEMA: (STEP | UNIT-start | TEXT)-lNN · EXTENSION: PLATEAU-(lm|hm|sc)-lNN (reward lines)
  line: whole(`(?:${ST}|${UN}-start|${TX}|${PL}-(?:lm|hm|sc))-l\\d{2}`),
  text: whole(TX),
  block: whole(BL),
  asset: whole(`(?:${UN}|${AS})-a\\d{2}`),
  extra: /^x\.[a-z0-9-]+$/,
  // an Azure voice name ('de-DE-KatjaNeural'); the registry (registries/voices.json) resolves it
  voice: /^[a-z]{2,3}-[A-Z]{2}-[A-Za-z0-9:]+$/,
  // SCHEMA: STEP-mo · EXTENSION: UNIT-start-mo (B Auftakt), PLATEAU-mo (Projekt)
  mo: whole(`${ST}-mo|${UN}-start-mo|${PL}-mo`),
  rm: whole(`${UN}-rm\\d{2}`),
  fact: whole(`${UN}-f\\d{2}`),
  fokus: whole(`${UN}-fk\\d`),
  plateau: whole(PL),
  halbtest: whole(HT),
  diagnose: whole(DX),
  modelltest: whole(MT),
  cando: /^cd\.(a1|a2|b1|b2)\.[a-z0-9-]+$/,
  spine: whole(`g\\.${SLUG}`),
  rulecard: whole(`rc\\.${SLUG}`),
  detector: whole(`det\\.${SLUG}`),
  texttype: whole(`tt\\.${SLUG}`),
  family: whole(`fam\\.${SLUG}`),
  lexicon: /^lx\.[a-z0-9-]+$/,
  lane: whole(LN),
  template: whole(`${LN}\\.[a-z0-9]+`),
  rubric: whole(`${LN}-[a-z0-9]+|course-micro|course-micro-sp`),
  cast: /^cast\.[a-z0-9-]+$/,
  BANK_KEY: BANK_KEY_RE,
  // lexicon list_ref (SCHEMA §6 comment): 'A1'|'A2'|'B1'|'derived:<head>'|'compound:<a+b>'|'off-list:<reason>'|'freq:<band>'
  LIST_REF: /^(?:A1|A2|B1|B2|derived:.+|compound:.+\+.+|off-list:.+|freq:.+)$/,
};

// ref(kind) → the pattern an id of that kind must match (format half of REF-01).
export const REF_PATTERNS = {
  cando: PATTERNS.cando,
  spine: PATTERNS.spine,
  lexicon: PATTERNS.lexicon,
  template: PATTERNS.template,
  lane: PATTERNS.lane,
  rubric: PATTERNS.rubric,
  rulecard: PATTERNS.rulecard,
  cast: PATTERNS.cast,
  extra: PATTERNS.extra, // resolved against the same file's `extras` only (SCHEMA §1)
  voice: PATTERNS.voice,
  texttype: PATTERNS.texttype,
  detector: PATTERNS.detector,
  family: PATTERNS.family,
  unit: PATTERNS.UNIT,
  step: PATTERNS.STEP,
  item: PATTERNS.item,
  line: PATTERNS.line,
  text: PATTERNS.text,
  asset: PATTERNS.asset,
  fact: PATTERNS.fact,
  bank: BANK_KEY_RE,
  plateau: PATTERNS.plateau,
  fokus: PATTERNS.fokus,
};

// ── lanes and levels ────────────────────────────────────────────────────────────────────
// SCHEMA §14: lane → exam key.
export const LANE_EXAM_KEY = {
  sd1: 'goethe_a1', ga2: 'goethe_a2', ta2: 'telc_a2', tb1: 'telc_b1', dtz: 'dtz',
  gb1: 'goethe_b1', tb2: 'telc_b2', gb2: 'goethe_b2', oza1: 'osd_za1', dtb2: 'dtb_b2',
};

export const LEVELS = ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2'];

/** 'a2.1' → 'a21' (the bank-key course prefix). */
export function prefixOfLevel(level) {
  return PATTERNS.LEVEL.test(level) ? level.replace('.', '') : null;
}

/** 'a21' → 'a2.1'. */
export function levelOfPrefix(prefix) {
  return PATTERNS.PREFIX.test(prefix) ? `${prefix.slice(0, 2)}.${prefix.slice(2)}` : null;
}

/** 'a2.1-u07' → 7. */
export function unitNr(unitId) {
  const m = typeof unitId === 'string' ? unitId.match(/-u(\d{2})$/) : null;
  return m ? Number(m[1]) : null;
}
