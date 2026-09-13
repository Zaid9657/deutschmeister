// The checkpoint builder (docs/course-standard-2026-09-12.md §3, "Checkpoint").
//
// One checkpoint = 20 items in 5 sections — 5 Hören, 4 Lesen, 6 Sprachbausteine
// (typed), 3 Schreiben, 2 Sprechen — assembled from the curriculum's own
// dialogues and Wortfelder plus the existing grammar pool
// (src/data/lessonPools/<level>.json). Nothing here is retyped content: every
// item derives from the curriculum module or the pool (CONTRACT.md, "derive,
// never retype").
//
// Two rules the standard fixes and this file implements literally:
//   - 70 % of the POOL-drawn items come from the chapter's own Lektionen and
//     30 % from earlier chapters (only once earlier chapters exist). Nine items
//     are pool-drawn, so that is 7 / 2.
//   - Pass = 60 % overall AND no scored section below 40 % (the Goethe/telc
//     mirror). Sprechen is the one section whose scored-ness depends on the
//     RUN, not on the build: every read-aloud can be scored by the microphone
//     (netlify/functions/score-readaloud), but only if the learner actually
//     recorded it. So the items ship `scored: false, scorable: true`, and
//     scoreCheckpoint promotes the section to scored — into the overall AND
//     into the 40 % rule — only when EVERY item in it came back with a mic
//     result. A self-confirm anywhere in the section keeps the whole section
//     out of the result, because half a Sprechen score is not a Sprechen
//     score.
//   - Schreiben is one REAL writing task (the chapter's own, from
//     src/data/writingTasks.js, AI-graded by evaluate-writing through
//     GradedWriting) plus two sentence-building drills from two different
//     Lektionen. The task is `optional: true`: without a grader verdict it is
//     not attempted rather than wrong, and the section scores over the drills.
//
// Everything is deterministic in `seed` (mulberry32), so tests can pin the
// exact 20 items and "Nochmal" can reshuffle the ORDER without changing the
// test a learner already saw.
import { checkAnswer, tagError, RESULT, checkOptionsFor } from '../lesson/check.js';
import { courseWritingTasks, writingTaskByKey } from '../../data/writingTasks.js';
import { knownUpTo, untaughtTokens, namesOf } from './lexis.js';

export const SECTION_ORDER = ['hoeren', 'lesen', 'bausteine', 'schreiben', 'sprechen'];

export const SECTION_LABELS = {
  hoeren: 'Hören',
  lesen: 'Lesen',
  bausteine: 'Sprachbausteine',
  schreiben: 'Schreiben',
  sprechen: 'Sprechen',
};

export const SECTION_COUNTS = { hoeren: 5, lesen: 4, bausteine: 6, schreiben: 3, sprechen: 2 };

export const CHECKPOINT_ITEM_COUNT = 20;
export const PASS_OVERALL_PCT = 60;
export const PASS_SECTION_PCT = 40;
/** Of the nine pool-drawn items: 7 from this chapter, 2 from earlier ones. */
export const POOL_ITEMS_TOTAL = 9;
export const POOL_ITEMS_EARLIER = POOL_ITEMS_TOTAL - Math.ceil(POOL_ITEMS_TOTAL * 0.7); // 2

// ── deterministic randomness ────────────────────────────────────────────────

/** mulberry32 — 32-bit PRNG, same sequence for the same seed in every runtime. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash so a string seed ("a1.1-cp1") behaves like a number. */
export function hashSeed(value) {
  const s = String(value ?? '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Fisher-Yates with an injected rng — never mutates the input. */
export function shuffle(list, rng) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const take = (list, n) => list.slice(0, Math.max(0, n));

// ── curriculum slicing ──────────────────────────────────────────────────────

/** The Lektionen this checkpoint closes (previous checkpoint, exclusive → this one). */
export function chapterLektionen(curriculum, checkpoint) {
  const cps = curriculum?.checkpoints || [];
  const idx = cps.findIndex((c) => c.nr === checkpoint.nr);
  const prev = idx > 0 ? cps[idx - 1].afterLektion : 0;
  return (curriculum?.lektionen || []).filter((l) => l.nr > prev && l.nr <= checkpoint.afterLektion);
}

/** Everything before this chapter — the 30 % interleave, empty at checkpoint 1. */
export function earlierLektionen(curriculum, checkpoint) {
  const cps = curriculum?.checkpoints || [];
  const idx = cps.findIndex((c) => c.nr === checkpoint.nr);
  const prev = idx > 0 ? cps[idx - 1].afterLektion : 0;
  return (curriculum?.lektionen || []).filter((l) => l.nr <= prev);
}

/** Pool topics a set of Lektionen practises (practiceRule wins, grammarSlugs fall back). */
export function topicsOf(lektionen) {
  const out = [];
  for (const l of lektionen || []) {
    for (const t of l?.practiceRule?.topics || l?.grammarSlugs || []) if (!out.includes(t)) out.push(t);
  }
  return out;
}

/** Flatten the chapter's dialogue lines, keeping where each line came from. */
export function dialogLines(lektionen) {
  const out = [];
  for (const l of lektionen || []) {
    (l?.dialog?.lines || []).forEach((line, idx) => {
      out.push({ lektionNr: l.nr, lektionId: l.id, dialogTitle: l.dialog?.title || l.title, idx, ...line });
    });
  }
  return out;
}

/** Flatten the chapter's Wortfeld entries. */
export function wortfeldWords(lektionen) {
  const out = [];
  for (const l of lektionen || []) for (const w of l?.wortfeld || []) out.push({ lektionNr: l.nr, lektionId: l.id, ...w });
  return out;
}

// ── pool access ─────────────────────────────────────────────────────────────

/** The pool ships as { level, items: [...] }; an array is accepted too. */
export const poolItems = (pool) => (Array.isArray(pool) ? pool : pool?.items || []);

/** Typed = fill_blank without options, sentence_building, error_correction. */
export const isTyped = (item) =>
  item?.type === 'sentence_building' ||
  item?.type === 'error_correction' ||
  (item?.type === 'fill_blank' && !(item.options && item.options.length));

/**
 * A NEXT-LEVEL PREVIEW IS NOT CHECKPOINT MATERIAL (DaF review #7, BLOCKER 3).
 * `03bd1113` shipped as `a1.1-cp4-bausteine-4`: a possessive gap after *haben*
 * whose key is the ACCUSATIVE form of the 2nd-person possessive, one of six
 * Sprachbausteine in the GRADED closing checkpoint, under a `STRICT_TOPIC`
 * with no typo tolerance — and its own explanation says „Vorschau auf den
 * Akkusativ (A1.2)“. The course never teaches that form: L12's notice teaches
 * the bare nominative before a masculine noun, and the rule card says the -e
 * comes only before feminines and plurals. So the learner is marked wrong for
 * applying the rule card the course gave him.
 *
 * The rule that belongs in the builder of the pool — no item may demand a form
 * no notice and no rule card of the level introduces — is being added there by
 * another agent. This is the belt-and-braces half, at the checkpoint's own
 * pool door: an item that calls ITSELF a preview is rejected outright, not
 * merely sorted to the back like untaught lexis (see untaughtAt), because a
 * short section is a smaller failure than a graded item the course contradicts.
 * Every pool draw in this file goes through byTopics, so this is the one gate.
 */
export const NEXT_LEVEL_RE = /Vorschau|A1\.2|kommt in A1/i;

/** Does this pool item advertise itself as a preview of the next level? */
export const isNextLevelPreview = (item) =>
  NEXT_LEVEL_RE.test([item?.questionDe, item?.promptDe, item?.explanationDe, item?.hint].filter(Boolean).join(' '));

const byTopics = (pool, topics) => {
  const wanted = new Set(topics);
  return poolItems(pool)
    .filter((i) => wanted.has(i.topic) && !isNextLevelPreview(i))
    .sort((a, b) => (a.topic === b.topic ? (a.order || 0) - (b.order || 0) : a.topic < b.topic ? -1 : 1));
};

/**
 * THE LEXIS FILTER (DaF review #6, MAJOR 8). A checkpoint may not ask for a word
 * the course has not taught by the end of the chapter it closes:
 * `a1.1-cp2-schreiben-1` was „[Honig / ist / gut]“ in a chapter about a
 * Flohmarkt, a Klassenzimmer and a Büro, first of three items in a GRADED
 * Schreiben section, and eleven of the 80 items carried lexis like it.
 *
 * `untaughtAt(curriculum, lastLektionNr)` returns the predicate the draw sorts
 * by — the validator's own RULE 11 machinery (src/lib/checkpoint/lexis.js), so
 * "untaught" means here exactly what it means in
 * `node scripts/validate-curriculum.mjs`.
 *
 * It SORTS rather than filters: an item with untaught lexis goes to the back of
 * its bucket and is drawn only when the pool has nothing clean left for that
 * section. A hard filter would make a thin topic ship a 19-item checkpoint, and
 * a short exam is a worse failure than a hard word — the measurement that
 * matters is the one the test makes (all 80 A1.1 items clean), not the
 * mechanism. A level with no lexis tables (see LEXIS_LEVELS) sorts by nothing.
 */
function untaughtAt(curriculum, lastNr) {
  const known = knownUpTo(curriculum, lastNr);
  if (!known) return () => false;
  const names = namesOf(curriculum?.level);
  const cache = new Map();
  return (item) => {
    const id = item?.id;
    if (id && cache.has(id)) return cache.get(id);
    const dirty = untaughtTokens(item, known, names).length > 0;
    if (id) cache.set(id, dirty);
    return dirty;
  };
}

/**
 * Draw `n` pool items for `topics`, taught-lexis first and typed first within
 * that, deterministically and without repeating anything in `usedIds`. Topics
 * are visited round-robin so one fat topic cannot crowd the others out.
 */
function drawPool(pool, topics, n, rng, usedIds, { typedOnly = false, untaught = () => false } = {}) {
  if (n <= 0 || !topics.length) return [];
  const buckets = topics.map((topic) => {
    const all = shuffle(byTopics(pool, [topic]).filter((i) => !usedIds.has(i.id)), rng);
    const pick = (dirty) => {
      const some = all.filter((i) => untaught(i) === dirty);
      const typed = some.filter(isTyped);
      return typedOnly ? typed : [...typed, ...some.filter((i) => !isTyped(i))];
    };
    return [...pick(false), ...pick(true)];
  });
  const out = [];
  let progress = true;
  while (out.length < n && progress) {
    progress = false;
    for (const bucket of buckets) {
      if (out.length >= n) break;
      const next = bucket.shift();
      if (!next) continue;
      progress = true;
      out.push(next);
      usedIds.add(next.id);
    }
  }
  return out;
}

/** A pool row → a checkpoint item. */
function fromPoolItem(poolItem, { id, section, source, register = null }) {
  const hasOptions = Boolean(poolItem.options && poolItem.options.length);
  return {
    id,
    section,
    kind: hasOptions ? 'choice' : 'typed',
    mode: hasOptions ? 'options' : 'typed',
    topic: poolItem.topic,
    lektionNr: null,
    source,
    register,
    scored: true,
    promptDe: poolItem.questionDe,
    promptEn: poolItem.questionEn || null,
    audioText: null,
    text: null,
    options: hasOptions ? poolItem.options : null,
    answer: poolItem.answer,
    accepted: [poolItem.answer, ...(poolItem.accepted || [])].filter(Boolean),
    // Carried through so isCaseTask sees it here exactly as PracticeItem.jsx
    // does for the same pool item in the lesson (REVIEW #4 BLOCKER 3).
    caseSensitive: poolItem.caseSensitive === true,
    explanationDe: poolItem.explanationDe || null,
    hint: poolItem.hint || null,
    poolItemId: poolItem.id,
    type: poolItem.type,
  };
}

// ── the five sections ───────────────────────────────────────────────────────

// Hören: 3 full-line dictations from the chapter's dialogues + 2 "Welches Wort
// hören Sie?" items built from the Wortfeld (correct word + 3 Wortfeld
// distractors). Audio is window.speechSynthesis in v1 (CONTRACT.md).
function buildHoeren(ctx) {
  const { checkpoint, rng, chapter } = ctx;
  const items = [];
  const lines = shuffle(dialogLines(chapter), rng);
  take(lines, 3).forEach((line, i) => {
    items.push({
      id: `${checkpoint.id}-hoeren-${i + 1}`,
      section: 'hoeren',
      kind: 'dictation',
      mode: 'typed',
      topic: 'hoeren',
      lektionNr: line.lektionNr,
      // Where the audio comes from: playLine(lektionId, lineKey, text) plays
      // the recording when the manifest has one, the synthesiser when not.
      lektionId: line.lektionId || null,
      lineKey: `line-${line.idx}`,
      source: 'chapter',
      register: null,
      scored: true,
      promptDe: 'Hören Sie zu und schreiben Sie den Satz.',
      promptEn: 'Listen and type the sentence.',
      audioText: line.de,
      text: null,
      options: null,
      answer: line.de,
      accepted: [line.de],
      explanationDe: line.en ? `${line.de} — ${line.en}` : null,
      hint: `Lektion ${line.lektionNr}`,
      poolItemId: null,
      type: 'dictation',
    });
  });

  const words = shuffle(wortfeldWords(chapter), rng);
  const targets = take(words, 2);
  targets.forEach((word, i) => {
    const others = words.filter((w) => w.de !== word.de);
    const distractors = take(others.slice(i * 3), 3);
    while (distractors.length < 3 && others.length) distractors.push(others[distractors.length % others.length]);
    const options = shuffle([word.de, ...new Set(distractors.map((d) => d.de))], rng);
    items.push({
      id: `${checkpoint.id}-hoeren-${i + 4}`,
      section: 'hoeren',
      kind: 'wordChoice',
      mode: 'options',
      topic: 'hoeren',
      lektionNr: word.lektionNr,
      // No manifest key for a single word (words carry their own audio_url),
      // so this one always synthesises.
      lektionId: word.lektionId || null,
      lineKey: null,
      source: 'chapter',
      register: null,
      scored: true,
      promptDe: 'Welches Wort hören Sie?',
      promptEn: 'Which word do you hear?',
      audioText: word.de,
      text: null,
      options,
      answer: word.de,
      accepted: [word.de],
      explanationDe: word.en ? `${word.de} — ${word.en}` : null,
      hint: `Lektion ${word.lektionNr}`,
      poolItemId: null,
      type: 'multiple_choice',
    });
  });
  return items;
}

// Lesen: 4 short texts of 2–3 consecutive dialogue lines from the chapter, each
// with ONE richtig/falsch statement.
//
// Two things this section got wrong until DaF review #5 (MAJOR, `buildLesen`):
//
//   1. THE ANSWER KEY WAS THE SAME IN EVERY CHECKPOINT. `wantRichtig = i % 2 === 0`
//      produced R–F–R–F four times over, so a learner who had seen checkpoint 1
//      scored 4/4 in checkpoints 2–4 without reading a word — in a section the
//      40 %-rule can fail a test on. The truth values are now DRAWN
//      (`shuffle([true, true, false, false], rng)`): still two of each, but the
//      order is the checkpoint's own seed, and tests/checkpoint.test.mjs pins
//      that at least two different orders occur across the four checkpoints.
//   2. A FALSE STATEMENT QUOTED ANOTHER LEKTION, so it tested string recognition,
//      not reading. A false statement is now built from a line of THIS text with
//      exactly ONE detail changed — a number word, a digit, a weekday, a name —
//      taken from the dialogue's own vocabulary. That is what Lesen Teil 1/2/3 of
//      *Start Deutsch 1* asks: the statement is plausible and you have to read the
//      text to reject it.
//
// The `hint` is gone with it: it named the Lektion, which under (2) told the
// learner which statements were the foreign ones.

/** The number words a dialogue may use (a11.js FUNCTION_WORDS, 0–100). */
const NUMBER_WORDS = [
  'null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
  'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn',
  'neunzehn', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig',
  'neunzig', 'hundert',
];

const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

// Numbers a REPLACEMENT may use: `eins` is excluded because "eins Euro" is not
// German (the counted form is `ein`), and a false statement has to be wrong,
// not broken. `null` goes with it — "null Euro" reads as a mistake, not a detail.
const REPLACEMENT_NUMBERS = NUMBER_WORDS.filter((w) => w !== 'eins' && w !== 'null');

/**
 * The single-digit number words — the only replacements allowed INSIDE a digit
 * group (DaF review #6, MAJOR 7). A phone number is spoken digit by digit
 * ("Null vier zwei – drei drei acht eins"), so a two-digit word in the middle
 * of it ("**Siebzehn** vier zwei") is not a changed detail, it is a number that
 * cannot be dictated. Here `eins` and `null` are back in: they are digits, not
 * counted quantities, so neither is broken German in this position.
 */
const DIGIT_NUMBERS = NUMBER_WORDS.slice(0, 10);

/** Forms of address are not names: swapping "Ana" for "Herr" is nonsense, not a detail. */
const TITLES = ['Herr', 'Frau'];

/**
 * THE DETERMINERS THAT GOVERN A NOUN AS A QUANTITY OR A TIME (DaF review #7,
 * MAJOR 2). `jede Woche` is an adverbial accusative: `Woche` stands there as a
 * time unit, not as a thing, and the Wortfeld knows only `article` and
 * `plural`, so the congruence bar of review #6 cannot see it. That is how
 * checkpoint 3 shipped the L9 football line with `Woche` replaced by
 * **Kellnerin** under its unchanged `jede` — grammatically
 * impeccable (`die Woche` and `die Kellnerin` share their article) and not a
 * false statement about the text but a broken sentence, solvable without
 * reading a line of it.
 *
 * `QUANTIFIER_DET` is the review's own list: after `jede/jeden/jedes/jeder/
 * alle/allen` the noun is a quantity or a time expression, and a swap there is
 * NEVER a changed detail — the branch does not fire at all.
 *
 * `DEICTIC_DET` (`diese Woche`, `diesen Schlüssel`) points at either kind, so
 * there the swap is allowed only WITHIN the semantic class: a time noun for a
 * time noun, a thing for a thing. A1.1 has no semantic field on a Wortfeld
 * entry — `{ de, word, article, plural, en, wordId }` — so the one class we
 * cannot read off the data is written down here, small and documented:
 * TIME_NOUNS plus the weekdays. Everything else counts as a thing.
 */
const QUANTIFIER_DET = ['jede', 'jeden', 'jedes', 'jeder', 'alle', 'allen'];
const DEICTIC_DET = ['diese', 'diesen', 'dieses', 'dieser', 'diesem'];

/** The chapter's time nouns — the class `jede/diese` reaches for. */
const TIME_NOUNS = [
  'Woche', 'Wochen', 'Wochenende', 'Wochenenden', 'Tag', 'Tage', 'Monat', 'Monate',
  'Jahr', 'Jahre', 'Stunde', 'Stunden', 'Minute', 'Minuten', 'Morgen', 'Vormittag',
  'Mittag', 'Nachmittag', 'Abend', 'Abende', 'Nacht', 'Nächte', 'Uhrzeit', 'Zeit',
];

/** The semantic class of a noun, for the deictic branch above. */
function semanticClass(word) {
  return TIME_NOUNS.includes(word) || WEEKDAYS.includes(word) ? 'zeit' : 'ding';
}

/** A word as it appears in a line — letters (incl. umlauts) or a run of digits. */
const WORD_RE = /[A-Za-zÄÖÜäöüß]+|\d+/g;

/** The names the chapter's own speakers carry ("Frau Kaya" → Kaya, Frau). */
function speakerNames(lektionen) {
  const out = new Set();
  for (const line of dialogLines(lektionen)) {
    for (const part of String(line.speaker || '').split(/\s+/)) {
      if (part.length >= 3 && /^[A-ZÄÖÜ]/.test(part) && !TITLES.includes(part)) out.add(part);
    }
  }
  return [...out];
}

/**
 * The chapter's NOUNS WITH THEIR GENDER — the last-resort swap when a window
 * carries no number, weekday or name, as a Map `wort → { article, plural }`.
 *
 * It is built from the Wortfeld, not from the dialogue lines, for two reasons
 * (DaF review #6, MAJOR 7). The old version collected every capitalised word of
 * the dialogues and swapped any one of them for any other, which produced
 * `a1.1-cp3-lesen-2`: the L9 football line with `Woche` replaced by
 * **Frühstück** — a NEUTER noun under a feminine `jede`. That is not a false
 * statement, it is not German, and
 * in the graded Lesen section it hands the learner the answer through the form
 * instead of through the content. The Wortfeld already carries `article` and
 * `plural`, so gender is data we have: a noun may only be replaced by a noun of
 * the SAME article, and a plural only by another plural (keyed `plural`, since
 * every German plural takes `die` and swapping a plural for a singular would
 * break the same agreement from the other side).
 *
 * Sentence-initial words are still skipped at the call site: a line-initial
 * "Spielst …" is a capitalised VERB, and the map cannot tell them apart.
 */
function contentWords(lektionen) {
  const out = new Map();
  for (const l of lektionen || []) {
    for (const w of l?.wortfeld || []) {
      if (!w?.article) continue;                       // greetings, verbs, adverbs: no gender to match
      const word = String(w.word || w.de || '').trim();
      if (word && !/\s/.test(word)) out.set(word, { article: String(w.article), plural: w.plural || null });
      const plural = String(w.plural || '').trim();
      if (plural && plural !== '—' && !/\s/.test(plural)) out.set(plural, { article: 'plural', plural: null });
    }
  }
  return out;
}

/** Is this match at the start of the line or of a new sentence inside it? */
function sentenceInitial(text, index) {
  const before = text.slice(0, index).trimEnd();
  return before === '' || /[.!?]$/.test(before);
}

/** Pick a member of `list` that is not `not` — deterministic in `rng`. */
function pickOther(list, not, rng) {
  const options = list.filter((x) => x.toLowerCase() !== String(not).toLowerCase());
  if (!options.length) return null;
  return options[Math.floor(rng() * options.length)];
}

/**
 * The replacement table: one changed DETAIL, drawn from the dialogue's own
 * kinds of token. Returns null for a word that carries no checkable detail.
 */
function changedDetail(word, { names, vocab }, rng, { allowVocab = true, digitGroup = false, determiner = '' } = {}) {
  const lower = word.toLowerCase();
  if (NUMBER_WORDS.includes(lower)) {
    const other = pickOther(digitGroup ? DIGIT_NUMBERS : REPLACEMENT_NUMBERS, lower, rng);
    return other ? (/^[A-ZÄÖÜ]/.test(word) ? other[0].toUpperCase() + other.slice(1) : other) : null;
  }
  if (WEEKDAYS.includes(word)) return pickOther(WEEKDAYS, word, rng);
  if (/^\d+$/.test(word)) {
    const n = Number(word);
    return String(n >= 10 ? n + 10 : n + 3);
  }
  if (names.includes(word)) return pickOther(names, word, rng);
  // Congruence: same article only, or no swap at all (see contentWords) — and,
  // under a quantifier or a deictic, same semantic class on top of it
  // (see QUANTIFIER_DET / DEICTIC_DET).
  if (allowVocab && vocab.has(word)) {
    const det = String(determiner || '').toLowerCase();
    if (QUANTIFIER_DET.includes(det)) return null;
    const { article } = vocab.get(word);
    const sameClass = DEICTIC_DET.includes(det)
      ? (w) => semanticClass(w) === semanticClass(word)
      : () => true;
    const same = [...vocab.keys()].filter(
      (w) => w !== word && vocab.get(w).article === article && sameClass(w),
    );
    return same.length ? pickOther(same, word, rng) : null;
  }
  return null;
}

/**
 * Build a FALSE statement out of one line of this very text: the same sentence
 * with exactly one detail replaced. Returns null when no line of the window
 * carries a changeable detail (then the caller keeps the pattern honest by
 * skipping the item rather than quoting a foreign Lektion again).
 */
function falsifyWindow(window, text, ctxWords, rng) {
  const lines = shuffle(window, rng);
  // Pass 1 changes a real DETAIL — a number, a time, a weekday, a name. Only
  // when the window holds none of those does pass 2 swap a content word, which
  // is the weaker (but still same-text) falsification.
  for (const allowVocab of [false, true]) {
    for (const line of lines) {
      const de = String(line.de || '');
      // Tokens in reading order first, so a number word can see its NEIGHBOURS
      // (a digit group is two or more number words in a row — a phone number).
      const tokens = [...de.matchAll(WORD_RE)];
      const isNumberToken = (t) => Boolean(t) && NUMBER_WORDS.includes(t[0].toLowerCase());
      const matches = shuffle(tokens.map((match, pos) => ({ match, pos })), rng);
      for (const { match, pos } of matches) {
        if (allowVocab && sentenceInitial(de, match.index)) continue;
        const digitGroup = isNumberToken(tokens[pos])
          && (isNumberToken(tokens[pos - 1]) || isNumberToken(tokens[pos + 1]));
        // The word left of the match, so the vocab branch can see whether the
        // noun is governed by a quantifier („jede Woche“ — DaF review #7, MAJOR 2).
        const determiner = tokens[pos - 1] ? tokens[pos - 1][0] : '';
        const replacement = changedDetail(match[0], ctxWords, rng, { allowVocab, digitGroup, determiner });
        if (!replacement) continue;
        const changed = `${de.slice(0, match.index)}${replacement}${de.slice(match.index + match[0].length)}`;
        if (changed === de || text.includes(changed)) continue;
        return { line, de: changed, from: match[0], to: replacement };
      }
    }
  }
  return null;
}

function buildLesen(ctx) {
  const { checkpoint, rng, chapter } = ctx;
  const items = [];
  const withDialog = chapter.filter((l) => (l?.dialog?.lines || []).length >= 2);
  if (!withDialog.length) return items;
  const order = shuffle(withDialog, rng);
  // Two richtig and two falsch, in an order this checkpoint's seed decides.
  const truth = shuffle([true, true, false, false], rng);
  const ctxWords = { names: speakerNames(chapter), vocab: contentWords(chapter) };

  for (let i = 0; i < SECTION_COUNTS.lesen; i += 1) {
    const lektion = order[i % order.length];
    const lines = lektion.dialog.lines;
    const span = Math.min(3, lines.length);
    const start = Math.floor(rng() * Math.max(1, lines.length - span + 1));
    const window = lines.slice(start, start + span);
    const text = window.map((l) => `${l.speaker}: ${l.de}`).join(' ');
    const wantRichtig = truth[i];

    let quoted = window[Math.floor(rng() * window.length)];
    let statement = quoted.de;
    let explanationDe = 'Der Satz steht genau so im Text.';
    if (!wantRichtig) {
      const falsified = falsifyWindow(window, text, ctxWords, rng);
      if (!falsified) continue;
      quoted = falsified.line;
      statement = falsified.de;
      explanationDe = `Im Text steht „${falsified.line.de}“ — dort steht „${falsified.from}“, nicht „${falsified.to}“.`;
    }
    const answer = wantRichtig ? 'Richtig' : 'Falsch';
    items.push({
      id: `${checkpoint.id}-lesen-${i + 1}`,
      section: 'lesen',
      kind: 'trueFalse',
      mode: 'options',
      topic: 'lesen',
      lektionNr: lektion.nr,
      source: 'chapter',
      register: null,
      scored: true,
      promptDe: `Steht das im Text? „${quoted.speaker}: ${statement}“`,
      promptEn: 'Does the text say this?',
      audioText: null,
      text,
      options: ['Richtig', 'Falsch'],
      answer,
      accepted: [answer],
      explanationDe,
      // No hint: naming the Lektion is half the answer here (review #5).
      hint: null,
      poolItemId: null,
      type: 'multiple_choice',
    });
  }
  return items;
}

// Sprachbausteine: 6 pool items from the chapter's grammar slugs, typed-first
// (the standard asks for ≥ 4 typed) — and this is where the 30 % interleave
// from earlier chapters lands, because grammar is the thing that has to keep
// coming back.
function buildBausteine(ctx) {
  const { checkpoint, rng, chapter, earlier, pool, usedPoolIds, untaught } = ctx;
  const chapterTopics = topicsOf(chapter);
  const earlierTopics = topicsOf(earlier).filter((t) => !chapterTopics.includes(t));
  const earlierWanted = earlierTopics.length ? POOL_ITEMS_EARLIER : 0;
  const drawnEarlier = drawPool(pool, earlierTopics, earlierWanted, rng, usedPoolIds, { untaught });
  const drawnChapter = drawPool(
    pool,
    chapterTopics,
    SECTION_COUNTS.bausteine - drawnEarlier.length,
    rng,
    usedPoolIds,
    { untaught },
  );
  return [...drawnChapter, ...drawnEarlier].map((p, i) =>
    fromPoolItem(p, {
      id: `${checkpoint.id}-bausteine-${i + 1}`,
      section: 'bausteine',
      source: drawnChapter.includes(p) ? 'chapter' : 'earlier',
    }),
  );
}

// Schreiben: 3 production items — and since DaF review #5 (MAJOR,
// `buildSchreiben`) that means ONE REAL WRITING TASK plus two sentence-building
// drills, not three drills with an invented Textsorte label.
//
//   - THE REAL TASK is the chapter's last Lektion's `schreiben.taskKey`
//     (`a11-l03`, `a11-l06`, …), looked up in src/data/writingTasks.js — the
//     same bank netlify/functions/evaluate-writing.mjs grades against, so the
//     prompt the learner reads and the prompt the grader scores are one string.
//     CheckpointPage mounts GradedWriting on it, exactly as the lesson does.
//     It ships `scored: false, scorable: true, optional: true`: a grader verdict
//     makes it one scored Schreiben item (correct at WRITING_PASS_PCT); without
//     one — signed out, over the AI allowance, offline, where GradedWriting
//     honestly falls back to its mechanical form check — the item is NOT
//     ATTEMPTED and drops out of the section instead of scoring 0. Schreiben
//     then scores over its two drills. Failing a section because the grader was
//     unreachable would be a number we cannot defend; see scoreCheckpoint.
//   - THE TWO DRILLS come from DIFFERENT Lektionen of the chapter: one item per
//     `primarySlug`, round-robin, instead of three draws from one topic (the old
//     code drew checkpoint 4 three times from Lektion 10's `yes-no-questions`).
//   - `register` is NULL on the drills. It used to carry 'formular'/'mitteilung'
//     on sentence-building items that have no Textsorte at all, and that field
//     name is taken: evaluate-writing derives its character floor from it. The
//     only item with a register is the real task, whose register is real.
function buildSchreiben(ctx) {
  const { checkpoint, rng, chapter, pool, usedPoolIds, level, untaught } = ctx;
  const graded = gradedWritingItem(checkpoint, chapter, level);
  const drillCount = SECTION_COUNTS.schreiben - (graded ? 1 : 0);

  const slugs = shuffle([...new Set((chapter || []).map((l) => l?.primarySlug).filter(Boolean))], rng);
  const chosen = [];
  // One sentence_building item per slug, so the drills span as many Lektionen
  // of the chapter as there are slots.
  for (const slug of slugs) {
    if (chosen.length >= drillCount) break;
    const candidates = shuffle(
      byTopics(pool, [slug]).filter((i) => i.type === 'sentence_building' && !usedPoolIds.has(i.id)),
      rng,
    );
    // Taught lexis first, and only then this slug's other sentence-building
    // items — this is the draw that used to hand checkpoint 2 `dd86dc8a`
    // („[Honig / ist / gut]“) as its first graded Schreiben item.
    const pick = candidates.find((i) => !untaught(i)) || candidates[0];
    if (!pick) continue;
    usedPoolIds.add(pick.id);
    chosen.push(pick);
  }
  // Short (a slug the pool has no sentence-building item for): fill from the
  // chapter's remaining topics, typed only, still round-robin across topics.
  if (chosen.length < drillCount) {
    const used = new Set(chosen.map((c) => c.topic));
    const rest = topicsOf(chapter).filter((t) => !used.has(t));
    chosen.push(...drawPool(pool, rest, drillCount - chosen.length, rng, usedPoolIds, { typedOnly: true, untaught }));
  }
  if (chosen.length < drillCount) {
    chosen.push(...drawPool(pool, topicsOf(chapter), drillCount - chosen.length, rng, usedPoolIds, { typedOnly: true, untaught }));
  }

  const drills = chosen.map((p, i) =>
    fromPoolItem(p, {
      id: `${checkpoint.id}-schreiben-${i + 1}`,
      section: 'schreiben',
      source: 'chapter',
      register: null,
    }),
  );
  return graded ? [...drills, graded] : drills;
}

/**
 * The chapter's own writing task: its last Lektion that has a `schreiben.taskKey`,
 * resolved in the writing-task bank so the checkpoint sends evaluate-writing a
 * key it knows. Returns null when the curriculum carries no taskKey (the test
 * fixture) or the bank has no such task — then Schreiben stays three drills.
 */
export function chapterWritingTask(chapter, level) {
  const lektion = [...(chapter || [])].reverse().find((l) => l?.schreiben?.taskKey);
  if (!lektion) return null;
  const taskKey = lektion.schreiben.taskKey;
  const bank =
    courseWritingTasks(level).find((t) => t.taskKey === taskKey) ||
    writingTaskByKey('goethe_a1', taskKey);
  return bank ? { lektion, schreiben: lektion.schreiben, bank } : null;
}

/** That task as a checkpoint item — rendered by GradedWriting on CheckpointPage. */
function gradedWritingItem(checkpoint, chapter, level) {
  const found = chapterWritingTask(chapter, level);
  if (!found) return null;
  const { lektion, schreiben: s, bank } = found;
  return {
    id: `${checkpoint.id}-schreiben-graded`,
    section: 'schreiben',
    kind: 'gradedWriting',
    // Answered with the grader's verdict; the confirm path scores it.
    mode: 'confirm',
    topic: 'schreiben',
    lektionNr: lektion.nr,
    lektionId: lektion.id,
    source: 'chapter',
    register: s.kind || bank.register || null,
    scored: false,
    scorable: true,
    optional: true,
    promptDe: bank.task || s.taskDe,
    promptEn: null,
    audioText: null,
    text: null,
    options: null,
    answer: true,
    accepted: [true],
    explanationDe: null,
    hint: null,
    poolItemId: null,
    type: 'graded_writing',
    task: {
      examKey: bank.examKey,
      taskKey: bank.taskKey,
      kind: s.kind || bank.register,
      taskDe: bank.task || s.taskDe,
      fields: s.fields || (s.kind === 'formular' ? bank.leitpunkte : null) || null,
      leitpunkte: bank.leitpunkte || s.leitpunkte || null,
      minWords: bank.minWords ?? s.minWords ?? 0,
      maxWords: bank.maxWords ?? s.maxWords ?? 30,
      sample: s.sample || null,
    },
  };
}

// Sprechen: 2 read-alouds, scored by the microphone when there is one. The
// learner records the line, score-readaloud aligns the transcript word by word,
// and `pct >= SPRECHEN_PASS_PCT` counts as correct. Without a mic (or signed
// out, or over the daily clip cap) the item is self-confirmed and the section
// stays out of the result — required, but never a number we cannot defend.
function buildSprechen(ctx) {
  const { checkpoint, rng, chapter } = ctx;
  const preferred = [];
  for (const l of chapter) {
    for (const idx of l?.sprechen?.readAloud || []) {
      const line = l?.dialog?.lines?.[idx];
      if (line) preferred.push({ lektionNr: l.nr, lektionId: l.id, idx, ...line });
    }
  }
  const source = preferred.length >= 2 ? preferred : dialogLines(chapter);
  return take(shuffle(source, rng), SECTION_COUNTS.sprechen).map((line, i) => ({
    id: `${checkpoint.id}-sprechen-${i + 1}`,
    section: 'sprechen',
    kind: 'readAloud',
    mode: 'confirm',
    topic: 'sprechen',
    lektionNr: line.lektionNr,
    lektionId: line.lektionId || null,
    lineKey: `line-${line.idx}`,
    source: 'chapter',
    register: null,
    // Not scored at build time — promoted by scoreCheckpoint when the mic
    // scored every item of the section (see the header).
    scored: false,
    scorable: true,
    promptDe: 'Lesen Sie den Satz laut vor.',
    promptEn: 'Read the sentence aloud.',
    audioText: line.de,
    text: line.de,
    options: null,
    answer: line.de,
    accepted: [line.de],
    explanationDe: line.en || null,
    hint: `Lektion ${line.lektionNr}`,
    poolItemId: null,
    type: 'read_aloud',
  }));
}

/**
 * buildCheckpoint({ curriculum, checkpoint, pool, seed }) → 20 items,
 * in section order, deterministic in `seed` (default: the checkpoint id).
 */
export function buildCheckpoint({ curriculum, checkpoint, pool, seed } = {}) {
  if (!curriculum || !checkpoint) return [];
  const rng = mulberry32(hashSeed(seed ?? checkpoint.id));
  const ctx = {
    checkpoint,
    rng,
    pool,
    level: curriculum.level,
    chapter: chapterLektionen(curriculum, checkpoint),
    earlier: earlierLektionen(curriculum, checkpoint),
    usedPoolIds: new Set(),
    // Measured at the END of the chapter this checkpoint closes: that is what
    // the learner sitting it has been taught (see untaughtAt).
    untaught: untaughtAt(curriculum, checkpoint.afterLektion),
  };
  return [
    ...buildHoeren(ctx),
    ...buildLesen(ctx),
    ...buildBausteine(ctx),
    ...buildSchreiben(ctx),
    ...buildSprechen(ctx),
  ];
}

// ── scoring ─────────────────────────────────────────────────────────────────

/** Word recognition at or above this counts a checkpoint read-aloud as correct. */
export const SPRECHEN_PASS_PCT = 0.6;

/**
 * A read-aloud answer that came back from the microphone
 * (netlify/functions/score-readaloud), as opposed to a self-confirm tap.
 * Shape: { usedMic: true, pct: 0…1 }.
 */
export const isMicResult = (answer) =>
  Boolean(answer) && typeof answer === 'object' && answer.usedMic === true && typeof answer.pct === 'number';

/** A graded-writing answer that came back from evaluate-writing, not the form check. */
export const isWritingResult = (answer) =>
  Boolean(answer) && typeof answer === 'object' && answer.graded === true && typeof answer.pct === 'number';

/** Score at or above this counts a checkpoint writing task as correct. */
export const WRITING_PASS_PCT = 0.6;

/** Does this item count toward the score ON THIS RUN? (see the file header) */
export const itemIsScored = (item, answer) =>
  Boolean(item?.scored) || (item?.scorable === true && (isMicResult(answer) || isWritingResult(answer)));

/**
 * An OPTIONAL item that no machine graded is "not attempted": it leaves the
 * section instead of scoring 0. Only the graded writing task is optional — the
 * grader needs a signed-in learner and an allowance, and neither is something a
 * learner can fail at. Sprechen is NOT optional: its all-or-nothing rule stands.
 */
export const itemCounts = (item, answer) => !(item?.optional === true && !itemIsScored(item, answer));

/**
 * Was this answer right? A self-confirmed read-aloud is "done", never right or
 * wrong; a mic-scored one is right at SPRECHEN_PASS_PCT and up.
 *
 * Grading here MUST match the lesson's PracticeItem.jsx call exactly, and the
 * way it is kept matching is that NEITHER side makes up options: every option
 * comes from `checkOptionsFor(item)` (REVIEW #6 BLOCKER 3), so `strict`,
 * `caseSensitive`, `dictation` and `spelling` are all decided by the item.
 * Round 5 passed `caseSensitive` here by hand and forgot `dictation`, and the
 * one dictation with a separator (`a1.1-cp2-hoeren-1`, a phone number) graded
 * `correct` in the lesson and `wrong` here for the same typed answer. TYPO handling is also
 * identical on purpose: the standard (docs/course-standard-2026-09-12.md §3,
 * "Checkpoint") gives the checkpoint "3 attempts per 8 h with a remediation
 * set between" — that is a retake of the WHOLE test, not a per-item retry —
 * and the lesson has no per-item retry either (PracticeItem.jsx locks the
 * answer on first submit). So a TYPO result counts as correct-with-warning in
 * both places; there is no separate "checkpoint has no retry" case to carve
 * out, because neither surface ever offered one — the one-typo allowance
 * lives entirely inside checkAnswer(), not in a UI retry step.
 */
export function isItemCorrect(item, answer) {
  if (!item) return false;
  if (item.mode === 'confirm') {
    if (isMicResult(answer)) return answer.pct >= SPRECHEN_PASS_PCT;
    if (isWritingResult(answer)) return answer.pct >= WRITING_PASS_PCT;
    return answer === true || answer === 'done';
  }
  if (answer == null || answer === '') return false;
  const { result } = checkAnswer(String(answer), item.accepted, checkOptionsFor(item));
  return result === RESULT.CORRECT || result === RESULT.TYPO;
}

/**
 * scoreCheckpoint(items, answers) → the result screen's whole payload.
 * `answers` is keyed by item id. Sprechen enters the overall percentage and
 * the 40 %-per-section rule only when every read-aloud in it was scored by the
 * microphone; a single self-confirm leaves the section reported but unscored.
 * The graded writing task is the one OPTIONAL item: with a verdict from
 * evaluate-writing it is one scored Schreiben item, without one it leaves the
 * section (total 3 → 2) instead of counting as a miss.
 */
export function scoreCheckpoint(items, answers = {}) {
  const sections = {};
  const errorTags = {};
  let scoredCorrect = 0;
  let scoredTotal = 0;

  for (const section of SECTION_ORDER) {
    const present = items.filter((i) => i.section === section);
    if (!present.length) continue;
    // An un-graded writing task is not attempted, not failed (see itemCounts).
    const inSection = present.filter((i) => itemCounts(i, answers[i.id]));
    if (!inSection.length) continue;
    let correct = 0;
    for (const item of inSection) {
      const answer = answers[item.id];
      const ok = isItemCorrect(item, answer);
      if (ok) correct += 1;
      else if (itemIsScored(item, answer)) {
        // A mic-scored read-aloud miss is a pronunciation/intelligibility miss
        // and carries the same tag the function writes into lesson_attempts —
        // tagError compares two answer strings and has nothing to compare here.
        const tag = isMicResult(answer) ? 'Aussprache' : isWritingResult(answer) ? 'Schreiben' : tagError(
          { stage: section === 'hoeren' ? 'listening' : 'checkpoint', kind: item.kind, topic: item.topic, type: item.type },
          answer == null ? '' : String(answer),
          item.answer,
        );
        errorTags[tag] = (errorTags[tag] || 0) + 1;
      }
    }
    const total = inSection.length;
    // Sprechen is scored only when EVERY item of it came back from the mic.
    const scored = inSection.every((i) => itemIsScored(i, answers[i.id]));
    sections[section] = { correct, total, pct: total ? Math.round((correct / total) * 100) : 0, scored };
    if (scored) {
      scoredCorrect += correct;
      scoredTotal += total;
    }
  }

  const overall = scoredTotal ? Math.round((scoredCorrect / scoredTotal) * 100) : 0;
  const weakest = Object.values(sections).filter((s) => s.scored);
  const passed =
    scoredTotal > 0 && overall >= PASS_OVERALL_PCT && weakest.every((s) => s.pct >= PASS_SECTION_PCT);

  return { overall, correct: scoredCorrect, total: scoredTotal, sections, passed, errorTags };
}

/**
 * remediationSet(items, answers, pool) → 10 fresh items aimed at what actually
 * went wrong: the topics that were missed, most-missed first, round-robin so a
 * single bad topic does not fill the whole set. Nothing already seen in this
 * checkpoint comes back (the standard: a miss returns as a DIFFERENT variant).
 */
export function remediationSet(items, answers = {}, pool, { size = 10, seed } = {}) {
  const missCounts = new Map();
  const tags = {};
  for (const item of items) {
    if (!itemCounts(item, answers[item.id])) continue;
    if (!itemIsScored(item, answers[item.id]) || isItemCorrect(item, answers[item.id])) continue;
    const topic = item.topic;
    missCounts.set(topic, (missCounts.get(topic) || 0) + 1);
    const tag = tagError(
      { stage: item.section === 'hoeren' ? 'listening' : 'checkpoint', kind: item.kind, topic, type: item.type },
      answers[item.id] == null ? '' : String(answers[item.id]),
      item.answer,
    );
    tags[tag] = (tags[tag] || 0) + 1;
  }

  const poolTopics = new Set(poolItems(pool).map((i) => i.topic));
  const failing = [...missCounts.entries()]
    .filter(([topic]) => poolTopics.has(topic))
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([topic]) => topic);
  const fallback = [...new Set(items.map((i) => i.topic))].filter((t) => poolTopics.has(t) && !failing.includes(t));

  const used = new Set(items.map((i) => i.poolItemId).filter(Boolean));
  const rng = mulberry32(hashSeed(seed ?? `${items[0]?.id || 'cp'}-remediation`));
  const drawn = drawPool(pool, failing, size, rng, used);
  if (drawn.length < size) drawn.push(...drawPool(pool, fallback, size - drawn.length, rng, used));

  return drawn.map((p, i) => ({
    ...fromPoolItem(p, {
      id: `rem:${p.id}`,
      section: 'remediation',
      source: failing.includes(p.topic) ? 'targeted' : 'chapter',
    }),
    order: i + 1,
    errorTags: tags,
  }));
}
