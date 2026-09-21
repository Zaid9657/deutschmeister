// Guard suite for acquisition attribution (which link brought each customer).
//
//   1. public/attribution.js — the ONE classifier, run as-is under node:vm:
//      utm_* wins, ?ref= is the short form, social referrers map to a source,
//      our own hosts never attribute, click ids are never stored, first touch
//      is never overwritten.
//   2. Both front ends load the script (SPA index.html and Layout.astro), and
//      it is served with the same cache posture as consent.js.
//   3. Signup sends the record as user metadata and the migration copies every
//      key the client sends into a profiles.acquisition_* column.
//   4. The weekly truth mail renders the acquisition line.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/** Run public/attribution.js against a fake window and return its API + storage. */
function load({ search = '', referrer = '', path = '/', stored = null } = {}) {
  const store = new Map();
  if (stored) store.set('dm_attribution', JSON.stringify(stored));
  const localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  const window = { localStorage, location: { search, pathname: path } };
  const document = { referrer };
  const ctx = { window, document, URL, URLSearchParams, Date, JSON };
  vm.createContext(ctx);
  vm.runInContext(read('public/attribution.js'), ctx);
  return { api: window.dmAttribution, stored: () => JSON.parse(store.get('dm_attribution') || 'null') };
}

test('utm parameters attribute the landing and only campaign labels are kept', () => {
  const { stored } = load({ search: '?utm_source=Telegram&utm_medium=social&utm_campaign=A11-Launch&utm_content=pin&fbclid=XYZ&gclid=123', referrer: 'https://t.me/deutschmeister', path: '/courses/a1-1/' });
  const s = stored();
  assert.equal(s.first.source, 'telegram');
  assert.equal(s.first.medium, 'social');
  assert.equal(s.first.campaign, 'a11-launch');
  assert.equal(s.first.content, 'pin');
  assert.equal(s.first.referrer, 't.me');
  assert.equal(s.first.landing, '/courses/a1-1/');
  assert.ok(!JSON.stringify(s).includes('XYZ') && !JSON.stringify(s).includes('123'), 'click ids must never be stored');
  assert.deepEqual(s.last, s.first);
});

test('?ref= is the short form and defaults the medium to social', () => {
  const { stored } = load({ search: '?ref=instagram', path: '/' });
  assert.equal(stored().first.source, 'instagram');
  assert.equal(stored().first.medium, 'social');
});

test('social referrers classify without any parameter; search and unknown hosts get their own medium', () => {
  const { api } = load();
  // Objects come from the vm realm, so compare plain copies rather than prototypes.
  const c = (u) => ({ ...api.classifyReferrer(u) });
  assert.deepEqual(c('https://l.instagram.com/?u=x'), { source: 'instagram', medium: 'social' });
  assert.deepEqual(c('https://t.me/s/deutschmeister'), { source: 'telegram', medium: 'social' });
  assert.deepEqual(c('https://www.youtube.com/watch?v=1'), { source: 'youtube', medium: 'social' });
  assert.deepEqual(c('https://lm.facebook.com/l.php'), { source: 'facebook', medium: 'social' });
  assert.deepEqual(c('https://www.linkedin.com/feed/'), { source: 'linkedin', medium: 'social' });
  assert.deepEqual(c('https://www.google.de/'), { source: 'google', medium: 'organic' });
  assert.deepEqual(c('https://www.example-blog.org/post'), { source: 'example-blog.org', medium: 'referral' });
});

test('our own site, empty referrers and direct visits never attribute', () => {
  const { api, stored } = load({ referrer: 'https://deutsch-meister.de/pricing/', path: '/signup' });
  assert.equal(stored(), null, 'an internal navigation must not write a record');
  assert.equal(api.classifyReferrer(''), null);
  assert.equal(api.classifyReferrer('https://www.deutsch-meister.de/'), null);
  assert.equal(api.classifyReferrer('https://deploy-preview-1--dm.netlify.app/'), null);
  assert.equal(api.parse('', '', '/'), null);
  assert.equal(api.parse('?utm_medium=social', '', '/'), null, 'a medium without a source is not an attribution');
});

test('first touch is never overwritten; last touch refreshes', () => {
  const first = { source: 'telegram', medium: 'social', campaign: 'a11-launch', at: '2026-09-20T10:00:00.000Z' };
  const { stored } = load({ search: '?utm_source=instagram&utm_campaign=reel-3', stored: { first, last: first } });
  assert.equal(stored().first.source, 'telegram');
  assert.equal(stored().first.campaign, 'a11-launch');
  assert.equal(stored().last.source, 'instagram');
  assert.equal(stored().last.campaign, 'reel-3');
});

test('values are bounded and sanitised so nothing hostile reaches the profile', () => {
  const { api } = load();
  const t = api.parse('?utm_source=' + encodeURIComponent('<script>' + 'x'.repeat(500)), '', '/');
  assert.equal(t.source, 'scriptx'.slice(0, 7) + 'x'.repeat(93));
  assert.equal(t.source.length, 100);
});

test('both front ends load /attribution.js and it is cached like consent.js', () => {
  assert.ok(read('index.html').includes('<script src="/attribution.js" defer></script>'), 'SPA shell');
  assert.ok(read('astro-site/src/layouts/Layout.astro').includes('<script src="/attribution.js" defer></script>'), 'Astro layout');
  const toml = read('netlify.toml');
  assert.ok(/for = "\/attribution\.js"\s*\n\s*\[headers\.values\]\s*\n\s*Cache-Control = "public, max-age=86400"/.test(toml), 'cache header');
});

test('signup sends the record as user metadata and the trigger copies every key', async () => {
  const auth = read('src/contexts/AuthContext.jsx');
  assert.ok(auth.includes('data: signupAttributionMetadata()'), 'auth.signUp must carry options.data');
  const sql = read('migrations/2026-09-20-acquisition-attribution.sql');
  const lib = read('src/lib/attribution.js');
  const keys = [...lib.matchAll(/^\s+(acquisition_[a-z_]+):/gm)].map((m) => m[1]);
  assert.ok(keys.length >= 8, 'the metadata payload lists its keys');
  for (const k of keys) {
    assert.ok(sql.includes(`ADD COLUMN IF NOT EXISTS ${k}`), `${k} column missing in the migration`);
    assert.ok(sql.includes(`m->>'${k}'`), `${k} is not copied by handle_new_user`);
  }
  assert.ok(/SECURITY DEFINER/.test(sql));
  assert.ok(/REVOKE EXECUTE ON FUNCTION public\.handle_new_user\(\) FROM anon, authenticated, public/.test(sql));
  assert.ok(!/gclid|fbclid/.test(lib), 'click ids never travel to the profile');
});

test('the weekly truth mail renders the acquisition line and tolerates its absence', async () => {
  const { renderSummary } = await import('../netlify/functions/weekly-truth.mjs');
  const base = { measured_at: '2026-09-21T06:00:00Z', users: {}, subscriptions: {}, purchases: {}, grammar: {}, webhooks_7d: { total_7d: 0, failed_7d: 0 }, ai_7d: {} };
  const withAq = renderSummary({ ...base, acquisition: { signups_by_source_7d: { telegram: 12, untracked: 3 }, purchases_by_source_30d: { telegram: 2 } } }, null);
  assert.ok(withAq.includes('Acquisition (first-touch source): signups 7d {"telegram":12,"untracked":3}'));
  assert.ok(withAq.includes('course sales 30d {"telegram":2}'));
  assert.ok(!renderSummary(base, null).includes('Acquisition'));
});
