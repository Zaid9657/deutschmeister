import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { examFeedbackOffer } from '../src/lib/examFeedbackOffer.js';
import { EXAM_COURSE, PRO_OFFER, stationFor } from '../src/data/offers.js';
import { EXAM_TRACKS } from '../src/data/examTracks.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('feedback offer stays hidden while loading and for matching level access or purchase', () => {
  for (const track of EXAM_TRACKS.filter((t) => t.hasWriting)) {
    const args = { examKey: track.key, telcVariantId: 'checkout-id' };
    const level = track.sublevels[track.sublevels.length - 1];
    assert.equal(examFeedbackOffer({ ...args, loading: true }), null);
    assert.equal(examFeedbackOffer({ ...args, hasLevelAccess: (l) => l === level }), null);
    const key = track.key === 'telc_b1' ? EXAM_COURSE.key : stationFor(level).productKey;
    assert.equal(examFeedbackOffer({ ...args, hasProduct: (k) => k === key }), null);
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
    const offer = examFeedbackOffer({ examKey: 'telc_b1', telcVariantId });
    assert.equal(offer.title, EXAM_COURSE.name);
    assert.equal(offer.href, sale === 'true' ? `/subscription?buy=${EXAM_COURSE.key}` : '/telc-b1-komplettvorbereitung/');
  }
  assert.equal(examFeedbackOffer({ examKey: 'telc_b1' }).href, '/telc-b1-komplettvorbereitung/');
});

test('other writing exams receive the matching existing station or Pro offer', () => {
  for (const examKey of ['goethe_a1', 'goethe_a2']) {
    const track = EXAM_TRACKS.find((t) => t.key === examKey);
    assert.equal(examFeedbackOffer({ examKey }).href, stationFor(track.sublevels[1]).coursePage);
  }
  const b2 = examFeedbackOffer({ examKey: 'telc_b2' });
  assert.equal(b2.title, PRO_OFFER.monthly.name);
  assert.equal(b2.href, '/pricing/#pro');
});

test('the writing screen appends the guarded offer after feedback using shared UI and the gated client id', () => {
  const page = read('src/pages/SchreibenPage.jsx');
  assert.match(page, /examFeedbackOffer\(\{\s*examKey: activeTask\?\.examKey,\s*hasLevelAccess,\s*hasProduct,/);
  assert.match(page, /telcVariantId: LEMONSQUEEZY_CONFIG\.courses\.telc_b1_komplett\.variantId/);
  assert.match(page, /loading: subscriptionLoading/);
  assert.match(page, /\{result && \([\s\S]*<CompletionMoment[\s\S]*\{feedbackOffer && \(\s*<Card[\s\S]*<Button href=\{feedbackOffer\.href\}/);
});
