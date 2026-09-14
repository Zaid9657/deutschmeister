import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(ROOT, path), 'utf8');

test('optional analytics has accept and same-session withdrawal paths', () => {
  const consent = read('public/consent.js');
  const analytics = read('src/lib/analytics.js');
  const main = read('src/main.jsx');

  assert.match(consent, /dm-consent-accepted/);
  assert.match(consent, /dm-consent-declined/);
  assert.match(consent, /ga-disable-/);
  assert.match(consent, /manage:\s*function/);
  assert.match(analytics, /opt_out_capturing/);
  assert.match(analytics, /opt_in_capturing/);
  assert.match(main, /dm-consent-declined/);
});

test('legal pages stay noindex until verified evidence is present', () => {
  const legal = read('astro-site/src/data/legal.js');
  const privacy = read('astro-site/src/pages/privacy.astro');
  const impressum = read('astro-site/src/pages/impressum.astro');

  assert.match(legal, /isLegalReleaseReady = missingLegalFacts\(\)\.length === 0/);
  assert.match(legal, /isPrivacyReleaseReady = missingPrivacyFacts\(\)\.length === 0/);
  assert.match(impressum, /noindex=\{!isLegalReleaseReady\}/);
  assert.match(privacy, /noindex=\{!isPrivacyReleaseReady\}/);
});
