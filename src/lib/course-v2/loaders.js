// Course v2 — lazy loaders for the compiled course data (Vite only: it uses
// import.meta.glob, so node tests import the pure modules, never this one).
//
// The compiler (scripts/course-v2/compile.mjs, SCHEMA §13) writes per level
//   src/data/course-v2/<level>/manifest.json      the course manifest (the shared
//                                                 contract's "course.json"; both names load)
//   src/data/course-v2/<level>/units/uNN.json     one unit — each its own lazy chunk,
//                                                 so the player route stays small (BLUEPRINT §7.1)
//   src/data/course-v2/<level>/rule-cards.json    the level's rule cards
//   src/data/course-v2/<level>/plateaus/pN.json   Plateaus, once authored
//   src/data/course-v2/<level>/reserve.json       the compiled reserve index, once it exists
// A glob over a directory that does not exist yet is simply empty, so every loader
// here answers null / [] until the content is compiled — the pages then say so.
import { normalizeLevel, LEVEL_RE } from './ids.js';
import { reservesOf, earlierSourceNrs } from './unitPlan.js';

const UNITS = import.meta.glob('../../data/course-v2/*/units/*.json');
const MANIFESTS = import.meta.glob('../../data/course-v2/*/manifest.json');
const COURSE_FILES = import.meta.glob('../../data/course-v2/*/course.json');
const RULE_CARDS = import.meta.glob('../../data/course-v2/*/rule-cards.json');
const PLATEAUS = import.meta.glob('../../data/course-v2/*/plateaus/*.json');
const RESERVES = import.meta.glob('../../data/course-v2/*/reserve.json');

const base = (level) => `../../data/course-v2/${level}`;
const pad2 = (n) => String(Number(n)).padStart(2, '0');
const unwrap = (mod) => (mod && mod.default !== undefined ? mod.default : mod);

async function load(table, key) {
  const loader = table[key];
  if (!loader) return null;
  try {
    return unwrap(await loader());
  } catch (err) {
    console.error(`[course-v2] could not load ${key}:`, err && err.message);
    return null;
  }
}

const manifestKey = (level) => {
  const l = normalizeLevel(level);
  if (!l) return null;
  if (MANIFESTS[`${base(l)}/manifest.json`]) return { table: MANIFESTS, key: `${base(l)}/manifest.json` };
  if (COURSE_FILES[`${base(l)}/course.json`]) return { table: COURSE_FILES, key: `${base(l)}/course.json` };
  return null;
};

/** Levels with a compiled v2 manifest (sync — no file is loaded). */
export function v2Levels() {
  const out = new Set();
  for (const key of [...Object.keys(MANIFESTS), ...Object.keys(COURSE_FILES)]) {
    const m = key.match(/course-v2\/([^/]+)\//);
    if (m && LEVEL_RE.test(m[1])) out.add(m[1]);
  }
  return [...out].sort();
}

/** Does this level have v2 content (a manifest)? Sync. */
export const hasV2Content = (level) => manifestKey(level) !== null;

/** Is unit `nr` of `level` compiled? Sync. */
export const hasUnit = (level, nr) => Boolean(UNITS[`${base(normalizeLevel(level))}/units/u${pad2(nr)}.json`]);

/** Plateau numbers whose file is compiled. Sync. */
export function plateauNrs(level) {
  const l = normalizeLevel(level);
  const out = new Set();
  for (const key of Object.keys(PLATEAUS)) {
    const m = key.match(/course-v2\/([^/]+)\/plateaus\/p([1-3])\.json$/);
    if (m && m[1] === l) out.add(Number(m[2]));
  }
  return out;
}

export async function loadManifest(level) {
  const k = manifestKey(level);
  return k ? load(k.table, k.key) : null;
}

/** { [ruleCardId]: card } — {} when the level has none compiled. */
export async function loadRuleCards(level) {
  const l = normalizeLevel(level);
  const data = l ? await load(RULE_CARDS, `${base(l)}/rule-cards.json`) : null;
  const cards = (data && (data.cards || (Array.isArray(data) ? data : []))) || [];
  return Object.fromEntries(cards.filter((c) => c && c.id).map((c) => [c.id, c]));
}

/** The compiled unit chunk, or null. */
export async function loadUnit(level, nr) {
  const l = normalizeLevel(level);
  return l ? load(UNITS, `${base(l)}/units/u${pad2(nr)}.json`) : null;
}

export async function loadPlateau(level, nr) {
  const l = normalizeLevel(level);
  return l ? load(PLATEAUS, `${base(l)}/plateaus/p${Number(nr)}.json`) : null;
}

/**
 * Candidate items for a Check's earlierDraw: the compiled reserve index when it
 * exists ({ byUnit: { [unitId]: Item[] } } or { [unitId]: Item[] }), else the
 * `reserve` arrays of the earlier units' own chunks (loaded lazily, at most the
 * units `from` names). [] for unit 1 or when nothing is compiled.
 */
export async function loadEarlierItems(level, unit, etappen = []) {
  const l = normalizeLevel(level);
  if (!l || !unit) return [];
  const nrs = earlierSourceNrs(unit, etappen);
  if (!nrs.length) return [];
  const ids = nrs.map((n) => `${l}-u${pad2(n)}`);
  const index = await load(RESERVES, `${base(l)}/reserve.json`);
  if (index) {
    const byUnit = index.byUnit || index;
    return ids.flatMap((id) => (Array.isArray(byUnit[id]) ? byUnit[id] : []));
  }
  const chunks = await Promise.all(nrs.map((n) => loadUnit(l, n)));
  return reservesOf(chunks.filter(Boolean));
}
