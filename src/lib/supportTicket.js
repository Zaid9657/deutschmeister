// The learner → support-ticket-create contract, in one pure module.
//
// The form (src/components/SupportRequestForm.jsx) builds every request from
// here, and tests/support.test.mjs feeds the same payload through the real
// Netlify handler — so the two sides cannot drift apart without a red test.
// Identity is NOT part of the payload: the function takes the user from the
// verified JWT (Authorization header), never from the body.

export const SUPPORT_ENDPOINT = '/.netlify/functions/support-ticket-create';

/** Ids must equal CATEGORIES in netlify/functions/_shared/adminSupportLib.mjs (the DB CHECK). */
export const SUPPORT_CATEGORIES = [
  ['technical', 'Technisches Problem'],
  ['payment', 'Zahlung / Abo'],
  ['content', 'Inhalt / Fehler in einer Lektion'],
  ['account', 'Konto'],
  ['suggestion', 'Vorschlag'],
  ['other', 'Sonstiges'],
];

/** The function's own validation thresholds (400 below them). */
export const SUBJECT_MIN = 3;
export const SUBJECT_MAX = 200;
export const BODY_MIN = 10;
export const BODY_MAX = 5000;

/** `?topic=` on /support preselects a category; anything unknown falls back to technical. */
export function categoryForTopic(topic) {
  return SUPPORT_CATEGORIES.some(([id]) => id === topic) ? topic : 'technical';
}

/** The body of a new-ticket POST — exactly the fields the handler reads. */
export function ticketPayload({ subject, category, body }) {
  return { subject, category, body };
}
