import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Sparkles } from 'lucide-react';
import { trackPaywallShown } from '../lib/funnelTracking';
import Button from './ui/Button';
import Card from './ui/Card.jsx';
import Chip from './ui/Chip.jsx';
import Aurora from './ui/Aurora.jsx';

const LockedContentOverlay = ({ level }) => {
  const { i18n } = useTranslation();

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

        <p className="text-[0.9375rem] leading-relaxed text-graphite sm:text-base mb-2">
          {isGerman
            ? 'Erstelle ein kostenloses Konto, um alle Stufen freizuschalten.'
            : 'Create a free account to unlock all levels beyond A1.1.'}
        </p>

        <p className="text-sm text-graphite mb-6">
          {isGerman
            ? '7 Tage kostenlos testen — keine Kreditkarte nötig'
            : '7-day free trial included — no credit card required'}
        </p>

        <div className="flex flex-col gap-3">
          <Button to="/signup" shimmer size="lg" className="w-full">
            {isGerman ? 'Kostenlos registrieren' : 'Sign Up Free'}
          </Button>

          <Button to="/login" variant="secondary" size="lg" className="w-full">
            {isGerman ? 'Anmelden' : 'Log In'}
          </Button>

          <Link
            to="/level/a1.1"
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
