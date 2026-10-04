// Guard suite for the links inside the trial and activation lifecycle emails.
// Run with `npm test`.
//
// Until 2026-10-04 only the daily sentence tagged its links (#176). The five
// lifecycle mails (trial_day3, trial_day6, trial_ended, activation_d1,
// activation_d4) linked to /analyze/, /pricing/, /level-test/ and the homepage
// untagged, so a click reached the site as "no referrer" or as a webmail host,
// and a trial reader who opened /pricing/ from the day-6 mail looked like
// untracked traffic. These tests pin, for every lifecycle kind:
//   1. every link into the site carries utm_source=email, utm_medium=lifecycle,
//      utm_campaign=<the kind, hyphenated> and its own utm_content;
//   2. the unsubscribe link is untouched: no tag, same function path, same
//      signed token;
//   3. the CTA still opens the page it opened before (same origin and path,
//      trailing slash kept) and the footer opens the homepage;
//   4. the labels follow the naming rule and are fixed strings (no id, address
//      or date), so the same mail renders the same bytes;
//   5. public/attribution.js (the one classifier, run as-is under node:vm) reads
//      the tags back as source "email" without losing a label.
//
// Addresses and ids here are synthetic; no real recipient appears.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHmac } from 'node:crypto';
import vm from 'node:vm';

// The mailers read their secrets at import time and fail closed without them.
process.env.UNSUB_SECRET = 'test-only-unsub-secret';
delete process.env.SUPABASE_SERVICE_ROLE_KEY; // no live client in tests
const trial = await import('../netlify/functions/trial-lifecycle.mjs');
const activation = await import('../netlify/functions/activation-lifecycle.mjs');
const { EMAIL_LABEL, tagEmailLink } = await import('../netlify/functions/_shared/emailLinks.mjs');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const SITE = 'https://deutsch-meister.de';
const USER_ID = '00000000-0000-4000-8000-000000000001';

// The expected campaign and CTA page per kind, written out rather than derived,
// so a renamed kind or a moved CTA fails here instead of passing silently.
const EXPECTED = {
  trial_day3: { render: trial.renderHtml, campaign: 'trial-day3', cta: '/analyze/' },
  trial_day6: { render: trial.renderHtml, campaign: 'trial-day6', cta: '/pricing/' },
  trial_ended: { render: trial.renderHtml, campaign: 'trial-ended', cta: '/pricing/' },
  activation_d1: { render: activation.renderHtml, campaign: 'activation-d1', cta: '/level-test/' },
  activation_d4: { render: activation.renderHtml, campaign: 'activation-d4', cta: '/analyze/' },
};

const hrefs = (html) => [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
const isUnsubscribe = (href) => new URL(href).pathname === '/.netlify/functions/unsubscribe';

/** public/attribution.js run against a fake window, as tests/attribution.test.mjs does. */
function attribution() {
  const window = { localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, location: { search: '', pathname: '/' } };
  const ctx = { window, document: { referrer: '' }, URL, URLSearchParams, Date, JSON };
  vm.createContext(ctx);
  vm.runInContext(read('public/attribution.js'), ctx);
  return window.dmAttribution;
}

test('the table above covers every lifecycle kind the two mailers send', () => {
  const kinds = [...trial.TRIAL_KINDS, ...Object.keys(activation.TEMPLATES)].sort();
  assert.deepEqual(kinds, Object.keys(EXPECTED).sort());
});

test('every link into the site carries the lifecycle UTM tags, one utm_content per link', () => {
  for (const [kind, { render, campaign }] of Object.entries(EXPECTED)) {
    const links = hrefs(render(kind, USER_ID)).filter((h) => !isUnsubscribe(h));
    assert.equal(links.length, 2, `${kind}: the CTA button and the footer link`);
    for (const href of links) {
      assert.ok(href.startsWith(`${SITE}/`), `${kind}: site link ${href}`);
      const p = new URL(href).searchParams;
      assert.equal(p.get('utm_source'), 'email', href);
      assert.equal(p.get('utm_medium'), 'lifecycle', href);
      assert.equal(p.get('utm_campaign'), campaign, href);
    }
    const contents = links.map((h) => new URL(h).searchParams.get('utm_content')).sort();
    assert.deepEqual(contents, ['cta', 'footer'], `${kind}: each link names itself`);
  }
});

test('the unsubscribe link is untouched: no tag, same path, same signed token', () => {
  const token = createHmac('sha256', process.env.UNSUB_SECRET).update(USER_ID).digest('hex');
  for (const [kind, { render }] of Object.entries(EXPECTED)) {
    const unsub = hrefs(render(kind, USER_ID)).filter(isUnsubscribe);
    assert.equal(unsub.length, 1, kind);
    assert.equal(unsub[0], `${SITE}/.netlify/functions/unsubscribe?uid=${USER_ID}&token=${token}`, kind);
    assert.ok(!unsub[0].includes('utm_'), kind);
  }
});

test('the CTA opens the same page as before, trailing slash kept; the footer opens the homepage', () => {
  for (const [kind, { render, cta }] of Object.entries(EXPECTED)) {
    const byContent = Object.fromEntries(
      hrefs(render(kind, USER_ID)).filter((h) => !isUnsubscribe(h)).map((h) => [new URL(h).searchParams.get('utm_content'), new URL(h)]),
    );
    assert.equal(byContent.cta.origin, SITE, kind);
    assert.equal(byContent.cta.pathname, cta, `${kind}: prerendered route with its trailing slash (CLAUDE.md case 2)`);
    assert.equal(byContent.footer.origin, SITE, kind);
    assert.equal(byContent.footer.pathname, '/', kind);
    for (const url of Object.values(byContent)) assert.equal(url.hash, '', kind);
  }
});

test('labels follow the naming rule and are fixed strings, so a mail renders the same bytes', () => {
  for (const [kind, { render }] of Object.entries(EXPECTED)) {
    const html = render(kind, USER_ID);
    assert.equal(html, render(kind, USER_ID), `${kind}: deterministic`);
    for (const href of hrefs(html).filter((h) => !isUnsubscribe(h))) {
      for (const [key, value] of new URL(href).searchParams) {
        if (!key.startsWith('utm_')) continue;
        assert.match(value, EMAIL_LABEL, `${kind}: ${key}=${value}`);
        assert.ok(!/\d{4}-\d{2}-\d{2}/.test(value), `${kind}: no date in ${key}`);
        assert.ok(!value.includes(USER_ID) && !value.includes('@'), `${kind}: no id or address in ${key}`);
      }
    }
  }
  // The helper appends with "&" when the link already has a query.
  const tags = { medium: 'lifecycle', campaign: 'x', content: 'y' };
  assert.equal(
    tagEmailLink(`${SITE}/analyze/?s=Hallo`, tags),
    `${SITE}/analyze/?s=Hallo&utm_source=email&utm_medium=lifecycle&utm_campaign=x&utm_content=y`,
  );
  // A fragment stays last, so the tags still reach the page (review of c7bcea03).
  assert.equal(
    tagEmailLink(`${SITE}/pricing/#plans`, tags),
    `${SITE}/pricing/?utm_source=email&utm_medium=lifecycle&utm_campaign=x&utm_content=y#plans`,
  );
  // A link that already carries a utm_ key gets the mail's value once, not twice.
  const retagged = new URL(tagEmailLink(`${SITE}/?utm_source=old&utm_content=old`, tags));
  assert.deepEqual(retagged.searchParams.getAll('utm_source'), ['email']);
  assert.deepEqual(retagged.searchParams.getAll('utm_content'), ['y']);
});

test('the classifier reads the tags back without losing a label', () => {
  const { parse } = attribution();
  for (const [kind, { render, campaign, cta }] of Object.entries(EXPECTED)) {
    const href = hrefs(render(kind, USER_ID)).find((h) => !isUnsubscribe(h) && new URL(h).pathname === cta);
    const url = new URL(href);
    const touch = parse(url.search, '', url.pathname, Date.UTC(2026, 9, 4));
    assert.equal(touch.source, 'email', kind);
    assert.equal(touch.medium, 'lifecycle', kind);
    assert.equal(touch.campaign, campaign, kind);
    assert.equal(touch.content, 'cta', kind);
  }
});
