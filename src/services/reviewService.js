import { supabase } from '../utils/supabase.js';
import { nextDue, cardKinds, wordCardKey, patternCardKey, sentenceCardKey, parseCardKey } from '../lib/review/ladder.js';
import { politeCaseItem } from '../data/lessonPools/quality.js';

// review_cards data access — the spaced review over WORDS, GRAMMAR PATTERNS and
// PRODUCTION SENTENCES that the standard asks for (§3). It sits beside, and
// does not touch, the existing vocabulary SRS (`vocab_srs_cards`,
// src/services/srsService.js): that deck is user-curated from the word lists and
// keeps its SM-2-lite schedule; this one is seeded automatically by the lesson
// engine and runs the fixed Babbel ladder.
//
// Fail-soft throughout, like programProgress/srsService: errors are read off the
// result and logged, never thrown, and a signed-out learner simply gets nothing
// back rather than an exception in the middle of a lesson.

const TABLE = 'review_cards';
const lc = (level) => String(level || '').toLowerCase();

/**
 * Called by the lesson engine after a Lektion completes (the integration hook).
 * Idempotent: a card that already exists keeps the schedule it has earned.
 */
export async function seedCardsForLektion(userId, lektion, level) {
  if (!userId || !lektion) return 0;
  const lvl = lc(level || lektion.level);
  const seen = new Set();
  const rows = [];
  const push = (card_key, kind) => {
    if (!card_key || seen.has(card_key)) return;
    seen.add(card_key);
    rows.push({ user_id: userId, card_key, kind, level: lvl, step: 0, due_at: new Date().toISOString() });
  };

  for (const word of lektion.wortfeld || []) push(wordCardKey(word), cardKinds.WORD);
  for (const slug of lektion.practiceRule?.topics || lektion.grammarSlugs || []) push(patternCardKey(slug), cardKinds.PATTERN);
  const lineIdx = new Set([...(lektion.hoeren?.lines || []), ...(lektion.sprechen?.readAloud || [])]);
  for (const idx of lineIdx) {
    if (lektion.dialog?.lines?.[idx]) push(sentenceCardKey(lektion.id, idx), cardKinds.SENTENCE);
  }
  if (!rows.length) return 0;

  const { error } = await supabase.from(TABLE).upsert(rows, { onConflict: 'user_id,card_key', ignoreDuplicates: true });
  if (error) {
    console.error('[reviewService] seedCardsForLektion:', error.message);
    return 0;
  }
  return rows.length;
}

/** Cards due now (or earlier) for one level, oldest-due first. */
export async function fetchDueCards(userId, level, limit = 12) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('level', lc(level))
    .lte('due_at', new Date().toISOString())
    .order('due_at', { ascending: true })
    .limit(limit);
  if (error) {
    console.error('[reviewService] fetchDueCards:', error.message);
    return [];
  }
  return data || [];
}

/** The dashboard tile's two numbers: cards in the deck and cards due now. */
export async function fetchReviewCounts(userId, level) {
  if (!userId) return { total: 0, due: 0 };
  const nowIso = new Date().toISOString();
  const base = () => supabase.from(TABLE).select('card_key', { count: 'exact', head: true }).eq('user_id', userId).eq('level', lc(level));
  const [total, due] = await Promise.all([base(), base().lte('due_at', nowIso)]);
  return { total: total.count || 0, due: due.count || 0 };
}

/** When does the next card come back? null = nothing scheduled. */
export async function fetchNextDueAt(userId, level) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select('due_at')
    .eq('user_id', userId)
    .eq('level', lc(level))
    .gt('due_at', new Date().toISOString())
    .order('due_at', { ascending: true })
    .limit(1);
  if (error) {
    console.error('[reviewService] fetchNextDueAt:', error.message);
    return null;
  }
  return data?.[0]?.due_at || null;
}

/** Grade one card and move it up (or back to the start) on the ladder. */
export async function gradeCard(userId, cardKey, correct) {
  if (!userId || !cardKey) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select('step, lapses')
    .eq('user_id', userId)
    .eq('card_key', cardKey)
    .maybeSingle();
  if (error) {
    console.error('[reviewService] gradeCard read:', error.message);
    return null;
  }
  const next = nextDue(data?.step ?? 0, Boolean(correct));
  const patch = {
    step: next.step,
    due_at: next.dueAt.toISOString(),
    lapses: (data?.lapses ?? 0) + (next.lapsed ? 1 : 0),
    last_result: correct ? 'correct' : 'wrong',
  };
  const { error: writeError } = await supabase.from(TABLE).update(patch).eq('user_id', userId).eq('card_key', cardKey);
  if (writeError) {
    console.error('[reviewService] gradeCard write:', writeError.message);
    return null;
  }
  return next;
}

/**
 * review_cards stores only the key — the CONTENT stays in the curriculum, so a
 * corrected word or dialogue line is corrected everywhere at once and no review
 * row can go stale. This is the lookup the review screen renders from; a card
 * whose key no longer resolves (the curriculum changed) is simply skipped.
 */
/**
 * Is capitalisation part of THIS card's answer?
 *
 * DaF review #6, BLOCKER 1 (the review-card half). `isCaseTask(item)` is the
 * item's own `caseSensitive === true` flag and nothing else, and the flag is
 * carried by the POOL items — `grep -c caseSensitive src/data/curricula/a11.js`
 * is **0**. So copying it off the curriculum entry, as these three lines used
 * to, made EVERY review card case-blind: the L1 sentence card
 * „Gut. Wie geht es Ihnen?“ forgave `ihnen` although the lesson item for the
 * same form (`extra-a11-l01-06`) grades it wrong. One rule, two answers,
 * decided by which file the learner met the form in.
 *
 * So the flag is DERIVED with the same predicate the pool build stamps items
 * with (`politeCaseItem` in src/data/lessonPools/quality.js — the polite
 * `Sie/Ihnen/Ihr…`, whose whole point is the capital), and an explicit
 * `caseSensitive: true` on the curriculum entry (or on a pool item a card is
 * ever built from) stays an override. Derive, never retype: when the predicate
 * changes, both surfaces change with it.
 *
 * DaF review #7, BLOCKER 1 (the review-card half). `politeCaseItem` is built
 * for POOL ITEMS, whose `answer`/`accepted` ARE the polite word or short
 * phrase itself (`extra-a11-l01-06`'s answer is `Ihnen`). A SENTENCE card's
 * `accepted` is a whole rendered dialogue LINE (`sentenceCardKey` cards carry
 * `line.de`, e.g. "Gut. Wie geht es Ihnen?") — the polite form is buried
 * inside it, not the whole answer, so `politeCaseItem` alone never reaches
 * it: that gap is exactly what let this card forgive `ihnen` as a typo while
 * `extra-a11-l01-06` grades the same form wrong. So sentence cards get a
 * second, narrow predicate of their own: a polite form (`Sie`, `Ihnen`,
 * `Ihr(e/en/em/er/es)`) counted only when it is NOT the first word of its own
 * sentence inside the line — a sentence-initial capital says nothing about
 * register, exactly the carve-out `politeCaseItem`'s own comment documents.
 * This is deliberately independent of quality.js — it reads the sentence
 * shape a dialogue line has, not the answer-key shape a pool item has, so it
 * does not drift if `politeCaseItem` is reshaped for its own reasons.
 */
const POLITE_WORD_RE = /^(Sie|Ihnen|Ihr|Ihre|Ihren|Ihrem|Ihrer|Ihres)$/;
const politeSentence = (line) =>
  String(line || '')
    .split(/(?<=[.!?])\s+/)
    .some((sentence) => sentence.trim().split(/\s+/).slice(1).some((w) => POLITE_WORD_RE.test(w.replace(/[.,!?]/g, ''))));

const caseFlag = (entry, accepted, { sentence = false } = {}) => {
  const acc = (accepted || []).filter(Boolean);
  return (
    entry?.caseSensitive === true ||
    politeCaseItem({ answer: entry?.answer, accepted: acc }) ||
    (sentence && acc.some(politeSentence))
  );
};

export function buildCardIndex(curriculum) {
  const index = new Map();
  for (const lektion of curriculum?.lektionen || []) {
    for (const word of lektion.wortfeld || []) {
      index.set(wordCardKey(word), {
        kind: cardKinds.WORD,
        front: word.de || word.word,
        back: word.en || '',
        speak: word.de || word.word,
        detail: word.plural ? `Plural: ${word.plural}` : '',
        lektionNr: lektion.nr,
        accepted: [word.de, word.word].filter(Boolean),
        caseSensitive: caseFlag(word, [word.de, word.word]),
      });
    }
    for (const slug of lektion.practiceRule?.topics || lektion.grammarSlugs || []) {
      if (index.has(patternCardKey(slug))) continue;
      index.set(patternCardKey(slug), {
        kind: cardKinds.PATTERN,
        front: lektion.notice?.title || slug,
        back: lektion.notice?.bodyDe || '',
        speak: lektion.notice?.examples?.[0] || '',
        detail: lektion.notice?.examples?.[0] || '',
        lektionNr: lektion.nr,
        accepted: (lektion.notice?.examples || []).filter(Boolean),
        caseSensitive: caseFlag(lektion.notice, lektion.notice?.examples || []),
      });
    }
    (lektion.dialog?.lines || []).forEach((line, idx) => {
      index.set(sentenceCardKey(lektion.id, idx), {
        kind: cardKinds.SENTENCE,
        front: line.de,
        back: line.en || '',
        speak: line.de,
        detail: `${line.speaker} — Lektion ${lektion.nr}`,
        lektionNr: lektion.nr,
        accepted: [line.de],
        caseSensitive: caseFlag(line, [line.de], { sentence: true }),
      });
    });
  }
  return index;
}

export { parseCardKey, wordCardKey, patternCardKey, sentenceCardKey, cardKinds };
