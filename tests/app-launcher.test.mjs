// Guard: the home-screen app opens where the learner can learn (ACC-07,
// cross-check 2026-10-25).
//
// public/manifest.webmanifest is linked from every page of both front ends and
// started the installed app at /dashboard, behind SubscriptionGuard: a learner
// whose trial had ended and who never bought anything (the largest group of
// accounts) opened the paywall, and the promoted "A1.1 free, no account"
// learner was sent to /login, away from the course saved on the device.
//
// The rule: start_url is /start, a non-crawlable SPA launcher that redirects
// by entitlement (account access → /dashboard; signed in without it → their
// course home; no account → the free A1.1 course). A new SPA route follows the
// route rule (CLAUDE.md): App.jsx and the netlify.toml allow-list; it is not
// crawlable, so it is neither prerendered nor in the sitemap.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { canEnterAccount } from '../src/lib/accountAccess.js';
import { courseHomeFor, FREE_COURSE_HOME } from '../src/lib/courseEntry.js';
import { loadJsxModule, oneRenderHooks } from './helpers/renderJsx.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const NAVIGATE = function Navigate() {};

async function launcher({ auth, sub }) {
  const hooks = oneRenderHooks();
  const mod = await loadJsxModule('src/pages/AppLauncher.jsx', {
    react: hooks.react,
    'react-router-dom': { Navigate: NAVIGATE },
    'react-i18next': { useTranslation: () => ({ t: (key) => key }) },
    '../contexts/AuthContext': { useAuth: () => auth },
    '../contexts/SubscriptionContext': { useSubscription: () => sub },
    '../lib/accountAccess': { canEnterAccount },
    '../lib/courseEntry.js': { courseHomeFor, FREE_COURSE_HOME },
  });
  return mod;
}

const FREE = { hasAccess: false, purchases: [], profile: { current_level: null }, hasLevelAccess: (l) => l === 'a1.1', loading: false };
const SIGNED_IN = { user: { id: 'learner' }, loading: false };

test('the manifest starts the installed app at /start', () => {
  const manifest = JSON.parse(read('public/manifest.webmanifest'));
  assert.equal(manifest.start_url, '/start');
  assert.equal(manifest.scope, '/');
});

test('/start is an SPA route in App.jsx and the netlify.toml allow-list, and is not crawlable', () => {
  assert.match(read('src/App.jsx'), /<Route path="\/start" element=\{<AppLauncher \/>\} \/>/);
  assert.match(read('src/App.jsx'), /const AppLauncher = lazy\(\(\) => import\('\.\/pages\/AppLauncher'\)\);/);
  assert.match(read('netlify.toml'), /from = "\/start"\s*\n\s*to = "\/app\.html"\s*\n\s*status = 200/);
  assert.ok(!/path:\s*'\/start'/.test(read('scripts/prerender-spa-routes.mjs')), 'a redirect is not prerendered');
  assert.ok(!read('public/sitemap-spa.xml').includes('/start'), 'a redirect is not in the sitemap');
});

test('the launcher sends each learner where they can learn', async () => {
  const { launchTarget } = await launcher({ auth: SIGNED_IN, sub: FREE });
  assert.equal(launchTarget({ signedIn: false }), '/course/a1.1', 'no account: the free course, saved on the device');
  assert.equal(launchTarget({ signedIn: true, ...FREE }), '/course/a1.1', 'trial over, nothing bought: the free course, not the paywall');
  assert.equal(launchTarget({ signedIn: true, ...FREE, hasAccess: true }), '/dashboard', 'trial or Pro: the dashboard');
  assert.equal(launchTarget({ signedIn: true, ...FREE, purchases: [{ product_key: 'course_a1_2', status: 'active' }] }), '/dashboard', 'a course owner: the dashboard');
  const placed = { ...FREE, profile: { current_level: 'A2.1' }, hasLevelAccess: (l) => ['a1.1', 'a2.1'].includes(l) };
  assert.equal(launchTarget({ signedIn: true, ...placed }), '/course/a2.1', 'a placed level open to them');
});

test('the launcher waits for auth and entitlements, then redirects (replace) once', async () => {
  const waiting = await launcher({ auth: { user: null, loading: true }, sub: FREE });
  assert.notEqual(waiting.default({}).type, NAVIGATE, 'no redirect before auth has loaded');
  const loadingSub = await launcher({ auth: SIGNED_IN, sub: { ...FREE, loading: true } });
  assert.notEqual(loadingSub.default({}).type, NAVIGATE, 'no redirect before entitlements have loaded');
  const guest = (await launcher({ auth: { user: null, loading: false }, sub: FREE })).default({});
  assert.equal(guest.type, NAVIGATE);
  assert.equal(guest.props.to, '/course/a1.1');
  assert.equal(guest.props.replace, true);
  const free = (await launcher({ auth: SIGNED_IN, sub: FREE })).default({});
  assert.equal(free.props.to, '/course/a1.1');
  const pro = (await launcher({ auth: SIGNED_IN, sub: { ...FREE, hasAccess: true } })).default({});
  assert.equal(pro.props.to, '/dashboard');
});
