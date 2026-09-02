// Motion helpers for the SPA half of the Playful Depth system
// (docs/design/playbook.md). The Astro half is Showtime.astro; the two
// implement the same behaviour so a visitor crossing from a static page into
// the app feels one system.
import { useEffect, useRef, useState } from 'react';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// One observer + one scroll-depth sweep for the whole app. The sweep exists
// because IntersectionObserver callbacks can lag on a starved main thread
// during fast scrolling; a card that stays invisible is worse than one that
// skips its entrance — so anything above the deepest point the visitor has
// reached gets revealed on the next sweep.
const pending = new Map(); // el -> setVisible
let io;
let deepest = 0;
let sweepQueued = false;
let listening = false;

function show(el) {
  const set = pending.get(el);
  if (!set) return;
  pending.delete(el);
  io?.unobserve(el);
  set(true);
}

function sweep() {
  sweepQueued = false;
  for (const el of [...pending.keys()]) {
    const docTop = el.getBoundingClientRect().top + window.scrollY;
    if (docTop < deepest - window.innerHeight * 0.05) show(el);
  }
}

function queueSweep() {
  deepest = Math.max(deepest, window.scrollY + window.innerHeight);
  if (!sweepQueued) {
    sweepQueued = true;
    setTimeout(sweep, 150);
  }
}

function observe(el, set) {
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) show(e.target);
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
  }
  if (!listening) {
    window.addEventListener('scroll', queueSweep, { passive: true });
    window.addEventListener('resize', queueSweep);
    listening = true;
  }
  pending.set(el, set);
  io.observe(el);
  queueSweep();
}

/**
 * useReveal — returns [ref, visible]. Attach the ref to the element and
 * render `visible` into a class (see <Reveal/>). Reduced motion → visible
 * immediately, no observer.
 */
export function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => prefersReducedMotion());
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return undefined;
    observe(el, setVisible);
    return () => {
      pending.delete(el);
      io?.unobserve(el);
    };
  }, [visible]);
  return [ref, visible];
}

/**
 * useCountUp — ticks a number from 0 to `target` over ~1.1s the first time
 * the element is visible. Returns [ref, displayValue]. Reduced motion (or
 * SSR) shows the target immediately.
 */
export function useCountUp(target, { duration = 1100 } = {}) {
  const [ref, visible] = useReveal();
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  useEffect(() => {
    if (!visible || prefersReducedMotion()) {
      setValue(target);
      return undefined;
    }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, target, duration]);
  return [ref, value];
}
