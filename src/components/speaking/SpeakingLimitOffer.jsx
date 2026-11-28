import { useEffect } from 'react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import { PRICE_TAX_NOTE } from '../../data/pricing.js';
import CoursePrice from '../CoursePrice.jsx';
import { trackPaywallShown } from '../../lib/funnelTracking';
import { SPEAKING_LINE } from '../../data/marketing.js';

export default function SpeakingLimitOffer({ offer, moment = 'sessions_used' }) {
  const kind = offer?.kind;
  const reason = offer?.reason;
  const level = offer?.level;
  useEffect(() => { if (kind) trackPaywallShown('speaking_limit', { offer: kind, reason, level, moment }); }, [kind, reason, level, moment]);
  if (!offer) return null;
  const course = kind === 'course' ? offer.course : null;
  return <Card className="mb-4 p-5" data-speaking-offer={kind}>
    <h2 className="font-display text-xl">Continue your speaking practice</h2>
    {course ? <><p>{course.name}: <CoursePrice level={offer.level} /></p><p data-price-tax-note>{PRICE_TAX_NOTE}</p><p>{course.proMonths} months of AI tools included, with {SPEAKING_LINE}.</p><Button to={offer.courseHref} className="mt-4">Get the {course.code} course</Button></>
      : <><p>Your current AI allowance is used up. Your purchased courses stay open. New AI Practice subscriptions are off sale.</p><a href="/courses/">See courses</a></>}
  </Card>;
}
