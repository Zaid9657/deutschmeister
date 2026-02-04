import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../contexts/SubscriptionContext';
import { X, Sparkles } from 'lucide-react';

const TrialBanner = () => {
  const { i18n } = useTranslation();
  const { isInFreeTrial, getTrialDaysRemaining, hasActiveSubscription } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  const isGerman = i18n.language === 'de';

  if (dismissed || !isInFreeTrial() || hasActiveSubscription()) return null;

  const daysLeft = getTrialDaysRemaining();

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white px-4 py-2.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <p className="text-sm font-medium">
            {isGerman
              ? `${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tage'} in deiner kostenlosen Testphase verbleibend`
              : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left in your free trial`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/subscription"
            className="text-sm font-semibold bg-white text-orange-600 px-3 py-1 rounded-full hover:bg-orange-50 transition-colors"
          >
            {isGerman ? 'Jetzt abonnieren' : 'Subscribe now'}
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialBanner;
