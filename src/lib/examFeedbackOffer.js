import { examTrackByKey } from '../data/examTracks.js';
import { EXAM_COURSE, PRO_OFFER, stationFor } from '../data/offers.js';

// The Pro door: Pro is what adds exam-writing evaluations (offers.js PRO_OFFER).
export const proFeedbackDoor = () => ({ title: PRO_OFFER.monthly.name, href: '/pricing/#pro', cta: 'Pro ansehen' });

// Pure offer selection. The client passes the already sale-gated checkout id
// from lemonsqueezy.js; this module never reads or duplicates the sale switch.
//
// WHO SEES IT (cross-check 2026-10-25, AI-16): a learner who does not PAY for the
// exam's level. The offer used to hide behind hasLevelAccess(level), which the
// 7-day trial makes true — and exam feedback exists only for trial and paid
// tiers, so no reachable state ever showed it. `hasPaidAccess(level)` is true
// for a running subscription or included Pro window, or a bought course that
// covers the level: the trial learner sees the offer, Pro and owners do not.
export function examFeedbackOffer({ examKey, hasPaidAccess, hasProduct, telcVariantId = '', loading = false } = {}) {
  const track = examTrackByKey(examKey);
  if (loading || !track) return null;
  const level = track.sublevels[track.sublevels.length - 1];
  if (hasPaidAccess?.(level)) return null;

  if (track.key === 'telc_b1') {
    if (hasProduct?.(EXAM_COURSE.key)) return null;
    // There is no client waitlist door. The existing course page carries the
    // pilot invitation while off sale; never send a learner to a dead checkout.
    return {
      title: EXAM_COURSE.name,
      href: telcVariantId ? `/subscription?buy=${EXAM_COURSE.key}` : track.courseHref,
      cta: telcVariantId ? 'Kurs ansehen' : 'Zum Pilotkurs',
    };
  }

  const station = stationFor(level);
  if (station?.productKey && hasProduct?.(station.productKey)) return null;
  if (station?.status === 'ticket') {
    return { title: station.name, href: station.coursePage, cta: 'Kurs ansehen' };
  }
  return proFeedbackDoor();
}

/**
 * Which offer the writing page shows after evaluate-writing answered, or null.
 * The moments a learner actually reaches (the server's tiers decide them):
 *   - a trial result      → the matching offer: the trial's evaluations are few
 *   - 403 subscription_required (the trial is over)
 *                         → the matching offer, else the Pro door (a lapsed
 *                           course window owns its course but not exam feedback)
 *   - 429 limit_reached on the trial → the Pro door: Pro adds evaluations
 *   - a paid result, Pro at its monthly cap, any other error → nothing
 * `result` is the 200 body, `error` a non-OK body, `offer` examFeedbackOffer's answer.
 */
export function writingOfferMoment({ result = null, error = null, offer = null } = {}) {
  if (result) return result.tier === 'free_trial' && offer ? { kind: 'after_feedback', offer } : null;
  if (error?.error === 'subscription_required') return { kind: 'trial_over', offer: offer || proFeedbackDoor() };
  if (error?.error === 'limit_reached' && error.tier === 'free_trial') return { kind: 'trial_limit', offer: proFeedbackDoor() };
  return null;
}
