// The CORS preamble every browser-facing function used to carry its own copy of.
//
// Before this module, seven functions repeated the same twenty lines verbatim —
// the same origin allow-list, the same corsOrigin derivation, the same OPTIONS
// and 405 handling — so changing the allowed origins was a seven-file edit and
// a missed file was invisible until a browser hit it. Only ONE value ever
// differed between the copies: the webhook allows an X-Signature header instead
// of Authorization, because Lemon Squeezy signs rather than authenticates.

/**
 * The only origins allowed to call these endpoints from a browser.
 *
 * An unrecognised Origin is answered with the apex domain rather than echoed
 * back, so the browser's own CORS check rejects it. Echoing an arbitrary Origin
 * is what turns a CORS header into no protection at all.
 */
export const ALLOWED_ORIGINS = [
  'https://deutsch-meister.de',
  'https://www.deutsch-meister.de',
];

/**
 * CORS headers for this request.
 *
 * @param {object} event the Netlify function event
 * @param {object} [options]
 * @param {string} [options.allowHeaders] request headers the browser may send
 * @param {string} [options.methods] methods the browser may use
 */
export function corsHeaders(event, { allowHeaders = 'Content-Type, Authorization', methods = 'POST, OPTIONS' } = {}) {
  const origin = event.headers?.origin || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': allowHeaders,
    'Access-Control-Allow-Methods': methods,
  };
}

/**
 * Answer a preflight, and reject anything that is not the expected method.
 *
 * Returns a response to return immediately, or null to carry on with the
 * request. Callers read as:
 *
 *     const headers = corsHeaders(event);
 *     const gate = guardMethod(event, headers);
 *     if (gate) return gate;
 *
 * The 405 body is JSON on every endpoint. It used to be a bare string on some
 * of them, which made `res.json()` throw in the browser instead of surfacing
 * the status — a 405 is a programming error and should read as one.
 *
 * @param {object} event the Netlify function event
 * @param {object} headers the headers from corsHeaders()
 * @param {string} [method] the single method this endpoint accepts
 */
export function guardMethod(event, headers, method = 'POST') {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== method) {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  return null;
}
