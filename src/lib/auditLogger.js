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

export async function logAuditEvent(eventType, detail = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('audit_logs').insert({
      user_id: user.id,
      event_type: eventType,
      event_detail: detail,
      user_agent: navigator.userAgent,
    });

    if (error) console.warn('[audit]', error.message);
  } catch (err) {
    console.warn('[audit]', err);
  }
}
