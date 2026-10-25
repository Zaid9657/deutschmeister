import { supabase } from '../utils/supabase';

export const AUDIT_EVENTS = {
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  SIGNUP: 'auth.signup',
  PASSWORD_RESET_REQUESTED: 'auth.password_reset_requested',
  PASSWORD_CHANGED: 'auth.password_changed',
  EMAIL_VERIFIED: 'auth.email_verified',
  SUBSCRIPTION_STARTED: 'billing.subscription_started',
  SUBSCRIPTION_CANCELLED: 'billing.subscription_cancelled',
};

/**
 * @param {string} eventType  AUDIT_EVENTS value
 * @param {object} [detail]
 * @param {{ userId?: string }} [options]  the acting user, when the caller already knows it.
 *   Without it the row looks the user up with getUser(): a network round trip that holds
 *   supabase-js's auth lock, so a sign-out queued behind it waited for that request.
 */
export async function logAuditEvent(eventType, detail = {}, { userId } = {}) {
  try {
    let actor = userId;
    if (!actor) {
      const { data: { user } } = await supabase.auth.getUser();
      actor = user?.id;
    }
    if (!actor) return;

    // then() sends the request now; awaiting the builder alone calls it a tick
    // later. The request reads the session first, under the same auth lock, and
    // at logout that tick let the signOut() called right after this function
    // clear the session first: the row went out with the anonymous key.
    const { error } = await supabase.from('audit_logs').insert({
      user_id: actor,
      event_type: eventType,
      event_detail: detail,
      user_agent: navigator.userAgent,
    }).then((result) => result);

    if (error) console.warn('[audit]', error.message);
  } catch (err) {
    console.warn('[audit]', err);
  }
}
