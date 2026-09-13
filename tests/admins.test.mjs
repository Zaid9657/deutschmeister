// Pins the admin allow-list: the two owner accounts stay admins, matching is
// case-insensitive (Supabase lowercases emails; a sign-up typed in mixed case
// must not be locked out), and nothing else slips through.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_EMAILS, isAdminEmail } from '../src/config/admins.js';

test('both owner accounts are admins', () => {
  assert.ok(isAdminEmail('zaid199660@gmail.com'));
  assert.ok(isAdminEmail('baraawail101@gmail.com'));
  assert.equal(ADMIN_EMAILS.length, 2);
});

test('matching is case-insensitive and whitespace-tolerant', () => {
  assert.ok(isAdminEmail('Baraawail101@gmail.com'));
  assert.ok(isAdminEmail('  BARAAWAIL101@GMAIL.COM '));
});

test('everyone else is not an admin', () => {
  assert.equal(isAdminEmail('someone@example.com'), false);
  assert.equal(isAdminEmail(undefined), false);
  assert.equal(isAdminEmail(null), false);
  assert.equal(isAdminEmail(''), false);
});
