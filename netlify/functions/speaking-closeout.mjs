// Speaking close-out — hourly sweep of abandoned speaking sessions.
//
// A session the learner walks away from (tab closed, phone locked, app
// switched) never sends its 'end' call, so until 2026-09-27 it stayed 'active'
// forever: 36 such rows, every one reporting user_turns 0 whether or not the
// learner had spoken. check-speaking-usage and speaking-session's 'start'
// already settle the CALLER's stale sessions (that is what gives an allowance
// back); this job settles everyone else's, so a learner who never returns
// still leaves an honest row behind.
//
// The rule itself lives in ONE place, _shared/speakingCloseout.mjs: stale =
// past started_at + planned_minutes + grace (speaking-turn refuses turns from
// then on); learner turns counted from speaking_messages → 'completed'; none →
// 'cancelled' and the reservation (trial unit / wallet debit) is released.
// Idempotent and race-safe (the flip is conditional on status = 'active').
//
// Same auth shape as the other scheduled jobs: scheduler invocations carry
// next_run; a manual run needs ?secret=CAMPAIGN_SECRET. Sends nothing.
import { schedule } from '@netlify/functions';
import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { closeOutStaleSessions } from './_shared/speakingCloseout.mjs';

const innerHandler = async (event) => {
  if (!supabaseKey || !supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }) };
  }

  const qs = event?.queryStringParameters || {};
  let bodyPayload = {};
  try { bodyPayload = JSON.parse(event?.body || '{}'); } catch { /* ignore */ }
  const isScheduled = typeof bodyPayload.next_run === 'string';
  const secret = process.env.CAMPAIGN_SECRET;
  const secretOk = Boolean(secret) && qs.secret === secret;
  if (!isScheduled && !secretOk) {
    console.warn('[speaking-closeout] rejected unauthenticated invocation');
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const summary = await closeOutStaleSessions(supabase, { limit: 200 });
    console.log('[speaking-closeout]', JSON.stringify(summary));
    return { statusCode: summary.error ? 500 : 200, body: JSON.stringify(summary) };
  } catch (err) {
    console.error('[speaking-closeout] error:', err.message, err.stack);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};

// A literal on purpose: Netlify reads the cron out of this call statically.
export const handler = schedule('20 * * * *', innerHandler);
