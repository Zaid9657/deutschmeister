// Course v2 bank keys on the FUNCTIONS side (SCHEMA §2, KEY-01).
//
// The functions bundle does not import from scripts/, so the bank-key pattern
// is transcribed here verbatim from scripts/course-v2/lib/ids.mjs (the one
// place SCHEMA §2 is written for the content pipeline). tests/course-v2-ai.test.mjs
// compares the two sources, so they cannot drift apart silently.
//
// A v2 key names a slot in the course, never a prompt:
//   a21-u07-w        A2.1 unit 7, writing Aufgabe (primary lane)
//   a21-u07-s        A2.1 unit 7, speaking Aufgabe
//   a21-u07-mo1      micro-output of Lernschritt 1
//   b12-p2-w-dtz     B1.2 Plateau 2, writing part, DTZ lane
// The legacy keys of the live A1.1/A1.2 course (`a11-l03`) keep their own path
// in evaluate-writing.mjs and never match BANK_KEY_RE.

export const BANK_KEY_RE =
  /^(a1[12]|a2[12]|b1[12]|b2[12])-(u(?:0[1-9]|1[0-2])|p[1-3]|ht|dx|m[abc])-(w|s|mo)([1-8])?(?:-(sd1|ga2|ta2|tb1|dtz|gb1|tb2|gb2|oza1|dtb2))?$/;
export const LEGACY_COURSE_TASK_KEY_RE = /^(a\d\d)-l\d\d$/;

/** Lane → exam key (SCHEMA §14). */
export const LANE_EXAM_KEY = {
  sd1: 'goethe_a1', ga2: 'goethe_a2', ta2: 'telc_a2', tb1: 'telc_b1', dtz: 'dtz',
  gb1: 'goethe_b1', tb2: 'telc_b2', gb2: 'goethe_b2', oza1: 'osd_za1', dtb2: 'dtb_b2',
};

/**
 * The primary lane per band (orchestrator decision 2026-09-27, lean execution):
 * A1 = Start Deutsch 1, A2 = Goethe A2, B1 = telc B1, B2 = telc B2. Used where a
 * bank entry carries no lane of its own (micro-outputs), e.g. to fill the
 * NOT NULL exam_key of writing_submissions with a key its CHECK accepts.
 */
export const PRIMARY_LANE_BY_BAND = { a1: 'sd1', a2: 'ga2', b1: 'tb1', b2: 'tb2' };

/** True when `key` is a v2 bank key. */
export function isBankKey(key) {
  return typeof key === 'string' && BANK_KEY_RE.test(key);
}

/** Parse a v2 bank key into its parts, or null. */
export function parseBankKey(key) {
  const m = typeof key === 'string' ? key.match(BANK_KEY_RE) : null;
  if (!m) return null;
  return { prefix: m[1], slot: m[2], kind: m[3], nr: m[4] ? Number(m[4]) : null, lane: m[5] || null };
}

/**
 * The allowance scope of a key: its course prefix + '-' ('a21-u07-w' → 'a21-',
 * 'a11-l03' → 'a11-'). Null for anything that is neither a v2 nor a legacy key.
 */
export function bankKeyScope(key) {
  if (typeof key !== 'string') return null;
  const m = key.match(BANK_KEY_RE) || key.match(LEGACY_COURSE_TASK_KEY_RE);
  return m ? `${m[1]}-` : null;
}

/** 'a21' → 'a2.1' (lowercase, the code/URL spelling). Null for anything else. */
export function levelOfPrefix(prefix) {
  return typeof prefix === 'string' && /^(a1|a2|b1|b2)[12]$/.test(prefix)
    ? `${prefix.slice(0, 2)}.${prefix.slice(2)}`
    : null;
}

/** 'a2.1' → 'A2.1' — the spelling speaking_sessions.level's CHECK expects. */
export function dbLevel(level) {
  return typeof level === 'string' ? level.toUpperCase() : null;
}

/** The band of a level: 'a2.1' → 'a2'. */
export function bandOfLevel(level) {
  const m = typeof level === 'string' ? level.match(/^(a1|a2|b1|b2)\.[12]$/i) : null;
  return m ? m[1].toLowerCase() : null;
}

/** The exam key a bank entry is stored under: its own, its lane's, or the band's primary lane's. */
export function examKeyFor(entry, level) {
  if (entry?.examKey && typeof entry.examKey === 'string') return entry.examKey;
  if (entry?.lane && LANE_EXAM_KEY[entry.lane]) return LANE_EXAM_KEY[entry.lane];
  const lane = PRIMARY_LANE_BY_BAND[bandOfLevel(level)];
  return lane ? LANE_EXAM_KEY[lane] : null;
}
