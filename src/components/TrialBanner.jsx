import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Zap, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

const DISMISS_KEY = 'dm_trial_banner_dismissed';

const TrialBanner = () => {
  const { user } = useAuth();
  const { profile, loading } = useSubscription();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === '1'
  );

  if (loading || !user || dismissed) return null;
  if (location.pathname === '/pricing') return null;

  // Only show for free-tier users (not subscribed)
  if (profile?.subscription_tier !== 'free' && profile?.subscription_tier != null) return null;
  if (profile?.is_subscribed) return null;

  const trialEndsAt = profile?.trial_ends_at;
  if (!trialEndsAt) return null;

  const now = Date.now();
  const endsMs = new Date(trialEndsAt).getTime();
  if (endsMs <= now) return null;

  const msRemaining = endsMs - now;
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  const under24h = msRemaining < 24 * 60 * 60 * 1000;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  let urgency, icon, message, bgClass, textClass, borderClass, btnClass, dismissClass;

  if (under24h) {
    urgency = 'critical';
    icon = <Clock className="w-4 h-4 flex-shrink-0" />;
    message = 'Your trial ends today!';
    bgClass = 'bg-red-600';
    textClass = 'text-white';
    borderClass = '';
    btnClass = 'bg-white text-red-700 hover:bg-red-50';
    dismissClass = 'text-white/70 hover:text-white hover:bg-white/20';
  } else if (daysRemaining <= 3) {
    urgency = 'urgent';
    icon = <AlertTriangle className="w-4 h-4 flex-shrink-0" />;
    message = `Only ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left! Don't lose access to all features.`;
    bgClass = 'bg-orange-500';
    textClass = 'text-white';
    borderClass = '';
    btnClass = 'bg-white text-orange-700 hover:bg-orange-50';
    dismissClass = 'text-white/70 hover:text-white hover:bg-white/20';
  } else {
    urgency = 'normal';
    icon = <Zap className="w-4 h-4 flex-shrink-0 text-blue-500" />;
    message = `You have ${daysRemaining} days of full access remaining.`;
    bgClass = 'bg-[#E6F1FB]';
    textClass = 'text-slate-800';
    borderClass = 'border-b border-blue-200';
    btnClass = 'bg-blue-600 text-white hover:bg-blue-700';
    dismissClass = 'text-slate-500 hover:text-slate-700 hover:bg-blue-100';
  }

  return (
    <div className={`sticky top-0 z-40 w-full ${bgClass} ${borderClass}`} data-urgency={urgency}>
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <div className={`flex items-center gap-2 text-sm font-medium ${textClass} min-w-0`}>
          {icon}
          <span className="truncate">{message}</span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/pricing"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${btnClass}`}
          >
            <Zap className="w-3 h-3" />
            Upgrade to Pro
          </Link>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className={`p-1 rounded transition-colors ${dismissClass}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialBanner;
