import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import Button from './ui/Button';

export default function SessionTimeoutModal({ show, onStay }) {
  const buttonRef = useRef(null);

  // Dialog semantics + focus handling. Without these the overlay is invisible to
  // assistive tech, focus stays on whatever was behind it, and Escape does
  // nothing — so a keyboard user could not reach the only button in it.
  useEffect(() => {
    if (!show) return;
    const previouslyFocused = document.activeElement;
    buttonRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onStay?.();
        return;
      }
      // Only one focusable element, so keep Tab on it rather than letting focus
      // escape to the page behind the overlay.
      if (e.key === 'Tab') {
        e.preventDefault();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [show, onStay]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-timeout-title"
            aria-describedby="session-timeout-desc"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-overlay border border-rule p-6 max-w-sm w-full text-center"
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-siegel-wash flex items-center justify-center">
              <Clock className="w-6 h-6 text-siegel" aria-hidden="true" />
            </div>
            <h2 id="session-timeout-title" className="font-display text-lg font-semibold text-ink mb-2">
              Your session is about to end
            </h2>
            <p id="session-timeout-desc" className="text-sm text-graphite mb-6">
              You'll be signed out automatically in 2 minutes.
            </p>
            <Button ref={buttonRef} onClick={onStay} size="lg" className="w-full">
              Stay signed in
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
