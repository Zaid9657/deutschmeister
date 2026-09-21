// PostHog is loaded lazily, only after the visitor accepts analytics cookies.
//
// It used to be a static import, which put ~191 KB (about half the entry chunk)
// into the first paint for every visitor — including the majority who never
// consent, for whom the library can never legally run. The consent gate itself
// was already correct; only the delivery was wrong.

import { getAttribution } from './attribution';

const key = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST;

let posthog = null; // resolved module, once consent is given
let initialized = false;
let loading = null; // in-flight import, so concurrent callers share one fetch

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

export function track(event, props) {
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
