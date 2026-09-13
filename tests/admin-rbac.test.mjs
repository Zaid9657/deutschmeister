// Admin panel, phase 1 — the permission model and the record.
//
//   1. The capability matrix, every role × every capability, both directions,
//      pinned as data so a change is a deliberate diff.
//   2. `admin` is a superset of every other role; `auditor` writes nothing.
//   3. redact() keeps keys and replaces values, recursively; maskRef masks.
//   4. writeAudit maps a unique violation to { duplicate: true } and never throws.
//   5. requireCapability audits a denial and fails closed on an unreadable role.
//   6. The migration freezes profiles.role for non-service callers and revokes
//      UPDATE/DELETE on admin_audit_log.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  ROLES, CAPABILITIES, capabilitiesFor, hasCapability, roleMatrix, redact, maskRef, REDACTED,
} from '../netlify/functions/_shared/adminRbacLib.mjs';
import { writeAudit, requireCapability } from '../netlify/functions/_shared/adminRbac.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const EXPECTED = {
  admin: CAPABILITIES,
  support: ['directory.read', 'user360.read', 'support.read', 'support.write', 'usage.read', 'content.read', 'status.read'],
  finance: ['directory.read', 'user360.read', 'finance.read', 'finance.write', 'support.read', 'export', 'marketing.read', 'reports.read', 'marketing.coupons.read', 'marketing.coupons.write', 'marketing.coupons.archive', 'finance.coupon_redemptions.read'],
  auditor: ['directory.read', 'user360.read', 'user360.learning', 'finance.read', 'support.read', 'audit.read', 'usage.read', 'content.read', 'marketing.read', 'reports.read', 'status.read', 'settings.read', 'marketing.coupons.read', 'finance.coupon_redemptions.read'],
  content: ['directory.read', 'usage.read', 'content.read', 'content.write', 'content.publish'],
};

test('the capability matrix is exactly the pinned one, in both directions', () => {
  assert.deepEqual([...ROLES], Object.keys(EXPECTED));
  for (const role of ROLES) {
    assert.deepEqual(capabilitiesFor(role), [...EXPECTED[role]], `capabilities of ${role}`);
    for (const cap of CAPABILITIES) {
      assert.equal(hasCapability(role, cap), EXPECTED[role].includes(cap), `${role} × ${cap}`);
    }
  }
});

test('admin is a superset, auditor writes nothing, unknown roles and capabilities are denied', () => {
  for (const role of ROLES) for (const cap of capabilitiesFor(role)) assert.ok(hasCapability('admin', cap));
  assert.ok(capabilitiesFor('auditor').every((c) => !/\.(write|publish|archive)$/.test(c) && c !== 'export' && c !== 'entitlement.write'));
  assert.equal(hasCapability(null, 'directory.read'), false);
  assert.equal(hasCapability('none', 'directory.read'), false);
  assert.equal(hasCapability('admin', 'does.not.exist'), false);
  assert.deepEqual(capabilitiesFor(undefined), []);
  assert.equal(roleMatrix().length, ROLES.length);
});

test('redact keeps keys, replaces values, recurses through arrays and objects', () => {
  const out = redact({
    email: 'a@b.c',
    password: 'hunter2',
    nested: { api_key: 'k', list: [{ refresh_token: 't', ok: 1 }] },
    Authorization: 'Bearer x',
  });
  assert.deepEqual(out, {
    email: 'a@b.c',
    password: REDACTED,
    nested: { api_key: REDACTED, list: [{ refresh_token: REDACTED, ok: 1 }] },
    Authorization: REDACTED,
  });
  assert.equal(maskRef('2333953'), '••••3953');
  assert.equal(maskRef(null), null);
});

function fakeSupabase({ insertError = null, profile = { role: 'support', email: 'x@y.z' }, profileError = null } = {}) {
  const inserted = [];
  return {
    inserted,
    from(table) {
      if (table === 'admin_audit_log') {
        return {
          insert(row) {
            inserted.push(row);
            return { select: () => ({ maybeSingle: async () => (insertError ? { error: insertError } : { data: { id: 'a1' } }) }) };
          },
        };
      }
      if (table === 'profiles') {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile, error: profileError }) }) }) };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

test('writeAudit: duplicate idempotency key is a success, other errors are returned, never thrown', async () => {
  const dup = fakeSupabase({ insertError: { code: '23505', message: 'dup' } });
  assert.deepEqual(await writeAudit(dup, { actorId: 'u', actorRole: 'admin', action: 'x', targetType: 't', outcome: 'success', idempotencyKey: 'k' }), { duplicate: true });
  const err = fakeSupabase({ insertError: { code: '42P01', message: 'boom' } });
  assert.deepEqual(await writeAudit(err, { actorId: 'u', actorRole: 'admin', action: 'x', targetType: 't', outcome: 'success' }), { error: 'boom' });
  const ok = fakeSupabase();
  const res = await writeAudit(ok, { actorId: 'u', actorRole: 'admin', action: 'x', targetType: 't', outcome: 'success', before: { password: 'p' } });
  assert.deepEqual(res, { id: 'a1' });
  assert.equal(ok.inserted[0].before_state.password, REDACTED);
});

test('requireCapability: 401 without a token, 403 + denied audit row without the capability, 500 when the role is unreadable', async () => {
  const headers = {};
  const noToken = await requireCapability({ headers: {}, path: '/x' }, fakeSupabase(), 'directory.read', headers);
  assert.equal(noToken.response.statusCode, 401);

  const asUser = { resolveUser: async () => ({ userId: 'u1' }) };
  const sb = fakeSupabase({ profile: { role: 'support', email: 's@x.y' } });
  const denied = await requireCapability({ headers: {}, path: '/.netlify/functions/admin-ops' }, sb, 'finance.read', headers, asUser);
  assert.equal(denied.response.statusCode, 403);
  assert.equal(JSON.parse(denied.response.body).requiredCapability, 'finance.read');
  assert.equal(sb.inserted.length, 1, 'the denial must be audited before it is returned');
  assert.equal(sb.inserted[0].action, 'denied.finance.read');
  assert.equal(sb.inserted[0].outcome, 'denied');
  assert.equal(sb.inserted[0].actor_role, 'support');

  const ok = await requireCapability({ headers: {}, path: '/x' }, fakeSupabase(), 'support.read', headers, asUser);
  assert.equal(ok.role, 'support');
  assert.deepEqual(ok.capabilities, capabilitiesFor('support'));

  const noRole = await requireCapability({ headers: {}, path: '/x' }, fakeSupabase({ profile: { role: null } }), null, headers, asUser);
  assert.equal(noRole.response.statusCode, 403, 'a learner without a role gets 403 even for the session endpoint');

  const unreadable = await requireCapability({ headers: {}, path: '/x' }, fakeSupabase({ profileError: { message: 'db down' } }), 'support.read', headers, asUser);
  assert.equal(unreadable.response.statusCode, 500, 'an unreadable role fails closed');
});

test('the foundation migration freezes profiles.role and makes the audit log append-only', () => {
  const sql = read('migrations/2026-09-13-admin-panel-foundation.sql');
  assert.ok(/NEW\.role\s+:=\s+OLD\.role/.test(sql), 'UPDATE must keep OLD.role for non-service callers');
  assert.ok(/NEW\.role\s+:=\s+NULL/.test(sql), 'INSERT must null the role for non-service callers');
  assert.ok(/CHECK \(role IS NULL OR role IN \('admin', 'support', 'finance', 'auditor', 'content'\)\)/.test(sql));
  assert.ok(/ALTER TABLE public\.admin_audit_log ENABLE ROW LEVEL SECURITY/.test(sql));
  assert.ok(!/CREATE POLICY[^;]*admin_audit_log/i.test(sql), 'no client policy may exist on admin_audit_log');
  assert.ok(/REVOKE UPDATE, DELETE, TRUNCATE ON public\.admin_audit_log FROM anon, authenticated/.test(sql));
  assert.ok(/actor_id uuid NOT NULL/.test(sql), 'an audit entry must name its actor');
  const readme = read('migrations/README.md');
  assert.ok(readme.includes('2026-09-13-admin-panel-foundation.sql'), 'the migration ledger must list the file');
});
