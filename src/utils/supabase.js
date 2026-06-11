import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tcXl1ZWRka3RxZXlycnF2bnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMzQyMjIsImV4cCI6MjA4NDYxMDIyMn0.1QAEt_aDNH-aT1464lhDeKFWTliVKbuv74up5RvtcVo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth headers for calls to our Netlify functions — they verify this JWT
// server-side and derive the acting user from it.
export async function getAuthHeaders() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
