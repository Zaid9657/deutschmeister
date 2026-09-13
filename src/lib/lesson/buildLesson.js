// The lesson engine's builder: curriculum data + exercise pool → the ordered
// list of stages the player walks through (docs/course-standard-2026-09-12.md
// §3, shapes in docs/course-factory/a11-rebuild/CONTRACT.md).
//
// Pure and deterministic on purpose. The 7 controlled-practice items are drawn
// with a seeded PRNG keyed on (level, lektion nr, attempt), so tests can pin
// exactly which items a learner gets, a retry gives a DIFFERENT seven, and the
// page can rebuild the same lesson after a reload without storing the picks.
//
// SELECTION IS PLANNED FOR THE WHOLE LEVEL AT ONCE (`planPractice`), not per
// call. The DaF review of 2026-09-12 measured what a per-call draw produced:
// `das Mädchen` drilled in five of twelve Lektionen, eight items repeated
// verbatim in a later Lektion, the Lektion's OWN grammar point in the minority
// in L5 and L8, and not one item in 84 containing a word from the Lektion's
// Wortfeld other than by accident. None of that is visible from inside a single
// Lektion, so the plan walks the Lektionen in order and carries what has been
// used — see planPractice for the five rules it enforces.
import { isUsableItem } from '../../data/lessonPools/quality.js';

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
/** The Lektion's own grammar point must supply at least this many of the seven. */
export const PRIMARY_MIN = 4;
/** No lemma (Mädchen, Uhr, Auto …) may carry more than this many items in one Lektion. */
export const MAX_SAME_LEMMA = 2;
/** At most this many items whose answer lemma was already an answer in the Lektion before. */
export const MAX_CARRIED_LEMMA = 1;
/** Weights for situational relevance: the Lektion's own Wortfeld vs. an earlier one's. */
export const OWN_TERM_WEIGHT = 3;
export const EARLIER_TERM_WEIGHT = 1;

/**
 * Words that carry no situation: articles, pronouns, sein/haben, the prompt
 * boilerplate of the exercise bank ("Schreib den Satz richtig", "Welcher
 * Artikel passt?") and the grammar meta-vocabulary. They are ignored both when
 * scoring relevance and when counting how often a lemma is drilled — without
 * this, every "Schreib das Wort" item would look like the same lemma.
 */
export const LEMMA_STOPWORDS = new Set([
  // Artikel, Pronomen, Determinative
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'kein', 'keine', 'keinen', 'keinem', 'keiner', 'mein', 'meine', 'meinen', 'meinem', 'meiner',
  'dein', 'deine', 'deinen', 'deinem', 'deiner', 'sein', 'seine', 'seinen', 'seinem', 'seiner',
  'ihr', 'ihre', 'ihren', 'ihrem', 'ihrer', 'unser', 'unsere', 'unseren', 'euer', 'eure',
  'ich', 'sie', 'wir', 'man', 'mich', 'dich', 'ihn', 'uns', 'euch', 'mir', 'dir', 'ihm', 'ihnen',
  // sein und haben
  'bin', 'bist', 'ist', 'sind', 'seid', 'habe', 'hast', 'hat', 'haben', 'habt',
  // Fragewörter und kleine Wörter
  'was', 'wie', 'wer', 'wen', 'wem', 'wann', 'wohin', 'woher', 'warum', 'welche', 'welcher',
  'welches', 'und', 'oder', 'aber', 'auch', 'nicht', 'noch', 'schon', 'sehr', 'nur', 'dann',
  'hier', 'aus', 'auf', 'mit', 'für', 'von', 'zum', 'zur', 'ins', 'ans', 'vom', 'beim',
  // Aufgabenformeln des Übungspools. Only the words that carry NO information
  // about what an item drills belong here: "Artikel", "Präposition",
  // "umgangssprachlich", "Satz", "Fehler" and "Frage" are deliberately absent,
  // because they mark a template — and capping a template at MAX_SAME_LEMMA is
  // exactly what stops a Lektion turning into four times "Es ist ___ (2:45)".
  'schreib', 'schreibe', 'schreibweise', 'wort', 'wörter', 'richtig', 'falsch',
  'buchstabiert', 'finde', 'ergänze', 'setze', 'wähle', 'bedeutet', 'heißt',
  'sagt', 'sagen', 'macht', 'gut', 'neu', 'alt',
  // The Sie-forms of the same formulas. REVIEW #3 asked for the whole pool to
  // address an adult learner in the Sie-register, and scripts/build-lesson-pool.mjs
  // now rewrites "Schreib …" to "Schreiben Sie …" at build time. Without these
  // the rewritten task words would count as content lemmas, MAX_SAME_LEMMA would
  // cap the templates at two, and a Lektion built on them would come out thin —
  // the stoplist has to follow the register, not the other way round.
  'schreiben', 'bilden', 'bilde', 'korrigieren', 'korrigiere', 'ergänzen',
  'setzen', 'wählen', 'finden', 'hören', 'antworten', 'antworte',
]);

const tokens = (text) =>
  String(text || '')
    .toLowerCase()
    .split(/[^a-zäöüß]+/)
    .filter((w) => w.length > 2);

/** The words of a text that actually name something — the stoplist removed. */
export const contentLemmas = (text) => new Set(tokens(text).filter((w) => !LEMMA_STOPWORDS.has(w)));

/** Everything the item talks about: prompt AND answer (Mädchen usually sits in the prompt). */
export const itemLemmas = (item) => contentLemmas(`${item.questionDe || ''} ${item.answer || ''}`);

/** Only what the item makes the learner produce — used for the carry-over rule. */
export const answerLemmas = (item) => contentLemmas(item.answer || '');

/** The situational vocabulary of one Lektion, as lemmas. */
export function wortfeldTerms(lektion) {
  const out = new Set();
  for (const w of (lektion && lektion.wortfeld) || []) {
    for (const t of contentLemmas(`${w.word || ''} ${w.de || ''}`)) out.add(t);
  }
  return out;
}

/** A term hits a token when one is the other, or a prefix of it (Wortfeld vs. inflection). */
const termHits = (term, toks) =>
  toks.some((t) => t === term || (term.length >= 4 && t.startsWith(term)) || (t.length >= 4 && term.startsWith(t)));

/**
 * How situational an item is for this Lektion: every Wortfeld word of the
 * Lektion that turns up in the prompt or answer counts triple, every word from
 * an EARLIER Lektion counts once (revision is welcome, it is just worth less).
 */
export function relevanceScore(item, ownTerms, earlierTerms) {
  const toks = tokens(`${item.questionDe || ''} ${item.answer || ''}`);
  let score = 0;
  for (const term of ownTerms || []) if (termHits(term, toks)) score += OWN_TERM_WEIGHT;
  for (const term of earlierTerms || []) {
    if ((ownTerms && ownTerms.has && ownTerms.has(term)) || !termHits(term, toks)) continue;
    score += EARLIER_TERM_WEIGHT;
  }
  return score;
}

/** Order-independent per-item jitter, so ties break deterministically per seed. */
function jitter(seed, id) {
  let h = (seed >>> 0) ^ 2166136261;
  const key = String(id);
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function seededShuffle(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The 7 controlled-practice items for ONE Lektion.
 *
 * Guarantees, in this order of priority:
 *   1. `PRIMARY_MIN` (4) items from the Lektion's own grammar point, whenever
 *      that topic can supply them — the review found L5 drawing 2 of 7 and L8
 *      drawing 2 of 7 on their own primary slug;
 *   2. at least `rule.typedMin` typed items and at most two multiple_choice;
 *   3. seven items in total, all from `rule.topics`;
 *   4. no lemma more than `MAX_SAME_LEMMA` times, and at most
 *      `MAX_CARRIED_LEMMA` item repeating an answer lemma of the Lektion before;
 *   5. within each topic, the most situational items first (relevanceScore).
 *
 * `options` is what only the LEVEL knows — pass nothing and it behaves like a
 * standalone draw (still filtered, still deterministic):
 *   { primarySlug, ownTerms, earlierTerms, usedIds, previousAnswerLemmas }
 *
 * When the topic slice is too small the result is simply shorter rather than
 * padded with off-topic items — a short pool is a content bug, not something to
 * paper over. Constraints 4 and 1 are relaxed (in that order) before the seven
 * are given up on, so a thin topic still yields a full block.
 */
export function pickPracticeItems(pool, rule, seed, options = {}) {
  const topicList = (rule && rule.topics) || [];
  const topics = new Set(topicList);
  const typedMin = Math.max(0, (rule && rule.typedMin) || 0);
  const usable = poolItems(pool).filter((it) => topics.has(it.topic) && isUsableItem(it));
  if (!usable.length) return [];

  const primarySlug = options.primarySlug || topicList[0];
  const ownTerms = options.ownTerms || new Set();
  const earlierTerms = options.earlierTerms || new Set();
  const usedIds = options.usedIds || new Set();
  const carriedLemmas = options.previousAnswerLemmas || new Set();

  // Cross-Lektion dedup, per topic: while this topic still has items no earlier
  // Lektion has shown, only those are eligible. A topic that is exhausted falls
  // back to its full slice rather than leaving the block short.
  const eligible = [];
  for (const topic of topics) {
    const all = usable.filter((it) => it.topic === topic);
    const fresh = all.filter((it) => !usedIds.has(it.id));
    eligible.push(...(fresh.length ? fresh : all));
  }

  const ranked = eligible
    .map((it) => ({
      it,
      score: relevanceScore(it, ownTerms, earlierTerms),
      key: jitter(seed, it.id),
    }))
    .sort((a, b) => b.score - a.score || a.key - b.key || String(a.it.id).localeCompare(String(b.it.id)))
    .map((r) => r.it);

  const chosen = new Map();
  const lemmaCount = new Map();
  let mc = 0;
  let typed = 0;
  let carried = 0;

  const carriesOver = (it) => [...answerLemmas(it)].some((l) => carriedLemmas.has(l));

  const fits = (it, relax) => {
    if (chosen.has(it.id)) return false;
    if (isMultipleChoice(it) && mc >= MAX_MULTIPLE_CHOICE) return false;
    if (!relax.lemma) {
      for (const l of itemLemmas(it)) if ((lemmaCount.get(l) || 0) >= MAX_SAME_LEMMA) return false;
    }
    if (!relax.carried && carried >= MAX_CARRIED_LEMMA && carriesOver(it)) return false;
    return true;
  };

  const take = (it) => {
    chosen.set(it.id, it);
    if (isMultipleChoice(it)) mc += 1;
    if (isTypedItem(it)) typed += 1;
    if (carriesOver(it)) carried += 1;
    for (const l of itemLemmas(it)) lemmaCount.set(l, (lemmaCount.get(l) || 0) + 1);
  };

  const primaryCount = () => [...chosen.values()].filter((it) => it.topic === primarySlug).length;
  const primaryTarget = Math.min(
    PRIMARY_MIN,
    PRACTICE_SIZE,
    ranked.filter((it) => it.topic === primarySlug).length,
  );

  const fill = (list, relax, stop) => {
    for (const it of list) {
      if (stop()) break;
      if (fits(it, relax)) take(it);
    }
  };

  for (const relax of [{}, { carried: true }, { lemma: true, carried: true }]) {
    // 1. the primary slug's share, typed items first so the typed floor is cheap
    const primary = ranked.filter((it) => it.topic === primarySlug);
    fill(primary.filter(isTypedItem), relax, () => primaryCount() >= primaryTarget);
    fill(primary, relax, () => primaryCount() >= primaryTarget);
    // 2. the typed floor across all topics
    fill(ranked.filter(isTypedItem), relax, () => typed >= typedMin || chosen.size >= PRACTICE_SIZE);
    // 3. fill up to seven
    fill(ranked, relax, () => chosen.size >= PRACTICE_SIZE);
    if (chosen.size >= PRACTICE_SIZE && primaryCount() >= primaryTarget && typed >= Math.min(typedMin, PRACTICE_SIZE)) break;
  }

  // Present them in a seeded order so typed and recognition interleave.
  return seededShuffle([...chosen.values()], mulberry32(seed));
}

const planCache = new WeakMap();

/**
 * planPractice(curriculum, pool, attempt) → Map<lektion.nr, items[]>
 *
 * The whole level in one deterministic pass. Walking the Lektionen in order is
 * what makes the two cross-Lektion rules possible at all: an item drawn by
 * Lektion 3 is off the table for Lektion 7 while that topic still has unseen
 * items, and a Lektion may carry over at most one answer lemma from the one
 * before it. `buildLesson` reads the plan rather than drawing on its own, so a
 * single lesson and the whole course always agree.
 *
 * Memoised per (curriculum, pool, attempt): the plan is pure, and the player
 * rebuilds a lesson on every render.
 */
export function planPractice(curriculum, pool, attempt = 1) {
  const level = (curriculum && curriculum.level) || 'a1.1';
  let byPool = planCache.get(curriculum || {});
  if (curriculum && !byPool) {
    byPool = new WeakMap();
    planCache.set(curriculum, byPool);
  }
  const poolKey = pool && typeof pool === 'object' ? pool : null;
  let byAttempt = byPool && poolKey ? byPool.get(poolKey) : null;
  if (byPool && poolKey && !byAttempt) {
    byAttempt = new Map();
    byPool.set(poolKey, byAttempt);
  }
  if (byAttempt && byAttempt.has(attempt)) return byAttempt.get(attempt);

  const lektionen = [...((curriculum && curriculum.lektionen) || [])].sort((a, b) => a.nr - b.nr);
  const plan = new Map();
  const usedIds = new Set();
  const earlierTerms = new Set();
  let previousAnswerLemmas = new Set();

  for (const lektion of lektionen) {
    const ownTerms = wortfeldTerms(lektion);
    const items = pickPracticeItems(
      pool,
      lektion.practiceRule || { topics: [], typedMin: 0 },
      seedFor(level, lektion.nr, attempt),
      {
        primarySlug: lektion.primarySlug || ((lektion.practiceRule || {}).topics || [])[0],
        ownTerms,
        earlierTerms: new Set(earlierTerms),
        usedIds: new Set(usedIds),
        previousAnswerLemmas,
      },
    );
    plan.set(lektion.nr, items);
    for (const it of items) usedIds.add(it.id);
    previousAnswerLemmas = new Set(items.flatMap((it) => [...answerLemmas(it)]));
    for (const t of ownTerms) earlierTerms.add(t);
  }

  if (byAttempt) byAttempt.set(attempt, plan);
  return plan;
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

  // The plan owns the draw (cross-Lektion dedup); a Lektion the curriculum does
  // not list — the dev preview screen — falls back to a standalone draw.
  const plan = planPractice(curriculum, pool, attempt);
  const practice = plan.get(lektion.nr)
    || pickPracticeItems(pool, lektion.practiceRule || { topics: [], typedMin: 0 }, seed, {
      primarySlug: lektion.primarySlug,
      ownTerms: wortfeldTerms(lektion),
    });
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
