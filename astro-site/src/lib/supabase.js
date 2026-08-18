import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('[supabase] PUBLIC_SUPABASE_ANON_KEY is not set — build will fail');
}

export const supabase = createClient(supabaseUrl, supabaseKey ?? 'missing-key');
