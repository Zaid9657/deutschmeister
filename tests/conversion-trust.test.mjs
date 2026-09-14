import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

test('desktop navigation uses grouped disclosures in both renderers', () => {
  const spa = read('src/components/Navbar.jsx');
  const astro = read('astro-site/src/layouts/Layout.astro');

  assert.match(spa, /visibleGroups[\s\S]*?<details/);
  assert.match(astro, /NAV_GROUPS\.map[\s\S]*?<details/);
  assert.match(spa, /A1\.1 · no account/);
  assert.match(spa, /Start 7-day trial/);
  assert.match(astro, /Start 7-day trial/);
});

test('pricing separates no-account exploration, account trial, and paid Pro', () => {
  const pricing = read('astro-site/src/pages/pricing.astro');

  assert.match(pricing, />Explore</);
  assert.match(pricing, />Free trial</);
  assert.match(pricing, />Pro</);
  assert.match(pricing, /Forever · no account/);
  assert.match(pricing, /days · account required/);
  assert.match(pricing, /No signup · no card/);
  assert.match(pricing, /Starts \{TRIAL_DAYS\}-day trial · no card/);
  assert.doesNotMatch(pricing, /row\.free/);
});

test('signup describes the trial without presenting A1.1 as account-gated', () => {
  const signup = read('src/pages/SignupPage.jsx');

  assert.match(signup, /Start your \{TRIAL_DAYS\}-day Pro trial/);
  assert.match(signup, /Explore A1\.1 without an account/);
  assert.match(signup, /no automatic charge when the trial ends/);
});

test('learner stories require explicit permission and are never auto-published', () => {
  const form = read('astro-site/src/pages/share-your-story/index.astro');
  const about = read('src/pages/UeberUnsPage.jsx');
  const navigation = read('src/data/navigation.js');

  assert.match(form, /name="learner-story"/);
  assert.match(form, /data-netlify="true"/);
  assert.match(form, /name="publication-consent"[^>]*required/);
  assert.match(form, /never published automatically/i);
  assert.match(form, /name="email"[^>]*required/);
  assert.match(about, /Share your experience/);
  assert.match(navigation, /href: '\/share-your-story\/'/);
});
