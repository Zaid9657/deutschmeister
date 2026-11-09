import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

test('desktop navigation uses accessible native disclosures in both renderers', () => {
  const spa = read('src/components/Navbar.jsx'); const astro = read('astro-site/src/layouts/Layout.astro');
  for (const source of [spa, astro]) {
    assert.match(source, /c4-nav-dropdown/); assert.match(source, /<summary>/);
    assert.match(source, /Start A1\.1 free/); assert.match(source, /NAV_GROUPS/);
  }
  assert.match(spa, /aria-expanded=\{isOpen\}/); assert.match(astro, /<details class="c4-mobile-menu"/);
});

test('pricing separates the no-account course, account trial and paid AI Practice', () => {
  const pricing = read('astro-site/src/pages/pricing.astro');
  assert.match(pricing, /A1.1 free, no account needed/);
  assert.match(pricing, /href="\/course\/a1\.1"/);
  assert.match(pricing, /course access sold separately/);
  assert.match(pricing, /\{proCta\(\)\.label\}/); assert.match(pricing, /\{proCta\(\)\.note\}/);
  const cta = read('astro-site/src/lib/proCta.js');
  assert.match(cta, /Start \$\{TRIAL_DAYS\}-day AI Practice trial/);
  assert.match(cta, /No card · no automatic charge/);
});

test('signup describes the trial without presenting A1.1 as account-gated', () => {
  const signup = read('src/pages/SignupPage.jsx');

  assert.match(signup, /Start your \{TRIAL_DAYS\}-day AI Practice trial/);
  // The way out opens the free course itself (tests/free-door.test.mjs).
  assert.match(signup, /Start the \{FREE_LEVEL_LABEL\} course without an account/);
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
