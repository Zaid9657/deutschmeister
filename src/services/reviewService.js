import { supabase } from '../utils/supabase.js';
import { nextDue, cardKinds, wordCardKey, patternCardKey, sentenceCardKey, parseCardKey } from '../lib/review/ladder.js';

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
        // The case-task opt-in travels with the content (check.js's isCaseTask
        // reads the item's own flag now), so a polite form is graded in the
        // review exactly as it is in the lesson.
        caseSensitive: word.caseSensitive === true,
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
        caseSensitive: lektion.notice?.caseSensitive === true,
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
        caseSensitive: line.caseSensitive === true,
      });
    });
  }
  return index;
}

export { parseCardKey, wordCardKey, patternCardKey, sentenceCardKey, cardKinds };
