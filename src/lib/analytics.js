import posthog from 'posthog-js';

const key = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST;

let initialized = false;

export function initAnalytics() {
  if (typeof window === 'undefined' || !key || initialized) return;
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
