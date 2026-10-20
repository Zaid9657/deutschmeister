import { examTrackByKey } from '../data/examTracks.js';
import { EXAM_COURSE, PRO_OFFER, stationFor } from '../data/offers.js';

// Pure offer selection. The client passes the already sale-gated checkout id
// from lemonsqueezy.js; this module never reads or duplicates the sale switch.
export function examFeedbackOffer({ examKey, hasLevelAccess, hasProduct, telcVariantId = '', loading = false } = {}) {
  const track = examTrackByKey(examKey);
  if (loading || !track) return null;
  const level = track.sublevels[track.sublevels.length - 1];
  if (hasLevelAccess?.(level)) return null;

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
  return { title: PRO_OFFER.monthly.name, href: '/pricing/#pro', cta: 'Pro ansehen' };
}
