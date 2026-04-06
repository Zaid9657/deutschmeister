import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

console.log('[supabase] URL:', supabaseUrl);
console.log('[supabase] Key present:', !!supabaseKey, '| Key prefix:', supabaseKey?.slice(0, 20));

if (!supabaseKey) {
  console.error('[supabase] PUBLIC_SUPABASE_ANON_KEY is not set — build will fail');
}

export const supabase = createClient(supabaseUrl, supabaseKey ?? 'missing-key');
