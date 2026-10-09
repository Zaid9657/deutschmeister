// Guard suite for the links inside the daily-sentence email. Run with `npm test`.
//
// The daily sentence is about 95% of the mail deutsch-meister.de sends (~1,100 a
// day), and until 2026-10-02 its links carried no tag. A click therefore reached
// the site as "no referrer" or as a webmail host, and nothing downstream could
// say it came from this email: not dm_attribution, not PostHog, not
// xray_usage.source. These tests pin four things:
//   1. every link into the site carries the daily-sentence UTM tags;
//   2. the unsubscribe link is untouched: no tag, same function path, same
//      signed token;
//   3. the X-Ray link uses the canonical /analyze/ path and hands the page
//      exactly the sentence that was mailed, for every sentence in the rotation;
//   4. public/attribution.js (the one classifier, run as-is under node:vm) reads
//      the tags back as source "email" without losing any label.
//
// Addresses here are synthetic (`@example.test`); no real recipient appears.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHmac } from 'node:crypto';
import vm from 'node:vm';

// The module reads its secrets at import time and fails closed without them.
process.env.UNSUB_SECRET = 'test-only-unsub-secret';
delete process.env.SUPABASE_SERVICE_ROLE_KEY; // no live client in tests
const { sendDailyBatches, analyzeUrl, DAILY_UTM } = await import('../netlify/functions/daily-sentence.mjs');
const { isSocialHref } = await import('../netlify/functions/_shared/socialLinks.mjs');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const SENTENCES = JSON.parse(read('netlify/functions/data/daily-sentences.json'));
const SITE = 'https://deutsch-meister.de';

const RECIPIENT = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'learner1@example.test',
  confirmedAt: '2026-08-01T00:00:00.000Z',
};

/** The HTML of one live email, built by the real batch builder. */
async function mailedHtml(sentence = SENTENCES[0]) {
  const bodies = [];
  const fetchImpl = async (_url, init) => {
    bodies.push(init.body);
    return { ok: true, status: 200, text: async () => '{"data":[]}' };
  };
  await sendDailyBatches({
    recipients: [RECIPIENT], sentence, runDate: '2026-10-02', resendKey: 'test', live: true, fetchImpl,
  });
  assert.equal(bodies.length, 1);
  const [item] = JSON.parse(bodies[0]);
  return item.html;
}

// Social-channel links leave the site, so they carry no utm_* tags; they are
// pinned separately in tests/email-social.test.mjs and skipped here.
const hrefs = (html) => [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]).filter((h) => !isSocialHref(h));
const isUnsubscribe = (href) => new URL(href).pathname === '/.netlify/functions/unsubscribe';

/** public/attribution.js run against a fake window, as tests/attribution.test.mjs does. */
function attribution() {
  const window = { localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, location: { search: '', pathname: '/' } };
  const ctx = { window, document: { referrer: '' }, URL, URLSearchParams, Date, JSON };
  vm.createContext(ctx);
  vm.runInContext(read('public/attribution.js'), ctx);
  return window.dmAttribution;
}

test('every link into the site carries the daily-sentence UTM tags', async () => {
  const links = hrefs(await mailedHtml()).filter((h) => !isUnsubscribe(h));
  assert.ok(links.length >= 2, 'the X-Ray button and the footer link');
  for (const href of links) {
    assert.ok(href.startsWith(`${SITE}/`), `site link: ${href}`);
    const p = new URL(href).searchParams;
    assert.equal(p.get('utm_source'), 'email', href);
    assert.equal(p.get('utm_medium'), 'daily', href);
    assert.equal(p.get('utm_campaign'), 'daily-sentence', href);
    assert.ok(p.get('utm_content'), `${href} names which link was clicked`);
  }
  const contents = links.map((h) => new URL(h).searchParams.get('utm_content'));
  assert.equal(new Set(contents).size, contents.length, 'each link has its own utm_content');
});

test('the unsubscribe link is untouched: no tag, same path, same signed token', async () => {
  const unsub = hrefs(await mailedHtml()).filter(isUnsubscribe);
  assert.equal(unsub.length, 1);
  const token = createHmac('sha256', process.env.UNSUB_SECRET).update(RECIPIENT.id).digest('hex');
  assert.equal(unsub[0], `${SITE}/.netlify/functions/unsubscribe?uid=${RECIPIENT.id}&token=${token}`);
  assert.ok(!unsub[0].includes('utm_'));
});

test('the X-Ray link opens /analyze/ with exactly the mailed sentence, for every sentence in the rotation', async () => {
  assert.ok(SENTENCES.length > 0);
  for (const s of [...SENTENCES, { sentence_de: 'Was kostet das? Äpfel & Birnen, 50 % #1 + Steuer.' }]) {
    const url = new URL(analyzeUrl(s.sentence_de));
    assert.equal(url.origin, SITE);
    assert.equal(url.pathname, '/analyze/', 'prerendered route: trailing slash (CLAUDE.md case 2)');
    assert.equal(url.searchParams.get('s'), s.sentence_de);
    assert.equal(url.hash, '');
  }
  const html = await mailedHtml(SENTENCES[0]);
  assert.ok(hrefs(html).includes(analyzeUrl(SENTENCES[0].sentence_de)), 'the button uses analyzeUrl()');
});

test('the classifier reads the tags back without losing a label', () => {
  const { parse } = attribution();
  const touch = parse(new URL(analyzeUrl(SENTENCES[0].sentence_de)).search, '', '/analyze/', Date.UTC(2026, 9, 2));
  assert.equal(touch.source, 'email');
  assert.equal(touch.medium, 'daily');
  assert.equal(touch.campaign, 'daily-sentence');
  assert.equal(touch.content, 'xray');
  // Every label stays inside what BOTH readers pass through unchanged:
  // attribution.js keeps [a-z0-9._/ -] (stripping the rest) and xraySource.mjs
  // voids a whole label outside [a-z0-9._:/-]. Both keep "_"; hyphens are the
  // house convention, so this pins the narrower [a-z0-9.-].
  for (const [, v] of new URLSearchParams(DAILY_UTM)) assert.match(v, /^[a-z0-9.-]+$/);
});

test('the links are fixed strings, so a retry rebuilds the same bytes', async () => {
  assert.equal(await mailedHtml(), await mailedHtml());
  assert.ok(!/utm_[a-z]+=[^&"]*\d{4}-\d{2}-\d{2}/.test(await mailedHtml()), 'no date or clock in a tag');
});

// Pins what the comments above say (corrected 2026-10-03): hyphens are a house
// convention, not a limit of either reader. An earlier comment here and in
// daily-sentence.mjs claimed both readers drop "_"; neither does.
test('both label readers keep "_": the hyphen rule is a convention, not a parser limit', async () => {
  const { parse } = attribution();
  const now = Date.UTC(2026, 9, 3);
  const touch = parse('?utm_source=email&utm_medium=daily&utm_campaign=daily_sentence&utm_content=x_ray', '', '/analyze/', now);
  assert.equal(touch.campaign, 'daily_sentence');
  assert.equal(touch.content, 'x_ray');
  // attribution.js strips a character outside its set and keeps the rest
  assert.equal(parse('?utm_source=email&utm_campaign=daily!sentence', '', '/', now).campaign, 'dailysentence');

  const { cleanSource } = await import('../netlify/functions/_shared/xraySource.mjs');
  assert.equal(cleanSource({ first: 'daily_sentence' }).first, 'daily_sentence');
  // xraySource never strips: one character outside its set voids the whole label
  assert.equal(cleanSource({ ref: 'email', first: 'daily sentence' }).first, null);
});
