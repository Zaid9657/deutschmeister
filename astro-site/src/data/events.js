// THE funnel event registry — what each analytics event means, when it fires,
// and which properties it may carry. Shared by both front ends.
//
// DUPLICATED between the SPA and the Astro site (byte-identical, enforced by
// scripts/check-duplicates.mjs), like pricing.js and marketing.js.
//
// WHY THIS EXISTS. Until 2026-10 the Astro pages (/, /pricing/, /courses/…)
// sent no events at all, so a checkout started there was invisible, and the
// SPA's names lived only in the code that fired them. One registry means the
// homepage and the app describe the same funnel with the same words, and a
// GA4 report can be read without archaeology. docs/redesign-2026-10/measurement.md
// is the human-readable version of this file.
//
// THREE RULES.
//   1. Events go out only after the visitor accepted analytics
//      (dm_cookie_consent === 'accepted', set by public/consent.js). Before
//      that they are dropped, never queued.
//   2. No personal data and no learner text: properties pass through
//      sanitizeProps(), which keeps only the ALLOWED_PROPS keys and drops any
//      value that could be an email address or free text.
//   3. A client event is an OBSERVATION, never money. A purchase is real when
//      the Lemon Squeezy webhook writes a `purchases` row (weekly_truth reads
//      it). checkout_completed is the browser seeing a success screen, which a
//      refund, a blocked overlay or a reload can all make disagree with the ledger.

/**
 * name → { when: plain-language trigger, once: fire at most once per page view
 * (per `surface`/`product`) }. Keep `when` precise: it is what the report means.
 */
export const EVENTS = {
  // --- Marketing site (Astro) -------------------------------------------------
  offer_viewed: {
    when: 'An offer surface (the station line, a ticket, a pricing column) is at least half on screen.',
    once: true,
  },
  demo_started: { when: 'The visitor checks their first answer in the "Der erste Halt" demo.', once: true },
  demo_completed: { when: 'All items of the "Der erste Halt" demo are answered correctly.', once: true },
  course_selected: { when: 'A station, a fit-chooser answer or a course card is chosen.', once: false },
  checkout_intent: { when: 'A Buy or Pro button is pressed, before the sign-in check.', once: false },
  checkout_opened: { when: 'The Lemon Squeezy checkout is opened for a signed-in buyer (overlay or same tab).', once: false },

  // --- App (SPA) — names already in use since 2026-08 ---------------------------
  signup_started: { when: 'The signup form is submitted.', once: false },
  signup_completed: { when: 'A new account is confirmed and signed in for the first time on this browser.', once: true },
  email_verified: { when: 'The verify-email screen sees the address confirmed.', once: true },
  onboarding_completed: { when: 'The onboarding slides are finished or left.', once: true },
  lesson_started: { when: 'A course Lektion is opened in the lesson player.', once: false },
  lesson_completed: { when: 'A course Lektion reaches its recap.', once: false },
  lesson_resumed: { when: 'The lesson player reopens a saved, unfinished run of a Lektion (same run_id as its lesson_started).', once: false },
  lesson_stage_viewed: { when: 'A stage of a Lektion run is shown for the first time in that run (step = the stage key).', once: false },
  lesson_sync_failed: {
    when: 'A finished Lektion could not be written to the account; it is kept on the device and retried (step = attempts | progress | cards).',
    once: false,
  },
  paywall_shown: { when: 'A lock, paywall or speaking-limit offer is rendered.', once: false },
  social_clicked: {
    when: 'A link to one of our social channels (SOCIAL_LINKS in navigation.js) is clicked; `surface` says where, `channel` which.',
    once: false,
  },
  checkout_started: { when: 'The app opens a checkout (the SPA name for checkout_opened).', once: false },
  checkout_completed: {
    when: 'The browser observes a successful checkout once (overlay success, or access appearing after a pending checkout). Not revenue.',
    once: true,
  },
};

/** The only property keys any event may carry. Anything else is dropped. */
export const ALLOWED_PROPS = [
  'surface', // which block fired it: hero, line, ticket, fit, pricing_level, pricing_pro, course_page…
  'product', // a pricing.js product key: course_a1_2, monthly, yearly, telc_b1_komplett
  'level', // lowercase sub-level: a1.1 … b2.2
  'choice', // a fit-chooser answer id
  'step', // demo item number, onboarding slide
  'result', // demo verdict: correct | typo | wrong
  'variant', // homepage copy variant id (sequential experiments)
  'plan', // monthly | yearly | a product key (SPA checkout)
  'amount', // gross price in EUR (a number from pricing.js, never typed by the visitor)
  'feature', // paywall feature id
  'topic', // grammar/lesson slug
  'run_id', // one lesson-player run (runState.js): joins start, stages and completion — random, never personal
  'signed_in', // boolean
  'entry_page', // first path of this page view
  'channel', // a SOCIAL_LINKS key: youtube | instagram | facebook
  'dm_source', 'dm_medium', 'dm_campaign', // first-touch attribution labels (public/attribution.js)
];

const MAX_LEN = 64;
// An email address, or anything with whitespace runs long enough to be prose.
const LOOKS_PERSONAL = /@|\s.*\s.*\s/;

/** Keep only allowed keys with short, non-personal scalar values. */
export function sanitizeProps(props) {
  const out = {};
  if (!props || typeof props !== 'object') return out;
  for (const key of ALLOWED_PROPS) {
    if (!(key in props)) continue;
    const v = props[key];
    if (typeof v === 'boolean') out[key] = v;
    else if (typeof v === 'number' && Number.isFinite(v)) out[key] = v;
    else if (typeof v === 'string' && v.length > 0 && v.length <= MAX_LEN && !LOOKS_PERSONAL.test(v)) out[key] = v;
  }
  return out;
}

export const isFunnelEvent = (name) => Object.prototype.hasOwnProperty.call(EVENTS, name);

/** The dedupe key for once-per-view events: one per event and surface/product. */
export const onceKey = (name, props = {}) => `${name}:${props.surface || ''}:${props.product || ''}`;
