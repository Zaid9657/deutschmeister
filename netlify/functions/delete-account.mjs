import { supabase } from './_shared/supabase.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';

// Statuses under which Lemon Squeezy will still charge a recurring plan. Course rows
// (plan_type 'course') are one-time purchases and never block a deletion.
const CHARGING_STATUSES = ['active', 'on_trial', 'past_due', 'unpaid'];

export function hasChargingSubscription(rows) {
  return (rows || []).some((s) => s.plan_type !== 'course'
    && typeof s.lemonsqueezy_subscription_id === 'string' && s.lemonsqueezy_subscription_id.trim() !== ''
    && CHARGING_STATUSES.includes(s.status) && !s.cancel_at_period_end);
}

// The owner keeps a record of every deletion (this button answers Art. 17 requests).
// Best effort and after the fact: a mail failure never blocks or undoes the deletion, and
// an unset OWNER_ALERT_EMAIL / RESEND_API_KEY only logs, as in the sentinel.
async function notifyOwner({ userId, email }) {
  const to = String(process.env.OWNER_ALERT_EMAIL || '').trim();
  if (!to || !process.env.RESEND_API_KEY) {
    console.error(`[delete-account] ${!to ? 'OWNER_ALERT_EMAIL' : 'RESEND_API_KEY'} not set — deletion of ${userId} not mailed`);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'DeutschMeister Sentinel <zaid@deutsch-meister.de>',
        to: [to],
        subject: `Account deleted: ${email}`,
        text: `A learner deleted their account from the profile page.\n\nEmail: ${email}\nUser id: ${userId}\nTime: ${new Date().toISOString()}\n\nSupport threads, payment records and email logs are not removed by this button.`,
      }),
    });
    if (!res.ok) console.error('[delete-account] owner notice failed:', res.status);
    return res.ok;
  } catch (err) {
    console.error('[delete-account] owner notice failed:', err.message);
    return false;
  }
}

export const handler = async (event) => {
  const allowedOrigins = [
    'https://deutsch-meister.de',
    'https://www.deutsch-meister.de',
  ];
  const origin = event.headers?.origin || '';
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const userId = await getAuthenticatedUserId(event);
    if (!userId) return unauthorizedResponse(headers);
    if (!supabase) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
    }

    // A recurring plan keeps billing after the account is gone and the LS API key is
    // read-only, so the learner cancels in the billing portal first.
    const { data: subs, error: subError } = await supabase
      .from('subscriptions')
      .select('status, plan_type, cancel_at_period_end, lemonsqueezy_subscription_id')
      .eq('user_id', userId);
    if (subError) throw subError;
    if (hasChargingSubscription(subs)) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ code: 'subscription_active', error: 'Please cancel your subscription under "Manage billing" first, then delete your account.' }),
      };
    }

    const { data: found } = await supabase.auth.admin.getUserById(userId);
    const email = found?.user?.email || '(unknown)';

    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    await notifyOwner({ userId, email });
    return { statusCode: 200, headers, body: JSON.stringify({ deleted: true }) };
  } catch (error) {
    console.error('Account deletion failed:', error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Account deletion failed. Please try again or contact support.' }) };
  }
};
