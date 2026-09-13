// The lesson engine's builder: curriculum data + exercise pool → the ordered
// list of stages the player walks through (docs/course-standard-2026-09-12.md
// §3, shapes in docs/course-factory/a11-rebuild/CONTRACT.md).
//
// Pure and deterministic on purpose. The 7 controlled-practice items are drawn
// with a seeded PRNG keyed on (level, lektion nr, attempt), so tests can pin
// exactly which items a learner gets, a retry gives a DIFFERENT seven, and the
// page can rebuild the same lesson after a reload without storing the picks.
// The seed alone never made that true — DaF review #9 MAJOR 1 measured attempt 2
// repeating 62 of attempt 1's 84 items — so attempt n also EXCLUDES what the
// attempts before it drew (rule 7), and the attempt number itself is derived
// from the learner's own progress (`attemptFromCompletions`), not held at 1.
//
// SELECTION IS PLANNED FOR THE WHOLE LEVEL AT ONCE (`planPractice`), not per
// call. The DaF review of 2026-09-12 measured what a per-call draw produced:
// `das Mädchen` drilled in five of twelve Lektionen, eight items repeated
// verbatim in a later Lektion, the Lektion's OWN grammar point in the minority
// in L5 and L8, and not one item in 84 containing a word from the Lektion's
// Wortfeld other than by accident. None of that is visible from inside a single
// Lektion, so the plan walks the Lektionen in order and carries what has been
// used — see planPractice for the five rules it enforces.
import { isUsableItem, drillsSlug } from '../../data/lessonPools/quality.js';

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
/**
 * Second diversity axis: no ANSWER KEY may carry more than this many items in
 * one Lektion (DaF review #6). `MAX_SAME_LEMMA` reads `itemLemmas`, which runs
 * through `LEMMA_STOPWORDS` — and that list holds every article and possessive,
 * on purpose, so that "Schreiben Sie den Satz" items do not all look like the
 * same lexis. In the three Lektionen whose primary grammar IS the determiner
 * (L5 definite, L6 indefinite, L12 possessive) the lemma cap is therefore blind
 * to exactly the thing that has to vary: L12 gave five of seven items to `mein`
 * in BOTH attempts and never drew one of the three polite `Ihr` items the
 * Lektion exists to rehearse. The cap below counts what the item makes the
 * learner PRODUCE, function words included, so `Mein` × 5 cannot happen again.
 */
export const MAX_SAME_ANSWER_KEY = 2;
/**
 * Third diversity axis, one step coarser than `answerKey`: no TASK SHAPE may
 * carry more than this many items in one Lektion (DaF review #7 MAJOR 5).
 * `answerKey` compares what the learner produces, so it reads two error
 * corrections that differ only in their noun — "Ich bin eine Lehrerin." and
 * "Ich bin eine Verkäuferin.", both answered by deleting the article — as two
 * different items, and L6 drew both, in both attempts, out of seven. They are
 * the same exercise with a different profession: same prompt skeleton, same
 * rule, an answer that differs in one word. `taskShape` collapses exactly that:
 * one per Lektion, so the second seat goes to a different kind of task.
 */
export const MAX_SAME_TASK_SHAPE = 1;
/**
 * How many seeded tie-break orders the draw tries before it starts relaxing a
 * cap. The greedy pass takes the highest-ranked item that fits, which can walk
 * into a corner even when a seven under every cap exists — measured in L4,
 * which holds 20 usable items in 12 distinct task shapes and still needed the
 * lemma cap relaxed on the first order. A retry is free and deterministic; a
 * relaxed cap is a worse lesson.
 */
export const PICK_RETRIES = 8;
/**
 * How many DISTINCT draws one Lektion offers before the cycle starts over.
 * Measured on the shipped a1.1 pool with the prior-attempt filter of rule 7:
 * attempt 1→2 and 2→3 share at most two of seven items in every Lektion, while
 * a fourth draw would have to repeat — L8's whole topic slice is 19 usable
 * items, i.e. two and a half sevens. So the attempt number a learner's progress
 * derives cycles 1 → 2 → 3 → 1 rather than growing without bound.
 */
export const ATTEMPT_CYCLE = 3;

/**
 * The attempt number for a learner who has FINISHED this Lektion `completed`
 * times — the one thing `LessonPlayerPage` may not invent. It used to hold
 * `useState(1)` with no setter, so the repeat that the standard makes the
 * remediation path replayed the identical seven for ever (DaF review #9
 * MAJOR 1). Derived, never stored: no schema column, just the count of
 * completed runs the progress tables already carry.
 */
export const attemptFromCompletions = (completed, cycle = ATTEMPT_CYCLE) => {
  const n = Number.isFinite(Number(completed)) && Number(completed) > 0 ? Math.floor(Number(completed)) : 0;
  const span = Math.max(1, Math.floor(cycle) || 1);
  return 1 + (n % span);
};
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

/** Lower-cased, punctuation-free words of a text — used for function-word answers. */
const flat = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-zäöüß]+/g, ' ')
    .trim();

/**
 * What the item makes the learner PRODUCE, as one comparable key: the content
 * lemmas of the answer when it has any, and otherwise — an answer that is ONLY
 * function words, i.e. `Mein`, `Ihr`, `eine` — the bare first word of the
 * answer. Sorted, so two items asking for the same sentence in a different
 * order count as one key. `Mein` and `mein` are the same key by construction.
 */
export const answerKey = (item) => {
  const lemmas = answerLemmas(item);
  if (lemmas.size) return [...lemmas].sort().join(' ');
  return flat(item && item.answer).split(' ')[0] || '';
};

/** Quotation marks the pool uses around the sentence an item works on. */
const QUOTED = /[„“”"»]([^„“”"»«]+)[“”"«]/;
/**
 * The prompt without the exercise bank's task formula: the quoted sentence when
 * the prompt quotes one, else what follows the instruction's colon. Two items
 * can be the same exercise under different wrappers — "Korrigieren Sie: „Ich
 * bin eine Verkäuferin.“" and "Finden Sie den Fehler und schreiben Sie den
 * Satz richtig: „Ich bin eine Lehrerin.“" — and the shape has to see through
 * the wrapper, or it compares formulas instead of tasks.
 */
export const bare = (text) => {
  const s = String(text || '').trim();
  const quoted = s.match(QUOTED);
  if (quoted && quoted[1].trim()) return quoted[1];
  const formula = s.match(
    /^[^:()]*\b(?:bilden|bilde|schreiben|schreib|schreibe|korrigieren|korrigiere|ergänzen|ergänze|finden|finde|setzen|setze|wählen|wähle|antworten|antworte|buchstabieren|buchstabiere|lesen|lies|hören)\b[^:()]*:\s*(.+)$/i,
  );
  return formula ? formula[1] : s;
};

/** Lower-cased words of a text with the gap (`___`) kept as its own token. */
const withGaps = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/_+/g, ' _ ')
    .replace(/[^a-zäöüß_]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

/**
 * Words that belong to the TASK rather than to its content: the bracketed
 * instruction the pool prints after the sentence ("(der, die oder das?)",
 * "(formell)", "(Artikel)"). They stay in the skeleton because two items that
 * ask different questions about the same frame really are two tasks. Every
 * other word is content and is masked — see `taskShape`.
 */
export const TASK_WORDS = new Set([
  'artikel', 'präposition', 'plural', 'singular', 'satz', 'frage', 'antwort', 'fehler',
  'formell', 'informell', 'offiziell', 'höflich', 'höfliche', 'umgangssprachlich',
  'uhrzeit', 'zahl', 'zahlen', 'verb', 'nomen',
]);

/**
 * The item's TASK as one comparable key: its type plus the skeleton of its bare
 * prompt — the gap where it stands, the function words that make the frame, the
 * task formula, and a `·` for every CONTENT word.
 *
 * The mask used to be bound to word LENGTH (six letters, plus -in derivations),
 * and DaF review #9 MAJOR 2 measured what that cost: `uhr`, `stuhl`, `preis`,
 * `bild`, `buch` are shorter, so "___ Uhr ist alt. (der, die oder das?)" and
 * "___ Stuhl ist alt. (der, die oder das?)" were two different "task shapes"
 * and `MAX_SAME_TASK_SHAPE` bound in NONE of the 24 blocks — L4 drew four items
 * of one frame in both attempts while the guard reported seven distinct shapes.
 * The mask is bound to WORD CLASS instead: a token survives only if it is the
 * gap, a `LEMMA_STOPWORDS` function word, or a `TASK_WORDS` instruction word.
 * So the two sentences above are one key, and the cap binds for the first time.
 */
export const taskShape = (item) => {
  const skeleton = withGaps(bare(item && item.questionDe))
    .split(' ')
    .map((w) => (w === '_' || LEMMA_STOPWORDS.has(w) || TASK_WORDS.has(w) ? w : '·'))
    .join(' ');
  return `${(item && item.type) || ''}:${skeleton}`;
};

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
 *   4. one item for every answer key in `rule.mustCover` the pool can supply;
 *   5. no lemma more than `MAX_SAME_LEMMA` times, no answer key more than
 *      `MAX_SAME_ANSWER_KEY` times, no task shape more than
 *      `MAX_SAME_TASK_SHAPE` time, and at most `MAX_CARRIED_LEMMA` item
 *      repeating an answer lemma of the Lektion before;
 *   6. within each topic, the most situational items first (relevanceScore);
 *   7. none of the items this Lektion's EARLIER attempts drew (`priorAttemptIds`),
 *      while the topic slice can still fill seven without them — the repeat is
 *      the standard's remediation path, and DaF review #9 MAJOR 1 measured the
 *      seed alone giving attempt 2 sixty-two of attempt 1's eighty-four items.
 *
 * `options` is what only the LEVEL knows — pass nothing and it behaves like a
 * standalone draw (still filtered, still deterministic):
 *   { primarySlug, ownTerms, earlierTerms, usedIds, previousAnswerLemmas,
 *     priorAttemptIds }
 *
 * When the topic slice is too small the result is simply shorter rather than
 * padded with off-topic items — a short pool is a content bug, not something to
 * paper over. The caps of 5 are relaxed before the seven are given up on — the
 * carry-over first, then the lemma and answer-key caps, then the items the
 * EARLIER ATTEMPTS of this Lektion already showed (`priorAttemptIds`, rule 7),
 * and the task-shape cap last of all, because it is the coarsest and the one a
 * learner notices most.
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
  const priorIds = options.priorAttemptIds || new Set();

  // Cross-Lektion dedup, per topic: while this topic still has items no earlier
  // Lektion has shown, only those are eligible. A topic that is exhausted falls
  // back to its full slice rather than leaving the block short.
  // The answer keys `mustCover` reserves a seat for, normalised once.
  const coverKeys = [...new Set(
    ((rule && rule.mustCover) || []).map((k) => answerKey({ answer: k })).filter(Boolean),
  )];

  const eligible = [];
  for (const topic of topics) {
    const all = usable.filter((it) => it.topic === topic);
    const fresh = all.filter((it) => !usedIds.has(it.id));
    eligible.push(...(fresh.length ? fresh : all));
  }

  // ONE PASS of the greedy draw, under a given tie-break salt. The salt only
  // reorders items the relevance score cannot separate, so pass 0 is exactly
  // the draw as it was — but it lets the caller RETRY instead of relaxing a cap.
  // That matters since DaF review #9 MAJOR 2 bound `MAX_SAME_TASK_SHAPE` to the
  // word class: L4 has 20 usable items in 12 distinct shapes, a seven under
  // every cap exists, and the first greedy order simply walked into a corner and
  // relaxed the lemma cap to get out of it. Relaxation is for a pool that CANNOT
  // fill seven, not for an unlucky order.
  const runPass = (salt) => {
    const passSeed = (seed + Math.imul(salt, 0x9e3779b1)) >>> 0;
    const ranked = eligible
      .map((it) => ({
        it,
        score: relevanceScore(it, ownTerms, earlierTerms),
        key: jitter(passSeed, it.id),
      }))
      .sort((a, b) => b.score - a.score || a.key - b.key || String(a.it.id).localeCompare(String(b.it.id)))
      .map((r) => r.it);

    const chosen = new Map();
    const lemmaCount = new Map();
    const answerKeyCount = new Map();
    const taskShapeCount = new Map();
    let mc = 0;
    let typed = 0;
    let carried = 0;
    let relaxUsed = 0;

    const carriesOver = (it) => [...answerLemmas(it)].some((l) => carriedLemmas.has(l));

    const fits = (it, relax) => {
      if (chosen.has(it.id) || chosen.size >= PRACTICE_SIZE) return false;
      if (isMultipleChoice(it) && mc >= MAX_MULTIPLE_CHOICE) return false;
      if (!relax.lemma) {
        for (const l of itemLemmas(it)) if ((lemmaCount.get(l) || 0) >= MAX_SAME_LEMMA) return false;
      }
      if (!relax.answerKey) {
        const k = answerKey(it);
        if (k && (answerKeyCount.get(k) || 0) >= MAX_SAME_ANSWER_KEY) return false;
      }
      if (!relax.taskShape) {
        const shape = taskShape(it);
        if (shape && (taskShapeCount.get(shape) || 0) >= MAX_SAME_TASK_SHAPE) return false;
      }
      if (!relax.carried && carried >= MAX_CARRIED_LEMMA && carriesOver(it)) return false;
      if (!relax.prior && priorIds.has(it.id)) return false;
      return true;
    };

    const take = (it, stage = 0) => {
      chosen.set(it.id, it);
      relaxUsed = Math.max(relaxUsed, stage);
      if (isMultipleChoice(it)) mc += 1;
      if (isTypedItem(it)) typed += 1;
      if (carriesOver(it)) carried += 1;
      for (const l of itemLemmas(it)) lemmaCount.set(l, (lemmaCount.get(l) || 0) + 1);
      const k = answerKey(it);
      if (k) answerKeyCount.set(k, (answerKeyCount.get(k) || 0) + 1);
      const shape = taskShape(it);
      if (shape) taskShapeCount.set(shape, (taskShapeCount.get(shape) || 0) + 1);
    };

    // The cover pass (DaF review #6 MAJOR 6, second half). `MAX_SAME_ANSWER_KEY`
    // is a CEILING on repetition and a ceiling cannot reserve a seat: L12 holds 38
    // usable possessive items, the three polite `Ihr` ones score no higher than a
    // dozen others, so which of them lands in the seven was decided by the seeded
    // jitter — and on attempt 1 none of them did. `practiceRule.mustCover` lists
    // the answer keys the Lektion EXISTS to rehearse (L12: the polite `Ihr`, the
    // form Schreiben Teil 2 and Sprechen Teil 3 are graded on; L8: `halb` and the
    // official `vierzehn Uhr dreißig`); one usable item per key is taken first,
    // typed and on the primary slug for preference, under the same caps as every
    // other pick. A key the pool cannot supply is a no-op — the draw is never
    // padded with something off-topic to satisfy it.
    for (const key of coverKeys) {
      if (chosen.size >= PRACTICE_SIZE) break;
      const candidates = ranked.filter((it) => answerKey(it) === key);
      const preferred = [
        ...candidates.filter((it) => it.topic === primarySlug && isTypedItem(it)),
        ...candidates.filter((it) => it.topic === primarySlug),
        ...candidates.filter(isTypedItem),
        ...candidates,
      ];
      // A key an earlier attempt already covered is still a key this attempt
      // must cover: the prior-attempt filter is tried first and given up for the
      // cover pass alone, so `mustCover` never goes unmet because of rule 7.
      const pick = preferred.find((it) => fits(it, {})) || preferred.find((it) => fits(it, { prior: true }));
      if (pick) take(pick);
    }

    const primaryCount = () => [...chosen.values()].filter((it) => it.topic === primarySlug).length;
    const primaryTarget = Math.min(
      PRIMARY_MIN,
      PRACTICE_SIZE,
      ranked.filter((it) => it.topic === primarySlug).length,
    );

    const fill = (list, relax, stop, stage) => {
      for (const it of list) {
        if (stop()) break;
        if (fits(it, relax)) take(it, stage);
      }
    };

    // The shape cap is given up LAST: a Lektion that cannot otherwise fill seven
    // takes a repeated task shape rather than coming out short, but only after
    // the lemma, carry-over, answer-key and prior-attempt filters have gone.
    const LADDER = [
      {},
      { carried: true },
      { lemma: true, carried: true, answerKey: true },
      { lemma: true, carried: true, answerKey: true, prior: true },
      { lemma: true, carried: true, answerKey: true, prior: true, taskShape: true },
    ];
    for (let stage = 0; stage < LADDER.length; stage += 1) {
      const relax = LADDER[stage];
      // 1. the primary slug's share, REAL producers and typed items first. The
      //    slug on an item is a routing label; `drillsSlug` reads what the item
      //    makes the learner produce. Attempt 1 used to take whichever labelled
      //    items ranked highest, which left attempt 2 — which may not repeat
      //    them — with the labelled non-producers: L3, L7, L10 and L11 fell under
      //    PRIMARY_MIN on the second draw although every one of them holds ten
      //    or more real producers on its own slug.
      const primary = ranked.filter((it) => it.topic === primarySlug);
      const real = primary.filter((it) => drillsSlug(it, primarySlug));
      const rest = primary.filter((it) => !drillsSlug(it, primarySlug));
      fill(real.filter(isTypedItem), relax, () => primaryCount() >= primaryTarget, stage);
      fill(real, relax, () => primaryCount() >= primaryTarget, stage);
      fill(rest.filter(isTypedItem), relax, () => primaryCount() >= primaryTarget, stage);
      fill(rest, relax, () => primaryCount() >= primaryTarget, stage);
      // 2. the typed floor across all topics
      fill(ranked.filter(isTypedItem), relax, () => typed >= typedMin || chosen.size >= PRACTICE_SIZE, stage);
      // 3. fill up to seven
      fill(ranked, relax, () => chosen.size >= PRACTICE_SIZE, stage);
      if (chosen.size >= PRACTICE_SIZE && primaryCount() >= primaryTarget && typed >= Math.min(typedMin, PRACTICE_SIZE)) break;
    }

    const complete = chosen.size >= PRACTICE_SIZE
      && primaryCount() >= primaryTarget
      && typed >= Math.min(typedMin, PRACTICE_SIZE);
    return { chosen, relaxUsed, complete, size: chosen.size };
  };

  let best = null;
  for (let salt = 0; salt < PICK_RETRIES; salt += 1) {
    const pass = runPass(salt);
    const better = !best
      || (pass.complete && !best.complete)
      || (pass.complete === best.complete && pass.relaxUsed < best.relaxUsed)
      || (pass.complete === best.complete && pass.relaxUsed === best.relaxUsed && pass.size > best.size);
    if (better) best = pass;
    if (best.complete && best.relaxUsed === 0) break;
  }
  const chosen = best.chosen;

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

  // What the earlier attempts of each Lektion already showed. The seed alone
  // does not make a second draw a second draw — DaF review #9 MAJOR 1 measured
  // 62 of 84 items repeating between attempt 1 and 2, all seven in L2 and L8 —
  // so every attempt above 1 is planned against the union of the attempts
  // before it, which `pickPracticeItems` excludes until it has to relax.
  const priorByNr = new Map();
  for (let earlier = 1; earlier < attempt; earlier += 1) {
    for (const [nr, items] of planPractice(curriculum, pool, earlier)) {
      const seen = priorByNr.get(nr) || new Set();
      for (const it of items) seen.add(it.id);
      priorByNr.set(nr, seen);
    }
  }

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
        priorAttemptIds: priorByNr.get(lektion.nr) || new Set(),
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
