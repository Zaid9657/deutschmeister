import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error('PUBLIC_SUPABASE_ANON_KEY is not set. Add it to astro-site/.env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
