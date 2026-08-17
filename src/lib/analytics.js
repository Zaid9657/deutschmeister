// PostHog is loaded lazily, only after the visitor accepts analytics cookies.
//
// It used to be a static import, which put ~191 KB (about half the entry chunk)
// into the first paint for every visitor — including the majority who never
// consent, for whom the library can never legally run. The consent gate itself
// was already correct; only the delivery was wrong.

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
  if (typeof window === 'undefined' || !key || initialized) return;
  if (!hasConsent()) return;
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
