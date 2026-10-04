// Course v2 — the unit builder (BLUEPRINT §3.1–§3.3, SCHEMA §8; E1-1).
//
// Turns one compiled unit (src/data/course-v2/<level>/units/uNN.json) into the
// plan the player walks: Start → the unit's steps in order (the Check is the
// last of them, `kind: 'check'`) → recap. Pure: no React, no I/O, no clock —
// the same unit, attempt numbers and earlier-reserve items give the same plan,
// so a resumed session serves the draw the learner left.
//
// What is decided here, and nowhere else:
//   - the PRACTICE DRAW of a Situation/Text/Sprache step: 12 served + 3 exit
//     items from the pool (16 = 12 + 3 + 1 spare, BLUEPRINT §3.3), seeded by
//     (unit, step, attempt) with the live course's mulberry32 seed, and the
//     EARLIER-ATTEMPT EXCLUSION: on a repeat the items served last time go to the
//     back of the queue, so a repeat is not the same twelve again (DaF review #9);
//   - the REQUEUE ALTERNATE of a missed item: a different item of the same topic,
//     first from the pool's unserved rest, then from the step's reserve (never the
//     same id twice, never another step's item);
//   - the CHECK: this unit's check items plus `earlierDraw.count` items drawn at
//     runtime from the reserves of earlier units (`from`: previous-3 · etappe ·
//     all-previous) — by rule, never by item id (BLUEPRINT §3.1 LS7);
//   - RESUME: the first step not yet finished (step level; the renderer keeps the
//     item position inside a step);
//   - the OPTION ORDER of a non-exam choice item (orderedOptions): authors key most
//     of them at options[0] (ITM-03 advisory), so the player shows them in an order
//     seeded by (unit, item, attempt); exam items keep the format's order.
//
// The planned step handed to StepView is the SCHEMA step plus one additive key,
// `plan` (see planStep). A renderer that ignores `plan` still renders the step.
import { mulberry32, seedFor } from '../lesson/buildLesson.js';
import { stepNrOf, nrOfId } from './ids.js';

/** Pool arithmetic of a Situation-LS (BLUEPRINT §3.3). */
export const PRACTICE_SERVED = 12;
export const EXIT_ITEMS = 3;

/** Step kinds with a practice pool the builder draws from. */
export const POOL_KINDS = Object.freeze(['situation', 'text', 'sprache']);

/** How many items a pool of `n` serves: 16 → 12 + 3 (+1 spare); a short pool keeps ≈ 1 exit item per 5. */
export function drawCounts(n) {
  const size = Math.max(0, Number(n) || 0);
  const exit = Math.min(EXIT_ITEMS, Math.floor(size / 5));
  const practice = Math.min(PRACTICE_SERVED, size - exit);
  return { practice, exit, spare: size - practice - exit };
}

/** Fisher–Yates with the seeded PRNG; returns a new array. */
export function seededShuffle(list, seed) {
  const out = [...(list || [])];
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── option order of a non-exam choice item ──────────────────────────────────────────────
//
// The validator's ITM-03 advisory measured it: authors key most non-exam choice items
// (multiple_choice, listen_select, a cloze with its own options …) at options[0], so a
// player that shows the authored order can be gamed by position. The order is therefore
// seeded by (unit, item, attempt): a re-render or a resumed session in the same attempt
// shows the same order, a repeat of the step may reorder. Grading never reads a position —
// checkItem compares the chosen option STRING (or block key) with `accepted`.
//
// Never reordered:
//   - exam items (role 'exam', or rendered inside an ExamBlock — LS4, Plateau, Modelltest):
//     the option order belongs to the exam format (Prüfungsmodus and Lernmodus alike);
//   - richtig/falsch and ja/nein: a fixed pair in a fixed order, nothing to learn from its place.

/** Item types whose two options are a fixed pair in a fixed order. */
export const FIXED_ORDER_TYPES = Object.freeze(['richtig_falsch', 'ja_nein']);

/** Is this an exam item (its option order is part of the format)? `block` = the enclosing ExamBlock, if any. */
export function isExamItem(item, { block = null } = {}) {
  return Boolean(block) || Boolean(item && item.role === 'exam');
}

/** Does the player reorder this item's own `options`? */
export function shufflesOptions(item, { block = null } = {}) {
  return Boolean(item)
    && Array.isArray(item.options)
    && item.options.length > 1
    && !FIXED_ORDER_TYPES.includes(item.type)
    && !isExamItem(item, { block });
}

/** The option-order seed of one item in one attempt (the draw's seedFor, keyed by unit + item). */
export function optionSeed(unitId, itemId, attempt = 1) {
  return seedFor(`${unitId || ''}|${itemId || ''}|options`, 0, Math.max(1, Math.floor(Number(attempt) || 1)));
}

/**
 * The options of an item in the order the learner sees them: seeded by (unit, item, attempt)
 * for a non-exam choice item, the authored order otherwise. Always a new array holding the
 * same strings.
 */
export function orderedOptions(item, { unitId = null, attempt = 1, block = null } = {}) {
  const options = Array.isArray(item && item.options) ? item.options : [];
  if (!shufflesOptions(item, { block })) return [...options];
  return seededShuffle(options, optionSeed(unitId, item.id, attempt));
}

const idsOf = (list) => new Set((list || []).map((x) => x && x.id).filter(Boolean));
const itemsOfPool = (pool) => (Array.isArray(pool) ? pool : (pool && pool.items) || []).filter((x) => x && x.id);

function rawDraw(items, seed, previousIds) {
  const shuffled = seededShuffle(items, seed);
  // Earlier-attempt exclusion: last attempt's served items go to the back.
  const fresh = shuffled.filter((it) => !previousIds.has(it.id));
  const seen = shuffled.filter((it) => previousIds.has(it.id));
  const ordered = [...fresh, ...seen];
  const { practice, exit } = drawCounts(ordered.length);
  return {
    practice: ordered.slice(0, practice),
    exit: ordered.slice(practice, practice + exit),
    spare: ordered.slice(practice + exit),
  };
}

/**
 * The draw of one pool step at a given attempt (1-based).
 * → { practice: Item[], exit: Item[], spare: Item[], attempt, seed }
 */
export function drawStep(step, { unitId, attempt = 1 } = {}) {
  const items = itemsOfPool(step && step.pool);
  const n = Math.max(1, Math.floor(Number(attempt) || 1));
  const stepNr = stepNrOf(step && step.id) || 0;
  const key = `${unitId || ''}|${step && step.id}`;
  let previous = new Set();
  // Replaying attempts 1…n-1 is cheap (≤ 16 items) and keeps the rule pure: the
  // exclusion always refers to what the previous attempt actually served.
  for (let a = 1; a < n; a += 1) {
    const d = rawDraw(items, seedFor(key, stepNr, a), previous);
    previous = idsOf([...d.practice, ...d.exit]);
  }
  const seed = seedFor(key, stepNr, n);
  return { ...rawDraw(items, seed, previous), attempt: n, seed };
}

/**
 * The planned step for StepView: the SCHEMA step plus `plan`
 *   pool steps:  { attempt, practice, exit, spare, reserve }
 *   check step:  { attempt, items, proofItems, earlierIds, earlierMissing }
 *   other kinds: plan is null (the renderer reads the step itself).
 */
export function planStep(step, { unit, attempt = 1, earlierItems = [] } = {}) {
  if (!step) return step;
  if (POOL_KINDS.includes(step.kind) && step.pool) {
    const d = drawStep(step, { unitId: unit && unit.id, attempt });
    return {
      ...step,
      plan: { attempt: d.attempt, practice: d.practice, exit: d.exit, spare: d.spare, reserve: (step.reserve || []).filter((x) => x && x.id) },
    };
  }
  if (step.kind === 'check') return { ...step, plan: planCheck(unit, { attempt, earlierItems }) };
  return { ...step, plan: null };
}

/** The unit numbers a Check's earlierDraw may draw from (`from` of SCHEMA §8 Check). */
export function earlierSourceNrs(unit, etappen = []) {
  const nr = Number(unit && unit.nr) || nrOfId(unit && unit.id) || 0;
  const from = unit && unit.check && unit.check.earlierDraw ? unit.check.earlierDraw.from : 'previous-3';
  const before = [];
  for (let i = 1; i < nr; i += 1) before.push(i);
  if (from === 'all-previous') return before;
  if (from === 'etappe') {
    const et = (etappen || []).find((e) => (e.units || []).some((u) => (typeof u === 'string' ? u : u && u.unit) === unit.id));
    if (!et) return before.slice(-3);
    return (et.units || []).map((u) => nrOfId(typeof u === 'string' ? u : u && u.unit)).filter((n) => n && n < nr);
  }
  return before.slice(-3);
}

/**
 * The Check of a unit: its own items + `earlierDraw.count` drawn from `earlierItems`
 * (the reserves of the source units, gathered by the loader). Fewer available than
 * asked → the check is simply shorter and `earlierMissing` says by how much.
 */
export function planCheck(unit, { attempt = 1, earlierItems = [] } = {}) {
  const check = (unit && unit.check) || {};
  const own = (check.items || []).filter((x) => x && x.id);
  const want = check.earlierDraw ? Math.max(0, Number(check.earlierDraw.count) || 0) : 0;
  const ownIds = idsOf(own);
  const candidates = [];
  const seen = new Set();
  for (const it of earlierItems || []) {
    if (!it || !it.id || ownIds.has(it.id) || seen.has(it.id)) continue;
    seen.add(it.id);
    candidates.push(it);
  }
  const n = Math.max(1, Math.floor(Number(attempt) || 1));
  const drawn = seededShuffle(candidates, seedFor(`${unit && unit.id}|check`, 0, n)).slice(0, want);
  return {
    attempt: n,
    items: [...own, ...drawn],
    proofItems: (check.proofItems || []).filter((x) => x && x.id),
    earlierIds: drawn.map((x) => x.id),
    earlierMissing: Math.max(0, want - drawn.length),
  };
}

/**
 * A different item of the same topic for a missed one (requeue, BLUEPRINT §3.3):
 * the pool's unserved rest first, then the reserve, then any unserved spare.
 * `usedIds` = every id already shown in this step. null when nothing is left —
 * the renderer then moves on (never the same item twice in a row).
 */
export function alternateFor(missed, plan, usedIds = []) {
  if (!missed || !plan) return null;
  const used = usedIds instanceof Set ? usedIds : new Set(usedIds || []);
  used.add(missed.id);
  const spare = (plan.spare || []).filter((it) => !used.has(it.id));
  const reserve = (plan.reserve || []).filter((it) => !used.has(it.id));
  const sameTopic = (it) => it.topic === missed.topic;
  return spare.find(sameTopic) || reserve.find(sameTopic) || spare[0] || null;
}

/**
 * A compiled reserve-index entry back in the SCHEMA §3.1 Item shape the renderers read.
 * The compiler strips `reserve` from every unit chunk and writes the reserve items only
 * to `<level>/reserve.json`, in the live lessonPools shape (scripts/course-v2/lib/
 * compiler.mjs toPoolItem/toReserveItem: questionDe, explanationDe/En, hint as a string,
 * sentence-building tiles folded into the question). An entry already in Item shape
 * (it has promptDe) is returned as it is.
 */
export function itemFromReserve(entry) {
  if (!entry || !entry.id) return null;
  if (entry.promptDe !== undefined) return entry;
  let promptDe = entry.questionDe;
  let tiles;
  if (entry.type === 'sentence_building') {
    const m = /^([\s\S]*?) \[(.+)\]$/.exec(String(entry.questionDe || ''));
    if (m) {
      promptDe = m[1].replace(/:$/, '.');
      tiles = m[2].split(' / ');
    }
  }
  const out = {
    id: entry.id,
    type: entry.type,
    role: 'reserve',
    topic: entry.topic,
    promptDe,
    promptEn: entry.questionEn ?? null,
    answer: entry.answer,
    accepted: entry.accepted,
    explanation: { de: entry.explanationDe || '', en: entry.explanationEn || '' },
  };
  if (Array.isArray(entry.options)) out.options = entry.options;
  if (tiles) out.tiles = tiles;
  if (entry.caseSensitive === true) out.caseSensitive = true;
  if (entry.hint) out.hint = { de: entry.hint };
  if (entry.exact) out.exact = entry.exact;
  if (Array.isArray(entry.errorTags) && entry.errorTags.length) {
    out.errorTags = entry.errorTags;
    if (entry.errorTags.length === 1) out.errorTag = entry.errorTags[0];
  }
  for (const k of ['pairs', 'audioLineRef', 'textRef', 'noMatch', 'difficulty', 'banks', 'step', 'unit']) {
    if (entry[k] !== undefined) out[k] = entry[k];
  }
  return out;
}

/**
 * The Items of the reserve index for some units: `index` is the compiled reserve.json
 * ({ items: Entry[], byUnit: { [unitId]: itemId[] } }); older/alternative shapes whose
 * byUnit maps straight to item arrays are accepted too.
 */
export function reserveItemsFor(index, unitIds = []) {
  if (!index) return [];
  const byId = new Map((Array.isArray(index.items) ? index.items : []).filter((x) => x && x.id).map((x) => [x.id, x]));
  const byUnit = index.byUnit || index;
  const out = [];
  for (const uid of unitIds || []) {
    for (const ref of Array.isArray(byUnit[uid]) ? byUnit[uid] : []) {
      const item = itemFromReserve(typeof ref === 'string' ? byId.get(ref) : ref);
      if (item) out.push(item);
    }
  }
  return out;
}

/**
 * The unit with each step's `reserve` put back from the reserve index (the requeue's
 * second source, BLUEPRINT §3.3). A step that already carries a reserve keeps it.
 */
export function withReserves(unit, index) {
  if (!unit || !index) return unit;
  const items = reserveItemsFor(index, [unit.id]);
  if (!items.length) return unit;
  const byStep = new Map();
  for (const it of items) {
    const sid = it.step || stepIdOf(it.id);
    if (!sid) continue;
    if (!byStep.has(sid)) byStep.set(sid, []);
    byStep.get(sid).push(it);
  }
  return {
    ...unit,
    steps: (unit.steps || []).map((s) => (Array.isArray(s.reserve) && s.reserve.length) || !byStep.has(s.id) ? s : { ...s, reserve: byStep.get(s.id) }),
  };
}

const stepIdOf = (itemId) => {
  const m = /^(.+-ls\d)-/.exec(String(itemId || ''));
  return m ? m[1] : null;
};

/** Reserve items of earlier units' chunks (the fallback until a compiled reserve index exists). */
export function reservesOf(units = []) {
  const out = [];
  for (const u of units || []) {
    for (const s of (u && u.steps) || []) for (const it of s.reserve || []) if (it && it.id) out.push(it);
  }
  return out;
}

/**
 * The whole plan. `attempts` = { [stepId]: 1-based attempt } (finished runs + 1);
 * `earlierItems` = the Check's candidate reserve items.
 * → { unitId, level, steps: PlannedStep[] }
 */
export function buildUnitPlan(unit, { attempts = {}, earlierItems = [] } = {}) {
  const steps = ((unit && unit.steps) || []).map((s) => planStep(s, { unit, attempt: attempts[s.id] || 1, earlierItems }));
  return { unitId: unit && unit.id, level: unit && unit.level, steps };
}

/**
 * Where a (re)opened unit continues: the index of the first step not finished;
 * steps.length when all are finished (→ recap). Optional steps (Überarbeiten) are
 * walked in order like any other — the learner may skip them from the screen.
 */
export function resumeIndex(steps = [], finishedSteps = new Set()) {
  const done = finishedSteps instanceof Set ? finishedSteps : new Set(finishedSteps || []);
  const i = (steps || []).findIndex((s) => !done.has(s.id));
  return i === -1 ? (steps || []).length : i;
}
