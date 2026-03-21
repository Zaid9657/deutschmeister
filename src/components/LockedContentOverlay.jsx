import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Sparkles } from 'lucide-react';

const LockedContentOverlay = ({ level }) => {
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 via-rose-400 to-purple-500 flex items-center justify-center shadow-lg shadow-rose-500/25">
          <Lock className="w-8 h-8 text-white" />
        </div>

        {level && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium mb-4">
            Level {level.toUpperCase()}
          </div>
        )}

        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {isGerman ? 'Kostenlos registrieren' : 'Sign Up to Unlock'}
        </h2>

        <p className="text-slate-600 mb-2">
          {isGerman
            ? 'Erstelle ein kostenloses Konto, um alle Stufen freizuschalten.'
            : 'Create a free account to unlock all levels beyond A1.1.'}
        </p>

        <p className="text-sm text-slate-500 mb-6">
          {isGerman
            ? '7 Tage kostenlos testen — keine Kreditkarte nötig'
            : '7-day free trial included — no credit card required'}
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/signup"
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold hover:from-amber-600 hover:to-rose-600 transition-all shadow-lg shadow-rose-500/25"
          >
            {isGerman ? 'Kostenlos registrieren' : 'Sign Up Free'}
          </Link>

          <Link
            to="/login"
            className="w-full py-3 px-6 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            {isGerman ? 'Anmelden' : 'Log In'}
          </Link>

          <Link
            to="/level/a1.1"
            className="inline-flex items-center justify-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 transition-colors mt-2"
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
