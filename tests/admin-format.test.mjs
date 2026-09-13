// Admin panel formatters: absence is '—', zero is '0', dates never print
// "Invalid Date", German inputs parse as German.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { num, pct, pct100, money, dmy, hm, mmss, ago, parseGermanDate, parseAmountToMinor } from '../src/lib/admin/adminFormat.js';

test('null → —, 0 → 0, de-DE grouping', () => {
  assert.equal(num(null), '—');
  assert.equal(num(undefined), '—');
  assert.equal(num(0), '0');
  assert.equal(num(1234567), '1.234.567');
  assert.equal(num(12.345, 1), '12,3');
});

test('pct takes a fraction, pct100 a percentage, both refuse a missing value', () => {
  assert.equal(pct(0.413), '41,3 %');
  assert.equal(pct(0.413, 1, 11), '41 %'); // no decimal below 100 units
  assert.equal(pct(null), '—');
  assert.equal(pct(0), '0,0 %');
  assert.equal(pct100(41.3), '41,3 %');
  assert.equal(pct100(null), '—');
});

test('money is minor units, per currency', () => {
  assert.equal(money(198905), '1.989,05\u00A0€');
  assert.equal(money(0), '0,00\u00A0€');
  assert.equal(money(1379, 'USD'), '13,79\u00A0$');
  assert.equal(money(null), '—');
  assert.equal(money(48900, 'EUR', false), '489\u00A0€');
});

test('dates: dd.mm.yyyy, never Invalid Date', () => {
  assert.equal(dmy('2026-09-13T10:00:00Z'), '13.09.2026');
  assert.equal(hm('2026-09-13T10:05:00Z'), '13.09.2026 10:05');
  assert.equal(dmy('nonsense'), '—');
  assert.equal(dmy(null), '—');
  assert.equal(mmss(725), '12:05 min');
  assert.equal(mmss(null), '—');
  assert.equal(ago('2026-09-13T10:00:00Z', Date.parse('2026-09-13T10:03:00Z')), 'vor 3 Min.');
});

test('German date and amount inputs parse; English-format traps do not slip through', () => {
  assert.equal(parseGermanDate('31.12.2026'), '2026-12-31T00:00:00.000Z');
  assert.equal(parseGermanDate('31.12.2026 14:30'), '2026-12-31T14:30:00.000Z');
  assert.equal(parseGermanDate('31.02.2026'), null);
  assert.equal(parseGermanDate(''), null);
  assert.equal(parseAmountToMinor('24,99'), 2499);
  assert.equal(parseAmountToMinor('1.234,50'), 123450);
  assert.equal(parseAmountToMinor('24.99'), 2499);
  assert.equal(parseAmountToMinor('abc'), null);
  assert.equal(parseAmountToMinor('12,345'), null);
});
