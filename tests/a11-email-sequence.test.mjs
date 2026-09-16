// The five-email DeutschStart A1.1 preview sequence — plan Task 4
// (a11-organic-commercial-launch).
//
// Drafts are Class B: nothing here self-sends. What this suite defends is
// that when the owner DOES send, the sequence is honest (no guaranteed
// outcomes, no invented urgency), correctly attributed, and cannot mail a
// learner who already bought.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const CAMPAIGN = 'a11-foundation-2026-09';
const files = [1, 2, 3, 4, 5].map((n) => `drafts/deutschstart-a11-preview-${n}.md`);
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('all five emails exist', () => {
  for (const f of files) {
    assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), `${f} missing`);
  }
});

test('each email carries its planned subject and exactly one CTA link', () => {
  const subjects = [
    'Your first 3 German lessons are ready',
    'The first conversation most courses postpone',
    'Can you order this in German?',
    'What happens after the free route',
    'Continue your A1.1 route for €39 once',
  ];
  files.forEach((f, i) => {
    const body = read(f);
    assert.ok(body.includes(subjects[i]), `${f}: subject "${subjects[i]}" missing`);
    // One CTA: exactly one canonical course/preview URL carrying the campaign.
    const ctas = [...body.matchAll(/https:\/\/deutsch-meister\.de\/[^\s)]*utm_campaign=a11-foundation-2026-09/g)];
    assert.equal(ctas.length, 1, `${f}: expected exactly one campaign CTA, found ${ctas.length}`);
  });
});

test('every CTA uses the canonical domain and the campaign tag', () => {
  for (const f of files) {
    const body = read(f);
    const url = body.match(/https:\/\/deutsch-meister\.de\/[^\s)]*utm_campaign=[^\s)&]+/)[0];
    assert.ok(url.includes(`utm_campaign=${CAMPAIGN}`), `${f}: wrong campaign tag in ${url}`);
    assert.ok(/utm_source=email/.test(url), `${f}: CTA must carry utm_source=email`);
  }
});

test('emails 2-5 exclude people who already bought', () => {
  for (const f of files.slice(1)) {
    const body = read(f);
    assert.match(body, /purchased:course_a1_1/, `${f}: missing the purchase exclusion`);
  }
});

test('no guaranteed-outcome or false-urgency language anywhere', () => {
  const BANNED = [
    /\bfluent\b/i, /\bfließend\b/i, /\bguarantee/i, /\bgarantiert\b/i,
    /pass (?:your |the )?exam/i, /\blast chance\b/i, /only \d+ (?:spots|places|left)/i,
    /\bexpires? in \d+ hours?\b/i,
  ];
  for (const f of files) {
    const body = read(f);
    for (const re of BANNED) {
      assert.ok(!re.test(body), `${f} contains banned language: ${re}`);
    }
  }
});

test('each email teaches something before it asks for anything', () => {
  for (const f of files) {
    const body = read(f);
    assert.match(body, /## (Was Sie|Practice|Lesson|Try this|Heute)/i, `${f}: no teaching block`);
    const teachAt = body.search(/## (Was Sie|Practice|Lesson|Try this|Heute)/i);
    const ctaAt = body.search(/utm_campaign=/);
    assert.ok(teachAt > 0 && teachAt < ctaAt, `${f}: the CTA comes before the teaching`);
  }
});

test('the drafts state they do not self-send and unsubscribe is the sender\'s job', () => {
  for (const f of files) {
    const body = read(f);
    assert.match(body, /Class B|does not self-send|nothing here self-sends/i, `${f}: missing the draft notice`);
    assert.match(body, /unsubscribe/i, `${f}: must state how unsubscribe is handled`);
    assert.doesNotMatch(body, /\{\{\s*unsubscribe/i, `${f}: must NOT hand-roll an unsubscribe token — send-campaign appends it`);
  }
});

test('the operator script defaults to test mode and needs an explicit live confirmation', () => {
  const script = read('scripts/send-a11-preview-email.ps1');
  assert.match(script, /\[switch\]\s*\$Live/i, 'a -Live switch must exist');
  assert.match(script, /ConfirmCampaign/, 'a -ConfirmCampaign guard must exist');
  assert.match(script, new RegExp(CAMPAIGN), 'the confirmation value is the campaign name');
  assert.match(script, /testMode\s*=\s*\$true|testMode.*true/i, 'test mode must be the default');
  assert.match(script, /purchased:course_a1_1/, 'the send must carry the purchase exclusion');
  // Secrets never live in the script.
  assert.doesNotMatch(script, /CAMPAIGN_SECRET\s*=\s*["'][^"']+["']/, 'a secret literal is embedded in the script');
  assert.match(script, /\$env:CAMPAIGN_SECRET/, 'the secret must come from the environment');
});

test('every course CTA uses the slug the Astro build actually emits', () => {
  // The sales page is built at /courses/a1-1/ (levelToSlug), NOT /courses/a1.1/.
  // An email CTA in the dot form is a 404 sent to everyone who ever bought
  // nothing yet — this caught exactly that before the first send.
  for (const f of files) {
    const body = read(f);
    assert.ok(!/deutsch-meister\.de\/courses\/a1\.1/.test(body), `${f}: /courses/a1.1/ is a 404 — use /courses/a1-1/`);
  }
  // The SPA lesson routes DO use the dot form and are covered by the
  // netlify.toml /course/* rewrite.
  const toml = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
  assert.match(toml, /from = "\/course\/\*"/, 'the SPA course rewrite must exist for /course/a1.1/l/1');
});
