import { createHmac } from 'crypto';
import sentences from './data/daily-sentences.json' with { type: 'json' };

const FROM_ADDRESS   = 'DeutschMeister <zaid@deutsch-meister.de>';
const DEFAULT_EMAIL  = 'zaid199660@gmail.com';
const BASE_URL     = 'https://deutsch-meister.de';
const UNSUB_SECRET = process.env.UNSUB_SECRET || process.env.CAMPAIGN_SECRET || 'changeme';

function todaysSentence() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  return sentences[(dayOfYear - 1) % sentences.length];
}

function analyzeUrl(sentenceDe) {
  return `${BASE_URL}/analyze?s=${encodeURIComponent(sentenceDe)}`;
}

function unsubscribeUrl(userId) {
  const token = createHmac('sha256', UNSUB_SECRET).update(userId).digest('hex');
  return `${BASE_URL}/unsubscribe?uid=${userId}&token=${token}`;
}

function buildEmail(sentence) {
  const ctaUrl   = analyzeUrl(sentence.sentence_de);
  const unsubUrl = unsubscribeUrl('test-user');

  return `<!DOCTYPE html>
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

        <tr>
          <td style="background:linear-gradient(135deg,#f59e0b,#f43f5e);padding:28px 32px;">
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">DeutschMeister · Daily Sentence</p>
            <p style="margin:6px 0 0;color:#ffffff;font-size:13px;opacity:0.8;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;">
              <span style="display:inline-block;padding:3px 10px;border-radius:999px;background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;">${sentence.level} · ${sentence.grammar_focus}</span>
            </p>
            <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Today's sentence</p>
            <p style="margin:0 0 24px;font-size:26px;font-weight:700;color:#0f172a;line-height:1.3;">${sentence.sentence_de}</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#f0f9ff;border-left:3px solid #0ea5e9;border-radius:0 8px 8px 0;padding:14px 18px;">
                  <p style="margin:0;font-size:14px;color:#0c4a6e;line-height:1.6;">${sentence.hint}</p>
                </td>
              </tr>
            </table>

            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:10px;">
                  <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.01em;">
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

export const handler = async (event) => {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'RESEND_API_KEY not set' }) };
  }

  const to = event?.queryStringParameters?.email || DEFAULT_EMAIL;

  const sentence = todaysSentence();
  const html     = buildEmail(sentence);
  const subject  = `🇩🇪 [TEST] ${sentence.sentence_de}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], reply_to: 'zaid199660@gmail.com', subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { statusCode: res.status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: text }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, to, sentence: sentence.sentence_de }),
  };
};
