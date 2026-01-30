import { supabase } from '../utils/supabase';

// ==========================================
// Helpers
// ==========================================

/** Convert app-level (a1.1) to DB level (A1.1) */
const toDbLevel = (level) => level.toUpperCase();

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
    word: dbRow.word || dbRow.word_de || '',
    translation: dbRow.translation || dbRow.word_en || '',
    example: dbRow.example_de || dbRow.example || '',
    exampleTranslation: dbRow.example_en || dbRow.example_translation || '',
    category: dbRow.category || '',
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
export async function fetchWordsForLevel(level) {
  const dbLevel = toDbLevel(level);
  console.log(`[vocabularyService] fetchWordsForLevel: level="${level}" → DB level="${dbLevel}"`);

  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('level', dbLevel)
    .order('id');

  console.log(`[vocabularyService] fetchWordsForLevel result:`, {
    rowCount: data?.length ?? 0,
    error,
    firstRow: data?.[0] ?? null,
    columnNames: data?.[0] ? Object.keys(data[0]) : [],
  });

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
  console.log(`[vocabularyService] fetchSentencesForLevel: level="${level}" → DB level="${dbLevel}"`);

  const { data, error } = await supabase
    .from('sentences')
    .select('*')
    .eq('level', dbLevel)
    .order('id');

  console.log(`[vocabularyService] fetchSentencesForLevel result:`, {
    rowCount: data?.length ?? 0,
    error,
    firstRow: data?.[0] ?? null,
    columnNames: data?.[0] ? Object.keys(data[0]) : [],
  });

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
