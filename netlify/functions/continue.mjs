// continue — the button of the lifecycle mails that bring a learner back to
// their own next step (trial day 3, trial ended, activation day 4). One click
// signs a confirmed learner in and opens that step.
//
// WHY (2026-11-15, plan "Stop the leaks", step 2): 236 lifecycle mails in 30
// days were followed by 17 sign-ins. The one mail people came back from, the
// course reminder (8 of 34), is the one that links to the learner's own next
// Lektion; no mail signed anyone in. The founder approved, as part of the plan,
// a signed sign-in link inside our own mails, valid 7 days.
//
// HOW: the sibling of confirm-continue.mjs, which already moves the minting of
// a Supabase magic link to CLICK TIME so a mail read days later never carries a
// stale link. This one does the same for confirmed learners and lands them on
// /login?next=<step>: supabase-js reads the session out of the link's hash
// there, and LoginPage sends a signed-in visitor on to `next` (src/lib/
// loginReturn.js nextPath honours /course/ pages only). /login is the redirect
// every auth mail already uses, and it handles an expired or used link with its
// own rescue.
//
// SECURITY SHAPE (confirm-continue's pattern, with the destination signed too):
//   - token = HMAC(secret, `continue:${uid}:${dest}:${exp}`). The purpose
//     prefix keeps it from ever verifying as a confirm (`confirm:uid:exp`) or
//     an unsubscribe (HMAC of the bare id) token, and neither of those verifies
//     here. exp is inside the signed string AND checked against the clock: the
//     emailed URL is a bearer credential for CONTINUE_TTL_DAYS, the ordinary
//     trust model of a magic link.
//   - dest is one of the course's own pages (isContinuePath, built from the
//     course tables in course-reminder.mjs), checked when a link is built and
//     again when it is clicked. Never an open redirect: no host, no query, no
//     path outside the allow-list.
//   - Identity comes ONLY from the verified token.
//   - Fails closed: without UNSUB_SECRET / CAMPAIGN_SECRET nothing is signed
//     (continueUrl throws) and nothing verifies (the handler answers 500).
//   - A failed check never mints anything: the visitor gets the plain /login
//     page (with ?next= when the destination is a safe page), the normal way in.
//   - HEAD (link checkers) mints nothing.
//
// UTM: the mail's tags sit on the function URL (tagEmailLink, so the mail's
// links all read the same way) and are forwarded onto the /login landing,
// where public/attribution.js reads them. Only valid labels with
// utm_source=email are forwarded; the token never reaches the landing URL.

import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { EMAIL_LABEL, tagEmailLink } from './_shared/emailLinks.mjs';
import { LEKTION_TITLES, CHECKPOINT_AFTER } from './course-reminder.mjs';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = 'https://deutsch-meister.de';

/** How long an emailed continue link signs its reader in (founder-approved: 7 days). */
export const CONTINUE_TTL_DAYS = 7;
export const CONTINUE_FUNCTION_PATH = '/.netlify/functions/continue';

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Supabase init error:', e.message);
}

/** The signing secret, read at call time, or null. Never a default value. */
export const continueSecret = (env = process.env) => env.UNSUB_SECRET || env.CAMPAIGN_SECRET || null;

/**
 * A page a continue link may open: the course home of a live level, one of its
 * Lektionen, or one of its checkpoints, written exactly the way the SPA routes
 * them (no trailing slash, no query, no fragment).
 */
export function isContinuePath(path) {
  if (typeof path !== 'string') return false;
  const m = /^\/course\/([a-z][0-9]\.[0-9])(?:\/(l|checkpoint)\/([1-9][0-9]?))?$/.exec(path);
  if (!m || !Object.prototype.hasOwnProperty.call(LEKTION_TITLES, m[1])) return false;
  if (!m[2]) return true;
  const nr = Number(m[3]);
  return m[2] === 'l' ? nr <= LEKTION_TITLES[m[1]].length : (CHECKPOINT_AFTER[m[1]] || []).some((c) => c.nr === nr);
}

/** HMAC over purpose, id, destination and expiry. */
export function continueToken(secret, userId, dest, expEpochSeconds) {
  return createHmac('sha256', secret).update(`continue:${userId}:${dest}:${expEpochSeconds}`).digest('hex');
}

/** Constant-time check of a clicked link. False for anything missing, malformed, unsafe or expired. */
export function verifyContinue({ uid, dest, exp, token } = {}, { secret = continueSecret(), now = Date.now() } = {}) {
  if (!secret || !uid || !exp || !token || !isContinuePath(dest)) return false;
  const expNum = Number(exp);
  if (!Number.isInteger(expNum) || expNum * 1000 < now) return false;
  const expected = continueToken(secret, uid, dest, expNum);
  try {
    return timingSafeEqual(Buffer.from(String(token), 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

/**
 * The signed link for one learner and one destination, with the mail's UTM
 * tags. Throws without a secret or for a destination outside the allow-list,
 * so a mail can never carry an unsigned or open link.
 */
export function continueUrl(userId, dest, tags = null, { secret = continueSecret(), now = Date.now() } = {}) {
  if (!secret) throw new Error('UNSUB_SECRET / CAMPAIGN_SECRET not set');
  if (!userId) throw new Error('continue link needs a user id');
  if (!isContinuePath(dest)) throw new Error(`not a continue destination: ${dest}`);
  const exp = Math.floor(now / 1000) + CONTINUE_TTL_DAYS * 24 * 60 * 60;
  const url = new URL(`${BASE_URL}${CONTINUE_FUNCTION_PATH}`);
  url.searchParams.set('uid', userId);
  url.searchParams.set('dest', dest);
  url.searchParams.set('exp', String(exp));
  url.searchParams.set('token', continueToken(secret, userId, dest, exp));
  return tags ? tagEmailLink(url.href, tags) : url.href;
}

/**
 * Where the visitor lands: /login, with ?next= when `dest` is a continue
 * page, and the mail's tags when they are valid email labels.
 */
export function loginLanding(dest, query = {}) {
  const url = new URL(`${BASE_URL}/login`);
  if (isContinuePath(dest)) url.searchParams.set('next', dest);
  const tags = { medium: query.utm_medium, campaign: query.utm_campaign, content: query.utm_content };
  const valid = query.utm_source === 'email' && Object.values(tags).every((v) => typeof v === 'string' && EMAIL_LABEL.test(v));
  return valid ? tagEmailLink(url.href, tags) : url.href;
}

const NO_STORE = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex' };
const redirect = (to) => ({ statusCode: 302, headers: { Location: to, ...NO_STORE }, body: '' });

/** The handler with its dependencies injectable (tests/continue-link.test.mjs). */
export async function continueHandler(event, { client = supabase, secret = continueSecret(), now = Date.now() } = {}) {
  if (!client || !secret) return { statusCode: 500, headers: NO_STORE, body: 'Service not configured' };

  const method = event?.httpMethod || 'GET';
  if (method === 'HEAD') return { statusCode: 204, headers: NO_STORE, body: '' };
  if (method !== 'GET') return { statusCode: 405, headers: { ...NO_STORE, Allow: 'GET, HEAD' }, body: '' };

  const qs = event?.queryStringParameters || {};
  const landing = loginLanding(qs.dest, qs);

  // Expired, forged or unsafe: no error page theatre, just the normal way in.
  if (!verifyContinue(qs, { secret, now })) return redirect(landing);

  const { data, error } = await client.auth.admin.getUserById(qs.uid);
  const user = data?.user;
  if (error || !user?.email) return redirect(landing);
  if (user.banned_until && Date.parse(user.banned_until) > now) return redirect(landing);

  const { data: linkData, error: linkError } = await client.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email,
    options: { redirectTo: landing },
  });
  const actionLink = linkData?.properties?.action_link;
  if (linkError || !actionLink) {
    console.error('[continue] generateLink failed:', linkError?.message);
    return redirect(landing);
  }
  return redirect(actionLink);
}

export const handler = (event) => continueHandler(event);
