import { useEffect, useRef } from 'react';
import { PartyPopper, ArrowRight } from 'lucide-react';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import confettiBurst from '../lib/confetti.js';

// The completion moment — renovation Phase 4b.
//
// Before this, every result screen in the app ended in "Back / Try Again":
// a learner who finished something was handed no forward motion at all
// (SpeakingPage even passed onNextLevel={undefined} deliberately). This strip
// closes the loop with a celebration line and ONE primary next action.
//
// Playful Depth (docs/design/playbook.md): pass = celebrate, fail = calm. An
// earned moment gets one confetti burst on mount and the single `celebrate`
// button the tokens' rule 2 allows; `celebrate={false}` renders the same strip
// calm — siegel primary, no confetti — for a result that was not a win.
//
// Purely presentational — callers decide what "next" means:
//   headline     — the celebration line ("Exercise complete!")
//   detail       — optional supporting line ("That's one more toward today's goal")
//   nextLabel    — the ONE primary action's label
//   nextHref     — its destination; rendered as <Link> unless fullLoad
//   onNext       — alternative click handler (wins over nextHref)
//   fullLoad     — render a full-page <a> (Astro-served destinations)
//   celebrate    — a real completion (default) → confetti once + celebrate button
const CompletionMoment = ({ headline, detail, nextLabel, nextHref, onNext, fullLoad = false, celebrate = true }) => {
  // Once per mount — the ref guards StrictMode's double effect and re-renders.
  const firedRef = useRef(false);
  useEffect(() => {
    if (!celebrate || firedRef.current) return;
    firedRef.current = true;
    confettiBurst();
  }, [celebrate]);

  const variant = celebrate ? 'celebrate' : 'primary';
  const action = onNext ? (
    <Button variant={variant} onClick={onNext}>
      {nextLabel} <ArrowRight size={16} />
    </Button>
  ) : fullLoad ? (
    <Button variant={variant} href={nextHref}>
      {nextLabel} <ArrowRight size={16} />
    </Button>
  ) : (
    <Button variant={variant} to={nextHref}>
      {nextLabel} <ArrowRight size={16} />
    </Button>
  );

  return (
    <Card
      raised
      tone={celebrate ? 'himbeer' : 'wash'}
      edge={celebrate ? 'himbeer' : 'siegel'}
      className="animate-pop-in p-5 text-center"
    >
      <div className="flex items-center justify-center gap-2 mb-1.5">
        <PartyPopper size={18} className={celebrate ? 'animate-wiggle text-accent-himbeer-ink' : 'text-siegel'} />
        <span className="font-display font-semibold text-ink">{headline}</span>
      </div>
      {detail && <p className="text-sm text-graphite mb-3">{detail}</p>}
      <div className={detail ? '' : 'mt-3'}>{action}</div>
      {celebrate && (
        // The honest-testimonial pipeline starts here: the site shows no
        // reviews until real learners write them (the counts rule in
        // src/data/marketing.js), so the one place we ask is an earned win.
        // A quiet line, never a modal — the moment belongs to the learner.
        <a
          href="mailto:zaid@deutsch-meister.de?subject=My%20DeutschMeister%20experience"
          className="mt-3 block font-data text-[0.6875rem] text-graphite transition-colors hover:text-siegel-deep"
        >
          Enjoying DeutschMeister? Tell us in two sentences →
        </a>
      )}
    </Card>
  );
};

export default CompletionMoment;
