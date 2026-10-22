import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext';

// Routes that can actually open a Lemon Squeezy checkout. Everywhere else the
// script is dead weight (it used to load on every page of the app).
const COMMERCE_ROUTES = ['/pricing', '/subscription', '/payment', '/profile', '/dashboard'];

// Load LemonSqueezy.js script for popup checkout — only on commerce routes.
const LemonSqueezyProvider = ({ children }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { refreshSubscription } = useSubscription();
  const refreshRef = useRef(refreshSubscription);
  refreshRef.current = refreshSubscription;
  const needed = COMMERCE_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  useEffect(() => {
    if (!needed) return;
    // Check if script already exists (keep it once loaded — cheaper than
    // re-injecting on every route change between commerce pages)
    if (document.querySelector('script[src*="lemon.js"]')) {
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://app.lemonsqueezy.com/js/lemon.js';
    script.defer = true;
    // The success page waits for the purchased product to land. Existing Pro
    // must not make a newly bought course look confirmed before its refresh.
    script.onload = () => {
      try {
        window.createLemonSqueezy?.();
        window.LemonSqueezy?.Setup?.({
          eventHandler: (evt) => {
            if (evt?.event === 'Checkout.Success') {
              refreshRef.current();
              navigate('/subscription/success');
            }
          },
        });
      } catch {
        /* overlay optional */
      }
    };
    document.head.appendChild(script);
  }, [needed, navigate]);

  return children;
};

export default LemonSqueezyProvider;
