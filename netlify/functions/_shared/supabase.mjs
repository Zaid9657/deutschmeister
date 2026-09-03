// The service-role Supabase client, constructed once for every function.
//
// This file existed before, but nine of the fifteen functions ignored it and
// re-declared the identical bootstrap inline — each repeating the hardcoded
// project-URL fallback below, eleven copies in all. They now all import from
// here, so the client is configured in one place.
//
// NOT routed through here on purpose: podcast-feed.js. It is CommonJS, it
// builds its client inside the handler, and it uses the ANON key — the feed is
// public and has no business holding the service role. Folding it in would
// silently escalate its privileges.
//
// ON THE URL FALLBACK. Hardcoding the project as a default means a deploy with
// SUPABASE_URL unset points at production instead of failing, which is how a
// staging environment quietly writes to live data. The right end state is to
// drop the `||` and throw. It is kept for now because whether SUPABASE_URL is
// actually set in the Netlify environment cannot be checked from here, and
// removing it blind would 500 every function if it is not. To finish this:
// confirm SUPABASE_URL is set in the Netlify environment, then delete the
// fallback and let a missing value throw at import.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!process.env.SUPABASE_URL) {
  console.warn(
    '[supabase] SUPABASE_URL is not set — falling back to the hardcoded production project. ' +
    'Set it in the environment; see the note in netlify/functions/_shared/supabase.mjs.',
  );
}

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Failed to initialize Supabase client:', e.message);
}

export { supabase, supabaseKey };
