const WELCOME_HTML = (email) => `<!DOCTYPE html>
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
            <td style="background:linear-gradient(135deg,#f59e0b,#f43f5e);padding:32px;text-align:center;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,0.2);margin-bottom:12px;">
                <span style="color:#ffffff;font-size:28px;font-weight:800;">D</span>
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
                The first thing I'd suggest trying is <strong style="color:#1e293b;">Sentence X-Ray</strong> — paste any German sentence and it breaks down exactly what each word is doing: the cases, the roles, and <em>why</em>. It's the fastest way to start understanding German grammar rather than just memorising it.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="border-radius:10px;background:linear-gradient(135deg,#7c3aed,#4f46e5);">
                    <a href="https://deutsch-meister.de/analyze"
                       style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">
                      Try Sentence X-Ray →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:16px;color:#475569;line-height:1.6;">
                Everything else — grammar lessons, listening, podcasts — is there when you're ready. But start with one sentence. That's all it takes.
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
                DeutschMeister · <a href="https://deutsch-meister.de" style="color:#94a3b8;">deutsch-meister.de</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
