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
// Safe to re-run: every send is recorded in `lifecycle_emails` with a
// UNIQUE(user_id, kind), and the insert happens BEFORE the send, so a crash
// mid-run can drop a message but can never duplicate one. Opted-out users
// (profiles.email_daily_sentence = false) are skipped entirely.
import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

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

// ─── copy ────────────────────────────────────────────────────────────────────

const SHELL = ({ heading, body, ctaHref, ctaLabel, unsubUrl }) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${heading}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
          <td style="background:linear-gradient(135deg,#f59e0b,#f43f5e);padding:32px;text-align:center;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,0.2);margin-bottom:12px;">
              <span style="color:#ffffff;font-size:28px;font-weight:800;">D</span>
            </div>
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">DeutschMeister</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px 28px;">
            ${body}
            <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
              <tr>
                <td style="border-radius:10px;background:linear-gradient(135deg,#7c3aed,#4f46e5);">
                  <a href="${ctaHref}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">${ctaLabel}</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:16px;color:#1e293b;line-height:1.6;">— Zaid</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
              DeutschMeister · <a href="${BASE_URL}" style="color:#94a3b8;">deutsch-meister.de</a><br>
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

const TEMPLATES = {
  trial_day3: {
    subject: 'Three things in your DeutschMeister trial worth 10 minutes',
    ctaHref: `${BASE_URL}/analyze/`,
    ctaLabel: 'Analyze a sentence →',
    body:
      P('Hey! You\'re three days into your trial, so here\'s the short list of what\'s actually worth your time.') +
      P('<strong style="color:#1e293b;">Sentence X-Ray</strong> — paste any German sentence and see what every word is doing: the cases, the roles, and <em>why</em>. It takes about three seconds and it\'s the fastest way to stop guessing.') +
      P('<strong style="color:#1e293b;">Listening</strong> — short native-speaker dialogues graded to your level, so you understand most of what you hear instead of drowning in it.') +
      P('<strong style="color:#1e293b;">Speaking</strong> — a two-minute conversation with an AI partner that corrects you as you go.'),
  },
  trial_day6: {
    subject: 'Your DeutschMeister trial ends tomorrow',
    ctaHref: `${BASE_URL}/pricing/`,
    ctaLabel: 'Keep Pro — €9.99/month →',
    body:
      P('Quick heads-up: your Pro trial ends tomorrow.') +
      P('If you keep it, you stay on 50 sentence analyses a day, the full grammar library through B2, listening, reading, and AI speaking practice. That\'s €9.99 a month — less than one hour with a tutor.') +
      P('If you don\'t, nothing dramatic happens: your account stays, your progress stays, and you drop to the free tier. You can come back whenever.'),
  },
  trial_ended: {
    subject: 'Your progress is saved',
    ctaHref: `${BASE_URL}/pricing/`,
    ctaLabel: 'Restore Pro access →',
    body:
      P('Your trial ended yesterday — so this is the last you\'ll hear from me about it.') +
      P('Everything you did is still there: your topics, your streak, your history. Nothing was deleted, and one click puts it all back within reach.') +
      P('And if the timing just isn\'t right, that\'s genuinely fine. The free tier and the daily sentence keep working, and German isn\'t going anywhere.'),
  },
};

// ─── selection ───────────────────────────────────────────────────────────────

// Users whose trial day matches, who haven't already had this message, aren't
// paying, and haven't opted out.
async function selectRecipients(kind) {
  // Each window is expressed directly as [lower, upper) offsets in days from
  // now, because the sign conventions are easy to get backwards: day 6 and the
  // post-trial mail look FORWARD and BACKWARD from now respectively.
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const windows = {
    // Day 3 of a 7-day trial: it started between 4 and 3 days ago.
    trial_day3: { col: 'trial_started_at', lower: now - 4 * day, upper: now - 3 * day },
    // The day before it ends: trial_ends_at falls within the next 24 hours.
    trial_day6: { col: 'trial_ends_at', lower: now, upper: now + day },
    // The day after it ended: trial_ends_at was 1-2 days ago.
    trial_ended: { col: 'trial_ends_at', lower: now - 2 * day, upper: now - day },
  }[kind];

  const lower = new Date(windows.lower).toISOString();
  const upper = new Date(windows.upper).toISOString();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email_daily_sentence, is_subscribed')
    .gte(windows.col, lower)
    .lt(windows.col, upper);
  if (error) throw new Error(`profiles query failed: ${error.message}`);

  const candidates = (profiles || []).filter((p) => p.is_subscribed !== true && p.email_daily_sentence !== false);
  if (candidates.length === 0) return [];

  const ids = candidates.map((p) => p.id);
  const { data: already } = await supabase
    .from('lifecycle_emails')
    .select('user_id')
    .eq('kind', kind)
    .in('user_id', ids);
  const sentAlready = new Set((already || []).map((r) => r.user_id));

  // Resolve addresses, and only mail confirmed ones.
  const emails = new Map();
  let page = 1;
  while (true) {
    const { data, error: authError } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (authError) throw new Error(`listUsers: ${authError.message}`);
    for (const u of data.users) {
      if (u.email && u.email_confirmed_at) emails.set(u.id, u.email.trim().toLowerCase());
    }
    if (data.users.length < 1000) break;
    page++;
  }

  return candidates
    .filter((p) => !sentAlready.has(p.id) && emails.has(p.id))
    .map((p) => ({ id: p.id, email: emails.get(p.id) }));
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
  if (recipients.length === 0) return { kind, sent: 0, failed: 0 };

  const tpl = TEMPLATES[kind];
  let sent = 0;
  let failed = 0;

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
      console.error(`[trial-lifecycle] ${kind} batch failed:`, err.message);
    }
  }

  return { kind, sent, failed };
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
  for (const kind of ['trial_day3', 'trial_day6', 'trial_ended']) {
    try {
      results.push(await sendKind(resendKey, kind));
    } catch (err) {
      console.error(`[trial-lifecycle] ${kind} failed:`, err.message);
      results.push({ kind, sent: 0, failed: 0, error: err.message });
    }
  }

  console.log('[trial-lifecycle]', JSON.stringify(results));
  return { statusCode: 200, body: JSON.stringify({ results }) };
};

// 08:00 UTC — an hour after the daily sentence, so the two never collide.
export const handler = schedule('0 8 * * *', innerHandler);
