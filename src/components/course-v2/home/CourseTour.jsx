import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { courseGame } from '../../../data/design-tokens.js';
import { useV2Strings } from '../strings.js';
import { Dots } from './Welcome.jsx';

// The coach marks on the learn path (pathModel.tourStops; owner 2026-10-01: "still no clear
// structure for the user as an introduction, tour, etc."): four stops — the current node, its
// Kapitel banner, the tab bar, the top bar's numbers — each a spotlight on its target and ONE
// short bubble beside it, with the dots, „Weiter" and a quiet „Überspringen".
//   - A target is the page element with `data-tour="<target>"`; a stop whose target is not on
//     the page is left out. Its box comes from getBoundingClientRect and is measured again on
//     scroll and resize; a target in the path (`scroll`) is scrolled to the middle of the screen
//     first when the bars would hide it — the bars themselves never scroll the page.
//   - The dim is one SVG path with a hole (even-odd), in the game's text colour from
//     design-tokens.js, so no colour is written here; a white ring marks the hole.
//   - A real modal dialog: role="dialog" + aria-modal, labelled by the bubble's title and
//     described by its text; focus moves to the title on every stop and stays in the bubble (Tab
//     wraps), Escape closes it, and on close focus returns (`returnFocus()`, else the element that
//     had it before). The dim takes every tap, so nothing behind it reacts while it is open.
//   - The bubble pops in only when motion is welcome (motion-safe); its buttons are ≥ 44 px.
// The page shows it once per device after the welcome (pathModel.tourStorageKey) and again from
// the top bar's help button; `onClose('done' | 'skipped')` ends it either way.

const PAD = 8; // the spotlight's room around its target, px
const GAP = 16; // between the spotlight and the bubble, px
const EDGE = 12; // the bubble keeps this far from the screen's sides, px
const BAR_TOP = 132; // the site navbar and the course top bar (fixed and sticky, 64 + 66 px)
const BAR_BOTTOM = 80; // the tab bar

const findTarget = (name) => {
  try {
    return document.querySelector(`[data-tour="${name}"]`);
  } catch {
    return null;
  }
};

const viewport = () => (typeof window === 'undefined' ? { w: 390, h: 844 } : { w: window.innerWidth, h: window.innerHeight });

function reducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** The dim with a rounded hole: the screen's rectangle and the hole's, filled even-odd. */
function dimPath(w, h, hole) {
  const outer = `M0 0H${w}V${h}H0Z`;
  if (!hole) return outer;
  const { x, y, r: right, b: bottom } = hole;
  const rad = Math.min(20, (right - x) / 2, (bottom - y) / 2);
  return `${outer}M${x + rad} ${y}H${right - rad}A${rad} ${rad} 0 0 1 ${right} ${y + rad}V${bottom - rad}`
    + `A${rad} ${rad} 0 0 1 ${right - rad} ${bottom}H${x + rad}A${rad} ${rad} 0 0 1 ${x} ${bottom - rad}V${y + rad}`
    + `A${rad} ${rad} 0 0 1 ${x + rad} ${y}Z`;
}

export default function CourseTour({ stops = [], onClose, returnFocus = null }) {
  const [, t] = useV2Strings();
  const [live, setLive] = useState(null); // the stops whose target is on the page
  const [at, setAt] = useState(0);
  const [box, setBox] = useState(null); // the target's box in viewport px
  const [view, setView] = useState(viewport);
  const bubbleRef = useRef(null);
  const headRef = useRef(null);
  const before = useRef(null);
  const stopsRef = useRef(stops);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const returnRef = useRef(returnFocus);
  returnRef.current = returnFocus;

  // on open: which targets are on the page, and who had focus
  useLayoutEffect(() => {
    before.current = typeof document !== 'undefined' ? document.activeElement : null;
    const found = (stopsRef.current || []).filter((s) => s && findTarget(s.target));
    setLive(found);
    if (!found.length && onCloseRef.current) onCloseRef.current('skipped');
  }, []);

  const stop = live && live.length ? live[Math.min(at, live.length - 1)] : null;
  const last = Boolean(live) && at >= live.length - 1;

  const close = useCallback((reason) => {
    const back = (returnRef.current && returnRef.current()) || before.current;
    if (back && back.isConnected && typeof back.focus === 'function') back.focus({ preventScroll: true });
    if (onCloseRef.current) onCloseRef.current(reason);
  }, []);

  const measure = useCallback(() => {
    if (!stop) return;
    const el = findTarget(stop.target);
    setView(viewport());
    if (!el) return;
    const r = el.getBoundingClientRect();
    // a fixed bar (the tab bar) gets no room around it: the room would show a strip of the path
    let fixed = false;
    try {
      fixed = window.getComputedStyle(el).position === 'fixed';
    } catch {
      fixed = false;
    }
    setBox({ top: r.top, left: r.left, width: r.width, height: r.height, pad: fixed ? 0 : PAD });
  }, [stop]);

  // each stop: bring a path target into view, measure it, and move focus to the bubble's title
  useLayoutEffect(() => {
    if (!stop) return;
    const el = findTarget(stop.target);
    if (el && stop.scroll) {
      const r = el.getBoundingClientRect();
      if (r.top < BAR_TOP || r.bottom > window.innerHeight - BAR_BOTTOM) {
        el.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
      }
    }
    measure();
    if (headRef.current) headRef.current.focus({ preventScroll: true });
  }, [stop, measure]);

  // the box follows the page: scroll (also a smooth scroll still running), resize, late layout
  useEffect(() => {
    if (!stop) return undefined;
    let raf = 0;
    const again = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(measure);
    };
    window.addEventListener('scroll', again, { passive: true, capture: true });
    window.addEventListener('resize', again);
    const late = window.setTimeout(measure, 450);
    return () => {
      window.removeEventListener('scroll', again, { capture: true });
      window.removeEventListener('resize', again);
      window.cancelAnimationFrame(raf);
      window.clearTimeout(late);
    };
  }, [stop, measure]);

  const next = useCallback(() => {
    if (last) close('done');
    else setAt((i) => i + 1);
  }, [last, close]);

  // Escape closes; Tab stays inside the bubble
  useEffect(() => {
    if (!stop) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close('skipped');
        return;
      }
      if (e.key !== 'Tab' || !bubbleRef.current) return;
      const items = [...bubbleRef.current.querySelectorAll('button:not([disabled])')];
      if (!items.length) return;
      const first = items[0];
      const end = items[items.length - 1];
      const inside = bubbleRef.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        end.focus();
      } else if (!e.shiftKey && (document.activeElement === end || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [stop, close]);

  if (!stop) return null;
  const { w: vw, h: vh } = view;
  const hole = box
    ? {
      x: Math.max(4, box.left - box.pad),
      y: Math.max(4, box.top - box.pad),
      r: Math.min(vw - 4, box.left + box.width + box.pad),
      b: Math.min(vh - 4, box.top + box.height + box.pad),
    }
    : null;
  const width = Math.min(352, vw - 2 * EDGE);
  const cx = hole ? (hole.x + hole.r) / 2 : vw / 2;
  const left = Math.max(EDGE, Math.min(vw - EDGE - width, cx - width / 2));
  // the bubble goes where there is more room: under the target, or above it
  const below = !hole || vh - hole.b >= hole.y;
  const place = !hole ? { top: Math.round(vh / 3) } : below ? { top: hole.b + GAP } : { bottom: vh - hole.y + GAP };
  const arrow = Math.max(24, Math.min(width - 24, cx - left));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dm-tour-label dm-tour-title"
      aria-describedby="dm-tour-text"
      className="fixed inset-0 z-[70]"
      data-course-tour
    >
      <span id="dm-tour-label" className="sr-only">{t('tour.label')}</span>
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`}>
        <path d={dimPath(vw, vh, hole)} fill={courseGame.text} fillOpacity="0.62" fillRule="evenodd" />
      </svg>
      {hole && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute rounded-[20px] ring-4 ring-white"
          style={{ left: hole.x, top: hole.y, width: hole.r - hole.x, height: hole.b - hole.y }}
        />
      )}
      <div
        ref={bubbleRef}
        key={stop.key}
        className="absolute rounded-[20px] border-2 border-b-4 border-game-line bg-white p-4 motion-safe:animate-pop-in"
        style={{ left, width, ...place }}
      >
        <span
          aria-hidden="true"
          className={`absolute h-4 w-4 -translate-x-1/2 rotate-45 rounded-[3px] bg-white ${
            below ? '-top-[9px] border-l-2 border-t-2 border-game-line' : '-bottom-[11px] border-b-4 border-r-2 border-game-line'
          }`}
          style={{ left: arrow }}
        />
        <div className="flex items-center justify-between gap-3">
          <Dots count={live.length} at={at} />
          <p className="text-[0.8125rem] font-black text-game-muted">{t('tour.stepOf', { n: at + 1, t: live.length })}</p>
        </div>
        <h2 ref={headRef} id="dm-tour-title" tabIndex={-1} className="mt-3 text-xl font-black leading-tight text-game-text outline-none">
          {stop.title}
        </h2>
        <p id="dm-tour-text" className="mt-1.5 text-base font-bold leading-snug text-game-muted">{stop.text}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          {last ? <span /> : (
            <button
              type="button"
              onClick={() => close('skipped')}
              className="-ml-2 min-h-11 rounded-xl px-3 text-base font-black text-game-muted hover:bg-course-wash hover:text-course-ink"
            >
              {t('tour.skip')}
            </button>
          )}
          <button
            type="button"
            onClick={next}
            className="min-h-12 rounded-clay bg-course px-6 text-[1.0625rem] font-black uppercase tracking-wide text-white shadow-course transition-transform duration-100 hover:brightness-105 active:translate-y-1 active:shadow-none"
          >
            {last ? t('tour.done') : t('tour.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
