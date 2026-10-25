// Guard suite: every customer mail carries List-Unsubscribe and
// List-Unsubscribe-Post, pointing at the same signed link as its footer.
// Run with `npm test`.
//
// Why (review 2026-10-25, C-199): no mailer sent either header. Gmail, which
// reads about 93% of the list, shows its Unsubscribe button only when
// List-Unsubscribe is present, and Resend adds neither header to API sends, so
// "Report spam" was the one click out, on the domain that also sends the
// dunning and confirmation mail. These tests pin, by rule rather than by call
// site:
//   1. every item each of the five customer mailers hands Resend carries both
//      headers (RFC 2369 + RFC 8058), and the header URL is byte-identical to
//      the unsubscribe link in that item's body: the direct function URL with
//      the recipient's signed token;
//   2. ONE builder signs every link (_shared/unsubscribe.mjs): no customer
//      mailer keeps its own HMAC copy, and send-campaign no longer links the
//      /unsubscribe rewrite;
//   3. the link says what it stops — every DeutschMeister mail, not "daily
//      sentences" or "these emails" (unsubscribe.mjs writes one global flag);
//   4. the builder fails closed without a secret and verifies in constant time.
// send-daily-test.mjs keeps its own copy on purpose: it mails only the owner.
//
// Addresses and ids here are synthetic; no real recipient appears.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHmac } from 'node:crypto';

// The mailers read their secrets at import time and fail closed without them.
process.env.UNSUB_SECRET = 'test-only-unsub-secret';
delete process.env.SUPABASE_SERVICE_ROLE_KEY; // no live client in tests

const daily = await import('../netlify/functions/daily-sentence.mjs');
const campaign = await import('../netlify/functions/send-campaign.mjs');
const trial = await import('../netlify/functions/trial-lifecycle.mjs');
const activation = await import('../netlify/functions/activation-lifecycle.mjs');
const course = await import('../netlify/functions/course-reminder.mjs');
const shared = await import('../netlify/functions/_shared/unsubscribe.mjs');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const SITE = 'https://deutsch-meister.de';
const R = { id: '00000000-0000-4000-8000-000000000001', email: 'learner1@example.test', confirmedAt: '2026-08-01T00:00:00.000Z' };
const TOKEN = createHmac('sha256', process.env.UNSUB_SECRET).update(R.id).digest('hex');

/** The five customer mailers, file → the items they hand Resend for recipient R. */
async function customerItems() {
  const bodies = [];
  await daily.sendDailyBatches({
    recipients: [R],
    sentence: { sentence_de: 'Ich habe heute keine Zeit.', level: 'A1', grammar_focus: 'Akkusativ', hint: 'kein or keine?' },
    runDate: '2026-10-25', resendKey: 'test', live: true,
    fetchImpl: async (_url, init) => { bodies.push(...JSON.parse(init.body)); return { ok: true, status: 200, text: async () => '{}' }; },
  });
  return {
    'daily-sentence.mjs': bodies,
    'send-campaign.mjs': campaign.campaignItems([R], ' Launch ', '<p>Body</p>'),
    'trial-lifecycle.mjs': trial.TRIAL_KINDS.map((kind) => trial.mailItem(kind, R)),
    'activation-lifecycle.mjs': Object.keys(activation.WINDOWS).map((kind) => activation.mailItem(kind, R)),
    'course-reminder.mjs': [
      course.reminderItem({ ...R, level: 'a1.1', nextNr: 4 }),
      course.reminderItem({ ...R, level: 'a1.2', checkpointNr: 1 }),
      course.reminderItem({ ...R, level: 'b1.1' }),
    ],
  };
}

const unsubscribeLinks = (html) => [...html.matchAll(/<a href="([^"]*\/unsubscribe\?[^"]*)"[^>]*>([^<]*)<\/a>/g)].map((m) => ({ href: m[1].replace(/&amp;/g, '&'), text: m[2].trim() }));

test('every item of every customer mailer carries both headers, pointing at its own body link', async () => {
  const all = await customerItems();
  assert.deepEqual(Object.keys(all).sort(), ['activation-lifecycle.mjs', 'course-reminder.mjs', 'daily-sentence.mjs', 'send-campaign.mjs', 'trial-lifecycle.mjs']);
  for (const [file, items] of Object.entries(all)) {
    assert.ok(items.length > 0, `${file}: no items built`);
    for (const item of items) {
      const links = unsubscribeLinks(item.html);
      assert.equal(links.length, 1, `${file}: one unsubscribe link in the body`);
      const { href } = links[0];
      assert.deepEqual(Object.keys(item.headers || {}).sort(), ['List-Unsubscribe', 'List-Unsubscribe-Post'], `${file}: ${item.subject}`);
      assert.equal(item.headers['List-Unsubscribe'], `<${href}>`, `${file}: the header must carry the body's own link`);
      assert.equal(item.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click', `${file}: RFC 8058 one-click`);
      const url = new URL(href);
      assert.equal(url.origin, SITE, file);
      assert.equal(url.pathname, '/.netlify/functions/unsubscribe', `${file}: the function itself, so a one-click POST reaches it`);
      assert.equal(url.searchParams.get('uid'), R.id, file);
      assert.equal(url.searchParams.get('token'), TOKEN, `${file}: the recipient's signed token`);
      assert.ok(!href.includes('utm_'), `${file}: the unsubscribe link is never tagged`);
    }
  }
});

test('the course reminder asks for the German page; the English mailers do not', async () => {
  const all = await customerItems();
  for (const [file, items] of Object.entries(all)) {
    for (const item of items) {
      const lang = new URL(unsubscribeLinks(item.html)[0].href).searchParams.get('lang');
      assert.equal(lang, file === 'course-reminder.mjs' ? 'de' : null, file);
    }
  }
});

test('the link says what it stops: every DeutschMeister mail', async () => {
  const all = await customerItems();
  for (const [file, items] of Object.entries(all)) {
    for (const item of items) {
      const { text } = unsubscribeLinks(item.html)[0];
      const expected = file === 'course-reminder.mjs' ? 'E-Mails von DeutschMeister abbestellen' : 'Unsubscribe from DeutschMeister emails';
      assert.equal(text, expected, `${file}: the flag stops every mailer, so the link may not promise less (C-201)`);
    }
  }
});

test('one builder signs every customer link; no mailer keeps its own HMAC copy', () => {
  const fnDir = join(ROOT, 'netlify/functions');
  // send-daily-test.mjs mails only the owner and keeps its own copy on purpose.
  const exempt = new Set(['send-daily-test.mjs', 'unsubscribe.mjs']);
  const builders = readdirSync(fnDir).filter((f) => f.endsWith('.mjs') && !exempt.has(f)).filter((f) => /unsubscribe/i.test(read(`netlify/functions/${f}`)));
  for (const f of ['daily-sentence.mjs', 'send-campaign.mjs', 'trial-lifecycle.mjs', 'activation-lifecycle.mjs', 'course-reminder.mjs']) {
    assert.ok(builders.includes(f), `${f} should be found by the scan`);
  }
  for (const f of builders) {
    const src = read(`netlify/functions/${f}`);
    if (!/unsubscribeUrl\(/.test(src)) continue;
    assert.match(src, /from '\.\/_shared\/unsubscribe\.mjs'/, `${f}: build the link with _shared/unsubscribe.mjs`);
    assert.ok(!/createHmac/.test(src), `${f}: a private HMAC copy of the unsubscribe token`);
    assert.ok(!/function unsubscribeUrl/.test(src), `${f}: a private unsubscribeUrl`);
    assert.match(src, /headers: unsubscribeHeaders\(/, `${f}: every item needs the List-Unsubscribe headers`);
  }
  assert.ok(!read('netlify/functions/send-campaign.mjs').includes('/unsubscribe?uid'), 'send-campaign links the function, not the rewrite');
  assert.ok(!/createHmac/.test(read('netlify/functions/unsubscribe.mjs')), 'the endpoint verifies with the shared helper');
});

test('the builder fails closed without a secret and verifies in constant time', () => {
  assert.equal(shared.unsubscribeSecret({}), null, 'no default secret');
  assert.equal(shared.unsubscribeSecret({ CAMPAIGN_SECRET: 'c' }), 'c');
  assert.equal(shared.unsubscribeSecret({ UNSUB_SECRET: 'u', CAMPAIGN_SECRET: 'c' }), 'u');
  assert.throws(() => shared.unsubscribeToken(R.id, null), /UNSUB_SECRET/);
  assert.equal(shared.unsubscribeToken(R.id), TOKEN);
  assert.equal(shared.unsubscribeUrl(R.id), `${SITE}/.netlify/functions/unsubscribe?uid=${R.id}&token=${TOKEN}`);
  assert.equal(shared.unsubscribeUrl(R.id, { lang: 'de' }), `${SITE}/.netlify/functions/unsubscribe?uid=${R.id}&token=${TOKEN}&lang=de`);
  assert.equal(shared.verifyUnsubscribeToken(R.id, TOKEN), true);
  for (const bad of [null, '', 'zz', TOKEN.slice(1), TOKEN.replace(/^./, (c) => (c === 'a' ? 'b' : 'a'))]) {
    assert.equal(shared.verifyUnsubscribeToken(R.id, bad), false, String(bad));
  }
  assert.equal(shared.verifyUnsubscribeToken(R.id, TOKEN, null), false, 'no secret, no valid token');
  assert.deepEqual(shared.unsubscribeHeaders('https://x.test/u'), { 'List-Unsubscribe': '<https://x.test/u>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' });
});

test('the headers keep the daily batches byte-identical for the idempotency key', async () => {
  const run = async () => {
    const bodies = [];
    await daily.sendDailyBatches({
      recipients: [R], sentence: { sentence_de: 'Hallo.', level: 'A1', grammar_focus: 'x', hint: 'y' }, runDate: '2026-10-25', resendKey: 't', live: true,
      fetchImpl: async (_u, init) => { bodies.push(init.body); return { ok: true, status: 200, text: async () => '{}' }; },
    });
    return bodies;
  };
  assert.deepEqual(await run(), await run());
});
