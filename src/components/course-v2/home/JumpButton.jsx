import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

// A small round button that brings the learner back to the current step once it has
// scrolled far out of view (Duolingo's): bottom-right above the tab bar, its arrow
// pointing towards the step. It watches the current node (`anchor`, a DOM id) with an
// IntersectionObserver whose box leaves out the sticky top bars and the tab bar.
export default function JumpButton({ anchor, onJump, lifted = false }) {
  const [where, setWhere] = useState('in');
  useEffect(() => {
    setWhere('in');
    if (!anchor || typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function') return undefined;
    const el = document.getElementById(anchor);
    if (!el) return undefined;
    const io = new window.IntersectionObserver(([entry]) => {
      if (!entry) return;
      if (entry.isIntersecting) setWhere('in');
      // above or below the observed box (not the viewport: the box leaves out the sticky bars)
      else setWhere(entry.boundingClientRect.top < (entry.rootBounds ? entry.rootBounds.top : 0) ? 'above' : 'below');
    }, { rootMargin: '-140px 0px -90px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [anchor]);

  if (!anchor || where === 'in') return null;
  const Arrow = where === 'above' ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onJump}
      aria-label="Zum aktuellen Lernschritt"
      className={`fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-b-4 border-game-line bg-white text-course-ink transition-transform duration-100 hover:bg-course-wash active:translate-y-0.5 motion-safe:animate-pop-in ${
        lifted ? 'bottom-[9.5rem] lg:bottom-24' : 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))]'
      }`}
    >
      <Arrow className="h-7 w-7" strokeWidth={3} aria-hidden="true" />
    </button>
  );
}
