// The level lock's signup door, tagged as an on-site door
// (docs/tracking-links.md, "On-site doors").
//
// The signed-out level lock (LockedContentOverlay, which LevelSubscriptionGuard
// renders on every level that is not free) is the SPA's one signed-out paywall
// with a signup button. Until 2026-10-08 that button was a router <Link> to a
// bare /signup. public/attribution.js records a tag only on a page load, so a
// signup that started at the lock was filed under whatever had brought the
// visitor, or as untracked, and the lock's own signups could not be counted:
// the three lock changes of 2026-10-01..07 (#175, #179, #197) had to be guarded
// on all signups a day instead.
//
// The door now carries `ref=level-lock` and `utm_medium=onsite`, plus the
// locked level as `utm_content`, the way the X-Ray, level-test and
// save-progress doors do. A first touch is never overwritten, so a visitor who
// arrived from Google keeps google in acquisition_source and gets level-lock in
// acquisition_last_source. It must be a plain href, NOT a router <Link>, or the
// tag is dropped. /signup is a rewrite-served SPA route, so no trailing slash
// (CLAUDE.md case 3). tests/lock-signup-door.test.mjs.
import { LEVEL_ORDER } from '../config/levels.js';

/** What a signup from the level lock shows in profiles.acquisition_last_source. */
export const LEVEL_LOCK_REF = 'level-lock';

/** The lock's signup href for the locked `level` ('b1.1'); an unknown level is left out of the tag. */
export function levelLockSignupHref(level) {
  const params = new URLSearchParams({ ref: LEVEL_LOCK_REF, utm_medium: 'onsite' });
  const lv = String(level ?? '').trim().toLowerCase();
  if (LEVEL_ORDER.includes(lv.toUpperCase())) params.set('utm_content', lv);
  return `/signup?${params}`;
}
