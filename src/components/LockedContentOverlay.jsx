import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Sparkles } from 'lucide-react';
import { trackPaywallShown } from '../lib/funnelTracking';
import Button from './ui/Button';

const LockedContentOverlay = ({ level }) => {
  const { i18n } = useTranslation();

  useEffect(() => { trackPaywallShown(level || 'unknown'); }, [level]);
  const isGerman = i18n.language === 'de';

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-12">
      <div className="bg-white rounded-lg border border-rule shadow-overlay p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-siegel flex items-center justify-center">
          <Lock className="w-8 h-8 text-white" />
        </div>

        {level && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-pill bg-paper-sunk text-graphite text-sm font-medium mb-4">
            Level {level.toUpperCase()}
          </div>
        )}

        <h2 className="font-display text-2xl font-semibold text-ink mb-2">
          {isGerman ? 'Kostenlos registrieren' : 'Sign Up to Unlock'}
        </h2>

        <p className="text-graphite mb-2">
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
          <Button to="/signup" size="lg" className="w-full">
            {isGerman ? 'Kostenlos registrieren' : 'Sign Up Free'}
          </Button>

          <Button to="/login" variant="secondary" size="lg" className="w-full">
            {isGerman ? 'Anmelden' : 'Log In'}
          </Button>

          <Link
            to="/level/a1.1"
            className="inline-flex items-center justify-center gap-2 text-sm text-siegel hover:text-siegel-deep transition-colors mt-2"
          >
            <Sparkles size={14} />
            {isGerman ? 'A1.1 kostenlos ausprobieren' : 'Try A1.1 for free'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LockedContentOverlay;
