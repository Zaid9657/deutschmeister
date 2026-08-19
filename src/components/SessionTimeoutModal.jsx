import { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { useExitTransition } from '../hooks/useExitTransition';

export default function SessionTimeoutModal({ show, onStay }) {
  const buttonRef = useRef(null);
  const { mounted, closing, ref } = useExitTransition(show);

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

  if (!mounted) return null;

  return (
    <div ref={ref} className={`${closing ? 'dm-fade-out' : 'dm-fade-in'} fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4`}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-timeout-title"
        aria-describedby="session-timeout-desc"
        className={`${closing ? 'dm-pop-out' : 'dm-pop-in'} bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 max-w-sm w-full text-center`}
      >
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
          <Clock className="w-6 h-6 text-amber-600" aria-hidden="true" />
        </div>
        <h2 id="session-timeout-title" className="font-display text-lg font-bold text-slate-800 mb-2">
          Your session is about to end
        </h2>
        <p id="session-timeout-desc" className="text-sm text-slate-600 mb-6">
          You'll be signed out automatically in 2 minutes.
        </p>
        <button
          ref={buttonRef}
          onClick={onStay}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-rose-600 transition-all shadow-lg shadow-rose-500/25"
        >
          Stay signed in
        </button>
      </div>
    </div>
  );
}
