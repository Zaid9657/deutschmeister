// Privacy pins for the speaking rebuild — plan Task 5
// (speaking-entitlements-ledger) + spec §9.1: raw audio is never retained,
// transcripts are not analytics, and money-shaped records carry counts, not
// content.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('the reconcile job records counts only, never transcript text', () => {
  const src = read('netlify/functions/reconcile-speaking-reservations.mjs');
  assert.doesNotMatch(src, /speaking_messages|content|transcript_text/, 'reconcile touches conversation content');
  assert.match(src, /reconcile:\$\{token\}|reconcile:\$\{sessionToken\}/, 'reconcile idempotency key missing');
});

test('the admin user360 default response carries seconds, reservations and ledger kinds — no cents, no words', () => {
  const src = read('netlify/functions/admin-user360.mjs');
  assert.doesNotMatch(src, /balance_cents|speaking_wallet/, 'the cents wallet resurfaced in admin');
  assert.match(src, /monthlySeconds/);
  assert.match(src, /activeReservations/);
  assert.match(src, /recentLedger/);
  // The learning panel promise ("keine Transkripte") must hold: no
  // speaking_messages read anywhere in the default panels.
  assert.doesNotMatch(src, /speaking_messages/);
});

test('ledger metadata never carries learner speech', () => {
  const sql = read('migrations/2026-09-16-speaking-allowances.sql');
  // Every jsonb_build_object written into the ledger carries op keys and
  // source refs only — pin the full set of metadata keys in the migration.
  const keys = [...sql.matchAll(/jsonb_build_object\(([^)]*)\)/g)]
    .flatMap((m) => [...m[1].matchAll(/'([a-zA-Z_]+)'/g)].map((k) => k[1]));
  const allowed = new Set(['op_key', 'source', 'source_ref', 'bucketId', 'replayed', 'grantedSeconds', 'remainingSeconds', 'revokedSeconds', 'sessionToken', 'reservedSeconds', 'consumedSeconds', 'refundedSeconds', 'status', 'balance', 'monthlySeconds', 'permanentSeconds', 'totalSeconds']);
  for (const key of keys) {
    assert.ok(allowed.has(key), `unexpected ledger/summary metadata key: ${key}`);
  }
});

test('speaking analytics surfaces send no audio, transcript or learner utterance', () => {
  for (const file of ['src/pages/SpeakingPage.jsx', 'src/components/speaking/SpeakingSession.jsx']) {
    const src = read(file);
    // posthog/capture calls in the speaking UI may not include message
    // content fields.
    const captures = [...src.matchAll(/capture\([^)]*\)/g)].map((m) => m[0]);
    for (const call of captures) {
      assert.doesNotMatch(call, /content|transcript|audioBase64|messages/, `${file}: analytics call carries conversation content`);
    }
  }
});

test('the azure adapter and structured turn never log audio, headers or recognized text', () => {
  const azure = read('netlify/functions/_shared/azurePronunciation.mjs');
  const logs = [...azure.matchAll(/console\.\w+\([^)]*\)/g)].map((m) => m[0]);
  for (const call of logs) {
    assert.doesNotMatch(call, /wavBuffer|headers|referenceText|json|body/, `azure adapter logs content: ${call}`);
  }
});
