import { supabase } from '../utils/supabase';

// Per-user checkboxes over a program's day items (course areas). RLS scopes
// every call to the caller's own rows; see migrations/2026-08-31-purchases.sql.

export const getProgramProgress = async (userId, programKey) => {
  const { data, error } = await supabase
    .from('program_progress')
    .select('item_id')
    .eq('user_id', userId)
    .eq('program_key', programKey);

  if (error) {
    console.error('Error fetching program progress:', error);
    return new Set();
  }
  return new Set((data || []).map((r) => r.item_id));
};

export const setProgramItemDone = async (userId, programKey, itemId, done) => {
  if (done) {
    const { error } = await supabase
      .from('program_progress')
      .upsert(
        { user_id: userId, program_key: programKey, item_id: itemId },
        { onConflict: 'user_id,program_key,item_id', ignoreDuplicates: true }
      );
    if (error) console.error('Error saving program progress:', error);
    return !error;
  }
  const { error } = await supabase
    .from('program_progress')
    .delete()
    .eq('user_id', userId)
    .eq('program_key', programKey)
    .eq('item_id', itemId);
  if (error) console.error('Error clearing program progress:', error);
  return !error;
};
