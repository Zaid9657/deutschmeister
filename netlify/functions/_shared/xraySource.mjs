// Sentence X-Ray — who is calling, coarsely, without PII.
//
// Measured 2026-09-27: 98% of the anonymous analyses since 2026-09-14 were our
// own grammar examples, fetched by a JS-rendering crawler walking the
// "Examine this sentence in Sentence X-Ray" links (/analyze/?s=…) — a fresh
// anonymous id and a paid model call per render. See src/lib/xray.js for the
// numbers. Two things live here: the crawler test the function enforces, and
// the sanitiser for the coarse source the SPA reports, so the next spike can
// be attributed from the logs and xray_usage.source instead of guessed at.

// SYNCED COPY of CRAWLER_UA in src/lib/xray.js — tests/xray.test.mjs fails on
// drift. Self-declared crawlers and headless renderers only: a stealth scraper
// is still bounded by the per-IP ceiling in analyze-sentence.mjs.
export const CRAWLER_UA = /bot\b|crawl|spider|slurp|headless|lighthouse|inspectiontool|siteaudit|externalhit/i;

/** true for a crawler user agent. "Cubot" is a phone brand, not a bot. */
export const isCrawlerUA = (ua) => typeof ua === 'string' && CRAWLER_UA.test(ua.replace(/cubot/gi, ''));

/**
 * One coarse word for the caller: 'crawler' (refused for anonymous use),
 * 'browser' (a Mozilla-family UA), 'script' (curl, python, node — bypassing the
 * SPA) or 'none'. The user agent itself is never stored.
 */
export function uaClass(ua) {
  if (typeof ua !== 'string' || !ua.trim()) return 'none';
  if (isCrawlerUA(ua)) return 'crawler';
  if (/^mozilla\//i.test(ua.trim())) return 'browser';
  return 'script';
}

const LABEL = /^[a-z0-9._:/-]{1,60}$/;
const clean = (v) => {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  return LABEL.test(s) ? s : null;
};
const ENTRIES = new Set(['link', 'example', 'typed']);

/**
 * The client-reported source, re-validated — never trusted as sent. Returns
 * { ref, first, last, entry } with every field a short label or null, or null
 * when nothing usable was sent.
 */
export function cleanSource(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out = {
    ref: clean(raw.ref),
    first: clean(raw.first),
    last: clean(raw.last),
    entry: ENTRIES.has(raw.entry) ? raw.entry : null,
  };
  return Object.values(out).some(Boolean) ? out : null;
}
