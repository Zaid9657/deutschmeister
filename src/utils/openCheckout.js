// Open a Lemon Squeezy checkout as reliably as possible.
//
// The app used `window.open(url, '_blank')`, which is the least reliable option
// available: iOS Safari blocks popups that aren't a direct user gesture in the
// same task, and in-app browsers (Instagram, Facebook, TikTok) swallow the new
// tab entirely. The app already detects in-app browsers elsewhere, so that
// traffic is known to exist — and a checkout that silently fails to appear is
// indistinguishable, to the customer, from a broken product.
//
// Order of preference:
//   1. LemonSqueezy.js overlay — stays in the current tab, no popup blocker.
//      lemon.js is already loaded on commerce routes by LemonSqueezyProvider.
//   2. Same-tab navigation — always works; the customer returns via the
//      checkout's redirect.
export function openCheckout(url) {
  if (!url) return false;

  try {
    const ls = typeof window !== 'undefined' ? window.LemonSqueezy : null;
    if (ls?.Url?.Open) {
      ls.Url.Open(url);
      return true;
    }
  } catch (err) {
    console.warn('LemonSqueezy overlay unavailable, navigating instead:', err?.message);
  }

  window.location.href = url;
  return true;
}
