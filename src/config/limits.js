// Single source of truth for user-facing limit numbers.
//
// These MUST match the server-side gates, which are the real enforcement:
//   - X-Ray:    DAILY_LIMITS in netlify/functions/analyze-sentence.mjs
//   - Speaking: PRO_MONTHLY_LIMIT / TRIAL_TOTAL_LIMIT in the speaking functions
//
// Before this file the same numbers were retyped across the SPA, the Astro
// pricing page and the FAQ, and had drifted: the X-Ray paywall advertised
// "5 analyses per day", a tier that has never existed in the backend.

/** Anonymous visitor, per UTC day. */
export const ANON_DAILY_LIMIT = 1;

/** Signed-up account during the 7-day trial, per UTC day. */
export const TRIAL_DAILY_LIMIT = 10;

/** Signed-up account after the trial ends, per UTC day. */
export const FREE_DAILY_LIMIT = 1;

/** Pro subscriber, per UTC day. */
export const PRO_DAILY_LIMIT = 50;

/** Speaking sessions included with Pro, per month. */
export const PRO_SPEAKING_SESSIONS_PER_MONTH = 30;

/** Free 5-minute speaking sessions available during the trial, in total. */
export const TRIAL_SPEAKING_SESSIONS = 2;

export const TRIAL_DAYS = 7;
