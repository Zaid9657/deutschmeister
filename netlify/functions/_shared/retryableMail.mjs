// Owner-gated callers only; requires the unapplied 2026-11-01 mail ledger SQL.
// Claims and exact request bodies survive retries. Resend's idempotency window
// is finite: stop conservatively at 23h; never turn an ambiguous old send into
// a new send. A controller must reconcile those rows with provider evidence.
export const MAIL_RETRY_MS = 23 * 60 * 60 * 1000;

export async function sendRetryableMail({ client, resendKey, key, scope, kind, userId = null, message, cooldownSeconds = 0, fetchImpl = fetch, now = null, maxAttempts = 3, isEligible = async () => true, pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) }) {
  const { data, error } = await client.rpc('claim_retryable_mail', {
    p_key: key, p_scope: scope, p_kind: kind, p_user_id: userId,
    p_message: message, p_cooldown_seconds: cooldownSeconds,
  });
  if (error) throw new Error(`mail claim failed: ${error.message}`);
  const claim = data?.[0];
  if (!claim) return { status: 'skipped' };
  if (claim.closed_at) return { status: 'closed' };
  if (claim.accepted_at) return { status: 'already_accepted', providerId: claim.provider_id };
  if (JSON.stringify(claim.message.to) !== JSON.stringify(message.to)) return { status: 'needs_review', key: claim.message_key };
  now ??= Date.now();
  const age = now - Date.parse(claim.first_attempt_at);
  if (!Number.isFinite(age) || age < 0 || age >= MAIL_RETRY_MS) return { status: 'needs_review', key: claim.message_key };

  // Concurrent requests may hit Resend together, but with the same stored
  // body and key. A lost response/stamp reuses both. 409 is NOT success.
  let providerId;
  const started = Date.now();
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (age + Date.now() - started >= MAIL_RETRY_MS) return { status: 'needs_review', key: claim.message_key };
    if (!(await isEligible())) return { status: 'skipped' };
    try {
      const response = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': claim.message_key },
        body: JSON.stringify(claim.message),
      });
      if (!response.ok) throw new Error(`Resend ${response.status}`);
      providerId = (await response.json()).id;
      if (!providerId || typeof providerId !== 'string') throw new Error('Resend acceptance missing id');
      break;
    } catch (error) {
      await client.from('mail_delivery_claims').update({ last_error: error.message })
        .eq('message_key', claim.message_key).is('accepted_at', null);
      if (attempt + 1 === maxAttempts) return { status: 'retryable', error: error.message, key: claim.message_key };
      // Retry inside this invocation, without moving the audience's window.
      await pause(250 * (attempt + 1));
    }
  }
  const { error: stampError } = await client.from('mail_delivery_claims')
    .update({ accepted_at: new Date(now + Date.now() - started).toISOString(), provider_id: providerId, last_error: null })
    .eq('message_key', claim.message_key).is('accepted_at', null);
  if (stampError) throw new Error(`mail accepted (${providerId}) but stamp failed: ${stampError.message}`);
  return { status: 'accepted', providerId, key: claim.message_key };
}

// Old lifecycle rows have unknown outcomes and MUST NOT be replayed. Only a
// durable, unaccepted claim created by the new path can be retried, and only
// inside the unchanged audience window selected by the caller.
export async function retryableLifecycleUsers(client, kind, ids, now = Date.now()) {
  if (!ids.length) return new Set();
  const { data, error } = await client.from('mail_delivery_claims').select('user_id')
    .eq('kind', kind).in('user_id', ids).is('accepted_at', null).is('closed_at', null)
    .gte('first_attempt_at', new Date(now - MAIL_RETRY_MS).toISOString());
  if (error) throw new Error(`mail retry ledger read failed: ${error.message}`);
  return new Set((data || []).map((row) => row.user_id));
}
