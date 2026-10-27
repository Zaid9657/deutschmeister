// The unsubscribe link every customer mailer carries, and the two headers that
// let a mail client show it as a button.
//
// ONE builder for the signed link. Until 2026-10-25 five mailers carried their
// own copy of unsubscribeUrl() (daily-sentence, send-campaign, trial-lifecycle,
// activation-lifecycle, course-reminder), and send-campaign's pointed at the
// /unsubscribe rewrite instead of the function. send-daily-test.mjs keeps its
// own copy: it mails only the owner and is not a customer mailer.
//
// The token is HMAC-SHA256(user id) under UNSUB_SECRET, with CAMPAIGN_SECRET as
// the stand-in the mailers have always accepted. There is no default: without
// a secret the builder throws, and every mailer refuses to run before it gets
// here (secrets fail closed, CLAUDE.md).
//
// Why the headers (RFC 2369 List-Unsubscribe + RFC 8058 List-Unsubscribe-Post):
// Gmail reads about 93% of the list (1,043 of 1,119 daily recipients,
// 2026-10-25) and shows its Unsubscribe button only when the header is present.
// Resend adds neither header to API sends. Without them "Report spam" is the one
// click out, and spam reports count against deutsch-meister.de, the domain that
// also sends the dunning and confirmation mail. The header carries the same
// signed function URL as the link in the body: a one-click POST to it
// unsubscribes (unsubscribe.mjs); a GET only asks. tests/unsubscribe-headers.test.mjs
// holds every customer mailer to both headers.
import { createHmac, timingSafeEqual } from 'node:crypto';

const BASE_URL = 'https://deutsch-meister.de';

/** The function itself, not the /unsubscribe rewrite: a one-click POST must reach it directly. */
export const UNSUBSCRIBE_PATH = '/.netlify/functions/unsubscribe';

/** The signing secret, or null. Never a default value. */
export const unsubscribeSecret = (env = process.env) => env.UNSUB_SECRET || env.CAMPAIGN_SECRET || null;

/** HMAC token for one user. Throws without a secret, so nothing is ever signed with a guess. */
export function unsubscribeToken(userId, secret = unsubscribeSecret()) {
  if (!secret) throw new Error('UNSUB_SECRET / CAMPAIGN_SECRET not set');
  return createHmac('sha256', secret).update(String(userId)).digest('hex');
}

/** Constant-time check of a token from a link. False for anything missing or malformed. */
export function verifyUnsubscribeToken(userId, token, secret = unsubscribeSecret()) {
  if (!secret || !userId || !token) return false;
  const expected = createHmac('sha256', secret).update(String(userId)).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(String(token), 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

/**
 * The signed link for one user. `lang: 'de'` asks the page to answer in German
 * (the course reminder is a German mail). The link is never UTM-tagged: it is a
 * function URL carrying a token, not a page (docs/tracking-links.md).
 */
export function unsubscribeUrl(userId, { lang = null } = {}) {
  const url = `${BASE_URL}${UNSUBSCRIBE_PATH}?uid=${userId}&token=${unsubscribeToken(userId)}`;
  return lang === 'de' ? `${url}&lang=de` : url;
}

/** The two headers for a Resend item's `headers` field, pointing at the same URL as the body link. */
export const unsubscribeHeaders = (url) => ({
  'List-Unsubscribe': `<${url}>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
});
