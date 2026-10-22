import { supabase } from './supabase.mjs';
import { creditWallet, closeOutSession, usageIdForToken } from './speakingCloseout.mjs';
import { isMissingSchema, logMigrationPending } from './migrationPending.mjs';

// Tiers: premium | pro | free_trial | free_expired
// premium  — unlimited sessions
// pro      — 30 sessions/month
// free_trial  — 2 sessions TOTAL (lifetime, for the duration of the trial)
// free_expired — fully blocked
const PRO_MONTHLY_LIMIT  = 30;
const TRIAL_TOTAL_LIMIT  = 2;

// Exported: evaluate-writing.mjs reuses the same tier resolution so speaking
// and writing can never disagree about who is pro/trial/expired.
export async function getTier(userId) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_tier, is_subscribed, trial_ends_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error('Speaking entitlement could not be checked');

  // No profile row → treat as blocked (no NULL bypass)
  if (!profile) return 'free_expired';

  if (profile.subscription_tier === 'premium') return 'premium';
  if (profile.subscription_tier === 'pro' || profile.is_subscribed) return 'pro';

  // NULL trial_ends_at → trialActive is false → free_expired (no bypass)
  const trialActive = profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
  return trialActive ? 'free_trial' : 'free_expired';
}

async function legacyRows(queryForPage) {
  const rows = [];
  for (;;) {
    const { data, error, count } = await queryForPage().range(rows.length, rows.length + 999);
    if (error || !Array.isArray(data) || !Number.isInteger(count)) throw new Error('Speaking allowance could not be checked');
    rows.push(...data);
    if (rows.length >= count) return rows;
    if (data.length === 0) throw new Error('Speaking allowance could not be checked');
  }
}

async function legacyUsageStatus(client, userId) {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const since = monthStart.toISOString();
  const { count: total, error } = await client.from('speaking_usage')
    .select('id', { count: 'exact', head: true }).eq('user_id', userId);
  if (error || !Number.isInteger(total)) throw new Error('Speaking allowance could not be checked');
  const usage = await legacyRows(() => client.from('speaking_usage')
    .select('id', { count: 'exact' }).eq('user_id', userId).gte('created_at', since).order('id'));
  const sessions = await legacyRows(() => client.from('speaking_sessions')
    .select('session_token', { count: 'exact' }).eq('user_id', userId).eq('cost_cents', 0)
    .eq('planned_minutes', 5).neq('mode', 'placement').neq('status', 'cancelled')
    .gte('started_at', since).order('session_token'));
  const ids = new Set(usage.map((row) => row.id));
  return {
    total,
    monthly: usage.length + sessions.filter((row) => !ids.has(usageIdForToken(row.session_token))).length,
  };
}

export async function checkUsage(userId) {
  const tier = await getTier(userId);
  let { data, error } = await supabase.rpc('speaking_usage_status', { p_user_id: userId });
  if (isMissingSchema(error)) {
    logMigrationPending('speaking_usage_status');
    data = await legacyUsageStatus(supabase, userId);
    error = null;
  }
  if (error || !data || !Number.isInteger(data.monthly) || !Number.isInteger(data.total)) {
    throw new Error('Speaking allowance could not be checked');
  }
  if (tier === 'free_expired') return { allowed: false, tier, reason: 'subscription_required' };
  if (tier === 'premium') return { allowed: true, unlimited: true, tier };
  const used = tier === 'pro' ? data.monthly : data.total;
  const limit = tier === 'pro' ? PRO_MONTHLY_LIMIT : TRIAL_TOTAL_LIMIT;
  const usage = { allowed: used < limit, used, limit, tier };
  if (used < limit) return usage;
  return tier === 'pro'
    ? { ...usage, reason: 'monthly_limit_reached' }
    : { ...usage, reason: 'trial_limit_reached' };
}

async function reserveSessionLegacy(client, session, tier) {
  if (session.cost_cents === 0 && session.mode !== 'placement') {
    const usage = await legacyUsageStatus(client, session.user_id);
    const allowed = tier === 'premium' || (tier === 'pro' && usage.monthly < PRO_MONTHLY_LIMIT)
      || (tier === 'free_trial' && usage.total < TRIAL_TOTAL_LIMIT);
    if (!allowed) return { ok: false, code: 'allowance_changed' };
  }
  let balance;
  if (session.cost_cents > 0) {
    const { data, error } = await client.rpc('debit_speaking_wallet', {
      p_user_id: session.user_id, p_cost: session.cost_cents,
    });
    if (error || !Number.isInteger(data) || data < -1) throw new Error('Speaking wallet could not be debited');
    if (data === -1) return { ok: false, code: 'insufficient_funds', cost_cents: session.cost_cents };
    balance = data;
  }
  const row = { ...session, status: 'active', started_at: new Date().toISOString() };
  try {
    const { error } = await client.from('speaking_sessions').insert(row);
    if (error) throw error;
  } catch {
    if (session.cost_cents > 0) {
      const refunded = await creditWallet(client, session.user_id, session.cost_cents);
      if (!refunded) console.error('[speaking-session] refund after failed legacy insert FAILED:', session.session_token);
    }
    throw new Error('Speaking session could not be created');
  }
  try {
    if (session.cost_cents > 0) {
      const { error } = await client.from('speaking_wallet_transactions').insert({
        user_id: session.user_id, amount_cents: -session.cost_cents,
        reason: `session_${session.planned_minutes}min`, session_token: session.session_token,
      });
      if (error) throw error;
    } else if (session.mode !== 'placement') {
      const { error } = await client.from('speaking_usage').insert({
        id: usageIdForToken(session.session_token), user_id: session.user_id,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
    }
  } catch (error) {
    await closeOutSession(client, row);
    throw error;
  }
  return { ok: true, ...(balance !== undefined ? { balance_cents: balance } : {}) };
}

// The database repeats the allowance check under the same user lock as the
// usage insert, wallet debit and session insert once the migration is applied.
export async function reserveSession(client, session, tier) {
  const { data, error } = await client.rpc('reserve_speaking_session', {
    p_session: session, p_tier: tier,
    p_pro_limit: PRO_MONTHLY_LIMIT, p_trial_limit: TRIAL_TOTAL_LIMIT,
  });
  if (isMissingSchema(error)) {
    logMigrationPending('reserve_speaking_session');
    return reserveSessionLegacy(client, session, tier);
  }
  if (error || !data || typeof data.ok !== 'boolean') {
    throw new Error('Speaking reservation could not be created');
  }
  return data;
}
