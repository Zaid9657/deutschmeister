// LS fee report (c6): aggregates per window/resource/currency from synthetic
// Lemon Squeezy attributes. No network; never infers a fee the API does not expose.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { aggregateLsMoney, formatLines, feeOf } from '../scripts/ls-fees.mjs';

const NOW = new Date('2026-10-28T12:00:00Z');
const daysAgo = (d) => new Date(NOW.getTime() - d * 86_400_000).toISOString();
const order = (d, extra = {}) => ({
  resource: 'orders',
  attributes: { created_at: daysAgo(d), currency: 'EUR', status: 'paid', test_mode: false,
    total: 4900, tax: 782, refunded_amount: 0, setup_fee: 0, ...extra },
});
const invoice = (d, extra = {}) => ({
  resource: 'subscription-invoices',
  attributes: { created_at: daysAgo(d), currency: 'EUR', status: 'paid', test_mode: false,
    total: 999, tax: 160, refunded_amount: 0, ...extra },
});

test('windows split by created_at; tests, unsettled and old rows stay out', () => {
  const s = aggregateLsMoney([
    order(1), order(10, { status: 'refunded', refunded_amount: 4900 }),
    order(2, { test_mode: true }), order(3, { status: 'failed' }), order(40),
    invoice(5), invoice(20, { currency: 'USD', total: 1099, tax: 0 }),
  ], { now: NOW });
  assert.deepEqual(s.windows[7].orders.EUR,
    { count: 1, gross: 4900, tax: 782, refunds: 0, fees: 0, feeMissing: 1, amountMissing: 0 });
  assert.equal(s.windows[30].orders.EUR.count, 2);
  assert.equal(s.windows[30].orders.EUR.refunds, 4900);
  assert.equal(s.windows[7]['subscription-invoices'].USD, undefined);
  assert.equal(s.windows[30]['subscription-invoices'].USD.gross, 1099);
  assert.deepEqual(s.excluded, { test: 1, status: 1, undated: 0 });
  assert.equal(s.feeExposed, false);
});

test('missing fee is UNKNOWN, never a tariff; setup_fee is not the LS fee', () => {
  assert.deepEqual(feeOf({ setup_fee: 500 }), { exposed: false, cents: null });
  const lines = formatLines(aggregateLsMoney([order(1, { setup_fee: 500 })], { now: NOW }));
  assert.match(lines[0], /^LS API 7d \[EUR\] orders: live 1; gross 49\.00; tax 7\.82; refunds 0\.00; fees UNKNOWN \(fee not exposed by the API; missing 1\/1\)\.$/);
  assert.match(lines.at(-1), /never add the two lines/);
});

test('an exposed numeric fee is summed; partial coverage stays flagged', () => {
  const s = aggregateLsMoney([order(1, { fee: 295 }), order(2)], { now: NOW });
  assert.equal(s.feeExposed, true);
  assert.equal(s.windows[7].orders.EUR.fees, 295);
  assert.equal(s.windows[7].orders.EUR.feeMissing, 1);
  assert.match(formatLines(s)[0], /fees 2\.95 known, UNKNOWN for 1\/2/);
  const full = formatLines(aggregateLsMoney([order(1, { fee: 295 })], { now: NOW }));
  assert.match(full[0], /fees 2\.95\.$/);
});

test('output carries aggregates only and the script stays GET-only', () => {
  const row = order(1, { user_email: 'x@example.invalid', user_name: 'Synthetic Name', identifier: 'abc-123' });
  const text = formatLines(aggregateLsMoney([row], { now: NOW })).join('\n')
    + JSON.stringify(aggregateLsMoney([row], { now: NOW }));
  assert.doesNotMatch(text, /example\.invalid|Synthetic Name|abc-123/);
  const source = readFileSync(new URL('../scripts/ls-fees.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /method:\s*'(?:POST|PATCH|PUT|DELETE)'|writeFile|appendFile/);
  assert.match(source, /method: 'GET'/);
});
