import posthog from 'posthog-js';

const key = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST;

let initialized = false;

// Same consent flag the cookie banner (public/consent.js) writes for GA —
// PostHog must not start before the visitor accepts analytics cookies.
function hasConsent() {
  try {
    return window.localStorage.getItem('dm_cookie_consent') === 'accepted';
  } catch {
    return false;
  }
}

export function initAnalytics() {
  if (typeof window === 'undefined' || !key || initialized) return;
  if (!hasConsent()) return;
  posthog.init(key, {
    api_host: host || 'https://us.i.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
  });
  initialized = true;
}

export function identify(userId, traits) {
  if (!initialized) return;
  posthog.identify(userId, traits);
}

export function track(event, props) {
  if (!initialized) return;
  posthog.capture(event, props);
}

export function resetAnalytics() {
  if (!initialized) return;
  posthog.reset();
}
