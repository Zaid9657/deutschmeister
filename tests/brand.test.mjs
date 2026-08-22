// Guard suite for the brand surfaces that cannot import the design tokens.
//
// Two jobs:
//
//   1. KEEP THE SYNCED COPY HONEST. netlify/functions/_shared/brand.mjs repeats
//      the token hex values as literals, because the functions bundle cannot
//      reliably reach src/ and public/consent.js is served to the browser
//      verbatim. A synced copy with nothing checking it is just a second
//      opinion waiting to diverge, so every value is compared here.
//
//   2. KEEP THE RETIRED BRAND RETIRED. The amber-to-rose "D" identity was
//      replaced in the chrome during the August remediation, but survived in
//      every email template, the dunning mail, the owner test send, the
//      unsubscribe page and the cookie banner — surfaces nobody looks at until
//      a customer receives one. The ban below is what stops it coming back.
//
// SCOPE NOTE, and it matters: the ban covers marketing and transactional
// surfaces ONLY. `#f43f5e` also appears in src/utils/listeningHelpers.js as the
// B2.1 *level* colour, part of the eight-palette CEFR system, where it means
// something entirely different. A repo-wide sweep for these hexes produces
// false positives; this list is deliberate, not lazy.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { color } from '../src/data/design-tokens.js';
import { BRAND } from '../netlify/functions/_shared/brand.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

test('the email brand copy matches the design tokens', () => {
  assert.equal(BRAND.siegel, color.siegel);
  assert.equal(BRAND.siegelLift, color.siegelLift);
  assert.equal(BRAND.siegelWash, color.siegelWash);
  assert.equal(BRAND.gold, color.gold);
  assert.equal(BRAND.ink, color.ink);
  assert.equal(BRAND.graphite, color.graphite);
  assert.equal(BRAND.rule, color.rule);
  assert.equal(BRAND.paper, color.paper);
});

/** Surfaces a customer or visitor sees, which must all carry the current brand. */
const BRANDED_SURFACES = [
  'netlify/functions/send-welcome-email.mjs',
  'netlify/functions/trial-lifecycle.mjs',
  'netlify/functions/activation-lifecycle.mjs',
  'netlify/functions/daily-sentence.mjs',
  'netlify/functions/lemonsqueezy-webhook.mjs',
  'netlify/functions/send-daily-test.mjs',
  'netlify/functions/unsubscribe.mjs',
  'public/consent.js',
];

test('no customer-facing surface still ships the retired amber-rose brand', () => {
  // The retired identity's own values. `#f43f5e` is listed here only because
  // these files have no legitimate use for it — see the scope note above.
  const retired = ['#f59e0b', '#f43f5e', '#7c3aed', '#4f46e5'];
  const failures = [];
  let seen = 0;
  for (const file of BRANDED_SURFACES) {
    const body = read(file);
    seen += 1;
    for (const hex of retired) {
      if (body.toLowerCase().includes(hex)) failures.push(`${file} still uses ${hex}`);
    }
  }
  assert.equal(seen, BRANDED_SURFACES.length, 'the surface list did not fully load');
  assert.deepEqual(failures, [], `retired brand still shipping:\n  ${failures.join('\n  ')}`);
});

test('no email template ships a gradient background', () => {
  // Several clients drop CSS gradients. A gradient that fails to paint leaves
  // white text on a white cell, which is how a CTA becomes invisible in Outlook.
  const failures = [];
  for (const file of BRANDED_SURFACES) {
    if (read(file).includes('linear-gradient')) failures.push(file);
  }
  assert.deepEqual(failures, [], `gradients in email/banner surfaces:\n  ${failures.join('\n  ')}`);
});

// ---------------------------------------------------------------------------
// 3. The in-app chrome
// ---------------------------------------------------------------------------
//
// The Astro half of the site was rebuilt on the tokens; the SPA was not, so a
// visitor crossed a visible seam at the moment they signed up — teal Fraunces
// homepage, amber-to-rose app. The two assertions below are different in kind
// ON PURPOSE:
//
//   - CHROME is absolute. Everything App.jsx renders around every route, plus
//     the shared primitives and the signup funnel, must carry zero legacy
//     brand. These are the surfaces the seam actually ran through.
//
//   - The rest is a RATCHET. Roughly ten content screens still carry their own
//     hero gradient. Repainting them was out of scope, but an untracked debt
//     is one nobody pays, so the count is pinned and may only fall. Migrate a
//     screen, lower the number in the same commit.

/** Comments quote the retired classes to explain them; only rendered code counts. */
const rendered = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');

/** The retired identity's CTA, verbatim, as it was copy-pasted around the app. */
const RETIRED_CTA = 'from-amber-500 to-rose-500';

/** Everything rendered around every route, the primitives, and the signup funnel. */
const APP_CHROME = [
  'src/index.css',
  'src/App.jsx',
  'src/components/ui/Button.jsx',
  'src/components/ui/Card.jsx',
  'src/components/Navbar.jsx',
  'src/components/Logo.jsx',
  'src/components/SessionTimeoutModal.jsx',
  'src/components/FloatingIntroButton.jsx',
  'src/components/LockedContentOverlay.jsx',
  'src/components/SubscriptionGuard.jsx',
  'src/components/LevelSubscriptionGuard.jsx',
  'src/components/ErrorBoundary.jsx',
  'src/components/DataState.jsx',
  'src/components/EmptyState.jsx',
  'src/components/onboarding/IntroSlides.jsx',
  'src/pages/LoginPage.jsx',
  'src/pages/SignupPage.jsx',
  'src/pages/ResetPasswordPage.jsx',
  'src/pages/UpdatePasswordPage.jsx',
  'src/pages/VerifyEmailPage.jsx',
];

test('the app chrome carries no retired brand', () => {
  // Tailwind palette names, not hexes: this is how the SPA writes colour. The
  // eight CEFR level palettes are declared in tailwind.config.js under their
  // own `a1-1`…`b2-2` names and are untouched by this — see the scope note.
  const banned = [RETIRED_CTA, 'amber-', 'rose-', 'indigo-', 'violet-', 'purple-'];
  const failures = [];
  let seen = 0;
  for (const file of APP_CHROME) {
    const body = rendered(read(file));
    seen += 1;
    for (const token of banned) {
      if (body.includes(token)) failures.push(`${file} still uses ${token}`);
    }
  }
  assert.equal(seen, APP_CHROME.length, 'the chrome list did not fully load');
  assert.deepEqual(failures, [], `retired brand in the app chrome:\n  ${failures.join('\n  ')}`);
});

test('the chrome uses the shared button, not a copy of its classes', () => {
  // A gradient CTA is exactly what the primitive replaced. If one reappears in
  // the chrome, someone has hand-rolled a button again.
  const failures = APP_CHROME.filter((f) => f.endsWith('.jsx') && rendered(read(f)).includes('bg-gradient-to'));
  assert.deepEqual(failures, [], `hand-rolled gradient in chrome:\n  ${failures.join('\n  ')}`);
});

/**
 * Content screens still carrying the retired CTA. May only go down.
 * 2026-08-22: 20 files → 9. The remainder are content screens, each with its
 * own hero treatment, deliberately left for a follow-up. (NotFoundPage came
 * along too — its "Go Home" was a router <Link to="/">, which client-routes to
 * a route the SPA does not have and lands the visitor back on the 404.)
 */
const MAX_LEGACY_CTA_FILES = 9;

test('the retired CTA is receding, never spreading', () => {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (entry.name.endsWith('.jsx') && rendered(read(rel)).includes(RETIRED_CTA)) files.push(rel);
    }
  };
  walk('src');
  assert.ok(
    files.length <= MAX_LEGACY_CTA_FILES,
    `the retired CTA spread to ${files.length} files (ceiling ${MAX_LEGACY_CTA_FILES}):\n  ${files.join('\n  ')}`,
  );
  assert.equal(
    files.length,
    MAX_LEGACY_CTA_FILES,
    `${files.length} files left, but the ceiling still says ${MAX_LEGACY_CTA_FILES} — ` +
      'lower MAX_LEGACY_CTA_FILES in the same commit that migrates a screen, or the ratchet stops ratcheting.',
  );
});
