import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X } from 'lucide-react';

const DISMISS_KEY = 'dm_intro_dismissed';
const DISMISS_DAYS = 7;

const FloatingIntroButton = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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
    if (dismissed) return;
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [dismissed]);

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

  // Don't show on /intro page or if dismissed
  if (dismissed || location.pathname === '/intro') return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-6 z-40"
        >
          <div className="relative">
            <button
              onClick={handleClick}
              className="flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 hover:scale-105 transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Play size={16} className="ml-0.5" fill="white" />
              </div>
              <span className="text-sm">Watch Intro</span>
            </button>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-md hover:bg-slate-700 transition-colors"
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingIntroButton;
