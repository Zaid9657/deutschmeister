// The offer after exam writing feedback, and at the moments writing is refused
// (#222; cross-check AI-16 / C-130, C-146, X-092, X-104).
//
// The offer used to hide behind hasLevelAccess(level) — true for every trial
// learner — while exam feedback exists only for trial and paid tiers, so it
// never rendered; and the real limit moments (403 subscription_required, the
// trial's 429 limit_reached) showed text that recommended an offer with no
// button. These are state tests of the pure decisions the page renders.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { examFeedbackOffer, writingOfferMoment, proFeedbackDoor } from '../src/lib/examFeedbackOffer.js';
import { EXAM_COURSE, PRO_OFFER, stationFor } from '../src/data/offers.js';
import { EXAM_TRACKS } from '../src/data/examTracks.js';
import { levelsForProduct } from '../src/data/pricing.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

/** hasPaidAccess as SchreibenPage builds it from the subscription context. */
const paidAccess = ({ subscribed = false, purchases = [] } = {}) =>
  (level) => subscribed || purchases.some((p) => levelsForProduct(p.product_key).includes(level));

const WRITING_TRACKS = EXAM_TRACKS.filter((t) => t.hasWriting);
const trial = { hasPaidAccess: paidAccess() };

test('a trial learner sees the matching offer; Pro, a covering course and loading hide it', () => {
  for (const track of WRITING_TRACKS) {
    const args = { examKey: track.key, telcVariantId: 'checkout-id' };
    const level = track.sublevels[track.sublevels.length - 1];
    assert.ok(examFeedbackOffer({ ...args, ...trial }), `${track.key}: a trial learner is who the offer is for`);
    assert.equal(examFeedbackOffer({ ...args, loading: true }), null);
    assert.equal(examFeedbackOffer({ ...args, hasPaidAccess: paidAccess({ subscribed: true }) }), null, `${track.key}: Pro`);
    const key = track.key === 'telc_b1' ? EXAM_COURSE.key : stationFor(level).productKey;
    assert.equal(examFeedbackOffer({ ...args, ...trial, hasProduct: (k) => k === key }), null, `${track.key}: owner`);
    if (track.key !== 'telc_b1') {
      assert.equal(examFeedbackOffer({ ...args, hasPaidAccess: paidAccess({ purchases: [{ product_key: key }] }) }), null,
        `${track.key}: a bought course covering the level`);
    }
  }
  assert.equal(examFeedbackOffer({ examKey: 'unknown' }), null);
});

test('off-sale feedback uses the existing pilot course door, never checkout', () => {
  // Evaluate the existing client's gate with fake settings, including a
  // configured product id while the sale switch is OFF. No actual env reads.
  const config = read('src/config/lemonsqueezy.js');
  const expression = config.match(/telc_b1_komplett:\s*\{[\s\S]*?variantId:\s*([^\n]+),\n/)[1];
  const gate = new Function('env', `return (${expression.replace(/import\.meta\.env/g, 'env')});`);
  for (const sale of [undefined, 'false', 'true']) {
    const telcVariantId = gate({ PUBLIC_TELC_B1_ON_SALE: sale, VITE_LEMONSQUEEZY_TELC_B1_VARIANT_ID: 'checkout-id' });
    const offer = examFeedbackOffer({ examKey: 'telc_b1', telcVariantId, ...trial });
    assert.equal(offer.title, EXAM_COURSE.name);
    assert.equal(offer.href, sale === 'true' ? `/subscription?buy=${EXAM_COURSE.key}` : '/telc-b1-komplettvorbereitung/');
  }
  assert.equal(examFeedbackOffer({ examKey: 'telc_b1', ...trial }).href, '/telc-b1-komplettvorbereitung/');
});

test('other writing exams receive the matching existing station or Pro offer', () => {
  for (const examKey of ['goethe_a1', 'goethe_a2']) {
    const track = EXAM_TRACKS.find((t) => t.key === examKey);
    assert.equal(examFeedbackOffer({ examKey, ...trial }).href, stationFor(track.sublevels[1]).coursePage);
  }
  const b2 = examFeedbackOffer({ examKey: 'telc_b2', ...trial });
  assert.deepEqual(b2, proFeedbackDoor());
  assert.equal(b2.title, PRO_OFFER.monthly.name);
  assert.equal(b2.href, '/pricing/#pro');
});

test('the moment decides: trial result → offer, trial limit → Pro door, trial over → offer, paid → nothing', () => {
  const offer = examFeedbackOffer({ examKey: 'goethe_a1', ...trial });
  // After feedback on the trial.
  assert.deepEqual(writingOfferMoment({ result: { tier: 'free_trial', total_score: 12 }, offer }), { kind: 'after_feedback', offer });
  // The trial's 429: Pro is what adds evaluations.
  assert.deepEqual(writingOfferMoment({ error: { error: 'limit_reached', tier: 'free_trial', used: 2, limit: 2 }, offer }),
    { kind: 'trial_limit', offer: proFeedbackDoor() });
  // The trial is over (403): the matching offer — or the Pro door when the learner already owns the course.
  assert.deepEqual(writingOfferMoment({ error: { error: 'subscription_required', tier: 'free_expired' }, offer }), { kind: 'trial_over', offer });
  assert.deepEqual(writingOfferMoment({ error: { error: 'subscription_required' }, offer: null }), { kind: 'trial_over', offer: proFeedbackDoor() });
  // Paid learners: no offer after feedback, and none at Pro's monthly cap.
  assert.equal(writingOfferMoment({ result: { tier: 'pro' }, offer: null }), null);
  assert.equal(writingOfferMoment({ result: { tier: 'pro' }, offer }), null, 'the server tier wins over a stale client view');
  assert.equal(writingOfferMoment({ error: { error: 'limit_reached', tier: 'pro' }, offer }), null);
  assert.equal(writingOfferMoment({ error: { error: 'text too short' }, offer }), null);
  assert.equal(writingOfferMoment({}), null);
});

test('the writing page renders each moment with the shared card and reports the refusals as a paywall', () => {
  const page = read('src/pages/SchreibenPage.jsx');
  assert.match(page, /examFeedbackOffer\(\{\s*examKey: activeTask\?\.examKey,\s*hasPaidAccess,\s*hasProduct,/);
  assert.match(page, /telcVariantId: LEMONSQUEEZY_CONFIG\.courses\.telc_b1_komplett\.variantId/);
  assert.match(page, /loading: subscriptionLoading/);
  assert.doesNotMatch(page, /hasLevelAccess/, 'the trial is not paid access');
  assert.match(page, /const offerMoment = writingOfferMoment\(\{ result, error: errorBody, offer: feedbackOffer \}\);/);
  // After feedback, below the result …
  assert.match(page, /\{result && \([\s\S]*<CompletionMoment[\s\S]*\{offerMoment\?\.kind === 'after_feedback' && \(\s*<Card[\s\S]*<Button href=\{offerMoment\.offer\.href\}/);
  // … and under the refusal, where it used to be text with no button.
  assert.match(page, /\{errorMsg && paywallKind && \(\s*<Card[\s\S]*?<Button href=\{offerMoment\.offer\.href\}/);
  assert.match(page, /trackPaywallShown\('writing_limit', \{ moment: paywallKind, offer: paywallOffer \}\)/);
  // The alert names the offer the card shows; Sie throughout.
  assert.match(page, /weitere Bewertungen gibt es mit „\$\{shown\.title\}“/);
  assert.match(page, /Mit Pro bekommen Sie mehr Bewertungen pro Monat\./);
});
