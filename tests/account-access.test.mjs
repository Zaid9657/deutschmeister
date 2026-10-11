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
