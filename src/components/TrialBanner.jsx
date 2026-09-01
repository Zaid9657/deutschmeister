import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Zap, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { safeGet, safeSet } from '../utils/safeStorage';
import Button from './ui/Button.jsx';

const DISMISS_KEY = 'dm_trial_banner_dismissed';

const TrialBanner = () => {
  const { user } = useAuth();
  const { profile, loading } = useSubscription();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(
    () => safeGet(DISMISS_KEY, { session: true }) === '1'
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
    safeSet(DISMISS_KEY, '1', { session: true });
    setDismissed(true);
  };

  // Attention = aprikose wash/ink (playbook §1). The three urgencies keep their
  // own icon and copy; the band deepens from a quiet siegel wash (plenty of
  // time) to the aprikose attention band, with a bright aprikose rule once the
  // trial ends today. Never colour alone — the icon and the words carry it.
  let urgency, icon, message, bandClass, dismissClass;

  if (under24h) {
    urgency = 'critical';
    icon = <Clock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />;
    message = 'Your trial ends today!';
    bandClass = 'bg-accent-aprikose-wash text-accent-aprikose-ink border-b-2 border-accent-aprikose';
    dismissClass = 'text-accent-aprikose-ink hover:bg-accent-aprikose/20';
  } else if (daysRemaining <= 3) {
    urgency = 'urgent';
    icon = <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />;
    message = `Only ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left! Don't lose access to all features.`;
    bandClass = 'bg-accent-aprikose-wash text-accent-aprikose-ink border-b border-accent-aprikose/40';
    dismissClass = 'text-accent-aprikose-ink hover:bg-accent-aprikose/20';
  } else {
    urgency = 'normal';
    icon = <Zap className="w-4 h-4 flex-shrink-0 text-siegel" aria-hidden="true" />;
    message = `You have ${daysRemaining} days of full access remaining.`;
    bandClass = 'bg-siegel-wash text-siegel-deep border-b border-rule';
    dismissClass = 'text-siegel-deep hover:bg-siegel/10';
  }

  return (
    <div className={`sticky top-0 z-40 w-full ${bandClass}`} data-urgency={urgency}>
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold min-w-0">
          {icon}
          <span className="truncate">{message}</span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Button href="/pricing/" size="sm" className="whitespace-nowrap">
            <Zap className="w-3 h-3" aria-hidden="true" />
            Upgrade to Pro
          </Button>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className={`p-1 rounded-md transition-colors ${dismissClass}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialBanner;
