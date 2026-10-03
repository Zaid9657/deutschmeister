import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// The course plan as a full-screen sheet (the tab bar's „Kursplan"): a sticky header
// „Kursplan" with an X, and under it the plan (PlanOverview: the promise, what every
// Kapitel holds, the pace, the exam, the textbook „Inhalt"). The page opens it by setting
// #kursplan in the URL, so the browser's back button closes it. While it is open the page
// behind does not scroll, focus moves to the X and stays inside the sheet (Tab wraps), and
// on close it returns to the element that opened it (`returnFocusRef`, the tab).

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export default function KursplanSheet({ open = false, onClose, returnFocusRef = null, children }) {
  const sheetRef = useRef(null);
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const body = document.body;
    const before = body.style.overflow;
    body.style.overflow = 'hidden';
    const back = returnFocusRef && returnFocusRef.current;
    if (closeRef.current) closeRef.current.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onCloseRef.current) onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const items = [...sheetRef.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !sheetRef.current.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      body.style.overflow = before;
      document.removeEventListener('keydown', onKey);
      if (back && typeof back.focus === 'function') back.focus({ preventScroll: true });
    };
  }, [open, returnFocusRef]);

  if (!open) return null;
  return (
    <div
      ref={sheetRef}
      id="dm-kursplan-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dm-kursplan-title"
      className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-course-ground motion-safe:animate-slide-up"
    >
      <div className="sticky top-0 z-10 border-b-2 border-game-line bg-white">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between gap-3 px-4">
          <h2 id="dm-kursplan-title" className="text-xl font-black">Kursplan</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => onCloseRef.current && onCloseRef.current()}
            aria-label="Kursplan schließen"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-game-muted hover:bg-course-wash hover:text-course-ink"
          >
            <X className="h-7 w-7" strokeWidth={2.8} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-xl pb-[max(2rem,env(safe-area-inset-bottom))]">{children}</div>
    </div>
  );
}
