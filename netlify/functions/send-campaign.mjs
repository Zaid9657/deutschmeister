import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { createHmac } from 'crypto';

const UNSUB_SECRET = process.env.UNSUB_SECRET || process.env.CAMPAIGN_SECRET;
const BASE_URL = 'https://deutsch-meister.de';

const FROM_ADDRESS = 'DeutschMeister <zaid@deutsch-meister.de>';
const TEST_EMAIL   = 'zaid199660@gmail.com';

// Common disposable/throwaway domains to exclude
const BLOCKED_DOMAINS = new Set([
  'example.com', 'mailinator.com', 'guerrillamail.com', 'tempmail.com',
  'throwaway.email', 'sharklasers.com', 'guerrillamailblock.com',
  'grr.la', 'guerrillamail.info', 'spam4.me', 'trashmail.com',
  'trashmail.me', 'trashmail.net', 'yopmail.com', 'dispostable.com',
  'maildrop.cc', 'mailnull.com', 'spamgourmet.com', 'spamgourmet.net',
  'spamgourmet.org', 'spamtrap.ro', 'tempr.email', 'fakeinbox.com',
  'getairmail.com', 'filzmail.com', '33mail.com', 'spamfree24.org',
]);

function isBlockedEmail(email) {
  if (!email || !email.includes('@')) return true;
  const domain = email.split('@')[1].toLowerCase();
  return BLOCKED_DOMAINS.has(domain);
}

function unsubscribeUrl(userId) {
  const token = createHmac('sha256', UNSUB_SECRET).update(userId).digest('hex');
  return `${BASE_URL}/unsubscribe?uid=${userId}&token=${token}`;
}

function unsubscribeFooter(userId) {
  return `
<p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  You're receiving this because you signed up at <a href="${BASE_URL}" style="color:#94a3b8;">deutsch-meister.de</a>.<br>
  <a href="${unsubscribeUrl(userId)}" style="color:#94a3b8;">Unsubscribe from DeutschMeister emails</a>
</p>`;
}

// Optional audience exclusions, so a launch sequence never mails "last chance"
// to someone who already bought on day 1. Supported values in the request
// body's `exclude` array:
//   'subscribed' — users with a live paid period (subscription_end > now)
//   'purchased'  — users with any active one-time purchase (purchases table);
//                  'purchased:<product_key>' narrows to one product
async function excludedUserIds(exclude) {
  const out = new Set();
  if (!Array.isArray(exclude) || exclude.length === 0) return out;

  if (exclude.includes('subscribed')) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('user_id')
      .gt('subscription_end', new Date().toISOString());
    if (error) throw new Error(`exclude subscribed query failed: ${error.message}`);
    for (const row of data || []) out.add(row.user_id);
  }

  const purchasedRules = exclude.filter((e) => typeof e === 'string' && e.startsWith('purchased'));
  if (purchasedRules.length > 0) {
    let q = supabase.from('purchases').select('user_id, product_key').eq('status', 'active');
    const keys = purchasedRules
      .map((r) => r.split(':')[1])
      .filter(Boolean);
    if (keys.length > 0 && !purchasedRules.includes('purchased')) {
      q = q.in('product_key', keys);
    }
    const { data, error } = await q;
    if (error) throw new Error(`exclude purchased query failed: ${error.message}`);
    for (const row of data || []) out.add(row.user_id);
  }

  return out;
}

async function fetchAllUserEmails() {
  // auth.admin.listUsers paginates — fetch all pages
  const users = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Failed to fetch users: ${error.message}`);

    for (const user of data.users) {
      const email = user.email?.trim().toLowerCase();
      // Confirmed addresses only — unverified ones are disproportionately
      // typos and spam traps, and bounces cost the sending domain dearly.
      if (email && user.email_confirmed_at && !isBlockedEmail(email)) {
        users.push({ id: user.id, email });
      }
    }

    // Supabase returns fewer than perPage when we've reached the last page
    if (data.users.length < perPage) break;
    page++;
  }

  if (users.length === 0) return [];

  // Honor opt-outs. profiles.email_daily_sentence currently doubles as the
  // global email opt-out flag (a dedicated marketing flag is on the roadmap);
  // if the column doesn't exist yet, log and treat everyone as opted in.
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, email_daily_sentence')
    .in('id', users.map((u) => u.id));

  if (profErr) {
    console.warn('profiles opt-out query error (column may not exist yet):', profErr.message);
    return users;
  }

  const optedOut = new Set(
    (profiles || []).filter((p) => p.email_daily_sentence === false).map((p) => p.id)
  );

  return users.filter((u) => !optedOut.has(u.id));
}

const BATCH_SIZE = 100;

// Resend's batch endpoint: ~1,000 recipients in ~10 requests instead of ~1,000
// requests spaced a second apart, which never finished inside the function
// budget and left the operator with no idea who had received the campaign.
async function sendBatch(resendKey, items) {
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(items),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend batch ${res.status}: ${text.slice(0, 300)}`);
  }
}

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // --- Auth ---
  const campaignSecret = process.env.CAMPAIGN_SECRET;
  if (!campaignSecret) {
    console.error('CAMPAIGN_SECRET is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  const providedSecret = event.headers?.['x-campaign-secret'] || event.headers?.['X-Campaign-Secret'];
  if (providedSecret !== campaignSecret) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  // --- Env checks ---
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'RESEND_API_KEY not set' }) };
  }
  if (!supabaseKey || !supabase) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }) };
  }

  // --- Parse body ---
  let subject, body, testMode, exclude;
  try {
    ({ subject, body, testMode = false, exclude = [] } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'subject is required' }) };
  }
  if (!body || typeof body !== 'string' || !body.trim()) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'body is required' }) };
  }

  if (!UNSUB_SECRET) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'UNSUB_SECRET / CAMPAIGN_SECRET not set' }) };
  }

  // --- Determine recipient list ---
  let recipients;
  if (testMode) {
    recipients = [{ id: 'test-user', email: TEST_EMAIL }];
    console.log('Test mode: sending only to', TEST_EMAIL);
  } else {
    try {
      recipients = await fetchAllUserEmails();
      const excluded = await excludedUserIds(exclude);
      if (excluded.size > 0) {
        const before = recipients.length;
        recipients = recipients.filter((r) => !excluded.has(r.id));
        console.log(`Excluded ${before - recipients.length} recipients (${JSON.stringify(exclude)})`);
      }
      console.log(`Fetched ${recipients.length} eligible recipients`);
    } catch (err) {
      console.error('Failed to fetch recipients:', err.message);
      console.error('send-campaign: recipient fetch failed:', err.message);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
    }
  }

  if (recipients.length === 0) {
    return { statusCode: 200, headers, body: JSON.stringify({ sent: 0, failed: 0, errors: [] }) };
  }

  // --- Send ---
  let sent = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const slice = recipients.slice(i, i + BATCH_SIZE);
    const items = slice.map(({ id, email }) => ({
      from: FROM_ADDRESS,
      to: [email],
      subject: subject.trim(),
      html: body.trim() + unsubscribeFooter(id),
    }));
    try {
      await sendBatch(resendKey, items);
      sent += slice.length;
      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${sent}/${recipients.length}`);
    } catch (err) {
      failed += slice.length;
      errors.push({ batch: Math.floor(i / BATCH_SIZE) + 1, error: err.message });
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, err.message);
    }
  }

  console.log(`Campaign complete — sent: ${sent}, failed: ${failed}`);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ sent, failed, errors }),
  };
};
