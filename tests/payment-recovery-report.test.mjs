import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql = readFileSync(new URL('../docs/agents/payment-recovery.sql', import.meta.url), 'utf8');
const query = sql.replace(/--[^\n]*/g, '');
test('recovery packet is read-only, per-invoice, per-currency and never joins a different renewal payment', () => {
  assert.doesNotMatch(query, /\b(insert|update|delete|create|alter|drop|grant|revoke|truncate|call)\b/i);
  assert.match(query, /group by invoice_id/);
  assert.match(query, /s.invoice_id = c.invoice_id and s.subscription_id = c.subscription_id/);
  assert.match(query, /s.observed_at >= c.failed_at/);
  assert.match(query, /billing_reason = 'renewal'/);
  assert.match(query, /group by currency, recovery_state, delivery_state/);
  assert.match(query, /balance_unknown_invoices/);
  assert.match(query, /count\(distinct amount\) = 1/);
  assert.match(query, /subscription_payment_recovered/);
  assert.match(query, /test_mode/);
});
test('API acceptance is never relabelled delivery and output contains no customer identifiers', () => {
  assert.match(query, /receipts r on r.provider_id = a.provider_id/);
  assert.match(query, /accepted_delivery_unknown/);
  assert.match(query, /select null::text, null::timestamptz where false/);
  const output = query.slice(query.lastIndexOf('select currency,'));
  assert.doesNotMatch(output, /user_id|invoice_id|subscription_id|email/);
  assert.match(output, /paid_after_verified_delivery/);
});
