// The lesson engine's builder: curriculum data + exercise pool → the ordered
// list of stages the player walks through (docs/course-standard-2026-09-12.md
// §3, shapes in docs/course-factory/a11-rebuild/CONTRACT.md).
//
// Pure and deterministic on purpose. The 7 controlled-practice items are drawn
// with a seeded PRNG keyed on (level, lektion nr, attempt), so tests can pin
// exactly which items a learner gets, a retry gives a DIFFERENT seven, and the
// page can rebuild the same lesson after a reload without storing the picks.

/** Tiny seeded PRNG (mulberry32, public domain). 32-bit state, uniform [0,1). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash of the (level, nr, attempt) triple — the practice seed. */
export function seedFor(level, nr, attempt = 1) {
  const key = `${String(level || '').toLowerCase()}|${nr}|${attempt}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A pool file (`{ items: [...] }`) or a bare array — both are accepted. */
export const poolItems = (pool) => (Array.isArray(pool) ? pool : (pool && pool.items) || []);

/**
 * Typed production vs recognition (CONTRACT.md, "Pool items"):
 * a fill_blank WITH options is a chip/recognition item; WITHOUT it is typed.
 */
export const isTypedItem = (it) =>
  it.type === 'sentence_building' ||
  it.type === 'error_correction' ||
  (it.type === 'fill_blank' && !(it.options && it.options.length));

export const isMultipleChoice = (it) => it.type === 'multiple_choice';

export const PRACTICE_SIZE = 7;
export const MAX_MULTIPLE_CHOICE = 2;

function seededShuffle(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The 7 controlled-practice items for one Lektion.
 *
 * Guarantees, in this order of priority: at least `rule.typedMin` typed items,
 * at most two multiple_choice, seven items in total, all drawn from
 * `rule.topics`. When the topic slice is too small to satisfy a guarantee the
 * result is simply shorter / less balanced rather than padded with off-topic
 * items — a short pool is a content bug, not something to paper over.
 */
export function pickPracticeItems(pool, rule, seed) {
  const topics = new Set((rule && rule.topics) || []);
  const typedMin = Math.max(0, (rule && rule.typedMin) || 0);
  const candidates = poolItems(pool).filter((it) => topics.has(it.topic));
  if (!candidates.length) return [];

  const rng = mulberry32(seed);
  const shuffled = seededShuffle(candidates, rng);
  const order = new Map(shuffled.map((it, i) => [it.id, i]));
  const chosen = new Map();

  // 1. the typed floor
  for (const it of shuffled) {
    if (chosen.size >= Math.min(typedMin, PRACTICE_SIZE)) break;
    if (isTypedItem(it)) chosen.set(it.id, it);
  }
  // 2. fill up, holding the multiple-choice ceiling
  let mc = [...chosen.values()].filter(isMultipleChoice).length;
  for (const it of shuffled) {
    if (chosen.size >= PRACTICE_SIZE) break;
    if (chosen.has(it.id)) continue;
    if (isMultipleChoice(it)) {
      if (mc >= MAX_MULTIPLE_CHOICE) continue;
      mc += 1;
    }
    chosen.set(it.id, it);
  }

  // Present them in the shuffled order so typed and recognition interleave.
  return [...chosen.values()].sort((a, b) => order.get(a.id) - order.get(b.id));
}

const line = (dialog, i) => {
  const l = dialog && dialog.lines && dialog.lines[i];
  return l ? { ...l, index: i } : null;
};

/**
 * buildLesson({ curriculum, lektion, pool, dueCards, attempt }) → stage list.
 *
 * `nr` is the standard's stage number (0–8); `key` is unique per screen group,
 * because stage 2 (Input) is two screens — the dialogue, then the Wortfeld.
 * Stages with nothing to show (no due cards, no Hören slot) are left out
 * entirely rather than rendered empty.
 */
export function buildLesson({ curriculum, lektion, pool, dueCards = [], attempt = 1 }) {
  if (!lektion) return { stages: [], seed: 0, attempt };
  const level = (curriculum && curriculum.level) || 'a1.1';
  const seed = seedFor(level, lektion.nr, attempt);
  const stages = [];

  if (dueCards && dueCards.length) {
    stages.push({ nr: 0, key: 'warmup', kind: 'warmup', title: 'Wiederholung', cards: dueCards.slice(0, 4) });
  }
  if (lektion.pretest) {
    stages.push({ nr: 1, key: 'pretest', kind: 'pretest', title: 'Vorher probieren', pretest: lektion.pretest });
  }
  if (lektion.dialog) {
    stages.push({ nr: 2, key: 'dialog', kind: 'dialog', title: lektion.dialog.title || 'Dialog', dialog: lektion.dialog });
  }
  if (lektion.wortfeld && lektion.wortfeld.length) {
    stages.push({ nr: 2, key: 'wortfeld', kind: 'wortfeld', title: 'Wortfeld', words: lektion.wortfeld });
  }
  if (lektion.notice) {
    stages.push({ nr: 3, key: 'notice', kind: 'notice', title: lektion.notice.title || 'Grammatik', notice: lektion.notice });
  }

  const practice = pickPracticeItems(pool, lektion.practiceRule || { topics: [], typedMin: 0 }, seed);
  if (practice.length) {
    stages.push({ nr: 4, key: 'practice', kind: 'practice', title: 'Üben', items: practice });
  }

  const hoeren = lektion.hoeren;
  if (hoeren && hoeren.kind === 'dictation' && hoeren.lines && hoeren.lines.length) {
    const lines = hoeren.lines.map((i) => line(lektion.dialog, i)).filter(Boolean);
    if (lines.length) stages.push({ nr: 4, key: 'dictation', kind: 'dictation', title: 'Hören und schreiben', lines });
  }

  const sprechen = lektion.sprechen;
  if (sprechen && ((sprechen.readAloud && sprechen.readAloud.length) || sprechen.open)) {
    stages.push({
      nr: 5,
      key: 'speaking',
      kind: 'speaking',
      title: 'Sprechen',
      readAloud: (sprechen.readAloud || []).map((i) => line(lektion.dialog, i)).filter(Boolean),
      open: sprechen.open || null,
    });
  }

  if (lektion.schreiben) {
    stages.push({ nr: 6, key: 'writing', kind: 'writing', title: 'Schreiben', schreiben: lektion.schreiben });
  }

  // Filled in by the player once the misses are known (stage 7 in the standard).
  stages.push({ nr: 7, key: 'requeue', kind: 'requeue', title: 'Noch einmal', items: [] });
  stages.push({
    nr: 8,
    key: 'recap',
    kind: 'recap',
    title: 'Geschafft',
    wordCount: (lektion.wortfeld || []).length,
    grammar: (lektion.notice && lektion.notice.title) || lektion.primarySlug || '',
  });

  return { stages, seed, attempt, level, lektionId: lektion.id, nr: lektion.nr };
}

export default buildLesson;
