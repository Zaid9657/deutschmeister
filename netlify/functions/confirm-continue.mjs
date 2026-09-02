// confirm-continue — the CTA target of the confirmation nudge email
// (confirmation-nudge.mjs).
//
// WHY THIS EXISTS instead of embedding a Supabase link directly: a magic /
// confirmation link is minted with a short OTP expiry, and a nudge email is
// read hours or days after it lands — the observed failure mode is a learner
// clicking a stale link, seeing "expired", and giving up (the auth logs of
// 2026-09-02 show exactly that species of dead end). This endpoint moves the
// minting to CLICK TIME: verify our own signed token, generate a FRESH magic
// link via the admin API, and 302 the visitor into it. One click confirms the
// email AND signs them in, no matter when they open the mail.
//
// SECURITY SHAPE (the unsubscribe.mjs pattern, hardened with an expiry):
//   - The token is HMAC(secret, `confirm:${uid}:${exp}`) with exp baked into
//     the signed string, so the emailed URL is a bearer credential bounded to
//     TOKEN_TTL_DAYS — after that it verifies false and the visitor is sent
//     to /login instead. Possessing the email = possessing the login, which
//     is the ordinary trust model of every magic link / reset email.
//   - Identity comes ONLY from the verified token; nothing is read from the
//     body. Users who confirmed in the meantime are not re-linked — they get
//     a friendly redirect to /login (no session minting for accounts that
//     already have a working password path).
//   - Fails closed: without the secret nothing verifies.

import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SECRET = process.env.UNSUB_SECRET || process.env.CAMPAIGN_SECRET;
const BASE_URL = 'https://deutsch-meister.de';

export const TOKEN_TTL_DAYS = 14;

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Supabase init error:', e.message);
}

/** Shared with confirmation-nudge.mjs: the signed string covers uid AND exp. */
export function continueToken(secret, userId, expEpochSeconds) {
  return createHmac('sha256', secret).update(`confirm:${userId}:${expEpochSeconds}`).digest('hex');
}

function verify(userId, exp, token) {
  if (!SECRET || !userId || !exp || !token) return false;
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum * 1000 < Date.now()) return false;
  const expected = continueToken(SECRET, userId, expNum);
  try {
    return timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

const redirect = (to) => ({ statusCode: 302, headers: { Location: to, 'Cache-Control': 'no-store' }, body: '' });

export const handler = async (event) => {
  if (!supabase || !SECRET) return { statusCode: 500, body: 'Service not configured' };

  const qs = event.queryStringParameters || {};
  if (!verify(qs.uid, qs.exp, qs.token)) {
    // Expired or forged — no error page theatre, just the normal way in.
    return redirect(`${BASE_URL}/login`);
  }

  const { data, error } = await supabase.auth.admin.getUserById(qs.uid);
  if (error || !data?.user?.email) return redirect(`${BASE_URL}/login`);

  // Already confirmed (maybe via a parallel resend): the password path works,
  // use it — this endpoint only exists to rescue unconfirmed accounts.
  if (data.user.email_confirmed_at) return redirect(`${BASE_URL}/login`);

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: data.user.email,
    options: { redirectTo: `${BASE_URL}/dashboard` },
  });
  const actionLink = linkData?.properties?.action_link;
  if (linkError || !actionLink) {
    console.error('[confirm-continue] generateLink failed:', linkError?.message);
    return redirect(`${BASE_URL}/login`);
  }

  return redirect(actionLink);
};
