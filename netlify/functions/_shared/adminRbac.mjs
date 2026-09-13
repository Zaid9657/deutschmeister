// Admin panel — the gate and the record, bound to Supabase.
//
// requireCapability: verify the JWT, read the role from the DATABASE (never
// from the request), check the capability, and audit a denial before
// returning 403. Fails closed: an unreadable role is a 500, not a pass.
//
// writeAudit: the one writer for admin_audit_log. A duplicate idempotency key
// is a success (the retry changed nothing); a failed audit write never turns
// a successful action into an error, and never turns a 403 into a 500.

import { getAuthenticatedUserId } from './auth.mjs';
import { capabilitiesFor, hasCapability, redact } from './adminRbacLib.mjs';

export async function requireUser(event, supabase, headers) {
  const userId = await getAuthenticatedUserId(event);
  if (!userId) {
    return {
      response: {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Nicht autorisiert — bitte erneut anmelden.' }),
      },
    };
  }
  return { userId };
}

/**
 * Resolves the caller's role from profiles. `null` role means "not staff".
 * `capability` may be null to require only SOME role (the session endpoint).
 */
export async function requireCapability(event, supabase, capability, headers, { resolveUser = requireUser } = {}) {
  const auth = await resolveUser(event, supabase, headers);
  if (auth.response) return auth;

  const { data, error } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', auth.userId)
    .maybeSingle();
  if (error) {
    console.error('[admin-rbac] role lookup failed:', error.message);
    return {
      response: { statusCode: 500, headers, body: JSON.stringify({ error: 'Rolle konnte nicht gelesen werden.' }) },
    };
  }

  const role = data?.role ?? null;
  const allowed = capability ? hasCapability(role, capability) : Boolean(role);
  if (!allowed) {
    await writeAudit(supabase, {
      actorId: auth.userId,
      actorRole: role ?? 'none',
      action: `denied.${capability ?? 'admin.session'}`,
      targetType: 'capability',
      targetId: capability ?? 'admin.session',
      outcome: 'denied',
      source: event.path,
    }).catch(() => {});
    return {
      response: {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Forbidden', requiredCapability: capability ?? 'admin.session' }),
      },
    };
  }

  return { userId: auth.userId, email: data?.email ?? null, role, capabilities: capabilitiesFor(role) };
}

/**
 * Append one row to admin_audit_log.
 * Returns { id } | { duplicate: true } | { error }. Never throws.
 */
export async function writeAudit(supabase, entry) {
  const row = {
    actor_id: entry.actorId,
    actor_role: entry.actorRole,
    action: entry.action,
    target_type: entry.targetType,
    target_id: entry.targetId == null ? null : String(entry.targetId),
    reason: entry.reason ?? null,
    before_state: entry.before ? redact(entry.before) : null,
    after_state: entry.after ? redact(entry.after) : null,
    correlation_id: entry.correlationId ?? null,
    idempotency_key: entry.idempotencyKey ?? null,
    outcome: entry.outcome,
    error_message: entry.errorMessage ?? null,
    source: entry.source ?? null,
  };
  try {
    const { data, error } = await supabase.from('admin_audit_log').insert(row).select('id').maybeSingle();
    if (error) {
      if (error.code === '23505') return { duplicate: true };
      console.error('[admin-rbac] audit write failed:', error.message);
      return { error: error.message };
    }
    return { id: data?.id };
  } catch (e) {
    console.error('[admin-rbac] audit write threw:', e.message);
    return { error: e.message };
  }
}
