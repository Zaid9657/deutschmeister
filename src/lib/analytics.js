// PostHog is loaded lazily, only after the visitor accepts analytics cookies.
//
// It used to be a static import, which put ~191 KB (about half the entry chunk)
// into the first paint for every visitor — including the majority who never
// consent, for whom the library can never legally run. The consent gate itself
// was already correct; only the delivery was wrong.

import { getAttribution } from './attribution';
import { isFunnelEvent, sanitizeProps } from '../data/events';

const key = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST;

let posthog = null; // resolved module, once consent is given
let initialized = false;
let loading = null; // in-flight import, so concurrent callers share one fetch

/** The language the current screen is rendered in (<html lang>, set by src/lib/locale.js). */
function pageLocale() {
  try {
    const l = document.documentElement.getAttribute('lang');
    return l === 'en' || l === 'de' || l === 'ar' ? l : undefined;
  } catch {
    return undefined;
  }
}

// An explicit language switch is a product event; the super-property follows it.
if (typeof window !== 'undefined') {
  window.addEventListener('dm-locale-changed', (e) => {
    const d = (e && e.detail) || {};
    if (d.source !== 'explicit') return;
    if (initialized && posthog) posthog.register({ ui_locale: d.to });
    track('locale_changed', { ui_locale: d.to, locale_from: d.from, surface: d.surface || undefined });
  });
}

// Same consent flag the cookie banner (public/consent.js) writes for GA.
function hasConsent() {
  try {
    return window.localStorage.getItem('dm_cookie_consent') === 'accepted';
  } catch {
    return false;
  }
}

export async function initAnalytics() {
  if (typeof window === 'undefined' || !key) return;
  if (!hasConsent()) return;
  if (initialized) {
    posthog?.opt_in_capturing?.();
    return;
  }
  if (loading) return loading;

  loading = import('posthog-js')
    .then((mod) => {
      posthog = mod.default;
      posthog.init(key, {
        api_host: host || 'https://us.i.posthog.com',
        capture_pageview: true,
        capture_pageleave: true,
      });
      initialized = true;
      // Every event carries the link that brought this visitor (first touch),
      // so PostHog funnels can be split by dm_source without a join.
      const a = getAttribution();
      if (a) {
        posthog.register({ dm_source: a.first.source, dm_medium: a.first.medium || null, dm_campaign: a.first.campaign || null });
      }
      // The interface language as a product setting (en | de | ar), so funnels
      // can be compared by language. Never inferred from anything else and
      // never a proxy for nationality or origin (docs/arabic/measurement.md).
      posthog.register({ ui_locale: pageLocale() || null });
    })
    .catch((err) => {
      // Analytics must never break the app — a blocked or failed chunk is fine.
      console.warn('Analytics unavailable:', err?.message);
    })
    .finally(() => {
      loading = null;
    });

  return loading;
}

export function identify(userId, traits) {
  if (!initialized || !posthog) return;
  posthog.identify(userId, traits);
}

// The funnel events (src/data/events.js) also go to GA4, the one tool both
// front ends share: the static pages have no PostHog, so without this mirror a
// visitor who starts on /pricing/ and finishes in the app is two half-funnels.
// GA4 only exists after consent (public/consent.js injects it on Accept), and
// only registry events with sanitised props are sent.
function mirrorToGa(event, props) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  if (!hasConsent() || !isFunnelEvent(event)) return;
  try {
    const a = getAttribution();
    window.gtag('event', event, sanitizeProps({
      dm_source: a?.first?.source || undefined,
      dm_medium: a?.first?.medium || undefined,
      dm_campaign: a?.first?.campaign || undefined,
      entry_page: window.location.pathname,
      ui_locale: pageLocale(),
      ...props,
    }));
  } catch {
    /* analytics must never break the app */
  }
}

export function track(event, props) {
  mirrorToGa(event, props);
  if (!initialized || !posthog) return;
  posthog.capture(event, props);
}

export function resetAnalytics() {
  if (!initialized || !posthog) return;
  posthog.reset();
}

export function withdrawAnalytics() {
  if (!initialized || !posthog) return;
  posthog.reset();
  posthog.opt_out_capturing?.();
}
