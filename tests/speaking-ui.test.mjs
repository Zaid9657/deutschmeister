// Balance-display contract for the speaking setup screen — plan Task 3.
//
// Balances are shown as human-readable minutes with the two sources labeled
// separately when both exist (monthly expires, permanent does not — one
// aggregated number would mislead), and the page keeps seconds internally.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/pages/SpeakingPage.jsx', import.meta.url), 'utf8');

test('the page reads the seconds balance from the server read-model', () => {
  assert.match(page, /monthlySeconds/);
  assert.match(page, /permanentSeconds/);
  assert.match(page, /totalSeconds/);
  assert.match(page, /check-speaking-usage/);
});

test('both balances render with their own labels when both exist', () => {
  assert.match(page, /Monthly allowance/);
  assert.match(page, /Permanent minutes/);
});

test('minutes are displayed, seconds are kept', () => {
  assert.match(page, /function fmtMinutes\(seconds\)/);
  assert.match(page, /fmtMinutes\(balance\.totalSeconds\)/);
});

test('a start the balance cannot cover is disabled with an honest notice', () => {
  assert.match(page, /balance\.totalSeconds >= GUIDED_SECONDS/);
  assert.match(page, /Not enough speaking time left/);
});

test('an included course attempt is visible and overrides the balance gate', () => {
  assert.match(page, /includedAttemptForSelection/);
  assert.match(page, /first attempt is included/);
});
