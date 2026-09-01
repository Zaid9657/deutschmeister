import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PartyPopper, ArrowRight } from 'lucide-react';

// The completion moment — renovation Phase 4b.
//
// Before this, every result screen in the app ended in "Back / Try Again":
// a learner who finished something was handed no forward motion at all
// (SpeakingPage even passed onNextLevel={undefined} deliberately). This strip
// closes the loop with a celebration line and ONE primary next action.
//
// Purely presentational — callers decide what "next" means:
//   headline     — the celebration line ("Exercise complete!")
//   detail       — optional supporting line ("That's one more toward today's goal")
//   nextLabel    — the ONE primary action's label
//   nextHref     — its destination; rendered as <Link> unless fullLoad
//   onNext       — alternative click handler (wins over nextHref)
//   fullLoad     — render a full-page <a> (Astro-served destinations)
const CompletionMoment = ({ headline, detail, nextLabel, nextHref, onNext, fullLoad = false }) => {
  const actionClass =
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-siegel text-white text-sm font-semibold hover:bg-siegel-lift active:bg-siegel-deep transition-colors';

  const action = onNext ? (
    <button onClick={onNext} className={actionClass}>
      {nextLabel} <ArrowRight size={16} />
    </button>
  ) : fullLoad ? (
    <a href={nextHref} className={actionClass}>
      {nextLabel} <ArrowRight size={16} />
    </a>
  ) : (
    <Link to={nextHref} className={actionClass}>
      {nextLabel} <ArrowRight size={16} />
    </Link>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-2xl border border-siegel/25 bg-siegel-wash p-5 text-center"
    >
      <div className="flex items-center justify-center gap-2 mb-1.5">
        <PartyPopper size={18} className="text-siegel" />
        <span className="font-display font-semibold text-ink">{headline}</span>
      </div>
      {detail && <p className="text-sm text-graphite mb-3">{detail}</p>}
      <div className={detail ? '' : 'mt-3'}>{action}</div>
    </motion.div>
  );
};

export default CompletionMoment;
