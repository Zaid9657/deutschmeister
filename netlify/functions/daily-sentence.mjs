import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import sentences from './data/daily-sentences.json' with { type: 'json' };

// ─── config ──────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FROM_ADDRESS = 'DeutschMeister <zaid@deutsch-meister.de>';
const BASE_URL = 'https://deutsch-meister.de';
const TEST_EMAIL = 'zaid@deutsch-meister.de';

// Secret used to sign unsubscribe tokens — keep in env vars
const UNSUB_SECRET = process.env.UNSUB_SECRET || process.env.CAMPAIGN_SECRET || 'changeme';

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Supabase init error:', e.message);
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Pick today's sentence by cycling through the array using day-of-year. */
function todaysSentence() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay); // 1–365
  return sentences[(dayOfYear - 1) % sentences.length];
}

/** HMAC-SHA256 token so we can verify unsubscribe requests without a DB lookup. */
function unsubscribeToken(userId) {
  return createHmac('sha256', UNSUB_SECRET).update(userId).digest('hex');
}

function unsubscribeUrl(userId) {
  const token = unsubscribeToken(userId);
  return `${BASE_URL}/.netlify/functions/unsubscribe?uid=${userId}&token=${token}`;
}

function analyzeUrl(sentenceDe) {
  return `${BASE_URL}/analyze?s=${encodeURIComponent(sentenceDe)}`;
}

/** Fetch all confirmed users who haven't opted out of daily emails. */
async function getRecipients() {
  // auth.admin.listUsers for verified emails
  const emails = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);

    for (const user of data.users) {
      // Only confirmed accounts with an email
      if (!user.email || !user.email_confirmed_at) continue;
      emails.push({ id: user.id, email: user.email.trim().toLowerCase() });
    }

    if (data.users.length < 1000) break;
    page++;
  }

  if (emails.length === 0) return [];

  // Filter out users who opted out — check profiles.email_daily_sentence = false
  // (column may not exist yet — if it doesn't, everyone is opted in)
  const userIds = emails.map((u) => u.id);
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, email_daily_sentence')
    .in('id', userIds);

  if (profErr) {
    // If the column doesn't exist yet, log a warning and send to everyone
    console.warn('profiles query error (column may not exist yet):', profErr.message);
    return emails;
  }

  const optedOut = new Set(
    (profiles || [])
      .filter((p) => p.email_daily_sentence === false)
      .map((p) => p.id)
  );

  return emails.filter((u) => !optedOut.has(u.id));
}

function buildEmail({ sentence, recipient }) {
  const ctaUrl = analyzeUrl(sentence.sentence_de);
  const unsubUrl = unsubscribeUrl(recipient.id);

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your daily German sentence</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#f59e0b,#f43f5e);padding:28px 32px;">
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">DeutschMeister · Daily Sentence</p>
            <p style="margin:6px 0 0;color:#ffffff;font-size:13px;opacity:0.8;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">

            <!-- Level badge -->
            <p style="margin:0 0 16px;">
              <span style="display:inline-block;padding:3px 10px;border-radius:999px;background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;">${sentence.level} · ${sentence.grammar_focus}</span>
            </p>

            <!-- The sentence -->
            <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Today's sentence</p>
            <p style="margin:0 0 24px;font-size:26px;font-weight:700;color:#0f172a;line-height:1.3;">${sentence.sentence_de}</p>

            <!-- Curiosity hook -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#f0f9ff;border-left:3px solid #0ea5e9;border-radius:0 8px 8px 0;padding:14px 18px;">
                  <p style="margin:0;font-size:14px;color:#0c4a6e;line-height:1.6;">${sentence.hint}</p>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:10px;">
                  <a href="${ctaUrl}"
                     style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.01em;">
                    See the X-Ray Breakdown →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
              The X-Ray tool breaks this sentence into its grammatical parts — cases, roles, and <em>why</em> each word takes the form it does.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f1f5f9;background:#f8fafc;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
              You're receiving this because you signed up at <a href="${BASE_URL}" style="color:#94a3b8;">deutsch-meister.de</a>.<br>
              <a href="${unsubUrl}" style="color:#94a3b8;">Unsubscribe from daily sentences</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(resendKey, to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], reply_to: 'zaid199660@gmail.com', subject, html }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── handler ─────────────────────────────────────────────────────────────────

const innerHandler = async (event) => {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey)    return { statusCode: 500, body: 'RESEND_API_KEY not set' };
  if (!supabaseKey)  return { statusCode: 500, body: 'SUPABASE_SERVICE_ROLE_KEY not set' };

  // Dual-mode: scheduled invocation (no httpMethod) runs live.
  // HTTP GET/POST requests must pass ?test=true to limit sending to TEST_EMAIL,
  // OR pass ?secret=<CAMPAIGN_SECRET> to run live via HTTP (for manual triggers).
  // Without one of these, HTTP requests are rejected to prevent accidental bulk sends.
  const isScheduled = !event.httpMethod;
  const qs = event.queryStringParameters || {};

  let bodyPayload = {};
  try { bodyPayload = JSON.parse(event.body || '{}'); } catch { /* ignore */ }

  const isTest = qs.test === 'true' || bodyPayload.test === true;
  const campaignSecret = process.env.CAMPAIGN_SECRET;
  const hasSecret = campaignSecret && (qs.secret === campaignSecret || bodyPayload.secret === campaignSecret);

  if (!isScheduled && !isTest && !hasSecret) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Pass ?test=true to send a test email, or ?secret=<CAMPAIGN_SECRET> to run live.' }),
    };
  }

  const sentence = todaysSentence();
  console.log(`Daily sentence [${isTest ? 'TEST MODE' : 'LIVE'}]: "${sentence.sentence_de}" [${sentence.level}]`);

  let recipients;
  if (isTest) {
    recipients = [{ id: 'test-user', email: TEST_EMAIL }];
    console.log('Test mode — sending only to', TEST_EMAIL);
  } else {
    try {
      recipients = await getRecipients();
    } catch (err) {
      console.error('Failed to fetch recipients:', err.message);
      return { statusCode: 500, body: err.message };
    }
  }

  console.log(`Sending to ${recipients.length} recipients`);

  const subject = `🇩🇪 ${sentence.sentence_de}`;
  let sent = 0, failed = 0;

  for (const recipient of recipients) {
    try {
      const html = buildEmail({ sentence, recipient });
      await sendEmail(resendKey, recipient.email, subject, html);
      sent++;
    } catch (err) {
      failed++;
      console.error(`Failed to send to ${recipient.email}:`, err.message);
    }
    if (sent + failed < recipients.length) await sleep(300);
  }

  console.log(`Done — sent: ${sent}, failed: ${failed}`);
  return { statusCode: 200, body: JSON.stringify({ sent, failed, sentence: sentence.sentence_de }) };
};

// schedule() wraps the handler so Netlify recognises this as a scheduled
// function. The cron schedule here is the authoritative declaration —
// netlify.toml [functions."daily-sentence"] schedule is kept as a fallback.
export const handler = schedule('0 7 * * *', innerHandler);
