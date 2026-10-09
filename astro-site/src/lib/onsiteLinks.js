// On-site attribution for the signup doors on the static pages (2026-09-27).
//
// public/attribution.js records a `?ref=` only on a page LOAD, and a visitor
// who came straight in (no referrer, no tag) has no touch at all. So a signup
// that started on a grammar lesson or a Leitfaden reached
// profiles.acquisition_* as NULL ("untracked"), and the page that converted it
// was invisible: since tracking began on 2026-09-20, 20 of 35 signups carry no
// source and none can be traced to a grammar page or a guide.
//
// These links carry the page with them, in the shape the X-Ray offer already
// uses (src/lib/xray.js):
//   ref=<surface>       the on-site surface (grammar, leitfaden)
//   utm_medium=onsite   keeps it out of the `social` default a bare ?ref= gets
//   utm_content=<slug>  which lesson or guide (or `nav`, `index`)
// First touch is never overwritten, so a visitor from Google keeps `google` as
// acquisition_source and gets the surface as acquisition_last_source. A direct
// visitor's first touch becomes the surface — read it as "untracked arrival,
// converted on this page", never as a channel (docs/tracking-links.md).
//
// Render these as plain <a href>: attribution.js runs on a page load, so a
// client-side router navigation would drop the tag.

import { FREE_LEVEL_LABEL } from '../data/marketing.js';

export const ONSITE_MEDIUM = 'onsite';

// The surfaces this module may name. `xray` lives in the SPA (src/lib/xray.js).
export const ONSITE_SOURCES = Object.freeze(['grammar', 'leitfaden']);

// Destinations, spelled per the three trailing-slash cases in CLAUDE.md:
// /signup and /course/<level> are rewrite-served SPA routes (no slash),
// /level-test/ is a prerendered SPA route (slash), /pricing/ is an Astro page
// (slash). A wrong spelling 301-hops, and the redirect drops nothing but costs
// a round trip on the one click that matters.
export const DOORS = Object.freeze({
  signup: '/signup',
  freeCourse: `/course/${FREE_LEVEL_LABEL.toLowerCase()}`,
  levelTest: '/level-test/',
  pricing: '/pricing/',
});

/**
 * An attributed on-site link.
 * @param {keyof DOORS} door
 * @param {'grammar'|'leitfaden'} source
 * @param {string} [content]  the lesson/guide slug, or a placement label
 */
export function onsiteHref(door, source, content) {
  const path = DOORS[door];
  if (!path) throw new Error(`onsiteHref: unknown door "${door}"`);
  if (!ONSITE_SOURCES.includes(source)) throw new Error(`onsiteHref: unknown source "${source}"`);
  const params = new URLSearchParams({ ref: source, utm_medium: ONSITE_MEDIUM });
  if (content) params.set('utm_content', String(content).toLowerCase());
  return `${path}?${params}`;
}

/** The surface a page belongs to, from its path — null outside grammar and the guides. */
export function surfaceForPath(pathname = '') {
  if (/^\/grammar(\/|$)/.test(pathname)) return 'grammar';
  if (/^\/leitfaden(\/|$)/.test(pathname)) return 'leitfaden';
  return null;
}
