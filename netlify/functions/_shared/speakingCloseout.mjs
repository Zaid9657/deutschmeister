// Speaking session close-out — the ONE rule for how a speaking session ends.
//
// A session RESERVES its allowance at start (speaking-session action 'start'):
// a trial user's lifetime session is recorded in `speaking_usage`, a paid
// session debits the wallet, and a subscriber's free 5-minute session counts
// towards today's two. Until 2026-09-27 nothing ever gave that back. Measured
// over the preceding 30 days: 7 of the 20 trial sessions recorded (35 %, six of
// twelve trial users) belonged to sessions in which the learner never said a
// word, and two users lost BOTH lifetime sessions that way.
//
// THE RULE: a session closes on the learner turns the SERVER counted in
// `speaking_messages`, never on a client-reported count.
//   - any learner turn → 'completed'; the reservation is consumed.
//   - zero learner turns → 'cancelled'; the reservation is released (the trial
//     unit is deleted, a wallet debit is refunded, and the subscriber count in
//     speaking-session skips cancelled rows).
//
// WHO CLOSES A SESSION. The client's 'end' call (Finish, the timer, Cancel);
// failing that — tab closed, phone locked — anyone who finds it STALE, i.e.
// past the moment speaking-turn stops accepting turns (started_at +
// planned_minutes + SESSION_GRACE_MINUTES). That is check-speaking-usage and
// 'start' for the caller's own sessions, and the speaking-closeout schedule for
// everyone's. Before this, 36 sessions sat in 'active' forever with
// user_turns 0 — twelve of the 18 in the last 30 days in fact HAD learner
// turns, which is why the "53 % zero-turn" figure overstated the problem.
//
// RACE SAFETY. The status flip is conditional on status = 'active', so exactly
// one closer wins and only the winner releases the allowance.
//
// No imports: the database client is passed in, so the suite can drive the
// whole close-out against an in-memory fake (tests/speaking-closeout.test.mjs).

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

/**
 * Add `amount` cents back to a wallet (optimistic compare-and-swap, 5 tries).
 * Also used by speaking-session when the session insert fails after a debit.
 */
export async function creditWallet(client, userId, amount) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: row } = await client
      .from('speaking_wallet')
      .select('balance_cents')
      .eq('user_id', userId)
      .maybeSingle();
    const balance = row?.balance_cents ?? 0;
    const { data: updated } = await client
      .from('speaking_wallet')
      .update({ balance_cents: balance + amount, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('balance_cents', balance)
      .select('balance_cents')
      .maybeSingle();
    if (updated) return true;
  }
  return false;
}

/** Learner turns and the last message time, counted from speaking_messages. */
async function countTurns(client, sessionToken) {
  const { data, error } = await client
    .from('speaking_messages')
    .select('role, created_at')
    .eq('session_token', sessionToken);
  if (error) return { error };
  const rows = Array.isArray(data) ? data : [];
  let lastAt = null;
  for (const r of rows) {
    if (r.created_at && (!lastAt || r.created_at > lastAt)) lastAt = r.created_at;
  }
  return { userTurns: rows.filter((r) => r.role === 'user').length, lastAt };
}

/**
 * Close one session. Returns { closed, status, userTurns, released, refundCents }.
 * `closed: false` means someone else closed it first (or the count failed —
 * the session then stays 'active' and the next sweep retries).
 *
 * @param {object} opts.durationSeconds  client-measured duration (the 'end' call)
 * @param {Date}   opts.now              injectable clock
 */
export async function closeOutSession(client, session, { durationSeconds, now = new Date() } = {}) {
  const counted = await countTurns(client, session.session_token);
  if (counted.error) {
    console.error('[speaking-closeout] message count failed:', JSON.stringify(counted.error));
    return { closed: false, error: 'count_failed' };
  }
  const plan = closeOutPlan({ userTurns: counted.userTurns, mode: session.mode, costCents: session.cost_cents });

  // A client-measured duration is bounded by the session's own budget; a
  // swept session ends at its last message (or at its start, if it had none).
  const budgetSeconds = (Number(session.planned_minutes || 5) + SESSION_GRACE_MINUTES) * 60;
  const startedMs = Date.parse(session.started_at || '');
  let duration;
  let endedAt;
  if (Number.isFinite(durationSeconds)) {
    duration = Math.min(Math.max(0, Math.round(durationSeconds)), budgetSeconds);
    endedAt = now.toISOString();
  } else {
    const lastMs = Date.parse(counted.lastAt || '');
    endedAt = Number.isFinite(lastMs) ? new Date(lastMs).toISOString() : (session.started_at || now.toISOString());
    duration = Number.isFinite(lastMs) && Number.isFinite(startedMs)
      ? Math.min(Math.max(0, Math.round((lastMs - startedMs) / 1000)), budgetSeconds)
      : 0;
  }

  const { data: flipped, error: flipError } = await client
    .from('speaking_sessions')
    .update({ status: plan.status, user_turns: plan.userTurns, duration_seconds: duration, completed_at: endedAt })
    .eq('session_token', session.session_token)
    .eq('status', 'active')
    .select('session_token');
  if (flipError) {
    console.error('[speaking-closeout] status update failed:', JSON.stringify(flipError));
    return { closed: false, error: 'update_failed' };
  }
  if (!Array.isArray(flipped) || flipped.length === 0) {
    return { closed: false, status: plan.status, userTurns: plan.userTurns, released: false, refundCents: 0 };
  }

  let released = false;
  if (plan.releaseTrial) {
    const usageId = usageIdForToken(session.session_token);
    if (usageId) {
      const { error } = await client
        .from('speaking_usage')
        .delete()
        .eq('id', usageId)
        .eq('user_id', session.user_id);
      if (error) console.error('[speaking-closeout] trial release failed:', JSON.stringify(error));
      else released = true;
    }
  }
  let refundCents = 0;
  if (plan.refundCents > 0) {
    const ok = await creditWallet(client, session.user_id, plan.refundCents);
    if (ok) {
      refundCents = plan.refundCents;
      released = true;
      const { error } = await client
        .from('speaking_wallet_transactions')
        .insert({
          user_id: session.user_id,
          amount_cents: plan.refundCents,
          reason: 'refund_no_speech',
          session_token: session.session_token,
        });
      if (error) console.error('[speaking-closeout] refund transaction insert failed:', JSON.stringify(error));
    } else {
      console.error('[speaking-closeout] wallet refund FAILED for session', session.session_token);
    }
  }

  return { closed: true, status: plan.status, userTurns: plan.userTurns, released, refundCents };
}

/**
 * Close every stale 'active' session — the caller's own (`userId`) or, from the
 * schedule, everyone's. Returns { scanned, closed, cancelled, completed }.
 */
export async function closeOutStaleSessions(client, { userId = null, now = new Date(), limit = 100 } = {}) {
  // No planned session is shorter than 5 minutes, so nothing started after
  // this cutoff can be stale yet; isStale() then applies each row's own budget.
  const cutoff = new Date(now.getTime() - (5 + SESSION_GRACE_MINUTES) * 60 * 1000).toISOString();
  let query = client
    .from('speaking_sessions')
    .select(CLOSEOUT_COLUMNS)
    .eq('status', 'active')
    .lt('started_at', cutoff);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query.order('started_at', { ascending: true }).limit(limit);
  if (error) {
    console.error('[speaking-closeout] stale scan failed:', JSON.stringify(error));
    return { scanned: 0, closed: 0, cancelled: 0, completed: 0, error: 'scan_failed' };
  }
  const summary = { scanned: 0, closed: 0, cancelled: 0, completed: 0 };
  for (const session of Array.isArray(data) ? data : []) {
    if (!isStale(session, now.getTime())) continue;
    summary.scanned += 1;
    const result = await closeOutSession(client, session, { now });
    if (!result.closed) continue;
    summary.closed += 1;
    summary[result.status] += 1;
  }
  return summary;
}
