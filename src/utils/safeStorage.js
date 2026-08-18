// Storage access that cannot throw.
//
// localStorage/sessionStorage throw a SecurityError when cookies are blocked
// (Safari private browsing, embedded webviews, strict enterprise policies).
// Unguarded access inside always-mounted components — TrialBanner renders on
// every route, ProgressProvider wraps the whole tree, ErrorBoundary is the
// last-resort handler — turned that into a blank error screen for the entire
// app. Every accessor here degrades to a no-op instead.

function pick(kind) {
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

export function safeGet(key, { session = false } = {}) {
  try {
    return pick(session ? 'session' : 'local')?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function safeSet(key, value, { session = false } = {}) {
  try {
    pick(session ? 'session' : 'local')?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemove(key, { session = false } = {}) {
  try {
    pick(session ? 'session' : 'local')?.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Read and JSON.parse in one step; returns `fallback` on missing or invalid data. */
export function safeGetJSON(key, fallback = null, opts) {
  const raw = safeGet(key, opts);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function safeSetJSON(key, value, opts) {
  try {
    return safeSet(key, JSON.stringify(value), opts);
  } catch {
    return false;
  }
}
