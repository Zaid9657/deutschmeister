// Admin panel — the permission model, as pure data and pure functions.
//
// Roles are declared as a map from role → capabilities, every endpoint asks
// for a CAPABILITY, and this map is the contract. `admin` is a superset, not a
// wildcard: a wildcard cannot be read to find out what an admin may do. The
// settings screen renders its role matrix from `capabilitiesFor`, the same
// object the server enforces, so the screen cannot drift from the enforcement.
//
// Pure on purpose (no DB client, no env): the handler and the tests both
// import it, so a test proves the code that ships, not a copy.
// See docs/admin-panel.md §Permissions.

export const ROLES = Object.freeze(['admin', 'support', 'finance', 'auditor', 'content']);

/** Every capability an endpoint may ask for. Adding one here without a row below fails the matrix test. */
export const CAPABILITIES = Object.freeze([
  'directory.read',
  'user360.read',
  'user360.learning',
  'entitlement.write',
  'finance.read',
  'finance.write',
  'support.read',
  'support.write',
  'audit.read',
  'export',
  'usage.read',
  'usage.transcripts',
  'content.read',
  'content.write',
  'content.publish',
  'marketing.read',
  'marketing.write',
  'reports.read',
  'status.read',
  'settings.read',
  'settings.write',
  'marketing.coupons.read',
  'marketing.coupons.write',
  'marketing.coupons.archive',
  'finance.coupon_redemptions.read',
]);

/**
 * The matrix, one row per capability. `usage.*` is this product's name for
 * the reference panel's `simulations.*`: the unit of usage here is a speaking
 * session / a course Lektion. `usage.transcripts` is separate from
 * `usage.read` on purpose — a speaking transcript is a learner's own words,
 * and reading aggregate quality does not require reading what someone said.
 * `export` is separate from `directory.read`: reading a page of users on
 * screen and downloading every user's email are different acts.
 */
const MATRIX = Object.freeze({
  'directory.read':                  ['admin', 'support', 'finance', 'auditor', 'content'],
  'user360.read':                    ['admin', 'support', 'finance', 'auditor'],
  'user360.learning':                ['admin', 'auditor'],
  'entitlement.write':               ['admin'],
  'finance.read':                    ['admin', 'finance', 'auditor'],
  'finance.write':                   ['admin', 'finance'],
  'support.read':                    ['admin', 'support', 'finance', 'auditor'],
  'support.write':                   ['admin', 'support'],
  'audit.read':                      ['admin', 'auditor'],
  'export':                          ['admin', 'finance'],
  'usage.read':                      ['admin', 'support', 'auditor', 'content'],
  'usage.transcripts':               ['admin'],
  'content.read':                    ['admin', 'support', 'auditor', 'content'],
  'content.write':                   ['admin', 'content'],
  'content.publish':                 ['admin', 'content'],
  'marketing.read':                  ['admin', 'finance', 'auditor'],
  'marketing.write':                 ['admin'],
  'reports.read':                    ['admin', 'finance', 'auditor'],
  'status.read':                     ['admin', 'support', 'auditor'],
  'settings.read':                   ['admin', 'auditor'],
  'settings.write':                  ['admin'],
  'marketing.coupons.read':          ['admin', 'finance', 'auditor'],
  'marketing.coupons.write':         ['admin', 'finance'],
  'marketing.coupons.archive':       ['admin', 'finance'],
  'finance.coupon_redemptions.read': ['admin', 'finance', 'auditor'],
});

export const ROLE_DESCRIPTIONS = Object.freeze({
  admin: 'Alles — Obermenge, kein Platzhalter.',
  support: 'Sieht die Menschen und das Gespräch, nicht das Geld und nicht die Lerninhalte im Detail.',
  finance: 'Sieht das Geld, nicht das Lern-Detail. Darf große Rabatte live schalten.',
  auditor: 'Liest alles Operative, schreibt nichts.',
  content: 'Inhalte und Freigabe, ohne Zugriff auf Abrechnung.',
});

export function isRole(role) {
  return ROLES.includes(role);
}

/** The capabilities a role holds, in matrix order. Unknown role → []. */
export function capabilitiesFor(role) {
  if (!isRole(role)) return [];
  return CAPABILITIES.filter((cap) => MATRIX[cap].includes(role));
}

export function hasCapability(role, capability) {
  if (!isRole(role)) return false;
  const holders = MATRIX[capability];
  if (!holders) return false; // an unknown capability is never granted
  return holders.includes(role);
}

/** For the settings screen: the matrix rendered from the enforcement. */
export function roleMatrix() {
  return ROLES.map((role) => ({ role, description: ROLE_DESCRIPTIONS[role], capabilities: capabilitiesFor(role) }));
}

// ---------------------------------------------------------------------------
// Redaction — happens in the audit WRITER, not in the schema. The value of a
// sensitive key is replaced, the key is kept: knowing that a secret changed is
// part of the record, and dropping the key would hide that it exists.
// ---------------------------------------------------------------------------
export const SENSITIVE_KEYS = Object.freeze([
  'password',
  'mfa_secret',
  'push_token_encrypted',
  'access_token',
  'refresh_token',
  'api_key',
  'secret',
  'authorization',
  'service_role_key',
]);

export const REDACTED = '[redigiert]';

function isSensitiveKey(key) {
  const k = String(key).toLowerCase();
  return SENSITIVE_KEYS.some((s) => k === s || k.endsWith(`_${s}`) || k.includes(s));
}

export function redact(value, depth = 0) {
  if (depth > 32) return REDACTED; // a self-referential object must not recurse forever
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = isSensitiveKey(k) ? REDACTED : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

/** Provider references are masked to their last four characters everywhere they appear. */
export function maskRef(ref) {
  if (ref === null || ref === undefined || ref === '') return null;
  const s = String(ref);
  return s.length <= 4 ? `••••${s}` : `••••${s.slice(-4)}`;
}
