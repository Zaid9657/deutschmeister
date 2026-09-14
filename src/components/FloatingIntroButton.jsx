import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X } from 'lucide-react';

const DISMISS_KEY = 'dm_intro_dismissed';
const DISMISS_DAYS = 7;
const SUPPRESSED_ROUTES = [
  '/intro',
  '/signup',
  '/login',
  '/reset-password',
  '/update-password',
  '/verify-email',
  '/level-test',
  '/analyze',
  '/speaking',
  '/schreiben',
  '/modelltest',
];

const FloatingIntroButton = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const isSuppressedRoute = SUPPRESSED_ROUTES.some((route) => (
    location.pathname === route || location.pathname.startsWith(`${route}/`)
  ));

  // Check dismissal state on mount
  useEffect(() => {
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const elapsed = Date.now() - parseInt(dismissedAt, 10);
        if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) {
          setDismissed(true);
          return;
        }
      }
      setDismissed(false);
    } catch {
      setDismissed(false);
    }
  }, []);

  // Delay entrance animation
  useEffect(() => {
    if (dismissed || isSuppressedRoute) return;
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [dismissed, isSuppressedRoute]);

  const handleDismiss = (e) => {
    e.stopPropagation();
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch { /* ignore */ }
    setDismissed(true);
  };

  const handleClick = () => {
    navigate('/intro');
  };

  // Keep the prompt away from forms and focused assessment experiences.
  if (dismissed || isSuppressedRoute) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-24 left-4 z-50 sm:bottom-6 sm:left-6"
        >
          <div className="relative">
            <button
              onClick={handleClick}
              className="flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-pill bg-siegel text-white font-bold shadow-raise-siegel hover:bg-siegel-lift transition-all duration-100 ease-snap active:translate-y-1 active:shadow-none"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Play size={16} className="ml-0.5" fill="white" />
              </div>
              <span className="text-sm">Watch Intro</span>
            </button>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute -top-5 -right-5 min-w-11 min-h-11 rounded-pill text-paper flex items-center justify-center"
              aria-label="Dismiss intro video prompt"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-ink transition-colors hover:bg-graphite">
                <X size={12} aria-hidden="true" />
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingIntroButton;
