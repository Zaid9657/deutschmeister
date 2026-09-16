// Cost-model ban — plan Task 3 (speaking-entitlements-ledger).
//
// The cents/wallet/daily-free model must not resurface anywhere a session is
// started, priced or displayed. These pins replace the legacy cost tests
// rather than keeping them as false compatibility (the plan's own words):
// every speaking charge is seconds in the ledger, decided server-side.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// Comments may explain the old model; what a user or the server ACTS on may
// not. Strip comments the way tests/claims.test.mjs does.
const rendered = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');

test('no speaking surface prices sessions in cents or euros', () => {
  for (const file of [
    'src/pages/SpeakingPage.jsx',
    'src/components/speaking/SpeakingSession.jsx',
    'src/components/LevelTest/LevelTestSpeaking.jsx',
  ]) {
    const body = rendered(read(file));
    assert.doesNotMatch(body, /PRICE_CENTS|balance_cents|cost_cents/, `${file} still carries the cents model`);
    assert.doesNotMatch(body, /speaking_wallet/, `${file} still reads the wallet`);
    assert.doesNotMatch(body, /free today|free left/i, `${file} still advertises daily-free sessions`);
  }
});

test('the client sends wishes, never authority: no price/balance in a start body', () => {
  const page = rendered(read('src/pages/SpeakingPage.jsx'));
  const startBody = page.slice(page.indexOf("action: 'start'"), page.indexOf("action: 'start'") + 700);
  assert.doesNotMatch(startBody, /cents|price|balance/i, 'start payload smuggles pricing');
  assert.match(startBody, /idempotencyKey/, 'start payload lost its idempotency key');
});

test('ends settle through outcome + usedSeconds with an idempotency key', () => {
  const sess = rendered(read('src/components/speaking/SpeakingSession.jsx'));
  assert.match(sess, /outcome: 'completed'/);
  assert.match(sess, /outcome: 'cancelled'/);
  assert.match(sess, /usedSeconds/);
  assert.match(sess, /idempotencyKey/);
});
