import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { safeGet, safeSet } from '../../utils/safeStorage.js';
import { prefersReducedMotion } from '../../lib/motion.js';

// Three coach-marks for the first visit to the A1.1 course home: the path,
// the Continue card and the exam-date plan. Shown once per browser
// (`dm_tour_a11` via safeStorage, so a blocked localStorage means "show it,
// never crash"), dismissible at every step, Escape closes.
//
// How it anchors: each step names a `target`, and the integrator marks the
// matching element on the course home with `data-tour="<target>"`. When a step
// opens, that element is scrolled into view (instantly under
// prefers-reduced-motion) and given a siegel ring while the step is up. A
// missing target is fine — the card still shows, it just has nothing to point
// at — so the tour can ship before the home is wired and never throws.
//
// Accessibility: role="dialog" with a label, focus moves into the card on
// open and returns to the previously focused element on close, Escape closes.
// No focus trap on purpose: the page behind stays usable, the tour is a hint,
// not a wall. Not aria-modal for the same reason.
//
// Props: `curriculum` + `meta` (A11_META) for the counts in the default copy,
// or `steps` to supply your own [{ target, title, body }]; `storageKey`,
// `onDone`. Copy is English (course-home chrome). One interactive colour, no case
// colours, no accents on the CTA (tokens rule 2).

export const TOUR_KEY = 'dm_tour_a11';

/**
 * The three default steps. Counts are read off the curriculum/meta when given
 * (never typed — a content edit must carry the tour with it); without them the
 * wording stays generic.
 */
export const defaultSteps = ({ curriculum, meta } = {}) => [
  {
    target: 'path',
    title: 'This is your path',
    body: curriculum && meta
      ? `${curriculum.lektionen.length} short Lektionen in ${meta.chapters.length} chapters. Each Lektion is one everyday situation, and every ${meta.chapters[0]?.lektionen.length ?? 3} Lektionen a checkpoint shows you what stuck.`
      : 'Short Lektionen in a few chapters. Each Lektion is one everyday situation, and a checkpoint after each chapter shows you what stuck.',
  },
  {
    target: 'continue',
    title: 'One thing to press',
    body: 'This card always shows the next unit. Come back any time, tap it, and you are back where you left off — no account needed for that.',
  },
  {
    target: 'plan',
    title: 'Your exam date, if you have one',
    body: 'Set a date and the course tells you how many units a week are enough. It only ever suggests a pace; it never locks a Lektion.',
  },
];

const RING = ['ring-2', 'ring-siegel', 'ring-offset-2', 'ring-offset-paper', 'rounded-clay'];

const findTarget = (name) => {
  if (typeof document === 'undefined' || !name) return null;
  return document.querySelector(`[data-tour="${name}"]`);
};

/** Was the tour already seen in this browser? Exported so the integrator can decide before mounting. */
export const tourSeen = (key = TOUR_KEY) => safeGet(key) === '1';

export default function FirstRunTour({ curriculum, meta, steps: stepsProp, storageKey = TOUR_KEY, onDone, className = '' }) {
  const [steps] = useState(() => stepsProp ?? defaultSteps({ curriculum, meta }));
  const [open, setOpen] = useState(() => !tourSeen(storageKey) && steps.length > 0);
  const [index, setIndex] = useState(0);
  const cardRef = useRef(null);
  const restoreFocus = useRef(null);

  const close = useCallback(() => {
    safeSet(storageKey, '1');
    setOpen(false);
    onDone?.();
  }, [storageKey, onDone]);

  // Focus in on open, back out on close.
  useEffect(() => {
    if (!open) return undefined;
    restoreFocus.current = typeof document !== 'undefined' ? document.activeElement : null;
    cardRef.current?.focus({ preventScroll: true });
    return () => {
      const el = restoreFocus.current;
      if (el && typeof el.focus === 'function') el.focus({ preventScroll: true });
    };
  }, [open]);

  // Escape closes, from anywhere on the page.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Point at the current step's target: scroll it into view and ring it.
  useEffect(() => {
    if (!open) return undefined;
    const el = findTarget(steps[index]?.target);
    if (!el) return undefined;
    el.classList.add(...RING);
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
    return () => el.classList.remove(...RING);
  }, [open, index, steps]);

  if (!open) return null;

  const step = steps[index];
  const last = index === steps.length - 1;
  const titleId = `dm-tour-title-${index}`;
  const bodyId = `dm-tour-body-${index}`;

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      tabIndex={-1}
      className={`fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-clay border border-rule bg-white p-4 shadow-raise-lg outline-none transition-transform duration-150 ease-snap motion-reduce:transition-none sm:bottom-6 ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] text-graphite">
          Quick tour · {index + 1} of {steps.length}
        </p>
        <button
          type="button"
          onClick={close}
          aria-label="Close the tour"
          className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full text-graphite hover:bg-siegel-wash hover:text-siegel-deep"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <p id={titleId} className="mt-1 font-bold text-ink">{step.title}</p>
      <p id={bodyId} className="mt-1 text-[0.875rem] leading-relaxed text-graphite">{step.body}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={close}
          className="font-data text-[0.75rem] font-bold uppercase tracking-[0.13em] text-graphite hover:text-ink"
        >
          Skip
        </button>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setIndex((i) => Math.max(0, i - 1))}>
              Back
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={last ? close : () => setIndex((i) => i + 1)}>
            {last ? 'Got it' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
