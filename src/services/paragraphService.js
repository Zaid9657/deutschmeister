import { supabase } from '../utils/supabase';

// ==========================================
// Helpers
// ==========================================

/** Convert app-level to DB level — paragraphs use lowercase (a1.1) */
const toDbLevel = (level) => level.toLowerCase();

// ==========================================
// Data Transformation
// ==========================================

function mapDbParagraphToApp(dbRow, index) {
  return {
    id: dbRow.id || `paragraph-${index}`,
    titleDe: dbRow.title_de || '',
    titleEn: dbRow.title_en || '',
    contentDe: dbRow.content_de || '',
    contentEn: dbRow.content_en || '',
    topic: dbRow.topic || '',
    wordCount: dbRow.word_count || 0,
    difficulty: dbRow.difficulty || 1,
    audioUrl: dbRow.audio_url || '',
    orderIndex: dbRow.order_index || index,
  };
}

// ==========================================
// Public API
// ==========================================

/**
 * Fetch paragraphs for a specific sub-level (e.g. 'a1.1') from Supabase.
 * Returns empty array if nothing found or on error.
 */
export async function fetchParagraphsForLevel(level) {
  const dbLevel = toDbLevel(level);
  console.log(`[paragraphService] fetchParagraphsForLevel: level="${level}" → DB level="${dbLevel}"`);

  const { data, error } = await supabase
    .from('paragraphs')
    .select('*')
    .eq('level', dbLevel)
    .order('order_index');

  console.log(`[paragraphService] fetchParagraphsForLevel result:`, {
    rowCount: data?.length ?? 0,
    error,
    firstRow: data?.[0] ?? null,
  });

  if (error) {
    console.error(`[paragraphService] fetchParagraphsForLevel ERROR:`, error);
    return [];
  }

  if (!data || data.length === 0) {
    console.warn(`[paragraphService] fetchParagraphsForLevel: NO PARAGRAPHS for level="${dbLevel}"`);
    return [];
  }

  return data.map((row, i) => mapDbParagraphToApp(row, i));
}
