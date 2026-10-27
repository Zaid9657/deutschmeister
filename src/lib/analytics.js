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
// The learner identify() was asked for while no PostHog existed yet: AuthContext
// identifies on INITIAL_SESSION, usually before the lazy import resolves, and a
// learner who signs in before accepting the banner is identified while there is
// no client at all. Dropping that call left both anonymous until the next auth
// event (about an hour later). Kept in memory only, applied right after init
// (which itself requires consent), cleared on sign-out and on withdrawal.
let pendingIdentity = null;

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
      if (!hasConsent()) return;
      posthog = mod.default;
      posthog.init(key, {
        api_host: host || 'https://us.i.posthog.com',
        // 'history_change', not true: posthog-js (1.376) records the SPA's
        // History-API route changes only for this value. `true` captured the
        // first page load alone, so the in-app path signup → onboarding →
        // lesson → /subscription never appeared as pageviews.
        capture_pageview: 'history_change',
        capture_pageleave: true,
      });
      initialized = true;
      // Every event carries the link that brought this visitor (first touch),
      // so PostHog funnels can be split by dm_source without a join.
      const a = getAttribution();
      if (a) {
        posthog.register({ dm_source: a.first.source, dm_medium: a.first.medium || null, dm_campaign: a.first.campaign || null });
      }
      const identity = pendingIdentity;
      pendingIdentity = null;
      if (identity && hasConsent()) posthog.identify(identity.userId, identity.traits);
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
  if (!initialized || !posthog) {
    // Not sent anywhere: initAnalytics applies it once consent has loaded PostHog.
    pendingIdentity = { userId, traits };
    return;
  }
  if (!hasConsent()) return;
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
      ...props,
    }));
  } catch {
    /* analytics must never break the app */
  }
}

export function track(event, props) {
  mirrorToGa(event, props);
  if (!hasConsent() || !initialized || !posthog) return;
  posthog.capture(event, props);
}

export function resetAnalytics() {
  pendingIdentity = null;
  if (!initialized || !posthog) return;
  posthog.reset();
}

export function withdrawAnalytics() {
  pendingIdentity = null;
  if (!initialized || !posthog) return;
  posthog.reset();
  posthog.opt_out_capturing?.();
}
