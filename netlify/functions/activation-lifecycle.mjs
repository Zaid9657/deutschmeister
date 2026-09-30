// Activation lifecycle — the behavioural half of the funnel's missing middle.
//
// The trial sequence (trial-lifecycle.mjs) is clock-based: it fires on days
// 3, 6 and 8 whatever the user did. This one is behaviour-based: it reaches
// ONLY users who signed up and then never opened a single lesson — the
// audit's diagnosed cliff, where ~85% of ~170 monthly signups stall. Two
// messages, once each, per user:
//
//   activation_d1 — day 1–2 after signup, zero lessons: one 10-minute start
//   activation_d4 — day 4–5, still zero lessons: the one feature worth seeing
//
// The windows are chosen to be DISJOINT from the trial sequence's (days 3–4,
// 6–7 and 7–8 from signup for a 7-day trial), so no user gets two lifecycle
// mails on the same day. tests/lifecycle.test.mjs pins this; move a window
// and the test tells you which day now collides.
//
// THE RULE THIS FUNCTION EXISTS TO KEEP: never tell someone they have not
// used a lesson when they have. Selection reads public.lifecycle_customer_state
// (the ONE definition of funnel status — migrations/2026-08-22-activation-
// lifecycle.sql, widened by 2026-09-28-lifecycle-lesson-activity.sql to count
// every lesson-activity source, the A1.1 course player included), and
// eligibility is RE-READ immediately before the claim, so a user who does
// their first lesson between selection and send is dropped. This file never
// queries an activity table itself: which tables count is the view's job, and
// tests/lifecycle.test.mjs fails if a source is missing from it.
//
// Both reads also require has_lesson_activity = false. That column exists only
// once the 2026-09-28 migration is applied, so on the older view the query
// errors and nothing is sent. The job fails closed and never mails on the
// three-table definition that let A1.1 learners through.
//
// SHIPS OFF, twice over:
//   1. LIFECYCLE_ACTIVATION_ENABLED must be exactly 'true' or the run no-ops
//      with a log line. The variable does not exist until an owner sets it.
//   2. Even switched on, an unmigrated database cannot send: selection reads
//      the view and the ledger's CHECK rejects the new kinds, and a failed
//      claim means no send (claim-before-send, same as trial-lifecycle).
// Canary: while LIFECYCLE_TEST_RECIPIENTS is set (comma-separated addresses),
// only those addresses are claimed or mailed — everyone else is skipped and
// left unclaimed, so emptying the list later resumes them from scratch.
// Dry run: ?dry=1 with the campaign secret reports counts, sends nothing,
// claims nothing.
import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { BRAND, emailHeader, ctaCell } from './_shared/brand.mjs';

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

// ─── windows ─────────────────────────────────────────────────────────────────

// [lower, upper) in days since registration. Exported for the disjointness
// test. Trial windows for reference (do not overlap them): day3 = [3,4),
// day6 ≈ [6,7), ended ≈ [7,8).
export const WINDOWS = {
  activation_d1: { lowerDays: 1, upperDays: 2 },
  activation_d4: { lowerDays: 4, upperDays: 5 },
};

// ─── copy ────────────────────────────────────────────────────────────────────
// English (the post-signup product is English); Zaid voice, same register as
// trial-lifecycle. No urgency, no invented counts, no price figures — the
// claim tests ban them here. Both messages assume, correctly by construction,
// that the reader has not started a lesson.

const SHELL = ({ heading, body, ctaHref, ctaLabel, unsubUrl }) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${heading}</title></head>
<body style="margin:0;padding:0;background:${BRAND.paper};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${BRAND.white};border-radius:16px;overflow:hidden;border:1px solid ${BRAND.rule};">
        <tr>${emailHeader()}</tr>
        <tr>
          <td style="padding:36px 32px 28px;">
            ${body}
            <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
              <tr>${ctaCell(ctaHref, ctaLabel)}</tr>
            </table>
            <p style="margin:0;font-size:16px;color:${BRAND.ink};line-height:1.6;">— Zaid</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid ${BRAND.rule};text-align:center;">
            <p style="margin:0;font-size:12px;color:${BRAND.graphite};line-height:1.6;">
              DeutschMeister · <a href="${BASE_URL}" style="color:${BRAND.graphite};">deutsch-meister.de</a><br>
              <a href="${unsubUrl}" style="color:${BRAND.graphite};">Unsubscribe from these emails</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const P = (text) => `<p style="margin:0 0 16px;font-size:16px;color:${BRAND.graphite};line-height:1.6;">${text}</p>`;

export const TEMPLATES = {
  activation_d1: {
    subject: 'Ten minutes is enough for a first step',
    ctaHref: `${BASE_URL}/level-test/`,
    ctaLabel: 'Find your level →',
    body:
      P('Hey! You signed up for DeutschMeister — and then, if the data is right, life happened. That\'s normal; it\'s what happens to most people after most signups.') +
      P(`So here's the smallest useful first step: the <strong style="color:${BRAND.ink};">level test</strong>. Ten minutes, and it tells you exactly which lesson to start with instead of leaving you staring at a syllabus.`) +
      P('If you already know your level, skip the test and open any lesson at it. The first one you finish is the one that makes the second one easy.'),
  },
  activation_d4: {
    subject: 'The three-second trick for German sentences',
    ctaHref: `${BASE_URL}/analyze/`,
    ctaLabel: 'Analyze a sentence →',
    body:
      P('One more nudge from me, and then I\'ll leave you in peace.') +
      P(`If you only ever try one thing here, make it <strong style="color:${BRAND.ink};">Sentence X-Ray</strong>: paste any German sentence and it shows you what every word is doing — the case, the role, and <em>why</em>. It's the difference between memorising German and understanding it.`) +
      P('Paste a sentence from anywhere — a song, a meme, a letter from the Amt. Three seconds later it makes sense.'),
  },
};

// ─── selection ───────────────────────────────────────────────────────────────

// Users inside the window whose funnel status is still 'new' (no lesson
// activity of any kind, not subscribed), not opted out, message not yet sent.
//
// ONE definition of "who is due", read by this job and by the sentinel. The
// job passes nothing and gets today's run. The sentinel passes `span` =
// { first, last }, the scheduled runs since the job's last ledger row: the
// window then covers all of them ([first - upper, last - lower)), and a user
// counts only if their address was confirmed by the time their window opened
// — so nobody who became due (or confirmed) after a run is counted as missed;
// the next run mails them.
export async function selectCandidates(kind, { client = supabase, span = null } = {}) {
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const first = span ? span.first : now;
  const last = span ? span.last : now;
  const w = WINDOWS[kind];
  const lower = new Date(first - w.upperDays * day).toISOString();
  const upper = new Date(last - w.lowerDays * day).toISOString();

  const { data: rows, error } = await client
    .from('lifecycle_customer_state')
    .select('user_id, status, email_opted_out, has_lesson_activity, registered_at')
    .gte('registered_at', lower)
    .lt('registered_at', upper)
    .eq('status', 'new')
    .eq('has_lesson_activity', false);
  if (error) throw new Error(`lifecycle_customer_state query failed (2026-09-28-lifecycle-lesson-activity.sql applied?): ${error.message}`);

  const candidates = (rows || []).filter((r) => !r.email_opted_out && r.has_lesson_activity === false);
  if (candidates.length === 0) return [];

  // A failed ledger read must stop the run: read as "nobody was mailed", it
  // would re-send to everyone already mailed (the claim upsert ignores
  // duplicates, the send does not).
  const ids = candidates.map((r) => r.user_id);
  const { data: already, error: ledgerError } = await client
    .from('lifecycle_emails')
    .select('user_id')
    .eq('kind', kind)
    .in('user_id', ids);
  if (ledgerError) throw new Error(`ledger read failed: ${ledgerError.message}`);
  const sentAlready = new Set((already || []).map((r) => r.user_id));

  // Confirmed addresses only — same as trial-lifecycle.
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
  // user comes after their window opens (registered_at + lower), so an address
  // confirmed by then was confirmed at that run. Without a span this is moot.
  const confirmedInTime = (r) => !span || confirmedAt.get(r.user_id) <= Date.parse(r.registered_at) + w.lowerDays * day;

  return candidates
    .filter((r) => !sentAlready.has(r.user_id) && emails.has(r.user_id) && confirmedInTime(r))
    .map((r) => ({ id: r.user_id, email: emails.get(r.user_id) }));
}

// The re-read that keeps the rule: between selection and send, a user may
// have done their first lesson. Ask the view again for JUST these ids and
// drop anyone no longer 'new'. Returns the surviving subset.
async function recheckStillNew(recipients) {
  if (recipients.length === 0) return [];
  const { data, error } = await supabase
    .from('lifecycle_customer_state')
    .select('user_id, status, has_lesson_activity')
    .in('user_id', recipients.map((r) => r.id));
  if (error) throw new Error(`eligibility re-read failed: ${error.message}`);
  const stillNew = new Set(
    (data || []).filter((r) => r.status === 'new' && r.has_lesson_activity === false).map((r) => r.user_id),
  );
  return recipients.filter((r) => stillNew.has(r.id));
}

async function sendBatch(resendKey, items) {
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  });
  if (!res.ok) throw new Error(`Resend batch ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

async function sendKind(resendKey, kind, { dry, canary }) {
  let recipients = await selectCandidates(kind);

  // Canary: while the allowlist is set, ONLY listed addresses proceed — and
  // the rest are left unclaimed, so emptying the list resumes them cleanly.
  if (canary.size > 0) recipients = recipients.filter((r) => canary.has(r.email));

  if (dry) return { kind, wouldSend: recipients.length, sent: 0, failed: 0 };
  if (recipients.length === 0) return { kind, sent: 0, failed: 0 };

  const tpl = TEMPLATES[kind];
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    // Eligibility re-read per slice, immediately before the claim.
    const slice = await recheckStillNew(recipients.slice(i, i + BATCH_SIZE));
    if (slice.length === 0) continue;

    // Claim BEFORE send: the unique key means a concurrent or repeated run
    // cannot re-send; a crash after this point costs at most a missed email.
    const { error: claimError } = await supabase
      .from('lifecycle_emails')
      .upsert(slice.map((r) => ({ user_id: r.id, kind })), { onConflict: 'user_id,kind', ignoreDuplicates: true });
    if (claimError) {
      console.error(`[activation-lifecycle] ${kind}: could not claim batch, skipping:`, claimError.message);
      failed += slice.length;
      continue;
    }

    const items = slice.map((r) => ({
      from: FROM_ADDRESS,
      to: [r.email],
      reply_to: 'zaid@deutsch-meister.de',
      subject: tpl.subject,
      html: SHELL({
        heading: tpl.subject,
        body: tpl.body,
        ctaHref: tpl.ctaHref,
        ctaLabel: tpl.ctaLabel,
        unsubUrl: unsubscribeUrl(r.id),
      }),
    }));

    try {
      await sendBatch(resendKey, items);
      sent += slice.length;
    } catch (err) {
      failed += slice.length;
      console.error(`[activation-lifecycle] ${kind} batch failed:`, err.message);
    }
  }

  return { kind, sent, failed };
}

// ─── handler ─────────────────────────────────────────────────────────────────

const innerHandler = async (event) => {
  // The master switch. Absent or anything but the exact string 'true' → no-op.
  if (process.env.LIFECYCLE_ACTIVATION_ENABLED !== 'true') {
    console.log('[activation-lifecycle] LIFECYCLE_ACTIVATION_ENABLED is not "true" — doing nothing.');
    return { statusCode: 200, body: JSON.stringify({ enabled: false, sent: 0 }) };
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { statusCode: 500, body: 'RESEND_API_KEY not set' };
  if (!supabaseKey) return { statusCode: 500, body: 'SUPABASE_SERVICE_ROLE_KEY not set' };
  if (!UNSUB_SECRET) return { statusCode: 500, body: 'UNSUB_SECRET / CAMPAIGN_SECRET not set' };

  // Same auth shape as trial-lifecycle: scheduler invocations carry next_run;
  // manual runs need the campaign secret. Never publicly triggerable.
  const qs = event.queryStringParameters || {};
  let bodyPayload = {};
  try { bodyPayload = JSON.parse(event.body || '{}'); } catch { /* ignore */ }
  const isScheduled = typeof bodyPayload.next_run === 'string';
  const secretOk = Boolean(CAMPAIGN_SECRET) && qs.secret === CAMPAIGN_SECRET;
  if (!isScheduled && !secretOk) {
    console.warn('[activation-lifecycle] rejected unauthenticated invocation');
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const dry = qs.dry === '1';
  const canary = new Set(
    (process.env.LIFECYCLE_TEST_RECIPIENTS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  if (canary.size > 0) console.log(`[activation-lifecycle] canary mode: ${canary.size} allowlisted address(es)`);

  const results = [];
  for (const kind of Object.keys(WINDOWS)) {
    try {
      results.push(await sendKind(resendKey, kind, { dry, canary }));
    } catch (err) {
      console.error(`[activation-lifecycle] ${kind} failed:`, err.message);
      results.push({ kind, sent: 0, failed: 0, error: err.message });
    }
  }

  console.log('[activation-lifecycle]', JSON.stringify(results));
  return { statusCode: 200, body: JSON.stringify({ enabled: true, dry, results }) };
};

// 09:30 UTC: an hour and a half after trial-lifecycle (08:00), so the two
// jobs never overlap and a user in both queues gets mails hours apart —
// though the disjoint windows mean that should not happen at all.
export const handler = schedule('30 9 * * *', innerHandler);
