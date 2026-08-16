import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Routes that can actually open a Lemon Squeezy checkout. Everywhere else the
// script is dead weight (it used to load on every page of the app).
const COMMERCE_ROUTES = ['/pricing', '/subscription', '/payment', '/profile', '/dashboard'];

// Load LemonSqueezy.js script for popup checkout — only on commerce routes.
const LemonSqueezyProvider = ({ children }) => {
  const { pathname } = useLocation();
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
    document.head.appendChild(script);
  }, [needed]);

  return children;
};

export default LemonSqueezyProvider;
