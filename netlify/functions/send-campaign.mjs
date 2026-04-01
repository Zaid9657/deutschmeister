import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Failed to initialize Supabase client:', e.message);
}

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAllUserEmails() {
  // auth.admin.listUsers paginates — fetch all pages
  const emails = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Failed to fetch users: ${error.message}`);

    for (const user of data.users) {
      const email = user.email?.trim().toLowerCase();
      if (email && !isBlockedEmail(email)) {
        emails.push(email);
      }
    }

    // Supabase returns fewer than perPage when we've reached the last page
    if (data.users.length < perPage) break;
    page++;
  }

  return emails;
}

async function sendEmail(resendKey, to, subject, htmlBody) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    FROM_ADDRESS,
      to:      [to],
      subject,
      html:    htmlBody,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }

  return res.json();
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
  let subject, body, testMode;
  try {
    ({ subject, body, testMode = false } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'subject is required' }) };
  }
  if (!body || typeof body !== 'string' || !body.trim()) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'body is required' }) };
  }

  // --- Determine recipient list ---
  let recipients;
  if (testMode) {
    recipients = [TEST_EMAIL];
    console.log('Test mode: sending only to', TEST_EMAIL);
  } else {
    try {
      recipients = await fetchAllUserEmails();
      console.log(`Fetched ${recipients.length} eligible recipients`);
    } catch (err) {
      console.error('Failed to fetch recipients:', err.message);
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  if (recipients.length === 0) {
    return { statusCode: 200, headers, body: JSON.stringify({ sent: 0, failed: 0, errors: [] }) };
  }

  // --- Send ---
  let sent = 0;
  let failed = 0;
  const errors = [];

  for (const email of recipients) {
    try {
      await sendEmail(resendKey, email, subject.trim(), body.trim());
      sent++;
      console.log(`Sent to ${email} (${sent}/${recipients.length})`);
    } catch (err) {
      failed++;
      errors.push({ email, error: err.message });
      console.error(`Failed to send to ${email}:`, err.message);
    }

    // 1 second delay between sends (skip after the last one)
    if (sent + failed < recipients.length) {
      await sleep(1000);
    }
  }

  console.log(`Campaign complete — sent: ${sent}, failed: ${failed}`);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ sent, failed, errors }),
  };
};
