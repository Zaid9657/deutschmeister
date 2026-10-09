// Trial lifecycle emails — the missing middle of the funnel.
//
// Until now the only emails a signed-up learner ever received were the welcome
// mail and the daily sentence. Nothing told them their trial was ending, and
// nothing brought them back after it lapsed: 1,450 signups produced 4 paying
// subscriptions. This sends three messages, once each, per user:
//
//   trial_day3   — day 3 of the trial: what you haven't tried yet
//   trial_day6   — the day before it ends: here's what you keep, or lose
//   trial_ended  — the day after: your progress is saved, one click restores it
//
// The two closing mails offer Pro AND, where one is buyable, the one-time
// course for the learner's level (see "the course offer" below). Every site
// link carries the lifecycle UTM tags (see "links" below).
//
// Safe to re-run: every send is recorded in `lifecycle_emails` with a
// UNIQUE(user_id, kind), and the insert happens BEFORE the send, so a crash
// mid-run can drop a message but can never duplicate one. Opted-out users
// (profiles.email_daily_sentence = false) are skipped entirely.
import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import {
  MONTHLY_PRICE_EUR,
  eur,
  ALL_LEVELS,
  SUBLEVEL_PRICES_EUR,
  SELLABLE_LEVELS,
  COURSE_PRO_MONTHS,
  productKeyForLevel,
} from './_shared/pricing.mjs';
import { BRAND } from './_shared/brand.mjs';
import { tagEmailLink } from './_shared/emailLinks.mjs';
import { socialFooterLine } from './_shared/socialLinks.mjs';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FROM_ADDRESS = 'Zaid from DeutschMeister <zaid@deutsch-meister.de>';
const BASE_URL = 'https://deutsch-meister.de';
const UNSUB_SECRET = process.env.UNSUB_SECRET || process.env.CAMPAIGN_SECRET;
const CAMPAIGN_SECRET = process.env.CAMPAIGN_SECRET;
const BATCH_SIZE = 100;

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Supabase init error:', e.message);
}

function unsubscribeUrl(userId) {
  const token = createHmac('sha256', UNSUB_SECRET).update(userId).digest('hex');
  return `${BASE_URL}/.netlify/functions/unsubscribe?uid=${userId}&token=${token}`;
}

// ─── links ───────────────────────────────────────────────────────────────────

// Every link into the site carries the lifecycle UTM tags, so a click reaches
// dm_attribution as source "email" instead of untracked or a webmail host
// (docs/tracking-links.md, "Our own email"). The campaign is the kind with
// hyphens (trial_day6 -> trial-day6); utm_content names the link: 'cta' (the
// Pro or X-Ray button), 'course' (the course button), 'all-courses' (the
// every-level link) and 'footer'. The unsubscribe link is built by
// unsubscribeUrl() above and is never tagged.
const siteLink = (path, kind, content) =>
  tagEmailLink(`${BASE_URL}${path}`, { medium: 'lifecycle', campaign: kind.replaceAll('_', '-'), content });

// ─── the course offer ────────────────────────────────────────────────────────
//
// Until 2026-09-27 both closing mails sold only Pro by the month, and 0 of the
// 180 trials that ended in the previous 30 days converted (docs/SCORECARD.md
// §3 #4). They now ALSO offer the one-time course for the learner's level.
//
// Which course: the learner's placement (profiles.current_level) when it is a
// priced sub-level. Otherwise (never placed, since the column's 'a1' default
// is a band and not a placement, or placed at the free level) it is the first
// paid level on the ladder, the step after the free course. It is offered only
// when it is buyable twice over:
//   1. it is in SELLABLE_LEVELS, so a coming-soon level is never offered, and a
//      learner placed at one gets no course block at all rather than a level
//      below their placement;
//   2. the webhook's variant env var for it is set in this (functions) scope,
//      so any purchase the mail leads to is one lemonsqueezy-webhook.mjs can
//      turn into an entitlement.
// Either missing → no course block, and the mail is the Pro-only mail it was.
//
// Buyers are not in the audience: a course purchase grants an included Pro
// window (is_subscribed = true), and selectRecipients() skips subscribed users.

const FREE_LEVELS = ALL_LEVELS.filter((l) => SUBLEVEL_PRICES_EUR[l] === undefined);
const FIRST_PAID_LEVEL = ALL_LEVELS.find((l) => SUBLEVEL_PRICES_EUR[l] !== undefined);
const FREE_CODE = FREE_LEVELS.map((l) => l.toUpperCase()).join('/');

/** profiles.current_level ('A2.1', 'a2.1', or the legacy default 'a1') → the placed sub-level, or null. */
export const placedSublevel = (currentLevel) => {
  const v = String(currentLevel || '').trim().toLowerCase();
  return ALL_LEVELS.includes(v) ? v : null;
};

/** The functions-scope env var lemonsqueezy-webhook.mjs maps to this level's product key. */
export const courseVariantEnv = (level) => `LEMONSQUEEZY_${productKeyForLevel(level).toUpperCase()}_VARIANT_ID`;

/** The sales page of a level course: an Astro route, so it ends in a slash. */
export const coursePath = (level) => `/courses/${level.replace('.', '-')}/`;

/**
 * The course to offer this learner, or null when none is buyable for them.
 * @param {string|null|undefined} currentLevel profiles.current_level
 * @param {Record<string, string|undefined>} [env] defaults to process.env
 */
export function courseOfferFor(currentLevel, env = process.env) {
  const placed = placedSublevel(currentLevel);
  const level = placed && SUBLEVEL_PRICES_EUR[placed] !== undefined ? placed : FIRST_PAID_LEVEL;
  if (!level || !SELLABLE_LEVELS.includes(level)) return null;
  if (!env?.[courseVariantEnv(level)]) return null;
  return {
    level,
    code: level.toUpperCase(),
    key: productKeyForLevel(level),
    price: SUBLEVEL_PRICES_EUR[level],
    placed: placed === level,
    path: coursePath(level),
  };
}

// ─── copy ────────────────────────────────────────────────────────────────────

const SHELL = ({ heading, body, footerHref, unsubUrl }) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${heading}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
          <td style="background:${BRAND.siegel};padding:32px;text-align:center;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,0.2);margin-bottom:12px;">
              <span style="color:#ffffff;font-size:28px;font-weight:700;font-family:Georgia,'Times New Roman',serif;">M</span>
            </div>
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">DeutschMeister</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px 28px;">
            ${body}
            <p style="margin:0;font-size:16px;color:#1e293b;line-height:1.6;">— Zaid</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
              DeutschMeister · <a href="${footerHref}" style="color:#94a3b8;">deutsch-meister.de</a>${socialFooterLine('#94a3b8')}<br>
              <a href="${unsubUrl}" style="color:#94a3b8;">Unsubscribe from these emails</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const P = (text) => `<p style="margin:0 0 16px;font-size:16px;color:#475569;line-height:1.6;">${text}</p>`;

/** A button. Solid for the main offer, outlined for the alternative; never a gradient. */
const BUTTON = (href, label, { outline = false } = {}) => `
            <table cellpadding="0" cellspacing="0" style="margin:8px 0 28px;">
              <tr>
                <td style="border-radius:10px;${outline ? `background:${BRAND.white};border:2px solid ${BRAND.siegel};` : `background:${BRAND.siegel};`}">
                  <a href="${href}" style="display:inline-block;padding:${outline ? '12px 26px' : '14px 28px'};color:${outline ? BRAND.siegel : BRAND.white};font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">${label}</a>
                </td>
              </tr>
            </table>`;

/** The one-time course alternative, or '' when no course is buyable for this learner. */
function courseBlock(kind, offer) {
  if (!offer) return '';
  const lead = offer.placed
    ? `Your placement test put you at ${offer.code}.`
    : `The ${FREE_CODE} course stays free, and the next step after it is ${offer.code}.`;
  const pro = kind === 'trial_ended'
    ? `and it brings Pro back for ${COURSE_PRO_MONTHS} months`
    : `and ${COURSE_PRO_MONTHS} months of Pro are included`;
  const everyLevel = offer.placed
    ? ''
    : P(`Not a beginner? <a href="${siteLink('/courses/', kind, 'all-courses')}" style="color:${BRAND.siegel};">See the course for every level</a>.`);
  return (
    P(`<strong style="color:#1e293b;">Rather pay once?</strong> ${lead} The ${offer.code} course is ${eur(offer.price)}, paid one time: lifetime access to the level, no subscription, ${pro}.`) +
    BUTTON(siteLink(offer.path, kind, 'course'), `See the ${offer.code} course →`, { outline: true }) +
    everyLevel
  );
}

// `offersCourse` marks the two closing mails; day 3 is about using the trial,
// not about paying, and stays offer-free.
const TEMPLATES = {
  trial_day3: {
    subject: 'Three things in your DeutschMeister trial worth 10 minutes',
    offersCourse: false,
    body: (kind) =>
      P('Hey! You\'re three days into your trial, so here\'s the short list of what\'s actually worth your time.') +
      P('<strong style="color:#1e293b;">Sentence X-Ray</strong> — paste any German sentence and see what every word is doing: the cases, the roles, and <em>why</em>. It takes about three seconds and it\'s the fastest way to stop guessing.') +
      P('<strong style="color:#1e293b;">Listening</strong> — short native-speaker dialogues graded to your level, so you understand most of what you hear instead of drowning in it.') +
      P('<strong style="color:#1e293b;">Speaking</strong> — a two-minute conversation with an AI partner that corrects you as you go.') +
      BUTTON(siteLink('/analyze/', kind, 'cta'), 'Analyze a sentence →'),
  },
  trial_day6: {
    subject: 'Your DeutschMeister trial ends tomorrow',
    offersCourse: true,
    body: (kind, offer) =>
      P('Quick heads-up: your Pro trial ends tomorrow.') +
      P(`If you keep it, you stay on 50 sentence analyses a day, the full grammar library through B2, listening, reading, and AI speaking practice. That's ${eur(MONTHLY_PRICE_EUR)} a month — less than one hour with a tutor.`) +
      BUTTON(siteLink('/pricing/', kind, 'cta'), `Keep Pro — ${eur(MONTHLY_PRICE_EUR)}/month →`) +
      courseBlock(kind, offer) +
      P(`If you ${offer ? 'pick neither' : 'don\'t'}, nothing dramatic happens: your account stays, your progress stays, and you drop to the free tier. You can come back whenever.`),
  },
  trial_ended: {
    subject: 'Your progress is saved',
    offersCourse: true,
    body: (kind, offer) =>
      P('Your trial ended yesterday — so this is the last you\'ll hear from me about it.') +
      P('Everything you did is still there: your topics, your streak, your history. Nothing was deleted, and one click puts it all back within reach.') +
      BUTTON(siteLink('/pricing/', kind, 'cta'), 'Restore Pro access →') +
      courseBlock(kind, offer) +
      P('And if the timing just isn\'t right, that\'s genuinely fine. The free tier and the daily sentence keep working, and German isn\'t going anywhere.'),
  },
};

/** Does this kind carry the course offer? */
export const offersCourse = (kind) => Boolean(TEMPLATES[kind]?.offersCourse);

/**
 * One rendered message (exported for tests/lifecycle-links.test.mjs and
 * tests/lifecycle.test.mjs). `offer` is courseOfferFor()'s result; it is
 * ignored for a kind that does not carry the course offer, and without one the
 * closing mails are the Pro-only mails.
 */
export function renderHtml(kind, userId, offer = null) {
  const tpl = TEMPLATES[kind];
  if (!tpl) throw new Error(`unknown trial-lifecycle kind: ${kind}`);
  return SHELL({
    heading: tpl.subject,
    body: tpl.body(kind, tpl.offersCourse ? offer : null),
    footerHref: siteLink('/', kind, 'footer'),
    unsubUrl: unsubscribeUrl(userId),
  });
}

// ─── selection ───────────────────────────────────────────────────────────────

export const TRIAL_KINDS = ['trial_day3', 'trial_day6', 'trial_ended'];

const DAY_MS = 24 * 60 * 60 * 1000;

// Each window is expressed directly as [lower, upper) offsets in days from the
// run, because the sign conventions are easy to get backwards: day 6 and the
// post-trial mail look FORWARD and BACKWARD from the run respectively.
export const TRIAL_WINDOWS = {
  // Day 3 of a 7-day trial: it started between 4 and 3 days ago.
  trial_day3: { col: 'trial_started_at', lowerDays: -4, upperDays: -3 },
  // The day before it ends: trial_ends_at falls within the next 24 hours.
  trial_day6: { col: 'trial_ends_at', lowerDays: 0, upperDays: 1 },
  // The day after it ended: trial_ends_at was 1-2 days ago.
  trial_ended: { col: 'trial_ends_at', lowerDays: -2, upperDays: -1 },
};

// Users whose trial day matches, who haven't already had this message, aren't
// paying, and haven't opted out.
//
// ONE definition of "who is due", read by this job and by the sentinel
// (sentinel.mjs asks it whether a quiet day was really quiet). The job passes
// nothing and gets today's run. The sentinel passes `span` = { first, last },
// the scheduled runs since the job's last ledger row: the window then covers
// every one of those runs ([first + lower, last + upper)), and a user counts
// only if their address was confirmed by the time their window opened — so
// nobody who became due (or confirmed) after a run is counted as missed; the
// next run mails them.
export async function selectRecipients(kind, { client = supabase, span = null } = {}) {
  const now = Date.now();
  const first = span ? span.first : now;
  const last = span ? span.last : now;
  const windows = TRIAL_WINDOWS[kind];

  const lower = new Date(first + windows.lowerDays * DAY_MS).toISOString();
  const upper = new Date(last + windows.upperDays * DAY_MS).toISOString();

  const { data: profiles, error } = await client
    .from('profiles')
    .select('id, email_daily_sentence, is_subscribed, trial_started_at, trial_ends_at, current_level')
    .gte(windows.col, lower)
    .lt(windows.col, upper);
  if (error) throw new Error(`profiles query failed: ${error.message}`);

  const candidates = (profiles || []).filter((p) => p.is_subscribed !== true && p.email_daily_sentence !== false);
  if (candidates.length === 0) return [];

  // A failed ledger read must stop the run: read as "nobody was mailed", it
  // would re-send to everyone already mailed (the claim upsert ignores
  // duplicates, the send does not).
  const ids = candidates.map((p) => p.id);
  const { data: already, error: ledgerError } = await client
    .from('lifecycle_emails')
    .select('user_id')
    .eq('kind', kind)
    .in('user_id', ids);
  if (ledgerError) throw new Error(`ledger read failed: ${ledgerError.message}`);
  const sentAlready = new Set((already || []).map((r) => r.user_id));

  // Resolve addresses, and only mail confirmed ones.
  const emails = new Map();
  const confirmedAt = new Map();
  let page = 1;
  while (true) {
    const { data, error: authError } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (authError) throw new Error(`listUsers: ${authError.message}`);
    for (const u of data.users) {
      if (u.email && u.email_confirmed_at) {
        emails.set(u.id, u.email.trim().toLowerCase());
        confirmedAt.set(u.id, Date.parse(u.email_confirmed_at));
      }
    }
    if (data.users.length < 1000) break;
    page++;
  }

  // Over a span, due at a run means confirmed at it: the run that selects a
  // user comes after their window opens (col − upper), so an address confirmed
  // by then was confirmed at that run. Without a span (the job) this is moot.
  const confirmedInTime = (p) => !span || confirmedAt.get(p.id) <= Date.parse(p[windows.col]) - windows.upperDays * DAY_MS;

  return candidates
    .filter((p) => !sentAlready.has(p.id) && emails.has(p.id) && confirmedInTime(p))
    .map((p) => ({ id: p.id, email: emails.get(p.id), currentLevel: p.current_level }));
}

async function sendBatch(resendKey, items) {
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  });
  if (!res.ok) throw new Error(`Resend batch ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

async function sendKind(resendKey, kind) {
  const recipients = await selectRecipients(kind);
  if (recipients.length === 0) return { kind, sent: 0, failed: 0, offered: {} };

  const tpl = TEMPLATES[kind];
  let sent = 0;
  let failed = 0;
  // Course offers actually mailed, by product key: how the owner reads what
  // the closing mails offered before any clicks or sales come in.
  const offered = {};

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const slice = recipients.slice(i, i + BATCH_SIZE);

    // Claim first: the unique key means a concurrent or repeated run can't
    // re-send, and a failure after this point costs at most a missed email.
    const { error: claimError } = await supabase
      .from('lifecycle_emails')
      .upsert(slice.map((r) => ({ user_id: r.id, kind })), { onConflict: 'user_id,kind', ignoreDuplicates: true });
    if (claimError) {
      console.error(`[trial-lifecycle] ${kind}: could not claim batch, skipping:`, claimError.message);
      failed += slice.length;
      continue;
    }

    const offers = slice.map((r) => (offersCourse(kind) ? courseOfferFor(r.currentLevel) : null));
    const items = slice.map((r, j) => ({
      from: FROM_ADDRESS,
      to: [r.email],
      reply_to: 'zaid@deutsch-meister.de',
      subject: tpl.subject,
      html: renderHtml(kind, r.id, offers[j]),
    }));

    try {
      await sendBatch(resendKey, items);
      sent += slice.length;
      for (const offer of offers) if (offer) offered[offer.key] = (offered[offer.key] || 0) + 1;
    } catch (err) {
      failed += slice.length;
      console.error(`[trial-lifecycle] ${kind} batch failed:`, err.message);
    }
  }

  return { kind, sent, failed, offered };
}

// ─── course-window expiry sweep ──────────────────────────────────────────────

// A course purchase grants an included Pro window as a subscriptions row with
// plan_type 'course' (see lemonsqueezy-webhook.mjs handleCourseOrder). Lemon
// Squeezy never emits a subscription_expired for it — one-time orders have no
// subscription — so this daily run sweeps the expired ones. A user who later
// bought a real subscription no longer has a 'course' row (subscription_created
// upserts over it on user_id), so the sweep can never touch a paying subscriber.
async function expireCourseWindows() {
  const nowIso = new Date().toISOString();
  const { data: expired, error } = await supabase
    .from('subscriptions')
    .update({ status: 'expired', updated_at: nowIso })
    .eq('plan_type', 'course')
    .eq('status', 'active')
    .lt('subscription_end', nowIso)
    .select('user_id');
  if (error) throw new Error(`course-window sweep failed: ${error.message}`);
  for (const row of expired || []) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_subscribed: false, subscription_tier: 'free', updated_at: nowIso })
      .eq('id', row.user_id);
    if (profileError) {
      console.error('[trial-lifecycle] course-window profile reset failed for', row.user_id, profileError.message);
    }
  }
  return { swept: expired?.length || 0 };
}

// ─── handler ─────────────────────────────────────────────────────────────────

const innerHandler = async (event) => {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { statusCode: 500, body: 'RESEND_API_KEY not set' };
  if (!supabaseKey) return { statusCode: 500, body: 'SUPABASE_SERVICE_ROLE_KEY not set' };
  if (!UNSUB_SECRET) return { statusCode: 500, body: 'UNSUB_SECRET / CAMPAIGN_SECRET not set' };

  // Same auth shape as daily-sentence: scheduler invocations carry next_run;
  // manual runs need the campaign secret. Never publicly triggerable.
  const qs = event.queryStringParameters || {};
  let bodyPayload = {};
  try { bodyPayload = JSON.parse(event.body || '{}'); } catch { /* ignore */ }
  const isScheduled = typeof bodyPayload.next_run === 'string';
  const secretOk = Boolean(CAMPAIGN_SECRET) && qs.secret === CAMPAIGN_SECRET;
  if (!isScheduled && !secretOk) {
    console.warn('[trial-lifecycle] rejected unauthenticated invocation');
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const results = [];
  for (const kind of TRIAL_KINDS) {
    try {
      results.push(await sendKind(resendKey, kind));
    } catch (err) {
      console.error(`[trial-lifecycle] ${kind} failed:`, err.message);
      results.push({ kind, sent: 0, failed: 0, error: err.message });
    }
  }

  let courseSweep = null;
  try {
    courseSweep = await expireCourseWindows();
  } catch (err) {
    console.error('[trial-lifecycle] course-window sweep failed:', err.message);
    courseSweep = { error: err.message };
  }

  console.log('[trial-lifecycle]', JSON.stringify({ results, courseSweep }));
  return { statusCode: 200, body: JSON.stringify({ results, courseSweep }) };
};

// 08:00 UTC — an hour after the daily sentence, so the two never collide.
export const handler = schedule('0 8 * * *', innerHandler);
