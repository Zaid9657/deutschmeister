import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Crown } from 'lucide-react';

const LockedContentOverlay = () => {
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {isGerman ? 'Zugang erforderlich' : 'Access Required'}
        </h2>
        <p className="text-slate-600 mb-6">
          {isGerman
            ? 'Abonniere DeutschMeister, um auf alle Inhalte zuzugreifen und dein Deutsch zu verbessern.'
            : 'Subscribe to DeutschMeister to access all content and improve your German.'}
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/subscription"
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25"
          >
            {isGerman ? 'Pläne ansehen' : 'View Plans'}
          </Link>
          <Link
            to="/dashboard"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            {isGerman ? 'Zurück zum Dashboard' : 'Back to Dashboard'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LockedContentOverlay;
