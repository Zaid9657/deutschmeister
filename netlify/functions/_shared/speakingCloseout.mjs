// Database reservations serialize session starts, turns and close-out.

/** Minutes after planned_minutes during which speaking-turn still accepts a turn. */
export const SESSION_GRACE_MINUTES = 2;

/** Columns a close-out needs from a speaking_sessions row. */
export const CLOSEOUT_COLUMNS = 'session_token, user_id, mode, status, started_at, planned_minutes, cost_cents';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The speaking_usage row id a trial session reserves: the uuid inside its
 * server-minted `sp_<uuid>` token. Writing the usage row under this id links
 * it to its session without a schema change, so a release deletes exactly
 * that row. null for any other token shape (nothing to release by id).
 */
export function usageIdForToken(token) {
  const m = /^sp_(.+)$/.exec(String(token || ''));
  return m && UUID_RE.test(m[1]) ? m[1].toLowerCase() : null;
}

/** Epoch ms after which speaking-turn refuses turns for this session; null if unknown. */
export function sessionDeadlineMs(session) {
  const started = Date.parse(session?.started_at || '');
  if (!Number.isFinite(started)) return null;
  return started + (Number(session.planned_minutes || 5) + SESSION_GRACE_MINUTES) * 60 * 1000;
}

/** An 'active' session nobody can speak in any more. */
export function isStale(session, now = Date.now()) {
  const deadline = sessionDeadlineMs(session);
  return session?.status === 'active' && deadline !== null && now > deadline;
}

/**
 * Pure: how a session closes, given the learner turns the server counted.
 * Placement is quota-exempt, so it never has anything to release.
 */
export function closeOutPlan({ userTurns, mode, costCents }) {
  const turns = Math.max(0, Math.floor(Number(userTurns) || 0));
  if (turns > 0) {
    return { status: 'completed', userTurns: turns, releaseTrial: false, refundCents: 0 };
  }
  const placement = mode === 'placement';
  const cost = Math.max(0, Math.floor(Number(costCents) || 0));
  return {
    status: 'cancelled',
    userTurns: 0,
    releaseTrial: !placement && cost === 0,
    refundCents: placement ? 0 : cost,
  };
}

/** Close and release in one database transaction, serialized with accepted turns. */
export async function closeOutSession(client, session, { durationSeconds } = {}) {
  const { data, error } = await client.rpc('settle_speaking_session', {
    p_session_token: session.session_token,
    p_user_id: session.user_id,
    p_duration_seconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
  });
  if (error || !data || typeof data.closed !== 'boolean') {
    console.error('[speaking-closeout] settlement failed:', error?.message || 'Invalid response');
    return { closed: false, error: 'settlement_failed' };
  }
  return data;
}

/** A turn is accepted under the same row lock close-out takes. */
export async function reserveTurn(client, sessionToken, userId, turnId) {
  const { data, error } = await client.rpc('reserve_speaking_turn', {
    p_session_token: sessionToken, p_user_id: userId, p_turn_id: turnId,
  });
  if (error || !data || typeof data.ok !== 'boolean') throw new Error('Speaking turn could not be reserved');
  return data;
}

export async function settleTurn(client, sessionToken, userId, turnId, delivered) {
  const { data, error } = await client.rpc('settle_speaking_turn', {
    p_session_token: sessionToken, p_user_id: userId, p_turn_id: turnId, p_delivered: delivered,
  });
  if (error || data !== true) throw new Error('Speaking turn could not be settled');
}

/** Failed settlements remain active and are picked up on the next sweep. */
export async function closeOutStaleSessions(client, { userId = null, now = new Date(), limit = 100 } = {}) {
  const cutoff = new Date(now.getTime() - (5 + SESSION_GRACE_MINUTES) * 60 * 1000).toISOString();
  let query = client.from('speaking_sessions').select(CLOSEOUT_COLUMNS)
    .eq('status', 'active').lt('started_at', cutoff);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query.order('started_at', { ascending: true }).limit(limit);
  if (error) return { scanned: 0, closed: 0, cancelled: 0, completed: 0, error: 'scan_failed' };
  const summary = { scanned: 0, closed: 0, cancelled: 0, completed: 0 };
  for (const session of Array.isArray(data) ? data : []) {
    if (!isStale(session, now.getTime())) continue;
    summary.scanned += 1;
    const result = await closeOutSession(client, session);
    if (result.error) summary.error = result.error;
    if (!result.closed) continue;
    summary.closed += 1;
    summary[result.status] += 1;
  }
  return summary;
}
