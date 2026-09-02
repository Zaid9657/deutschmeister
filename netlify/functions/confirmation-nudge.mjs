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
//   - Cohort: email-provider signups aged 2–90 days. Under 2 days the normal
//     confirmation email is still fresh; over 90 the address is stale and
//     mailing it is a deliverability risk, not a courtesy.
//   - Hygiene: disposable domains excluded (shared list), opted-out profiles
//     excluded, ledger kind 'confirm_nudge' claims BEFORE send
//     (UNIQUE(user_id, kind) — one nudge per account, ever).
//   - Pacing: at most PER_RUN sends per daily run, so the ~230-account
//     backlog drains over about a week instead of spiking the send domain.
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
import { continueToken, TOKEN_TTL_DAYS } from './confirm-continue.mjs';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FROM_ADDRESS = 'Zaid from DeutschMeister <zaid@deutsch-meister.de>';
const BASE_URL = 'https://deutsch-meister.de';
const SECRET = process.env.UNSUB_SECRET || process.env.CAMPAIGN_SECRET;
const CAMPAIGN_SECRET = process.env.CAMPAIGN_SECRET;

export const MIN_AGE_DAYS = 2;
export const MAX_AGE_DAYS = 90;
export const PER_RUN = 40;

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
              DeutschMeister · <a href="${BASE_URL}" style="color:${BRAND.graphite};">deutsch-meister.de</a><br>
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

// Unconfirmed, email-provider, aged [MIN_AGE_DAYS, MAX_AGE_DAYS), address not
// disposable, profile not opted out, never claimed. Oldest first, so the
// backlog drains from the stale end toward fresh signups.
async function selectCandidates() {
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const newest = new Date(now - MIN_AGE_DAYS * day).toISOString();
  const oldest = new Date(now - MAX_AGE_DAYS * day).toISOString();

  const unconfirmed = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
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
        unconfirmed.push({ id: u.id, email: u.email.trim().toLowerCase(), createdAt: u.created_at });
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
  const [{ data: already }, { data: optedOut }] = await Promise.all([
    supabase.from('lifecycle_emails').select('user_id').eq('kind', 'confirm_nudge').in('user_id', ids),
    supabase.from('profiles').select('id').eq('email_daily_sentence', false).in('id', ids),
  ]);
  const claimed = new Set((already || []).map((r) => r.user_id));
  const out = new Set((optedOut || []).map((r) => r.id));

  return unconfirmed
    .filter((r) => !claimed.has(r.id) && !out.has(r.id))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, PER_RUN);
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
  if (process.env.CONFIRM_NUDGE_ENABLED !== 'true') {
    console.log('[confirmation-nudge] CONFIRM_NUDGE_ENABLED is not "true" — doing nothing.');
    return { statusCode: 200, body: JSON.stringify({ enabled: false, sent: 0 }) };
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { statusCode: 500, body: 'RESEND_API_KEY not set' };
  if (!supabaseKey) return { statusCode: 500, body: 'SUPABASE_SERVICE_ROLE_KEY not set' };
  if (!SECRET) return { statusCode: 500, body: 'UNSUB_SECRET / CAMPAIGN_SECRET not set' };

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
  const canary = new Set(
    (process.env.LIFECYCLE_TEST_RECIPIENTS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  if (canary.size > 0) console.log(`[confirmation-nudge] canary mode: ${canary.size} allowlisted address(es)`);

  let recipients = await selectCandidates();
  if (canary.size > 0) recipients = recipients.filter((r) => canary.has(r.email));

  if (dry) {
    const result = { enabled: true, dry: true, wouldSend: recipients.length };
    console.log('[confirmation-nudge]', JSON.stringify(result));
    return { statusCode: 200, body: JSON.stringify(result) };
  }
  if (recipients.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ enabled: true, sent: 0, failed: 0 }) };
  }

  // Claim BEFORE send: UNIQUE(user_id, kind) makes re-runs and crashes safe —
  // the worst outcome after this line is a missed email, never a double one.
  const { error: claimError } = await supabase
    .from('lifecycle_emails')
    .upsert(recipients.map((r) => ({ user_id: r.id, kind: 'confirm_nudge' })), {
      onConflict: 'user_id,kind',
      ignoreDuplicates: true,
    });
  if (claimError) {
    console.error('[confirmation-nudge] claim failed (migration applied?):', claimError.message);
    return { statusCode: 500, body: JSON.stringify({ error: `claim failed: ${claimError.message}` }) };
  }

  const items = recipients.map((r) => ({
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

  const result = { enabled: true, dry: false, sent, failed };
  console.log('[confirmation-nudge]', JSON.stringify(result));
  return { statusCode: 200, body: JSON.stringify(result) };
};

// 10:30 UTC — after trial-lifecycle (08:00) and activation-lifecycle (09:30);
// audiences are disjoint anyway (this job mails only unconfirmed accounts),
// the spacing just keeps the send domain's daily pattern smooth.
export const handler = schedule('30 10 * * *', innerHandler);
