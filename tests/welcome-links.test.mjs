// Guard suite for the site links in the welcome mail and the confirmation nudge.
// Run with `npm test`.
//
// The welcome mail (send-welcome-email, fired on every signup) linked to
// /analyze/ and the homepage untagged, and so did the nudge's footer. A click
// reached the site as "no referrer" or as a webmail host. Since 2026-10-06 both
// tag their site links the way tests/lifecycle-links.test.mjs pins for the
// trial and activation mails. These tests pin:
//   1. every site link carries utm_source=email, utm_medium=lifecycle, the
//      mail's campaign and its own utm_content;
//   2. the CTA still opens /analyze/ (trailing slash, CLAUDE.md case 2) and the
//      footer opens the homepage;
//   3. the nudge's button, a function URL with a signed token, is passed
//      through byte for byte and never tagged;
//   4. the labels are fixed strings (no id, address or date), so the recipient
//      never leaks into a link and the same mail renders the same bytes;
//   5. public/attribution.js (run as-is under node:vm) reads the tags back.
//
// Addresses and ids here are synthetic; no real recipient appears.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

process.env.UNSUB_SECRET = process.env.UNSUB_SECRET || 'test-only-unsub-secret';
delete process.env.SUPABASE_SERVICE_ROLE_KEY; // no live client in tests
const welcome = await import('../netlify/functions/send-welcome-email.mjs');
const nudge = await import('../netlify/functions/confirmation-nudge.mjs');
const { EMAIL_LABEL } = await import('../netlify/functions/_shared/emailLinks.mjs');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const SITE = 'https://deutsch-meister.de';
const USER_ID = '00000000-0000-4000-8000-000000000001';
const ADDRESS = 'learner@example.com';
const CONTINUE = `${SITE}/.netlify/functions/confirm-continue?uid=${USER_ID}&exp=1790000000&token=abc123`;

const hrefs = (html) => [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
const isFunction = (href) => new URL(href).pathname.startsWith('/.netlify/functions/');

// The expected links per mail, written out rather than derived, so a renamed
// campaign or a moved CTA fails here instead of passing silently.
const MAILS = {
  welcome: { html: () => welcome.welcomeHtml(ADDRESS), campaign: 'welcome', links: { cta: '/analyze/', footer: '/' } },
  'confirm-nudge': { html: () => nudge.bodyHtml(CONTINUE), campaign: 'confirm-nudge', links: { footer: '/' } },
};

function attribution() {
  const window = { localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, location: { search: '', pathname: '/' } };
  const ctx = { window, document: { referrer: '' }, URL, URLSearchParams, Date, JSON };
  vm.createContext(ctx);
  vm.runInContext(read('public/attribution.js'), ctx);
  return window.dmAttribution;
}

test('every site link carries the lifecycle tags, one utm_content per link, on the page it opened before', () => {
  for (const [name, { html, campaign, links }] of Object.entries(MAILS)) {
    const site = hrefs(html()).filter((h) => !isFunction(h));
    assert.equal(site.length, Object.keys(links).length, `${name}: site links`);
    const byContent = {};
    for (const href of site) {
      const url = new URL(href);
      assert.equal(url.origin, SITE, `${name}: ${href}`);
      assert.equal(url.hash, '', `${name}: ${href}`);
      assert.equal(url.searchParams.get('utm_source'), 'email', href);
      assert.equal(url.searchParams.get('utm_medium'), 'lifecycle', href);
      assert.equal(url.searchParams.get('utm_campaign'), campaign, href);
      byContent[url.searchParams.get('utm_content')] = url.pathname;
    }
    assert.deepEqual(byContent, links, `${name}: each link names itself and keeps its page`);
  }
});

test('the nudge button (a signed function URL) is passed through byte for byte and never tagged', () => {
  const fn = hrefs(nudge.bodyHtml(CONTINUE)).filter(isFunction);
  assert.deepEqual(fn, [CONTINUE]);
  assert.ok(!fn[0].includes('utm_'));
  // The welcome mail has no function link at all (no unsubscribe, no token).
  assert.deepEqual(hrefs(welcome.welcomeHtml(ADDRESS)).filter(isFunction), []);
});

test('labels are fixed strings: no id, address or date, and the recipient never reaches a link', () => {
  for (const [name, { html }] of Object.entries(MAILS)) {
    const out = html();
    assert.equal(out, html(), `${name}: deterministic`);
    for (const href of hrefs(out).filter((h) => !isFunction(h))) {
      for (const [key, value] of new URL(href).searchParams) {
        assert.ok(key.startsWith('utm_'), `${name}: only utm_ keys on a site link (${key})`);
        assert.match(value, EMAIL_LABEL, `${name}: ${key}=${value}`);
        assert.ok(!/\d{4}-\d{2}-\d{2}/.test(value), `${name}: no date in ${key}`);
        assert.ok(!value.includes(USER_ID) && !value.includes('@'), `${name}: no id or address in ${key}`);
      }
    }
  }
  // The welcome template takes the address but must not print it anywhere.
  assert.ok(!welcome.welcomeHtml(ADDRESS).includes(ADDRESS));
  assert.equal(welcome.welcomeHtml(ADDRESS), welcome.welcomeHtml('someone-else@example.org'));
});

test('the classifier reads the tags back without losing a label', () => {
  const { parse } = attribution();
  for (const [name, { html, campaign }] of Object.entries(MAILS)) {
    for (const href of hrefs(html()).filter((h) => !isFunction(h))) {
      const url = new URL(href);
      const touch = parse(url.search, '', url.pathname, Date.UTC(2026, 9, 6));
      assert.equal(touch.source, 'email', `${name}: ${href}`);
      assert.equal(touch.medium, 'lifecycle', `${name}: ${href}`);
      assert.equal(touch.campaign, campaign, `${name}: ${href}`);
      assert.equal(touch.content, url.searchParams.get('utm_content'), `${name}: ${href}`);
    }
  }
});
