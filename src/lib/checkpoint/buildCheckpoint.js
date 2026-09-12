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
//
// Everything is deterministic in `seed` (mulberry32), so tests can pin the
// exact 20 items and "Nochmal" can reshuffle the ORDER without changing the
// test a learner already saw.
import { checkAnswer, tagError, RESULT, STRICT_TOPIC } from '../lesson/check.js';

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

const byTopics = (pool, topics) => {
  const wanted = new Set(topics);
  return poolItems(pool)
    .filter((i) => wanted.has(i.topic))
    .sort((a, b) => (a.topic === b.topic ? (a.order || 0) - (b.order || 0) : a.topic < b.topic ? -1 : 1));
};

/**
 * Draw `n` pool items for `topics`, typed first, deterministically and without
 * repeating anything in `usedIds`. Topics are visited round-robin so one fat
 * topic cannot crowd the others out.
 */
function drawPool(pool, topics, n, rng, usedIds, { typedOnly = false } = {}) {
  if (n <= 0 || !topics.length) return [];
  const buckets = topics.map((topic) => {
    const all = shuffle(byTopics(pool, [topic]).filter((i) => !usedIds.has(i.id)), rng);
    const typed = all.filter(isTyped);
    const rest = typedOnly ? [] : all.filter((i) => !isTyped(i));
    return [...typed, ...rest];
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
    explanationDe: poolItem.explanationDe || null,
    hint: poolItem.hint || null,
    poolItemId: poolItem.id,
    type: poolItem.type,
  };
}

// ── the five sections ───────────────────────────────────────────────────────

// Hören: 3 full-line dictations from the chapter's dialogues + 2 "welches Wort
// hast du gehört?" built from the Wortfeld (correct word + 3 Wortfeld
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
      promptDe: 'Hör zu und schreib den Satz.',
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
      promptDe: 'Welches Wort hörst du?',
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
// with ONE richtig/falsch statement. Deterministic templates — a "richtig"
// statement quotes a line of the text; a "falsch" one quotes a line from a
// different Lektion, so it is false by construction and never a judgement call.
function buildLesen(ctx) {
  const { checkpoint, rng, chapter } = ctx;
  const items = [];
  const withDialog = chapter.filter((l) => (l?.dialog?.lines || []).length >= 2);
  if (!withDialog.length) return items;
  const order = shuffle(withDialog, rng);

  for (let i = 0; i < SECTION_COUNTS.lesen; i += 1) {
    const lektion = order[i % order.length];
    const lines = lektion.dialog.lines;
    const span = Math.min(3, lines.length);
    const start = Math.floor(rng() * Math.max(1, lines.length - span + 1));
    const window = lines.slice(start, start + span);
    const text = window.map((l) => `${l.speaker}: ${l.de}`).join(' ');
    const wantRichtig = i % 2 === 0;

    let quoted = window[Math.floor(rng() * window.length)];
    if (!wantRichtig) {
      const others = dialogLines(order.filter((l) => l.nr !== lektion.nr)).filter(
        (l) => !window.some((w) => w.de === l.de),
      );
      const foreign = others.length ? others[Math.floor(rng() * others.length)] : null;
      if (foreign) quoted = foreign;
      else continue;
    }
    const speaker = quoted.speaker;
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
      promptDe: `Steht das im Text? „${speaker}: ${quoted.de}“`,
      promptEn: 'Does the text say this?',
      audioText: null,
      text,
      options: ['Richtig', 'Falsch'],
      answer,
      accepted: [answer],
      explanationDe: wantRichtig
        ? 'Der Satz steht genau so im Text.'
        : 'Dieser Satz steht nicht in diesem Text — er kommt aus einer anderen Lektion.',
      hint: `Lektion ${lektion.nr}`,
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
  const { checkpoint, rng, chapter, earlier, pool, usedPoolIds } = ctx;
  const chapterTopics = topicsOf(chapter);
  const earlierTopics = topicsOf(earlier).filter((t) => !chapterTopics.includes(t));
  const earlierWanted = earlierTopics.length ? POOL_ITEMS_EARLIER : 0;
  const drawnEarlier = drawPool(pool, earlierTopics, earlierWanted, rng, usedPoolIds);
  const drawnChapter = drawPool(
    pool,
    chapterTopics,
    SECTION_COUNTS.bausteine - drawnEarlier.length,
    rng,
    usedPoolIds,
  );
  return [...drawnChapter, ...drawnEarlier].map((p, i) =>
    fromPoolItem(p, {
      id: `${checkpoint.id}-bausteine-${i + 1}`,
      section: 'bausteine',
      source: drawnChapter.includes(p) ? 'chapter' : 'earlier',
    }),
  );
}

// Schreiben: 3 production items — sentence_building from the chapter's topics
// where the pool has them, typed fill_blank where it does not. The register
// (Formular / Mitteilung) comes from the chapter's own schreiben tasks so the
// section reads like the writing the Lektionen actually taught.
function buildSchreiben(ctx) {
  const { checkpoint, rng, chapter, pool, usedPoolIds } = ctx;
  const topics = topicsOf(chapter);
  const registers = chapter.map((l) => l?.schreiben?.kind).filter(Boolean);
  const candidates = shuffle(
    byTopics(pool, topics).filter((i) => i.type === 'sentence_building' && !usedPoolIds.has(i.id)),
    rng,
  );
  const chosen = take(candidates, SECTION_COUNTS.schreiben);
  chosen.forEach((c) => usedPoolIds.add(c.id));
  if (chosen.length < SECTION_COUNTS.schreiben) {
    chosen.push(...drawPool(pool, topics, SECTION_COUNTS.schreiben - chosen.length, rng, usedPoolIds, { typedOnly: true }));
  }
  return chosen.map((p, i) =>
    fromPoolItem(p, {
      id: `${checkpoint.id}-schreiben-${i + 1}`,
      section: 'schreiben',
      source: 'chapter',
      register: registers.length ? registers[i % registers.length] : null,
    }),
  );
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
    promptDe: 'Lies den Satz laut vor.',
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
    chapter: chapterLektionen(curriculum, checkpoint),
    earlier: earlierLektionen(curriculum, checkpoint),
    usedPoolIds: new Set(),
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

/** Does this item count toward the score ON THIS RUN? (see the file header) */
export const itemIsScored = (item, answer) =>
  Boolean(item?.scored) || (item?.scorable === true && isMicResult(answer));

/**
 * Was this answer right? A self-confirmed read-aloud is "done", never right or
 * wrong; a mic-scored one is right at SPRECHEN_PASS_PCT and up.
 */
export function isItemCorrect(item, answer) {
  if (!item) return false;
  if (item.mode === 'confirm') {
    if (isMicResult(answer)) return answer.pct >= SPRECHEN_PASS_PCT;
    return answer === true || answer === 'done';
  }
  if (answer == null || answer === '') return false;
  const strict = STRICT_TOPIC.test(item.topic || '');
  const { result } = checkAnswer(String(answer), item.accepted, { strict });
  return result === RESULT.CORRECT || result === RESULT.TYPO;
}

/**
 * scoreCheckpoint(items, answers) → the result screen's whole payload.
 * `answers` is keyed by item id. Sprechen enters the overall percentage and
 * the 40 %-per-section rule only when every read-aloud in it was scored by the
 * microphone; a single self-confirm leaves the section reported but unscored.
 */
export function scoreCheckpoint(items, answers = {}) {
  const sections = {};
  const errorTags = {};
  let scoredCorrect = 0;
  let scoredTotal = 0;

  for (const section of SECTION_ORDER) {
    const inSection = items.filter((i) => i.section === section);
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
        const tag = item.scorable && isMicResult(answer) ? 'Aussprache' : tagError(
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
