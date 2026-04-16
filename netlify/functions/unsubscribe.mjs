import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const UNSUB_SECRET = process.env.UNSUB_SECRET || process.env.CAMPAIGN_SECRET || 'changeme';

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Supabase init error:', e.message);
}

function verifyToken(userId, token) {
  if (!userId || !token) return false;
  const expected = createHmac('sha256', UNSUB_SECRET).update(userId).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

function htmlPage(title, message, linkBack = true) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 80vh; }
    .card { max-width: 420px; background: #fff; border-radius: 16px; padding: 40px; border: 1px solid #e2e8f0; text-align: center; }
    h1 { margin: 0 0 12px; font-size: 22px; color: #0f172a; }
    p { margin: 0 0 24px; font-size: 15px; color: #64748b; line-height: 1.6; }
    a { color: #7c3aed; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    ${linkBack ? '<a href="https://deutsch-meister.de">Back to DeutschMeister</a>' : ''}
  </div>
</body>
</html>`;
}

export const handler = async (event) => {
  const { uid, token } = event.queryStringParameters || {};

  if (!verifyToken(uid, token)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html' },
      body: htmlPage('Invalid link', 'This unsubscribe link is invalid or has expired. If you want to opt out, please contact us at zaid@deutsch-meister.de.'),
    };
  }

  if (!supabase) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: htmlPage('Something went wrong', 'We could not process your request. Please try again later.'),
    };
  }

  // Set email_daily_sentence = false on the profile.
  // If the column doesn't exist yet, the update will fail silently — run the
  // migration SQL below first:
  //   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_daily_sentence boolean DEFAULT true;
  const { error } = await supabase
    .from('profiles')
    .update({ email_daily_sentence: false })
    .eq('id', uid);

  if (error) {
    console.error('Unsubscribe update error:', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: htmlPage('Something went wrong', 'We could not update your preferences. Please try again or contact zaid@deutsch-meister.de.'),
    };
  }

  console.log(`Unsubscribed user ${uid} from daily sentences`);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: htmlPage(
      'You\'re unsubscribed',
      'You won\'t receive daily German sentences anymore. You can still use DeutschMeister any time — your progress is safe.',
    ),
  };
};
