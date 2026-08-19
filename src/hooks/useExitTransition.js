// Keeps an element mounted long enough to animate itself out.
//
// CSS can animate an element in, but not out: once React removes it from the
// tree there is nothing left to animate. That single gap is what framer-motion's
// AnimatePresence was buying in the app shell — and it cost 103 kB on the
// critical path of every route, including ones that animate nothing.
//
// Usage — attach `ref` to the element that carries the animation class:
//
//   const menu = useExitTransition(isOpen);
//   {menu.mounted && (
//     <div ref={menu.ref} className={menu.closing ? 'dm-fade-out' : 'dm-fade-in'}>…</div>
//   )}
//
// The unmount is driven by the element's own `animationend`, not by a duration
// copied from the stylesheet. A timer looks equivalent and isn't: the browser
// does not necessarily start the animation on the frame the class changes, and
// a measured run had the animation's currentTime still at 0 more than 100ms in.
// A 200ms timer against a 200ms animation therefore tore the element out at
// roughly 0.9 opacity — still a blink, just a slower one. Listening to the
// animation removes both that race and the duplicated duration constant.
import { useCallback, useEffect, useRef, useState } from 'react';

// Only used when no animation runs at all (reduced motion, a display:none
// ancestor, a missing class). Long enough never to truncate a real animation.
const FALLBACK_MS = 600;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {boolean} open whether the element should be shown
 * @returns {{mounted: boolean, closing: boolean, ref: (node: HTMLElement|null) => void}}
 */
export function useExitTransition(open) {
  const [mounted, setMounted] = useState(Boolean(open));
  const [closing, setClosing] = useState(false);
  const nodeRef = useRef(null);
  const timer = useRef(null);

  // A callback ref, so the element is captured on the render that mounts it.
  const ref = useCallback((node) => { nodeRef.current = node; }, []);

  useEffect(() => {
    // Opening — including re-opening part-way through an exit — cancels it.
    if (open) {
      setClosing(false);
      setMounted(true);
      return undefined;
    }
    if (!mounted) return undefined;

    // With reduced motion the exit animation is suppressed in CSS, so holding
    // the element would just leave it sitting there. Drop it immediately.
    if (prefersReducedMotion()) {
      setClosing(false);
      setMounted(false);
      return undefined;
    }

    setClosing(true);
    return undefined;
  }, [open, mounted]);

  useEffect(() => {
    if (!closing) return undefined;

    const node = nodeRef.current;
    const finish = () => {
      setClosing(false);
      setMounted(false);
    };

    // Nothing to animate — don't strand the element.
    if (!node) {
      finish();
      return undefined;
    }

    // animationend bubbles, so a child's animation (the modal's inner panel
    // finishing before its overlay) must not unmount the parent early.
    const onEnd = (event) => {
      if (event.target === node) finish();
    };

    node.addEventListener('animationend', onEnd);
    timer.current = setTimeout(finish, FALLBACK_MS);

    return () => {
      node.removeEventListener('animationend', onEnd);
      clearTimeout(timer.current);
    };
  }, [closing]);

  // A component unmounted mid-exit must not leave a timer setting state.
  useEffect(() => () => clearTimeout(timer.current), []);

  return { mounted, closing, ref };
}
