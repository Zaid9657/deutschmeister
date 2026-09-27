// Sentence X-Ray — the visitor-side helpers, kept free of React and of
// extensionless imports so tests/xray.test.mjs can pin them under node --test.
//
// WHY THIS FILE EXISTS (measured 2026-09-27, docs/SCORECARD.md work order #3).
// Anonymous analyses jumped from 5–13/day to 150–350/day on 2026-09-14, with
// one anonymous id per analysis and no rise in signups. It was not a reset bug:
// 3,314 of 3,372 anonymous analyses in 14 days were verbatim our own
// grammar_examples (911 of the 913), and there were ZERO such rows before
// 2026-09-14 — the day every grammar example grew an "Examine this sentence in
// Sentence X-Ray" link to /analyze/?s=…. A JS-rendering crawler walks those
// ~900 links; every render starts with empty storage, so it mints a fresh id,
// and the ?s= auto-analysis fires a paid model call. Hence: never auto-run for
// a crawler (here), refuse crawler user agents server-side
// (netlify/functions/_shared/xraySource.mjs), and send a coarse source so the
// next spike is attributable without guesswork.
import { FREE_LEVELS } from '../config/freeTier.js';

export const ANON_ID_KEY = 'dm_xray_anon_id';

// Per-tab fallback when storage is blocked (Safari with cookies off, some
// in-app webviews). The old fallback was the literal 'unknown' — 7 characters,
// which the function's identity gate (>= 8) rejects with a 400, so those
// visitors could never analyse anything.
let memoryAnonId = null;

const newId = () => {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch { /* fall through */ }
  return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};

const defaultStorage = () => {
  try { return globalThis.localStorage ?? null; } catch { return null; }
};

/**
 * The anonymous X-Ray identity: created once, then read back from
 * localStorage on every later call and visit, so the 1/day anonymous limit
 * meters a browser rather than a page load.
 */
export function getOrCreateAnonId(storage = defaultStorage()) {
  try {
    if (!storage) throw new Error('no storage');
    let id = storage.getItem(ANON_ID_KEY);
    if (!id) {
      id = newId();
      storage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    if (!memoryAnonId) memoryAnonId = newId();
    return memoryAnonId;
  }
}

// Self-declared crawlers and headless renderers. SYNCED COPY of CRAWLER_UA in
// netlify/functions/_shared/xraySource.mjs (the server is the enforcement;
// this copy only saves the round trip) — tests/xray.test.mjs fails on drift.
// No lookbehind: a regex literal older Safari cannot parse would take the
// whole chunk down with it.
export const CRAWLER_UA = /bot\b|crawl|spider|slurp|headless|lighthouse|inspectiontool|siteaudit|externalhit/i;

/** true for a crawler user agent. "Cubot" is a phone brand, not a bot. */
export const isCrawlerUA = (ua) => typeof ua === 'string' && CRAWLER_UA.test(ua.replace(/cubot/gi, ''));

/** A crawler, or a browser driven by automation (navigator.webdriver). */
export function isLikelyCrawler(nav = globalThis.navigator) {
  if (!nav) return false;
  return nav.webdriver === true || isCrawlerUA(nav.userAgent);
}

const OWN_HOST = /(^|\.)deutsch-meister\.de$|^localhost$|^127\.0\.0\.1$|netlify\.app$/;
const LABEL = /[^a-z0-9._:/-]+/g;
const label = (v) => {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase().replace(LABEL, '').slice(0, 60);
  return s || null;
};

/**
 * Where the visitor came from, coarse enough to hold no PII: 'none' (typed,
 * bookmarked, an email client, a stripped referrer), the external host
 * ('google.com'), or our own page family ('site:/grammar') — never a full
 * URL, never a query string.
 */
export function referrerLabel(referrer) {
  if (!referrer) return 'none';
  let url;
  try { url = new URL(referrer); } catch { return 'none'; }
  const host = url.hostname.toLowerCase();
  if (OWN_HOST.test(host)) {
    const segment = url.pathname.split('/').filter(Boolean)[0] || '';
    return label(`site:/${segment}`);
  }
  return label(host.replace(/^www\./, ''));
}

/**
 * The coarse source the SPA sends with each analysis request.
 * @param {object} args
 * @param {string} [args.referrer]     document.referrer
 * @param {{first?: {source?: string}, last?: {source?: string}}|null} [args.attribution]  getAttribution()
 * @param {'link'|'example'|'typed'} [args.entry]  how this analysis started
 */
export function xraySource({ referrer = '', attribution = null, entry = 'typed' } = {}) {
  return {
    ref: referrerLabel(referrer),
    first: label(attribution?.first?.source),
    last: label(attribution?.last?.source),
    entry: ['link', 'example', 'typed'].includes(entry) ? entry : 'typed',
  };
}

// The conversion offer under a result (and at the anonymous daily limit).
// `ref=xray` is what public/attribution.js records; utm_medium keeps the
// on-site hop from being filed under the 'social' default the bare ?ref= form
// gets. Rendered as plain <a href>, NOT a router <Link>: attribution.js only
// runs on a page load, so a client-side navigation would drop the ref.
// First touch is never overwritten, so a visitor who arrived from Google keeps
// google as acquisition_source and gets xray as acquisition_last_source.
const XRAY_REF = 'ref=xray&utm_medium=onsite';
export const XRAY_OFFER = {
  signupHref: `/signup?${XRAY_REF}`,
  courseHref: `/course/${FREE_LEVELS[0]}?${XRAY_REF}`,
};
