import { supabase } from '../utils/supabase.js';
import { review } from './srsScheduler.js';

// vocab_srs_cards data access (renovation Phase 6) — fail-soft like
// programProgress/examService; errors are read off the result, never thrown.

/** Cards due now (or earlier), joined with their words, oldest-due first. */
export async function fetchDueCards(userId, limit = 20) {
  const { data, error } = await supabase
    .from('vocab_srs_cards')
    .select('*, words(*)')
    .eq('user_id', userId)
    .lte('due_at', new Date().toISOString())
    .order('due_at', { ascending: true })
    .limit(limit);
  if (error) {
    console.error('[srsService] fetchDueCards:', error.message);
    return [];
  }
  return (data || []).filter((c) => c.words);
}

/** Deck counts for the header: total cards + due-now. */
export async function fetchDeckCounts(userId) {
  const nowIso = new Date().toISOString();
  const [total, due] = await Promise.all([
    supabase.from('vocab_srs_cards').select('word_id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('vocab_srs_cards').select('word_id', { count: 'exact', head: true }).eq('user_id', userId).lte('due_at', nowIso),
  ]);
  return { total: total.count || 0, due: due.count || 0 };
}

/** Grade a card and persist the scheduler's next state. */
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
  if (error) console.error('[srsService] recordReview:', error.message);
  return !error;
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
