// Analytics for the static site — the Astro half of the funnel.
//
// Sends the funnel events in ../data/events.js to GA4 (gtag), which public/consent.js
// loads only after the visitor accepts analytics. Before consent, or with GA
// blocked, every call is a silent no-op: events are dropped, never queued.
// PostHog does NOT run on the static pages on purpose (its key belongs to the
// SPA bundle; see docs/SCORECARD.md #0), so GA4 is the one place both front
// ends' events meet (the SPA mirrors its own events there, src/lib/analytics.js).
//
// Declarative wiring, so a component never needs its own script to be measured:
//   data-track-view="<surface>"   → offer_viewed once, when ≥50% on screen (or, for an
//                                   element taller than two viewports, half the viewport)
//   data-track="<event>"          → that event on click (checkout_intent, course_selected…)
//   data-track-product / -level / -choice / -surface / -plan → copied into the props
// The registry decides what is allowed; anything else is dropped.
import { EVENTS, isFunnelEvent, onceKey, sanitizeProps } from '../data/events.js';

const sent = new Set();

function consented() {
  try {
    return window.localStorage.getItem('dm_cookie_consent') === 'accepted';
  } catch {
    return false;
  }
}

function attributionProps() {
  try {
    const a = JSON.parse(window.localStorage.getItem('dm_attribution') || 'null');
    const f = a && a.first;
    if (!f) return {};
    return { dm_source: f.source || undefined, dm_medium: f.medium || undefined, dm_campaign: f.campaign || undefined };
  } catch {
    return {};
  }
}

function signedIn() {
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      if (/^sb-.*-auth-token$/.test(window.localStorage.key(i) || '')) return true;
    }
  } catch {
    /* private mode */
  }
  return false;
}

/**
 * Send one funnel event. Returns true when it was handed to gtag — false when
 * it is unknown, already sent this page view (once-events), or not allowed yet.
 */
export function track(name, props = {}) {
  if (typeof window === 'undefined' || !isFunnelEvent(name)) return false;
  if (EVENTS[name].once) {
    const key = onceKey(name, props);
    if (sent.has(key)) return false;
    sent.add(key);
  }
  if (!consented() || typeof window.gtag !== 'function') return false;
  const payload = sanitizeProps({
    ...attributionProps(),
    entry_page: window.location.pathname,
    signed_in: signedIn(),
    ...props,
  });
  try {
    window.gtag('event', name, payload);
    return true;
  } catch {
    return false;
  }
}

/**
 * Is an observed element "at least half on screen" (events.js offer_viewed)?
 * An IntersectionObserver entry is `isIntersecting` at ANY ratio — the first
 * entry after observe() and every hidden-to-visible change arrive that way —
 * so a one-pixel sliver used to count as a full impression (2026-10-25). Half
 * of the element must show; an element taller than two viewports (the station
 * line) can never show half of itself, so for it half the viewport counts.
 */
export function halfOnScreen(entry) {
  if (!entry || !entry.isIntersecting) return false;
  if (entry.intersectionRatio >= 0.5) return true;
  const visible = entry.intersectionRect ? entry.intersectionRect.height : 0;
  const viewport = entry.rootBounds ? entry.rootBounds.height : 0;
  return viewport > 0 && visible >= viewport / 2;
}

/**
 * Thresholds that re-check an element as it scrolls, not only at 50 %. A
 * halving ladder: the observer calls back only when the visible ratio crosses
 * one of them, and an element H tall needs a crossing between V/(2H) and V/H
 * (V the viewport) to be judged once half a viewport of it shows — every
 * element up to sixteen viewports tall has one.
 */
export const VIEW_THRESHOLDS = [0, 1 / 32, 1 / 16, 1 / 8, 1 / 4, 1 / 2];

const propsFrom = (el) => ({
  surface: el.getAttribute('data-track-surface') || undefined,
  product: el.getAttribute('data-track-product') || el.getAttribute('data-course-key') || undefined,
  level: el.getAttribute('data-track-level') || undefined,
  choice: el.getAttribute('data-track-choice') || undefined,
  plan: el.getAttribute('data-track-plan') || undefined,
});

/** Wire every data-track / data-track-view element on the page. Idempotent. */
export function autoTrack(root = document) {
  root.querySelectorAll('[data-track]:not([data-track-wired])').forEach((el) => {
    el.setAttribute('data-track-wired', '');
    el.addEventListener('click', () => track(el.getAttribute('data-track'), propsFrom(el)));
  });
  const views = root.querySelectorAll('[data-track-view]:not([data-track-wired])');
  if (!views.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        // Not yet half on screen: keep observing, a later threshold re-checks it.
        if (!halfOnScreen(e)) continue;
        io.unobserve(e.target);
        track('offer_viewed', { ...propsFrom(e.target), surface: e.target.getAttribute('data-track-view') });
      }
    },
    { threshold: VIEW_THRESHOLDS },
  );
  views.forEach((el) => {
    el.setAttribute('data-track-wired', '');
    io.observe(el);
  });
}
