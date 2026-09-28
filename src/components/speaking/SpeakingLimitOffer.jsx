import { useEffect } from 'react';
import { Crown, GraduationCap, Mic } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import { eur, PLANS } from '../../data/pricing.js';
import { FREE_LEVEL_LABEL, LEVEL_COUNT, SPEAKING_LINE, TRIAL_SPEAKING_SESSIONS } from '../../data/marketing.js';
import { trackPaywallShown } from '../../lib/funnelTracking';

// The offer at the free-speaking limit (docs/SCORECARD.md work order #7b).
// Which product to show is decided by src/lib/speakingOffer.js
// (speakingLimitOffer). This file only renders it. Every price derives from
// pricing.js and every claim from marketing.js (tests/claims.test.mjs lists
// this file). A course card exists only when its checkout id is set, because
// the pure function never returns one otherwise. Both buttons go to
// /subscription?buy=<key>, the same resume path a signed-out Buy click uses, so
// the checkout, its poll and its purchase tracking are the existing ones.

const HEADLINES = {
  sessions_used: 'Your free speaking sessions are used up',
  trial_over: 'Your free trial has ended',
  mission_locked: 'This mission is part of Pro',
};

const LEADS = {
  sessions_used: `A free account includes ${TRIAL_SPEAKING_SESSIONS} AI speaking sessions.`,
  trial_over: 'AI speaking practice continues with Pro.',
  mission_locked: 'Guided missions come with Pro.',
};

const levelCode = (level) => String(level || '').toUpperCase();

/** Why the offer is Pro, when the learner's level has no course to buy. */
function fallbackNote(offer) {
  const code = levelCode(offer.level);
  switch (offer.reason) {
    case 'coming_soon':
      return `The ${code} course is coming soon. Pro covers ${code} today.`;
    case 'free_level':
      return `Your ${FREE_LEVEL_LABEL} lessons stay free. Pro adds AI speaking practice.`;
    case 'owned':
      return `Your ${code} course stays yours. Pro adds AI speaking practice.`;
    default:
      return null;
  }
}

export default function SpeakingLimitOffer({ offer, moment = 'sessions_used' }) {
  // One paywall_shown per offer the learner actually sees, with what was shown.
  const kind = offer?.kind;
  const reason = offer?.reason;
  const level = offer?.level;
  useEffect(() => {
    if (kind) trackPaywallShown('speaking_limit', { offer: kind, reason, level, moment });
  }, [kind, reason, level, moment]);

  if (!offer) return null;
  const proPrice = `${eur(PLANS.monthly.price)}/month`;
  const course = offer.kind === 'course' ? offer.course : null;
  const note = course ? null : fallbackNote(offer);

  return (
    <Card raised edge="siegel" className="mb-4 p-5 sm:p-6" data-speaking-offer={offer.kind}>
      <Chip tone="label" className="mb-3">
        <Mic className="w-3 h-3" /> Speaking practice
      </Chip>
      <h2 className="font-display text-[1.25rem] font-semibold leading-snug text-ink">
        {HEADLINES[moment] || HEADLINES.sessions_used}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-graphite">{LEADS[moment] || LEADS.sessions_used}</p>

      {course ? (
        <>
          <Card tone="wash" className="mt-4 p-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-siegel-deep" />
              <span className="font-bold text-ink">{course.name}</span>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-graphite">
              <li>One payment of {eur(course.price)}, and the course is yours to keep</li>
              <li>{course.proMonths} months of Pro included, with {SPEAKING_LINE}</li>
            </ul>
          </Card>
          <Button to={offer.courseHref} size="lg" shimmer className="mt-4 w-full text-center">
            Get the {course.code} course — {eur(course.price)} once
          </Button>
          <Button to={offer.pro.href} variant="secondary" className="mt-3 w-full text-center">
            <Crown className="w-4 h-4" /> Or go Pro — {proPrice}
          </Button>
        </>
      ) : (
        <>
          {note && <p className="mt-3 text-sm leading-relaxed text-ink">{note}</p>}
          <ul className="mt-3 space-y-1 text-sm text-graphite">
            <li>{SPEAKING_LINE}</li>
            <li>All {LEVEL_COUNT} levels, A1.1 to B2.2</li>
          </ul>
          <Button to={offer.pro.href} size="lg" shimmer className="mt-4 w-full text-center">
            <Crown className="w-5 h-5" /> Go Pro — {proPrice}
          </Button>
          <Button to={offer.pro.plansHref} variant="secondary" className="mt-3 w-full text-center">
            See all plans
          </Button>
        </>
      )}
    </Card>
  );
}
