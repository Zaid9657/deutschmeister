import { supabase } from '../utils/supabase';

// ==========================================
// Helpers
// ==========================================

/** Convert app-level to DB level — words/sentences use lowercase (a1.1) */
const toDbLevel = (level) => level.toLowerCase();

// ==========================================
// Data Transformation Helpers
// ==========================================

/**
 * Transform a `words` DB row into the app's WordCard format.
 * Tries multiple column name variants for resilience.
 */
function mapDbWordToApp(dbRow, index) {
  return {
    id: dbRow.id || `word-${index}`,
    word: dbRow.german || '',
    translation: dbRow.english || '',
    example: dbRow.example_sentence || '',
    category: dbRow.category || '',
    article: dbRow.article || '',
    // Some rows still carry the literal string "null" instead of SQL NULL
    // (see migrations/2026-09-05-a1-1-wortliste.sql) — treat both the same
    // as "no plural" rather than rendering the word "null" on the card.
    plural: dbRow.plural && dbRow.plural !== 'null' ? dbRow.plural : '',
    audioUrl: dbRow.audio_url || '',
  };
}

/**
 * Transform a `sentences` DB row into the app's SentenceCard format.
 * Tries multiple column name variants for resilience.
 */
function mapDbSentenceToApp(dbRow, index) {
  return {
    id: dbRow.id || `sentence-${index}`,
    german: dbRow.sentence_de || dbRow.german || '',
    english: dbRow.sentence_en || dbRow.english || '',
    topic: dbRow.topic || '',
  };
}

// ==========================================
// Public API — Supabase only, NO static fallback
// ==========================================

/**
 * Fetch vocabulary words for a level from Supabase only.
 * Returns empty array if nothing found or on error.
 */
/**
 * Count words for a level without downloading them.
 *
 * The vocabulary overview only needs eight numbers, but used to fetch every
 * row of all eight levels (~2,000 records) just to read `.length`.
 */
export async function countWordsForLevel(level) {
  const dbLevel = toDbLevel(level);

  const { count, error } = await supabase
    .from('words')
    .select('id', { count: 'exact', head: true })
    .eq('level', dbLevel);

  if (error) {
    console.error('[vocabularyService] countWordsForLevel ERROR:', error.message);
    return 0;
  }
  return count ?? 0;
}

export async function fetchWordsForLevel(level) {
  const dbLevel = toDbLevel(level);

  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('level', dbLevel)
    .order('id');

  if (error) {
    console.error(`[vocabularyService] fetchWordsForLevel ERROR:`, error);
    return [];
  }

  if (!data || data.length === 0) {
    console.warn(`[vocabularyService] fetchWordsForLevel: NO WORDS in Supabase for level="${level}" (level="${dbLevel}")`);
    return [];
  }

  return data.map((row, i) => mapDbWordToApp(row, i));
}

/**
 * Fetch sentences for a level from Supabase only.
 * Returns empty array if nothing found or on error.
 */
export async function fetchSentencesForLevel(level) {
  const dbLevel = toDbLevel(level);

  const { data, error } = await supabase
    .from('sentences')
    .select('*')
    .eq('level', dbLevel)
    .order('id');

  if (error) {
    console.error(`[vocabularyService] fetchSentencesForLevel ERROR:`, error);
    return [];
  }

  if (!data || data.length === 0) {
    console.warn(`[vocabularyService] fetchSentencesForLevel: NO SENTENCES in Supabase for level="${level}" (level="${dbLevel}")`);
    return [];
  }

  return data.map((row, i) => mapDbSentenceToApp(row, i));
}
