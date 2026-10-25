// Guard: a signed-in learner without trial or paid access lands on the course
// they can open, never on the paywall, after login, confirmation or any
// "Zum Dashboard" (ACC-06, cross-check 2026-10-25).
//
// postAuthPath() falls back to /dashboard, the confirmation nudge's magic link
// went to /dashboard, and the vocab trainer's only completion button says
// "Zum Dashboard". /dashboard sits behind SubscriptionGuard, which sent every
// account without a live trial, paid period or purchase (most accounts) to
// /subscription ("Trial expired — Subscribe now"), fired paywall_shown, and
// offered no way to the free A1.1 course. The bottom nav, the navbar and the
// Astro continuation link had already been fixed for the same class with
// courseHomeFor(); the route was not.
//
// The rule: SubscriptionGuard takes an opt-in `freeFallback`, set on /dashboard
// only; with it, a signed-in learner without account access is sent to
// courseHomeFor({ level, hasLevelAccess }) and no paywall view is counted.
// Every other guarded route still shows the paywall. The confirmation link
// lands on /login, which runs postAuthPath(). /subscription's "Trial expired"
// card links the free course. Starting the trial at confirmation (the
// "stronger fix") is an owner decision and not part of this change.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac, timingSafeEqual } from 'node:crypto';
import vm from 'node:vm';

import { canEnterAccount } from '../src/lib/accountAccess.js';
import { courseHomeFor } from '../src/lib/courseEntry.js';
import { loadJsxModule, oneRenderHooks } from './helpers/renderJsx.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const NAVIGATE = function Navigate() {};
const CHILD = { type: 'DashboardPage' };
const SIGNED_IN = { id: 'learner', created_at: '2026-01-01T00:00:00Z' };
const FREE = { hasAccess: false, purchases: [], profile: { current_level: null }, hasLevelAccess: (l) => l === 'a1.1', loading: false, refreshSubscription: async () => {} };

async function renderGuard({ freeFallback, auth = { user: SIGNED_IN, loading: false }, sub = FREE, pathname = '/dashboard' }) {
  const hooks = oneRenderHooks();
  const tracked = [];
  const { default: SubscriptionGuard } = await loadJsxModule('src/components/SubscriptionGuard.jsx', {
    react: hooks.react,
    'react-router-dom': { Navigate: NAVIGATE, useLocation: () => ({ pathname }) },
    '../contexts/AuthContext': { useAuth: () => auth },
    '../contexts/SubscriptionContext': { useSubscription: () => sub },
    'react-i18next': { useTranslation: () => ({ t: (key) => key }) },
    '../lib/funnelTracking': { trackPaywallShown: (path) => tracked.push(path) },
    '../lib/accountAccess': { canEnterAccount },
    '../lib/courseEntry.js': { courseHomeFor },
  });
  const element = SubscriptionGuard({ children: CHILD, freeFallback });
  hooks.runEffects();
  return { element, tracked };
}

test('with freeFallback, a free learner goes to the free course and no paywall view is counted', async () => {
  const { element, tracked } = await renderGuard({ freeFallback: true });
  assert.equal(element.type, NAVIGATE);
  assert.equal(element.props.to, '/course/a1.1');
  assert.equal(element.props.replace, true);
  assert.deepEqual(tracked, [], 'the course is not a paywall view');
});

test('with freeFallback, a placed learner goes to the course of their level when it is open to them', async () => {
  const placed = { ...FREE, profile: { current_level: 'A2.1' } };
  assert.equal((await renderGuard({ freeFallback: true, sub: placed })).element.props.to, '/course/a1.1', 'a2.1 is not open: the free course');
  const open = { ...placed, hasLevelAccess: (l) => ['a1.1', 'a2.1'].includes(l) };
  assert.equal((await renderGuard({ freeFallback: true, sub: open })).element.props.to, '/course/a2.1');
});

test('without freeFallback, every other guarded route still shows the paywall', async () => {
  const { element, tracked } = await renderGuard({ freeFallback: false, pathname: '/modelltest' });
  assert.equal(element.type, NAVIGATE);
  assert.equal(element.props.to, '/subscription');
  assert.equal(element.props.state.from.pathname, '/modelltest', 'the paywall still learns where the learner came from');
  assert.deepEqual(tracked, ['/modelltest']);
});

test('account access still renders the dashboard; a guest still signs in; a brand-new account still waits for its retry', async () => {
  for (const sub of [{ ...FREE, hasAccess: true }, { ...FREE, purchases: [{ product_key: 'course_a1_2', status: 'active' }] }]) {
    assert.equal((await renderGuard({ freeFallback: true, sub })).element, CHILD);
  }
  const guest = await renderGuard({ freeFallback: true, auth: { user: null, loading: false } });
  assert.equal(guest.element.props.to, '/login');
  let refreshed = 0;
  const brandNew = await renderGuard({
    freeFallback: true,
    auth: { user: { id: 'new', created_at: new Date().toISOString() }, loading: false },
    sub: { ...FREE, refreshSubscription: async () => { refreshed++; } },
  });
  assert.notEqual(brandNew.element.type, NAVIGATE, 'the trial may not have landed yet: no redirect before the retry');
  assert.equal(refreshed, 1);
  assert.deepEqual(brandNew.tracked, []);
});

test('only the /dashboard route opts in', () => {
  const app = read('src/App.jsx');
  const optIns = [...app.matchAll(/<SubscriptionGuard freeFallback>/g)];
  assert.equal(optIns.length, 1, 'exactly one route uses the free fallback');
  const dashboard = app.slice(app.indexOf('path="/dashboard"'), app.indexOf('path="/dashboard"') + 200);
  assert.match(dashboard, /<SubscriptionGuard freeFallback>/);
  assert.match(app, /path="\/modelltest"\s*element=\{\s*<SubscriptionGuard>/, 'the mock-exam hub keeps the paywall');
});

test("the confirmation nudge's link lands on /login, which runs postAuthPath()", async () => {
  const source = read('netlify/functions/confirm-continue.mjs');
  const links = [];
  const users = { unconfirmed: { email: 'late@example.com', email_confirmed_at: null } };
  const mod = vm.runInNewContext(
    `${source.replace(/^import .*;\n/gm, '').replace(/^export /gm, '')}\n({ handler, continueToken });`,
    {
      createClient: () => ({
        auth: { admin: {
          getUserById: async (id) => ({ data: { user: users[id] } }),
          generateLink: async (args) => { links.push(args); return { data: { properties: { action_link: 'https://auth.example/verify?token=x' } } }; },
        } },
      }),
      createHmac, timingSafeEqual, Buffer, Date, Number,
      process: { env: { UNSUB_SECRET: 'test-secret', SUPABASE_SERVICE_ROLE_KEY: 'service-key' } },
      console: { error() {} },
    },
  );
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = mod.continueToken('test-secret', 'unconfirmed', exp);
  const res = await mod.handler({ queryStringParameters: { uid: 'unconfirmed', exp: String(exp), token } });
  assert.equal(res.statusCode, 302);
  assert.equal(res.headers.Location, 'https://auth.example/verify?token=x');
  assert.equal(links.length, 1);
  assert.equal(links[0].options.redirectTo, 'https://deutsch-meister.de/login');
  // LoginPage sends a signed-in visitor on to postAuthPath() (buy intent, course step, dashboard).
  assert.match(read('src/pages/LoginPage.jsx'), /if \(!authLoading && user\) navigate\(from, \{ replace: true \}\);/);
  // A static door's ?next= (src/lib/loginReturn.js) comes before the default.
  assert.match(read('src/pages/LoginPage.jsx'), /const from = returnPath\(location\.state\?\.from\) \|\| nextPath\(searchParams\.get\('next'\)\) \|\| postAuthPath\(\);/);
});

test('/subscription\'s "Trial expired" card links the free course', () => {
  const page = read('src/pages/SubscriptionPage.jsx');
  const card = page.slice(page.indexOf("{isGerman ? 'Testphase abgelaufen' : 'Trial Expired'}"));
  const end = card.indexOf('</Card>');
  assert.ok(end > 0);
  // The one named free door (offers.js FREE_COURSE_HREF, tests/free-door.test.mjs).
  assert.match(card.slice(0, end), /<Link to=\{FREE_COURSE_HREF\}/);
  assert.match(page, /import \{ FREE_COURSE_HREF \} from '\.\.\/data\/offers\.js';/);
});
