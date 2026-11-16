// Confirmation nudge — the third lifecycle job, aimed at the funnel's very
// first cliff: accounts that signed up and never confirmed their email.
//
// Measured 2026-09-02: 496 of 1,551 signups have no email_confirmed_at.
// They cannot log in, no lifecycle mailer may address them (trial and
// activation mail confirmed users only, on purpose), and the auth logs show
// real users hitting the "Email not confirmed" login wall repeatedly and
// leaving. This job mails each unconfirmed account exactly ONCE, ever, with
// a link that finishes the signup in one click — the link goes through
// confirm-continue.mjs, which mints a fresh magic link at click time, so the
// email never carries an expirable link.
//
// AUDIENCE DISCIPLINE (the mirror image of the other two jobs, pinned by
// tests/lifecycle.test.mjs): this job mails ONLY unconfirmed accounts; the
// trial and activation jobs mail ONLY confirmed ones. The audiences are
// disjoint by construction, so no window arithmetic is needed between them.
//
//   - Cohort: email-provider signups aged 1 hour to 90 days. Over 90 days the
//     address is stale and mailing it is a deliverability risk, not a courtesy.
//     The floor was 2 days until 2026-11-15 (plan "Stop the leaks", step 2):
//     25–29% of signups never confirm, and two days is long after the moment
//     they wanted in. An hour leaves the normal confirmation mail time to land
//     first. The job runs hourly since then, so the nudge comes 1–2 hours after
//     signup instead of at the next 10:30.
//   - Hygiene: disposable domains excluded (shared list), opted-out profiles
//     excluded, ledger kind 'confirm_nudge' claims BEFORE send
//     (UNIQUE(user_id, kind) — one nudge per account, ever).
//   - Pacing: at most PER_RUN sends per run.
//
// WELCOME AFTER CONFIRMATION (2026-11-15). The same hourly run sends the
// welcome mail to addresses confirmed in the last WELCOME_WINDOW_HOURS that
// have not had it (send-welcome-email.mjs now skips unconfirmed signups, which
// it used to mail at account creation, racing the confirmation mail). It claims
// the 'welcome' kind before sending, as the webhook path does, so one account
// gets one welcome. It is not behind CONFIRM_NUDGE_ENABLED: it replaces a mail
// that always went out. Until migrations/2026-11-15-welcome-after-confirmation.sql
// admits the kind, its claim fails and it sends nothing.
//
// SHIPS OFF, twice over (the activation-lifecycle pattern):
//   1. CONFIRM_NUDGE_ENABLED must be exactly 'true' or the run no-ops.
//   2. Until migrations/2026-09-02-confirmation-nudge.sql is applied, the
//      ledger CHECK rejects the kind — failed claim, no send.
// Canary: LIFECYCLE_TEST_RECIPIENTS restricts to listed addresses, others
// left unclaimed. Dry run: ?dry=1 with the campaign secret reports counts.

import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { BRAND, emailHeader, ctaCell } from './_shared/brand.mjs';
import { isBlockedEmail } from './_shared/emailHygiene.mjs';
import { fetchOptedOutIds } from './_shared/emailOptOut.mjs';
import { continueToken, TOKEN_TTL_DAYS } from './confirm-continue.mjs';
import { tagEmailLink } from './_shared/emailLinks.mjs';
import { welcomeItem, WELCOME_KIND } from './send-welcome-email.mjs';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FROM_ADDRESS = 'Zaid from DeutschMeister <zaid@deutsch-meister.de>';
const BASE_URL = 'https://deutsch-meister.de';
const SECRET = process.env.UNSUB_SECRET || process.env.CAMPAIGN_SECRET;
const CAMPAIGN_SECRET = process.env.CAMPAIGN_SECRET;

export const MIN_AGE_HOURS = 1;
export const MAX_AGE_DAYS = 90;
export const PER_RUN = 40;

/** How long after confirmation the welcome may still go out. */
export const WELCOME_WINDOW_HOURS = 72;
/**
 * Accounts created before this were welcomed at creation by the old webhook
 * path, confirmed or not, so the sweep never mails them a second welcome.
 */
export const WELCOME_SINCE = '2026-11-16T00:00:00.000Z';
export const WELCOME_PER_RUN = 100;

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Supabase init error:', e.message);
}

// ─── copy ────────────────────────────────────────────────────────────────────
// One email, English (product language), Zaid voice. The reader signed up and
// stalled at the very first step — the message assumes nothing beyond that,
// promises nothing (no counts, no prices), and says truthfully that this is
// the only reminder (the ledger makes that a fact, not a courtesy phrase).

const SUBJECT = 'Your DeutschMeister account is one click from ready';

const P = (text) => `<p style="margin:0 0 16px;font-size:16px;color:${BRAND.graphite};line-height:1.6;">${text}</p>`;

// Only the footer is a site link, so only the footer is tagged
// (docs/tracking-links.md). The button is a function URL carrying a signed,
// expiring token: it is not a page and is never tagged.
export const FOOTER_HREF = tagEmailLink(`${BASE_URL}/`, { medium: 'lifecycle', campaign: 'confirm-nudge', content: 'footer' });

export const bodyHtml = (continueUrl) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${SUBJECT}</title></head>
<body style="margin:0;padding:0;background:${BRAND.paper};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${BRAND.white};border-radius:16px;overflow:hidden;border:1px solid ${BRAND.rule};">
        <tr>${emailHeader()}</tr>
        <tr>
          <td style="padding:36px 32px 28px;">
            ${P('You created a DeutschMeister account a while ago, and the last step — confirming your email — never happened. Until it does, the login page will keep turning you away, which is a frustrating way to not learn German.')}
            ${P(`The button below finishes it: one click confirms your address and signs you straight in. No password hunt, no digging for an old email.`)}
            <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
              <tr>${ctaCell(continueUrl, 'Activate my account →')}</tr>
            </table>
            ${P(`If you didn't sign up, or you've changed your mind — just ignore this. It's the only reminder we'll send, and the account stays inactive.`)}
            <p style="margin:0;font-size:16px;color:${BRAND.ink};line-height:1.6;">— Zaid</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid ${BRAND.rule};text-align:center;">
            <p style="margin:0;font-size:12px;color:${BRAND.graphite};line-height:1.6;">
              DeutschMeister · <a href="${FOOTER_HREF}" style="color:${BRAND.graphite};">deutsch-meister.de</a><br>
              You're receiving this once because this address was used to sign up at deutsch-meister.de.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── selection ───────────────────────────────────────────────────────────────

// Unconfirmed, email-provider, aged [MIN_AGE_HOURS, MAX_AGE_DAYS), address not
// disposable, profile not opted out, never claimed. Oldest first, so a
// backlog drains from the stale end toward fresh signups.
//
// ONE definition of "who is due", read by this job and by the sentinel. The
// job passes nothing: this run, at most PER_RUN. The sentinel passes
// `span` = { first, last }, the scheduled runs since the last confirm_nudge
// row, and `limit: Infinity`: the age window then covers all of those runs
// (created in [first - MAX_AGE_DAYS, last - MIN_AGE_HOURS)), so an account that
// turned an hour old after the last run — the next run's work — is not
// counted as missed.
//
// `canary` (the handler's LIFECYCLE_TEST_RECIPIENTS set) narrows the cohort
// BEFORE the PER_RUN cut. Until 2026-10-25 the handler filtered after it, so
// while a backlog existed the same 40 oldest non-canary accounts filled every
// run and a fresh test account behind them could never be sent (review X-030).
export async function selectCandidates(client = supabase, { span = null, limit = PER_RUN, canary = null } = {}) {
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const newest = new Date((span ? span.last : now) - MIN_AGE_HOURS * 60 * 60 * 1000).toISOString();
  const oldest = new Date((span ? span.first : now) - MAX_AGE_DAYS * day).toISOString();

  const unconfirmed = [];
  let page = 1;
  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    for (const u of data.users) {
      if (
        u.email &&
        !u.email_confirmed_at &&
        (u.app_metadata?.provider === 'email') &&
        u.created_at >= oldest &&
        u.created_at < newest &&
        !isBlockedEmail(u.email)
      ) {
        const email = u.email.trim().toLowerCase();
        if (canary && canary.size > 0 && !canary.has(email)) continue;
        unconfirmed.push({ id: u.id, email, createdAt: u.created_at });
      }
    }
    if (data.users.length < 1000) break;
    page++;
  }
  if (unconfirmed.length === 0) return [];

  const ids = unconfirmed.map((r) => r.id);

  // Opt-out lives as profiles.email_daily_sentence = false — the same
  // definition lifecycle_customer_state uses (the view itself can't serve
  // here: it deliberately covers confirmed funnel states, not this cohort).
  // Read through the shared reader, which throws on error: this read used to
  // ignore its error and filter the cohort by an id list in the URL, the shape
  // that stopped the daily sentence honouring unsubscribes (2026-09-28).
  // A failed ledger read must stop the run: read as "nobody was nudged", it
  // would nudge again the accounts the ledger promises one mail, ever.
  const [{ data: already, error: ledgerError }, out] = await Promise.all([
    client.from('lifecycle_emails').select('user_id').eq('kind', 'confirm_nudge').in('user_id', ids),
    fetchOptedOutIds(client),
  ]);
  if (ledgerError) throw new Error(`ledger read failed: ${ledgerError.message}`);
  const claimed = new Set((already || []).map((r) => r.user_id));

  return unconfirmed
    .filter((r) => !claimed.has(r.id) && !out.has(r.id))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, limit);
}

// ─── welcome after confirmation ──────────────────────────────────────────────

// Confirmed in the last WELCOME_WINDOW_HOURS, created on or after WELCOME_SINCE,
// address not disposable, profile not opted out, no 'welcome' row. Any provider:
// a Google sign-up is welcomed by the webhook at creation and its claim makes it
// "already welcomed" here. Earliest confirmation first, at most `limit`.
export async function selectWelcomeRecipients(client = supabase, { now = Date.now(), limit = WELCOME_PER_RUN } = {}) {
  const confirmedSince = now - WELCOME_WINDOW_HOURS * 60 * 60 * 1000;
  const createdSince = Date.parse(WELCOME_SINCE);
  const confirmed = [];
  let page = 1;
  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    for (const u of data.users) {
      const at = Date.parse(u.email_confirmed_at);
      if (u.email && u.email_confirmed_at && at >= confirmedSince && at <= now && Date.parse(u.created_at) >= createdSince && !isBlockedEmail(u.email)) {
        confirmed.push({ id: u.id, email: u.email.trim().toLowerCase(), confirmedAt: u.email_confirmed_at });
      }
    }
    if (data.users.length < 1000) break;
    page++;
  }
  if (confirmed.length === 0) return [];

  // A failed ledger read stops the run: read as "nobody welcomed", it would
  // welcome again everyone the webhook already welcomed.
  const [{ data: already, error: ledgerError }, out] = await Promise.all([
    client.from('lifecycle_emails').select('user_id').eq('kind', WELCOME_KIND).in('user_id', confirmed.map((r) => r.id)),
    fetchOptedOutIds(client),
  ]);
  if (ledgerError) throw new Error(`welcome ledger read failed: ${ledgerError.message}`);
  const welcomed = new Set((already || []).map((r) => r.user_id));
  return confirmed
    .filter((r) => !welcomed.has(r.id) && !out.has(r.id))
    .sort((a, b) => a.confirmedAt.localeCompare(b.confirmedAt))
    .slice(0, limit);
}

/** Claim, then send, the welcomes due this run. A failed claim (migration unapplied) sends nothing. */
async function sendWelcomes(resendKey, { dry = false } = {}) {
  const recipients = await selectWelcomeRecipients(supabase);
  if (dry) return { dry: true, wouldSend: recipients.length };
  if (recipients.length === 0) return { sent: 0, failed: 0 };

  const { data: claims, error: claimError } = await supabase
    .from('lifecycle_emails')
    .upsert(recipients.map((r) => ({ user_id: r.id, kind: WELCOME_KIND })), { onConflict: 'user_id,kind', ignoreDuplicates: true })
    .select('user_id');
  if (claimError) {
    console.error('[confirmation-nudge] welcome claim failed (2026-11-15 migration applied?):', claimError.message);
    return { sent: 0, failed: 0, error: `claim failed: ${claimError.message}` };
  }
  const claimedIds = new Set((claims || []).map((r) => r.user_id));
  const claimed = recipients.filter((r) => claimedIds.has(r.id));
  if (claimed.length === 0) return { sent: 0, failed: 0 };

  try {
    await sendBatch(resendKey, claimed.map((r) => welcomeItem(r.email)));
    return { sent: claimed.length, failed: 0 };
  } catch (err) {
    console.error('[confirmation-nudge] welcome batch failed:', err.message);
    return { sent: 0, failed: claimed.length };
  }
}

function continueUrl(userId) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_DAYS * 24 * 60 * 60;
  const token = continueToken(SECRET, userId, exp);
  return `${BASE_URL}/.netlify/functions/confirm-continue?uid=${userId}&exp=${exp}&token=${token}`;
}

async function sendBatch(resendKey, items) {
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  });
  if (!res.ok) throw new Error(`Resend batch ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

// ─── handler ─────────────────────────────────────────────────────────────────

const innerHandler = async (event) => {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { statusCode: 500, body: 'RESEND_API_KEY not set' };
  if (!supabaseKey) return { statusCode: 500, body: 'SUPABASE_SERVICE_ROLE_KEY not set' };

  const qs = event.queryStringParameters || {};
  let bodyPayload = {};
  try { bodyPayload = JSON.parse(event.body || '{}'); } catch { /* ignore */ }
  const isScheduled = typeof bodyPayload.next_run === 'string';
  const secretOk = Boolean(CAMPAIGN_SECRET) && qs.secret === CAMPAIGN_SECRET;
  if (!isScheduled && !secretOk) {
    console.warn('[confirmation-nudge] rejected unauthenticated invocation');
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const dry = qs.dry === '1';

  // The welcome first, whatever the nudge's switch says (see the note at the top).
  let welcome;
  try {
    welcome = await sendWelcomes(resendKey, { dry });
  } catch (err) {
    console.error('[confirmation-nudge] welcome failed:', err.message);
    welcome = { sent: 0, failed: 0, error: err.message };
  }

  if (process.env.CONFIRM_NUDGE_ENABLED !== 'true') {
    console.log('[confirmation-nudge] CONFIRM_NUDGE_ENABLED is not "true" — no nudge.');
    return { statusCode: 200, body: JSON.stringify({ enabled: false, sent: 0, welcome }) };
  }
  if (!SECRET) return { statusCode: 500, body: 'UNSUB_SECRET / CAMPAIGN_SECRET not set' };

  const canary = new Set(
    (process.env.LIFECYCLE_TEST_RECIPIENTS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  if (canary.size > 0) console.log(`[confirmation-nudge] canary mode: ${canary.size} allowlisted address(es)`);

  // The allowlist goes INTO the selection, ahead of the per-run cap; the
  // accounts it leaves out stay unclaimed, so emptying it resumes them.
  const recipients = await selectCandidates(supabase, { canary });

  if (dry) {
    const result = { enabled: true, dry: true, wouldSend: recipients.length, welcome };
    console.log('[confirmation-nudge]', JSON.stringify(result));
    return { statusCode: 200, body: JSON.stringify(result) };
  }
  if (recipients.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ enabled: true, sent: 0, failed: 0, welcome }) };
  }

  // Claim BEFORE send: UNIQUE(user_id, kind) makes re-runs and crashes safe —
  // the worst outcome after this line is a missed email, never a double one.
  const { data: claims, error: claimError } = await supabase
    .from('lifecycle_emails')
    .upsert(recipients.map((r) => ({ user_id: r.id, kind: 'confirm_nudge' })), {
      onConflict: 'user_id,kind',
      ignoreDuplicates: true,
    })
    .select('user_id');
  if (claimError) {
    console.error('[confirmation-nudge] claim failed (migration applied?):', claimError.message);
    return { statusCode: 500, body: JSON.stringify({ error: `claim failed: ${claimError.message}`, welcome }) };
  }

  const claimedIds = new Set((claims || []).map((r) => r.user_id));
  const claimed = recipients.filter((r) => claimedIds.has(r.id));
  if (claimed.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ enabled: true, dry: false, sent: 0, failed: 0, welcome }) };
  }

  const items = claimed.map((r) => ({
    from: FROM_ADDRESS,
    to: [r.email],
    reply_to: 'zaid@deutsch-meister.de',
    subject: SUBJECT,
    html: bodyHtml(continueUrl(r.id)),
  }));

  let sent = 0;
  let failed = 0;
  try {
    await sendBatch(resendKey, items);
    sent = items.length;
  } catch (err) {
    failed = items.length;
    console.error('[confirmation-nudge] batch failed:', err.message);
  }

  const result = { enabled: true, dry: false, sent, failed, welcome };
  console.log('[confirmation-nudge]', JSON.stringify(result));
  return { statusCode: 200, body: JSON.stringify(result) };
};

// Hourly at :20 since 2026-11-15 (it ran daily at 10:30): the nudge comes an
// hour or two after signup, the welcome within the hour after confirmation.
// The nudge's audience (unconfirmed) is disjoint from the trial and activation
// mails' (confirmed) whatever the hour.
export const handler = schedule('20 * * * *', innerHandler);
