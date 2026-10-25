// A one-time buyer keeps the account screens after the included Pro window.
//
// /dashboard, /profile and the /modelltest hub sit behind SubscriptionGuard.
// It used to read hasAccess alone (trial or paid period), so the day a
// course's 90-day Pro window ended, its owner was bounced to "Trial Expired /
// Subscribe now" although the course is sold as "yours to keep".

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canEnterAccount } from '../src/lib/accountAccess.js';

test('trial/paid access or any bought product opens the account screens', () => {
  assert.equal(canEnterAccount({ hasAccess: true, purchases: [] }), true);
  assert.equal(canEnterAccount({ hasAccess: false, purchases: [{ product_key: 'course_a1_2' }] }), true);
  assert.equal(canEnterAccount({ hasAccess: false, purchases: [] }), false);
  assert.equal(canEnterAccount({ hasAccess: false, purchases: undefined }), false);
});

test('SubscriptionGuard decides with canEnterAccount, not hasAccess alone', () => {
  const src = readFileSync(new URL('../src/components/SubscriptionGuard.jsx', import.meta.url), 'utf8');
  assert.match(src, /canEnterAccount\(\{ hasAccess: liveAccess, purchases \}\)/);
});

// ACC-05 (cross-check 2026-10-25): /profile holds the only self-service
// account deletion (the Art. 17 path; ProfilePage is the only caller of
// delete-account), the exam goal and the settings. It sat behind
// SubscriptionGuard, so every account without a live trial, paid period or
// purchase (most of them) was redirected to /subscription and could not delete
// itself. Profile is account management, not paid content: it needs a
// signed-in, verified account and nothing more.
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');

/** The element={…} of a <Route path="…">, braces balanced. */
const routeElement = (path) => {
  const at = app.indexOf(`path="${path}"`);
  assert.ok(at >= 0, `no <Route path="${path}"> in App.jsx`);
  const open = app.indexOf('element={', at) + 'element='.length;
  let depth = 0;
  for (let i = open; i < app.length; i++) {
    if (app[i] === '{') depth++;
    else if (app[i] === '}' && --depth === 0) return app.slice(open + 1, i);
  }
  throw new Error(`unbalanced element for ${path}`);
};

const ENTITLEMENT_GUARDS = ['SubscriptionGuard', 'LevelSubscriptionGuard', 'ExamSubscriptionGuard', 'PurchaseGuard'];

test('ACC-05: /profile needs a signed-in, verified account, never a subscription', () => {
  const element = routeElement('/profile');
  const components = [...element.matchAll(/<([A-Z]\w*)/g)].map((m) => m[1]);
  assert.deepEqual(components, ['ProtectedRoute', 'EmailVerificationGate', 'OnboardingGate', 'ProfilePage']);
  for (const guard of ENTITLEMENT_GUARDS) {
    assert.ok(!components.includes(guard), `/profile is wrapped in ${guard}, which redirects accounts without access`);
  }
});

test('ACC-05: the delete-account caller renders for an account with no access and no purchases', () => {
  // ProtectedRoute admits any signed-in user; it reads no entitlement.
  const protectedRoute = readFileSync(new URL('../src/components/ProtectedRoute.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(protectedRoute, /useSubscription|hasAccess|purchases/);
  assert.equal(canEnterAccount({ hasAccess: false, purchases: [] }), false, 'the account this test is about');
  // The page's one deletion call and its button carry no access condition.
  const page = readFileSync(new URL('../src/pages/ProfilePage.jsx', import.meta.url), 'utf8');
  assert.equal((page.match(/\/\.netlify\/functions\/delete-account/g) || []).length, 1);
  const button = page.slice(page.indexOf('{/* Delete Account */}'), page.indexOf("t('profile.deleteAccount')"));
  assert.ok(button.length > 0, 'the delete button is still on /profile');
  assert.doesNotMatch(button, /hasAccess|isSubscribed|hasActiveSubscription|purchases/, 'the delete button is not access-gated');
  // The plan card answers a non-subscriber itself ("Upgrade").
  assert.match(page, /profilePlanAction\(isSubscribed, subscription\)/);
});
