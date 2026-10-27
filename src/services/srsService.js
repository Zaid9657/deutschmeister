import { supabase } from '../utils/supabase.js';
import { review, sessionQueue, dueNow, SESSION_SIZE, NEW_CARDS_PER_SESSION } from './srsScheduler.js';

// vocab_srs_cards data access (renovation Phase 6) — fail-soft like
// programProgress/examService; errors are read off the result, never thrown.

/**
 * One session's cards, joined with their words: the due reviews first (oldest due first), then new
 * cards (reps = 0, never graded, oldest added first) up to the session allowance — sessionQueue()
 * in srsScheduler.js. A new card's due_at is only the moment it was added, so the old single
 * "due_at ascending" query served the unseen backlog ahead of every review. Any failed read
 * returns [], never new cards alone.
 */
export async function fetchDueCards(userId, limit = SESSION_SIZE) {
  const [reviews, fresh] = await Promise.all([
    supabase
      .from('vocab_srs_cards')
      .select('*, words(*)')
      .eq('user_id', userId)
      .gt('reps', 0)
      .lte('due_at', new Date().toISOString())
      .order('due_at', { ascending: true })
      .limit(limit),
    supabase
      .from('vocab_srs_cards')
      .select('*, words(*)')
      .eq('user_id', userId)
      .eq('reps', 0)
      .order('created_at', { ascending: true })
      .order('word_id', { ascending: true })
      .limit(Math.min(limit, NEW_CARDS_PER_SESSION)),
  ]);
  const error = reviews.error || fresh.error;
  if (error) {
    console.error('[srsService] fetchDueCards:', error.message);
    return [];
  }
  const withWord = (rows) => (rows || []).filter((c) => c.words);
  return sessionQueue(withWord(reviews.data), withWord(fresh.data), { limit });
}

/**
 * Deck counts for the trainer header and the nav badge: total cards, and `due` = the due reviews
 * plus the new cards the next session would add (dueNow), not the raw backlog of unseen words.
 * `ok` is false when a count could not be read, so a failed read is never shown as "nothing due".
 */
export async function fetchDeckCounts(userId) {
  const nowIso = new Date().toISOString();
  const [total, reviews, fresh] = await Promise.all([
    supabase.from('vocab_srs_cards').select('word_id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('vocab_srs_cards').select('word_id', { count: 'exact', head: true }).eq('user_id', userId).gt('reps', 0).lte('due_at', nowIso),
    supabase.from('vocab_srs_cards').select('word_id', { count: 'exact', head: true }).eq('user_id', userId).eq('reps', 0),
  ]);
  const failed = [total, reviews, fresh].find((r) => r.error);
  if (failed) console.error('[srsService] fetchDeckCounts:', failed.error.message);
  return {
    total: total.count || 0,
    due: dueNow(reviews.count || 0, fresh.count || 0),
    ok: !failed,
  };
}

/**
 * Grade a card and persist the scheduler's next state. Returns that state as saved, or null when
 * the write failed: the trainer advances only on a saved grade, and re-queues a "Nochmal" card FROM
 * this state (the stale card would let its next grade erase the lapse).
 */
export async function recordReview(userId, card, grade) {
  const next = review(card, grade);
  const { error } = await supabase
    .from('vocab_srs_cards')
    .update({
      ease: next.ease,
      interval_days: next.interval_days,
      due_at: next.due_at,
      reps: next.reps,
      lapses: next.lapses,
      last_grade: grade,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('word_id', card.word_id);
  if (error) {
    console.error('[srsService] recordReview:', error.message);
    return null;
  }
  return { ...next, last_grade: grade };
}

/** Add words to the deck (idempotent — existing cards keep their schedule). */
export async function enqueueWords(userId, wordIds) {
  if (!wordIds?.length) return 0;
  const rows = wordIds.map((word_id) => ({ user_id: userId, word_id }));
  const { error } = await supabase
    .from('vocab_srs_cards')
    .upsert(rows, { onConflict: 'user_id,word_id', ignoreDuplicates: true });
  if (error) {
    console.error('[srsService] enqueueWords:', error.message);
    return 0;
  }
  return wordIds.length;
}

/** Which of these words are already in the deck? Returns a Set of word ids. */
export async function fetchDeckMembership(userId, wordIds) {
  if (!wordIds?.length) return new Set();
  const { data, error } = await supabase
    .from('vocab_srs_cards')
    .select('word_id')
    .eq('user_id', userId)
    .in('word_id', wordIds);
  if (error) {
    console.error('[srsService] fetchDeckMembership:', error.message);
    return new Set();
  }
  return new Set((data || []).map((r) => r.word_id));
}

/** Remove a card from the deck. */
export async function removeCard(userId, wordId) {
  const { error } = await supabase
    .from('vocab_srs_cards')
    .delete()
    .eq('user_id', userId)
    .eq('word_id', wordId);
  if (error) console.error('[srsService] removeCard:', error.message);
  return !error;
}
