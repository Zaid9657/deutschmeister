// Re-export of the limit constants from the shared marketing data file.
//
// The numbers moved to src/data/marketing.js so the Astro site can read them
// too — it is a separate package and cannot import from src/config/. This file
// stays as the SPA's import path (src/pages/SentenceXRay.jsx and anything added
// later) so there is still exactly one place these numbers are defined, and
// exactly one place their provenance is recorded: marketing.js.
//
// Do not redeclare a value here. Add it to src/data/marketing.js with its
// provenance comment, then re-export it below if the SPA wants this path.

export {
  ANON_DAILY_LIMIT,
  TRIAL_DAILY_LIMIT,
  FREE_DAILY_LIMIT,
  PRO_DAILY_LIMIT,
  PRO_SPEAKING_SESSIONS_PER_MONTH,
  TRIAL_SPEAKING_SESSIONS,
  TRIAL_DAYS,
} from '../data/marketing.js';
