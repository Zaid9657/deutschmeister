import { tagEmailLink } from './_shared/emailLinks.mjs';
import { socialFooterLine } from './_shared/socialLinks.mjs';

// The site links carry the email tags (docs/tracking-links.md, "Our own
// email"), so a click from the welcome mail is filed as email/lifecycle/welcome
// instead of untracked or a webmail host. Fixed strings: no id, address or date.
//
// The button opens Lektion 1 of the free A1.1 course (2026-10-25; it opened
// Sentence X-Ray before). The mail arrives with, often before, the confirmation
// mail, and a first lesson row is the activation event: Lektion 1 works with no
// account, and its save-progress ask leads back to the account. An SPA route, so
// no trailing slash (src/lib/firstRun.js FIRST_LESSON_HREF; tests/welcome-links
// pins the two together). X-Ray stays as a text link.
const WELCOME_UTM = { medium: 'lifecycle', campaign: 'welcome' };
export const WELCOME_CTA_HREF = tagEmailLink('https://deutsch-meister.de/course/a1.1/l/1', { ...WELCOME_UTM, content: 'cta' });
export const WELCOME_XRAY_HREF = tagEmailLink('https://deutsch-meister.de/analyze/', { ...WELCOME_UTM, content: 'xray' });
export const WELCOME_FOOTER_HREF = tagEmailLink('https://deutsch-meister.de/', { ...WELCOME_UTM, content: 'footer' });

const WELCOME_HTML = (_email) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to DeutschMeister</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

          <!-- Header -->
          <tr>
            <td style="background:#0F766E;padding:32px;text-align:center;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,0.2);margin-bottom:12px;">
                <span style="color:#ffffff;font-size:28px;font-weight:700;font-family:Georgia,'Times New Roman',serif;">M</span>
              </div>
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">DeutschMeister</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 28px;">
              <p style="margin:0 0 16px;font-size:16px;color:#1e293b;line-height:1.6;">Hey!</p>

              <p style="margin:0 0 16px;font-size:16px;color:#475569;line-height:1.6;">
                Thanks for signing up to DeutschMeister. Really glad you're here.
              </p>

              <p style="margin:0 0 16px;font-size:16px;color:#475569;line-height:1.6;">
                The first thing I'd suggest is <strong style="color:#1e293b;">Lektion 1</strong> of the free A1.1 course. It starts with the first Hallo, one short step per screen.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="border-radius:10px;background:#0F766E;">
                    <a href="${WELCOME_CTA_HREF}"
                       style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">
                      Start Lektion 1 →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:16px;color:#475569;line-height:1.6;">
                Confirm your address with the other email to save progress.
              </p>

              <p style="margin:0 0 16px;font-size:16px;color:#475569;line-height:1.6;">
                Already reading German? Paste any sentence into <a href="${WELCOME_XRAY_HREF}" style="color:#0F766E;font-weight:600;">Sentence X-Ray</a> and it shows what each word is doing: the cases, the roles, and <em>why</em>. Everything else — grammar lessons, listening, podcasts — is there when you're ready.
              </p>

              <p style="margin:0;font-size:16px;color:#1e293b;line-height:1.6;">
                — Zaid
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                DeutschMeister · <a href="${WELCOME_FOOTER_HREF}" style="color:#94a3b8;">deutsch-meister.de</a>${socialFooterLine('#94a3b8')}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export { WELCOME_HTML as welcomeHtml };

export const handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // --- Verify shared secret ---
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('WEBHOOK_SECRET is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (token !== webhookSecret) {
    console.warn('send-welcome-email: unauthorized request');
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  // --- Env checks ---
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('RESEND_API_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'RESEND_API_KEY not set' }) };
  }

  // --- Parse body ---
  let email, user_id;
  try {
    // Supabase webhooks wrap the row in { type, table, record, ... }
    const payload = JSON.parse(event.body || '{}');
    // Support both direct { email, user_id } and Supabase webhook envelope
    if (payload.record) {
      email   = payload.record.email;
      user_id = payload.record.id;
    } else {
      email   = payload.email;
      user_id = payload.user_id;
    }
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    console.error('send-welcome-email: missing or invalid email, user_id:', user_id);
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Valid email is required' }) };
  }

  // --- Send via Resend ---
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Zaid from DeutschMeister <zaid@deutsch-meister.de>',
        to:      [email],
        subject: 'Welcome to DeutschMeister — here\'s where to start',
        html:    WELCOME_HTML(email),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`send-welcome-email: Resend error ${res.status} for ${email}:`, text);
      return { statusCode: 502, headers, body: JSON.stringify({ error: `Resend error: ${res.status}` }) };
    }

    const data = await res.json();
    console.log(`send-welcome-email: sent to ${email} (user_id: ${user_id}), resend_id: ${data.id}`);
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, resend_id: data.id }) };

  } catch (err) {
    console.error(`send-welcome-email: unexpected error for ${email}:`, err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
