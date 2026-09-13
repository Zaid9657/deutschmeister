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
import { politeCaseItem } from '../../data/lessonPools/quality.js';

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

/**
 * THE IDENTITY OF A DIALOGUE LINE — one string, used by all three skill
 * sections (DaF review #8, MAJOR 2). `ctx.usedLineKeys` is keyed on it.
 */
export const lineKeyOf = (lektionIdOrNr, idx) => `${lektionIdOrNr}#${idx}`;

/**
 * IS CAPITALISATION THE TASK IN THIS LINE? — the same predicate the pool build
 * stamps its items with and `reviewService.buildCardIndex` flags its cards
 * with (`politeCaseItem`, src/data/lessonPools/quality.js), asked here of a
 * dictation or read-aloud line.
 *
 * DaF review #8, MAJOR 5. Dictations shipped `caseSensitive: undefined`, i.e.
 * false for `checkOptionsFor()`, so the GRADED checkpoint 1 accepted
 * „gut. wie geht es ihnen?" while the lesson item for the very same form
 * (`extra-a11-l01-06`) grades `ihnen` wrong. The flag is a property of the
 * ANSWER, never of the section that happens to ask for it — so it is derived
 * here from the line itself, exactly as `fromPoolItem` carries it through for a
 * pool item, and `checkOptionsFor()` picks it up unchanged. The four-options
 * rule of review #7 is untouched: the ITEM still decides alone.
 */
export const lineIsCaseTask = (de) => politeCaseItem({ answer: de, accepted: [de] });

/**
 * UNUSED LINES FIRST, USED ONES STILL THERE (DaF review #8, MAJOR 2). A hard
 * filter would let a thin chapter ship a four-item Hören section, and a short
 * exam is a worse failure than a repeated line — so the sections order rather
 * than filter, exactly as the pool draw orders by taught lexis.
 */
const freeLinesFirst = (lines, usedLineKeys) => {
  const key = (l) => lineKeyOf(l.lektionId || l.lektionNr, l.idx);
  return [...lines.filter((l) => !usedLineKeys.has(key(l))), ...lines.filter((l) => usedLineKeys.has(key(l)))];
};

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
  const { checkpoint, rng, chapter, usedLineKeys } = ctx;
  const items = [];
  // Hören draws first, so nothing is taken yet — the filter is here anyway
  // because "unused first, then whatever is left" is the rule all three skill
  // sections share (DaF review #8, MAJOR 2), and Hören must not become the one
  // section that is exempt the day the order changes.
  const lines = freeLinesFirst(shuffle(dialogLines(chapter), rng), usedLineKeys);
  take(lines, 3).forEach((line, i) => {
    usedLineKeys.add(lineKeyOf(line.lektionId || line.lektionNr, line.idx));
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
      // The capital is the task where the line carries a polite form that is
      // not the first word of its sentence — one predicate, every surface
      // (lineIsCaseTask; DaF review #8, MAJOR 5).
      caseSensitive: lineIsCaseTask(line.de),
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

/**
 * THE NP SLOT (DaF review #8, the residual of round 8). The article bar of
 * review #6 and the quantifier/deictic bar of review #7 both look at ONE noun
 * and its determiner — and neither of them sees a noun that has no determiner
 * at all. That is how checkpoint 3 still shipped „Spielst … jede Woche
 * **Durst**?“ against „… jede Woche **Fußball**?“: `Fußball` is a bare object
 * noun inside the verbal idiom *Fußball spielen*, `Durst` is the bare object of
 * *Durst haben*, both are `der`-nouns of the Wortfeld, so every congruence
 * check passes — and the sentence is not a false statement about the text but
 * no German sentence at all. „Woche“ was already protected by QUANTIFIER_DET;
 * the swap simply walked one token to the right.
 *
 * A bare noun in German is almost always welded to its verb (Fußball spielen,
 * Durst/Hunger haben, Klavier spielen, Auto fahren, Deutsch lernen), and the
 * Wortfeld carries no valency data to tell those apart from a genuinely free
 * bare noun. So the rule is positional and conservative: the vocab branch may
 * only swap a noun that stands in a REAL NP SLOT — immediately preceded by an
 * article, a possessive or a demonstrative. Everything else is left alone.
 *
 * `NP_DET_RE` is that list. The possessive stems are written as a pattern
 * (`d?ein` covers the article `ein` and the 2nd-person possessive in one
 * alternative) because tests/checkpoint.test.mjs greps this file for the
 * informal register and a literal one would trip that guard.
 */
const NP_DET_RE = /^(?:der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|kein|keine|keinen|keinem|keiner|keines|d?ein|d?eine|d?einen|d?einem|d?einer|d?eines|sein|seine|seinen|seinem|seiner|seines|ihr|ihre|ihren|ihrem|ihrer|ihres|unser|unsere|unseren|unserem|unserer|unseres|euer|eure|euren|eurem|eurer|eures|dieser|diese|diesen|diesem|dieses)$/i;

/** Does this noun stand in a real NP slot — under an article, possessive or demonstrative? */
const inNpSlot = (determiner) => NP_DET_RE.test(String(determiner || ''));

/**
 * THE FALLBACK TABLE (same residual). Making the vocab branch positional means
 * a window can now run out of swappable tokens altogether, and a Lesen section
 * that silently drops an item is the failure this whole section exists to
 * avoid — SECTION_COUNTS.lesen is 4 on every checkpoint and the test pins it.
 * So before `falsifyWindow` gives up it tries one more class of changed detail:
 * a place/time adverb swapped for its opposite. These are pairs, not a pool:
 * the replacement is fixed by the table, so it can never produce a form that
 * needs congruence at all.
 *
 * Only lowercase occurrences are swapped, and never a sentence-initial one:
 * capital `Morgen` is the noun („Guten Morgen“), lowercase `morgen` is the
 * adverb, and this branch must not touch the first.
 */
const ADVERB_SWAPS = new Map([
  ['heute', ['morgen']],
  ['morgen', ['heute']],
  ['hier', ['da', 'dort']],
  ['da', ['hier']],
  ['dort', ['hier']],
  ['links', ['rechts']],
  ['rechts', ['links']],
  ['früh', ['spät']],
  ['spät', ['früh']],
  ['morgens', ['abends']],
  ['abends', ['morgens']],
]);

/** A word as it appears in a line — letters (incl. umlauts) or a run of digits. */
const WORD_RE = /[A-Za-zÄÖÜäöüß]+|\d+/g;

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
function changedDetail(
  word,
  { names, vocab },
  rng,
  { allowVocab = true, allowAdverb = false, digitGroup = false, determiner = '' } = {},
) {
  const lower = word.toLowerCase();
  if (allowAdverb) {
    // The fallback pass: only the adverb table fires here, and only on a
    // lowercase occurrence (see ADVERB_SWAPS).
    if (word !== lower) return null;
    const opposites = ADVERB_SWAPS.get(lower);
    return opposites ? pickOther(opposites, lower, rng) : null;
  }
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
    // …and a noun with no determiner at all is a bare noun welded to its verb
    // (Fußball spielen, Durst haben) — not an NP slot, never a swap (see
    // NP_DET_RE).
    if (!inNpSlot(det)) return null;
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
 * THE ORDER THE FALSIFIER TRIES THINGS IN.
 *
 *   1. DETAIL — a number word, a figure, a weekday, a name. This pass already
 *      walks EVERY token of EVERY line of the window, so "try the other lines
 *      of the window" and "swap a weekday or a number anywhere in the window"
 *      are the same pass, not two later ones: there is nothing left for a
 *      second sweep of that kind to find.
 *   2. VOCAB — a Wortfeld noun in a real NP slot, same article, and under a
 *      deictic same semantic class (NP_DET_RE, QUANTIFIER_DET, DEICTIC_DET).
 *   3. ADVERB — the fallback pass: a place/time adverb for its opposite
 *      (ADVERB_SWAPS). It exists because pass 2 became positional and a window
 *      of bare-noun idioms would otherwise yield nothing and ship a 3-item
 *      Lesen section.
 *
 * Only if all three fail does buildLesen skip the item — and since the test
 * pins 5/4/6/3/2 on all four checkpoints, a skip means the window is wrong and
 * has to be replaced, not tolerated.
 */
const FALSIFY_PASSES = [
  { allowVocab: false, allowAdverb: false },
  { allowVocab: true, allowAdverb: false },
  { allowVocab: false, allowAdverb: true },
];

/**
 * Build a FALSE statement out of one line of this very text: the same sentence
 * with exactly one detail replaced. Returns null when no line of the window
 * carries a changeable detail (then the caller keeps the pattern honest by
 * skipping the item rather than quoting a foreign Lektion again).
 */
function falsifyWindow(window, text, ctxWords, rng) {
  const lines = shuffle(window, rng);
  for (const { allowVocab, allowAdverb } of FALSIFY_PASSES) {
    for (const line of lines) {
      const de = String(line.de || '');
      // Tokens in reading order first, so a number word can see its NEIGHBOURS
      // (a digit group is two or more number words in a row — a phone number).
      const tokens = [...de.matchAll(WORD_RE)];
      const isNumberToken = (t) => Boolean(t) && NUMBER_WORDS.includes(t[0].toLowerCase());
      const matches = shuffle(tokens.map((match, pos) => ({ match, pos })), rng);
      for (const { match, pos } of matches) {
        if ((allowVocab || allowAdverb) && sentenceInitial(de, match.index)) continue;
        const digitGroup = isNumberToken(tokens[pos])
          && (isNumberToken(tokens[pos - 1]) || isNumberToken(tokens[pos + 1]));
        // The word left of the match, so the vocab branch can see whether the
        // noun is governed by a quantifier („jede Woche“ — DaF review #7, MAJOR 2).
        const determiner = tokens[pos - 1] ? tokens[pos - 1][0] : '';
        const replacement = changedDetail(match[0], ctxWords, rng, {
          allowVocab,
          allowAdverb,
          digitGroup,
          determiner,
        });
        if (!replacement) continue;
        const changed = `${de.slice(0, match.index)}${replacement}${de.slice(match.index + match[0].length)}`;
        if (changed === de || text.includes(changed)) continue;
        return { line, de: changed, from: match[0], to: replacement };
      }
    }
  }
  return null;
}

/** The window as the learner reads it: "Sprecher: Satz" joined by spaces. */
const windowText = (window) => window.map((l) => `${l.speaker}: ${l.de}`).join(' ');

/**
 * Every 2–3 line window of a Lektion, in reading order — THREE-line windows
 * first, then the two-line ones.
 *
 * The two-line windows are a rung of the ladder, not a second kind of text
 * (the contract says „2–3 Zeilen" and always did). DaF review #9, MAJOR 3 made
 * the Lesen statement a REPORT about one line, so an item now needs a window
 * that (a) contains a reportable line, (b) shares no line with another Lesen
 * item of this paper, and (c) ideally shares none with a line the learner has
 * already dictated or read aloud. In a three-Lektion chapter whose reportable
 * lines sit two apart, the three-line grid alone cannot always satisfy all
 * three; a two-line window can, and reading two lines instead of three is a
 * smaller loss than printing a sentence the learner typed ten minutes ago.
 */
function windowsOf(lektion) {
  const lines = lektion?.dialog?.lines || [];
  const out = [];
  for (const span of [...new Set([Math.min(3, lines.length), Math.min(2, lines.length)])]) {
    if (span < 2) continue;
    for (let start = 0; start + span <= lines.length; start += 1) {
      out.push({ lektion, window: lines.slice(start, start + span), start, span });
    }
  }
  return out;
}

/**
 * The windows a Lesen item may use, drawn one first: the window the seed
 * picked, then this Lektion's other windows, then the other Lektionen's. A
 * window that yields no statement is not a reason to ship a three-item Lesen
 * section — it is a reason to read a different part of the chapter.
 *
 * DaF review #8, MAJOR 2 put a second condition on the same list, and review #9
 * turned half of it into a hard one. A window is what the learner READS, so a
 * window that contains a line he has already typed from dictation — or that
 * another Lesen item of this very test already read — measures memory, not
 * reading: `a1.1-cp4-lesen-2` asked „Steht das im Text?" about the neighbour of
 * a sentence the learner had typed two minutes earlier, and checkpoint 3 built
 * two of its four Lesen items from one window, both keyed `Richtig`.
 *
 *   - DROPPED OUTRIGHT: a window already used as a window in this checkpoint,
 *     and — new in round 10 — any window that shares even ONE line with another
 *     Lesen item of this paper. That rule was a test before it was a mechanism
 *     ("no two Lesen items of one checkpoint are built from the same window"),
 *     and a rule the builder does not know is a rule that holds by luck.
 *   - ORDERED, not dropped: windows that touch a line this paper has dictated
 *     or read aloud go behind the ones that do not, and inside each of those
 *     two groups the three-line windows go before the two-line ones.
 */
function lesenCandidates(lektion, start, order, usedLineKeys, usedWindows, usedLesenLines) {
  const here = windowsOf(lektion);
  const drawn = here.find((w) => w.start === start && w.span === 3) || here[0];
  const rest = here.filter((w) => w !== drawn);
  const elsewhere = order.filter((l) => l !== lektion).flatMap((l) => windowsOf(l));
  const all = [drawn, ...rest, ...elsewhere]
    .filter(Boolean)
    .filter((w) => !usedWindows.has(windowKeyOf(w)))
    .filter((w) => windowLineKeys(w).every((k) => !usedLesenLines.has(k)));
  const rank = (w) => (windowLineKeys(w).every((k) => !usedLineKeys.has(k)) ? 0 : 2) + (w.span >= 3 ? 0 : 1);
  return all.map((w, i) => ({ w, i })).sort((a, b) => rank(a.w) - rank(b.w) || a.i - b.i).map(({ w }) => w);
}

/** A window's identity inside one checkpoint: its Lektion, its first line and its length. */
const windowKeyOf = (w) => `${lineKeyOf(w.lektion?.id ?? w.lektion?.nr, w.start)}:${w.span}`;

/** Every line key a window covers — all of them, not just the quoted one. */
const windowLineKeys = (w) => w.window.map((_, j) => lineKeyOf(w.lektion?.id ?? w.lektion?.nr, w.start + j));

// ── THE REPORTED STATEMENT (DaF review #9, MAJOR 3) ─────────────────────────
//
// WHY THIS EXISTS. Until round 9 the Richtig half of `buildLesen` was
// `statement = quoted.de` with the explanation „Der Satz steht genau so im
// Text." — eight of the sixteen Lesen statements of the four papers stood
// LETTER FOR LETTER in their own printed text (speaker prefix included), and
// the other eight were the same line with one word swapped. „Suche die Zeile;
// finde ich sie Buchstabe für Buchstabe, ist es Richtig" scored 4/4 in every
// checkpoint without one word of German being understood — in a section the
// 40 % rule can fail a learner on.
//
// *Start Deutsch 1* Lesen Teil 1 tests the opposite: the statement is a
// REFORMULATION of the text („Ich spiele jede Woche Fußball." → „Tim spielt
// jede Woche Fußball."), and the reformulation IS the reading. So both halves
// now go through the same transformation: the Richtig statement is a report
// ABOUT the text, and the Falsch statement is that same report with one detail
// changed — the two halves look alike and the length carries no signal.
//
// THREE ENGINES, all mechanical, all gated by what the course has taught:
//
//   A. FIRST PERSON → THIRD PERSON, with the speaker as the subject.
//      „Ich wohne in Bremen." (Ana) → „Ana wohnt in Bremen."
//   B. THE SPEAKER'S OWN THING, as a von-phrase instead of a possessive.
//      „Mein Hobby ist Sport." (Lena) → „Das Hobby von Lena ist Sport."
//      The von-genitive rather than `sein/ihr`, because the dialogues model it
//      themselves („Der Mann von meiner Schwester", L3) while a sentence-initial
//      „Ihr …" would read as the polite possessive the course drills elsewhere.
//   C. PRONOUN → ITS ANTECEDENT, resolved inside the printed window.
//      „Nein, sie kostet fünfzehn Euro." → „Die Fahrkarte kostet fünfzehn Euro."
//
// THE GATE. Every engine produces a statement only if EVERY token of it is in
// `knownUpTo(curriculum, checkpoint.afterLektion)` (or a dialogue name) and, for
// the verb, only if the third-person form is in that same set. That is one
// mechanism for three of the review's demands: taught lexis, a verb form the
// curriculum teaches BY THAT LEKTION, and no invented word. It is why „Ich lese
// auch gern." is never transformed — `liest` is in no Wortfeld and no notice of
// A1.1, so the ladder moves on rather than teaching a form the course does not.
//
// THE LADDER when a line cannot be transformed: the next sentence of the line,
// the next line of the window, the next window (`lesenCandidates`, which already
// prefers windows whose lines this paper has not spent). Only if no window of
// the whole chapter yields anything does the builder fall back to the verbatim
// quote it used before — a rung the four A1.1 papers never reach and
// tests/checkpoint.test.mjs pins them away from, and which exists so a
// curriculum whose dialogues carry no first-person German at all (the test
// fixtures) ships four Lesen items rather than none.

/**
 * THE CONJUGATION TABLE — 1st person singular → 3rd person singular, for every
 * verb an A1.1 dialogue puts after „Ich", plus the handful that turn up in a
 * second clause („Ich dusche und frühstücke jeden Tag.").
 *
 * It is a table and not a rule because German 3rd person is not a rule:
 * `essen → isst`, `schlafen → schläft`, `laden → lädt` are stem changes no
 * suffix machine produces, and a machine that produced `lest` for `lese` would
 * have shipped a form no German speaker says. tests/checkpoint.test.mjs pins
 * both directions: every „Ich <verb>" of every A1.1 dialogue is a key here, and
 * every value this builder actually emits is a form the course has taught by
 * the Lektion the checkpoint closes.
 */
export const VERB_3SG = new Map(Object.entries({
  bin: 'ist',
  brauche: 'braucht',
  bringe: 'bringt',
  dusche: 'duscht',
  esse: 'isst',
  habe: 'hat',
  heiße: 'heißt',
  höre: 'hört',
  kaufe: 'kauft',
  koche: 'kocht',
  komme: 'kommt',
  lade: 'lädt',
  lese: 'liest',
  möchte: 'möchte',
  rufe: 'ruft',
  schlafe: 'schläft',
  schwimme: 'schwimmt',
  spiele: 'spielt',
  stehe: 'steht',
  tanze: 'tanzt',
  wohne: 'wohnt',
  // second-clause verbs („… und frühstücke jeden Tag")
  arbeite: 'arbeitet',
  fahre: 'fährt',
  feiere: 'feiert',
  frühstücke: 'frühstückt',
  gehe: 'geht',
  lerne: 'lernt',
  mache: 'macht',
  sehe: 'sieht',
  spreche: 'spricht',
  trinke: 'trinkt',
}));

/**
 * TOKENS THAT KILL A REPORT. A sentence that addresses its hearer (2nd person,
 * „Sie"), speaks for a group („wir") or points at the speaker's own world with
 * a possessive („mein …" anywhere but the subject slot engine B owns) cannot be
 * reported about a third person without inventing a referent the text does not
 * carry. „bitte" is on the list for the same reason: „Ich möchte einen Kaffee,
 * bitte." is a request, and „Ana möchte einen Kaffee, bitte." is not German
 * about it.
 */
const REPORT_STOP = new Set([
  // The 2nd-person forms are spelled as a stem plus its endings rather than
  // written out, for the same reason NP_DET_RE writes `d?ein`: the register
  // guard in tests/checkpoint.test.mjs greps this file line by line and cannot
  // tell a word the course must NEVER say from a word it must never REPORT.
  ...['u', 'ich', 'ir', 'ein', 'eine', 'einen', 'einem', 'einer'].map((f) => `d${f}`),
  'sie', 'ihnen', 'ihr', 'ihre', 'ihren', 'ihrem', 'ihrer',
  'wir', 'uns', 'euch', 'euer', 'eure', 'unser', 'unsere',
  'mich', 'mir', 'mein', 'meine', 'meinen', 'meinem', 'meiner',
  'ich', 'bitte', 'man',
]);

/** The article a reported subject takes, keyed by the Wortfeld's own article. */
const REPORT_ARTICLE = { der: 'Der', die: 'Die', das: 'Das', plural: 'Die' };

/** Which article a subject pronoun stands for — engine C. */
const PRONOUN_ARTICLE = { er: 'der', sie: 'die', es: 'das' };

/** Sentences of one dialogue line, in reading order. */
const sentencesOf = (de) => String(de || '').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

/** „Ja, ich komme mit." is „Ich komme mit." with a particle in front of it. */
const PARTICLE_RE = /^(?:Ja|Nein|Gut|Doch)[,.]\s+/;

/** A word with its trailing punctuation removed, for comparisons. */
const bareWord = (w) => String(w).replace(/[.,!?;:„“"»«]/g, '');

/** Whitespace- and quote-normalised, for the substring guard and the tests. */
export const normaliseStatement = (s) => String(s || '')
  .replace(/[„“"»«]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

/** The words `knownUpTo` measures — the tokeniser of src/lib/checkpoint/lexis.js. */
const lexisTokens = (s) => String(s)
  .replace(/[^A-Za-zÄÖÜäöüß]+/g, ' ')
  .trim()
  .split(/\s+/)
  .filter((t) => t.length > 1);

/** Has the course taught every word of this statement by the end of the chapter? */
function statementIsKnown(statement, known, names) {
  if (!known) return true;
  return lexisTokens(statement).every((t) => known.has(t.toLowerCase()) || names.has(t.toLowerCase()));
}

/**
 * The nouns of the whole course UP TO this checkpoint with their article — the
 * article engines B and C put in front of a reported subject. It is cumulative
 * rather than chapter-local (`contentWords`, which the falsifier uses, is
 * deliberately chapter-local) because „Mein Bruder schläft auch." stands in
 * Lektion 11 and `Bruder` was taught in Lektion 3.
 */
function articleIndex(curriculum, lastNr) {
  const out = new Map();
  for (const l of curriculum?.lektionen || []) {
    if (!(l.nr <= lastNr)) continue;
    for (const w of l.wortfeld || []) {
      if (!w?.article) continue;
      const word = String(w.word || w.de || '').trim();
      if (word && !/\s/.test(word)) out.set(word, String(w.article));
      const plural = String(w.plural || '').trim();
      // „der Schlüssel / die Schlüssel“: a plural that SPELLS its own singular
      // must not overwrite it, or the report says „Die Schlüssel von Lena ist …“.
      if (plural && plural !== '—' && !/\s/.test(plural) && !out.has(plural)) out.set(plural, 'plural');
    }
  }
  return out;
}

/** Everything the three engines need, built once per checkpoint. */
function reportSpec(ctx) {
  const { curriculum, checkpoint, level } = ctx;
  return {
    articles: articleIndex(curriculum, checkpoint?.afterLektion ?? 0),
    known: knownUpTo(curriculum, checkpoint?.afterLektion ?? 0),
    names: namesOf(level),
  };
}

/** Does the rest of the sentence carry a word no report survives? */
const restIsReportable = (words, subject) => {
  const own = new Set(String(subject).split(/\s+/).map((p) => p.toLowerCase()));
  return words.every((w) => {
    const low = bareWord(w).toLowerCase();
    return !REPORT_STOP.has(low) && !own.has(low);
  });
};

/**
 * Turn the remaining words of a reported sentence into third person too, so
 * „Ich dusche und frühstücke jeden Tag." does not report as „… dusche und
 * frühstücke". Returns null when one of them has no taught third-person form.
 */
function reportRest(words, known, forms) {
  const out = [];
  for (const w of words) {
    const bare = bareWord(w);
    const third = VERB_3SG.get(bare.toLowerCase());
    if (!third || bare[0] !== bare[0].toLowerCase()) { out.push(w); continue; }
    if (known && !known.has(third)) return null;
    forms.push(third);
    out.push(third + w.slice(bare.length));
  }
  return out;
}

/**
 * ONE SENTENCE → ONE REPORT, or null. `before` is everything the learner has
 * already read inside this window, which is where engine C finds its antecedent.
 */
function reportSentence(sentence, { speaker, before, spec }) {
  const subject = String(speaker || '').trim();
  if (!subject) return null;
  const text = String(sentence || '').replace(PARTICLE_RE, '').trim();
  if (!text.endsWith('.')) return null;                 // questions and imperatives report nothing
  const words = text.split(/\s+/);
  if (words.length < 3) return null;
  const { known, names, articles } = spec;
  // The head is read case-insensitively because a stripped particle leaves it
  // lowercase („Ja, ich komme mit." → „ich komme mit.").
  const head = bareWord(words[0]).toLowerCase();
  const forms = [];
  let built = null;
  let engine = null;

  if (head === 'ich') {
    const third = VERB_3SG.get(bareWord(words[1]).toLowerCase());
    if (!third || (known && !known.has(third))) return null;
    if (!restIsReportable(words.slice(2), subject)) return null;
    const rest = reportRest(words.slice(2), known, forms);
    if (!rest) return null;
    forms.unshift(third);
    built = [subject, third + words[1].slice(bareWord(words[1]).length), ...rest].join(' ');
    engine = 'ich';
  } else if (head === 'mein' || head === 'meine') {
    const noun = bareWord(words[1]);
    const article = articles.get(noun);
    if (!article || !REPORT_ARTICLE[article]) return null;
    if (!restIsReportable(words.slice(2), subject)) return null;
    const rest = reportRest(words.slice(2), known, forms);
    if (!rest) return null;
    built = [REPORT_ARTICLE[article], words[1], 'von', subject, ...rest].join(' ');
    engine = 'possessiv';
  } else if (PRONOUN_ARTICLE[head]) {
    // A plural „Sie sprechen …" is not a singular antecedent (see the -en guard).
    const verb = bareWord(words[1]).toLowerCase();
    if (verb.endsWith('en')) return null;
    const wanted = PRONOUN_ARTICLE[head];
    let antecedent = null;
    for (const w of String(before || '').split(/\s+/)) {
      const bare = bareWord(w);
      if (articles.get(bare) === wanted) antecedent = bare;
    }
    if (!antecedent) return null;
    if (!restIsReportable(words.slice(1), subject)) return null;
    const rest = reportRest(words.slice(1), known, forms);
    if (!rest) return null;
    built = [REPORT_ARTICLE[wanted], antecedent, ...rest].join(' ');
    engine = 'pronomen';
  }

  if (!built) return null;
  if (!statementIsKnown(built, known, names)) return null;
  return { statement: built, engine, verbForms: forms };
}

/**
 * EVERY REPORT A WINDOW YIELDS, in reading order — the list `buildLesen` walks
 * and the list tests/checkpoint.test.mjs re-derives to prove that a Richtig
 * statement follows from EXACTLY ONE line of its text.
 */
export function windowReports(window, spec) {
  const out = [];
  const lines = window || [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const earlier = lines.slice(0, i).map((l) => String(l.de || ''));
    const sentences = sentencesOf(line.de);
    for (let s = 0; s < sentences.length; s += 1) {
      const before = [...earlier, ...sentences.slice(0, s)].join(' ');
      const report = reportSentence(sentences[s], { speaker: line.speaker, before, spec });
      if (!report) continue;
      out.push({ ...report, line, lineIndex: i, sentence: sentences[s] });
    }
  }
  return out;
}

/** The spec the tests need, built from the same two arguments as the builder. */
export const reportSpecFor = (curriculum, checkpoint) =>
  reportSpec({ curriculum, checkpoint, level: curriculum?.level });
/**
 * The speakers of ONE window — the only names the falsifier may swap in, so a
 * changed name is a name the learner can find in the printed text.
 *
 * ONLY SPEAKERS WHO ARE ONE WORD. „Herr Weber" is a title plus a surname; its
 * surname alone is not how the course names him, and a swap that produces
 * „Weber ist Studentin." trades a false statement for a broken one — the same
 * failure class as the bare-noun swap of review #8, one level up.
 */
function windowSpeakerNames(window) {
  const out = new Set();
  for (const line of window || []) {
    const speaker = String(line.speaker || '').trim();
    if (/\s/.test(speaker) || speaker.length < 3 || !/^[A-ZÄÖÜ]/.test(speaker)) continue;
    if (!TITLES.includes(speaker)) out.add(speaker);
  }
  return [...out];
}

/**
 * ONE DETAIL CHANGED IN A REPORT. The Falsch half inherits the Richtig half's
 * transformation and only then loses a detail, so both halves are reports of
 * the same shape and the length carries no signal (DaF review #9, MAJOR 3).
 *
 * Same three passes as `falsifyWindow` — detail, Wortfeld noun, adverb pair —
 * over the REPORTED sentence instead of the raw line, plus one guard the
 * review asked for by name: a name directly followed by a comma is an address,
 * not a fact, and swapping it („Lena, wann …?" → „Paul, …") is a
 * change no reader has to read the text to catch.
 */
function falsifyStatement(statement, text, ctxWords, rng) {
  const de = String(statement || '');
  for (const { allowVocab, allowAdverb } of FALSIFY_PASSES) {
    const tokens = [...de.matchAll(WORD_RE)];
    const isNumberToken = (t) => Boolean(t) && NUMBER_WORDS.includes(t[0].toLowerCase());
    const matches = shuffle(tokens.map((match, pos) => ({ match, pos })), rng);
    for (const { match, pos } of matches) {
      if ((allowVocab || allowAdverb) && sentenceInitial(de, match.index)) continue;
      if (de[match.index + match[0].length] === ',' && ctxWords.names.includes(match[0])) continue;
      const digitGroup = isNumberToken(tokens[pos])
        && (isNumberToken(tokens[pos - 1]) || isNumberToken(tokens[pos + 1]));
      const determiner = tokens[pos - 1] ? tokens[pos - 1][0] : '';
      const replacement = changedDetail(match[0], ctxWords, rng, {
        allowVocab, allowAdverb, digitGroup, determiner,
      });
      if (!replacement) continue;
      const changed = `${de.slice(0, match.index)}${replacement}${de.slice(match.index + match[0].length)}`;
      if (changed === de) continue;
      if (normaliseStatement(text).includes(normaliseStatement(changed))) continue;
      return { de: changed, from: match[0], to: replacement };
    }
  }
  return null;
}

/**
 * THE LADDER, one rung per paragraph (DaF review #9, MAJOR 3):
 *
 *   1. the windows in `lesenCandidates` order — the drawn one, this Lektion's
 *      others, the chapter's others, windows this paper has not spent first;
 *   2. inside a window, every line and every sentence of it that reports
 *      (`windowReports`), minus the lines this paper has already reported on;
 *   3. for a Falsch item, the first of those reports that also falsifies;
 *   4. and only if the whole chapter yields no report at all: the verbatim
 *      quote of the old builder, so a curriculum without first-person dialogue
 *      still ships four Lesen items. The A1.1 papers never reach rung 4 and
 *      tests/checkpoint.test.mjs pins them away from it.
 */
function pickLesenSource(candidates, wantRichtig, { rng, spec, chapterVocab, usedSources }) {
  for (const candidate of candidates) {
    const text = windowText(candidate.window);
    const names = windowSpeakerNames(candidate.window);
    const ctxWords = { names, vocab: chapterVocab };
    const reports = shuffle(windowReports(candidate.window, spec), rng)
      .filter((r) => !usedSources.has(lineKeyOf(candidate.lektion?.id ?? candidate.lektion?.nr, candidate.start + r.lineIndex)));
    for (const report of reports) {
      if (wantRichtig) return { candidate, text, report, statement: report.statement, changed: null };
      const falsified = falsifyStatement(report.statement, text, ctxWords, rng);
      if (falsified) {
        return {
          candidate, text, report, statement: falsified.de, changed: { from: falsified.from, to: falsified.to },
        };
      }
    }
  }
  // Rung 4: no report anywhere in the chapter (see the ladder above).
  for (const candidate of candidates) {
    const text = windowText(candidate.window);
    const ctxWords = { names: windowSpeakerNames(candidate.window), vocab: chapterVocab };
    if (wantRichtig) {
      const line = candidate.window[Math.floor(rng() * candidate.window.length)];
      return { candidate, text, report: null, statement: String(line.de), changed: null, line };
    }
    const falsified = falsifyWindow(candidate.window, text, ctxWords, rng);
    if (falsified) {
      return {
        candidate, text, report: null, statement: falsified.de, line: falsified.line,
        changed: { from: falsified.from, to: falsified.to },
      };
    }
  }
  return null;
}

function buildLesen(ctx) {
  const { checkpoint, rng, chapter, usedLineKeys } = ctx;
  const items = [];
  const withDialog = chapter.filter((l) => (l?.dialog?.lines || []).length >= 2);
  if (!withDialog.length) return items;
  const order = shuffle(withDialog, rng);
  // Two richtig and two falsch, in an order this checkpoint's seed decides.
  const truth = shuffle([true, true, false, false], rng);
  const chapterVocab = contentWords(chapter);
  const spec = reportSpec(ctx);
  const usedWindows = new Set();
  // Every line any Lesen item of this paper PRINTS — a hard bar, see
  // lesenCandidates: two items on one paragraph is one item and a giveaway.
  const usedLesenLines = new Set();
  // The lines this paper has already made a statement ABOUT — one report per
  // line, or two items of one paper hang on one sentence.
  const usedSources = new Set();

  for (let i = 0; i < SECTION_COUNTS.lesen; i += 1) {
    const preferredLektion = order[i % order.length];
    const lines = preferredLektion.dialog.lines;
    const span = Math.min(3, lines.length);
    const start = Math.floor(rng() * Math.max(1, lines.length - span + 1));
    const candidates = lesenCandidates(preferredLektion, start, order, usedLineKeys, usedWindows, usedLesenLines);
    if (!candidates.length) continue;
    const wantRichtig = truth[i];

    const picked = pickLesenSource(candidates, wantRichtig, { rng, spec, chapterVocab, usedSources });
    if (!picked) continue;
    const { candidate, text, report, statement, changed } = picked;
    const sourceLine = report ? report.line : picked.line;
    const sourceSentence = report ? report.sentence : String(sourceLine.de);
    const trueStatement = report ? report.statement : String(sourceLine.de);
    const speaker = String(sourceLine.speaker || '');

    usedWindows.add(windowKeyOf(candidate));
    for (const k of windowLineKeys(candidate)) { usedLineKeys.add(k); usedLesenLines.add(k); }
    if (report) {
      usedSources.add(lineKeyOf(candidate.lektion?.id ?? candidate.lektion?.nr, candidate.start + report.lineIndex));
    }

    const answer = wantRichtig ? 'Richtig' : 'Falsch';
    const explanationDe = changed
      ? `${speaker} sagt: „${sourceSentence}“ Im Text steht „${changed.from}“, nicht „${changed.to}“.`
      : `${speaker} sagt: „${sourceSentence}“ Die Aussage ist also richtig.`;
    items.push({
      id: `${checkpoint.id}-lesen-${i + 1}`,
      section: 'lesen',
      kind: 'trueFalse',
      mode: 'options',
      topic: 'lesen',
      lektionNr: candidate.lektion.nr,
      source: 'chapter',
      register: null,
      scored: true,
      // No speaker prefix any more: „Ana: " in front of the statement halved the
      // search space to one of three lines and made the section a lookup.
      promptDe: `Steht das im Text? „${statement}“`,
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
      // The mapping tests/checkpoint.test.mjs reads: which line this statement
      // reports on, what the TRUE report of that line is, which detail the
      // Falsch half changed, and which verb forms the transformation produced.
      statement,
      trueStatement,
      sourceLine: String(sourceLine.de),
      sourceSentence,
      sourceSpeaker: speaker,
      transform: report ? report.engine : null,
      verbForms: report ? report.verbForms : [],
      changed,
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
  const { checkpoint, rng, chapter, usedLineKeys } = ctx;
  const preferred = [];
  for (const l of chapter) {
    for (const idx of l?.sprechen?.readAloud || []) {
      const line = l?.dialog?.lines?.[idx];
      if (line) preferred.push({ lektionNr: l.nr, lektionId: l.id, idx, ...line });
    }
  }
  // Sprechen draws LAST, so it is the section that would otherwise re-read a
  // line the learner has just typed from dictation or just read in a Lesen
  // text — that is how one L11 line (the Freitag shopping line) came to stand
  // three times in checkpoint 4 (DaF review #8, MAJOR 2). Unused lines
  // come first; the used ones stay at the back as the fallback, so the section
  // is never short.
  // The preference ladder, in order: a designated read-aloud line nobody has
  // spent yet → ANY unspent line of the chapter → a designated line that was
  // spent → anything at all. The middle rung is what stops checkpoint 3 from
  // reading its own Lesen text aloud once the chapter's three read-aloud lines
  // have gone into Hören and Lesen; the last two keep the section at its two
  // items whatever the chapter looks like.
  const key = (l) => lineKeyOf(l.lektionId || l.lektionNr, l.idx);
  const free = (l) => !usedLineKeys.has(key(l));
  const pref = shuffle(preferred, rng);
  const all = shuffle(dialogLines(chapter), rng);
  const ordered = [];
  const seen = new Set();
  for (const bucket of [pref.filter(free), all.filter(free), pref, all]) {
    for (const line of bucket) {
      if (seen.has(key(line))) continue;
      seen.add(key(line));
      ordered.push(line);
    }
  }
  return take(ordered, SECTION_COUNTS.sprechen).map((line, i) => {
    usedLineKeys.add(lineKeyOf(line.lektionId || line.lektionNr, line.idx));
    return {
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
      // Folgenlos today (a read-aloud is scored by the microphone, not typed) and
      // deliberately set anyway: the flag belongs to the line, not to the section
      // that quotes it (DaF review #8, MAJOR 5).
      caseSensitive: lineIsCaseTask(line.de),
      explanationDe: line.en || null,
      hint: `Lektion ${line.lektionNr}`,
      poolItemId: null,
      type: 'read_aloud',
    };
  });
}

/**
 * THE POOL ITEMS THE EARLIER CHECKPOINTS OF THIS COURSE ALREADY USED.
 *
 * `usedPoolIds` was a per-checkpoint set, so `0ef58eff` („___ bin hier." →
 * `Ich`) stood as a Sprachbaustein in checkpoint 1 AND in checkpoint 3 (DaF
 * review #8, MAJOR 2). A checkpoint is built alone — CheckpointPage builds the
 * one the learner opened — so the exclusion cannot be threaded through a loop:
 * it is RE-DERIVED from the earlier checkpoints, which are deterministic in
 * their own ids and therefore always draw the same items. Four checkpoints, so
 * the recursion is cheap; a custom `seed` reshuffles this paper only, exactly
 * as "Nochmal" should.
 */
function poolIdsBefore(curriculum, checkpoint, pool) {
  const used = new Set();
  const cps = curriculum?.checkpoints || [];
  const idx = cps.findIndex((c) => c.nr === checkpoint.nr);
  if (idx <= 0) return used;
  for (const earlier of cps.slice(0, idx)) {
    for (const item of buildCheckpoint({ curriculum, checkpoint: earlier, pool })) {
      if (item.poolItemId) used.add(item.poolItemId);
    }
  }
  return used;
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
    curriculum,
    level: curriculum.level,
    chapter: chapterLektionen(curriculum, checkpoint),
    earlier: earlierLektionen(curriculum, checkpoint),
    usedPoolIds: poolIdsBefore(curriculum, checkpoint, pool),
    // Every dialogue line this paper has already spent, on ANY of its three
    // skill sections (DaF review #8, MAJOR 2). Hören fills it, Lesen honours
    // and extends it with every line of the windows it prints, Sprechen reads
    // it last — which is why the builders below run in that order.
    usedLineKeys: new Set(),
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
