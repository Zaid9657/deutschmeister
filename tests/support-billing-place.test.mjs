// Guard suite: an AI support reply never sends a billing action to an account
// page (support agent, 2026-10-02).
//
// The card, invoices, cancelling and resuming are handled by Lemon Squeezy, in
// the store's customer portal (BILLING_PORTAL_URL in
// netlify/functions/_shared/dunningLink.mjs, the address the dunning mail
// already uses). No deutsch-meister.de page does any of them: /subscription
// shows the plan and its end date, /profile shows the account. The model is
// given links named profile, subscription and dashboard next to billingPortal,
// and its prompt says "Code checks every one" of its rules. Before this suite,
// a reply saying "change your card in your profile: <profile link>" passed
// every check in validateReply. It was a false claim, sendable in send mode.
//
// The rule, not a list of phrases: a sentence that names a billing action and
// an account place (a word or one of our account URLs) must name the portal
// too, and a reply that does both across sentences must name the portal
// somewhere. Otherwise the reply is blocked with code 'billing-place' and the
// owner answers. Replies that name an account place for anything else
// (progress, level, the plan's end date) are untouched.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { validateReply, composeReply, billingPlaceProblems } from '../netlify/functions/_shared/supportAgentLib.mjs';
import { SITE_LINKS } from '../netlify/functions/_shared/supportCatalog.mjs';
import { BILLING_PORTAL_URL } from '../netlify/functions/_shared/dunningLink.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const codes = (problems) => problems.map((p) => p.code);
const check = (body, language) => validateReply(composeReply(body, language), { language });
const de = (s) => check(`Guten Tag,\n\n${s}`, 'de');
const en = (s) => check(`Hello,\n\n${s}`, 'en');

const PORTAL = BILLING_PORTAL_URL;
const ACCOUNT_LINKS = [SITE_LINKS.profile, SITE_LINKS.subscription, SITE_LINKS.dashboard];

test('a billing action sent to an account page is blocked (German)', () => {
  const bad = [
    `Ihre Zahlungsmethode können Sie in Ihrem Profil ändern: ${SITE_LINKS.profile}`,
    'Ihre Kreditkarte aktualisieren Sie auf der Kontoseite.',
    'Sie können Ihr Abo jederzeit in Ihrem Konto kündigen.',
    'Kündigen können Sie über Ihr Profil.',
    `Ihre Rechnungen finden Sie hier: ${SITE_LINKS.subscription}`,
    'Die automatische Verlängerung schalten Sie in den Kontoeinstellungen ab.',
    'Öffnen Sie Ihr Profil und hinterlegen Sie dort neue Zahlungsdaten.',
    `Eine Quittung können Sie im Dashboard herunterladen: ${SITE_LINKS.dashboard}`,
  ];
  for (const s of bad) assert.ok(codes(de(s)).includes('billing-place'), s);
});

test('a billing action sent to an account page is blocked (English)', () => {
  const bad = [
    `You can update your payment method in your profile: ${SITE_LINKS.profile}`,
    'To cancel, go to the account settings.',
    'Your invoices are on the subscription page.',
    `Download your receipt here: ${SITE_LINKS.subscription}`,
    'You can change your credit card on your account page.',
    'Turn off auto-renew in your dashboard.',
  ];
  for (const s of bad) assert.ok(codes(en(s)).includes('billing-place'), s);
});

test('split across two sentences, the claim is still caught', () => {
  assert.ok(codes(de('Sie möchten Ihre Zahlungsmethode ändern? Das geht in Ihrem Konto.')).includes('billing-place'));
  assert.ok(codes(en('Need a new invoice? Open your account page.')).includes('billing-place'));
});

test('every account link the model is given counts as an account place; the portal never does', () => {
  for (const url of ACCOUNT_LINKS) {
    assert.ok(codes(de(`Ihre Rechnung finden Sie unter ${url}`)).includes('billing-place'), url);
    assert.ok(codes(en(`Your invoice is at ${url}`)).includes('billing-place'), url);
  }
  assert.deepEqual(de(`Ihre Rechnung finden Sie im Kundenportal: ${PORTAL}`), []);
  assert.deepEqual(en(`Your invoice is in the customer portal: ${PORTAL}`), []);
});

test('the portal answer passes, in both languages', () => {
  const ok = [
    ['de', `Ihre Zahlungsmethode ändern Sie im Kundenportal von Lemon Squeezy: ${PORTAL}\nMelden Sie sich dort mit der E-Mail-Adresse an, mit der Sie bezahlt haben.`],
    ['de', `Sie können Ihr Abo jederzeit im Kundenportal kündigen: ${PORTAL}`],
    ['de', `Ihre Rechnungen finden Sie im Kundenportal (${PORTAL}), nicht in Ihrem Profil.`],
    ['en', `You can update your card in the customer portal: ${PORTAL}. Sign in there with the email address you paid with.`],
    ['en', `Invoices and cancelling are in the billing portal: ${PORTAL}`],
  ];
  for (const [l, s] of ok) assert.deepEqual(l === 'de' ? de(s) : en(s), [], s);
});

test('an account place named for anything other than billing is untouched', () => {
  const ok = [
    ['de', `Ihren Lernstand sehen Sie in Ihrem Profil: ${SITE_LINKS.profile}`],
    ['de', `Ihr Abo läuft bis zum 03.11.2026. Das Enddatum sehen Sie hier: ${SITE_LINKS.subscription}`],
    ['de', 'Erlauben Sie den Mikrofonzugriff in den Einstellungen Ihres Browsers.'],
    ['de', `Ihr aktuelles Niveau steht in Ihrem Konto: ${SITE_LINKS.dashboard}`],
    ['de', 'Neue Lektionen werden in Ihrem Dashboard angekündigt.'],
    ['en', `Your progress is on your dashboard: ${SITE_LINKS.dashboard}`],
    ['en', `Your plan runs until 3 November 2026, as shown on ${SITE_LINKS.subscription}`],
    ['en', 'Please allow microphone access in your browser settings.'],
  ];
  for (const [l, s] of ok) assert.deepEqual(l === 'de' ? de(s) : en(s), [], s);
});

test('a billing action with no place named is not this rule\'s business', () => {
  assert.deepEqual(de('Ihr Abo ist zum 03.11.2026 gekündigt und verlängert sich nicht.'), []);
  assert.deepEqual(en('Your plan does not renew after 3 November 2026.'), []);
});

test('billingPlaceProblems is the one place the rule lives, and validateReply runs it on the body', () => {
  assert.equal(typeof billingPlaceProblems, 'function');
  assert.deepEqual(billingPlaceProblems('Guten Tag,\n\nIhre Karte ändern Sie im Kundenportal.'), []);
  const p = billingPlaceProblems('Guten Tag,\n\nIhre Kreditkarte ändern Sie in Ihrem Profil.');
  assert.equal(p.length, 1);
  assert.equal(p[0].code, 'billing-place');
  // The signature and the AI disclosure are ours, not the model's: a clean
  // body stays clean once composed.
  assert.deepEqual(check('Guten Tag,\n\nIhre Karte ändern Sie im Kundenportal.', 'de'), []);

  const src = readFileSync(join(ROOT, 'netlify/functions/_shared/supportAgentLib.mjs'), 'utf8');
  const fn = src.slice(src.indexOf('export function validateReply'), src.indexOf('// ─── the ticket'));
  assert.match(fn, /billingPlaceProblems\(body\)/, 'validateReply checks the model-written body');
  assert.match(src, /Codes:[^\n]*\n[^\n]*billing-place/, 'the code is listed in validateReply\'s doc comment');
});
