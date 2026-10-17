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
// ONE PAPER IS ONE UNIT: WHAT A SECTION PRINTS, ANOTHER MAY NOT ASK FOR.
// The practice draw has capped that since DaF review #11 (`leaksAnswer`, the
// sixth diversity axis) and the graded paper did not, so checkpoint 3 printed
// the Lektion-8 read-aloud line about Tuesday afternoon beside two
// Sprachbausteine whose answers were `Dienstag` and `Hast` — 2 of 20 points
// handed over before the learner read them (DaF review #14, MAJOR 3). The rule
// lives in `buildLesson.js` and is IMPORTED here, never written twice: the two
// surfaces share one definition of "already printed" or they drift the first
// time one of them is tuned. What counts as printed is decided by
// `printedSurface`: a dictation and a read-aloud PRINT their own text (the
// learner writes it down himself), a Lesen item prints its text, everything
// else prints its prompt — without that, the two pairs of checkpoint 3 are
// invisible, because a read-aloud line stands in `text` and nowhere else.
//
// A FALSE STATEMENT MUST BE A SENTENCE ONE CAN ONLY REFUTE BY READING.
// Whoever recognises it by its FORM has solved the item without seeing the text
// (DaF review #15, MAJOR 3). The graded checkpoint 2 printed „Ana braucht
// **einen Taschen** und ein Telefon." because the noun table let a plural
// overwrite its own singular, and „Tim kauft den Stuhl und **die
// E-Mail-Adresse**." because gender was the only bar a swap had to clear. So
// every swap now clears four: the NP slot, gender AND number resolved against
// the determiner that stands in the text, the semantic class, and the chapter's
// printed vocabulary — and the finished statement is re-checked for agreement
// before it leaves the falsifier, whichever pass produced it.
//
// Everything is deterministic in `seed` (mulberry32), so tests can pin the
// exact 20 items and "Nochmal" can reshuffle the ORDER without changing the
// test a learner already saw.
import { checkAnswer, tagError, RESULT, checkOptionsFor } from '../lesson/check.js';
import { courseWritingTasks, writingTaskByKey } from '../../data/writingTasks.js';
import { knownUpTo, untaughtTokens, namesOf } from './lexis.js';
import { politeCaseItem } from '../../data/lessonPools/quality.js';
import { leaksAnswer, planPractice } from '../lesson/buildLesson.js';
import { deferredConstructionHits } from '../../data/curricula/constructions.js';

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

// ── the paper-wide leak guard (DaF review #14, MAJOR 3) ─────────────────────

/**
 * WHAT AN ITEM PRINTS ON THE PAPER.
 *
 * Not the same thing as "its prompt". A dictation and a read-aloud put their
 * whole sentence in front of the learner — he writes it down, or reads it out —
 * and a Lesen item prints its text above the statement. The read-aloud line is
 * printed ONLY in `text`, which is why reading prompts alone missed the two
 * pairs of checkpoint 3 that started this.
 */
export const printedSurface = (item) => {
  if (!item) return '';
  const parts = [item.promptDe];
  if (item.type === 'dictation' || item.type === 'read_aloud') parts.push(item.text || item.audioText);
  else if (item.section === 'lesen') parts.push(item.text);
  return parts.filter(Boolean).join(' ');
};

/**
 * Whose ANSWER is language, i.e. can be leaked at all. A Lesen item answers
 * `Richtig`/`Falsch` and the graded writing task answers `true`: those are
 * verdicts, not productions, and reading them as leakable answers would make
 * every prompt containing „richtig" a leak.
 */
const VERDICT_KINDS = new Set(['trueFalse', 'gradedWriting']);
export const leakable = (item) => Boolean(item) && !VERDICT_KINDS.has(item.kind);

/** True when either item's whole production is already printed by the other. */
export const leaksAcross = (a, b) =>
  (leakable(a) && leaksAnswer(a, { questionDe: printedSurface(b) })) ||
  (leakable(b) && leaksAnswer(b, { questionDe: printedSurface(a) }));

/** Every leaking pair of one paper — the measurement tests/checkpoint.test.mjs runs. */
export const checkpointLeaks = (items = []) => {
  const out = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (leaksAcross(items[i], items[j])) out.push([items[i].id, items[j].id]);
    }
  }
  return out;
};

/**
 * WHERE THE GUARD HAD TO GIVE WAY, per paper.
 *
 * The cap is the LAST rung of every preference, exactly as `relax.leak` is the
 * first relaxation of the practice draw: a chapter too poor to fill a section
 * fills it anyway rather than shipping a 19-item paper. But it never does so
 * silently — every seat that had to take a leaking candidate is recorded here,
 * `checkpointReport(items)` reads it, and the test forbids a non-empty report
 * on the four real papers.
 */
const checkpointReports = new WeakMap();
export const checkpointReport = (items) => checkpointReports.get(items) || { leakFallbacks: [] };

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
 * May the checkpoint make the learner TYPE or SAY this dialogue line? Only when the course has taught
 * its grammar by `afterLektion` — the line horizon the pool build stamps (`lineHorizon`, DaF review #3
 * for A1.2, BLOCKER 2: checkpoint 1 dictated „Die Anzeige ist von Ihnen?", a dative taught in L11).
 * null = a construction the level never teaches. A pool without the map (A1.1, a test pool) is not
 * filtered, so its papers are unchanged.
 */
export const lineServable = (ctx, line) => {
  const map = ctx.pool && !Array.isArray(ctx.pool) ? ctx.pool.lineHorizon : null;
  if (!map) return true;
  const h = map[lineKeyOf(line.lektionId || line.lektionNr, line.idx)];
  return h === undefined || (h !== null && h <= ctx.checkpoint.afterLektion);
};

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

/**
 * A DICTATION AND A READ-ALOUD ARE PRODUCTION, AND A CHECKPOINT IS GRADED.
 *
 * DaF review #13, MAJOR 3: `a1.1-cp1-hoeren-3` was „Bitte füllen Sie das Formular
 * aus.“ — the Satzklammer of Lektion 11, typed and scored after Lektion 3 — and
 * `a1.1-cp1-sprechen-2` read „Ja, ein Baby. Der Mann von meiner Schwester …“
 * aloud, with the indefinite article of Lektion 6 and the possessive of Lektion 12
 * in it. RULE 15b guarded exactly this on the LEKTION's windows and did not run on
 * the checkpoints at all.
 *
 * A dialogue line may SAY all of that (CONTRACT §2 — it is the audio script); what
 * a checkpoint may not do is put it in the learner's mouth. So lines whose
 * constructions the course has not reached by this checkpoint go to the BACK of the
 * preference, never out of it: a chapter too poor to fill a section still fills it,
 * and `scripts/validate-curriculum.mjs` reports what is left (RULE 15b now reads
 * every checkpoint dictation and read-aloud).
 *
 * It orders WITHIN a freeness bucket, never across one: a line another section has
 * already spent stays behind an unspent line whatever its constructions, or one
 * paper dictates and prints the same sentence.
 */
const clampFreeFirst = (lines, curriculum, afterLektion) => {
  const clean = (l) => deferredConstructionHits(curriculum, afterLektion, l.de).length === 0;
  return [...lines.filter(clean), ...lines.filter((l) => !clean(l))];
};

/**
 * A CHECKPOINT DICTATES NOTHING LONGER THAN ITS OWN CHAPTER DOES (DaF review #18, Minor 10).
 *
 * `a1.1-cp1-hoeren-1` dictated the longest line of Lektion 2 — twelve words, the RULE 5 ceiling
 * for a line the learner HEARS — and then the ten-word enumeration with three commas that the L2
 * comment itself calls „a punctuation test, not a listening test“ and keeps out of the Lektion's
 * own dictation window. The preference read freeness, constructions and reportability and never
 * the length, so a line the course would never dictate in a Lektion was dictated in the exam.
 *
 * The ceiling is MEASURED, not chosen: the longest line the chapter's Lektionen themselves put in
 * a `hoeren.lines` window. Measured 2026-09-14 (round 20) off `a11.js`: chapter 1 of A1.1 is NINE
 * words (L2 window [7,3] — line 3 „Ich bin ledig. Ist das Formular für die Adresse?“, the
 * Familienstand answer round 19 lengthened from six words in the same commit that wrote „six“
 * here — DaF review #19, Minor 25), chapter 2 eight (L5 [1,5]), chapter 3 nine (L8 [3,7]),
 * chapter 4 ten (L10 [1,9], the `DICTATION_MAX_WORDS` line). Lines above it go to the BACK of the
 * preference, never out of it — a chapter too poor to fill the section still fills it — and this
 * bucket is the outermost, so a short reportable line beats a long unreportable one: Lesen has
 * four windows to choose from, a learner typing from one hearing has one. A chapter with no
 * window at all (a fixture, a draft) falls back to `DICTATION_MAX_WORDS`, the longest line any
 * A1.1 Lektion dictates. `tests/checkpoint.test.mjs` pins all of it: the four measured ceilings,
 * no dictation of the four real papers longer than its chapter's ceiling, none longer than ten
 * words — and the dictation ids of the four papers themselves (next paragraph).
 *
 * THE ORDERING MOVES EVERY LATER DRAW OF THE PAPER (DaF review #19, Minor 24). `dictableFirst`
 * runs before `take(lines, 3)`, so a changed ceiling — or a changed line length under an
 * unchanged ceiling — changes WHICH three lines Hören spends, `usedLineKeys` with them, and
 * through `usedLineKeys` every section drawn after Hören: the Lesen windows and their
 * swap words, the Wortfeld distractors, the Bausteine. Round 19 said „cp1 no longer dictates 12
 * words“ and all four papers had been silently rebuilt. That is by design (the sections share
 * one „unused first“ rule), but it must be VISIBLE: `tests/checkpoint.test.mjs` pins the
 * dictation ids and lines of the four real papers, so a reorder fails a test with the old and
 * new paper side by side instead of shipping unannounced.
 */
export const DICTATION_MAX_WORDS = 10;
const wordCount = (de) => String(de || '').trim().split(/\s+/).filter(Boolean).length;
export function dictationCeiling(chapter) {
  let max = 0;
  for (const l of chapter || []) {
    const lines = l?.dialog?.lines || [];
    for (const i of l?.hoeren?.lines || []) {
      const de = typeof lines[i] === 'string' ? lines[i] : lines[i]?.de;
      if (de) max = Math.max(max, wordCount(de));
    }
  }
  return max || DICTATION_MAX_WORDS;
}
const dictableFirst = (lines, ceiling) => [
  ...lines.filter((l) => wordCount(l.de) <= ceiling),
  ...lines.filter((l) => wordCount(l.de) > ceiling),
];

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

/**
 * THE minLektion FILTER — the same hard rule `pickPracticeItems` applies, at the
 * checkpoint's pool door (round 12).
 *
 * `scripts/build-lesson-pool.mjs` stamps every pool item with `minLektion`: the
 * first Lektion by which the course has taught every German word of the item.
 * The lesson engine has treated it as a filter that is never relaxed since round
 * 10 — „ein Vorgriff ist schlimmer als ein kurzer Block“ — and this builder did
 * not apply it at all. It only ever sorted by `untaughtAt`, which asks the same
 * question with the CHECKPOINT's own lexis table and puts the answer at the back
 * of the bucket instead of outside it. That is a sort, and a sort seats the item
 * whenever the bucket runs dry: when a cache item left the pool this round,
 * Checkpoint 2 (`afterLektion: 6`) seated `bb5c0422`, stamped `minLektion: 8`,
 * and RULE 11b went 0 → 1 until a hand item filled the seat back up.
 *
 * So it is a FILTER, before the `untaughtAt` sort and never relaxed by it: an
 * item may only be drawn by a checkpoint that closes a Lektion at or after its
 * stamp. A section that cannot fill under it is a POOL finding and must be
 * reported as one (tests/checkpoint.test.mjs names the items it would need) —
 * a graded paper that asks for a word the chapter never taught is the worse
 * failure, which is exactly the trade `untaughtAt`'s own header gets wrong for
 * an item whose lexis the course has not reached YET rather than never.
 *
 * `minLektion: null` means the course never teaches all of the item's words, so
 * no checkpoint may serve it either. An item with NO stamp (a hand-built pool in
 * a test fixture) is left alone — only a stamped item can be filtered.
 *
 * ONE PRECONDITION, because a stamp is a POSITION IN A COURSE and not a number:
 * `minLektion` counts Lektionen of the curriculum the pool was built from, so it
 * may only be compared with a checkpoint of THAT curriculum. `stampsApplyTo`
 * below says when that holds — the curriculum has to reach at least as far as
 * the pool's stamps do. The three-Lektion fixture of tests/fixtures draws from
 * the real twelve-Lektion A1.1 pool on purpose, and „Lektion 3“ there is not
 * „Lektion 3“ here; comparing the two would not enforce the rule, it would
 * enforce an accident. (`untaughtAt` has the same problem and answers it the
 * other way, by recomputing the lexis from whatever curriculum it is handed.)
 */
const stampScale = new WeakMap();
/** The highest `minLektion` the pool stamps — how far its course reaches. */
const poolStampReach = (pool) => {
  const key = pool && typeof pool === 'object' ? pool : null;
  if (key && stampScale.has(key)) return stampScale.get(key);
  let reach = 0;
  for (const item of poolItems(pool)) {
    if (Number.isInteger(item?.minLektion) && item.minLektion > reach) reach = item.minLektion;
  }
  if (key) stampScale.set(key, reach);
  return reach;
};

/**
 * True when this curriculum's Lektion numbers and this pool's stamps are the
 * same scale — i.e. the curriculum runs at least as far as the pool was stamped
 * for. A shorter curriculum is a fixture drawing from a foreign course's pool,
 * and its checkpoint numbers mean nothing to the stamp.
 */
export const stampsApplyTo = (curriculum, pool) =>
  Math.max(0, ...((curriculum?.lektionen || []).map((l) => Number(l?.nr) || 0))) >= poolStampReach(pool);

export const servableBy = (item, afterLektion) =>
  !Object.prototype.hasOwnProperty.call(item || {}, 'minLektion') ||
  (Number.isInteger(item.minLektion)
    && (!Number.isInteger(afterLektion) || item.minLektion <= afterLektion));

const byTopics = (pool, topics, afterLektion) => {
  const wanted = new Set(topics);
  return poolItems(pool)
    .filter((i) => wanted.has(i.topic) && !isNextLevelPreview(i) && servableBy(i, afterLektion))
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
function drawPool(
  pool,
  topics,
  n,
  rng,
  usedIds,
  { typedOnly = false, untaught = () => false, afterLektion, accept = () => true, onSeat = () => {}, onRelax = () => {}, seen = new Set(), spent = new Set() } = {},
) {
  if (n <= 0 || !topics.length) return [];
  const buckets = topics.map((topic) => {
    const all = shuffle(byTopics(pool, [topic], afterLektion).filter((i) => !usedIds.has(i.id)), rng);
    const pick = (dirty) => {
      const some = all.filter((i) => untaught(i) === dirty);
      const typed = some.filter(isTyped);
      const ordered = typedOnly ? typed : [...typed, ...some.filter((i) => !isTyped(i))];
      // TRANSFER (2026-10 review): an item the learner already answered in the
      // chapter's lessons tests memory of that item, not the rule — 3–5 of the
      // 8 drawn items per checkpoint were exactly that. Unseen items of the
      // same topic go first; a seen one is only the fallback of a thin topic. Behind both: an
      // item an earlier paper of this window drew — its result screen showed the answer (RETAKES).
      const fresh = ordered.filter((i) => !spent.has(i.id));
      return [
        ...fresh.filter((i) => !seen.has(i.id)),
        ...fresh.filter((i) => seen.has(i.id)),
        ...ordered.filter((i) => spent.has(i.id)),
      ];
    };
    return [...pick(false), ...pick(true)];
  });
  const out = [];
  // Rejected by the paper-wide leak cap (DaF review #14, MAJOR 3) — kept in
  // draw order as the LAST rung: a topic too thin to offer a clean item still
  // fills its seat, and `checkpointReport` names every seat that had to.
  const deferred = [];
  const seat = (next, relaxed) => {
    out.push(next);
    usedIds.add(next.id);
    onSeat(next);
    if (relaxed) onRelax(next);
  };
  let progress = true;
  while (out.length < n && progress) {
    progress = false;
    for (const bucket of buckets) {
      if (out.length >= n) break;
      const next = bucket.shift();
      if (!next) continue;
      progress = true;
      if (!accept(next)) {
        deferred.push(next);
        continue;
      }
      seat(next, false);
    }
  }
  for (const next of deferred) {
    if (out.length >= n) break;
    seat(next, true);
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
function buildHoerenDictation(ctx) {
  const { checkpoint, rng, chapter, usedLineKeys } = ctx;
  const items = [];
  // Hören draws first, so nothing is taken yet — the filter is here anyway
  // because "unused first, then whatever is left" is the rule all three skill
  // sections share (DaF review #8, MAJOR 2), and Hören must not become the one
  // section that is exempt the day the order changes.
  // Construction-free lines first (RULE 15b reads checkpoint dictations too, review #13
  // MAJOR 3): a learner must not be asked to reproduce a Satzklammer or a possessive
  // the course has not taught yet — the same preference the read-aloud section applies.
  // …and, among those, the lines Lesen cannot turn into a report LAST-BUT-ONE:
  // a reportable statement is the raw material of a Lesen window, and a poor
  // chapter (chapter 1 has three construction-free reportable lines) must not
  // have Hören eat the one line the fourth Lesen window needs. Dictation takes
  // what Lesen cannot use — greetings, questions, formulas — first.
  // Between the two: a line that is no report itself but stands in a window whose report a VALUE
  // or a CONTRARY can contradict — „Kostet die Fahrkarte zwanzig Euro?" above „Nein, sie kostet
  // fünfzehn Euro.", the line the „sie" needs. Without those windows Lesen is left with polarity
  // changes, and an added negation can never be balanced on the Richtig side (DaF review #7,
  // MAJOR 8: A1.1's checkpoint 4 lost its last cue-free Falsch to this dictation).
  const spec = reportSpec(ctx);
  const reportable = new Set();
  const lesenNeeds = new Set();
  const kindsOnly = mulberry32(1); // which kinds exist, never which value — not the paper's stream
  for (const lektion of chapter) {
    for (const { window, start } of windowsOf(lektion)) {
      for (const r of windowReports(window, spec)) {
        reportable.add(lineKeyOf(lektion.id, start + r.lineIndex));
        if (contradictions(r.statement, spec.nouns, kindsOnly).some((c) => c.kind !== 'polarity')) {
          window.forEach((_, k) => lesenNeeds.add(lineKeyOf(lektion.id, start + k)));
        }
      }
    }
  }
  const tier = (l) => {
    const key = lineKeyOf(l.lektionId || l.lektionNr, l.idx);
    if (reportable.has(key)) return 2;
    return lesenNeeds.has(key) ? 1 : 0;
  };
  const unreportableFirst = (ls) => [0, 1, 2].flatMap((t) => ls.filter((l) => tier(l) === t));
  // …and, outermost, the lines the chapter itself would dictate: no longer than the longest
  // line of its Lektionen's own dictation windows (`dictationCeiling`, DaF review #18, Minor 10).
  const lines = dictableFirst(unreportableFirst(clampFreeFirst(
    freeLinesFirst(shuffle(dialogLines(chapter).filter((l) => lineServable(ctx, l)), rng), usedLineKeys),
    ctx.curriculum,
    checkpoint.afterLektion,
  )), dictationCeiling(chapter));
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
    ctx.seat(items[items.length - 1]);
  });
  return items;
}

// The two „Welches Wort hören Sie?“ items — seated AFTER the three line-drawn
// sections, because a Wortfeld word is free to move and a dialogue line is not:
// `a1.1-cp1-hoeren-4` asked for „die Schwester“ while `a1.1-cp1-lesen-2` printed
// „… ein Bruder, eine Schwester.“ on the same paper (DaF review #14, MAJOR 3).
// A word whose answer is already printed goes to the BACK of the draw, never out
// of it, and a seat that had to take one is recorded (see checkpointReport).
function buildHoerenWords(ctx) {
  const { checkpoint, rng, chapter } = ctx;
  const items = [];

  const words = shuffle(wortfeldWords(chapter), rng);
  const probe = (w) => ({
    section: 'hoeren', kind: 'wordChoice', promptDe: 'Welches Wort hören Sie?', answer: w.de, accepted: [w.de],
  });
  const remaining = [...words];
  const targets = [];
  for (let n = 0; n < 2 && remaining.length; n += 1) {
    let at = remaining.findIndex((w) => !ctx.leaks(probe(w)));
    if (at < 0) {
      at = 0;
      ctx.relax('hoeren', `${checkpoint.id}-hoeren-${n + 4}: ${remaining[0].de}`);
    }
    targets.push(remaining.splice(at, 1)[0]);
  }
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
    ctx.seat(items[items.length - 1]);
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
//      not reading. A false statement is now built from a line of THIS text, and
//      the text refutes it (see CONTRADICTION below). That is what Lesen Teil 1/2/3
//      of *Start Deutsch 1* asks: the statement is plausible and you have to read
//      the text to reject it.
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

/**
 * The single-digit number words — the only replacements allowed INSIDE a digit
 * group (DaF review #6, MAJOR 7). A phone number is spoken digit by digit
 * ("Null vier zwei – drei drei acht eins"), so a two-digit word in the middle
 * of it ("**Siebzehn** vier zwei") is not a changed detail, it is a number that
 * cannot be dictated. Here `eins` and `null` are back in: they are digits, not
 * counted quantities, so neither is broken German in this position.
 */
const DIGIT_NUMBERS = NUMBER_WORDS.slice(0, 10);

/**
 * THE MAGNITUDE A CHANGED VALUE KEEPS. „um neunzig Uhr" and „Ana braucht achtzig Zimmer"
 * are not false statements, they are numbers no reader has to check against the text. So a
 * number up to twelve becomes another of zwei–zwölf (which is also every hour a clock time
 * can take), a teen another teen, a ten another ten. „eins" and „null" are never put in:
 * „eins Euro" and „um eins Uhr" are not German, and „null Euro" reads as a mistake.
 */
const SMALL_NUMBERS = NUMBER_WORDS.slice(2, 13);
const TEEN_NUMBERS = NUMBER_WORDS.slice(13, 20);
const TEN_NUMBERS = NUMBER_WORDS.slice(20);
const sameMagnitude = (word) => {
  const n = NUMBER_WORDS.indexOf(word);
  if (n <= 12) return SMALL_NUMBERS;
  return n <= 19 ? TEEN_NUMBERS : TEN_NUMBERS;
};

/** A word as it appears in a line — letters (incl. umlauts) or a run of digits. */
const WORD_RE = /[A-Za-zÄÖÜäöüß]+|\d+/g;

/**
 * THE NOUNS OF A SET OF LEKTIONEN WITH THEIR GENDER AND THEIR NUMBER, as a Map
 * `wort → { article, number, plural, en, isPluralOfSelf }` — what the agreement check
 * and a polarity change read (`resolvedReading`).
 *
 * It is built from the Wortfeld, not from the dialogue lines: the Wortfeld carries
 * `article` and `plural`, so gender and number are data we have (DaF review #6, MAJOR 7).
 *
 * THE PLURAL MUST NOT OVERWRITE THE SINGULAR (DaF review #15, MAJOR 3). Writing the
 * singular and then the plural into one Map let every noun whose plural is spelled like
 * its singular lose its gender — `der Computer` became `{ article: 'plural' }`, and
 * „einen Computer" read as a plural slot. Fifteen Wortfeld entries of A1.1 have that
 * shape (Lehrer, Schalter, Eltern, Geschwister, Euro, Kugelschreiber, Fenster, Zimmer,
 * Schlüssel, Computer, Verkäufer, Wecker, Kuchen, Kellner, Fahrer). So the singular keeps
 * its gender, a plural form only takes a key that is still free, and a form that is BOTH
 * is marked `isPluralOfSelf` and carries both readings: the determiner standing in the
 * text decides which one it is („einen Computer" is singular, „die Lehrer" undecided).
 */
function contentWords(lektionen) {
  const out = new Map();
  const bothNumbers = new Set();
  for (const l of lektionen || []) {
    for (const w of l?.wortfeld || []) {
      if (!w?.article) continue;                       // greetings, verbs, adverbs: no gender to match
      const word = String(w.word || w.de || '').trim();
      const plural = String(w.plural || '').trim();
      const hasPlural = Boolean(plural) && plural !== '—' && !/\s/.test(plural);
      if (word && !/\s/.test(word) && !out.has(word)) {
        out.set(word, {
          article: String(w.article), number: 'sg', plural: w.plural || null, en: String(w.en || ''),
        });
      }
      if (!hasPlural) continue;
      if (plural === word) bothNumbers.add(plural);    // same form in both numbers: undecidable alone
      else if (!out.has(plural)) {
        out.set(plural, { article: 'plural', number: 'pl', plural: null, en: String(w.en || '') });
      }
    }
  }
  for (const word of bothNumbers) {
    const entry = out.get(word);
    if (entry) out.set(word, { ...entry, isPluralOfSelf: true });
  }
  return out;
}

/**
 * AGREEMENT, AS A FUNCTION OF THE DATA (DaF review #15, MAJOR 3, „Zweitens“).
 *
 * A swap used to be waved through when two Wortfeld entries carried the same
 * `article` string. That is a proxy for agreement, not agreement: it cannot see
 * number at all, and it silently trusted a table that had already lost the
 * gender. So gender and number are now read off the Wortfeld as FEATURES, the
 * determiner standing in the text is read as the features it admits, and every
 * changed statement is checked against both BEFORE it is returned. A determiner
 * or a noun this file does not know is
 * never a violation: the guard only rejects what it can prove wrong.
 */
const GENDER_OF_ARTICLE = { der: 'm', die: 'f', das: 'n' };

/** What a determiner form admits: 'm.sg' | 'f.sg' | 'n.sg' | 'pl'. */
const DET_FEATURES = new Map(Object.entries({
  der: ['m.sg', 'f.sg', 'pl'], die: ['f.sg', 'pl'], das: ['n.sg'],
  den: ['m.sg', 'pl'], dem: ['m.sg', 'n.sg'], des: ['m.sg', 'n.sg'],
  ein: ['m.sg', 'n.sg'], eine: ['f.sg'], einen: ['m.sg'],
  einem: ['m.sg', 'n.sg'], einer: ['f.sg'], eines: ['m.sg', 'n.sg'],
  dieser: ['m.sg', 'f.sg'], diese: ['f.sg', 'pl'], diesen: ['m.sg', 'pl'],
  diesem: ['m.sg', 'n.sg'], dieses: ['n.sg', 'm.sg'],
}));

/** The ein-declension endings every possessive and `kein` share. */
const POSSESSIVE_ENDINGS = {
  '': ['m.sg', 'n.sg'], e: ['f.sg', 'pl'], en: ['m.sg', 'pl'],
  em: ['m.sg', 'n.sg'], er: ['f.sg'], es: ['m.sg', 'n.sg'],
};
/**
 * `eur` carries the inflected forms of `euer` (eure, euren …). The 2nd-person stem is
 * written `d?ein` because the register guard in tests/checkpoint.test.mjs greps this file
 * line by line and cannot tell a determiner it must read from a word it must never say.
 */
const POSSESSIVE_STEMS = ['kein', 'unser', 'euer', 'eur', 'mein', 'd?ein', 'sein', 'ihr'];

/** The features a determiner admits, or null when this file does not know it. */
function determinerFeatures(determiner) {
  const det = String(determiner || '').toLowerCase();
  if (!det) return null;
  if (DET_FEATURES.has(det)) return DET_FEATURES.get(det);
  for (const pattern of POSSESSIVE_STEMS) {
    const stem = pattern.replace('d?', '');             // see POSSESSIVE_STEMS for why the stem is a pattern
    for (const form of pattern.includes('d?') ? [stem, `d${stem}`] : [stem]) {
      if (!det.startsWith(form)) continue;
      const ending = det.slice(form.length);
      if (Object.prototype.hasOwnProperty.call(POSSESSIVE_ENDINGS, ending)) {
        return POSSESSIVE_ENDINGS[ending];
      }
    }
  }
  return null;
}

/** The readings a Wortfeld noun has, or null when the chapter does not know it. */
function nounReadings(word, vocab) {
  const entry = vocab?.get?.(word);
  if (!entry) return null;
  const out = [];
  if (entry.number === 'pl') out.push('pl');
  else if (GENDER_OF_ARTICLE[entry.article]) out.push(`${GENDER_OF_ARTICLE[entry.article]}.sg`);
  if (entry.isPluralOfSelf && !out.includes('pl')) out.push('pl');
  return out.length ? out : null;
}

/**
 * The ONE reading a determiner leaves a noun, or null when the pair is unknown,
 * impossible or ambiguous. Ambiguity is not an error, it is a stop sign: „die
 * Lehrer“ may be one female teacher or several of any gender, and a swap that
 * guesses is the review's finding one determiner to the left.
 */
function resolvedReading(word, determiner, vocab) {
  const feats = determinerFeatures(determiner);
  const readings = nounReadings(word, vocab);
  if (!feats || !readings) return null;
  const both = readings.filter((r) => feats.includes(r));
  return both.length === 1 ? both[0] : null;
}

/**
 * Every determiner–noun pair of a statement this file can prove ungrammatical.
 * The builder calls it on every statement it changes; tests/checkpoint.test.mjs
 * calls it on whole statements of all four papers.
 */
export function agreementViolations(text, vocab) {
  const out = [];
  const tokens = [...String(text || '').matchAll(WORD_RE)];
  for (let i = 1; i < tokens.length; i += 1) {
    const feats = determinerFeatures(tokens[i - 1][0]);
    const readings = nounReadings(tokens[i][0], vocab);
    if (!feats || !readings) continue;
    if (!readings.some((r) => feats.includes(r))) {
      out.push({ determiner: tokens[i - 1][0], noun: tokens[i][0], readings, admits: feats });
    }
  }
  return out;
}

/** Pick a member of `list` that is not `not` — deterministic in `rng`. */
function pickOther(list, not, rng) {
  const options = list.filter((x) => x.toLowerCase() !== String(not).toLowerCase());
  if (!options.length) return null;
  return options[Math.floor(rng() * options.length)];
}

// ── CONTRADICTION (DaF review A1.2 #5, MAJOR 8) ─────────────────────────────
//
// RICHTIG FOLLOWS FROM THE TEXT; FALSCH IS REFUTED BY IT. Until 2026-10-17 a Falsch
// statement was its report with one token swapped for another of the same class: a
// number, a weekday, a speaker's name, a printed Wortfeld noun, an adverb's opposite.
// Only the number made it false. „Lena hat den Fahrplan." against Tim's „Ich habe den
// Fahrplan." and „Ana möchte ein Taxi." against „Ich möchte ein Ticket." are not refuted
// by their texts, only not stated — and 41 of the 48 Falsch statements of the twelve
// A1.1 and A1.2 papers swapped a person or a thing (measured 2026-10-17), so a learner
// who had read every word still had to guess.
//
// A Falsch statement now contradicts its report in one of three ways, and never touches a
// person or a thing:
//
//   VALUE     a number word or a figure — a price, a clock time, an age, a count, a digit
//             of a phone number — for another. One stated value excludes the other,
//             except under a frequency adverb („Ich bin manchmal zehn Minuten zu spät."):
//             there a value is one of several, and none is changed.
//   CONTRARY  the one-word predicate of „ist/sind/war/waren" for its contrary („Der Mund ist
//             klein." → „… groß."), from a table of true contraries only (CONTRARIES).
//   POLARITY  „nicht" or „nie" taken out; „kein-" made „ein-" before a countable singular
//             and taken out before a mass noun or a plural („kein Fieber" → „Fieber");
//             „ein-" made „kein-"; „kein-" put before a bare noun („braucht Ana kein
//             Geld"); „viele" made „keine"; „nicht" put where German puts it — before the
//             predicate of sein, before a separable particle or a participle („sieht nicht
//             fern", „hat nicht gearbeitet"), after a definite object closing the clause
//             („hat den Fahrplan nicht"). Two coordinated phrases are negated together
//             („keinen Computer und kein Telefon"). None of them is made where it would
//             change more than the polarity: beside a scope word (gern, auch, nur, noch,
//             immer …), after a preposition, inside a list, before a unit, or where a
//             negation already stands.
//
// tests/a12-rebuild.test.mjs holds the annotated cases (folgt / widerspricht / offen) and
// checks every Falsch statement of the twelve papers of both levels against these kinds.

/** A value under one of these is one of several, so changing it refutes nothing. */
const FREQUENCY_WORDS = new Set(['manchmal', 'oft', 'meistens', 'selten']);

/**
 * …and under one of these it is a bound, not a value: „Ana hat mindestens zwei Koffer." is not
 * refuted by „mindestens zwölf" (DaF review #6, MAJOR 8). Nor is a number after „mehr als",
 * „weniger als", „bis zu", „über" or „unter".
 */
const BOUND_WORDS = new Set(['mindestens', 'höchstens', 'fast', 'etwa', 'ungefähr', 'circa', 'rund', 'knapp']);
const BOUND_PHRASE_RE = /\b(?:mehr als|weniger als|bis zu)\b/;
/**
 * …nor a time a preposition makes a bound or an end of an interval: an arrival at seven makes
 * „vor zehn Uhr" and „vor acht Uhr" both true, a start at nine „nach acht" and „nach neun"
 * (DaF review #7, MAJOR 8). „um acht Uhr", a count or a price states one value and still changes.
 */
const TIME_BOUND_PREPOSITIONS = new Set(['vor', 'nach', 'bis', 'ab', 'seit', 'gegen', 'von', 'zwischen']);

/**
 * Words that give a negation its own scope — „nicht gern", „auch nicht", „noch nicht",
 * „nicht mehr", „nicht so gut", „nicht nur … sondern". A polarity change in their sentence
 * changes more than the polarity, so none is made there.
 */
const SCOPE_WORDS = new Set([
  'gern', 'gerne', 'lieber', 'auch', 'nur', 'noch', 'schon', 'immer', 'oft', 'manchmal',
  'meistens', 'selten', 'nie', 'mehr', 'wieder', 'sondern', 'gar', 'so', 'ganz',
]);

/** The degree a one-word predicate may carry: „ist sehr müde", „ist zu kurz". */
const DEGREE_WORDS = new Set(['sehr', 'zu']);

const SEIN_FORMS = new Set(['ist', 'sind', 'war', 'waren']);
const KEIN_RE = /^kein(?:e|en|em|er|es)?$/;
const EIN_RE = /^ein(?:e|en|em|er|es)?$/;

/** A determiner in front of a noun: after one of these the noun is not bare. */
const DETERMINER_RE = /^(?:der|die|das|den|dem|des|k?ein(?:e|en|em|er|es)?|[mds]ein(?:e|en|em|er|es)?|ihr(?:e|en|em|er|es)?|unser(?:e|en|em|er|es)?|eu(?:e)?r(?:e|en|em|er|es)?|dies(?:e|en|em|er|es)|jede[nmrs]?|allen?|vielen?|wenigen?|einigen?|beiden?)$/;

/** After one of these a noun phrase is an adverbial („in einer Woche"), not the thing negated. */
const PREPOSITIONS = new Set([
  'ab', 'am', 'an', 'ans', 'auf', 'aus', 'bei', 'beim', 'bis', 'durch', 'für', 'gegen',
  'hinter', 'im', 'in', 'ins', 'mit', 'nach', 'neben', 'ohne', 'seit', 'um', 'unter', 'über',
  'von', 'vom', 'vor', 'zu', 'zum', 'zur', 'zwischen',
]);

/** The prepositions of a time („am Freitag", „im Mai"): „nicht" may still stand behind them. */
const TIME_PREPOSITIONS = new Set(['am', 'im', 'um']);

/** The time adverbs a bare object may follow: „hat Lena abends Zeit". */
const TIME_ADVERBS = new Set(['heute', 'morgen', 'abends', 'morgens', 'mittags', 'jetzt', 'dann', 'danach', 'zuerst', 'später']);

/** The separable particles „nicht" goes in front of: „sieht nicht fern", „kommt nicht mit". */
const PARTICLES = new Set(['ab', 'an', 'auf', 'aus', 'ein', 'fern', 'los', 'mit', 'nach', 'vor', 'weg', 'zu', 'zurück']);

/** A participle closing the clause: gekauft, gegangen, bezahlt, telefoniert. */
const PARTICIPLE_RE = /^(?:ge[a-zäöüß]{2,}(?:t|en)|(?:be|ver|er|ent|zer|emp)[a-zäöüß]{2,}t|[a-zäöüß]{2,}iert)$/;

/** „keinen Euro", „keine Stunde" negate a measure, not a thing. */
const UNIT_NOUNS = new Set([
  'Euro', 'Cent', 'Uhr', 'Minute', 'Minuten', 'Stunde', 'Stunden', 'Tag', 'Tage',
  'Woche', 'Wochen', 'Monat', 'Monate', 'Jahr', 'Jahre',
]);

/**
 * CONTRARY PREDICATES: one value of a property excludes the other („klein" / „groß"). True
 * contraries only — „müde" has no partner (awake and tired go together), and a word with two
 * partners is left out („alt": neu for a thing, jung for a person; „weit": kurz for a way,
 * nah for a place). „richtig/falsch" stays out too: it would read as the answer key.
 */
const CONTRARIES = new Map([
  ['groß', 'klein'], ['teuer', 'billig'], ['warm', 'kalt'], ['krank', 'gesund'],
  ['laut', 'leise'], ['schnell', 'langsam'], ['lang', 'kurz'], ['früh', 'spät'],
  ['voll', 'leer'], ['gut', 'schlecht'], ['hell', 'dunkel'], ['ledig', 'verheiratet'],
  ['offen', 'geschlossen'], ['leicht', 'schwer'], ['links', 'rechts'], ['glücklich', 'traurig'],
  ['dick', 'dünn'], ['sauber', 'schmutzig'], ['nass', 'trocken'],
].flatMap(([a, b]) => [[a, b], [b, a]]));

/**
 * THE VERBS WHOSE BARE NOUN IS AN ACCUSATIVE OBJECT („hat Hunger", „braucht Geld", „spielt
 * Fußball"). After any other verb a bare noun may be the subject („Morgen kommt Schnee.") or a
 * predicate („bleibt Lehrer"), so no „kein-" goes in front of it (Codex's probes, 2026-10-17).
 */
const ACCUSATIVE_VERBS = new Set([
  'hat', 'hatte', 'haben', 'braucht', 'bringt', 'isst', 'hört', 'kauft', 'kocht', 'lädt', 'liest',
  'möchte', 'ruft', 'spielt', 'feiert', 'lernt', 'macht', 'sieht', 'spricht', 'trinkt', 'bezahlt',
  'fragt', 'holt', 'trägt', 'will', 'zieht',
]);

/** Particles that make a verb take the dative („hört … zu", „läuft … nach"): no accusative there. */
const DATIVE_PARTICLES = new Set(['zu', 'nach', 'bei', 'entgegen']);

/** Pronouns a sein-predicate may be — „Ana ist es." takes „nicht" after it, not before. */
const PRONOUN_PREDICATES = new Set(['es', 'er', 'das', 'ihn', 'ihm', 'sich', 'ich', 'sie', 'wir']);

/** The kein- form of a bare noun: nominative after sein, accusative after any other verb. */
const keinFor = (reading, nominative) => {
  if (reading === 'pl' || reading === 'f.sg') return 'keine';
  return reading === 'm.sg' && !nominative ? 'keinen' : 'kein';
};

/**
 * WHICH CONTRADICTION FIRST. A Falsch statement that GAINS a negation carries a cue: on
 * the papers of 2026-10-17, 11 of the 24 A1.1 Falsch statements said „nicht" or „kein" and
 * none of the 24 Richtig ones did, so „nicht means Falsch" scored without reading. So the
 * falsifier takes a changed value first, a negation taken out second, and a negation put
 * in only where neither exists — and the ladder applies that order across the reports of
 * a window, not only inside one sentence.
 */
const NEGATION_RE = /^(?:nicht|nie|kein|keine|keinen|keinem|keiner|keines)$/i;
const negations = (de) => String(de).split(/\s+/).filter((w) => NEGATION_RE.test(bareWord(w))).length;
const cueRank = (c, statement) => {
  if (c.kind === 'value' || c.kind === 'contrary') return 0;
  return negations(c.de) < negations(statement) ? 1 : 2;
};
const byCueRank = (list, statement) => list
  .map((c, i) => ({ c, i, rank: cueRank(c, statement) }))
  .sort((a, b) => a.rank - b.rank || a.i - b.i)
  .map(({ c, rank }) => ({ ...c, rank }));

/** „kein" → „ein", „Keinen" → „Einen" — and back. */
const unNegated = (w) => (w[0] === 'K' ? 'E' : 'e') + w.slice(2);
const negated = (w) => (w[0] === 'E' ? 'K' : 'k') + w.toLowerCase();

/**
 * EVERY CONTRADICTION OF ONE STATEMENT, in reading order: `{ de, kind, from, to }` with
 * `kind` 'value' or 'polarity' and `from`/`to` the word that left and the word that came
 * ('' for none). `nouns` is contentWords over the course so far: it tells „kein Fieber" →
 * „Fieber" (no plural, a mass noun) from „keine Wohnung" → „eine Wohnung". A replacement
 * number is drawn from `rng`.
 */
export function contradictions(statement, nouns, rng) {
  const words = String(statement || '').split(/\s+/).filter(Boolean);
  // Each word as opening quote + core + closing punctuation. The core keeps what stands inside
  // it („1.1", „8.30", „E-Mail"), so a replacement never cuts a word in two.
  const parts = words.map((w) => /^([„“"»«]*)(.*?)([.,!?;:„“"»«]*)$/.exec(w));
  const bare = parts.map((m) => m[2]);
  const lower = bare.map((w) => w.toLowerCase());
  const last = words.length - 1;
  const out = [];
  const push = (c) => { if (!out.some((o) => o.de === c.de)) out.push(c); };
  const replaced = (i, to) => words.map((w, j) => (j === i ? parts[j][1] + to + parts[j][3] : w)).join(' ');
  // A word taken out leaves its punctuation to the word before it: „geht Ana nicht." → „geht Ana."
  const removed = (i) => words
    .map((w, j) => (j === i - 1 ? w + parts[i][3] : w))
    .filter((_, j) => j !== i)
    .join(' ');
  const inserted = (at, word) => [...words.slice(0, at), word, ...words.slice(at)].join(' ');
  const scoped = (except) => lower.some((w) => w !== except && SCOPE_WORDS.has(w));
  const isNumber = (i) => NUMBER_WORDS.includes(lower[i] || '') || /^\d+(?:[.:]\d+)*$/.test(bare[i] || '');
  const isNoun = (i) => /^[A-ZÄÖÜ]/.test(bare[i] || '') && nouns.has(bare[i]) && !UNIT_NOUNS.has(bare[i]);
  const finiteForms = new Set([...VERB_3SG.values(), 'hat', 'hatte', 'haben']);
  const finite = lower.findIndex((w, j) => j > 0 && (SEIN_FORMS.has(w) || finiteForms.has(w)));
  const nominative = finite > 0 && SEIN_FORMS.has(lower[finite]);
  const negative = lower.some((w) => NEGATION_RE.test(w));
  // „braucht nicht zu arbeiten": a zu-infinitive gives the negation its own job — no polarity change.
  const zuInfinitive = lower.some((w, j) => w === 'zu' && /^[a-zäöüß]+en$/.test(lower[j + 1] || ''));
  // A clause a negation or a contrary may go into: no scope word, no negation, no number.
  const plain = !scoped('') && !negative && !lower.some((_, j) => isNumber(j)) && /\.$/.test(words[last] || '');
  // A BARE noun stands right after the verb, a name, a time adverb or the end of a phrase
  // („braucht Ana Geld", „hat abends Zeit", „spielt am Wochenende Fußball") — never after a
  // determiner, a number or another noun („eine Tasse Kaffee").
  const bareAt = (i) => {
    if (i < 1 || !isNoun(i)) return false;
    const p = lower[i - 1];
    if (DETERMINER_RE.test(p) || isNumber(i - 1)) return false;
    if (SEIN_FORMS.has(p) || finiteForms.has(p) || TIME_ADVERBS.has(p)) return true;
    if (!/^[A-ZÄÖÜ]/.test(bare[i - 1]) || i - 1 === 0) return false;
    return !nouns.has(bare[i - 1]) || PREPOSITIONS.has(lower[i - 2] || '');
  };

  for (let i = 0; i <= last; i += 1) {
    const pre = lower[i - 1] || '';
    if (isNumber(i)) {
      // VALUE
      if (lower.some((w) => FREQUENCY_WORDS.has(w) || BOUND_WORDS.has(w))) continue;
      if (BOUND_PHRASE_RE.test(lower.join(' ')) || pre === 'über' || pre === 'unter') continue;
      // „vor zehn Uhr", „bis um zehn", „von sieben bis zehn", „zwischen acht und zehn"
      if (TIME_BOUND_PREPOSITIONS.has(pre) || (pre === 'um' && TIME_BOUND_PREPOSITIONS.has(lower[i - 2] || ''))) continue;
      if (lower.slice(0, i).includes('zwischen')) continue;
      let to;
      if (/^\d/.test(bare[i])) {
        to = bare[i].replace(/^\d+/, (d) => String(Number(d) >= 10 ? Number(d) + 10 : Number(d) + 3));
      } else {
        const digitGroup = NUMBER_WORDS.includes(pre) || NUMBER_WORDS.includes(lower[i + 1] || '');
        to = pickOther(digitGroup ? DIGIT_NUMBERS : sameMagnitude(lower[i]), lower[i], rng);
        if (to && /^[A-ZÄÖÜ]/.test(bare[i])) to = to[0].toUpperCase() + to.slice(1);
      }
      if (to) push({ de: replaced(i, to), kind: 'value', from: bare[i], to });
    } else if (lower[i] === 'nicht' || lower[i] === 'nie') {
      // POLARITY: the negation taken out
      if (i > 0 && !scoped(lower[i]) && !zuInfinitive) push({ de: removed(i), kind: 'polarity', from: bare[i], to: '' });
    } else if (scoped('') || zuInfinitive || PREPOSITIONS.has(pre)) {
      // a scope word in the clause, or a preposition in front: nothing changes here
    } else if (KEIN_RE.test(lower[i])) {
      const reading = /^[A-ZÄÖÜ]/.test(bare[i + 1] || '') && resolvedReading(bare[i + 1], lower[i], nouns);
      if (!reading) continue;
      const plural = String(nouns.get(bare[i + 1])?.plural || '');
      if (reading !== 'pl' && plural && plural !== '—') {
        push({ de: replaced(i, unNegated(bare[i])), kind: 'polarity', from: bare[i], to: unNegated(bare[i]) });
      } else {
        push({ de: removed(i), kind: 'polarity', from: bare[i], to: '' });
      }
    } else if (negative) {
      // a negation stands already: nothing more is put into this clause
    } else if (EIN_RE.test(lower[i]) && isNoun(i + 1)) {
      // „ein-" → „kein-", and two coordinated „ein-" phrases together
      // „oder" stays out: „keinen Kaffee oder keine Milch" does not deny both (Codex, 2026-10-17).
      if (/^(?:und|oder)$/.test(pre) || /,$/.test(words[i - 1] || '') || /,$/.test(words[i + 1]) || lower[i + 2] === 'oder') continue;
      const pair = lower[i + 2] === 'und' ? i + 3 : -1;
      if (pair > 0 && !(EIN_RE.test(lower[pair] || '') && isNoun(pair + 1))) continue;
      const heads = pair > 0 ? [i, pair] : [i];
      const readings = heads.map((k) => resolvedReading(bare[k + 1], lower[k], nouns));
      if (readings.some((r) => !r || r === 'pl')) continue;
      const de = words.map((w, j) => (heads.includes(j) ? parts[j][1] + negated(bare[j]) + parts[j][3] : w)).join(' ');
      push({ de, kind: 'polarity', from: heads.map((k) => bare[k]).join(' … '), to: heads.map((k) => negated(bare[k])).join(' … ') });
    } else if (lower[i] === 'viele' && isNoun(i + 1)) {
      const to = bare[i][0] === 'V' ? 'Keine' : 'keine';
      push({ de: replaced(i, to), kind: 'polarity', from: bare[i], to });
    } else if (SEIN_FORMS.has(lower[i])) {
      // the predicate of sein: its contrary, or „nicht" in front of it
      const predicate = bare.slice(i + 1);
      const oneWord = predicate.length === 1 || (predicate.length === 2 && DEGREE_WORDS.has(lower[i + 1]));
      const nounPhrase = i > 0 && bare.slice(0, i).every((w, j) => /^[A-ZÄÖÜ]/.test(w) || ['von', 'der', 'die', 'das', 'dem'].includes(lower[j]));
      if (!oneWord || !nounPhrase || !plain || !predicate.every((w) => /^[a-zäöüß]+$/.test(w) && !PRONOUN_PREDICATES.has(w))) continue;
      const contrary = CONTRARIES.get(lower[last]);
      if (contrary) push({ de: replaced(last, contrary), kind: 'contrary', from: bare[last], to: contrary });
      push({ de: inserted(i + 1, 'nicht'), kind: 'polarity', from: '', to: 'nicht' });
    } else if (plain && bareAt(i) && i > finite && finite > 0) {
      // „kein-" before a bare noun — and before its partner: „keinen Kuchen und keine Schokolade"
      const verb = lower[finite];
      if (!nominative && (!ACCUSATIVE_VERBS.has(verb) || DATIVE_PARTICLES.has(lower[last]))) continue;
      if (/,$/.test(words[i]) || lower[i + 1] === 'oder') continue;
      const heads = lower[i + 1] === 'und' ? [i, i + 2] : [i];
      if (heads.length === 2 && !isNoun(i + 2)) continue;
      // The number comes from the clause: plural after „sind/waren", singular after „ist/war"; an
      // object spelled alike in both numbers („Kuchen", „Lehrer") is left alone (Codex, 2026-10-17).
      const plural = ['sind', 'waren'].includes(verb);
      const forms = heads.map((k) => {
        const readings = nounReadings(bare[k], nouns) || [];
        let reading = null;
        if (nominative) reading = readings.find((r) => (plural ? r === 'pl' : r !== 'pl')) || null;
        else if (readings.length === 1) [reading] = readings;
        return reading ? keinFor(reading, nominative) : null;
      });
      if (forms.some((f) => !f)) continue;
      const de = words.flatMap((w, j) => (heads.includes(j) ? [forms[heads.indexOf(j)], w] : [w])).join(' ');
      push({ de, kind: 'polarity', from: '', to: forms.join(' … ') });
    }
  }

  // „nicht" before the last word of the clause — a separable particle, or a participle after
  // „hat" — or after a definite object closing it. Not after a pair of verbs („geht … und
  // bezahlt"), not with a place or a direction in front (a time is fine: „kauft am Freitag
  // nicht ein"), and not where a bare noun or an „ein-" phrase takes the negation itself.
  if (plain && finite > 0 && last > finite && !SEIN_FORMS.has(lower[finite])) {
    const mid = lower.slice(finite + 1, last);
    const takenElsewhere = bare.some((_, j) => j > finite && (bareAt(j) || (EIN_RE.test(lower[j]) && isNoun(j + 1))));
    const verbPair = mid.includes('und') || mid.includes('oder');
    const onlyTimes = mid.every((w) => !PREPOSITIONS.has(w) || TIME_PREPOSITIONS.has(w));
    const closesWithVerb = PARTICLES.has(lower[last])
      || (PARTICIPLE_RE.test(lower[last]) && ['hat', 'hatte', 'haben'].includes(lower[finite]));
    if (takenElsewhere) {
      // the bare noun or the „ein-" phrase carries the negation
    } else if (closesWithVerb && !verbPair && onlyTimes) {
      push({ de: inserted(last, 'nicht'), kind: 'polarity', from: '', to: 'nicht' });
    } else if (/^(?:der|die|das|den|dem)$/.test(lower[last - 1] || '') && isNoun(last) && !PREPOSITIONS.has(lower[last - 2] || '')) {
      push({ de: [...words.slice(0, last), `${parts[last][1]}${bare[last]} nicht${parts[last][3]}`].join(' '), kind: 'polarity', from: '', to: 'nicht' });
    }
  }
  return out;
}

/**
 * RUNG 4 of the Lesen ladder — a curriculum whose dialogues carry no reportable line: the
 * same contradictions, made on a sentence of the text as it stands.
 */
function falsifyWindow(window, text, { vocab, spec }, rng) {
  for (const line of shuffle(window, rng)) {
    for (const sentence of sentencesOf(line.de)) {
      if (!sentence.endsWith('.')) continue;                    // a question or a request states nothing
      for (const c of byCueRank(shuffle(contradictions(sentence, spec.nouns, rng), rng), sentence)) {
        if (normaliseStatement(text).includes(normaliseStatement(c.de))) continue;
        if (agreementViolations(c.de, vocab).length) continue;
        // The rest is the printed line; the word the contradiction brings in must be taught.
        if (!statementIsKnown(c.to, spec.known, spec.names)) continue;
        return { line, ...c };
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
// ABOUT the text, and the Falsch statement is that same report, contradicted
// (see CONTRADICTION) — the two halves look alike.
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
  // A1.2's „ich" verbs (DaF review #3, MAJOR 2): without them its papers fell back to quoting
  // the text verbatim, and „… und bezahle" reached a report unchanged.
  bezahle: 'bezahlt',
  fliege: 'fliegt',
  frage: 'fragt',
  hole: 'holt',
  trage: 'trägt',
  will: 'will',
  ziehe: 'zieht',
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
  // written out, for the same reason POSSESSIVE_STEMS writes `d?ein`: the register
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

/** The possessive in front of a noun, by its stem — whose thing it is (engine C). */
const POSSESSOR_RE = /^([mds]ein|ihr|unser|euer|eur)(?:e|en|em|er|es)?$/;

/** Sentences of one dialogue line, in reading order. */
const sentencesOf = (de) => String(de || '').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

/**
 * „Ja, ich komme mit." is „Ich komme mit." with a particle in front of it — and so is
 * „Entschuldigung, ich wohne nicht hier." with its interjection.
 */
const PARTICLE_RE = /^(?:Ja|Nein|Gut|Doch|Entschuldigung|Danke|Okay)[,.]\s+/;

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

/**
 * The course's first-person verb forms: the <stem>e of every Wortfeld infinitive
 * plus every „ich <verb>e" a dialogue says (holen and fragen are in no A1.2
 * Wortfeld). `reportRest` refuses a sentence that keeps one of them — an
 * article after „und" („… und eine Cola") is not a verb, so a rule that guessed
 * from position alone would throw good reports away.
 */
function firstPersonForms(curriculum) {
  const out = new Set();
  for (const l of curriculum?.lektionen || []) {
    for (const w of l.wortfeld || []) {
      const word = String(w.word || w.de || '').trim();
      if (/^[a-zäöüß]+en$/.test(word)) out.add(word.slice(0, -1));                       // kaufen → kaufe
      else if (/^[a-zäöüß]+eln$/.test(word)) { out.add(`${word.slice(0, -3)}le`); out.add(`${word.slice(0, -1)}e`); } // wechseln → wechsle, wechsele
      else if (/^[a-zäöüß]+ern$/.test(word)) out.add(`${word.slice(0, -1)}e`);            // feiern → feiere
    }
    for (const line of l.dialog?.lines || []) {
      for (const m of String(line?.de || line || '').matchAll(/\b[Ii]ch\s+([a-zäöüß]+e)\b/g)) out.add(m[1]);
    }
  }
  return out;
}

/** Everything the three engines need, built once per checkpoint. */
function reportSpec(ctx) {
  const { curriculum, checkpoint, level } = ctx;
  const last = checkpoint?.afterLektion ?? 0;
  return {
    articles: articleIndex(curriculum, last),
    known: knownUpTo(curriculum, last),
    names: namesOf(level),
    firstPerson: firstPersonForms(curriculum),
    // The course's nouns so far, with gender and plural — what a polarity change reads.
    nouns: contentWords((curriculum?.lektionen || []).filter((l) => l.nr <= last)),
  };
}

/** Lower-case words ending in -e that open a phrase after „und" without being a verb. */
const NOT_A_VERB_AFTER_UND = new Set([
  'die', 'eine', 'keine', 'meine', 'seine', 'ihre', 'unsere', 'eure', 'diese', 'jede', 'welche',
  'alle', 'viele', 'beide', 'einige', 'manche', 'wenige', 'andere', 'gerne', 'heute', 'lange', 'alleine',
]);

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
 * frühstücke". Returns null when one of them has no taught third-person form —
 * or none in the table at all: DaF review #3 (A1.2) MAJOR 2 found „Ich gehe
 * durch das Kaufhaus und bezahle." reported as „Lena geht durch das Kaufhaus
 * und bezahle.", because a verb missing from the table passed through
 * unchanged. Every finite verb changes with the subject, or there is no report.
 */
function reportRest(words, { known, firstPerson }, forms) {
  const out = [];
  // A clause opened by „und/oder/aber/sondern" carries its own finite verb. Until that verb has
  // been changed, a lowercase word in -e that no determiner governs and that is no known
  // non-verb IS that verb — the report cannot change it, so there is no report. A class, not a
  // list of adverbs: „und dann", „und anschließend", „und zu Hause improvisiere" alike (DaF
  // reviews #5 and #6, the isolated-transformer minor).
  let inClause = false;
  let clauseVerbChanged = false;
  for (let i = 0; i < words.length; i += 1) {
    const w = words[i];
    const bare = bareWord(w);
    if (/^(?:und|oder|aber|sondern)$/i.test(bare)) {
      inClause = true;
      clauseVerbChanged = false;
      out.push(w);
      continue;
    }
    const third = VERB_3SG.get(bare.toLowerCase());
    if (!third || bare[0] !== bare[0].toLowerCase()) {
      if (firstPerson?.has(bare)) return null;
      const governed = DETERMINER_RE.test(bareWord(words[i - 1] || '').toLowerCase());
      if (inClause && !clauseVerbChanged && /^[a-zäöüß]+e$/.test(bare) && !governed && !NOT_A_VERB_AFTER_UND.has(bare)) return null;
      out.push(w);
      continue;
    }
    if (known && !known.has(third)) return null;
    forms.push(third);
    out.push(third + w.slice(bare.length));
    if (inClause) clauseVerbChanged = true;
  }
  return out;
}

/**
 * ONE SENTENCE → ONE REPORT, or null. `beforeLines` is everything the learner has
 * already read inside this window, `{ speaker, de }` line by line — where engine C finds
 * its antecedent and tells whose it is.
 */
function reportSentence(sentence, { speaker, beforeLines, spec }) {
  const subject = String(speaker || '').trim();
  if (!subject) return null;
  const full = String(sentence || '').replace(PARTICLE_RE, '').trim();
  if (!full.endsWith('.')) return null;                 // questions and imperatives report nothing
  // A main clause stands on its own before „, denn / , aber / , weil": „Ich schlafe nicht gut,
  // denn mein Hals tut weh." reports as „Ana schläft nicht gut." — the possessive of the reason
  // no longer kills the report, and what is reported still follows from the text.
  const text = full.replace(/,\s+(?:denn|aber|weil)\s.*$/, '.');
  const words = text.split(/\s+/);
  if (words.length < 3) return null;
  const { known, names, articles } = spec;
  // The head is read case-insensitively because a stripped particle leaves it
  // lowercase („Ja, ich komme mit." → „ich komme mit.").
  const head = bareWord(words[0]).toLowerCase();
  const forms = [];
  let built = null;
  let engine = null;
  let ambiguous = false;

  if (head === 'ich') {
    const third = VERB_3SG.get(bareWord(words[1]).toLowerCase());
    if (!third || (known && !known.has(third))) return null;
    if (!restIsReportable(words.slice(2), subject)) return null;
    const rest = reportRest(words.slice(2), spec, forms);
    if (!rest) return null;
    forms.unshift(third);
    built = [subject, third + words[1].slice(bareWord(words[1]).length), ...rest].join(' ');
    engine = 'ich';
  } else if (head === 'mein' || head === 'meine') {
    const noun = bareWord(words[1]);
    const article = articles.get(noun);
    if (!article || !REPORT_ARTICLE[article]) return null;
    if (!restIsReportable(words.slice(2), subject)) return null;
    const rest = reportRest(words.slice(2), spec, forms);
    if (!rest) return null;
    built = [REPORT_ARTICLE[article], words[1], 'von', subject, ...rest].join(' ');
    engine = 'possessiv';
  } else if (PRONOUN_ARTICLE[head]) {
    // A plural „Sie sprechen …" is not a singular antecedent (see the -en guard).
    const verb = bareWord(words[1]).toLowerCase();
    if (verb.endsWith('en')) return null;
    const wanted = PRONOUN_ARTICLE[head];
    // The candidates are REFERENTS, not noun strings (DaF review A1.2 #5, MAJOR 8): Lena's
    // „Meine Oma" and Ana's „Meine Oma" are two grandmothers, and a Set of nouns had folded
    // them into one „Die Oma". A possessive tells the owners apart, read with the speaker who
    // says it; an article does not („eine Fahrkarte … die Fahrkarte" is one ticket).
    const owners = new Map();
    for (const { speaker: by, de } of beforeLines || []) {
      const tokens = String(de || '').split(/\s+/);
      tokens.forEach((w, j) => {
        const bare = bareWord(w);
        if (articles.get(bare) !== wanted) return;
        if (!owners.has(bare)) owners.set(bare, new Set());
        const owner = POSSESSOR_RE.exec(bareWord(tokens[j - 1] || '').toLowerCase());
        if (owner) owners.get(bare).add(`${owner[1]}@${by}`);
        // …and an owner after the noun: „die Oma von Tim", „die Oma von Lena" (DaF review #6).
        if (bareWord(tokens[j + 1] || '').toLowerCase() === 'von' && /^[A-ZÄÖÜ]/.test(tokens[j + 2] || '')) {
          owners.get(bare).add(`von ${bareWord(tokens[j + 2])}`);
        }
      });
    }
    if (!owners.size) return null;
    // More than one referent of the gender: no report (`ambiguous`, filtered by windowReports). It is
    // still BUILT, so the Lesen ladder shuffles the same list as before and a paper this rule does not
    // touch keeps its draw — the sections share one rng.
    const antecedent = [...owners.keys()].pop();
    ambiguous = owners.size > 1 || [...owners.values()].some((set) => set.size > 1);
    if (!restIsReportable(words.slice(1), subject)) return null;
    const rest = reportRest(words.slice(1), spec, forms);
    if (!rest) return null;
    built = [REPORT_ARTICLE[wanted], antecedent, ...rest].join(' ');
    engine = 'pronomen';
  } else {
    // „Danach brauche ich Geld für das Museum." — the verb stands before „ich" because something
    // else opens the sentence; the report keeps that opening and swaps verb and subject in place:
    // „Danach braucht Ana Geld für das Museum." (DaF review #3, A1.2: without it, a third of the
    // A1.2 papers' Lesen items quoted their own text).
    const k = words.findIndex((w, i) => i >= 2 && bareWord(w) === 'ich');
    const verb = k > 0 ? bareWord(words[k - 1]) : '';
    const third = VERB_3SG.get(verb);
    if (!third || verb !== verb.toLowerCase() || (known && !known.has(third))) return null;
    const front = words.slice(0, k - 1);
    if (!restIsReportable([...front, ...words.slice(k + 1)], subject)) return null;
    const rest = reportRest(words.slice(k + 1), spec, forms);
    if (!rest) return null;
    forms.unshift(third);
    built = [...front, third, subject, ...rest].join(' ');
    engine = 'vorfeld';
  }

  if (!built) return null;
  if (!statementIsKnown(built, known, names)) return null;
  return { statement: built, engine, verbForms: forms, ambiguous };
}

/**
 * EVERY REPORT A WINDOW YIELDS, in reading order — the list `buildLesen` walks
 * and the list tests/checkpoint.test.mjs re-derives to prove that a Richtig
 * statement follows from EXACTLY ONE line of its text.
 */
export function windowReports(window, spec, { withAmbiguous = false } = {}) {
  const out = [];
  const lines = window || [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const earlier = lines.slice(0, i).map((l) => ({ speaker: l.speaker, de: String(l.de || '') }));
    const sentences = sentencesOf(line.de);
    for (let s = 0; s < sentences.length; s += 1) {
      const beforeLines = [...earlier, ...sentences.slice(0, s).map((de) => ({ speaker: line.speaker, de }))];
      const report = reportSentence(sentences[s], { speaker: line.speaker, beforeLines, spec });
      if (!report || (report.ambiguous && !withAmbiguous)) continue;
      out.push({ ...report, line, lineIndex: i, sentence: sentences[s] });
    }
  }
  return out;
}

/** The spec the tests need, built from the same two arguments as the builder. */
export const reportSpecFor = (curriculum, checkpoint) =>
  reportSpec({ curriculum, checkpoint, level: curriculum?.level });
/**
 * ONE CONTRADICTION OF A REPORT (see CONTRADICTION), checked against its text: it may not
 * stand in that text or be the true report of another of its lines, must agree with itself
 * and be taught by the checkpoint — and a changed value may not be one the source sentence
 * already says („zwei Brötchen und drei Äpfel" never becomes „drei Brötchen").
 */
function falsifications(statement, text, { vocab, spec }, rng, { sourceSentence = '', windowStatements = new Set() } = {}) {
  const sourceWords = new Set(String(sourceSentence).split(/\s+/).map((w) => bareWord(w).toLowerCase()).filter(Boolean));
  return byCueRank(shuffle(contradictions(statement, spec.nouns, rng), rng), statement).filter((c) => (
    !normaliseStatement(text).includes(normaliseStatement(c.de))
    && !windowStatements.has(normaliseStatement(c.de))
    && !(c.kind === 'value' && sourceWords.has(c.to.toLowerCase()))
    && !agreementViolations(c.de, vocab).length
    // The report passed the gate in reportSentence; the word the contradiction brings in must too.
    && statementIsKnown(c.to, spec.known, spec.names)
  ));
}

function falsifyStatement(statement, text, ctxWords, rng, opts = {}) {
  return falsifications(statement, text, ctxWords, rng, opts)[0] || null;
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
function pickLesenSource(candidates, wantRichtig, {
  rng, spec, chapterVocab, usedSources, quote = false, preferNegative = false, preferNegativeText = false,
  spent = new Set(),
}) {
  const ctxWords = { vocab: chapterVocab, spec };
  // Every report is scored over every window, lowest first, the first of a score kept. A Falsch
  // costs 2 for a negation in its statement and 1 for one in its printed window (see cueRank —
  // „Zum Bahnhof gehe ich nicht." printed above a Falsch is a cue too, DaF review #6, MAJOR 8);
  // a Richtig costs where its statement or window misses the negations the paper still needs.
  // A report an earlier paper of this window already used counts one point worse.
  let best = null;
  for (const candidate of candidates) {
    const text = windowText(candidate.window);
    const all = windowReports(candidate.window, spec, { withAmbiguous: true });
    const windowStatements = new Set(all.filter((r) => !r.ambiguous).map((r) => normaliseStatement(r.statement)));
    const reports = shuffle(all, rng)
      .filter((r) => !r.ambiguous)
      .filter((r) => !usedSources.has(lineKeyOf(candidate.lektion?.id ?? candidate.lektion?.nr, candidate.start + r.lineIndex)));
    const printedNegation = Boolean(negations(text));
    for (const report of reports) {
      const used = spent.has(normaliseStatement(report.statement)) ? 1 : 0;
      if (wantRichtig) {
        const misses = (Boolean(negations(report.statement)) === preferNegative ? 0 : 4)
          + (printedNegation === preferNegativeText ? 0 : 2);
        const score = misses + used;
        if (!best || score < best.score) best = { candidate, text, report, score, falsified: null };
      } else {
        const falsified = falsifyStatement(report.statement, text, ctxWords, rng, { sourceSentence: report.sentence, windowStatements });
        const cue = (negations(falsified?.de || '') ? 2 : 0) + (printedNegation ? 1 : 0);
        const score = falsified ? cue * 2 + used : Infinity;
        if (falsified && (!best || score < best.score)) best = { candidate, text, report, score, falsified };
      }
      if (best?.score === 0) break;
    }
    if (best?.score === 0) break;
  }
  if (best && wantRichtig) {
    return { candidate: best.candidate, text: best.text, report: best.report, statement: best.report.statement, changed: null };
  }
  if (best) {
    const { de, rank: _rank, ...changed } = best.falsified;
    return { candidate: best.candidate, text: best.text, report: best.report, statement: de, changed };
  }
  // Rung 4: no report anywhere in the chapter (see the ladder above) — buildLesen asks for it
  // only after every window of the list has failed to report.
  if (!quote) return null;
  for (const candidate of candidates) {
    const text = windowText(candidate.window);
    if (wantRichtig) {
      const line = candidate.window[Math.floor(rng() * candidate.window.length)];
      return { candidate, text, report: null, statement: String(line.de), changed: null, line };
    }
    const falsified = falsifyWindow(candidate.window, text, ctxWords, rng);
    if (falsified) {
      const { de, line, rank: _rank, ...changed } = falsified;
      return { candidate, text, report: null, statement: de, line, changed };
    }
  }
  return null;
}

/**
 * How much a Lesen section gives away through negation: per key, how many statements carry
 * one and how many printed windows do, as the gap between Richtig and Falsch. 0 means a
 * negation tells the reader nothing about the key; a short section counts worse than any cue.
 */
export function lesenNegationCue(items) {
  const pairs = items.map((it) => ({ richtig: it.answer === 'Richtig', s: Boolean(negations(it.statement)), t: Boolean(negations(it.text)) }));
  return jointNegationGap(pairs.filter((p) => !p.richtig), pairs.filter((p) => p.richtig))
    + (items.length < SECTION_COUNTS.lesen ? 10 : 0);
}

/**
 * How far the Falsch and the Richtig side are from carrying the same (statement negated, text
 * negated) pairs — the size of the multiset difference. Balancing the two counts apart was not
 * enough (DaF review #7, MAJOR 8): Falsch {text only, statement only} against Richtig {both,
 * neither} balances each count and still hands „statement and text agree → Richtig" every key of
 * six regular papers. At 0, every function of the two features scores exactly half of the paper.
 */
export function jointNegationGap(falsch, richtig) {
  const diff = [0, 0, 0, 0];
  for (const o of falsch) diff[(o.s ? 2 : 0) + (o.t ? 1 : 0)] += 1;
  for (const o of richtig) diff[(o.s ? 2 : 0) + (o.t ? 1 : 0)] -= 1;
  return diff.reduce((sum, d) => sum + Math.abs(d), 0);
}

// The tiers of a Lesen choice, cheapest last to break: a dictated or read-aloud line reprinted (the
// rule of DaF review #8), another item's answer printed (#14), a negation cue (#6, MAJOR 8).
const DICTATED_COST = 10000;
const LEAK_COST = 1500;
const CUE_COST = 1000;
/** The cheapest options of each key the search combines — enough for every chapter, cheap to pair. */
const LESEN_OPTIONS = 20;
/**
 * THE LESEN SECTION AS ONE CHOICE (DaF review #6, MAJOR 8). A Falsch statement built by taking a
 * negation out leaves it in the printed text („Zum Bahnhof gehe ich nicht." above „Zum Bahnhof
 * geht Ana."), and „negation in the text → Falsch" solved seven papers; a slot-by-slot draw had
 * taken the two cheapest Falsch items and left the Richtig side nothing to balance them with. So
 * the four items are chosen together: every Richtig report and every contradiction of the chapter's
 * windows is an option with two features — a negation in the statement, a negation in its printed
 * window — and the search takes the two Falsch and two Richtig options, sharing no line and no
 * source, whose features balance (lesenNegationCue 0) at the lowest cost. The costs keep the old
 * rules in their old order (DICTATED_COST, LEAK_COST, CUE_COST), then prefer cue-free kinds of
 * Falsch, a report no earlier paper of this window used, three-line windows and a spread over the
 * chapter's Lektionen; the seed's own draw breaks every tie, so each paper is still its own.
 * Null when the chapter has too few reports — the slot ladder (lesenAttempt) then still fills the
 * section, down to its rung 4.
 */
function chooseLesen(ctx) {
  const { checkpoint, chapter, rng } = ctx;
  const withDialog = chapter.filter((l) => (l?.dialog?.lines || []).length >= 2);
  if (!withDialog.length) return null;
  const order = shuffle(withDialog, rng);
  // Two richtig and two falsch, in an order this checkpoint's seed decides.
  const truth = shuffle([true, true, false, false], rng);
  const spec = reportSpec(ctx);
  const ctxWords = { vocab: contentWords(chapter), spec };
  const spent = ctx.spentLesen || new Set();
  const R = [];
  const F = [];
  for (const w of order.flatMap((l) => windowsOf(l))) {
    const keys = windowLineKeys(w);
    const text = windowText(w.window);
    const leaky = ctx.leaks({ section: 'lesen', kind: 'lesenProbe', promptDe: '', text });
    const base = (keys.some((k) => ctx.usedLineKeys.has(k)) ? DICTATED_COST : 0)
      + (leaky ? LEAK_COST : 0) + (w.span >= 3 ? 0 : 0.5) + rng();
    const reports = windowReports(w.window, spec, { withAmbiguous: true }).filter((r) => !r.ambiguous);
    const windowStatements = new Set(reports.map((r) => normaliseStatement(r.statement)));
    for (const report of reports) {
      const option = {
        w, keys, text, leaky, report,
        source: lineKeyOf(w.lektion?.id ?? w.lektion?.nr, w.start + report.lineIndex),
        t: Boolean(negations(text)),
        cost: base + (spent.has(normaliseStatement(report.statement)) ? 1 : 0),
      };
      R.push({ ...option, s: Boolean(negations(report.statement)), statement: report.statement, changed: null });
      const contradicted = falsifications(report.statement, text, ctxWords, rng, { sourceSentence: report.sentence, windowStatements });
      for (const c of contradicted.slice(0, 2)) {
        const s = Boolean(negations(c.de));
        F.push({
          ...option, s, statement: c.de, changed: { kind: c.kind, from: c.from, to: c.to },
          cost: option.cost + (s ? 2 : 0) + (option.t ? 1 : 0),
        });
      }
    }
  }
  if (R.length < 2 || F.length < 2) return null;
  const clash = (a, b) => a.w === b.w || a.source === b.source || a.keys.some((k) => b.keys.includes(k));
  const pairsOf = (list) => {
    const top = [...list].sort((a, b) => a.cost - b.cost).slice(0, LESEN_OPTIONS);
    const out = [];
    for (let a = 0; a < top.length; a += 1) {
      for (let b = a + 1; b < top.length; b += 1) if (!clash(top[a], top[b])) out.push([top[a], top[b]]);
    }
    return out;
  };
  const perLektion = Math.ceil(SECTION_COUNTS.lesen / order.length);
  const crowding = (four) => {
    const per = new Map();
    for (const o of four) per.set(o.w.lektion, (per.get(o.w.lektion) || 0) + 1);
    return [...per.values()].reduce((sum, n) => sum + Math.max(0, n - perLektion), 0);
  };
  const richtigPairs = pairsOf(R);
  let best = null;
  for (const [f1, f2] of pairsOf(F)) {
    for (const [r1, r2] of richtigPairs) {
      if (clash(r1, f1) || clash(r1, f2) || clash(r2, f1) || clash(r2, f2)) continue;
      const cue = jointNegationGap([f1, f2], [r1, r2]);
      const cost = cue * CUE_COST + f1.cost + f2.cost + r1.cost + r2.cost + crowding([f1, f2, r1, r2]) * 3;
      if (!best || cost < best.cost) best = { cost, falsch: [f1, f2], richtig: [r1, r2] };
    }
  }
  if (!best) return null;
  const items = [];
  const relaxed = [];
  const lineKeys = [];
  truth.forEach((wantRichtig, i) => {
    const o = (wantRichtig ? best.richtig : best.falsch).shift();
    const item = lesenItem(checkpoint, i, wantRichtig, {
      candidate: o.w, text: o.text, report: o.report, statement: o.statement, changed: o.changed,
    });
    items.push(item);
    if (o.leaky) relaxed.push(item.id);
    for (const k of o.keys) if (!ctx.usedLineKeys.has(k)) lineKeys.push(k);
  });
  return { items, lineKeys, relaxed };
}

/** One Lesen item out of a picked window, report and statement — both paths build it here. */
function lesenItem(checkpoint, i, wantRichtig, picked) {
  const { candidate, text, report, statement, changed } = picked;
  const sourceLine = report ? report.line : picked.line;
  const sourceSentence = report ? report.sentence : String(sourceLine.de);
  const trueStatement = report ? report.statement : String(sourceLine.de);
  const speaker = String(sourceLine.speaker || '');
  const answer = wantRichtig ? 'Richtig' : 'Falsch';
  // A changed value names both values; a changed polarity says what the text means.
  let explanationDe = `${speaker} sagt: „${sourceSentence}“ Die Aussage ist also richtig.`;
  if (changed?.kind === 'value' || changed?.kind === 'contrary') explanationDe = `${speaker} sagt: „${sourceSentence}“ Im Text steht „${changed.from}“, nicht „${changed.to}“.`;
  else if (changed) explanationDe = `${speaker} sagt: „${sourceSentence}“ Das heißt: ${trueStatement} Die Aussage ist also falsch.`;
  return {
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
  };
}

/**
 * The Lesen section of the paper: one choice (chooseLesen), or — for a chapter with too few
 * reports — the slot ladder. Only the kept items spend their lines and take their seats.
 */
function buildLesen(ctx) {
  const chosen = chooseLesen(ctx) || lesenAttempt(ctx, ctx.rng);
  for (const key of chosen.lineKeys) ctx.usedLineKeys.add(key);
  for (const note of chosen.relaxed) ctx.relax('lesen', note);
  for (const item of chosen.items) ctx.seat(item);
  return chosen.items;
}

/**
 * THE SLOT LADDER — the fallback of buildLesen for a chapter whose windows offer too few reports
 * to choose from (the test fixtures carry no first-person German at all).
 */
function lesenAttempt(ctx, rng) {
  const { checkpoint, chapter } = ctx;
  // This attempt's own copies: a redraw must not inherit the lines or seats of a rejected one.
  const usedLineKeys = new Set(ctx.usedLineKeys);
  const seatedHere = [];
  const relaxed = [];
  const leaks = (probe) => ctx.leaks(probe) || seatedHere.some((placed) => leaksAcross(probe, placed));
  const items = [];
  const withDialog = chapter.filter((l) => (l?.dialog?.lines || []).length >= 2);
  if (!withDialog.length) return { items, lineKeys: [], relaxed };
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

  // FALSCH FIRST (see cueRank): the Richtig items are drawn knowing how many Falsch statements
  // carry a negation, and take a negative report of their own while fewer of theirs do — and a
  // positive one once they are even — so a negation tells the reader nothing about the key. The
  // page keeps the seed's order.
  const slots = truth.map((wantRichtig, i) => ({ i, wantRichtig }));
  const negationsByKey = { Richtig: 0, Falsch: 0 };
  const printedByKey = { Richtig: 0, Falsch: 0 };
  const pageIndex = new Map();
  for (const { i, wantRichtig } of [...slots.filter((x) => !x.wantRichtig), ...slots.filter((x) => x.wantRichtig)]) {
    const preferredLektion = order[i % order.length];
    const lines = preferredLektion.dialog.lines;
    const span = Math.min(3, lines.length);
    const start = Math.floor(rng() * Math.max(1, lines.length - span + 1));
    let candidates = lesenCandidates(preferredLektion, start, order, usedLineKeys, usedWindows, usedLesenLines);
    if (!candidates.length) continue;

    // TWO PHASES, and the first is the rule: a Lesen text never reprints a line this paper DICTATES
    // or READS ALOUD. `lesenCandidates` only ORDERS by that, and an ordering loses whenever the
    // leading candidates yield no usable statement — which is how one paper could dictate a line
    // and print it (the guard „no dialogue line is used twice across the sections of one
    // checkpoint“ held by luck of the shuffle until the RULE-15b line preference of round 14 moved
    // the draw). So the clean windows are asked for a report first, every window second, and
    // only then rung 4 of `pickLesenSource`, which copies a line of the text — „no Lesen
    // statement stands in its own text“ forbids that for Richtig, and a contradicted copy is a
    // search for the changed word, not reading (DaF review A1.2 #5, MAJOR 8).
    // A window that PRINTS the answer of an item this paper has already seated
    // is the last resort, never the first (DaF review #14, MAJOR 3): the leak
    // cap orders the candidates, exactly as freeness does, so a poor chapter
    // still gets four texts.
    const leakFree = (w) => !leaks({ section: 'lesen', kind: 'lesenProbe', promptDe: '', text: windowText(w.window) });
    const leakFreeFirst = (ws) => [...ws.filter(leakFree), ...ws.filter((w) => !leakFree(w))];
    candidates = leakFreeFirst(candidates);
    const clean = leakFreeFirst(candidates.filter((w) => windowLineKeys(w).every((k) => !usedLineKeys.has(k))));
    const ladder = {
      rng, spec, chapterVocab, usedSources, spent: ctx.spentLesen,
      preferNegative: wantRichtig && negationsByKey.Richtig < negationsByKey.Falsch,
      preferNegativeText: wantRichtig && printedByKey.Richtig < printedByKey.Falsch,
    };
    const picked = (clean.length ? pickLesenSource(clean, wantRichtig, ladder) : null)
      || pickLesenSource(candidates, wantRichtig, ladder)
      || pickLesenSource(candidates, wantRichtig, { ...ladder, quote: true });
    if (!picked) continue;
    const { candidate, text, report, statement } = picked;

    usedWindows.add(windowKeyOf(candidate));
    for (const k of windowLineKeys(candidate)) { usedLineKeys.add(k); usedLesenLines.add(k); }
    if (report) {
      usedSources.add(lineKeyOf(candidate.lektion?.id ?? candidate.lektion?.nr, candidate.start + report.lineIndex));
    }

    const answer = wantRichtig ? 'Richtig' : 'Falsch';
    items.push(lesenItem(checkpoint, i, wantRichtig, picked));
    const seatedItem = items[items.length - 1];
    if (!leakFree(candidate)) relaxed.push(`${seatedItem.id}`);
    seatedHere.push(seatedItem);
    pageIndex.set(seatedItem, i);
    if (negations(statement)) negationsByKey[answer] += 1;
    if (negations(text)) printedByKey[answer] += 1;
  }
  const lineKeys = [...usedLineKeys].filter((key) => !ctx.usedLineKeys.has(key));
  return { items: items.sort((a, b) => pageIndex.get(a) - pageIndex.get(b)), lineKeys, relaxed };
}

// Sprachbausteine: 6 pool items from the chapter's grammar slugs, typed-first
// (the standard asks for ≥ 4 typed) — and this is where the 30 % interleave
// from earlier chapters lands, because grammar is the thing that has to keep
// coming back.
function buildBausteine(ctx) {
  const { checkpoint, rng, chapter, earlier, pool, usedPoolIds, untaught, afterLektion } = ctx;
  const chapterTopics = topicsOf(chapter);
  // The interleave visits the earlier topics that still have something the learner has not
  // answered in a lesson FIRST — „a seen item is only the fallback of a thin topic", applied to the
  // choice of topic too. In Lektion order every later checkpoint reached for Lektion 2's numbers,
  // whose six unanswered items checkpoint 1's own papers draw (A1.2 checkpoint 4, measured
  // 2026-10-17). Ties keep the Lektion order.
  const fresh = (t) => byTopics(pool, [t], afterLektion)
    .filter((i) => !usedPoolIds.has(i.id) && !ctx.lessonSeen.has(i.id) && !ctx.spentPool?.has(i.id) && !untaught(i)).length;
  const earlierTopics = topicsOf(earlier).filter((t) => !chapterTopics.includes(t))
    .map((t, order) => ({ t, order, supply: fresh(t) }))
    .sort((a, b) => (b.supply > 0) - (a.supply > 0) || a.order - b.order)
    .map((x) => x.t);
  const earlierWanted = earlierTopics.length ? POOL_ITEMS_EARLIER : 0;
  // The Sprachbausteine are seated AFTER Hören, Lesen, Sprechen and the Schreiben
  // drills, so this draw can see everything the paper prints: an item whose
  // answer stands in a dictation, a Lesen text or a read-aloud line is skipped
  // (DaF review #14, MAJOR 3 — `a1.1-cp3-bausteine-3` „Nach Montag kommt ___.“
  // → `Dienstag`, beside a read-aloud line that names that very weekday).
  const guard = ctx.poolGuard('bausteine');
  const drawnEarlier = drawPool(pool, earlierTopics, earlierWanted, rng, usedPoolIds, { untaught, afterLektion, seen: ctx.lessonSeen, spent: ctx.spentPool, ...guard });
  const drawnChapter = drawPool(
    pool,
    chapterTopics,
    SECTION_COUNTS.bausteine - drawnEarlier.length,
    rng,
    usedPoolIds,
    { untaught, afterLektion, seen: ctx.lessonSeen, spent: ctx.spentPool, ...guard },
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
//   - THE REAL TASK is the checkpoint's own `writingTaskKey` (`a11-cp1` …, the
//     chapter's Textsorte with new facts — checkpointWritingTask), else the
//     chapter's last Lektion's `schreiben.taskKey` (`a11-l03`, `a11-l06`, …),
//     looked up in src/data/writingTasks.js — the
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
  const { checkpoint, rng, chapter, pool, usedPoolIds, untaught, afterLektion } = ctx;
  // Seated (so every other section can dodge its prompt) before any draw: the
  // chapter's own task is not a choice, so it is the one item the leak cap has to
  // work AROUND rather than on. The drills are drawn before the Sprachbausteine,
  // because they are the scarcer draw (see the order in buildCheckpoint).
  const graded = ctx.graded;
  const drillCount = SECTION_COUNTS.schreiben - (graded ? 1 : 0);
  const guard = ctx.poolGuard('schreiben');

  const slugs = shuffle([...new Set((chapter || []).map((l) => l?.primarySlug).filter(Boolean))], rng);
  const chosen = [];
  // One sentence_building item per slug, so the drills span as many Lektionen
  // of the chapter as there are slots.
  for (const slug of slugs) {
    if (chosen.length >= drillCount) break;
    const candidates = shuffle(
      byTopics(pool, [slug], afterLektion).filter((i) => i.type === 'sentence_building' && !usedPoolIds.has(i.id)),
      rng,
    );
    // Taught lexis first, and only then this slug's other sentence-building
    // items — this is the draw that used to hand checkpoint 2 `dd86dc8a`
    // („[Honig / ist / gut]“) as its first graded Schreiben item.
    // Taught lexis first, and only among the items this paper does not already
    // print (DaF review #14, MAJOR 3). A slug whose sentence-building items all
    // leak is SKIPPED here rather than relaxed: the two fills below draw from the
    // chapter's other topics, and only when those are exhausted too does the
    // last rung of `drawPool` seat a leaking item and record it.
    const clean = candidates.filter(guard.accept);
    // …and among those, one the learner has not answered in a lesson (transfer).
    const fresh = clean.filter((i) => !ctx.lessonSeen.has(i.id));
    const pick = fresh.find((i) => !untaught(i)) || clean.find((i) => !untaught(i)) || fresh[0] || clean[0];
    if (!pick) continue;
    usedPoolIds.add(pick.id);
    guard.onSeat(pick);
    chosen.push(pick);
  }
  // Short (a slug the pool has no sentence-building item for, or none this paper
  // does not already print): first fill from the chapter's OTHER primarySlugs,
  // typed only — a drill still has to come from a Lektion of this chapter, which
  // is what „Schreiben drills come from different Lektionen of the chapter"
  // pins. Only then widen to the chapter's remaining practice topics.
  if (chosen.length < drillCount) {
    const used = new Set(chosen.map((c) => c.topic));
    const otherSlugs = slugs.filter((t) => !used.has(t));
    chosen.push(...drawPool(pool, otherSlugs, drillCount - chosen.length, rng, usedPoolIds, { typedOnly: true, untaught, afterLektion, seen: ctx.lessonSeen, spent: ctx.spentPool, ...guard }));
  }
  if (chosen.length < drillCount) {
    const used = new Set(chosen.map((c) => c.topic));
    const rest = topicsOf(chapter).filter((t) => !used.has(t));
    chosen.push(...drawPool(pool, rest, drillCount - chosen.length, rng, usedPoolIds, { typedOnly: true, untaught, afterLektion, seen: ctx.lessonSeen, spent: ctx.spentPool, ...guard }));
  }
  if (chosen.length < drillCount) {
    chosen.push(...drawPool(pool, topicsOf(chapter), drillCount - chosen.length, rng, usedPoolIds, { typedOnly: true, untaught, afterLektion, seen: ctx.lessonSeen, spent: ctx.spentPool, ...guard }));
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

/**
 * The checkpoint's OWN task (`checkpoint.writingTaskKey`, e.g. `a11-cp1`): the chapter's Textsorte
 * with new people and facts, so the checkpoint measures transfer instead of replaying the lesson's
 * task (Codex review, 2026-10-07). Same shape as chapterWritingTask; null without a key.
 */
export function checkpointWritingTask(checkpoint, chapter) {
  const bank = checkpoint?.writingTaskKey ? writingTaskByKey('goethe_a1', checkpoint.writingTaskKey) : null;
  if (!bank) return null;
  const lektion = [...(chapter || [])].reverse().find((l) => l?.schreiben?.taskKey) || (chapter || []).at(-1);
  const kind = bank.register === 'formular' ? 'formular' : 'mitteilung';
  return { lektion, bank, schreiben: { kind, taskDe: bank.task, taskEn: bank.taskEn || null, fields: kind === 'formular' ? bank.leitpunkte : null, sample: bank.sample || null } };
}

/** That task as a checkpoint item — rendered by GradedWriting on CheckpointPage. */
function gradedWritingItem(checkpoint, chapter, level) {
  const found = checkpointWritingTask(checkpoint, chapter) || chapterWritingTask(chapter, level);
  if (!found) return null;
  const { lektion, schreiben: s, bank } = found;
  // The English twin the page prints under the task (CheckpointPage reads task.taskEn).
  const taskEn = s.taskEn || bank.taskEn || null;
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
    promptEn: taskEn,
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
      taskEn,
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
  const pref = shuffle(preferred.filter((l) => lineServable(ctx, l)), rng);
  const all = shuffle(dialogLines(chapter).filter((l) => lineServable(ctx, l)), rng);
  const ordered = [];
  const seen = new Set();
  const clamp = (ls) => clampFreeFirst(ls, ctx.curriculum, checkpoint.afterLektion);
  for (const bucket of [pref.filter(free), all.filter(free), pref, all].map(clamp)) {
    for (const line of bucket) {
      if (seen.has(key(line))) continue;
      seen.add(key(line));
      ordered.push(line);
    }
  }
  // …and one rung BELOW all four: a line whose sentence answers an item this
  // paper has already seated (DaF review #14, MAJOR 3). `a1.1-cp2-sprechen-1`
  // read „Und ein Handy?“ aloud beside a Lesen text that printed the whole
  // exchange. Ordering, not filtering: the section keeps its two items whatever
  // the chapter looks like, and a seat that had to take a leaking line is
  // recorded (see checkpointReport).
  const probe = (line) => ({
    section: 'sprechen', kind: 'readAloud', type: 'read_aloud',
    promptDe: 'Lesen Sie den Satz laut vor.', text: line.de, answer: line.de, accepted: [line.de],
  });
  const picked = [];
  const pool = [...ordered];
  while (picked.length < SECTION_COUNTS.sprechen && pool.length) {
    let at = pool.findIndex((line) => !ctx.leaks(probe(line)));
    if (at < 0) {
      at = 0;
      ctx.relax('sprechen', `${checkpoint.id}-sprechen-${picked.length + 1}: ${pool[0].de}`);
    }
    picked.push(pool.splice(at, 1)[0]);
  }
  return picked.map((line, i) => {
    usedLineKeys.add(lineKeyOf(line.lektionId || line.lektionNr, line.idx));
    const item = {
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
    ctx.seat(item);
    return item;
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
// …and not only from their default paper (DaF review #3 for A1.2, MAJOR 3): a learner who retook
// checkpoint 1 sat a round-1 paper, and with only the default rebuilt, checkpoint 3 could serve its
// items again. A window allows PAPERS_PER_WINDOW papers of a checkpoint, so every paper an earlier
// checkpoint can serve is rebuilt — a finite set, no history needed.
// ponytail: a learner whose attempts cannot be counted (signed out, storage blocked) can draw
// round 3+; those papers are not rebuilt.
function poolIdsBefore(curriculum, checkpoint, pool) {
  const used = new Set();
  const cps = curriculum?.checkpoints || [];
  const idx = cps.findIndex((c) => c.nr === checkpoint.nr);
  if (idx <= 0) return used;
  for (const earlier of cps.slice(0, idx)) {
    for (let round = 0; round < PAPERS_PER_WINDOW; round += 1) {
      for (const item of earlierPaper(curriculum, earlier, pool, round)) {
        if (item.poolItemId) used.add(item.poolItemId);
      }
    }
  }
  return used;
}

/**
 * Papers a learner can sit of one checkpoint inside an attempt window: checkpointService's
 * ATTEMPT_LIMIT (a test pins the two together). Round 0 is the default paper.
 */
export const PAPERS_PER_WINDOW = 3;

/** The seed of paper `round` of a checkpoint — CheckpointPage draws every attempt with it. */
export const paperSeed = (checkpoint, round) => (round ? `${checkpoint.id}-round-${round}` : undefined);

/** The round a seed is the paper of — paperSeed read backwards; any other seed is round 0. */
const roundOf = (checkpoint, seed) => {
  const prefix = `${checkpoint.id}-round-`;
  return String(seed ?? '').startsWith(prefix) ? Number(String(seed).slice(prefix.length)) || 0 : 0;
};

// Memoised per (curriculum object, pool object), like the practice plans below: every later
// checkpoint rebuilds the same earlier papers.
const paperMemo = new WeakMap();
const NO_POOL = {};
function earlierPaper(curriculum, checkpoint, pool, round) {
  let byPool = paperMemo.get(curriculum);
  if (!byPool) { byPool = new WeakMap(); paperMemo.set(curriculum, byPool); }
  let papers = byPool.get(pool || NO_POOL);
  if (!papers) { papers = new Map(); byPool.set(pool || NO_POOL, papers); }
  const key = `${checkpoint.id}#${round}`;
  if (!papers.has(key)) papers.set(key, buildCheckpoint({ curriculum, checkpoint, pool, seed: paperSeed(checkpoint, round) }));
  return papers.get(key);
}

/**
 * The pool items the lesson player hands out in the Lektionen up to this
 * checkpoint — the first run and the repeat (attempts 1 and 2). drawPool puts
 * them last, so the checkpoint asks the same rules through prompts the learner
 * has not answered yet.
 */
// Memoised per (curriculum object, pool object): a checkpoint also rebuilds every earlier
// checkpoint (poolIdsBefore), and the validator's mutation tests rebuild all four per clone —
// recomputing the draw each time multiplied the test suite's run time. One planPractice per
// attempt covers every Lektion; a curriculum a test clones and mutates is a new object.
const practicePlanMemo = new WeakMap();
function lessonSeenIds(curriculum, checkpoint, pool) {
  if (!pool) return new Set();
  let byPool = practicePlanMemo.get(curriculum);
  if (!byPool) { byPool = new WeakMap(); practicePlanMemo.set(curriculum, byPool); }
  let plans = byPool.get(pool);
  if (!plans) { plans = [1, 2].map((attempt) => planPractice(curriculum, pool, attempt)); byPool.set(pool, plans); }
  const seen = new Set();
  for (const plan of plans) {
    for (const [nr, items] of plan) {
      if (nr <= checkpoint.afterLektion) for (const item of items || []) seen.add(item.id);
    }
  }
  return seen;
}

/**
 * buildCheckpoint({ curriculum, checkpoint, pool, seed }) → 20 items,
 * in section order, deterministic in `seed` (default: the checkpoint id).
 */
export function buildCheckpoint({ curriculum, checkpoint, pool, seed } = {}) {
  if (!curriculum || !checkpoint) return [];
  const rng = mulberry32(hashSeed(seed ?? checkpoint.id));
  const chapter = chapterLektionen(curriculum, checkpoint);
  const ctx = {
    checkpoint,
    rng,
    pool,
    curriculum,
    level: curriculum.level,
    chapter,
    earlier: earlierLektionen(curriculum, checkpoint),
    usedPoolIds: poolIdsBefore(curriculum, checkpoint, pool),
    lessonSeen: lessonSeenIds(curriculum, checkpoint, pool),
    // Every dialogue line this paper has already spent, on ANY of its three
    // skill sections (DaF review #8, MAJOR 2). Hören fills it, Lesen honours
    // and extends it with every line of the windows it prints, Sprechen reads
    // it last — which is why the builders below run in that order.
    usedLineKeys: new Set(),
    // Measured at the END of the chapter this checkpoint closes: that is what
    // the learner sitting it has been taught (see untaughtAt).
    untaught: untaughtAt(curriculum, checkpoint.afterLektion),
    // …and the hard half of the same question, applied before that sort rather
    // than inside it (see servableBy). `undefined` where the stamps and this
    // curriculum are not the same scale, which is the one case in which the
    // comparison would be an accident rather than the rule.
    afterLektion: stampsApplyTo(curriculum, pool) ? checkpoint.afterLektion : undefined,
  };
  // THE PAPER AS ONE UNIT (DaF review #14, MAJOR 3). Every item that has been
  // placed, in placement order, with what it prints — `ctx.leaks(candidate)`
  // asks the whole paper, not the section.
  const seated = [];
  const leakFallbacks = [];
  ctx.seat = (item) => {
    if (item) seated.push(item);
    return item;
  };
  ctx.leaks = (candidate) => seated.some((placed) => leaksAcross(candidate, placed));
  ctx.relax = (section, note) => leakFallbacks.push({ section, note: String(note) });
  ctx.poolGuard = (section) => ({
    accept: (row) => !ctx.leaks(fromPoolItem(row, { id: `${checkpoint.id}-${section}-probe`, section, source: 'chapter' })),
    onSeat: (row) => ctx.seat(fromPoolItem(row, { id: `${checkpoint.id}-${section}-probe`, section, source: 'chapter' })),
    onRelax: (row) => ctx.relax(section, row.id),
  });
  // The chapter's own writing task is fixed — it is not drawn, so it is seated
  // FIRST and every drawn item dodges its prompt („Schreiben Sie Ihrer Chefin
  // eine kurze Nachricht." stood beside the Hören item whose answer was
  // `die Chefin`).
  // RETAKES (Codex review 2026-10-07: „Nochmal" must be a new paper). Every earlier paper of this
  // window showed its answers on its result screen, so what it drew goes last here — the pool
  // items in drawPool, the reported lines in the Lesen ladder. A preference, never a filter: a
  // thin chapter still fills its paper. Round 0 has no earlier paper and is drawn as before.
  const earlierRounds = Array.from({ length: roundOf(checkpoint, seed) }, (_, k) => earlierPaper(curriculum, checkpoint, pool, k)).flat();
  ctx.spentPool = new Set(earlierRounds.map((i) => i.poolItemId).filter(Boolean));
  ctx.spentLesen = new Set(earlierRounds.filter((i) => i.section === 'lesen').map((i) => normaliseStatement(i.trueStatement)));
  ctx.graded = gradedWritingItem(checkpoint, chapter, curriculum.level);
  ctx.seat(ctx.graded);
  // ORDER OF PLACEMENT ≠ order on the page. The three line-drawn sections go
  // first because a dialogue line cannot move (usedLineKeys, DaF review #8), the
  // two free draws — the Hören word choices and everything that comes out of the
  // pool — go last, because they can. Among the pool draws the scarcer one goes
  // first: a Schreiben drill needs a sentence-building item of one particular
  // Lektion, a Sprachbaustein takes any item of any chapter topic. Drawn the other
  // way round, the Sprachbausteine took `extra-a11-l06-15`, the one sentence-building
  // item of Lektion 6 the learner had not answered in a lesson, and the drill had to
  // fall back on one they had (a1.1-cp2's default paper, measured 2026-10-17; the
  // transfer ratchet in tests/checkpoint.test.mjs had held only because the shuffle missed it).
  const hoerenDictation = buildHoerenDictation(ctx);
  const lesen = buildLesen(ctx);
  const sprechen = buildSprechen(ctx);
  const schreiben = buildSchreiben(ctx);
  const bausteine = buildBausteine(ctx);
  // Dead last, because it is the freest draw on the paper: the chapter's whole
  // Wortfeld is available, so the two word-choice items can dodge everything
  // else, while a three-Lektion chapter has three sentence-building items for
  // its Schreiben drills and cannot. Placing them earlier cost checkpoint 1 two
  // recorded fallbacks; placing them last costs none.
  const hoerenWords = buildHoerenWords(ctx);
  const items = [...hoerenDictation, ...hoerenWords, ...lesen, ...bausteine, ...schreiben, ...sprechen];
  checkpointReports.set(items, { leakFallbacks });
  return items;
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
 * learner can fail at. Sprechen is NOT optional: an unmeasured line is not dropped from the
 * section, it is reported as unmeasured (scoreCheckpoint: `partial`).
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
/**
 * The most a section's closed-choice items give to ONE answer repeated everywhere (the best
 * constant strategy). Open, typed items add nothing to it — a constant cannot answer them.
 */
export function guessCeiling(items) {
  const counts = new Map();
  for (const i of items) {
    if (!Array.isArray(i.options) || !i.options.length) continue;
    const key = String(i.answer);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts.size ? Math.max(...counts.values()) : 0;
}

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
    // A section is scored on the items a machine measured (Codex rescore, 2026-10-15). Sprechen was
    // all-or-nothing: one self-confirmed line took the whole part out of the score, so a MEASURED
    // failure beside it vanished and the checkpoint passed with Sprechen "not assessed". Now the
    // measured lines count, and a part with some lines unmeasured is `partial` — the result card
    // names it, so a pass is never wider than its evidence.
    const measured = inSection.filter((i) => itemIsScored(i, answers[i.id]));
    if (!measured.length) {
      // Nothing measured: reported as done, kept out of the score.
      const done = inSection.filter((i) => isItemCorrect(i, answers[i.id])).length;
      sections[section] = {
        correct: done, total: inSection.length, pct: Math.round((done / inSection.length) * 100), scored: false,
        partial: false, of: inSection.length, guessCeiling: guessCeiling(inSection), realTask: null,
      };
      continue;
    }
    let correct = 0;
    for (const item of measured) {
      const answer = answers[item.id];
      const ok = isItemCorrect(item, answer);
      if (ok) correct += 1;
      else {
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
    const total = measured.length;
    // The graded text, when a grader scored it (unscored ones were dropped above): null = not attempted.
    const graded = measured.find((i) => i.kind === 'gradedWriting');
    sections[section] = {
      correct, total, pct: Math.round((correct / total) * 100), scored: true,
      partial: total < inSection.length, of: inSection.length, guessCeiling: guessCeiling(measured),
      realTask: graded ? isItemCorrect(graded, answers[graded.id]) : null,
    };
    scoredCorrect += correct;
    scoredTotal += total;
  }

  const overall = scoredTotal ? Math.round((scoredCorrect / scoredTotal) * 100) : 0;
  const weakest = Object.values(sections).filter((s) => s.scored);
  const passed = scoredTotal > 0 && overall >= PASS_OVERALL_PCT && weakest.every(sectionPasses);

  return { overall, correct: scoredCorrect, total: scoredTotal, sections, passed, errorTags };
}

/**
 * What a result can claim: the parts it assessed this time and the parts it did not. A pass on
 * Hören, Lesen and Bausteine with an ungraded text and a self-confirmed read-aloud is narrower than
 * „all five skills", and the result card says so (Codex score review, 2026-10-08). `writing` is
 * 'graded' (the text had a grader verdict), 'drills' (only the two sentence exercises counted) or
 * null (Schreiben not assessed at all).
 */
export function assessedParts(items, result) {
  const present = SECTION_ORDER.filter((s) => items.some((i) => i.section === s));
  const assessed = present.filter((s) => result?.sections?.[s]?.scored);
  const w = result?.sections?.schreiben;
  const writing = !w?.scored ? null : w.realTask == null ? 'drills' : 'graded';
  // Assessed on fewer tasks than the paper had: a read-aloud line with no recording, a dictation
  // read instead of heard (those leave before scoring). Schreiben without its graded text is the
  // `drills` line instead.
  const partial = assessed
    .map((s) => ({ section: s, measured: result.sections[s].total, of: items.filter((i) => i.section === s).length }))
    .filter((p) => p.measured < p.of && !(p.section === 'schreiben' && writing === 'drills'));
  return { assessed, partial, notAssessed: present.filter((s) => !assessed.includes(s)), writing };
}

/**
 * Does one scored section pass? The ONE rule scoreCheckpoint and the result row both read.
 *  - at least PASS_SECTION_PCT;
 *  - more than answering the same option everywhere: reading is two „richtig" and two „falsch", so
 *    always-„Richtig" scored 50 % and cleared the floor without reading a word (Codex review,
 *    2026-10-07). With 2/2 that means 3 of 4;
 *  - Schreiben: a graded text must pass by itself. Two sentence drills right and the real text at
 *    0 % was 2 of 3 = 67 % — a pass on a part whose real task failed (same review).
 */
export const sectionPasses = (s) =>
  s.pct >= PASS_SECTION_PCT && (!s.guessCeiling || s.correct > s.guessCeiling) && s.realTask !== false;

/**
 * remediationSet(items, answers, pool) → 10 fresh items aimed at what actually
 * went wrong: the topics that were missed, most-missed first, round-robin so a
 * single bad topic does not fill the whole set. Nothing already seen in this
 * checkpoint comes back (the standard: a miss returns as a DIFFERENT variant).
 */
export function remediationSet(items, answers = {}, pool, { size = 10, seed, afterLektion } = {}) {
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

  // The remediation set is drawn for the learner who has just sat THIS paper, so
  // it obeys the same `minLektion` bound the paper does: a miss is answered with
  // a variant the course has already taught, never with a preview of Lektion 8.
  const poolTopics = new Set(
    poolItems(pool).filter((i) => servableBy(i, afterLektion)).map((i) => i.topic),
  );
  const failing = [...missCounts.entries()]
    .filter(([topic]) => poolTopics.has(topic))
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([topic]) => topic);
  const fallback = [...new Set(items.map((i) => i.topic))].filter((t) => poolTopics.has(t) && !failing.includes(t));

  const used = new Set(items.map((i) => i.poolItemId).filter(Boolean));
  const rng = mulberry32(hashSeed(seed ?? `${items[0]?.id || 'cp'}-remediation`));
  const drawn = drawPool(pool, failing, size, rng, used, { afterLektion });
  if (drawn.length < size) drawn.push(...drawPool(pool, fallback, size - drawn.length, rng, used, { afterLektion }));

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
