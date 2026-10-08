import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Sparkles } from 'lucide-react';
import { trackPaywallShown } from '../lib/funnelTracking';
import Button from './ui/Button';
import Card from './ui/Card.jsx';
import Chip from './ui/Chip.jsx';
import Aurora from './ui/Aurora.jsx';
import { TRIAL_DAYS } from '../data/marketing.js';
import { FREE_COURSE_HREF } from '../data/offers.js';

const LockedContentOverlay = ({ level }) => {
  const { i18n } = useTranslation();
  // The page this lock stands in front of. "Log In" hands it to /login the way
  // every guard's redirect does (state.from, read by LoginPage), so a returning
  // learner lands back on this level, or, without access, on the offer the
  // guard shows there, instead of on /dashboard. tests/lock-login-return.test.mjs.
  const location = useLocation();

  useEffect(() => { trackPaywallShown(level || 'unknown'); }, [level]);
  const isGerman = i18n.language === 'de';

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-paper px-4 py-12">
      <Aurora variant="close" />
      <Card raised className="relative p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-clay bg-siegel shadow-raise-siegel flex items-center justify-center">
          <Lock className="w-8 h-8 text-white" aria-hidden="true" />
        </div>

        {level && (
          <Chip tone="label" className="mb-4">
            Level {level.toUpperCase()}
          </Chip>
        )}

        <h2 className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink mb-2">
          {isGerman ? 'Kostenlos registrieren' : 'Sign Up to Unlock'}
        </h2>

        {/* Signup opens every level for TRIAL_DAYS, then only the free level
            (src/config/freeTier.js). tests/claims.test.mjs holds both lines:
            no free-account-opens-every-level claim without its time bound, and
            no trial length typed by hand. */}
        <p className="text-[0.9375rem] leading-relaxed text-graphite sm:text-base mb-2">
          {isGerman
            ? `Erstellen Sie ein kostenloses Konto und testen Sie alle Stufen ${TRIAL_DAYS} Tage lang.`
            : `Create a free account and try every level for ${TRIAL_DAYS} days.`}
        </p>

        <p className="text-sm text-graphite mb-6">
          {isGerman
            ? 'Keine Kreditkarte nötig · keine automatische Abbuchung, wenn die Testphase endet'
            : 'No credit card required · no automatic charge when the trial ends'}
        </p>

        <div className="flex flex-col gap-3">
          <Button to="/signup" shimmer size="lg" className="w-full">
            {isGerman ? 'Kostenlos registrieren' : 'Sign Up Free'}
          </Button>

          <Button to="/login" state={{ from: location }} variant="secondary" size="lg" className="w-full">
            {isGerman ? 'Anmelden' : 'Log In'}
          </Button>

          {/* The free first stop is the guided course, the door every other
              "A1.1 free" link opens (offers.js FREE_COURSE_HREF). Until
              2026-10-07 this one opened the /level/a1.1 topic library: one
              more hop from Lektion 1, and none of the lesson player's
              save-progress asks. tests/free-door.test.mjs. */}
          <Link
            to={FREE_COURSE_HREF}
            className="inline-flex items-center justify-center gap-2 text-sm font-bold text-siegel transition-colors hover:text-siegel-deep mt-2"
          >
            <Sparkles size={14} aria-hidden="true" />
            {isGerman ? 'A1.1 kostenlos ausprobieren' : 'Try A1.1 for free'}
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default LockedContentOverlay;
